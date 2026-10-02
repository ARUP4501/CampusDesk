import { Router, Request, Response } from "express";
import argon2 from "argon2";
import { prisma } from "../prisma.js";
import { requireAuth, requireRoles } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import {
  CreateClassCancellationSchema,
  CreateCourseSchema,
  UpdateCourseSchema,
  CreateBranchSchema,
  UpdateBranchSchema,
  CreateSubjectSchema,
  UpdateSubjectSchema,
  CreateFacultyUserSchema,
  UpdateFacultyUserSchema,
  CreateFacultyAssignmentSchema,
  CreateTimetableEntrySchema,
  UpdateTimetableEntrySchema,
  SubmitAttendanceSessionSchema,
  SaveMarksBatchSchema
} from "../shared/schemas.js";

export const academicRouter = Router();

// =========================================================================
// 1. TIMETABLE MANAGEMENT
// =========================================================================

// Get timetable / schedule (Role-filtered: Faculty sees assigned; Student sees section; Admin sees all)
academicRouter.get("/timetable", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user!.role === "FACULTY") {
      const schedule = await prisma.courseSchedule.findMany({
        where: {
          OR: [
            { facultyId: req.user!.id },
            { facultyName: req.user!.fullName }
          ],
          isActive: true
        },
        include: {
          subject: true,
          faculty: { select: { id: true, fullName: true, department: true } }
        },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }]
      });
      res.json({ schedule });
      return;
    }

    // Student or Admin / Staff / Warden
    const branch = req.query.branch as string || req.user!.branch || "CSE";
    const year = req.query.year ? parseInt(req.query.year as string, 10) : (req.user!.year || 2);
    const semester = req.query.semester ? parseInt(req.query.semester as string, 10) : req.user!.semester;
    const section = req.query.section as string || req.user!.section;
    const course = req.query.course as string || req.user!.course;
    const facultyId = req.query.facultyId as string;

    const whereClause: any = { isActive: true };
    if (facultyId) whereClause.facultyId = facultyId;
    if (branch) whereClause.branch = branch;
    if (year) whereClause.year = year;
    if (semester) whereClause.semester = semester;
    if (section && req.user!.role === "STUDENT") whereClause.section = section;
    if (course) whereClause.course = course;

    const schedule = await prisma.courseSchedule.findMany({
      where: whereClause,
      include: {
        subject: true,
        faculty: { select: { id: true, fullName: true, department: true } }
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }]
    });

    res.json({ schedule });
  } catch (err: any) {
    console.error("Failed to load timetable:", err);
    res.status(500).json({ error: "Failed to load timetable." });
  }
});

// Get today's classes
academicRouter.get("/timetable/today", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const rawDay = new Date().getDay(); // 0 is Sun, 1 is Mon ... 6 is Sat
    // If today is Sunday (0), preview Monday (1) for convenience, or use rawDay if classes scheduled
    const dayOfWeek = rawDay === 0 ? 1 : rawDay;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    if (req.user!.role === "FACULTY") {
      const classes = await prisma.courseSchedule.findMany({
        where: {
          OR: [
            { facultyId: req.user!.id },
            { facultyName: req.user!.fullName }
          ],
          dayOfWeek,
          isActive: true
        },
        include: {
          subject: true,
          faculty: { select: { id: true, fullName: true, department: true } }
        },
        orderBy: { startTime: "asc" }
      });

      // Enrich with attendance marked status for today
      const enriched = await Promise.all(
        classes.map(async (cls) => {
          const session = await prisma.attendanceSession.findFirst({
            where: {
              facultyId: req.user!.id,
              subjectId: cls.subjectId || undefined,
              course: cls.course,
              branch: cls.branch,
              section: cls.section,
              semester: cls.semester,
              date: {
                gte: startOfDay,
                lt: endOfDay
              }
            }
          });

          return {
            ...cls,
            isAttendanceMarked: !!session,
            attendanceSessionId: session?.id || null,
            topic: session?.topic || null
          };
        })
      );

      res.json({ todayClasses: enriched, dayOfWeek });
      return;
    }

    // Student or other roles
    const branch = req.user!.branch || (req.query.branch as string) || "CSE";
    const year = req.user!.year || (req.query.year ? parseInt(req.query.year as string, 10) : 1);
    const semester = req.user!.semester || (req.query.semester ? parseInt(req.query.semester as string, 10) : 1);
    const section = req.user!.section || (req.query.section as string) || "A";
    const course = req.user!.course || (req.query.course as string) || "B.Tech";

    const classes = await prisma.courseSchedule.findMany({
      where: {
        course,
        branch,
        year,
        semester,
        section,
        dayOfWeek,
        isActive: true
      },
      include: {
        subject: true,
        faculty: { select: { id: true, fullName: true, department: true } }
      },
      orderBy: { startTime: "asc" }
    });

    res.json({ todayClasses: classes, dayOfWeek });
  } catch (err: any) {
    console.error("Failed to load today timetable:", err);
    res.status(500).json({ error: "Failed to load today's classes." });
  }
});

