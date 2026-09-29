import { Router, Request, Response } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, requireRoles } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { createNotification } from "../services/push.service.js";
import { CreateNoticeSchema, UpdateNoticeSchema } from "../shared/schemas.js";

export const noticeRouter = Router();

// 1. Publish new official notice (Only ADMIN and WARDEN)
noticeRouter.post(
  "/",
  requireAuth,
  requireRoles(["ADMIN", "WARDEN"]),
  validateBody(CreateNoticeSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        title,
        content,
        category,
        priority,
        targetType,
        targetValue,
        requiresAction,
        actionType,
        actionDeadline,
        actionLink,
        expiresAt
      } = req.body;

      const notice = await prisma.notice.create({
        data: {
          title,
          content,
          category: category || "GENERAL",
          priority: priority || "NORMAL",
          targetType: targetType || "ALL",
          targetValue: targetValue || null,
          publishedById: req.user!.id,
          requiresAction: requiresAction || false,
          actionType: actionType || "NONE",
          actionDeadline: actionDeadline ? new Date(actionDeadline) : null,
          actionLink: actionLink || null,
          expiresAt: expiresAt ? new Date(expiresAt) : null
        }
      });

      // Resolve matching students based on targeting rules
      const studentFilter: any = { role: "STUDENT", isActive: true };

      if (targetType === "BATCH" && targetValue) {
        studentFilter.batch = targetValue;
      } else if (targetType === "BRANCH" && targetValue) {
        studentFilter.branch = targetValue;
      } else if (targetType === "HOSTEL" && targetValue) {
        studentFilter.hostelBlock = targetValue;
      } else if (targetType === "YEAR" && targetValue) {
        studentFilter.year = parseInt(targetValue, 10);
      }

      const targetStudents = await prisma.user.findMany({
        where: studentFilter,
        select: { id: true }
      });

      // Create recipient tracking records in bulk
      if (targetStudents.length > 0) {
        await prisma.noticeRecipient.createMany({
          data: targetStudents.map((s) => ({
            noticeId: notice.id,
            studentId: s.id,
            isDelivered: true,
            deliveredAt: new Date()
          })),
          skipDuplicates: true
        });

        // Dispatch in-app and push notifications
        for (const s of targetStudents) {
          await createNotification(
            s.id,
            `[${category || "NOTICE"}] ${title}`,
            requiresAction
              ? `Action required before ${actionDeadline ? new Date(actionDeadline).toLocaleDateString() : "deadline"}`
              : content.slice(0, 100),
            "NOTICE",
            `/notices/${notice.id}`
          );
        }
      }

      res.status(201).json({
        message: `Official notice published and delivered to ${targetStudents.length} students.`,
        notice,
        recipientsCount: targetStudents.length
      });
    } catch (err: any) {
      console.error("Error publishing official notice:", err);
      res.status(500).json({ error: "Failed to publish notice: " + (err.message || "") });
    }
  }
);

// 2. Edit existing official notice (Only ADMIN and WARDEN)
noticeRouter.put(
  "/:id",
  requireAuth,
  requireRoles(["ADMIN", "WARDEN"]),
  validateBody(UpdateNoticeSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const {
        title,
        content,
        category,
        priority,
        targetType,
        targetValue,
        requiresAction,
        actionType,
        actionDeadline,
        actionLink,
        expiresAt
      } = req.body;

      const existing = await prisma.notice.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ error: "Notice not found." });
        return;
      }

      // Wardens can edit their own notices or general notices
      if (req.user!.role === "WARDEN" && existing.publishedById !== req.user!.id && existing.targetType !== "HOSTEL") {
        res.status(403).json({ error: "Wardens can only edit notices they published or hostel notices." });
        return;
      }

      const updated = await prisma.notice.update({
        where: { id },
        data: {
          title,
          content,
          category: category || "GENERAL",
          priority: priority || "NORMAL",
          targetType: targetType || "ALL",
          targetValue: targetValue || null,
          requiresAction: requiresAction || false,
          actionType: actionType || "NONE",
          actionDeadline: actionDeadline ? new Date(actionDeadline) : null,
          actionLink: actionLink || null,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          updatedAt: new Date()
        }
      });

      res.json({ message: "Official notice updated successfully.", notice: updated });
    } catch (err: any) {
      console.error("Error updating notice:", err);
      res.status(500).json({ error: "Failed to update notice." });
    }
  }
);

