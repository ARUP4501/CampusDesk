import { Router, Request, Response } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, requireRoles } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { createNotification } from "../services/push.service.js";
import {
  CreateBusSchema,
  UpdateBusSchema,
  CreateRouteSchema,
  UpdateRouteSchema,
  CreateRouteStopSchema,
  UpdateRouteStopSchema,
  AssignBusSchema,
  UpdateTransportRouteSchema
} from "../shared/schemas.js";

export const transportRouter = Router();

// =========================================================================
// 1. OVERVIEW & METRICS (All authenticated users: Admin sees full dashboard, Students see quick counts)
// =========================================================================
transportRouter.get("/overview", requireAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const [totalBuses, activeBuses, totalRoutes, activeRoutes, totalStops] = await Promise.all([
      prisma.bus.count(),
      prisma.bus.count({ where: { status: "ACTIVE" } }),
      prisma.busRoute.count(),
      prisma.busRoute.count({ where: { status: "ACTIVE" } }),
      prisma.routeStop.count()
    ]);

    res.json({
      overview: {
        totalBuses,
        activeBuses,
        totalRoutes,
        activeRoutes,
        totalStops
      }
    });
  } catch (err: any) {
    console.error("Failed to fetch transport overview:", err);
    res.status(500).json({ error: "Failed to fetch transport overview." });
  }
});

// =========================================================================
// 2. BUS MANAGEMENT (Read: All authenticated; Create/Update/Delete: Admin only)
// =========================================================================

// List all buses
transportRouter.get("/buses", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const where: any = {};
    if (status && typeof status === "string") {
      where.status = status.toUpperCase();
    }

    const buses = await prisma.bus.findMany({
      where,
      include: {
        routes: {
          select: {
            id: true,
            routeNumber: true,
            routeName: true,
            status: true
          }
        }
      },
      orderBy: { busNumber: "asc" }
    });

    res.json({ buses });
  } catch (err: any) {
    console.error("Failed to fetch buses:", err);
    res.status(500).json({ error: "Failed to fetch buses." });
  }
});

// Get single bus details
transportRouter.get("/buses/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const bus = await prisma.bus.findUnique({
      where: { id },
      include: {
        routes: true
      }
    });

    if (!bus) {
      res.status(404).json({ error: "Bus not found." });
      return;
    }

    res.json({ bus });
  } catch (err: any) {
    console.error("Failed to fetch bus:", err);
    res.status(500).json({ error: "Failed to fetch bus." });
  }
});

// Add a bus (Admin only)
transportRouter.post(
  "/buses",
  requireAuth,
  requireRoles(["ADMIN"]),
  validateBody(CreateBusSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { busNumber, vehicleNumber, capacity, driverName, driverPhone, status } = req.body;

      const existing = await prisma.bus.findUnique({ where: { busNumber } });
      if (existing) {
        res.status(400).json({ error: `A bus with number "${busNumber}" already exists.` });
        return;
      }

      const bus = await prisma.bus.create({
        data: {
          busNumber,
          vehicleNumber,
          capacity,
          driverName,
          driverPhone,
          status: status || "ACTIVE"
        }
      });

      res.status(201).json({ message: "Bus added successfully.", bus });
    } catch (err: any) {
      console.error("Failed to create bus:", err);
      res.status(500).json({ error: err.message || "Failed to create bus." });
    }
  }
);

// Update a bus (Admin only)
transportRouter.put(
  "/buses/:id",
  requireAuth,
  requireRoles(["ADMIN"]),
  validateBody(UpdateBusSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { busNumber, vehicleNumber, capacity, driverName, driverPhone, status } = req.body;

      const existing = await prisma.bus.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ error: "Bus not found." });
        return;
      }

      if (busNumber && busNumber !== existing.busNumber) {
        const conflict = await prisma.bus.findUnique({ where: { busNumber } });
        if (conflict) {
          res.status(400).json({ error: `Bus number "${busNumber}" is already in use.` });
          return;
        }
      }

      const updatedBus = await prisma.bus.update({
        where: { id },
        data: {
          ...(busNumber !== undefined && { busNumber }),
          ...(vehicleNumber !== undefined && { vehicleNumber }),
          ...(capacity !== undefined && { capacity }),
          ...(driverName !== undefined && { driverName }),
          ...(driverPhone !== undefined && { driverPhone }),
          ...(status !== undefined && { status })
        },
        include: {
          routes: true
        }
      });

      res.json({ message: "Bus details updated successfully.", bus: updatedBus });
    } catch (err: any) {
      console.error("Failed to update bus:", err);
      res.status(500).json({ error: err.message || "Failed to update bus." });
    }
  }
);