// Admin: Create Timetable Entry
academicRouter.post(
  "/timetable",
  requireAuth,
  requireRoles(["ADMIN"]),
  validateBody(CreateTimetableEntrySchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        dayOfWeek,
        startTime,
        endTime,
        subjectId,
        facultyId,
        course,
        branch,
        year,
        semester,
        section,
        room,
        isActive
      } = req.body;

      const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
      const faculty = await prisma.user.findUnique({ where: { id: facultyId } });

      const entry = await prisma.courseSchedule.create({
        data: {
          dayOfWeek,
          startTime,
          endTime,
          subjectId,
          facultyId,
          course: course.trim(),
          branch: branch.trim(),
          year,
          semester,
          section: (section || "A").trim().toUpperCase(),
          room: room.trim(),
          subjectCode: subject ? subject.code : "SUB",
          subjectName: subject ? subject.name : "Subject",
          facultyName: faculty ? faculty.fullName : "Faculty",
          isActive: isActive !== undefined ? isActive : true
        },
        include: {
          subject: true,
          faculty: { select: { id: true, fullName: true, department: true } }
        }
      });

      res.status(201).json({ message: "Timetable entry created.", entry });
    } catch (err: any) {
      console.error("Failed to create timetable entry:", err);
      res.status(500).json({ error: "Failed to create timetable entry." });
    }
  }
);

// Admin: Update Timetable Entry
academicRouter.put(
  "/timetable/:id",
  requireAuth,
  requireRoles(["ADMIN"]),
  validateBody(UpdateTimetableEntrySchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const data: any = { ...req.body };

      if (data.subjectId) {
        const sub = await prisma.subject.findUnique({ where: { id: data.subjectId } });
        if (sub) {
          data.subjectCode = sub.code;
          data.subjectName = sub.name;
        }
      }
      if (data.facultyId) {
        const fac = await prisma.user.findUnique({ where: { id: data.facultyId } });
        if (fac) {
          data.facultyName = fac.fullName;
        }
      }

      const updated = await prisma.courseSchedule.update({
        where: { id },
        data,
        include: {
          subject: true,
          faculty: { select: { id: true, fullName: true, department: true } }
        }
      });

      res.json({ message: "Timetable entry updated.", entry: updated });
    } catch (err: any) {
      console.error("Failed to update timetable entry:", err);
      res.status(500).json({ error: "Failed to update timetable entry." });
    }
  }
);

// Admin: Delete / Deactivate Timetable Entry
academicRouter.delete(
  "/timetable/:id",
  requireAuth,
  requireRoles(["ADMIN"]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await prisma.courseSchedule.delete({ where: { id } });
      res.json({ message: "Timetable entry deleted." });
    } catch (err: any) {
      console.error("Failed to delete timetable entry:", err);
      res.status(500).json({ error: "Failed to delete timetable entry." });
    }
  }
);

// =========================================================================
// 2. SUBJECT MANAGEMENT
// =========================================================================

