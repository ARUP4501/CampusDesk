import { Router, Request, Response } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, requireRoles } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { createNotification } from "../services/push.service.js";
import { CreateEmergencySchema, UpdateEmergencyStatusSchema } from "../shared/schemas.js";

export const emergencyRouter = Router();

// =========================================================================
// 1. TRIGGER SOS EMERGENCY (Students - Hosteller & Day Scholar)
// =========================================================================
emergencyRouter.post(
  "/",
  requireAuth,
  validateBody(CreateEmergencySchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { category, location, coordinates, description } = req.body;
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id }
      });

      if (!user) {
        res.status(404).json({ error: "User not found." });
        return;
      }

      // Anti-spam cooldown check (30 seconds)
      const recentAlert = await prisma.emergency.findFirst({
        where: {
          studentId: req.user!.id,
          status: { in: ["ACTIVE", "NEW", "ACKNOWLEDGED"] },
          createdAt: { gte: new Date(Date.now() - 30 * 1000) }
        }
      });

      if (recentAlert) {
        res.status(429).json({
          error: "An emergency alert is already active. Please wait 30 seconds before sending another alert.",
          activeAlertId: recentAlert.id
        });
        return;
      }

      const isHosteller = user.livingType === "HOSTELLER";
      const emergencyContact = user.guardianPhone || user.fatherPhone || user.motherPhone || user.phone;

      // Auto-attach profile location context if student hasn't entered custom location
      let finalLocation = location;
      if (!finalLocation || finalLocation.trim() === "") {
        if (isHosteller) {
          finalLocation = `${user.hostelBlock || "Hostel Block"}, Room ${user.roomNumber || "N/A"}${user.bedNumber ? ` (${user.bedNumber})` : ""}`;
        } else {
          finalLocation = user.currentAddress || `Day Scholar Campus Area (${user.department || "Academic Block"})`;
        }
      }

      const totalAlerts = await prisma.emergency.count();
      const alertNumber = `SOS-${8000 + totalAlerts + 1}`;

      const emergency = await prisma.emergency.create({
        data: {
          alertNumber,
          studentId: req.user!.id,
          studentType: user.livingType,
          category,
          location: finalLocation,
          emergencyContact,
          coordinates: coordinates || undefined,
          description: description || undefined,
          status: "ACTIVE"
        },
        include: {
          student: {
            select: {
              id: true,
              fullName: true,
              rollNumber: true,
              phone: true,
              livingType: true,
              hostelBlock: true,
              roomNumber: true,
              bedNumber: true,
              currentAddress: true,
              permanentAddress: true,
              guardianName: true,
              guardianPhone: true,
              fatherName: true,
              fatherPhone: true,
              bloodGroup: true
            }
          }
        }
      });

      // Target relevant responders:
      // Hosteller -> Student's assigned Warden + Admin
      // Day Scholar -> Admin & Campus Security
      let targetResponders: { id: string }[] = [];

      if (isHosteller && user.hostelBlock) {
        const assignedWarden = await prisma.user.findFirst({
          where: { role: "WARDEN", hostelBlock: user.hostelBlock, isActive: true }
        });
        const admins = await prisma.user.findMany({
          where: { role: "ADMIN", isActive: true },
          select: { id: true }
        });

        targetResponders = admins;
        if (assignedWarden) {
          targetResponders.push({ id: assignedWarden.id });
        } else {
          // Fallback to all wardens
          const allWardens = await prisma.user.findMany({
            where: { role: "WARDEN", isActive: true },
            select: { id: true }
          });
          targetResponders.push(...allWardens);
        }
      } else {
        // Day Scholar: Administrators & Security staff
        targetResponders = await prisma.user.findMany({
          where: { role: { in: ["ADMIN", "STAFF"] }, isActive: true },
          select: { id: true }
        });
      }

      // Deduplicate responder IDs
      const uniqueResponderIds = Array.from(new Set(targetResponders.map((r) => r.id)));

      for (const responderId of uniqueResponderIds) {
        await createNotification(
          responderId,
          `🚨 URGENT SOS: ${category} (${isHosteller ? "Hosteller" : "Day Scholar"})`,
          `${emergency.student.fullName} (${emergency.student.phone}) at ${finalLocation}. Emergency Contact: ${emergencyContact}.`,
          "EMERGENCY",
          `/admin?tab=emergencies`
        );
      }

      res.status(201).json({
        message: "Emergency SOS dispatched to campus security and warden command center.",
        emergency
      });
    } catch (err: any) {
      console.error("SOS Emergency dispatch failed:", err);
      res.status(500).json({ error: "Failed to dispatch SOS alert to command center." });
    }
  }
);

