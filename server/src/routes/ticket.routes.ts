import { Router, Request, Response } from "express";
import multer from "multer";
import sharp from "sharp";
import { prisma } from "../prisma.js";
import { requireAuth, requireRoles } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { classifierService } from "../services/classifier.service.js";
import { assignmentService } from "../services/assignment.service.js";
import { createNotification } from "../services/push.service.js";
import { generateTicketSlipPdf } from "../services/pdf.service.js";
import { CreateTicketSchema, UpdateTicketStatusSchema, OverrideTicketPrioritySchema } from "../shared/schemas.js";

export const ticketRouter = Router();

// Configure multer for memory storage with 5MB max upload limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed."));
    }
  }
});

// Create new ticket with smart staff assignment, SLA target, and photo compression
ticketRouter.post(
  "/",
  requireAuth,
  upload.single("photo"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const parsedBody = CreateTicketSchema.safeParse(req.body);
      if (!parsedBody.success) {
        res.status(400).json({ error: "Validation failed", details: parsedBody.error.errors });
        return;
      }

      const { title, description, category, hostelBlock, roomNumber, priority } = parsedBody.data;

      // Classify text with TF-IDF classifier
      const textToClassify = `${title} ${description}`;
      const classification = classifierService.classify(textToClassify);
      const chosenCategory = category || classification.category;
      const chosenPriority = priority || "MEDIUM";

      // Calculate SLA deadline based on priority
      const slaDeadline = assignmentService.calculateSlaDeadline(chosenPriority);

      // Smart staff assignment engine
      const assignment = await assignmentService.smartAssignStaff(chosenCategory, hostelBlock);

      // Process and compress photo with sharp if provided
      let photoData: Buffer | null = null;
      let photoMimeType: string | null = null;

      if (req.file) {
        photoData = await sharp(req.file.buffer)
          .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer();
        photoMimeType = "image/jpeg";
      }

      const totalCount = await prisma.ticket.count();
      const ticketNumber = `CD-${1000 + totalCount + 1}`;
      const initialStatus = assignment.assignedStaffId ? "ASSIGNED" : "SUBMITTED";

      const ticket = await prisma.ticket.create({
        data: {
          ticketNumber,
          studentId: req.user!.id,
          title,
          description,
          category: chosenCategory as any,
          predictedCategory: classification.category as any,
          isCategoryCorrected: category ? category !== classification.category : false,
          hostelBlock,
          roomNumber,
          priority: chosenPriority as any,
          slaDeadline,
          status: initialStatus,
          assignedStaffId: assignment.assignedStaffId || undefined,
          photoData: (photoData || undefined) as any,
          photoMimeType: photoMimeType || undefined
        }
      });

      // Create initial immutable audit log
      await prisma.ticketAuditLog.create({
        data: {
          ticketId: ticket.id,
          changedById: req.user!.id,
          toStatus: initialStatus,
          action: "TICKET_CREATED",
          note: `Complaint filed (${chosenPriority} priority, SLA: ${slaDeadline.toLocaleDateString()} ${slaDeadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}). ${assignment.explanation}`
        }
      });

      // Check recurring issues in same location/category within last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recurringTickets = await prisma.ticket.findMany({
        where: {
          id: { not: ticket.id },
          category: chosenCategory as any,
          hostelBlock,
          roomNumber,
          createdAt: { gte: thirtyDaysAgo }
        },
        select: { id: true, ticketNumber: true, title: true, priority: true, status: true, createdAt: true }
      });

      // Notify staff/wardens
      const notifyUsers = await prisma.user.findMany({
        where: {
          OR: [
            { role: "WARDEN" },
            { id: assignment.assignedStaffId || undefined }
          ],
          isActive: true
        }
      });

      for (const u of notifyUsers) {
        await createNotification(
          u.id,
          `New ${chosenPriority} Ticket: #${ticketNumber}`,
          `${chosenCategory} issue reported in ${hostelBlock} ${roomNumber}: "${title}". Target SLA: ${slaDeadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          "TICKET",
          `/tickets/${ticket.id}`
        );
      }

      res.status(201).json({
        ticket: {
          ...ticket,
          photoData: undefined,
          hasPhoto: !!photoData
        },
        predictedCategory: classification.category,
        predictionConfidence: classification.confidence,
        matchedKeywords: classification.matchedKeywords,
        assignmentExplanation: assignment.explanation,
        slaDeadline,
        recurringIssue: recurringTickets.length > 0 ? {
          isRecurring: true,
          count: recurringTickets.length + 1,
          previousTickets: recurringTickets,
          insight: `Repeated ${chosenCategory} issue detected in ${hostelBlock} ${roomNumber} (${recurringTickets.length + 1} complaints in 30 days). Consider equipment inspection or replacement.`
        } : null
      });
    } catch (err: any) {
      console.error("Failed to create ticket:", err);
      res.status(500).json({ error: "Failed to create complaint ticket." });
    }
  }
);

// List tickets with filters
ticketRouter.get("/", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, category, hostelBlock, search, escalationLevel } = req.query;
    const isStudent = req.user!.role === "STUDENT";

    const whereClause: any = {};

    if (isStudent) {
      whereClause.studentId = req.user!.id;
    }

    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    if (category && category !== "ALL") {
      whereClause.category = category;
    }

    if (req.user!.role === "WARDEN" && req.user!.hostelBlock) {
      whereClause.hostelBlock = req.user!.hostelBlock;
    } else if (hostelBlock && hostelBlock !== "ALL") {
      whereClause.hostelBlock = hostelBlock;
    }

    if (escalationLevel !== undefined && escalationLevel !== "ALL") {
      whereClause.escalationLevel = parseInt(escalationLevel as string, 10);
    }

    if (search) {
      const searchStr = String(search);
      whereClause.OR = [
        { ticketNumber: { contains: searchStr } },
        { title: { contains: searchStr } },
        { description: { contains: searchStr } },
        { roomNumber: { contains: searchStr } }
      ];
    }

    const tickets = await prisma.ticket.findMany({
      where: whereClause,
      include: {
        student: { select: { id: true, fullName: true, rollNumber: true, phone: true } },
        assignedStaff: { select: { id: true, fullName: true, department: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    // Compute ageing in hours and recurring flags
    const now = Date.now();
    const formattedTickets = tickets.map((t) => {
      const ageHours = Math.floor((now - new Date(t.createdAt).getTime()) / (1000 * 60 * 60));
      return {
        id: t.id,
        ticketNumber: t.ticketNumber,
        title: t.title,
        category: t.category,
        predictedCategory: t.predictedCategory,
        isCategoryCorrected: t.isCategoryCorrected,
        hostelBlock: t.hostelBlock,
        roomNumber: t.roomNumber,
        priority: t.priority,
        status: t.status,
        escalationLevel: t.escalationLevel,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        resolvedAt: t.resolvedAt,
        ageHours,
        student: t.student,
        assignedStaff: t.assignedStaff,
        hasPhoto: !!t.photoData
      };
    });

    res.json({ tickets: formattedTickets });
  } catch (err: any) {
    console.error("Failed to list tickets:", err);
    res.status(500).json({ error: "Failed to load tickets." });
  }
});

// Get active operations staff for ticket assignment dropdown (Staff, Warden, Admin)
ticketRouter.get("/meta/staff", requireAuth, requireRoles(["STAFF", "WARDEN", "ADMIN"]), async (_req: Request, res: Response): Promise<void> => {
  try {
    const staff = await prisma.user.findMany({
      where: { role: "STAFF", isActive: true },
      select: { id: true, fullName: true, department: true, role: true },
      orderBy: { fullName: "asc" }
    });
    res.json({ staff });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to load staff list." });
  }
});

// Get ticket details with audit trail
ticketRouter.get("/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, fullName: true, rollNumber: true, phone: true, hostelBlock: true, roomNumber: true } },
        assignedStaff: { select: { id: true, fullName: true, department: true, email: true } },
        auditLogs: {
          include: {
            changedBy: { select: { id: true, fullName: true, role: true } }
          },
          orderBy: { createdAt: "asc" }
        }
      }
    });

    if (!ticket) {
      res.status(404).json({ error: "Ticket not found." });
      return;
    }

    // Role check: student can only view their own ticket
    if (req.user!.role === "STUDENT" && ticket.studentId !== req.user!.id) {
      res.status(403).json({ error: "Unauthorized to view this ticket." });
      return;
    }

    // Check recurring pattern in same room/block
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const recurringCount = await prisma.ticket.count({
      where: {
        id: { not: ticket.id },
        category: ticket.category,
        hostelBlock: ticket.hostelBlock,
        roomNumber: ticket.roomNumber,
        createdAt: { gte: fourteenDaysAgo }
      }
    });

    const ageHours = Math.floor((Date.now() - new Date(ticket.createdAt).getTime()) / (1000 * 60 * 60));

    res.json({
      ticket: {
        ...ticket,
        photoData: undefined,
        hasPhoto: !!ticket.photoData,
        ageHours,
        isRecurring: recurringCount > 0,
        recurringCount
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch ticket." });
  }
});

// Stream ticket photo
ticketRouter.get("/:id/photo", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      select: { photoData: true, photoMimeType: true, studentId: true }
    });

    if (!ticket || !ticket.photoData) {
      res.status(404).json({ error: "Photo not found for this ticket." });
      return;
    }

    if (req.user!.role === "STUDENT" && ticket.studentId !== req.user!.id) {
      res.status(403).json({ error: "Unauthorized access to photo." });
      return;
    }

    res.setHeader("Content-Type", ticket.photoMimeType || "image/jpeg");
    res.setHeader("Cache-Control", "private, max-age=86400");
    res.send(ticket.photoData);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to retrieve ticket photo." });
  }
});

// Update ticket status / assign staff / correct category (Staff/Warden/Admin)
ticketRouter.patch(
  "/:id/status",
  requireAuth,
  requireRoles(["STAFF", "WARDEN", "ADMIN"]),
  validateBody(UpdateTicketStatusSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, assignedStaffId, correctedCategory, note } = req.body;

      const ticket = await prisma.ticket.findUnique({ where: { id } });
      if (!ticket) {
        res.status(404).json({ error: "Ticket not found." });
        return;
      }

      const updateData: any = { status };
      let actionType = "STATUS_CHANGE";

      if (assignedStaffId !== undefined) {
        updateData.assignedStaffId = assignedStaffId || null;
        actionType = "STAFF_ASSIGNMENT";
      }

      if (status === "RESOLVED" || status === "CLOSED") {
        updateData.resolvedAt = new Date();
        updateData.resolutionNote = note;
      }

      // Handle category correction
      if (correctedCategory && correctedCategory !== ticket.category) {
        updateData.category = correctedCategory;
        updateData.isCategoryCorrected = true;
        actionType = "CATEGORY_CORRECTED";
        // Learn correction for future ML classification
        await classifierService.learnCorrection(`${ticket.title} ${ticket.description}`, correctedCategory);
      }

      const updated = await prisma.$transaction(async (tx) => {
        const t = await tx.ticket.update({
          where: { id },
          data: updateData
        });

        await tx.ticketAuditLog.create({
          data: {
            ticketId: id,
            changedById: req.user!.id,
            fromStatus: ticket.status,
            toStatus: status,
            action: actionType,
            note: `${note}${correctedCategory ? ` [Category changed to ${correctedCategory}]` : ""}`
          }
        });

        return t;
      });

      // Notify student
      await createNotification(
        ticket.studentId,
        `Ticket #${ticket.ticketNumber} Updated`,
        `Your ticket status is now: ${status}. Note: "${note}"`,
        "TICKET",
        `/tickets/${ticket.id}`
      );

      res.json({ message: "Ticket updated successfully.", ticket: updated });
    } catch (err: any) {
      console.error("Failed to update ticket:", err);
      res.status(500).json({ error: "Failed to update ticket status." });
    }
  }
);