// Get subjects (Auth required)
academicRouter.get("/subjects", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { course, branch, year, semester, isActive } = req.query;
    const where: any = {};
    if (course) where.course = course as string;
    if (branch) where.branch = branch as string;
    if (year) where.year = parseInt(year as string, 10);
    if (semester) where.semester = parseInt(semester as string, 10);
    if (isActive !== undefined) where.isActive = isActive === "true";

    const subjects = await prisma.subject.findMany({
      where,
      include: {
        facultyAssignments: {
          where: { isActive: true },
          include: {
            faculty: { select: { id: true, fullName: true, department: true, email: true } }
          }
        }
      },
      orderBy: [{ course: "asc" }, { semester: "asc" }, { code: "asc" }]
    });

    res.json({ subjects });
  } catch (err: any) {
    console.error("Failed to load subjects:", err);
    res.status(500).json({ error: "Failed to load subjects." });
  }
});

// Admin: Create Subject
academicRouter.post(
  "/subjects",
  requireAuth,
  requireRoles(["ADMIN"]),
  validateBody(CreateSubjectSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, code, course, branch, year, semester, section, type, credits, isActive } = req.body;

      const existing = await prisma.subject.findFirst({
        where: {
          course: course.trim(),
          branch: branch.trim(),
          semester: Number(semester),
          code: code.trim().toUpperCase()
        }
      });

      if (existing) {
        res.status(400).json({
          error: `Subject code "${code}" already exists for ${course} ${branch} Sem ${semester}.`
        });
        return;
      }

      const subject = await prisma.subject.create({
        data: {
          name: name.trim(),
          code: code.trim().toUpperCase(),
          course: course.trim(),
          branch: branch.trim(),
          year: Number(year),
          semester: Number(semester),
          type,
          credits: Number(credits) || 3,
          isActive: isActive !== undefined ? isActive : true
        }
      });

      res.status(201).json({ message: "Subject created successfully.", subject });
    } catch (err: any) {
      console.error("Failed to create subject:", err);
      res.status(500).json({ error: "Failed to create subject." });
    }
  }
);

// Admin: Update Subject
academicRouter.put(
  "/subjects/:id",
  requireAuth,
  requireRoles(["ADMIN"]),
  validateBody(UpdateSubjectSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const data: any = { ...req.body };
      if (data.code) data.code = data.code.trim().toUpperCase();
      if (data.name) data.name = data.name.trim();

      const updated = await prisma.subject.update({
        where: { id },
        data
      });

      res.json({ message: "Subject updated successfully.", subject: updated });
    } catch (err: any) {
      console.error("Failed to update subject:", err);
      res.status(500).json({ error: "Failed to update subject." });
    }
  }
);

// Admin: Toggle Subject Active/Inactive Status
academicRouter.patch(
  "/subjects/:id/status",
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

      const subject = await prisma.subject.update({
        where: { id },
        data: { isActive }
      });

      res.json({ message: `Subject ${subject.code} ${isActive ? "activated" : "deactivated"}.`, subject });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to update subject status." });
    }
  }
);

// =========================================================================
// 3. FACULTY MANAGEMENT (Admin can create, edit, activate/deactivate faculty)
// =========================================================================

// Get all faculty (Admin or Faculty)
academicRouter.get(
  "/faculty",
  requireAuth,
  requireRoles(["ADMIN", "FACULTY"]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const faculty = await prisma.user.findMany({
        where: { role: "FACULTY" },
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          department: true,
          employeeId: true,
          isActive: true,
          createdAt: true,
          facultyAssignments: {
            where: { isActive: true },
            include: { subject: true }
          }
        },
        orderBy: { fullName: "asc" }
      });

      res.json({ faculty });
    } catch (err: any) {
      console.error("Failed to load faculty:", err);
      res.status(500).json({ error: "Failed to load faculty list." });
    }
  }
);

// Admin: Create Faculty User
academicRouter.post(
  "/faculty",
  requireAuth,
  requireRoles(["ADMIN"]),
  validateBody(CreateFacultyUserSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, fullName, department, phone, employeeId } = req.body;

      const existing = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() }
      });
      if (existing) {
        res.status(400).json({ error: `User with email "${email}" already exists.` });
        return;
      }

      if (employeeId) {
        const empConflict = await prisma.user.findUnique({ where: { employeeId: employeeId.trim() } });
        if (empConflict) {
          res.status(400).json({ error: `Employee ID "${employeeId}" already exists.` });
          return;
        }
      }

      const passwordHash = await argon2.hash(password);

      const faculty = await prisma.user.create({
        data: {
          email: email.toLowerCase().trim(),
          passwordHash,
          fullName: fullName.trim(),
          role: "FACULTY",
          department: department.trim(),
          phone: phone.trim(),
          employeeId: employeeId ? employeeId.trim() : null,
          isActive: true,
          verificationStatus: "ACTIVE"
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          department: true,
          employeeId: true,
          isActive: true,
          createdAt: true
        }
      });

      res.status(201).json({ message: "Faculty member created successfully.", faculty });
    } catch (err: any) {
      console.error("Failed to create faculty:", err);
      res.status(500).json({ error: "Failed to create faculty." });
    }
  }
);

