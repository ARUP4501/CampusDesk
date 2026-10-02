import { describe, it, expect } from "vitest";
import { requireRoles, AuthenticatedUser } from "../middleware/auth.middleware.js";
import { Request, Response } from "express";
import { prisma } from "../prisma.js";

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

describe("Transport Module - Role-Based Access Control (RBAC)", () => {
  const adminOnly = requireRoles(["ADMIN"]);

  describe("Non-Admin Mutations Enforcement (HTTP 403 Forbidden)", () => {
    it("should FORBID Student from performing any transport mutation", () => {
      const { req, res, next, getStatus, isNextCalled } = createMockReqRes("STUDENT");
      adminOnly(req, res, next);
      expect(getStatus()).toBe(403);
      expect(isNextCalled()).toBe(false);
    });

    it("should FORBID Staff from performing any transport mutation", () => {
      const { req, res, next, getStatus, isNextCalled } = createMockReqRes("STAFF");
      adminOnly(req, res, next);
      expect(getStatus()).toBe(403);
      expect(isNextCalled()).toBe(false);
    });

    it("should FORBID Warden from performing any transport mutation", () => {
      const { req, res, next, getStatus, isNextCalled } = createMockReqRes("WARDEN");
      adminOnly(req, res, next);
      expect(getStatus()).toBe(403);
      expect(isNextCalled()).toBe(false);
    });

    it("should ALLOW Admin to perform transport mutations", () => {
      const { req, res, next, getStatus, isNextCalled } = createMockReqRes("ADMIN");
      adminOnly(req, res, next);
      expect(getStatus()).toBe(200);
      expect(isNextCalled()).toBe(true);
    });
  });

  describe("Transport Database Relationships & CRUD Lifecycle", () => {
    let testBusId: string;
    let testRouteId: string;
    let testStopId: string;

    it("1. Admin creates a Bus with vehicle, driver, and capacity details", async () => {
      const bus = await prisma.bus.create({
        data: {
          busNumber: `TEST-BUS-${Date.now().toString().slice(-4)}`,
          vehicleNumber: "OD-02-TEST-9999",
          capacity: 45,
          driverName: "Balaram Sahoo",
          driverPhone: "+91 99370 11223",
          status: "ACTIVE"
        }
      });
      testBusId = bus.id;
      expect(bus.id).toBeDefined();
      expect(bus.capacity).toBe(45);
      expect(bus.status).toBe("ACTIVE");
    });

    it("2. Admin creates a Bus Route and assigns the bus", async () => {
      const route = await prisma.busRoute.create({
        data: {
          routeNumber: `R-TEST-${Date.now().toString().slice(-4)}`,
          routeName: "Test Campus to Railway Hub",
          description: "Testing route assignment",
          startPoint: "Campus North Gate",
          destination: "Bhubaneswar Railway Station",
          status: "ACTIVE",
          busId: testBusId
        },
        include: {
          bus: true
        }
      });
      testRouteId = route.id;
      expect(route.id).toBeDefined();
      expect(route.bus?.busNumber).toContain("TEST-BUS");
      expect(route.bus?.driverName).toBe("Balaram Sahoo");
    });

    it("3. Admin adds ordered stops to the route with pickup and drop timings", async () => {
      const stop1 = await prisma.routeStop.create({
        data: {
          routeId: testRouteId,
          stopName: "North Gate Terminal",
          location: "Gate 1 Bus Shelter",
          pickupTime: "07:15 AM",
          dropTime: "05:45 PM",
          stopOrder: 1
        }
      });
      testStopId = stop1.id;

      const stop2 = await prisma.routeStop.create({
        data: {
          routeId: testRouteId,
          stopName: "Jaydev Vihar",
          location: "Flyover Junction",
          pickupTime: "07:35 AM",
          dropTime: "05:25 PM",
          stopOrder: 2
        }
      });

      const fetchedRoute = await prisma.busRoute.findUnique({
        where: { id: testRouteId },
        include: {
          stops: { orderBy: { stopOrder: "asc" } },
          bus: true
        }
      });

      expect(fetchedRoute?.stops.length).toBe(2);
      expect(fetchedRoute?.stops[0].stopName).toBe("North Gate Terminal");
      expect(fetchedRoute?.stops[0].stopOrder).toBe(1);
      expect(fetchedRoute?.stops[1].stopName).toBe("Jaydev Vihar");
      expect(fetchedRoute?.stops[1].stopOrder).toBe(2);
    });

    it("4. Safely updates route live status and notice", async () => {
      const updated = await prisma.busRoute.update({
        where: { id: testRouteId },
        data: {
          delayStatus: "DELAYED",
          delayNotice: "15 min traffic hold at Jaydev Vihar"
        }
      });
      expect(updated.delayStatus).toBe("DELAYED");
      expect(updated.delayNotice).toContain("15 min traffic hold");
    });

    it("5. Cleans up test route, stops (cascade), and bus", async () => {
      // Deleting route cascades stops
      await prisma.busRoute.delete({ where: { id: testRouteId } });

      const remainingStops = await prisma.routeStop.findMany({
        where: { routeId: testRouteId }
      });
      expect(remainingStops.length).toBe(0);

      // Bus should still exist (or be deleted safely)
      const busStillExists = await prisma.bus.findUnique({ where: { id: testBusId } });
      expect(busStillExists).not.toBeNull();

      await prisma.bus.delete({ where: { id: testBusId } });
    });
  });
});