// Delete or deactivate bus (Admin only)
transportRouter.delete(
  "/buses/:id",
  requireAuth,
  requireRoles(["ADMIN"]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const bus = await prisma.bus.findUnique({ where: { id }, include: { routes: true } });
      if (!bus) {
        res.status(404).json({ error: "Bus not found." });
        return;
      }

      // Safely unlink any routes assigned to this bus before deletion
      await prisma.busRoute.updateMany({
        where: { busId: id },
        data: { busId: null }
      });

      await prisma.bus.delete({ where: { id } });

      res.json({ message: `Bus "${bus.busNumber}" deleted successfully.` });
    } catch (err: any) {
      console.error("Failed to delete bus:", err);
      res.status(500).json({ error: "Failed to delete bus." });
    }
  }
);

// =========================================================================
// 3. ROUTE MANAGEMENT (Read: All authenticated; Create/Update/Delete/Assign: Admin only)
// =========================================================================

// List all routes (with assigned bus and ordered stops)
transportRouter.get("/routes", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { includeInactive } = req.query;
    const isAdmin = req.user?.role === "ADMIN";

    // Non-admin users see active routes by default unless specified
    const where: any = {};
    if (!isAdmin && includeInactive !== "true") {
      where.status = "ACTIVE";
    }

    const routes = await prisma.busRoute.findMany({
      where,
      include: {
        bus: true,
        stops: {
          orderBy: { stopOrder: "asc" }
        }
      },
      orderBy: { routeNumber: "asc" }
    });

    res.json({ routes });
  } catch (err: any) {
    console.error("Failed to fetch routes:", err);
    res.status(500).json({ error: "Failed to fetch routes." });
  }
});

// Single route details
transportRouter.get("/routes/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const route = await prisma.busRoute.findUnique({
      where: { id },
      include: {
        bus: true,
        stops: {
          orderBy: { stopOrder: "asc" }
        }
      }
    });

    if (!route) {
      res.status(404).json({ error: "Route not found." });
      return;
    }

    res.json({ route });
  } catch (err: any) {
    console.error("Failed to fetch route:", err);
    res.status(500).json({ error: "Failed to fetch route." });
  }
});

// Create route (Admin only)
transportRouter.post(
  "/routes",
  requireAuth,
  requireRoles(["ADMIN"]),
  validateBody(CreateRouteSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { routeNumber, routeName, description, startPoint, destination, status, busId, stops } = req.body;

      const existing = await prisma.busRoute.findUnique({ where: { routeNumber } });
      if (existing) {
        res.status(400).json({ error: `Route number "${routeNumber}" already exists.` });
        return;
      }

      if (busId) {
        const bus = await prisma.bus.findUnique({ where: { id: busId } });
        if (!bus) {
          res.status(400).json({ error: "Assigned bus not found." });
          return;
        }
      }

      const route = await prisma.busRoute.create({
        data: {
          routeNumber,
          routeName,
          description: description || null,
          startPoint,
          destination,
          status: status || "ACTIVE",
          busId: busId || null,
          ...(stops && stops.length > 0 && {
            stops: {
              create: stops.map((s: any, idx: number) => ({
                stopName: s.stopName,
                location: s.location || null,
                pickupTime: s.pickupTime,
                dropTime: s.dropTime || null,
                stopOrder: s.stopOrder !== undefined ? s.stopOrder : idx + 1
              }))
            }
          })
        },
        include: {
          bus: true,
          stops: { orderBy: { stopOrder: "asc" } }
        }
      });

      res.status(201).json({ message: "Bus route created successfully.", route });
    } catch (err: any) {
      console.error("Failed to create route:", err);
      res.status(500).json({ error: err.message || "Failed to create route." });
    }
  }
);

