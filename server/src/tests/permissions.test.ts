import { describe, it, expect } from "vitest";
import { requireRoles, AuthenticatedUser } from "../middleware/auth.middleware.js";
import { Request, Response } from "express";

function createMockReqRes(role: "STUDENT" | "WARDEN" | "STAFF" | "ADMIN") {
  const req: Partial<Request> = {
    user: {
      id: "test-user-id",
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

  return { req: req as Request, res: res as Response, next, getStatus: () => statusCode, getBody: () => jsonBody, isNextCalled: () => nextCalled };
}

describe("Role-Based Access Control (RBAC) Audit", () => {
  const noticeAndMessManagers = requireRoles(["ADMIN", "WARDEN"]);
  const adminOnly = requireRoles(["ADMIN"]);

  describe("Official Notices & Mess Menu Permissions", () => {
    it("should FORBID Student from creating/editing notices and changing mess menu (HTTP 403)", () => {
      const { req, res, next, getStatus, isNextCalled } = createMockReqRes("STUDENT");
      noticeAndMessManagers(req, res, next);
      expect(getStatus()).toBe(403);
      expect(isNextCalled()).toBe(false);
    });

    it("should FORBID Staff from creating/editing notices and changing mess menu (HTTP 403)", () => {
      const { req, res, next, getStatus, isNextCalled } = createMockReqRes("STAFF");
      noticeAndMessManagers(req, res, next);
      expect(getStatus()).toBe(403);
      expect(isNextCalled()).toBe(false);
    });

    it("should ALLOW Warden to create/edit notices and change mess menu", () => {
      const { req, res, next, getStatus, isNextCalled } = createMockReqRes("WARDEN");
      noticeAndMessManagers(req, res, next);
      expect(getStatus()).toBe(200);
      expect(isNextCalled()).toBe(true);
    });

    it("should ALLOW Admin to create/edit notices and change mess menu", () => {
      const { req, res, next, getStatus, isNextCalled } = createMockReqRes("ADMIN");
      noticeAndMessManagers(req, res, next);
      expect(getStatus()).toBe(200);
      expect(isNextCalled()).toBe(true);
    });
  });

  describe("Admin-Only System & User Management Permissions", () => {
    it("should FORBID Student from user management (HTTP 403)", () => {
      const { req, res, next, getStatus } = createMockReqRes("STUDENT");
      adminOnly(req, res, next);
      expect(getStatus()).toBe(403);
    });

    it("should FORBID Staff from user management (HTTP 403)", () => {
      const { req, res, next, getStatus } = createMockReqRes("STAFF");
      adminOnly(req, res, next);
      expect(getStatus()).toBe(403);
    });

    it("should FORBID Warden from user management (HTTP 403)", () => {
      const { req, res, next, getStatus } = createMockReqRes("WARDEN");
      adminOnly(req, res, next);
      expect(getStatus()).toBe(403);
    });

    it("should ALLOW Admin for user management", () => {
      const { req, res, next, isNextCalled } = createMockReqRes("ADMIN");
      adminOnly(req, res, next);
      expect(isNextCalled()).toBe(true);
    });
  });
});