// Override Ticket Priority (Warden & Admin only) with mandatory audit reason
ticketRouter.patch(
  "/:id/priority",
  requireAuth,
  requireRoles(["WARDEN", "ADMIN"]),
  validateBody(OverrideTicketPrioritySchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { priority, reason } = req.body;

      const ticket = await prisma.ticket.findUnique({ where: { id } });
      if (!ticket) {
        res.status(404).json({ error: "Ticket not found." });
        return;
      }

      const previousPriority = ticket.priority;
      const newSlaDeadline = assignmentService.calculateSlaDeadline(priority, ticket.createdAt);

      const updated = await prisma.$transaction(async (tx) => {
        const t = await tx.ticket.update({
          where: { id },
          data: {
            priority: priority as any,
            slaDeadline: newSlaDeadline,
            manualPriorityOverride: true,
            priorityOverriddenById: req.user!.id,
            priorityOverrideReason: reason
          }
        });

        await tx.ticketAuditLog.create({
          data: {
            ticketId: id,
            changedById: req.user!.id,
            fromStatus: ticket.status,
            toStatus: ticket.status,
            action: "PRIORITY_OVERRIDE",
            note: `Priority changed from ${previousPriority} to ${priority}. Reason: "${reason}". SLA adjusted to ${newSlaDeadline.toLocaleDateString()} ${newSlaDeadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
          }
        });

        return t;
      });

      // Notify student
      await createNotification(
        ticket.studentId,
        `Priority Updated: Ticket #${ticket.ticketNumber}`,
        `Your ticket priority was updated to ${priority} by ${req.user!.fullName}. Reason: "${reason}"`,
        "TICKET",
        `/tickets/${ticket.id}`
      );

      res.json({
        message: `Priority updated to ${priority}.`,
        ticket: updated,
        slaDeadline: newSlaDeadline
      });
    } catch (err: any) {
      console.error("Failed to override priority:", err);
      res.status(500).json({ error: "Failed to override ticket priority." });
    }
  }
);

// Recurring complaints analytics list
ticketRouter.get(
  "/analytics/recurring",
  requireAuth,
  requireRoles(["WARDEN", "ADMIN", "STAFF"]),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const tickets = await prisma.ticket.findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo }
        },
        select: {
          id: true,
          ticketNumber: true,
          title: true,
          category: true,
          hostelBlock: true,
          roomNumber: true,
          priority: true,
          status: true,
          createdAt: true
        },
        orderBy: { createdAt: "desc" }
      });

      // Group by location key (hostelBlock + roomNumber + category)
      const groups: Record<string, any[]> = {};
      for (const t of tickets) {
        const key = `${t.hostelBlock}::${t.roomNumber || "General"}::${t.category}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(t);
      }

      // Filter keys that have >= 2 occurrences
      const recurringList = Object.entries(groups)
        .filter(([_, list]) => list.length >= 2)
        .map(([key, list]) => {
          const [hostelBlock, roomNumber, category] = key.split("::");
          return {
            key,
            hostelBlock,
            roomNumber,
            category,
            count: list.length,
            latestTitle: list[0].title,
            latestDate: list[0].createdAt,
            tickets: list,
            recommendedAction: list.length >= 4 ? "Asset Replacement / Major Overhaul" : "Scheduled Preventative Maintenance"
          };
        })
        .sort((a, b) => b.count - a.count);

      res.json({ recurringIssues: recurringList });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch recurring issue analytics." });
    }
  }
);

// Download printable ticket slip PDF
ticketRouter.get("/:id/slip", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: { student: true }
    });

    if (!ticket) {
      res.status(404).json({ error: "Ticket not found." });
      return;
    }

    if (req.user!.role === "STUDENT" && ticket.studentId !== req.user!.id) {
      res.status(403).json({ error: "Unauthorized access." });
      return;
    }

    const pdfBuffer = await generateTicketSlipPdf({
      ticketNumber: ticket.ticketNumber,
      studentName: ticket.student.fullName,
      rollNumber: ticket.student.rollNumber || "N/A",
      category: ticket.category,
      hostelBlock: ticket.hostelBlock,
      roomNumber: ticket.roomNumber,
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority,
      status: ticket.status,
      createdAt: ticket.createdAt
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="Ticket_Slip_${ticket.ticketNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (err: any) {
    console.error("Failed to generate ticket slip PDF:", err);
    res.status(500).json({ error: "Failed to generate ticket slip." });
  }
});