// Update route (Admin only)
transportRouter.put(
  "/routes/:id",
  requireAuth,
  requireRoles(["ADMIN"]),
  validateBody(UpdateRouteSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { routeNumber, routeName, description, startPoint, destination, status, busId, delayStatus, delayNotice } = req.body;

      const existing = await prisma.busRoute.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ error: "Route not found." });
        return;
      }

      if (routeNumber && routeNumber !== existing.routeNumber) {
        const conflict = await prisma.busRoute.findUnique({ where: { routeNumber } });
        if (conflict) {
          res.status(400).json({ error: `Route number "${routeNumber}" is already in use.` });
          return;
        }
      }

      if (busId) {
        const bus = await prisma.bus.findUnique({ where: { id: busId } });
        if (!bus) {
          res.status(400).json({ error: "Assigned bus not found." });
          return;
        }
      }

      const updatedRoute = await prisma.busRoute.update({
        where: { id },
        data: {
          ...(routeNumber !== undefined && { routeNumber }),
          ...(routeName !== undefined && { routeName }),
          ...(description !== undefined && { description }),
          ...(startPoint !== undefined && { startPoint }),
          ...(destination !== undefined && { destination }),
          ...(status !== undefined && { status }),
          ...(busId !== undefined && { busId }),
          ...(delayStatus !== undefined && { delayStatus }),
          ...(delayNotice !== undefined && { delayNotice })
        },
        include: {
          bus: true,
          stops: { orderBy: { stopOrder: "asc" } }
        }
      });

      res.json({ message: "Route updated successfully.", route: updatedRoute });
    } catch (err: any) {
      console.error("Failed to update route:", err);
      res.status(500).json({ error: err.message || "Failed to update route." });
    }
  }
);

// Delete route (Admin only - cascades stops safely)
transportRouter.delete(
  "/routes/:id",
  requireAuth,
  requireRoles(["ADMIN"]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const route = await prisma.busRoute.findUnique({ where: { id } });
      if (!route) {
        res.status(404).json({ error: "Route not found." });
        return;
      }

      await prisma.busRoute.delete({ where: { id } });

      res.json({ message: `Route "${route.routeNumber}" deleted successfully.` });
    } catch (err: any) {
      console.error("Failed to delete route:", err);
      res.status(500).json({ error: "Failed to delete route." });
    }
  }
);

// Assign / Unassign bus to route (Admin only)
transportRouter.patch(
  "/routes/:id/assign-bus",
  requireAuth,
  requireRoles(["ADMIN"]),
  validateBody(AssignBusSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { busId } = req.body;

      const route = await prisma.busRoute.findUnique({ where: { id } });
      if (!route) {
        res.status(404).json({ error: "Route not found." });
        return;
      }

      if (busId) {
        const bus = await prisma.bus.findUnique({ where: { id: busId } });
        if (!bus) {
          res.status(400).json({ error: "Selected bus not found." });
          return;
        }
      }

      const updated = await prisma.busRoute.update({
        where: { id },
        data: { busId },
        include: {
          bus: true,
          stops: { orderBy: { stopOrder: "asc" } }
        }
      });

      res.json({
        message: busId ? `Bus successfully assigned to route ${updated.routeNumber}.` : "Bus unassigned from route.",
        route: updated
      });
    } catch (err: any) {
      console.error("Failed to assign bus to route:", err);
      res.status(500).json({ error: "Failed to assign bus." });
    }
  }
);

// =========================================================================
// 4. ROUTE STOPS MANAGEMENT (Admin only)
// =========================================================================

