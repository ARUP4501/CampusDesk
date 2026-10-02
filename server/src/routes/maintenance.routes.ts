import { Router, Request, Response } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, requireRoles } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { createNotification } from "../services/push.service.js";
import { CreatePlannedMaintenanceSchema } from "../shared/schemas.js";

export const maintenanceRouter = Router();

// List planned maintenance schedules (active & upcoming)
maintenanceRouter.get("/", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    const schedules = await prisma.plannedMaintenance.findMany({
      orderBy: { startTime: "asc" }
    });

    // Filter relevant for student based on livingType & hostelBlock if student
    const filtered = schedules.filter((s) => {
      if (req.user!.role !== "STUDENT") return true;
      if (s.targetAudience === "ALL") return true;
      if (user?.livingType === "HOSTELLER" && (s.targetAudience === "HOSTELLER" || s.targetAudience === user.hostelBlock)) return true;
      if (user?.livingType === "DAY_SCHOLAR" && s.targetAudience === "DAY_SCHOLAR") return true;
      return false;
    });

    res.json({ maintenance: filtered });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch planned maintenance." });
  }
});

// Create new Planned Maintenance schedule (Admin / Warden)
maintenanceRouter.post(
  "/",
  requireAuth,
  requireRoles(["ADMIN", "WARDEN"]),
  validateBody(CreatePlannedMaintenanceSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { title, description, location, category, startTime, endTime, targetAudience } = req.body;

      const schedule = await prisma.plannedMaintenance.create({
        data: {
          title,
          description,
          location,
          category,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          targetAudience: targetAudience || "ALL",
          createdById: req.user!.id,
          status: "SCHEDULED"
        }
      });

      // Also create an official campus notice so it appears across notice boards
      const notice = await prisma.notice.create({
        data: {
          title: `[MAINTENANCE] ${title}`,
          content: `${description}\n\nLocation: ${location}\nScheduled Time Window: ${new Date(startTime).toLocaleString()} to ${new Date(endTime).toLocaleString()}`,
          category: "MAINTENANCE",
          priority: "URGENT",
          targetType: targetAudience === "ALL" ? "ALL" : "HOSTEL",
          targetValue: targetAudience !== "ALL" ? targetAudience : null,
          publishedById: req.user!.id
        }
      });

      // Target students based on audience
      let studentWhere: any = { role: "STUDENT", isActive: true };
      if (targetAudience === "HOSTELLER") {
        studentWhere.livingType = "HOSTELLER";
      } else if (targetAudience === "DAY_SCHOLAR") {
        studentWhere.livingType = "DAY_SCHOLAR";
      } else if (targetAudience.startsWith("Hostel-")) {
        studentWhere.hostelBlock = targetAudience;
      }

      const affectedStudents = await prisma.user.findMany({
        where: studentWhere,
        select: { id: true }
      });

      // Create notice recipients & in-app notifications
      for (const s of affectedStudents) {
        await prisma.noticeRecipient.create({
          data: {
            noticeId: notice.id,
            studentId: s.id,
            isDelivered: true
          }
        }).catch(() => {});

        await createNotification(
          s.id,
          `Planned Maintenance: ${title}`,
          `Service disruption at ${location} from ${new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to ${new Date(endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
          "MAINTENANCE",
          `/notices/${notice.id}`
        );
      }

      res.status(201).json({
        message: "Planned maintenance scheduled and notices dispatched.",
        schedule,
        affectedCount: affectedStudents.length
      });
    } catch (err: any) {
      console.error("Maintenance scheduling error:", err);
      res.status(500).json({ error: "Failed to schedule planned maintenance." });
    }
  }
);

// Delete or cancel a scheduled maintenance
maintenanceRouter.delete(
  "/:id",
  requireAuth,
  requireRoles(["ADMIN", "WARDEN"]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await prisma.plannedMaintenance.delete({ where: { id } });
      res.json({ message: "Maintenance schedule removed." });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to delete maintenance schedule." });
    }
  }
);
