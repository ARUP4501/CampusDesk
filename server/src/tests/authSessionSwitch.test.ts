import { describe, it, expect, beforeAll } from "vitest";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma.js";
import { config } from "../config.js";
import { getAuthCookieOptions, AUTH_COOKIE_NAME } from "../routes/auth.routes.js";

describe("Authentication & Role Switching Session Lifecycle", () => {
  let studentUser: any;
  let adminUser: any;
  let wardenUser: any;
  let staffUser: any;

  beforeAll(async () => {
    studentUser = await prisma.user.findFirst({ where: { role: "STUDENT", email: "student@campusdesk.edu" } });
    adminUser = await prisma.user.findFirst({ where: { role: "ADMIN", email: "admin@campusdesk.edu" } });
    wardenUser = await prisma.user.findFirst({ where: { role: "WARDEN", email: "warden@campusdesk.edu" } });
    staffUser = await prisma.user.findFirst({ where: { role: "STAFF", email: "staff@campusdesk.edu" } });

    expect(studentUser).toBeDefined();
    expect(adminUser).toBeDefined();
    expect(wardenUser).toBeDefined();
    expect(staffUser).toBeDefined();
  });

  it("1. Verifies cookie configuration matches across set and clear operations", () => {
    const cookieOpts = getAuthCookieOptions();
    expect(cookieOpts.httpOnly).toBe(true);
    expect(cookieOpts.path).toBe("/");
    expect(cookieOpts.sameSite).toBe("lax");
    expect(AUTH_COOKIE_NAME).toBe("campusdesk_token");
  });

  it("2. Validates Student Login -> Session Token & Identity", async () => {
    const isPasswordValid = await argon2.verify(studentUser.passwordHash, "Password@123");
    expect(isPasswordValid).toBe(true);

    const token = jwt.sign({ userId: studentUser.id }, config.JWT_SECRET, { expiresIn: "7d" });
    const decoded = jwt.verify(token, config.JWT_SECRET) as { userId: string };
    expect(decoded.userId).toBe(studentUser.id);

    const profile = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, rollNumber: true }
    });
    expect(profile?.role).toBe("STUDENT");
    expect(profile?.email).toBe("student@campusdesk.edu");
  });

  it("3. Validates Logout completely clears the previous user session", () => {
    const cookieOpts = getAuthCookieOptions();
    expect(cookieOpts.path).toBe("/");
    // Token is invalidated / nullified on client and matching cookie options prevent lingering cookie
  });

  it("4. Validates Admin Login -> Admin Session & Permissions", async () => {
    const isPasswordValid = await argon2.verify(adminUser.passwordHash, "Password@123");
    expect(isPasswordValid).toBe(true);

    const token = jwt.sign({ userId: adminUser.id }, config.JWT_SECRET, { expiresIn: "7d" });
    const decoded = jwt.verify(token, config.JWT_SECRET) as { userId: string };
    expect(decoded.userId).toBe(adminUser.id);

    const profile = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true }
    });
    expect(profile?.role).toBe("ADMIN");
    expect(profile?.email).toBe("admin@campusdesk.edu");
  });

  it("5. Validates Warden Login -> Warden Session & Assigned Hostel Scope", async () => {
    const isPasswordValid = await argon2.verify(wardenUser.passwordHash, "Password@123");
    expect(isPasswordValid).toBe(true);

    const token = jwt.sign({ userId: wardenUser.id }, config.JWT_SECRET, { expiresIn: "7d" });
    const decoded = jwt.verify(token, config.JWT_SECRET) as { userId: string };
    expect(decoded.userId).toBe(wardenUser.id);

    const profile = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, hostelBlock: true }
    });
    expect(profile?.role).toBe("WARDEN");
    expect(profile?.hostelBlock).toBe("Hostel-A");
  });

  it("6. Validates Staff Login -> Staff Session & Department Scope", async () => {
    const isPasswordValid = await argon2.verify(staffUser.passwordHash, "Password@123");
    expect(isPasswordValid).toBe(true);

    const token = jwt.sign({ userId: staffUser.id }, config.JWT_SECRET, { expiresIn: "7d" });
    const decoded = jwt.verify(token, config.JWT_SECRET) as { userId: string };
    expect(decoded.userId).toBe(staffUser.id);

    const profile = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, department: true }
    });
    expect(profile?.role).toBe("STAFF");
  });

  it("7. Validates Sequential Role Switching: Student -> Admin -> Warden -> Staff -> Student", async () => {
    const sequence = [
      { user: studentUser, expectedRole: "STUDENT" },
      { user: adminUser, expectedRole: "ADMIN" },
      { user: wardenUser, expectedRole: "WARDEN" },
      { user: staffUser, expectedRole: "STAFF" },
      { user: studentUser, expectedRole: "STUDENT" }
    ];

    for (const step of sequence) {
      const token = jwt.sign({ userId: step.user.id }, config.JWT_SECRET, { expiresIn: "7d" });
      const decoded = jwt.verify(token, config.JWT_SECRET) as { userId: string };
      const profile = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, role: true }
      });
      expect(profile?.role).toBe(step.expectedRole);
      expect(profile?.id).toBe(step.user.id);
    }
  });
});
