import { describe, it, expect } from "vitest";
import { prisma } from "../prisma.js";
import { validateCourseBranch } from "../routes/academic.routes.js";
import { requireRoles, AuthenticatedUser } from "../middleware/auth.middleware.js";
import { Request, Response } from "express";

function createMockReqRes(role: "STUDENT" | "WARDEN" | "STAFF" | "ADMIN") {
  const req: Partial<Request> = {
    user: {
      id: `test-${role.toLowerCase()}-id`,
      email: `${role.toLowerCase()}@campusdesk.edu`,
      fullName: `Test ${role}`,
      role
    } as AuthenticatedUser
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

describe("Course, Branch & SOS Emergency Verification", () => {
  const adminOnly = requireRoles(["ADMIN"]);
  const responderOnly = requireRoles(["WARDEN", "ADMIN", "STAFF"]);

  describe("1. Course -> Branch Master Validation", () => {
    it("accepts valid Course and Branch combinations from seeded master data", async () => {
      const resMca = await validateCourseBranch("MCA", "Computer Applications");
      expect(resMca.valid).toBe(true);

      const resBtech = await validateCourseBranch("B.Tech", "Computer Science & Engineering");
      expect(resBtech.valid).toBe(true);

      const resBca = await validateCourseBranch("BCA", "Data Science");
      expect(resBca.valid).toBe(true);

      const resBba = await validateCourseBranch("BBA", "Finance");
      expect(resBba.valid).toBe(true);
    });

    it("rejects invalid Course + Branch combinations with descriptive error", async () => {
      const invalidRes = await validateCourseBranch("MCA", "Civil Engineering");
      expect(invalidRes.valid).toBe(false);
      expect(invalidRes.error).toContain("does not belong to course");
      expect(invalidRes.error).toContain("MCA");

      const invalidBba = await validateCourseBranch("BBA", "Mechanical Engineering");
      expect(invalidBba.valid).toBe(false);
      expect(invalidBba.error).toContain("does not belong to course");
    });
  });

  describe("2. Course and Branch Admin Permissions", () => {
    it("forbids Student from mutating Course/Branch master data (HTTP 403)", () => {
      const { req, res, next, getStatus, isNextCalled } = createMockReqRes("STUDENT");
      adminOnly(req, res, next);
      expect(getStatus()).toBe(403);
      expect(isNextCalled()).toBe(false);
    });

    it("forbids Warden from mutating Course/Branch master data (HTTP 403)", () => {
      const { req, res, next, getStatus, isNextCalled } = createMockReqRes("WARDEN");
      adminOnly(req, res, next);
      expect(getStatus()).toBe(403);
      expect(isNextCalled()).toBe(false);
    });

    it("allows Admin to mutate Course/Branch master data (HTTP 200)", () => {
      const { req, res, next, getStatus, isNextCalled } = createMockReqRes("ADMIN");
      adminOnly(req, res, next);
      expect(getStatus()).toBe(200);
      expect(isNextCalled()).toBe(true);
    });
  });

  describe("3. Student Type: Hosteler vs Day Scholar Records", () => {
    it("verifies Hosteler student record has hostel block, room, and bed allocation", async () => {
      const hosteler = await prisma.user.findFirst({
        where: { email: "student@campusdesk.edu" }
      });
      expect(hosteler).not.toBeNull();
      expect(hosteler?.livingType).toBe("HOSTELLER");
      expect(hosteler?.hostelBlock).toBe("Hostel-A");
      expect(hosteler?.roomNumber).toBe("A-204");
      expect(hosteler?.guardianPhone).toBeDefined();
    });

    it("verifies Day Scholar student record has current address, bus route, and pickup point", async () => {
      const dayScholar = await prisma.user.findFirst({
        where: { email: "dayscholar@campusdesk.edu" }
      });
      expect(dayScholar).not.toBeNull();
      expect(dayScholar?.livingType).toBe("DAY_SCHOLAR");
      expect(dayScholar?.course).toBe("MCA");
      expect(dayScholar?.branch).toBe("Computer Applications");
      expect(dayScholar?.currentAddress).toContain("Bhubaneswar");
      expect(dayScholar?.busRoute).toBeDefined();
      expect(dayScholar?.guardianPhone).toBeDefined();
    });
  });

  describe("4. Functional SOS Alert Lifecycle & RBAC", () => {
    let testEmergencyId: string;
    let studentUser: any;
    let wardenUser: any;

    it("creates an active SOS emergency with auto-attached student context", async () => {
      studentUser = await prisma.user.findFirst({ where: { email: "student@campusdesk.edu" } });
      wardenUser = await prisma.user.findFirst({ where: { role: "WARDEN", hostelBlock: "Hostel-A" } });

      const alertNumber = `SOS-TEST-${Date.now().toString().slice(-4)}`;
      const emergency = await prisma.emergency.create({
        data: {
          alertNumber,
          studentId: studentUser.id,
          studentType: studentUser.livingType,
          category: "MEDICAL",
          location: "Hostel-A, Room A-204 (Bed-1)",
          emergencyContact: studentUser.guardianPhone || studentUser.phone,
          status: "ACTIVE"
        },
        include: {
          student: true
        }
      });

      testEmergencyId = emergency.id;
      expect(emergency.id).toBeDefined();
      expect(emergency.status).toBe("ACTIVE");
      expect(emergency.studentType).toBe("HOSTELLER");
      expect(emergency.location).toContain("Hostel-A");
      expect(emergency.emergencyContact).toBe(studentUser.guardianPhone);
    });

    it("forbids Student from updating emergency status to ACKNOWLEDGED or RESOLVED (HTTP 403)", () => {
      const { req, res, next, getStatus, isNextCalled } = createMockReqRes("STUDENT");
      responderOnly(req, res, next);
      expect(getStatus()).toBe(403);
      expect(isNextCalled()).toBe(false);
    });

    it("allows Warden or Admin to acknowledge emergency status", async () => {
      const { req, res, next, getStatus, isNextCalled } = createMockReqRes("WARDEN");
      responderOnly(req, res, next);
      expect(getStatus()).toBe(200);
      expect(isNextCalled()).toBe(true);

      const acknowledged = await prisma.emergency.update({
        where: { id: testEmergencyId },
        data: {
          status: "ACKNOWLEDGED",
          acknowledgedById: wardenUser.id,
          acknowledgedAt: new Date()
        }
      });
      expect(acknowledged.status).toBe("ACKNOWLEDGED");
      expect(acknowledged.acknowledgedById).toBe(wardenUser.id);
      expect(acknowledged.acknowledgedAt).not.toBeNull();
    });

    it("allows Warden or Admin to resolve emergency status with responder notes", async () => {
      const resolved = await prisma.emergency.update({
        where: { id: testEmergencyId },
        data: {
          status: "RESOLVED",
          resolvedById: wardenUser.id,
          resolvedAt: new Date(),
          responderNotes: "Medical first-responder team dispatched to room A-204. Student stable."
        }
      });
      expect(resolved.status).toBe("RESOLVED");
      expect(resolved.resolvedById).toBe(wardenUser.id);
      expect(resolved.responderNotes).toContain("Medical first-responder");

      // Cleanup
      await prisma.emergency.delete({ where: { id: testEmergencyId } });
    });
  });
});