// =========================================================================
// 2. GET CURRENT ACTIVE SOS (For Student's Dashboard Beacon)
// =========================================================================
emergencyRouter.get("/my-active", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const activeEmergency = await prisma.emergency.findFirst({
      where: {
        studentId: req.user!.id,
        status: { in: ["ACTIVE", "NEW", "ACKNOWLEDGED"] }
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            rollNumber: true,
            phone: true,
            livingType: true,
            hostelBlock: true,
            roomNumber: true,
            guardianPhone: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json({ emergency: activeEmergency, activeEmergency });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to check active emergency status." });
  }
});

// =========================================================================
// 3. LIST ALL SOS EMERGENCIES (Role-governed)
// =========================================================================
emergencyRouter.get("/", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const isStudent = req.user!.role === "STUDENT";
    const isWarden = req.user!.role === "WARDEN";
    const whereClause: any = {};

    if (isStudent) {
      whereClause.studentId = req.user!.id;
    } else if (isWarden && req.user!.hostelBlock) {
      // Warden primarily oversees their hostel block, plus day scholar campus emergencies
      whereClause.OR = [
        { student: { hostelBlock: req.user!.hostelBlock } },
        { studentType: "DAY_SCHOLAR" }
      ];
    }

    const { status, category, studentType, hostelBlock } = req.query;

    if (status && status !== "ALL") {
      if (status === "ACTIVE") {
        whereClause.status = { in: ["ACTIVE", "NEW"] };
      } else {
        whereClause.status = status;
      }
    }

    if (category && category !== "ALL") {
      whereClause.category = category;
    }

    if (studentType && studentType !== "ALL") {
      whereClause.studentType = studentType;
    }

    if (hostelBlock && hostelBlock !== "ALL") {
      whereClause.student = { ...(whereClause.student || {}), hostelBlock };
    }

    const emergencies = await prisma.emergency.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            rollNumber: true,
            phone: true,
            livingType: true,
            hostelBlock: true,
            roomNumber: true,
            bedNumber: true,
            currentAddress: true,
            permanentAddress: true,
            guardianPhone: true,
            guardianName: true,
            fatherPhone: true,
            bloodGroup: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json({ emergencies });
  } catch (err: any) {
    console.error("Failed to load emergencies:", err);
    res.status(500).json({ error: "Failed to load emergencies." });
  }
});

// =========================================================================
// 4. UPDATE SOS EMERGENCY STATUS (Warden / Admin / Staff Only)
// =========================================================================
emergencyRouter.patch(
  "/:id/status",
  requireAuth,
  requireRoles(["WARDEN", "ADMIN", "STAFF"]),
  validateBody(UpdateEmergencyStatusSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, responderNotes } = req.body;

      const emergency = await prisma.emergency.findUnique({
        where: { id },
        include: { student: true }
      });

      if (!emergency) {
        res.status(404).json({ error: "Emergency record not found." });
        return;
      }

      const updateData: any = {
        status,
        responderNotes: responderNotes || emergency.responderNotes
      };

      if (status === "ACKNOWLEDGED") {
        updateData.acknowledgedById = req.user!.id;
        updateData.acknowledgedAt = new Date();
      } else if (status === "RESOLVED") {
        updateData.resolvedById = req.user!.id;
        updateData.resolvedAt = new Date();
      }

      const updated = await prisma.emergency.update({
        where: { id },
        data: updateData,
        include: {
          student: {
            select: {
              id: true,
              fullName: true,
              rollNumber: true,
              phone: true
            }
          }
        }
      });

      // Notify student in real-time regarding response action
      await createNotification(
        emergency.studentId,
        `Emergency Alert ${status}`,
        `Your SOS alert has been marked as ${status} by ${req.user!.fullName}.${responderNotes ? ` Note: "${responderNotes}"` : ""}`,
        "EMERGENCY",
        `/dashboard`
      );

      res.json({
        message: `Emergency status updated to ${status}.`,
        emergency: updated
      });
    } catch (err: any) {
      console.error("Failed to update emergency status:", err);
      res.status(500).json({ error: "Failed to update emergency status." });
    }
  }
);