// Admin: Update Faculty User
academicRouter.put(
  "/faculty/:id",
  requireAuth,
  requireRoles(["ADMIN"]),
  validateBody(UpdateFacultyUserSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { fullName, department, phone, employeeId, isActive } = req.body;

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user || user.role !== "FACULTY") {
        res.status(404).json({ error: "Faculty member not found." });
        return;
      }

      const updated = await prisma.user.update({
        where: { id },
        data: {
          ...(fullName && { fullName: fullName.trim() }),
          ...(department && { department: department.trim() }),
          ...(phone && { phone: phone.trim() }),
          ...(employeeId !== undefined && { employeeId: employeeId ? employeeId.trim() : null }),
          ...(isActive !== undefined && { isActive })
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          department: true,
          employeeId: true,
          isActive: true
        }
      });

      res.json({ message: "Faculty updated successfully.", faculty: updated });
    } catch (err: any) {
      console.error("Failed to update faculty:", err);
      res.status(500).json({ error: "Failed to update faculty." });
    }
  }
);

// Admin: Toggle Faculty Status
academicRouter.patch(
  "/faculty/:id/status",
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

      const faculty = await prisma.user.update({
        where: { id },
        data: { isActive },
        select: { id: true, fullName: true, email: true, isActive: true }
      });

      res.json({ message: `Faculty ${faculty.fullName} ${isActive ? "activated" : "deactivated"}.`, faculty });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to update faculty status." });
    }
  }
);

// =========================================================================
// 4. FACULTY ASSIGNMENT (Subject -> Faculty -> Class / Section)
// =========================================================================

// Get Assignments (Faculty views own; Admin views all)
academicRouter.get(
  "/assignments",
  requireAuth,
  requireRoles(["ADMIN", "FACULTY"]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const where: any = { isActive: true };

      if (req.user!.role === "FACULTY") {
        where.facultyId = req.user!.id;
      } else if (req.query.facultyId) {
        where.facultyId = req.query.facultyId as string;
      }

      if (req.query.course) where.course = req.query.course as string;
      if (req.query.branch) where.branch = req.query.branch as string;
      if (req.query.semester) where.semester = parseInt(req.query.semester as string, 10);
      if (req.query.section) where.section = req.query.section as string;

      const assignments = await prisma.facultyAssignment.findMany({
        where,
        include: {
          faculty: { select: { id: true, fullName: true, email: true, department: true } },
          subject: true
        },
        orderBy: [{ course: "asc" }, { semester: "asc" }, { section: "asc" }]
      });

      res.json({ assignments });
    } catch (err: any) {
      console.error("Failed to load assignments:", err);
      res.status(500).json({ error: "Failed to load faculty assignments." });
    }
  }
);

// Admin: Create / Update Faculty Assignment
academicRouter.post(
  "/assignments",
  requireAuth,
  requireRoles(["ADMIN"]),
  validateBody(CreateFacultyAssignmentSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { facultyId, subjectId, course, branch, year, semester, section, academicYear, isActive } = req.body;

      const faculty = await prisma.user.findUnique({ where: { id: facultyId } });
      if (!faculty || faculty.role !== "FACULTY") {
        res.status(400).json({ error: "Invalid faculty member." });
        return;
      }

      const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
      if (!subject) {
        res.status(400).json({ error: "Invalid subject." });
        return;
      }

      const assignment = await prisma.facultyAssignment.upsert({
        where: {
          facultyId_subjectId_section_semester: {
            facultyId,
            subjectId,
            section: section.trim().toUpperCase(),
            semester: Number(semester)
          }
        },
        update: {
          course: course.trim(),
          branch: branch.trim(),
          year: Number(year),
          academicYear: academicYear || "2026-2027",
          isActive: isActive !== undefined ? isActive : true
        },
        create: {
          facultyId,
          subjectId,
          course: course.trim(),
          branch: branch.trim(),
          year: Number(year),
          semester: Number(semester),
          section: section.trim().toUpperCase(),
          academicYear: academicYear || "2026-2027",
          isActive: isActive !== undefined ? isActive : true
        },
        include: {
          faculty: { select: { id: true, fullName: true, department: true } },
          subject: true
        }
      });

      res.status(201).json({ message: "Faculty assigned to subject and class.", assignment });
    } catch (err: any) {
      console.error("Failed to assign faculty:", err);
      res.status(500).json({ error: "Failed to assign faculty." });
    }
  }
);

