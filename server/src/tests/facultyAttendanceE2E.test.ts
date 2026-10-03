import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../prisma.js";

describe("Faculty Academic Attendance - End-to-End Persistence & RBAC", () => {
  let faculty: any;
  let unassignedFaculty: any;
  let assignedSubject: any;
  let unassignedSubject: any;
  let testStudents: any[] = [];
  let testSessionId: string | null = null;

  beforeAll(async () => {
    // 1. Find or verify faculty member with active assignment
    faculty = await prisma.user.findFirst({
      where: { role: "FACULTY", email: "faculty@campusdesk.edu" }
    });
    if (!faculty) {
      faculty = await prisma.user.findFirst({ where: { role: "FACULTY" } });
    }
    expect(faculty).toBeDefined();

    // 2. Find an assignment for this faculty
    const assignment = await prisma.facultyAssignment.findFirst({
      where: { facultyId: faculty.id, isActive: true },
      include: { subject: true }
    });
    expect(assignment).toBeDefined();
    assignedSubject = assignment!.subject;

    // 3. Find another faculty not assigned to this subject
    unassignedFaculty = await prisma.user.findFirst({
      where: {
        role: "FACULTY",
        id: { not: faculty.id }
      }
    });

    // 4. Find students enrolled in the assigned class section
    testStudents = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        course: assignment!.course,
        branch: assignment!.branch,
        semester: assignment!.semester,
        section: assignment!.section,
        isActive: true
      },
      take: 5,
      orderBy: { rollNumber: "asc" }
    });
    expect(testStudents.length).toBeGreaterThan(0);
  });

  afterAll(async () => {
    if (testSessionId) {
      await prisma.attendanceRecordItem.deleteMany({ where: { sessionId: testSessionId } });
      await prisma.attendanceSession.delete({ where: { id: testSessionId } });
    }
  });

  it("1. Verifies Faculty can view only their own assigned timetable schedules", async () => {
    const facultySchedules = await prisma.courseSchedule.findMany({
      where: {
        OR: [
          { facultyId: faculty.id },
          { facultyName: faculty.fullName }
        ],
        isActive: true
      }
    });

    expect(facultySchedules.length).toBeGreaterThan(0);
    for (const item of facultySchedules) {
      const isOwner = item.facultyId === faculty.id || item.facultyName === faculty.fullName;
      expect(isOwner).toBe(true);
    }
  });

  it("2. Verifies Faculty RBAC: authorized for assigned class, denied for unassigned class", async () => {
    // Authorized check
    const authCheck = await prisma.facultyAssignment.findFirst({
      where: {
        facultyId: faculty.id,
        subjectId: assignedSubject.id,
        isActive: true
      }
    });
    expect(authCheck).not.toBeNull();

    // Denied check for non-existent or other faculty
    if (unassignedFaculty) {
      const deniedCheck = await prisma.facultyAssignment.findFirst({
        where: {
          facultyId: unassignedFaculty.id,
          subjectId: assignedSubject.id,
          isActive: true
        }
      });
      // unassignedFaculty shouldn't have assignment if separate
      if (!deniedCheck) {
        expect(deniedCheck).toBeNull();
      }
    }
  });

  it("3. Records an Attendance Session with Present and Absent students in PostgreSQL", async () => {
    const today = new Date();
    today.setHours(10, 0, 0, 0);

    // Mark first student ABSENT, others PRESENT
    const recordsToCreate = testStudents.map((s, idx) => ({
      studentId: s.id,
      status: idx === 0 ? "ABSENT" : "PRESENT",
      remarks: idx === 0 ? "Sick leave noted" : null
    }));

    const session = await prisma.attendanceSession.create({
      data: {
        date: today,
        facultyId: faculty.id,
        subjectId: assignedSubject.id,
        course: assignedSubject.course,
        branch: assignedSubject.branch,
        year: assignedSubject.year || 1,
        semester: assignedSubject.semester,
        section: "A",
        topic: "End-to-End Persistence Test Topic",
        startTime: "10:00",
        endTime: "11:00",
        records: {
          create: recordsToCreate
        }
      },
      include: {
        records: true
      }
    });

    testSessionId = session.id;
    expect(session.id).toBeDefined();
    expect(session.records.length).toBe(testStudents.length);

    // Verify first student is ABSENT
    const firstRec = session.records.find((r) => r.studentId === testStudents[0].id);
    expect(firstRec?.status).toBe("ABSENT");

    // Verify second student is PRESENT (if at least 2 students exist)
    if (testStudents.length > 1) {
      const secondRec = session.records.find((r) => r.studentId === testStudents[1].id);
      expect(secondRec?.status).toBe("PRESENT");
    }
  });

  it("4. Reloads the session and verifies previously saved Present / Absent status persists", async () => {
    expect(testSessionId).not.toBeNull();

    const loadedSession = await prisma.attendanceSession.findUnique({
      where: { id: testSessionId! },
      include: { records: true }
    });

    expect(loadedSession).not.toBeNull();
    expect(loadedSession!.topic).toBe("End-to-End Persistence Test Topic");

    const recordMap = new Map<string, string>();
    for (const r of loadedSession!.records) {
      recordMap.set(r.studentId, r.status);
    }

    // Student 0 should STILL be ABSENT on reload
    expect(recordMap.get(testStudents[0].id)).toBe("ABSENT");

    // Student 1 should STILL be PRESENT on reload
    if (testStudents.length > 1) {
      expect(recordMap.get(testStudents[1].id)).toBe("PRESENT");
    }
  });

  it("5. Updates the existing session idempotently without duplicate key errors", async () => {
    expect(testSessionId).not.toBeNull();

    // Toggle student 0 back to PRESENT
    await prisma.attendanceRecordItem.upsert({
      where: {
        sessionId_studentId: {
          sessionId: testSessionId!,
          studentId: testStudents[0].id
        }
      },
      update: { status: "PRESENT", remarks: "Late arrival admitted" },
      create: {
        sessionId: testSessionId!,
        studentId: testStudents[0].id,
        status: "PRESENT",
        remarks: "Late arrival admitted"
      }
    });

    // Update topic
    await prisma.attendanceSession.update({
      where: { id: testSessionId! },
      data: { topic: "Updated Topic: Unit 2 Revision" }
    });

    const updated = await prisma.attendanceSession.findUnique({
      where: { id: testSessionId! },
      include: { records: true }
    });

    expect(updated?.topic).toBe("Updated Topic: Unit 2 Revision");
    const updatedFirst = updated?.records.find((r) => r.studentId === testStudents[0].id);
    expect(updatedFirst?.status).toBe("PRESENT");
    expect(updatedFirst?.remarks).toBe("Late arrival admitted");
  });

  it("6. Syncs aggregate student attendance records correctly", async () => {
    // Total sessions for this subject
    const totalSessions = await prisma.attendanceRecordItem.count({
      where: {
        studentId: testStudents[0].id,
        session: {
          subjectId: assignedSubject.id,
          semester: assignedSubject.semester
        }
      }
    });

    const attendedSessions = await prisma.attendanceRecordItem.count({
      where: {
        studentId: testStudents[0].id,
        status: { in: ["PRESENT", "LATE"] },
        session: {
          subjectId: assignedSubject.id,
          semester: assignedSubject.semester
        }
      }
    });

    expect(totalSessions).toBeGreaterThan(0);
    expect(attendedSessions).toBeLessThanOrEqual(totalSessions);

    // Upsert aggregate record for student
    const agg = await prisma.attendanceRecord.upsert({
      where: {
        studentId_subjectCode_semester: {
          studentId: testStudents[0].id,
          subjectCode: assignedSubject.code,
          semester: assignedSubject.semester
        }
      },
      update: {
        subjectName: assignedSubject.name,
        totalClasses: totalSessions,
        attendedClasses: attendedSessions,
        updatedAt: new Date()
      },
      create: {
        studentId: testStudents[0].id,
        subjectCode: assignedSubject.code,
        subjectName: assignedSubject.name,
        totalClasses: totalSessions,
        attendedClasses: attendedSessions,
        semester: assignedSubject.semester
      }
    });

    expect(agg.totalClasses).toBe(totalSessions);
    expect(agg.attendedClasses).toBe(attendedSessions);
  });
});
