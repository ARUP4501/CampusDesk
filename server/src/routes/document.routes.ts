import { Router, Request, Response } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, requireRoles } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { generateBonafidePdf } from "../services/pdf.service.js";
import { createNotification } from "../services/push.service.js";
import { CreateDocumentRequestSchema } from "../shared/schemas.js";

export const documentRouter = Router();

// Create document request (Student)
documentRouter.post(
  "/",
  requireAuth,
  validateBody(CreateDocumentRequestSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { docType, purpose } = req.body;

      const total = await prisma.documentRequest.count();
      const requestNumber = `DOC-${3000 + total + 1}`;

      const docRequest = await prisma.documentRequest.create({
        data: {
          requestNumber,
          studentId: req.user!.id,
          docType: docType as any,
          purpose,
          status: "SUBMITTED"
        }
      });

      // Notify administration
      const admins = await prisma.user.findMany({ where: { role: { in: ["ADMIN", "STAFF"] } } });
      for (const a of admins) {
        await createNotification(
          a.id,
          `New Document Request: #${requestNumber}`,
          `${req.user!.fullName} requested ${docType.replace(/_/g, " ")}.`,
          "DOCUMENT",
          `/documents`
        );
      }

      res.status(201).json({ message: "Document request submitted.", docRequest });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to submit document request." });
    }
  }
);

// List document requests
documentRouter.get("/", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const isStudent = req.user!.role === "STUDENT";
    const whereClause: any = {};

    if (isStudent) {
      whereClause.studentId = req.user!.id;
    }

    const requests = await prisma.documentRequest.findMany({
      where: whereClause,
      include: {
        student: { select: { id: true, fullName: true, rollNumber: true, branch: true, year: true, batch: true } },
        approvedBy: { select: { id: true, fullName: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json({ requests });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to load document requests." });
  }
});

// Update document request status (Staff / Admin)
documentRouter.patch(
  "/:id/status",
  requireAuth,
  requireRoles(["STAFF", "ADMIN"]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, remarks } = req.body;

      const doc = await prisma.documentRequest.findUnique({
        where: { id },
        include: { student: true }
      });

      if (!doc) {
        res.status(404).json({ error: "Document request not found." });
        return;
      }

      const updated = await prisma.documentRequest.update({
        where: { id },
        data: {
          status,
          remarks: remarks || null,
          approvedById: req.user!.id
        }
      });

      // Notify student
      await createNotification(
        doc.studentId,
        `Document Request #${doc.requestNumber} ${status}`,
        `Your request for ${doc.docType.replace(/_/g, " ")} has been marked as ${status}.${remarks ? ` Note: "${remarks}"` : ""}`,
        "DOCUMENT",
        `/documents`
      );

      res.json({ message: "Document request updated.", docRequest: updated });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to update document status." });
    }
  }
);

// Download generated PDF document (Bonafide certificate, etc.)
documentRouter.get("/:id/download", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const doc = await prisma.documentRequest.findUnique({
      where: { id },
      include: { student: true }
    });

    if (!doc) {
      res.status(404).json({ error: "Document request not found." });
      return;
    }

    if (req.user!.role === "STUDENT" && doc.studentId !== req.user!.id) {
      res.status(403).json({ error: "Unauthorized access." });
      return;
    }

    if (doc.status !== "APPROVED") {
      res.status(400).json({ error: "Document is not yet approved for download." });
      return;
    }

    const pdfBuffer = await generateBonafidePdf({
      certificateNumber: doc.requestNumber,
      studentName: doc.student.fullName,
      rollNumber: doc.student.rollNumber || "N/A",
      branch: doc.student.branch || "Computer Science",
      year: doc.student.year || 2,
      batch: doc.student.batch || "2024",
      purpose: doc.purpose,
      issueDate: doc.updatedAt
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${doc.docType}_${doc.requestNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (err: any) {
    console.error("Failed to generate PDF document:", err);
    res.status(500).json({ error: "Failed to download document PDF." });
  }
});
