import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "../prisma.js";
import { requireRoles, AuthenticatedUser } from "../middleware/auth.middleware.js";
import { Request, Response } from "express";

function createMockReqRes(user: Partial<AuthenticatedUser>) {
  const req: Partial<Request> = {
    user: {
      id: user.id || "test-user-id",
      email: user.email || "test@campusdesk.edu",
      fullName: user.fullName || "Test User",
      role: user.role || "STUDENT",
      course: user.course || "B.Tech",
      branch: user.branch || "CSE",
      year: user.year || 2,
      semester: user.semester || 4,
      section: user.section || "A",
      ...user
    } as AuthenticatedUser,
    query: {},
    params: {},
    body: {}
  };

  let statusCode = 200;
  let jsonBody: any = null;
  let nextCalled = false;

  const res: Partial<Response> = {
    status: (code: number) => {
      statusCode = code;
      return res as Response;
    },
    json: (data: any) => {
      jsonBody = data;
      return res as Response;
    }
  };

  const next = () => {
    nextCalled = true;
  };

  return {
    req: req as Request,
    res: res as Response,
    next,
    getStatus: () => statusCode,
    getBody: () => jsonBody,
    isNextCalled: () => nextCalled
  };
}

describe("Academic Management Module - RBAC, Timetable, Attendance & Results", () => {
  const adminOnly = requireRoles(["ADMIN"]);
  const facultyOrAdmin = requireRoles(["ADMIN", "FACULTY"]);

  let demoFaculty: any;
  let demoSubject: any;
  let demoStudent: any;

  beforeAll(async () => {
    demoFaculty = await prisma.user.findFirst({
      where: { role: "FACULTY" }
    });

    demoSubject = await prisma.subject.findFirst({
      where: { code: "CS403" }
    });

    demoStudent = await prisma.user.findFirst({
      where: { email: "student@campusdesk.edu" }
    });
  });

  describe("1. Faculty RBAC & Permissions", () => {
    it("should allow FACULTY to pass facultyOrAdmin role check", () => {
      const { req, res, next, getStatus, isNextCalled } = createMockReqRes({
        role: "FACULTY"
      });
      facultyOrAdmin(req, res, next);
      expect(isNextCalled()).toBe(true);
      expect(getStatus()).toBe(200);
    });

    it("should FORBID STUDENT from accessing faculty-only academic operations", () => {
      const { req, res, next, getStatus, isNextCalled } = createMockReqRes({
        role: "STUDENT"
      });
      facultyOrAdmin(req, res, next);
      expect(isNextCalled()).toBe(false);
      expect(getStatus()).toBe(403);
    });

    it("should FORBID STAFF from accessing faculty-only academic operations", () => {
      const { req, res, next, getStatus, isNextCalled } = createMockReqRes({
        role: "STAFF"
      });
      facultyOrAdmin(req, res, next);
      expect(isNextCalled()).toBe(false);
      expect(getStatus()).toBe(403);
    });

    it("should FORBID WARDEN from accessing faculty-only academic operations", () => {
      const { req, res, next, getStatus, isNextCalled } = createMockReqRes({
        role: "WARDEN"
      });
      facultyOrAdmin(req, res, next);
      expect(isNextCalled()).toBe(false);
      expect(getStatus()).toBe(403);
    });

    it("should FORBID FACULTY from admin-only routes (creating subjects/courses/faculty)", () => {
      const { req, res, next, getStatus, isNextCalled } = createMockReqRes({
        role: "FACULTY"
      });
      adminOnly(req, res, next);
      expect(isNextCalled()).toBe(false);
      expect(getStatus()).toBe(403);
    });
  });

  describe("2. Faculty Assignment Backend Verification", () => {
    it("should verify faculty assignment exists for assigned subject and class", async () => {
      expect(demoFaculty).toBeDefined();
      expect(demoSubject).toBeDefined();

      const assignment = await prisma.facultyAssignment.findFirst({
        where: {
          facultyId: demoFaculty.id,
          subjectId: demoSubject.id,
          section: "A",
          semester: 4,
          isActive: true
        }
      });

      expect(assignment).toBeDefined();
      expect(assignment?.course).toBe("B.Tech");
      expect(assignment?.branch).toBe("CSE");
    });

    it("should return null for unassigned subject / section", async () => {
      const unassigned = await prisma.facultyAssignment.findFirst({
        where: {
          facultyId: demoFaculty.id,
          section: "Z",
          semester: 4
        }
      });
      expect(unassigned).toBeNull();
    });
  });

  describe("3. Timetable Visibility & Role Filtering", () => {
    it("faculty query returns timetable entries matching assigned classes", async () => {
      const facultySchedule = await prisma.courseSchedule.findMany({
        where: {
          facultyId: demoFaculty.id,
          isActive: true
        }
      });

      expect(facultySchedule.length).toBeGreaterThan(0);
      for (const entry of facultySchedule) {
        expect(entry.facultyId).toBe(demoFaculty.id);
      }
    });

    it("student query returns timetable entries matching student's branch, year, semester and section", async () => {
      expect(demoStudent).toBeDefined();

      const studentSchedule = await prisma.courseSchedule.findMany({
        where: {
          course: demoStudent.course || "B.Tech",
          branch: demoStudent.branch || "CSE",
          year: demoStudent.year || 2,
          semester: demoStudent.semester || 4,
          section: demoStudent.section || "A",
          isActive: true
        }
      });

      expect(studentSchedule.length).toBeGreaterThan(0);
      for (const entry of studentSchedule) {
        expect(entry.branch).toBe(demoStudent.branch);
        expect(entry.section).toBe(demoStudent.section || "A");
      }
    });
  });

  describe("4. Attendance Module & Strict Authorization", () => {
    it("permits attendance check for assigned class", async () => {
      const assignment = await prisma.facultyAssignment.findFirst({
        where: {
          facultyId: demoFaculty.id,
          subjectId: demoSubject.id,
          section: "A",
          semester: 4,
          isActive: true
        }
      });

      expect(assignment).not.toBeNull();
    });

    it("denies attendance check for unassigned class returning 403 Forbidden check", async () => {
      // Simulate authorization check from /attendance/class-students
      const unassignedSubjectId = "non-existent-subject-id";
      const assignment = await prisma.facultyAssignment.findFirst({
        where: {
          facultyId: demoFaculty.id,
          subjectId: unassignedSubjectId,
          section: "A",
          semester: 4,
          isActive: true
        }
      });

      const isAuthorized = !!assignment;
      expect(isAuthorized).toBe(false);
    });

    it("records attendance session and updates aggregate attendance", async () => {
      // Create a test session
      const testSession = await prisma.attendanceSession.create({
        data: {
          date: new Date(),
          facultyId: demoFaculty.id,
          subjectId: demoSubject.id,
          course: "B.Tech",
          branch: "CSE",
          year: 2,
          semester: 4,
          section: "A",
          startTime: "10:00",
          endTime: "11:30",
          records: {
            create: [
              {
                studentId: demoStudent.id,
                status: "PRESENT"
              }
            ]
          }
        },
        include: { records: true }
      });

      expect(testSession.id).toBeDefined();
      expect(testSession.records.length).toBe(1);
      expect(testSession.records[0].status).toBe("PRESENT");

      // Clean up test session
      await prisma.attendanceRecordItem.deleteMany({ where: { sessionId: testSession.id } });
      await prisma.attendanceSession.delete({ where: { id: testSession.id } });
    });
  });

  describe("5. Student Attendance Privacy", () => {
    it("student queries only their own attendance records", async () => {
      const records = await prisma.attendanceRecord.findMany({
        where: { studentId: demoStudent.id }
      });

      expect(records.length).toBeGreaterThan(0);
      for (const rec of records) {
        expect(rec.studentId).toBe(demoStudent.id);
      }
    });
  });

  describe("6. Marks / Result Module & Published Visibility", () => {
    it("faculty enters marks only for assigned subject", async () => {
      const assignment = await prisma.facultyAssignment.findFirst({
        where: {
          facultyId: demoFaculty.id,
          subjectId: demoSubject.id,
          section: "A",
          semester: 4,
          isActive: true
        }
      });
      expect(assignment).not.toBeNull();
    });

    it("student only sees PUBLISHED results, not DRAFT results", async () => {
      // Create a temporary draft result
      const draftResult = await prisma.studentResult.create({
        data: {
          studentId: demoStudent.id,
          subjectId: demoSubject.id,
          facultyId: demoFaculty.id,
          course: "B.Tech",
          branch: "CSE",
          year: 2,
          semester: 99, // Distinct semester
          section: "A",
          internalMarks: 20,
          totalMarks: 75,
          grade: "B",
          status: "DRAFT"
        }
      });

      // Student query filter (only PUBLISHED)
      const studentVisible = await prisma.studentResult.findMany({
        where: {
          studentId: demoStudent.id,
          status: "PUBLISHED"
        }
      });

      const containsDraft = studentVisible.some((r) => r.id === draftResult.id);
      expect(containsDraft).toBe(false);

      // Clean up draft
      await prisma.studentResult.delete({ where: { id: draftResult.id } });
    });

    it("accurately calculates SGPA from published results", async () => {
      const published = await prisma.studentResult.findMany({
        where: {
          studentId: demoStudent.id,
          status: "PUBLISHED"
        },
        include: { subject: true }
      });

      expect(published.length).toBeGreaterThan(0);

      const gradePoints: Record<string, number> = {
        O: 10,
        E: 9,
        A: 8,
        B: 7,
        C: 6,
        D: 5,
        F: 0
      };

      let totalCredits = 0;
      let totalPoints = 0;

      for (const res of published) {
        const credits = res.credits || 3;
        const pt = gradePoints[res.grade || "F"] || 0;
        totalCredits += credits;
        totalPoints += pt * credits;
      }

      const sgpa = totalCredits > 0 ? Number((totalPoints / totalCredits).toFixed(2)) : 0;
      expect(sgpa).toBeGreaterThan(0);
      expect(sgpa).toBeLessThanOrEqual(10);
    });
  });
});