// Admin: Delete Assignment
academicRouter.delete(
  "/assignments/:id",
  requireAuth,
  requireRoles(["ADMIN"]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await prisma.facultyAssignment.delete({ where: { id } });
      res.json({ message: "Faculty assignment removed." });
    } catch (err: any) {
      console.error("Failed to delete assignment:", err);
      res.status(500).json({ error: "Failed to delete assignment." });
    }
  }
);

// =========================================================================
// 5. ATTENDANCE MODULE
// =========================================================================

// Get Students for Marking Attendance (Strict RBAC: Faculty must be assigned to this class)
academicRouter.get(
  "/attendance/class-students",
  requireAuth,
  requireRoles(["ADMIN", "FACULTY"]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const subjectId = req.query.subjectId as string;
      const course = req.query.course as string;
      const branch = req.query.branch as string;
      const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
      const semester = req.query.semester ? parseInt(req.query.semester as string, 10) : undefined;
      const section = ((req.query.section as string) || "A").trim().toUpperCase();

      if (!subjectId || !course || !branch || !semester) {
        res.status(400).json({ error: "subjectId, course, branch, and semester are required." });
        return;
      }

      // Strict backend check: Faculty must be assigned to this subject + section + semester
      if (req.user!.role === "FACULTY") {
        const assignment = await prisma.facultyAssignment.findFirst({
          where: {
            facultyId: req.user!.id,
            subjectId,
            section,
            semester,
            isActive: true
          }
        });

        if (!assignment) {
          res.status(403).json({
            error: "Forbidden. You are not authorized to access or mark attendance for this class/section."
          });
          return;
        }
      }

      const students = await prisma.user.findMany({
        where: {
          role: "STUDENT",
          isActive: true,
          course: { equals: course },
          branch: { equals: branch },
          ...(year ? { year } : {}),
          semester,
          section
        },
        select: {
          id: true,
          fullName: true,
          rollNumber: true,
          email: true,
          section: true
        },
        orderBy: { rollNumber: "asc" }
      });

      res.json({ students });
    } catch (err: any) {
      console.error("Failed to fetch class students:", err);
      res.status(500).json({ error: "Failed to fetch class students." });
    }
  }
);

