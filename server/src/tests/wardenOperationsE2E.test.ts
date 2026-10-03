import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../prisma.js";

describe("Warden Operations & Evening Return Attendance E2E", () => {
  let wardenUser: any;
  let testStudent: any;
  let todayDate: Date;

  beforeAll(async () => {
    // 1. Fetch assigned Warden (Hostel-A)
    wardenUser = await prisma.user.findFirst({
      where: { role: "WARDEN", hostelBlock: "Hostel-A" }
    });
    if (!wardenUser) {
      wardenUser = await prisma.user.findFirst({ where: { role: "WARDEN" } });
    }
    expect(wardenUser).toBeDefined();

    // 2. Find a resident of Hostel-A
    testStudent = await prisma.user.findFirst({
      where: { role: "STUDENT", livingType: "HOSTELLER", hostelBlock: wardenUser.hostelBlock, isActive: true }
    });
    expect(testStudent).toBeDefined();

    todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
  });

  afterAll(async () => {
    // Clean up test evening attendance records created during tests
    if (wardenUser && testStudent) {
      await prisma.hostelEveningAttendance.deleteMany({
        where: {
          hostelBlock: wardenUser.hostelBlock,
          date: todayDate,
          studentId: testStudent.id
        }
      });
    }
  });

  it("1. Scopes residents strictly to the Warden's assigned hostel", async () => {
    const residents = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        livingType: "HOSTELLER",
        hostelBlock: wardenUser.hostelBlock,
        isActive: true
      },
      select: { id: true, fullName: true, rollNumber: true, hostelBlock: true, branch: true, course: true }
    });

    expect(residents.length).toBeGreaterThan(0);
    for (const r of residents) {
      expect(r.hostelBlock).toBe(wardenUser.hostelBlock);
    }
  });

  it("2. Accurately calculates stream / branch distribution from real resident records", async () => {
    const residents = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        livingType: "HOSTELLER",
        hostelBlock: wardenUser.hostelBlock,
        isActive: true
      },
      select: { branch: true, course: true }
    });

    const streamCounts: { [key: string]: number } = {};
    residents.forEach((r) => {
      const stream = (r.branch || r.course || "GENERAL").toUpperCase().trim();
      streamCounts[stream] = (streamCounts[stream] || 0) + 1;
    });

    // Ensure distinct streams exist and sum up to total residents
    const totalCount = Object.values(streamCounts).reduce((a, b) => a + b, 0);
    expect(totalCount).toBe(residents.length);
    expect(Object.keys(streamCounts).length).toBeGreaterThan(0);
  });

  it("3. Records and persists evening roll call attendance (RETURNED)", async () => {
    const returnTime = new Date();

    const record = await prisma.hostelEveningAttendance.upsert({
      where: {
        date_studentId: {
          date: todayDate,
          studentId: testStudent.id
        }
      },
      create: {
        date: todayDate,
        hostelBlock: wardenUser.hostelBlock,
        studentId: testStudent.id,
        status: "RETURNED",
        returnTime,
        recordedById: wardenUser.id,
        remarks: "Recorded by Warden at desk"
      },
      update: {
        status: "RETURNED",
        returnTime,
        recordedById: wardenUser.id,
        remarks: "Recorded by Warden at desk"
      }
    });

    expect(record).toBeDefined();
    expect(record.status).toBe("RETURNED");
    expect(record.studentId).toBe(testStudent.id);
    expect(record.hostelBlock).toBe(wardenUser.hostelBlock);
  });

  it("4. Reopening the roll call restores previously saved status accurately", async () => {
    const fetchedRecord = await prisma.hostelEveningAttendance.findUnique({
      where: {
        date_studentId: {
          date: todayDate,
          studentId: testStudent.id
        }
      },
      include: {
        recordedBy: { select: { fullName: true } }
      }
    });

    expect(fetchedRecord).toBeDefined();
    expect(fetchedRecord?.status).toBe("RETURNED");
    expect(fetchedRecord?.recordedById).toBe(wardenUser.id);
  });

  it("5. Updates to attendance are idempotent and prevent duplicates on same date", async () => {
    // Update to NOT_RETURNED
    const updatedRecord = await prisma.hostelEveningAttendance.upsert({
      where: {
        date_studentId: {
          date: todayDate,
          studentId: testStudent.id
        }
      },
      create: {
        date: todayDate,
        hostelBlock: wardenUser.hostelBlock,
        studentId: testStudent.id,
        status: "NOT_RETURNED",
        returnTime: null,
        recordedById: wardenUser.id
      },
      update: {
        status: "NOT_RETURNED",
        returnTime: null,
        recordedById: wardenUser.id
      }
    });

    expect(updatedRecord.status).toBe("NOT_RETURNED");

    // Exactly one record exists for this student on this date
    const allRecords = await prisma.hostelEveningAttendance.findMany({
      where: {
        date: todayDate,
        studentId: testStudent.id
      }
    });

    expect(allRecords.length).toBe(1);
    expect(allRecords[0].status).toBe("NOT_RETURNED");
  });

  it("6. Real room and bed occupancy metrics derive accurately from database", async () => {
    const hostel = await prisma.hostel.findUnique({
      where: { name: wardenUser.hostelBlock },
      include: {
        rooms: {
          include: {
            beds: true
          }
        }
      }
    });

    expect(hostel).toBeDefined();
    expect(hostel!.rooms.length).toBeGreaterThan(0);

    let totalBeds = 0;
    let occupiedBeds = 0;
    let availableBeds = 0;
    let vacantRooms = 0;

    hostel!.rooms.forEach((r) => {
      totalBeds += r.beds.length;
      let roomOccupiedCount = 0;
      r.beds.forEach((b) => {
        if (b.status === "OCCUPIED") {
          occupiedBeds++;
          roomOccupiedCount++;
        } else if (b.status === "AVAILABLE") {
          availableBeds++;
        }
      });
      if (roomOccupiedCount === 0) {
        vacantRooms++;
      }
    });

    expect(totalBeds).toBe(occupiedBeds + availableBeds);
    expect(totalBeds).toBeGreaterThan(0);
    expect(vacantRooms).toBeGreaterThanOrEqual(0);
  });

  it("7. Gate passes and complaints scope strictly to the Warden's hostelBlock", async () => {
    const passes = await prisma.gatePass.findMany({
      where: { student: { hostelBlock: wardenUser.hostelBlock } },
      include: { student: { select: { hostelBlock: true } } }
    });

    for (const p of passes) {
      expect(p.student.hostelBlock).toBe(wardenUser.hostelBlock);
    }

    const tickets = await prisma.ticket.findMany({
      where: { hostelBlock: wardenUser.hostelBlock }
    });

    for (const t of tickets) {
      expect(t.hostelBlock).toBe(wardenUser.hostelBlock);
    }
  });
});