// 3. Delete official notice (Only ADMIN and WARDEN)
noticeRouter.delete(
  "/:id",
  requireAuth,
  requireRoles(["ADMIN", "WARDEN"]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const existing = await prisma.notice.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ error: "Notice not found." });
        return;
      }

      // Wardens can delete their own notices or hostel notices
      if (req.user!.role === "WARDEN" && existing.publishedById !== req.user!.id && existing.targetType !== "HOSTEL") {
        res.status(403).json({ error: "Wardens can only delete notices they published or hostel notices." });
        return;
      }

      await prisma.notice.delete({
        where: { id }
      });

      res.json({ message: "Official notice deleted successfully." });
    } catch (err: any) {
      console.error("Error deleting notice:", err);
      res.status(500).json({ error: "Failed to delete notice." });
    }
  }
);

// 4. List official notices (Accessible by ALL roles: ADMIN, WARDEN, STAFF, STUDENT)
noticeRouter.get("/", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const isStudent = req.user!.role === "STUDENT";
    const categoryFilter = req.query.category as string;

    if (isStudent) {
      // Return notices targeted to this student
      const userRecipients = await prisma.noticeRecipient.findMany({
        where: {
          studentId: req.user!.id,
          ...(categoryFilter && categoryFilter !== "ALL"
            ? { notice: { category: categoryFilter } }
            : {})
        },
        include: {
          notice: {
            include: { publishedBy: { select: { fullName: true, role: true, department: true } } }
          }
        },
        orderBy: { notice: { createdAt: "desc" } }
      });

      const list = userRecipients.map((ur) => ({
        id: ur.notice.id,
        title: ur.notice.title,
        content: ur.notice.content,
        category: ur.notice.category,
        priority: ur.notice.priority,
        targetType: ur.notice.targetType,
        targetValue: ur.notice.targetValue,
        requiresAction: ur.notice.requiresAction,
        actionType: ur.notice.actionType,
        actionDeadline: ur.notice.actionDeadline,
        actionLink: ur.notice.actionLink,
        expiresAt: ur.notice.expiresAt,
        publishedBy: ur.notice.publishedBy,
        createdAt: ur.notice.createdAt,
        isRead: ur.isRead,
        readAt: ur.readAt,
        isActionDone: ur.isActionDone,
        actionCompletedAt: ur.actionCompletedAt
      }));

      res.json({ notices: list });
      return;
    }

    // For Staff, Warden, Admin: return published notices
    const whereClause: any = {};
    if (categoryFilter && categoryFilter !== "ALL") {
      whereClause.category = categoryFilter;
    }

    const allNotices = await prisma.notice.findMany({
      where: whereClause,
      include: {
        publishedBy: { select: { id: true, fullName: true, role: true, department: true } },
        recipients: {
          select: { isDelivered: true, isRead: true, isActionDone: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const enriched = allNotices.map((n) => {
      const total = n.recipients.length;
      const read = n.recipients.filter((r) => r.isRead).length;
      const actionDone = n.recipients.filter((r) => r.isActionDone).length;
      return {
        id: n.id,
        title: n.title,
        content: n.content,
        category: n.category,
        priority: n.priority,
        targetType: n.targetType,
        targetValue: n.targetValue,
        requiresAction: n.requiresAction,
        actionType: n.actionType,
        actionDeadline: n.actionDeadline,
        actionLink: n.actionLink,
        expiresAt: n.expiresAt,
        publishedBy: n.publishedBy,
        createdAt: n.createdAt,
        stats: {
          totalRecipients: total,
          readCount: read,
          readRate: total > 0 ? Number(((read / total) * 100).toFixed(1)) : 0,
          actionDoneCount: actionDone,
          actionRate: total > 0 ? Number(((actionDone / total) * 100).toFixed(1)) : 0
        }
      };
    });

    res.json({ notices: enriched });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to list notices." });
  }
});

// 5. Get notice details & tracking status
noticeRouter.get("/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const isStudent = req.user!.role === "STUDENT";

    const notice = await prisma.notice.findUnique({
      where: { id },
      include: {
        publishedBy: { select: { id: true, fullName: true, role: true, department: true } },
        recipients: {
          include: {
            student: { select: { id: true, fullName: true, rollNumber: true, phone: true, hostelBlock: true, roomNumber: true } }
          }
        }
      }
    });

    if (!notice) {
      res.status(404).json({ error: "Notice not found." });
      return;
    }

    if (isStudent) {
      const myRecipient = notice.recipients.find((r) => r.studentId === req.user!.id);
      res.json({
        notice: {
          id: notice.id,
          title: notice.title,
          content: notice.content,
          category: notice.category,
          priority: notice.priority,
          targetType: notice.targetType,
          targetValue: notice.targetValue,
          requiresAction: notice.requiresAction,
          actionType: notice.actionType,
          actionDeadline: notice.actionDeadline,
          actionLink: notice.actionLink,
          expiresAt: notice.expiresAt,
          publishedBy: notice.publishedBy,
          createdAt: notice.createdAt,
          userStatus: myRecipient || { isRead: false, isActionDone: false }
        }
      });
      return;
    }

    // Staff/Admin/Warden detailed view
    const totalRecipients = notice.recipients.length;
    const readCount = notice.recipients.filter((r) => r.isRead).length;
    const actionDoneCount = notice.recipients.filter((r) => r.isActionDone).length;
    const unreadStudents = notice.recipients.filter((r) => !r.isRead).map((r) => r.student);
    const pendingActionStudents = notice.recipients.filter((r) => !r.isActionDone).map((r) => r.student);

    res.json({
      notice: {
        id: notice.id,
        title: notice.title,
        content: notice.content,
        category: notice.category,
        priority: notice.priority,
        targetType: notice.targetType,
        targetValue: notice.targetValue,
        requiresAction: notice.requiresAction,
        actionType: notice.actionType,
        actionDeadline: notice.actionDeadline,
        actionLink: notice.actionLink,
        expiresAt: notice.expiresAt,
        publishedBy: notice.publishedBy,
        createdAt: notice.createdAt
      },
      stats: {
        totalRecipients,
        readCount,
        readRate: totalRecipients > 0 ? Number(((readCount / totalRecipients) * 100).toFixed(1)) : 0,
        actionDoneCount,
        actionRate: totalRecipients > 0 ? Number(((actionDoneCount / totalRecipients) * 100).toFixed(1)) : 0
      },
      unreadStudents,
      pendingActionStudents
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to retrieve notice details." });
  }
});

// 6. Mark notice read (Student)
noticeRouter.post("/:id/read", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.noticeRecipient.updateMany({
      where: { noticeId: id, studentId: req.user!.id, isRead: false },
      data: { isRead: true, readAt: new Date() }
    });

    res.json({ message: "Notice marked as read." });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to record read status." });
  }
});

// 7. Complete required notice action (Student)
noticeRouter.post("/:id/action", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    await prisma.noticeRecipient.updateMany({
      where: { noticeId: id, studentId: req.user!.id },
      data: {
        isActionDone: true,
        actionCompletedAt: new Date(),
        actionNotes: notes || null
      }
    });

    res.json({ message: "Notice action recorded as completed." });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to submit notice action." });
  }
});

// 8. Dispatch manual reminder to pending students (Admin / Warden only)
noticeRouter.post(
  "/:id/remind",
  requireAuth,
  requireRoles(["ADMIN", "WARDEN"]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const notice = await prisma.notice.findUnique({ where: { id } });

      if (!notice) {
        res.status(404).json({ error: "Notice not found." });
        return;
      }

      const pendingRecipients = await prisma.noticeRecipient.findMany({
        where: {
          noticeId: id,
          isActionDone: false
        },
        include: { student: true }
      });

      for (const r of pendingRecipients) {
        await prisma.noticeRecipient.update({
          where: { id: r.id },
          data: {
            reminderSentCount: r.reminderSentCount + 1,
            lastReminderSentAt: new Date()
          }
        });

        await createNotification(
          r.studentId,
          `Reminder: ${notice.title}`,
          `Please complete the pending action for notice: "${notice.title}".`,
          "REMINDER",
          `/notices/${notice.id}`
        );
      }

      res.json({
        message: `Reminders sent to ${pendingRecipients.length} students.`,
        sentCount: pendingRecipients.length
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to send reminders." });
    }
  }
);
