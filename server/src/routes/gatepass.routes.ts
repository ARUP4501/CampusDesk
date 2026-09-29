import { Router, Request, Response } from "express";
import QRCode from "qrcode";
import { prisma } from "../prisma.js";
import { requireAuth, requireRoles } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { createNotification } from "../services/push.service.js";
import { CreateGatePassSchema, ReviewGatePassSchema, GatePassActionSchema } from "../shared/schemas.js";

export const gatePassRouter = Router();

// Create new gate pass / leave request (Student)
gatePassRouter.post(
  "/",
  requireAuth,
  validateBody(CreateGatePassSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { type, departureDate, expectedReturnDate, destination, reason, parentContact } = req.body;

      const depDate = new Date(departureDate);
      const retDate = new Date(expectedReturnDate);

      if (retDate <= depDate) {
        res.status(400).json({ error: "Expected return time must be after departure time." });
        return;
      }

      const totalPasses = await prisma.gatePass.count();
      const passNumber = `GP-${5000 + totalPasses + 1}`;

      const gatePass = await prisma.gatePass.create({
        data: {
          passNumber,
          studentId: req.user!.id,
          type: type as any,
          departureDate: depDate,
          expectedReturnDate: retDate,
          destination,
          reason,
          parentContact,
          status: "PENDING"
        }
      });

      // Notify wardens
      const wardens = await prisma.user.findMany({ where: { role: "WARDEN" } });
      for (const w of wardens) {
        await createNotification(
          w.id,
          `New Gate Pass Request: #${passNumber}`,
          `${req.user!.fullName} requested ${type} to ${destination}.`,
          "GATEPASS",
          `/gatepass/${gatePass.id}`
        );
      }

      res.status(201).json({ message: "Gate pass request submitted.", gatePass });
    } catch (err: any) {
      console.error("Error creating gate pass:", err);
      res.status(500).json({ error: "Failed to create gate pass request." });
    }
  }
);

// List gate passes
gatePassRouter.get("/", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, type, search } = req.query;
    const isStudent = req.user!.role === "STUDENT";

    const whereClause: any = {};
    if (isStudent) {
      whereClause.studentId = req.user!.id;
    }

    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    if (type && type !== "ALL") {
      whereClause.type = type;
    }

    if (search) {
      const s = String(search).trim();
      whereClause.OR = [
        { passNumber: { contains: s } },
        { destination: { contains: s } },
        { student: { fullName: { contains: s } } },
        { student: { rollNumber: { contains: s } } }
      ];
    }

    const passes = await prisma.gatePass.findMany({
      where: whereClause,
      include: {
        student: { select: { id: true, fullName: true, rollNumber: true, phone: true, hostelBlock: true, roomNumber: true } },
        approvedBy: { select: { id: true, fullName: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json({ passes });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to list gate passes." });
  }
});

// Get single gate pass with QR code
gatePassRouter.get("/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const gatePass = await prisma.gatePass.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, fullName: true, rollNumber: true, phone: true, hostelBlock: true, roomNumber: true } },
        approvedBy: { select: { id: true, fullName: true } }
      }
    });

    if (!gatePass) {
      res.status(404).json({ error: "Gate pass not found." });
      return;
    }

    if (req.user!.role === "STUDENT" && gatePass.studentId !== req.user!.id) {
      res.status(403).json({ error: "Unauthorized access." });
      return;
    }

    // Generate QR code data URL if approved
    let qrDataUrl = null;
    if (gatePass.status === "APPROVED" || gatePass.status === "EXITED") {
      const qrPayload = JSON.stringify({
        passNumber: gatePass.passNumber,
        studentRoll: gatePass.student.rollNumber,
        status: gatePass.status,
        validUntil: gatePass.expectedReturnDate
      });
      qrDataUrl = await QRCode.toDataURL(qrPayload, { width: 256, margin: 1 });
    }

    res.json({ gatePass, qrDataUrl });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to retrieve gate pass." });
  }
});

