import { Router, Request, Response } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, requireRoles } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import {
  CreateClassCancellationSchema,
  CreateCourseSchema,
  UpdateCourseSchema,
  CreateBranchSchema,
  UpdateBranchSchema
} from "../shared/schemas.js";

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

// =========================================================================
// COURSE & BRANCH MASTER DATA (Read: All / Public; Manage: Admin only)
// =========================================================================

// Validate Course -> Branch relationship helper
export async function validateCourseBranch(
  courseInput?: string | null,
  branchInput?: string | null
): Promise<{ valid: boolean; error?: string }> {
  if (!courseInput || !branchInput) return { valid: true };

  const trimmedCourse = courseInput.trim();
  const trimmedBranch = branchInput.trim();

  // Find course (case-insensitive by code or name)
  const course = await prisma.academicCourse.findFirst({
    where: {
      OR: [
        { code: trimmedCourse },
        { name: trimmedCourse }
      ]
    },
    include: {
      branches: true
    }
  });

  // If no course in DB yet (or legacy records), pass gracefully
  if (!course) {
    return { valid: true };
  }

  if (!course.isActive) {
    return { valid: false, error: `Course "${trimmedCourse}" is currently deactivated.` };
  }

  // Check if branch belongs to this course
  const branchMatch = course.branches.find(
    (b) =>
      b.code.toLowerCase() === trimmedBranch.toLowerCase() ||
      b.name.toLowerCase() === trimmedBranch.toLowerCase()
  );

  if (!branchMatch) {
    return {
      valid: false,
      error: `Branch "${trimmedBranch}" does not belong to course "${trimmedCourse}". Available branches: ${course.branches.map((b) => b.name).join(", ")}.`
    };
  }

  if (!branchMatch.isActive) {
    return { valid: false, error: `Branch "${trimmedBranch}" under course "${trimmedCourse}" is currently inactive.` };
  }

  return { valid: true };
}

// Get all courses with their branches
academicRouter.get("/courses", async (req: Request, res: Response): Promise<void> => {
  try {
    const { includeInactive } = req.query;
    const whereCourse: any = includeInactive === "true" ? {} : { isActive: true };
    const whereBranch: any = includeInactive === "true" ? {} : { isActive: true };

    const courses = await prisma.academicCourse.findMany({
      where: whereCourse,
      include: {
        branches: {
          where: whereBranch,
          orderBy: { name: "asc" }
        }
      },
      orderBy: { code: "asc" }
    });

    res.json({ courses });
  } catch (err: any) {
    console.error("Failed to load courses:", err);
    res.status(500).json({ error: "Failed to load courses." });
  }
});

// Admin: Add Course
academicRouter.post(
  "/courses",
  requireAuth,
  requireRoles(["ADMIN"]),
  validateBody(CreateCourseSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { code, name, durationYears, isActive } = req.body;

      const existing = await prisma.academicCourse.findUnique({
        where: { code }
      });
      if (existing) {
        res.status(400).json({ error: `Course code "${code}" already exists.` });
        return;
      }

      const course = await prisma.academicCourse.create({
        data: {
          code: code.trim(),
          name: name.trim(),
          durationYears: durationYears || 2,
          isActive: isActive !== undefined ? isActive : true
        },
        include: { branches: true }
      });

      res.status(201).json({ message: "Course created successfully.", course });
    } catch (err: any) {
      console.error("Failed to create course:", err);
      res.status(500).json({ error: "Failed to create course." });
    }
  }
);

// Admin: Update Course
academicRouter.put(
  "/courses/:id",
  requireAuth,
  requireRoles(["ADMIN"]),
  validateBody(UpdateCourseSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { code, name, durationYears, isActive } = req.body;

      const existing = await prisma.academicCourse.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ error: "Course not found." });
        return;
      }

      if (code && code !== existing.code) {
        const conflict = await prisma.academicCourse.findUnique({ where: { code } });
        if (conflict) {
          res.status(400).json({ error: `Course code "${code}" already exists.` });
          return;
        }
      }

      const updated = await prisma.academicCourse.update({
        where: { id },
        data: {
          ...(code !== undefined && { code: code.trim() }),
          ...(name !== undefined && { name: name.trim() }),
          ...(durationYears !== undefined && { durationYears }),
          ...(isActive !== undefined && { isActive })
        },
        include: { branches: true }
      });

      res.json({ message: "Course updated successfully.", course: updated });
    } catch (err: any) {
      console.error("Failed to update course:", err);
      res.status(500).json({ error: "Failed to update course." });
    }
  }
);

// Admin: Toggle Course Active/Inactive Status
academicRouter.patch(
  "/courses/:id/status",
  requireAuth,
  requireRoles(["ADMIN"]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== "boolean") {
        res.status(400).json({ error: "isActive boolean is required." });
        return;
      }

      const course = await prisma.academicCourse.update({
        where: { id },
        data: { isActive },
        include: { branches: true }
      });

      res.json({ message: `Course ${course.code} ${isActive ? "activated" : "deactivated"}.`, course });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to update course status." });
    }
  }
);

// Admin: Add Branch to Course
academicRouter.post(
  "/branches",
  requireAuth,
  requireRoles(["ADMIN"]),
  validateBody(CreateBranchSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { courseId, code, name, isActive } = req.body;

      const course = await prisma.academicCourse.findUnique({ where: { id: courseId } });
      if (!course) {
        res.status(404).json({ error: "Course not found." });
        return;
      }

      const existingBranch = await prisma.academicBranch.findFirst({
        where: {
          courseId,
          code: code.trim()
        }
      });
      if (existingBranch) {
        res.status(400).json({ error: `Branch code "${code}" already exists for course "${course.code}".` });
        return;
      }

      const branch = await prisma.academicBranch.create({
        data: {
          courseId,
          code: code.trim(),
          name: name.trim(),
          isActive: isActive !== undefined ? isActive : true
        }
      });

      res.status(201).json({ message: "Branch added to course.", branch });
    } catch (err: any) {
      console.error("Failed to add branch:", err);
      res.status(500).json({ error: "Failed to add branch." });
    }
  }
);

// Admin: Update Branch
academicRouter.put(
  "/branches/:id",
  requireAuth,
  requireRoles(["ADMIN"]),
  validateBody(UpdateBranchSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { code, name, isActive } = req.body;

      const branch = await prisma.academicBranch.findUnique({ where: { id } });
      if (!branch) {
        res.status(404).json({ error: "Branch not found." });
        return;
      }

      const updated = await prisma.academicBranch.update({
        where: { id },
        data: {
          ...(code !== undefined && { code: code.trim() }),
          ...(name !== undefined && { name: name.trim() }),
          ...(isActive !== undefined && { isActive })
        }
      });

      res.json({ message: "Branch updated successfully.", branch: updated });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to update branch." });
    }
  }
);

// Admin: Toggle Branch Active/Inactive Status
academicRouter.patch(
  "/branches/:id/status",
  requireAuth,
  requireRoles(["ADMIN"]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== "boolean") {
        res.status(400).json({ error: "isActive boolean is required." });
        return;
      }

      const branch = await prisma.academicBranch.update({
        where: { id },
        data: { isActive }
      });

      res.json({ message: `Branch ${branch.code} ${isActive ? "activated" : "deactivated"}.`, branch });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to update branch status." });
    }
  }
);
