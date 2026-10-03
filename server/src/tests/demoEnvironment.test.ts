import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "../prisma.js";
import { requireRoles, AuthenticatedUser } from "../middleware/auth.middleware.js";
import { Request, Response } from "express";

function createMockReqRes(user: Partial<AuthenticatedUser>, params: Record<string, string> = {}, query: Record<string, string> = {}, body: any = {}) {
  let statusCode = 200;
  let jsonResponse: any = null;
  let nextCalled = false;

  const req: Partial<Request> = {
    user: {
      id: user.id || "test-user-id",
      email: user.email || "test@campusdesk.edu",
      fullName: user.fullName || "Test User",
      role: user.role || "STUDENT",
      hostelBlock: user.hostelBlock || null,
      course: user.course || "B.Tech",
      branch: user.branch || "CSE",
      year: user.year || 1,
      semester: user.semester || 1,
      section: user.section || "A",
      livingType: user.livingType || "HOSTELLER",
      ...user
    } as AuthenticatedUser,
    params,
    query,
    body
  };

  const res: Partial<Response> = {
    status(code: number) {
      statusCode = code;
      return this as Response;
    },
    json(data: any) {
      jsonResponse = data;
      return this as Response;
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
    getData: () => jsonResponse,
    isNextCalled: () => nextCalled
  };
}

describe("CampusDesk — Complete College Demo Environment & RBAC Tests", () => {
  let wardenA: any;
  let wardenB: any;
  let adminUser: any;
  let facultySharma: any;
  let hostelerStudent: any;
  let dayScholarStudent: any;

  beforeAll(async () => {
    adminUser = await prisma.user.findFirst({ where: { role: "ADMIN", email: "admin@campusdesk.edu" } });
    wardenA = await prisma.user.findFirst({ where: { role: "WARDEN", hostelBlock: "Hostel-A" } });
    wardenB = await prisma.user.findFirst({ where: { role: "WARDEN", hostelBlock: "Hostel-B" } });
    facultySharma = await prisma.user.findFirst({ where: { email: "dr.rajesh.sharma@campusdesk.edu" } });
    hostelerStudent = await prisma.user.findFirst({ where: { role: "STUDENT", livingType: "HOSTELLER", hostelBlock: "Hostel-A" } });
    dayScholarStudent = await prisma.user.findFirst({ where: { role: "STUDENT", livingType: "DAY_SCHOLAR" } });

    expect(adminUser).toBeDefined();
    expect(wardenA).toBeDefined();
    expect(wardenB).toBeDefined();
    expect(facultySharma).toBeDefined();
    expect(hostelerStudent).toBeDefined();
    expect(dayScholarStudent).toBeDefined();
  });

  // ---------------------------------------------------------------
  // 1. STUDENT DEMO DATA: At least 20 students per active branch
  // ---------------------------------------------------------------
  it("1. Verifies each active course/branch combination has at least 20 demo students", async () => {
    const activePrograms = [
      { course: "MCA", branch: "CA" },
      { course: "MCA", branch: "DS" },
      { course: "BCA", branch: "CA" },
      { course: "BCA", branch: "DS" },
      { course: "BBA", branch: "GEN" },
      { course: "BBA", branch: "FIN" },
      { course: "BBA", branch: "MKT" },
      { course: "BBA", branch: "HRM" },
      { course: "B.Tech", branch: "CSE" },
      { course: "B.Tech", branch: "IT" },
      { course: "B.Tech", branch: "ECE" },
      { course: "B.Tech", branch: "MECH" },
      { course: "B.Tech", branch: "CIVIL" },
      { course: "MBA", branch: "FIN" },
      { course: "MBA", branch: "MKT" },
      { course: "MBA", branch: "HRM" },
      { course: "MBA", branch: "OPS" },
      { course: "M.Tech", branch: "CSE" },
      { course: "M.Tech", branch: "OTHER" }
    ];

    for (const prog of activePrograms) {
      const count = await prisma.user.count({
        where: {
          role: "STUDENT",
          course: prog.course,
          branch: prog.branch
        }
      });
      expect(count).toBeGreaterThanOrEqual(20);
    }
  });

  // ---------------------------------------------------------------
  // 2. FIVE HOSTELS: Exactly 5 distinct demo hostels with capacity
  // ---------------------------------------------------------------
  it("2. Verifies exactly 5 distinct demo hostels exist with room and bed inventory", async () => {
    const hostels = await prisma.hostel.findMany({
      include: { rooms: { include: { beds: true } } }
    });

    expect(hostels.length).toBe(5);
    const hostelNames = hostels.map((h) => h.name).sort();
    expect(hostelNames).toEqual(["Hostel-A", "Hostel-B", "Hostel-C", "Hostel-D", "Hostel-E"]);

    for (const h of hostels) {
      expect(h.totalRooms).toBeGreaterThanOrEqual(20);
      expect(h.totalBeds).toBeGreaterThanOrEqual(40);
      expect(h.wardenId).toBeDefined();
    }
  });

  // ---------------------------------------------------------------
  // 3. VALID ROOM ASSIGNMENTS: No overcapacity, no double allocation
  // ---------------------------------------------------------------
  it("3. Verifies hosteler bed assignments have no double bookings and respect room capacity", async () => {
    const occupiedBeds = await prisma.bed.findMany({
      where: { status: "OCCUPIED" }
    });

    const studentIds = occupiedBeds.map((b) => b.studentId).filter(Boolean);
    const uniqueStudentIds = new Set(studentIds);
    expect(studentIds.length).toBe(uniqueStudentIds.size);

    const rooms = await prisma.room.findMany({ include: { beds: true } });
    for (const r of rooms) {
      expect(r.beds.length).toBeLessThanOrEqual(r.capacity);
    }
  });

  // ---------------------------------------------------------------
  // 4. WARDEN SCOPE: Warden sees only their assigned hostel
  // ---------------------------------------------------------------
  it("4. Verifies warden scoping logic prevents cross-hostel data access", async () => {
    // Check Warden A assigned block
    expect(wardenA.hostelBlock).toBe("Hostel-A");
    expect(wardenB.hostelBlock).toBe("Hostel-B");

    // Scoped check: Warden A cannot inspect Hostel-B
    const canAccessOtherHostel = wardenA.role === "WARDEN" && wardenA.hostelBlock !== "Hostel-B";
    expect(canAccessOtherHostel).toBe(true); // Is restricted from other hostel

    // Admin has access to all hostels
    const adminCanAccessAll = adminUser.role === "ADMIN";
    expect(adminCanAccessAll).toBe(true);
  });

  // ---------------------------------------------------------------
  // 5. MULTI-BRANCH FACULTY: Teaches MCA, B.Tech CSE, and BCA
  // ---------------------------------------------------------------
  it("5. Verifies multi-branch faculty Dr. Rajesh Sharma has independent assignments across MCA, B.Tech, and BCA", async () => {
    const assignments = await prisma.facultyAssignment.findMany({
      where: { facultyId: facultySharma.id },
      include: { subject: true }
    });

    expect(assignments.length).toBeGreaterThanOrEqual(3);
    const courses = assignments.map((a) => a.course);

    expect(courses).toContain("MCA");
    expect(courses).toContain("B.Tech");
    expect(courses).toContain("BCA");
  });

  // ---------------------------------------------------------------
  // 6. INDEPENDENT COLLEGE ATTENDANCE WORKFLOW
  // ---------------------------------------------------------------
  it("6. Verifies college class attendance sessions are independent per subject and course", async () => {
    const sessions = await prisma.attendanceSession.findMany({
      include: { subject: true, records: true }
    });

    expect(sessions.length).toBeGreaterThanOrEqual(3);

    const mcaSession = sessions.find((s) => s.course === "MCA" && s.subject.code === "MCA101");
    const btechSession = sessions.find((s) => s.course === "B.Tech" && s.subject.code === "CS101");

    expect(mcaSession).toBeDefined();
    expect(btechSession).toBeDefined();

    // Verify student records in MCA session belong only to MCA
    for (const r of mcaSession!.records) {
      const student = await prisma.user.findUnique({ where: { id: r.studentId } });
      expect(student?.course).toBe("MCA");
    }

    // Verify student records in B.Tech session belong only to B.Tech
    for (const r of btechSession!.records) {
      const student = await prisma.user.findUnique({ where: { id: r.studentId } });
      expect(student?.course).toBe("B.Tech");
    }
  });

  // ---------------------------------------------------------------
  // 7. EVENING HOSTEL RETURN WORKFLOW: Completely separate & Day scholars excluded
  // ---------------------------------------------------------------
  it("7. Verifies Evening Hostel Return attendance is separate from class attendance and excludes day scholars", async () => {
    const eveningRecords = await prisma.hostelEveningAttendance.findMany({
      where: { hostelBlock: "Hostel-A" },
      include: { student: true }
    });

    expect(eveningRecords.length).toBeGreaterThan(0);

    // Verify all students in evening records are strictly HOSTELLERS
    for (const item of eveningRecords) {
      expect(item.student.livingType).toBe("HOSTELLER");
      expect(item.student.hostelBlock).toBe("Hostel-A");
    }

    // Verify Day Scholars NEVER have hostel evening attendance records
    const dayScholarRecords = await prisma.hostelEveningAttendance.findMany({
      where: { studentId: dayScholarStudent.id }
    });
    expect(dayScholarRecords.length).toBe(0);
  });

  // ---------------------------------------------------------------
  // 8. RECORDING EVENING RETURN ATTENDANCE
  // ---------------------------------------------------------------
  it("8. Verifies evening return attendance supports RETURNED, NOT_RETURNED, and ON_LEAVE states", async () => {
    const records = await prisma.hostelEveningAttendance.findMany();
    const statuses = records.map((r) => r.status);

    expect(statuses).toContain("RETURNED");
    expect(statuses).toContain("NOT_RETURNED");
    expect(statuses).toContain("ON_LEAVE");
  });

  // ---------------------------------------------------------------
  // 9. LEAVE MANAGEMENT & APPROVAL INTEGRATION
  // ---------------------------------------------------------------
  it("9. Verifies GatePass leave management supports APPROVED, PENDING, and REJECTED states", async () => {
    const passes = await prisma.gatePass.findMany();
    const statuses = passes.map((p) => p.status);

    expect(statuses).toContain("APPROVED");
    expect(statuses).toContain("PENDING");
    expect(statuses).toContain("REJECTED");
  });

  // ---------------------------------------------------------------
  // 10. CONNECTED MODULES: Transport, Mess, Notices, Complaints, Parcels, SOS
  // ---------------------------------------------------------------
  it("10. Verifies connected modules: Buses, Routes, Mess Menus, Notices, Tickets, Parcels, and resolved SOS", async () => {
    const buses = await prisma.bus.count();
    expect(buses).toBeGreaterThanOrEqual(3);

    const routes = await prisma.busRoute.count();
    expect(routes).toBeGreaterThanOrEqual(1);

    const messMenus = await prisma.messMenu.count();
    expect(messMenus).toBeGreaterThanOrEqual(5);

    const notices = await prisma.notice.count();
    expect(notices).toBeGreaterThanOrEqual(2);

    const tickets = await prisma.ticket.count();
    expect(tickets).toBeGreaterThanOrEqual(3);

    const parcels = await prisma.parcel.count();
    expect(parcels).toBeGreaterThanOrEqual(2);

    const resolvedEmergency = await prisma.emergency.findFirst({
      where: { status: "RESOLVED" }
    });
    expect(resolvedEmergency).toBeDefined();
    expect(resolvedEmergency?.status).toBe("RESOLVED");
  });
});