// Submit Attendance Session (Faculty / Admin only. Strict RBAC for Faculty)
academicRouter.post(
  "/attendance/sessions",
  requireAuth,
  requireRoles(["ADMIN", "FACULTY"]),
  validateBody(SubmitAttendanceSessionSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        timetableEntryId,
        subjectId,
        course,
        branch,
        year,
        semester,
        section,
        date,
        startTime,
        endTime,
        records
      } = req.body;

      const normSection = (section || "A").trim().toUpperCase();

      // Strict authorization check for Faculty
      if (req.user!.role === "FACULTY") {
        const assignment = await prisma.facultyAssignment.findFirst({
          where: {
            facultyId: req.user!.id,
            subjectId,
            section: normSection,
            semester: Number(semester),
            isActive: true
          }
        });

        if (!assignment) {
          res.status(403).json({
            error: "Forbidden. You are not authorized to mark attendance for this class."
          });
          return;
        }
      }

      const facultyId = req.user!.role === "FACULTY" ? req.user!.id : (req.body.facultyId || req.user!.id);
      const subject = await prisma.subject.findUnique({ where: { id: subjectId } });

      // Create attendance session with record items
      const sessionDate = new Date(date);
      const session = await prisma.attendanceSession.create({
        data: {
          date: sessionDate,
          timetableEntryId: timetableEntryId || null,
          facultyId,
          subjectId,
          course: course.trim(),
          branch: branch.trim(),
          year: Number(year),
          semester: Number(semester),
          section: normSection,
          startTime,
          endTime,
          records: {
            create: records.map((r: any) => ({
              studentId: r.studentId,
              status: r.status,
              remarks: r.remarks || null
            }))
          }
        },
        include: {
          records: true,
          subject: true,
          faculty: { select: { fullName: true } }
        }
      });

      // Sync aggregate attendance records for each student
      if (subject) {
        for (const item of records) {
          const totalSessions = await prisma.attendanceRecordItem.count({
            where: {
              studentId: item.studentId,
              session: {
                subjectId,
                semester: Number(semester)
              }
            }
          });

          const attendedSessions = await prisma.attendanceRecordItem.count({
            where: {
              studentId: item.studentId,
              status: { in: ["PRESENT", "LATE"] },
              session: {
                subjectId,
                semester: Number(semester)
              }
            }
          });

          await prisma.attendanceRecord.upsert({
            where: {
              studentId_subjectCode_semester: {
                studentId: item.studentId,
                subjectCode: subject.code,
                semester: Number(semester)
              }
            },
            update: {
              subjectName: subject.name,
              totalClasses: totalSessions,
              attendedClasses: attendedSessions,
              updatedAt: new Date()
            },
            create: {
              studentId: item.studentId,
              subjectCode: subject.code,
              subjectName: subject.name,
              totalClasses: totalSessions,
              attendedClasses: attendedSessions,
              semester: Number(semester)
            }
          });
        }
      }

      res.status(201).json({
        message: "Attendance recorded successfully.",
        session
      });
    } catch (err: any) {
      console.error("Failed to submit attendance:", err);
      res.status(500).json({ error: "Failed to submit attendance." });
    }
  }
);

// Get student attendance summary & history (Students see only own; Admin/Faculty can specify studentId)
academicRouter.get(
  "/attendance/student",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      let studentId = req.user!.id;
      if (req.user!.role !== "STUDENT" && req.query.studentId) {
        studentId = req.query.studentId as string;
      }

      const records = await prisma.attendanceRecord.findMany({
        where: { studentId },
        orderBy: { subjectCode: "asc" }
      });

      let totalAll = 0;
      let attendedAll = 0;

      const subjectWise = records.map((r) => {
        totalAll += r.totalClasses;
        attendedAll += r.attendedClasses;
        const percentage = r.totalClasses > 0 ? Number(((r.attendedClasses / r.totalClasses) * 100).toFixed(1)) : 100;
        return {
          ...r,
          percentage,
          isShortage: percentage < 75
        };
      });

      const overallPercentage = totalAll > 0 ? Number(((attendedAll / totalAll) * 100).toFixed(1)) : 100;

      // Recent history
      const historyItems = await prisma.attendanceRecordItem.findMany({
        where: { studentId },
        include: {
          session: {
            include: {
              subject: true,
              faculty: { select: { fullName: true } }
            }
          }
        },
        orderBy: { createdAt: "desc" },
        take: 30
      });

      const history = historyItems.map((h) => ({
        id: h.id,
        date: h.session.date,
        subjectCode: h.session.subject.code,
        subjectName: h.session.subject.name,
        facultyName: h.session.faculty.fullName,
        status: h.status,
        startTime: h.session.startTime,
        endTime: h.session.endTime
      }));

      res.json({
        subjectWise,
        overall: {
          totalClasses: totalAll,
          attendedClasses: attendedAll,
          percentage: overallPercentage,
          isShortage: overallPercentage < 75
        },
        history
      });
    } catch (err: any) {
      console.error("Failed to load student attendance:", err);
      res.status(500).json({ error: "Failed to load student attendance." });
    }
  }
);

// Backward compatible legacy attendance route
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

// =========================================================================
// 6. RESULT / MARKS MODULE
// =========================================================================

// Helper to determine Grade from Total Marks (100-point scale)
function calculateGrade(total: number): string {
  if (total >= 90) return "O";
  if (total >= 80) return "E";
  if (total >= 70) return "A";
  if (total >= 60) return "B";
  if (total >= 50) return "C";
  if (total >= 40) return "D";
  return "F";
}

