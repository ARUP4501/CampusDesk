import { Router, Request, Response } from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const feeRouter = Router();

// Get fee & dues status for student
feeRouter.get("/my-status", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const rollNumber = req.user!.rollNumber;

    if (!rollNumber) {
      res.json({ feeRecord: null, message: "No roll number linked to account." });
      return;
    }

    const feeRecord = await prisma.feeRecord.findFirst({
      where: { rollNumber: rollNumber },
      orderBy: { importedAt: "desc" }
    });

    res.json({ feeRecord });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to retrieve fee status." });
  }
});

// List all fee records (Admin / Staff)
feeRouter.get("/all", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user!.role === "STUDENT") {
      res.status(403).json({ error: "Unauthorized." });
      return;
    }

    const fees = await prisma.feeRecord.findMany({
      orderBy: [{ status: "asc" }, { rollNumber: "asc" }]
    });

    const totalCollected = fees.reduce((sum, f) => sum + f.paidFee, 0);
    const totalPending = fees.reduce((sum, f) => sum + f.dueFee, 0);

    res.json({
      fees,
      summary: {
        totalStudents: fees.length,
        totalCollected,
        totalPending
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to load fee records." });
  }
});
