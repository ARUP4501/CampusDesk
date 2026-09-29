import { Router, Request, Response } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, requireRoles } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { CreateClassCancellationSchema } from "../shared/schemas.js";

export const academicRouter = Router();

// Get student timetable / schedule
academicRouter.get("/timetable", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const branch = req.query.branch as string || req.user!.branch || "CSE";
    const year = req.query.year ? parseInt(req.query.year as string, 10) : (req.user!.year || 2);

    const schedule = await prisma.courseSchedule.findMany({
      where: { branch, year },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }]
    });

    res.json({ schedule });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to load timetable." });
  }
});

// Get student attendance records
academicRouter.get("/attendance", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = (req.user!.role === "STUDENT" || !req.query.studentId)
      ? req.user!.id
      : (req.query.studentId as string);

    const records = await prisma.attendanceRecord.findMany({
      where: { studentId },
      orderBy: { subjectCode: "asc" }
    });

    const enriched = records.map((r) => {
      const percentage = r.totalClasses > 0 ? Number(((r.attendedClasses / r.totalClasses) * 100).toFixed(1)) : 100;
      return {
        ...r,
        percentage,
        isShortage: percentage < 75
      };
    });

    res.json({ attendance: enriched });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to load attendance." });
  }
});

// Get class cancellations
academicRouter.get("/cancellations", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const branch = req.query.branch as string || req.user!.branch;
    const year = req.query.year ? parseInt(req.query.year as string, 10) : req.user!.year;

    const whereClause: any = {};
    if (branch) whereClause.branch = branch;
    if (year) whereClause.year = year;

    const cancellations = await prisma.classCancellation.findMany({
      where: whereClause,
      include: {
        postedBy: { select: { fullName: true, department: true } }
      },
      orderBy: { date: "desc" },
      take: 30
    });

    res.json({ cancellations });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to load class cancellations." });
  }
});

// Post a class cancellation (Staff / Admin)
academicRouter.post(
  "/cancellations",
  requireAuth,
  requireRoles(["STAFF", "ADMIN"]),
  validateBody(CreateClassCancellationSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { subjectName, facultyName, date, branch, year, reason } = req.body;

      const cancellation = await prisma.classCancellation.create({
        data: {
          subjectName,
          facultyName,
          date: new Date(date),
          branch: branch.toUpperCase(),
          year: parseInt(String(year), 10),
          reason,
          postedById: req.user!.id
        }
      });

      res.status(201).json({ message: "Class cancellation posted.", cancellation });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to post class cancellation." });
    }
  }
);