// Helper to determine Grade Point from Grade
function gradeToPoint(grade: string): number {
  switch (grade.toUpperCase()) {
    case "O": return 10;
    case "E": return 9;
    case "A": return 8;
    case "B": return 7;
    case "C": return 6;
    case "D": return 5;
    default: return 0;
  }
}

// Get Class Marks Roster for Faculty / Admin
academicRouter.get(
  "/results/class-marks",
  requireAuth,
  requireRoles(["ADMIN", "FACULTY"]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const subjectId = req.query.subjectId as string;
      const course = req.query.course as string;
      const branch = req.query.branch as string;
      const semester = req.query.semester ? parseInt(req.query.semester as string, 10) : undefined;
      const section = ((req.query.section as string) || "A").trim().toUpperCase();

      if (!subjectId || !course || !branch || !semester) {
        res.status(400).json({ error: "subjectId, course, branch, and semester are required." });
        return;
      }

      // Strict RBAC check for faculty
      if (req.user!.role === "FACULTY") {
        const assignment = await prisma.facultyAssignment.findFirst({
          where: {
            facultyId: req.user!.id,
            subjectId,
            section,
            semester,
            isActive: true
          }
        });

        if (!assignment) {
          res.status(403).json({
            error: "Forbidden. You are not assigned to this subject/section."
          });
          return;
        }
      }

      const students = await prisma.user.findMany({
        where: {
          role: "STUDENT",
          isActive: true,
          course: { equals: course },
          branch: { equals: branch },
          semester,
          section
        },
        select: {
          id: true,
          fullName: true,
          rollNumber: true,
          email: true,
          section: true
        },
        orderBy: { rollNumber: "asc" }
      });

      const existingResults = await prisma.studentResult.findMany({
        where: {
          subjectId,
          semester,
          section
        }
      });

      const resultsMap = new Map(existingResults.map((r) => [r.studentId, r]));

      const roster = students.map((s) => {
        const resObj = resultsMap.get(s.id);
        return {
          studentId: s.id,
          fullName: s.fullName,
          rollNumber: s.rollNumber,
          internalMarks: resObj?.internalMarks ?? null,
          assignmentMarks: resObj?.assignmentMarks ?? null,
          practicalMarks: resObj?.practicalMarks ?? null,
          endSemMarks: resObj?.endSemMarks ?? null,
          totalMarks: resObj?.totalMarks ?? null,
          grade: resObj?.grade ?? null,
          credits: resObj?.credits ?? 3,
          status: resObj?.status ?? "DRAFT"
        };
      });

      res.json({ roster });
    } catch (err: any) {
      console.error("Failed to load class marks roster:", err);
      res.status(500).json({ error: "Failed to load class marks roster." });
    }
  }
);

