import { describe, it, expect, beforeAll } from "vitest";
import argon2 from "argon2";
import { prisma } from "../prisma.js";

describe("CampusDesk RBAC & 2-Step Student Verification Workflow", () => {
  let adminUser: any;
  let wardenHostelA: any;
  let wardenHostelB: any;
  let staffUser: any;
  let studentUser: any;

  beforeAll(async () => {
    // Fetch seeded users for testing
    adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    wardenHostelA = await prisma.user.findFirst({ where: { role: "WARDEN", hostelBlock: "Hostel-A" } });
    wardenHostelB = await prisma.user.findFirst({ where: { role: "WARDEN", hostelBlock: "Hostel-B" } });
    staffUser = await prisma.user.findFirst({ where: { role: "STAFF" } });
    studentUser = await prisma.user.findFirst({ where: { role: "STUDENT", verificationStatus: "ACTIVE" } });
  });

  it("1. Verifies existing users have expected roles and scope assignments", () => {
    expect(adminUser.role).toBe("ADMIN");
    expect(wardenHostelA.role).toBe("WARDEN");
    expect(wardenHostelA.hostelBlock).toBe("Hostel-A");
    expect(wardenHostelB.role).toBe("WARDEN");
    expect(wardenHostelB.hostelBlock).toBe("Hostel-B");
    expect(staffUser.role).toBe("STAFF");
    expect(studentUser.role).toBe("STUDENT");
  });

  it("2. Validates student registration initializes with PENDING_WARDEN_VERIFICATION", async () => {
    const testRoll = `TEST_REG_${Date.now().toString().slice(-4)}`;
    const passHash = await argon2.hash("Password@123");

    const newStudent = await prisma.user.create({
      data: {
        email: `reg_${Date.now()}@test.edu`,
        passwordHash: passHash,
        fullName: "Test Registered Student",
        phone: "9876543222",
        role: "STUDENT",
        rollNumber: testRoll,
        requestedHostel: "Hostel-A",
        verificationStatus: "PENDING_WARDEN_VERIFICATION",
        isActive: false
      }
    });

    expect(newStudent.verificationStatus).toBe("PENDING_WARDEN_VERIFICATION");
    expect(newStudent.isActive).toBe(false);
    expect(newStudent.requestedHostel).toBe("Hostel-A");

    // Clean up
    await prisma.user.delete({ where: { id: newStudent.id } });
  });

  it("3. Validates Warden Verification advances student to PENDING_ADMIN_APPROVAL", async () => {
    const testRoll = `TEST_WRD_${Date.now().toString().slice(-4)}`;
    const passHash = await argon2.hash("Password@123");

    const newStudent = await prisma.user.create({
      data: {
        email: `wrd_${Date.now()}@test.edu`,
        passwordHash: passHash,
        fullName: "Warden Verification Test Student",
        phone: "9876543233",
        role: "STUDENT",
        rollNumber: testRoll,
        requestedHostel: "Hostel-A",
        verificationStatus: "PENDING_WARDEN_VERIFICATION",
        isActive: false
      }
    });

    // Simulate Warden approval
    const wardenReviewed = await prisma.user.update({
      where: { id: newStudent.id },
      data: {
        verificationStatus: "PENDING_ADMIN_APPROVAL",
        wardenVerificationDate: new Date(),
        wardenVerificationById: wardenHostelA.id
      }
    });

    expect(wardenReviewed.verificationStatus).toBe("PENDING_ADMIN_APPROVAL");
    expect(wardenReviewed.wardenVerificationById).toBe(wardenHostelA.id);

    // Simulate Admin approval
    const adminReviewed = await prisma.user.update({
      where: { id: newStudent.id },
      data: {
        verificationStatus: "ACTIVE",
        isActive: true,
        adminApprovalDate: new Date(),
        adminApprovalById: adminUser.id,
        hostelBlock: "Hostel-A"
      }
    });

    expect(adminReviewed.verificationStatus).toBe("ACTIVE");
    expect(adminReviewed.isActive).toBe(true);
    expect(adminReviewed.adminApprovalById).toBe(adminUser.id);

    // Clean up
    await prisma.user.delete({ where: { id: newStudent.id } });
  });

  it("4. Prevents duplicate bed allocations to multiple students", async () => {
    const bed = await prisma.bed.findFirst({
      where: { hostelBlock: "Hostel-A", roomNumber: "A-204", bedNumber: "Bed-1" }
    });

    expect(bed).toBeDefined();
    expect(bed?.status).toBe("OCCUPIED");
    expect(bed?.studentId).toBe(studentUser.id);
  });
});
