import { describe, it, expect, beforeAll } from "vitest";
import express from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import request from "supertest";
import { prisma } from "../prisma.js";
import { config } from "../config.js";
import { directoryRouter } from "../routes/directory.routes.js";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/directory", directoryRouter);

describe("Emergency Directory & Department Catalog API Test Suite", () => {
  let studentUser: any;
  let wardenUser: any;
  let adminUser: any;
  let studentToken: string;
  let wardenToken: string;
  let adminToken: string;

  beforeAll(async () => {
    studentUser = await prisma.user.findFirst({ where: { role: "STUDENT" } });
    wardenUser = await prisma.user.findFirst({ where: { role: "WARDEN" } });
    adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });

    expect(studentUser).toBeDefined();
    expect(wardenUser).toBeDefined();
    expect(adminUser).toBeDefined();

    studentToken = jwt.sign({ userId: studentUser.id }, config.JWT_SECRET, { expiresIn: "1d" });
    wardenToken = jwt.sign({ userId: wardenUser.id }, config.JWT_SECRET, { expiresIn: "1d" });
    adminToken = jwt.sign({ userId: adminUser.id }, config.JWT_SECRET, { expiresIn: "1d" });
  });

  it("1. Rejects unauthenticated directory access with 401", async () => {
    const res = await request(app).get("/api/directory");
    expect(res.status).toBe(401);
  });

  it("2. Returns complete emergency directory & hotlines for authenticated student", async () => {
    const res = await request(app)
      .get("/api/directory")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.services)).toBe(true);
    expect(Array.isArray(res.body.directory)).toBe(true);
    expect(res.body.directory.length).toBeGreaterThanOrEqual(7);

    // Verify dual naming support for frontend compatibility
    const securityEntry = res.body.directory.find((d: any) => d.id === "security_office");
    expect(securityEntry).toBeDefined();
    expect(securityEntry.title).toBeDefined();
    expect(securityEntry.department).toBeDefined();
    expect(securityEntry.department).toBe(securityEntry.title);
    expect(securityEntry.phone).toBeDefined();
    expect(securityEntry.contactPhone).toBeDefined();
    expect(securityEntry.email).toBeDefined();
    expect(securityEntry.contactEmail).toBeDefined();
    expect(securityEntry.actionUrl).toBeDefined();
    expect(securityEntry.actionLink).toBeDefined();
    expect(securityEntry.isEmergency).toBe(true);

    // Verify emergency hotlines
    expect(Array.isArray(res.body.hotlines)).toBe(true);
    expect(res.body.hotlines.length).toBeGreaterThanOrEqual(4);
    const securityHotline = res.body.hotlines.find((h: any) => h.id === "hl_security");
    expect(securityHotline).toBeDefined();
    expect(securityHotline.phone).toBe("1800-CAMPUS");
  });

  it("3. Dynamically attaches all active hostel wardens to warden office directory entry", async () => {
    const res = await request(app)
      .get("/api/directory")
      .set("Authorization", `Bearer ${wardenToken}`);

    expect(res.status).toBe(200);
    const wardenEntry = res.body.directory.find((d: any) => d.id === "warden_office");
    expect(wardenEntry).toBeDefined();
    expect(Array.isArray(wardenEntry.wardens)).toBe(true);
    expect(wardenEntry.wardens.length).toBeGreaterThan(0);

    const firstWarden = wardenEntry.wardens[0];
    expect(firstWarden.name).toBeDefined();
    expect(firstWarden.block).toBeDefined();
    expect(firstWarden.phone).toBeDefined();
    expect(firstWarden.email).toBeDefined();
  });

  it("4. Accessible by Admin, Warden, and Student alike", async () => {
    const adminRes = await request(app)
      .get("/api/directory")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(adminRes.status).toBe(200);

    const wardenRes = await request(app)
      .get("/api/directory")
      .set("Authorization", `Bearer ${wardenToken}`);
    expect(wardenRes.status).toBe(200);

    const studentRes = await request(app)
      .get("/api/directory")
      .set("Authorization", `Bearer ${studentToken}`);
    expect(studentRes.status).toBe(200);
  });
});