// Add a stop to a route
transportRouter.post(
  "/routes/:routeId/stops",
  requireAuth,
  requireRoles(["ADMIN"]),
  validateBody(CreateRouteStopSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { routeId } = req.params;
      const { stopName, location, pickupTime, dropTime, stopOrder } = req.body;

      const route = await prisma.busRoute.findUnique({ where: { id: routeId } });
      if (!route) {
        res.status(404).json({ error: "Parent route not found." });
        return;
      }

      const stop = await prisma.routeStop.create({
        data: {
          routeId,
          stopName,
          location: location || null,
          pickupTime,
          dropTime: dropTime || null,
          stopOrder
        }
      });

      res.status(201).json({ message: "Stop added to route.", stop });
    } catch (err: any) {
      console.error("Failed to add route stop:", err);
      res.status(500).json({ error: err.message || "Failed to add stop." });
    }
  }
);

// Edit an existing stop
transportRouter.put(
  "/stops/:id",
  requireAuth,
  requireRoles(["ADMIN"]),
  validateBody(UpdateRouteStopSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { stopName, location, pickupTime, dropTime, stopOrder } = req.body;

      const existing = await prisma.routeStop.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ error: "Route stop not found." });
        return;
      }

      const updated = await prisma.routeStop.update({
        where: { id },
        data: {
          ...(stopName !== undefined && { stopName }),
          ...(location !== undefined && { location }),
          ...(pickupTime !== undefined && { pickupTime }),
          ...(dropTime !== undefined && { dropTime }),
          ...(stopOrder !== undefined && { stopOrder })
        }
      });

      res.json({ message: "Route stop updated.", stop: updated });
    } catch (err: any) {
      console.error("Failed to update route stop:", err);
      res.status(500).json({ error: err.message || "Failed to update stop." });
    }
  }
);

// Delete a stop
transportRouter.delete(
  "/stops/:id",
  requireAuth,
  requireRoles(["ADMIN"]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const existing = await prisma.routeStop.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ error: "Route stop not found." });
        return;
      }

      await prisma.routeStop.delete({ where: { id } });

      res.json({ message: `Stop "${existing.stopName}" deleted.` });
    } catch (err: any) {
      console.error("Failed to delete route stop:", err);
      res.status(500).json({ error: "Failed to delete stop." });
    }
  }
);

// =========================================================================
// 5. LIVE DELAY & NOTICE STATUS UPDATE (Admin only)
// =========================================================================
transportRouter.patch(
  "/routes/:id/status",
  requireAuth,
  requireRoles(["ADMIN"]),
  validateBody(UpdateTransportRouteSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, statusNote } = req.body;

      const route = await prisma.busRoute.findUnique({ where: { id } });
      if (!route) {
        res.status(404).json({ error: "Route not found." });
        return;
      }

      const updated = await prisma.busRoute.update({
        where: { id },
        data: {
          delayStatus: status,
          delayNotice: statusNote || null
        },
        include: {
          bus: true,
          stops: { orderBy: { stopOrder: "asc" } }
        }
      });

      // Broadcast notification to Day Scholars enrolled in this route
      const affectedStudents = await prisma.user.findMany({
        where: {
          role: "STUDENT",
          livingType: "DAY_SCHOLAR",
          busRoute: route.routeNumber
        },
        select: { id: true }
      });

      for (const s of affectedStudents) {
        await createNotification(
          s.id,
          `Bus Transit Update: ${route.routeNumber}`,
          `Status: ${status}.${statusNote ? ` Notice: "${statusNote}"` : ""}`,
          "TRANSPORT",
          `/transport`
        );
      }

      res.json({
        message: `Route status updated to ${status}.`,
        route: updated
      });
    } catch (err: any) {
      console.error("Failed to update route delay status:", err);
      res.status(500).json({ error: "Failed to update transit status." });
    }
  }
);

// =========================================================================
// 6. BACKWARD COMPATIBILITY ENDPOINT (GET / returns routes)
// =========================================================================
transportRouter.get("/", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const routes = await prisma.busRoute.findMany({
      where: req.user?.role === "ADMIN" ? {} : { status: "ACTIVE" },
      include: {
        bus: true,
        stops: {
          orderBy: { stopOrder: "asc" }
        }
      },
      orderBy: { routeNumber: "asc" }
    });

    res.json({ routes });
  } catch (err: any) {
    console.error("Failed to fetch routes:", err);
    res.status(500).json({ error: "Failed to fetch routes." });
  }
});