// Warden review: Approve or reject
gatePassRouter.patch(
  "/:id/review",
  requireAuth,
  requireRoles(["WARDEN", "ADMIN"]),
  validateBody(ReviewGatePassSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, wardenComment } = req.body;

      const gatePass = await prisma.gatePass.findUnique({
        where: { id },
        include: { student: true }
      });

      if (!gatePass) {
        res.status(404).json({ error: "Gate pass not found." });
        return;
      }

      // Generate QR payload string for pass record
      const qrPayload = JSON.stringify({
        passNumber: gatePass.passNumber,
        rollNumber: gatePass.student.rollNumber,
        validUntil: gatePass.expectedReturnDate
      });

      const updated = await prisma.gatePass.update({
        where: { id },
        data: {
          status: status as any,
          approvedById: req.user!.id,
          wardenComment: wardenComment || null,
          qrCodeData: status === "APPROVED" ? qrPayload : null
        }
      });

      // Notify student
      await createNotification(
        gatePass.studentId,
        `Gate Pass #${gatePass.passNumber} ${status}`,
        `Your ${gatePass.type} request was ${status.toLowerCase()} by the Warden.${wardenComment ? ` Note: "${wardenComment}"` : ""}`,
        "GATEPASS",
        `/gatepass/${gatePass.id}`
      );

      res.json({ message: `Gate pass ${status.toLowerCase()} successfully.`, gatePass: updated });
    } catch (err: any) {
      console.error("Error reviewing gate pass:", err);
      res.status(500).json({ error: "Failed to update gate pass status." });
    }
  }
);

// Gate Log: Guard scans QR or enters pass number to record exit or entry
gatePassRouter.post(
  "/gate-log/record",
  requireAuth,
  requireRoles(["STAFF", "WARDEN", "ADMIN"]),
  validateBody(GatePassActionSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { action, securityNotes, guardName } = req.body;
      const passIdentifier = req.body.passIdentifier?.trim();

      if (!passIdentifier) {
        res.status(400).json({ error: "Pass Number or QR content is required." });
        return;
      }

      // Extract pass number from raw input or parsed QR JSON
      let passNumber = passIdentifier;
      try {
        const parsed = JSON.parse(passIdentifier);
        if (parsed.passNumber) passNumber = parsed.passNumber;
      } catch {
        // Plain pass number string
      }

      const gatePass = await prisma.gatePass.findFirst({
        where: {
          OR: [
            { passNumber: { equals: passNumber, mode: "insensitive" } },
            { id: passNumber }
          ]
        },
        include: { student: true }
      });

      if (!gatePass) {
        res.status(404).json({ error: `No gate pass found with identifier "${passNumber}".` });
        return;
      }

      const now = new Date();

      if (action === "EXIT") {
        if (gatePass.status !== "APPROVED") {
          res.status(400).json({
            error: `Cannot record exit. Pass status is ${gatePass.status} (must be APPROVED).`
          });
          return;
        }

        const updated = await prisma.gatePass.update({
          where: { id: gatePass.id },
          data: {
            status: "EXITED",
            actualExitTime: now,
            securityGuardName: guardName,
            securityNotes: securityNotes || gatePass.securityNotes
          }
        });

        res.json({
          message: `Exit recorded for ${gatePass.student.fullName} (${gatePass.student.rollNumber}).`,
          gatePass: updated
        });
        return;
      }

      if (action === "ENTRY") {
        if (gatePass.status !== "EXITED" && gatePass.status !== "APPROVED") {
          res.status(400).json({
            error: `Cannot record entry. Pass status is ${gatePass.status}.`
          });
          return;
        }

        const isLate = now > new Date(gatePass.expectedReturnDate);
        const lateNote = isLate ? " [RETURNED PAST EXPECTED RETURN TIME]" : "";

        const updated = await prisma.gatePass.update({
          where: { id: gatePass.id },
          data: {
            status: "RETURNED",
            actualEntryTime: now,
            securityGuardName: guardName,
            securityNotes: `${securityNotes || ""}${lateNote}`.trim()
          }
        });

        res.json({
          message: `Entry recorded for ${gatePass.student.fullName}.${isLate ? " (Flagged as Late Return)" : ""}`,
          gatePass: updated,
          isLate
        });
        return;
      }

      res.status(400).json({ error: "Invalid action." });
    } catch (err: any) {
      console.error("Error recording gate action:", err);
      res.status(500).json({ error: "Failed to record gate event." });
    }
  }
);

// Gate Log: List students currently outside campus (EXITED)
gatePassRouter.get(
  "/gate-log/active-outside",
  requireAuth,
  requireRoles(["STAFF", "WARDEN", "ADMIN"]),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const activeOutside = await prisma.gatePass.findMany({
        where: { status: "EXITED" },
        include: {
          student: { select: { id: true, fullName: true, rollNumber: true, phone: true, hostelBlock: true, roomNumber: true } }
        },
        orderBy: { actualExitTime: "desc" }
      });

      const now = Date.now();
      const enriched = activeOutside.map((p) => {
        const isOverdue = p.expectedReturnDate ? new Date(p.expectedReturnDate).getTime() < now : false;
        return {
          ...p,
          isOverdue
        };
      });

      res.json({ activeOutside: enriched });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch active campus exits." });
    }
  }
);
