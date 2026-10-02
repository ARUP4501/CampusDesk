import { Router, Request, Response } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, requireRoles } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { createNotification } from "../services/push.service.js";
import { CreateParcelSchema, VerifyParcelPickupSchema } from "../shared/schemas.js";

export const parcelRouter = Router();

// 1. List parcels (Students see their own; Staff/Warden/Admin see all)
parcelRouter.get("/", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const isStudent = req.user!.role === "STUDENT";
    const { status } = req.query;

    const whereClause: any = {};
    if (isStudent) {
      whereClause.studentId = req.user!.id;
    }
    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    const parcels = await prisma.parcel.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            rollNumber: true,
            phone: true,
            hostelBlock: true,
            roomNumber: true
          }
        }
      },
      orderBy: { receivedAt: "desc" }
    });

    res.json({ parcels });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch parcels." });
  }
});

// 2. Receive & Log Inward Parcel (Guard / Staff / Warden)
parcelRouter.post(
  "/",
  requireAuth,
  requireRoles(["STAFF", "WARDEN", "ADMIN"]),
  validateBody(CreateParcelSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { studentRollNumber, courierService, trackingNumber, securityLocation, notes } = req.body;

      const student = await prisma.user.findFirst({
        where: {
          OR: [
            { rollNumber: studentRollNumber },
            { id: studentRollNumber },
            { email: studentRollNumber }
          ]
        }
      });

      if (!student) {
        res.status(404).json({ error: `Student with roll number "${studentRollNumber}" not found.` });
        return;
      }

      const totalParcels = await prisma.parcel.count();
      const parcelNumber = `PCL-${7000 + totalParcels + 1}`;
      // Generate a secure 4-digit pickup OTP
      const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

      const parcel = await prisma.parcel.create({
        data: {
          parcelNumber,
          studentId: student.id,
          courierService,
          trackingNumber: trackingNumber || undefined,
          securityLocation: securityLocation || "Main Gate Security Desk",
          otpCode,
          notes: notes || undefined,
          status: "RECEIVED"
        },
        include: {
          student: {
            select: { id: true, fullName: true, rollNumber: true, phone: true }
          }
        }
      });

      // Notify student with the OTP for collection
      await createNotification(
        student.id,
        `📦 Package Received: ${courierService}`,
        `Your parcel #${parcelNumber} (${courierService}) has arrived at ${securityLocation}. Show OTP: ${otpCode} at the desk to collect.`,
        "PARCEL",
        `/parcels`
      );

      res.status(201).json({
        message: `Parcel registered for ${student.fullName}. Notification sent with OTP.`,
        parcel
      });
    } catch (err: any) {
      console.error("Failed to register parcel:", err);
      res.status(500).json({ error: "Failed to register parcel." });
    }
  }
);

// 3. Verify OTP & Mark Parcel Collected (Guard / Staff / Warden)
parcelRouter.post(
  "/:id/collect",
  requireAuth,
  requireRoles(["STAFF", "WARDEN", "ADMIN"]),
  validateBody(VerifyParcelPickupSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { otpCode, verifiedByGuard } = req.body;

      const parcel = await prisma.parcel.findUnique({
        where: { id },
        include: { student: true }
      });

      if (!parcel) {
        res.status(404).json({ error: "Parcel record not found." });
        return;
      }

      if (parcel.status === "COLLECTED") {
        res.status(400).json({ error: "Parcel has already been collected." });
        return;
      }

      if (parcel.otpCode !== otpCode.trim()) {
        res.status(400).json({ error: "Invalid Pickup OTP code. Verification failed." });
        return;
      }

      const updated = await prisma.parcel.update({
        where: { id },
        data: {
          status: "COLLECTED",
          collectedAt: new Date(),
          verifiedByGuard: verifiedByGuard || req.user!.fullName
        }
      });

      await createNotification(
        parcel.studentId,
        `Package Collected: #${parcel.parcelNumber}`,
        `Your parcel from ${parcel.courierService} was marked collected by ${verifiedByGuard || req.user!.fullName}.`,
        "PARCEL",
        `/parcels`
      );

      res.json({
        message: `Parcel #${parcel.parcelNumber} handed over to student successfully.`,
        parcel: updated
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to verify parcel pickup." });
    }
  }
);