// Save / Publish Marks Batch (Faculty / Admin only)
academicRouter.post(
  "/results/batch-save",
  requireAuth,
  requireRoles(["ADMIN", "FACULTY"]),
  validateBody(SaveMarksBatchSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { subjectId, course, branch, year, semester, section, status, records } = req.body;
      const normSection = (section || "A").trim().toUpperCase();

      // Strict RBAC check for faculty
      if (req.user!.role === "FACULTY") {
        const assignment = await prisma.facultyAssignment.findFirst({
          where: {
            facultyId: req.user!.id,
            subjectId,
            section: normSection,
            semester: Number(semester),
            isActive: true
          }
        });

        if (!assignment) {
          res.status(403).json({
            error: "Forbidden. You are not assigned to enter marks for this class."
          });
          return;
        }
      }

      const facultyId = req.user!.role === "FACULTY" ? req.user!.id : (req.body.facultyId || req.user!.id);
      const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
      const credits = subject ? subject.credits : 3;

      for (const rec of records) {
        let total = rec.totalMarks;
        if (total === undefined || total === null) {
          total =
            (rec.internalMarks || 0) +
            (rec.assignmentMarks || 0) +
            (rec.practicalMarks || 0) +
            (rec.endSemMarks || 0);
        }

        const grade = rec.grade || calculateGrade(total);

        await prisma.studentResult.upsert({
          where: {
            studentId_subjectId_semester: {
              studentId: rec.studentId,
              subjectId,
              semester: Number(semester)
            }
          },
          update: {
            facultyId,
            course: course.trim(),
            branch: branch.trim(),
            year: Number(year),
            section: normSection,
            internalMarks: rec.internalMarks ?? null,
            assignmentMarks: rec.assignmentMarks ?? null,
            practicalMarks: rec.practicalMarks ?? null,
            endSemMarks: rec.endSemMarks ?? null,
            totalMarks: total,
            grade,
            credits: rec.credits || credits,
            status,
            ...(status === "PUBLISHED" ? { publishedAt: new Date() } : {})
          },
          create: {
            studentId: rec.studentId,
            subjectId,
            facultyId,
            course: course.trim(),
            branch: branch.trim(),
            year: Number(year),
            semester: Number(semester),
            section: normSection,
            internalMarks: rec.internalMarks ?? null,
            assignmentMarks: rec.assignmentMarks ?? null,
            practicalMarks: rec.practicalMarks ?? null,
            endSemMarks: rec.endSemMarks ?? null,
            totalMarks: total,
            grade,
            credits: rec.credits || credits,
            status,
            ...(status === "PUBLISHED" ? { publishedAt: new Date() } : {})
          }
        });
      }

      res.json({
        message: status === "PUBLISHED" ? "Marks published successfully." : "Marks saved as Draft.",
        savedCount: records.length,
        status
      });
    } catch (err: any) {
      console.error("Failed to save marks batch:", err);
      res.status(500).json({ error: "Failed to save marks." });
    }
  }
);

// Student Result Page API (Students see only published; Admin/Faculty can inspect studentId)
academicRouter.get(
  "/results/my-results",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      let studentId = req.user!.id;
      if (req.user!.role !== "STUDENT" && req.query.studentId) {
        studentId = req.query.studentId as string;
      }

      const results = await prisma.studentResult.findMany({
        where: {
          studentId,
          status: "PUBLISHED"
        },
        include: {
          subject: true,
          faculty: { select: { fullName: true } }
        },
        orderBy: [{ semester: "asc" }, { subject: { code: "asc" } }]
      });

      if (results.length === 0) {
        res.json({
          isPublished: false,
          message: "Result not published yet.",
          results: [],
          sgpa: null,
          totalCredits: 0
        });
        return;
      }

      // Calculate total credits and SGPA
      let totalCredits = 0;
      let totalCreditPoints = 0;

      const formatted = results.map((r) => {
        const point = gradeToPoint(r.grade || "F");
        const credits = r.credits || 3;
        totalCredits += credits;
        totalCreditPoints += point * credits;

        return {
          id: r.id,
          course: r.course,
          branch: r.branch,
          year: r.year,
          semester: r.semester,
          subjectCode: r.subject.code,
          subjectName: r.subject.name,
          subjectType: r.subject.type,
          credits,
          internalMarks: r.internalMarks,
          assignmentMarks: r.assignmentMarks,
          practicalMarks: r.practicalMarks,
          endSemMarks: r.endSemMarks,
          totalMarks: r.totalMarks,
          grade: r.grade,
          facultyName: r.faculty.fullName,
          publishedAt: r.publishedAt
        };
      });

      const sgpa = totalCredits > 0 ? Number((totalCreditPoints / totalCredits).toFixed(2)) : 0;

      res.json({
        isPublished: true,
        sgpa,
        totalCredits,
        results: formatted
      });
    } catch (err: any) {
      console.error("Failed to load results:", err);
      res.status(500).json({ error: "Failed to load student results." });
    }
  }
);

// =========================================================================
// 7. CLASS CANCELLATIONS
// =========================================================================

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

// Post a class cancellation (Staff / Faculty / Admin)
academicRouter.post(
  "/cancellations",
  requireAuth,
  requireRoles(["STAFF", "FACULTY", "ADMIN"]),
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
// 8. COURSE & BRANCH MASTER DATA (Read: All / Public; Manage: Admin only)
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

  if (!course) {
    return { valid: true };
  }

  if (!course.isActive) {
    return { valid: false, error: `Course "${trimmedCourse}" is currently deactivated.` };
  }

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
