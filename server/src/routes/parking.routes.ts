import { Router, Request, Response } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, requireRoles } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { UpdateParkingZoneSchema } from "../shared/schemas.js";

export const parkingRouter = Router();

// List all campus parking zones with live slot counts
parkingRouter.get("/", requireAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const zones = await prisma.parkingZone.findMany({
      orderBy: { name: "asc" }
    });

    const parsedZones = zones.map((z) => {
      const freeSlots = Math.max(0, z.totalSlots - z.occupiedSlots);
      const occupancyRate = z.totalSlots > 0 ? (z.occupiedSlots / z.totalSlots) * 100 : 0;
      return {
        ...z,
        freeSlots,
        occupancyRate: Math.round(occupancyRate)
      };
    });

    res.json({ parkingZones: parsedZones, parkingLots: parsedZones });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch parking zones." });
  }
});

// Update parking lot occupancy or status (Security Guard / Admin)
parkingRouter.patch(
  "/:id/status",
  requireAuth,
  requireRoles(["STAFF", "WARDEN", "ADMIN"]),
  validateBody(UpdateParkingZoneSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { occupiedSlots, status, notice } = req.body;

      const zone = await prisma.parkingZone.findUnique({ where: { id } });
      if (!zone) {
        res.status(404).json({ error: "Parking zone not found." });
        return;
      }

      let computedStatus = status || zone.status;
      if (!status) {
        computedStatus = occupiedSlots >= zone.totalSlots ? "FULL" : "AVAILABLE";
      }

      const updated = await prisma.parkingZone.update({
        where: { id },
        data: {
          occupiedSlots,
          status: computedStatus,
          notice: notice !== undefined ? notice : zone.notice,
          updatedAt: new Date()
        }
      });

      res.json({
        message: "Parking zone status updated.",
        parkingZone: updated
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to update parking zone." });
    }
  }
);
