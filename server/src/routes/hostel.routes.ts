import { Router, Request, Response } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, requireRoles } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import {
  CreateHostelSchema,
  CreateRoomSchema,
  CreateBedSchema,
  AllocateBedSchema,
  CreateTransferRequestSchema,
  ReviewTransferRequestSchema
} from "../shared/schemas.js";

export const hostelRouter = Router();

// 1. Get Hostels & Room/Bed Breakdown
hostelRouter.get(
  "/",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const isWarden = user.role === "WARDEN";
      const isAdmin = user.role === "ADMIN";

      const whereClause: any = {};
      if (isWarden && user.hostelBlock && req.query.scoped === "true") {
        whereClause.name = user.hostelBlock;
      }

      const hostels = await prisma.hostel.findMany({
        where: whereClause,
        include: {
          rooms: {
            include: {
              beds: {
                include: {
                  student: {
                    select: {
                      id: true,
                      fullName: true,
                      rollNumber: true,
                      phone: true,
                      course: true,
                      year: true,
                      verificationStatus: true
                    }
                  }
                }
              }
            },
            orderBy: [{ floor: "asc" }, { roomNumber: "asc" }]
          }
        },
        orderBy: { name: "asc" }
      });

      // Calculate aggregated metrics
      const enrichedHostels = hostels.map((h) => {
        let totalRooms = h.rooms.length;
        let totalBeds = 0;
        let occupiedBeds = 0;
        let availableBeds = 0;
        let maintenanceBeds = 0;

        h.rooms.forEach((r) => {
          totalBeds += r.beds.length;
          r.beds.forEach((b) => {
            if (b.status === "OCCUPIED") occupiedBeds++;
            else if (b.status === "MAINTENANCE") maintenanceBeds++;
            else availableBeds++;
          });
        });

        return {
          ...h,
          totalRooms,
          totalBeds,
          occupiedBeds,
          availableBeds,
          maintenanceBeds,
          occupancyRate: totalBeds > 0 ? Number(((occupiedBeds / totalBeds) * 100).toFixed(1)) : 0
        };
      });

      res.json({ hostels: enrichedHostels });
    } catch (err: any) {
      console.error("Get hostels error:", err);
      res.status(500).json({ error: "Failed to fetch hostels." });
    }
  }
);

// 2. Admin Create Hostel (Admin Only)
hostelRouter.post(
  "/",
  requireAuth,
  requireRoles(["ADMIN"]),
  validateBody(CreateHostelSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, type, wardenId, description } = req.body;

      const existing = await prisma.hostel.findUnique({ where: { name } });
      if (existing) {
        res.status(409).json({ error: `Hostel '${name}' already exists.` });
        return;
      }

      const hostel = await prisma.hostel.create({
        data: {
          name,
          type: type || "BOYS",
          wardenId: wardenId || null,
          description: description || null
        }
      });

      await prisma.auditLog.create({
        data: {
          action: "HOSTEL_CREATED",
          actorId: req.user!.id,
          actorRole: req.user!.role,
          targetType: "HOSTEL",
          targetId: hostel.id,
          details: `Hostel ${hostel.name} (${hostel.type}) created by Admin.`,
          hostelBlock: hostel.name
        }
      });

      res.status(201).json({ message: "Hostel created successfully.", hostel });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to create hostel." });
    }
  }
);

// 3. Add Room (Admin or Warden for own hostel)
hostelRouter.post(
  "/rooms",
  requireAuth,
  requireRoles(["ADMIN", "WARDEN"]),
  validateBody(CreateRoomSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { hostelBlock, roomNumber, floor, capacity } = req.body;

      // Scope Check: Warden can only manage their own hostel
      if (req.user!.role === "WARDEN" && req.user!.hostelBlock !== hostelBlock) {
        res.status(403).json({ error: "Forbidden: You are only authorized to manage rooms in your assigned hostel." });
        return;
      }

      const hostel = await prisma.hostel.findUnique({ where: { name: hostelBlock } });
      if (!hostel) {
        res.status(404).json({ error: `Hostel '${hostelBlock}' not found.` });
        return;
      }

      const existingRoom = await prisma.room.findUnique({
        where: {
          hostelBlock_roomNumber: {
            hostelBlock,
            roomNumber
          }
        }
      });

      if (existingRoom) {
        res.status(409).json({ error: `Room '${roomNumber}' already exists in ${hostelBlock}.` });
        return;
      }

      const room = await prisma.room.create({
        data: {
          hostelId: hostel.id,
          hostelBlock,
          roomNumber,
          floor: floor || 1,
          capacity: capacity || 2
        }
      });

      // Automatically create beds for the room capacity
      const bedsToCreate = [];
      for (let i = 1; i <= (capacity || 2); i++) {
        bedsToCreate.push({
          bedNumber: `Bed-${i}`,
          roomId: room.id,
          roomNumber,
          hostelBlock,
          status: "AVAILABLE"
        });
      }
      await prisma.bed.createMany({ data: bedsToCreate });

      await prisma.auditLog.create({
        data: {
          action: "ROOM_CREATED",
          actorId: req.user!.id,
          actorRole: req.user!.role,
          targetType: "ROOM",
          targetId: room.id,
          details: `Room ${roomNumber} (capacity: ${capacity || 2}) created in ${hostelBlock}.`,
          hostelBlock
        }
      });

      res.status(201).json({ message: "Room and beds created successfully.", room });
    } catch (err: any) {
      console.error("Create room error:", err);
      res.status(500).json({ error: "Failed to create room." });
    }
  }
);

// 4. Add Individual Bed (Admin or Warden for own hostel)
hostelRouter.post(
  "/beds",
  requireAuth,
  requireRoles(["ADMIN", "WARDEN"]),
  validateBody(CreateBedSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { hostelBlock, roomNumber, bedNumber } = req.body;

      if (req.user!.role === "WARDEN" && req.user!.hostelBlock !== hostelBlock) {
        res.status(403).json({ error: "Forbidden: You are only authorized to manage beds in your assigned hostel." });
        return;
      }

      const room = await prisma.room.findUnique({
        where: {
          hostelBlock_roomNumber: {
            hostelBlock,
            roomNumber
          }
        }
      });

      if (!room) {
        res.status(404).json({ error: `Room '${roomNumber}' not found in ${hostelBlock}.` });
        return;
      }

      const existingBed = await prisma.bed.findUnique({
        where: {
          hostelBlock_roomNumber_bedNumber: {
            hostelBlock,
            roomNumber,
            bedNumber
          }
        }
      });

      if (existingBed) {
        res.status(409).json({ error: `${bedNumber} already exists in Room ${roomNumber} (${hostelBlock}).` });
        return;
      }

      const bed = await prisma.bed.create({
        data: {
          roomId: room.id,
          roomNumber,
          hostelBlock,
          bedNumber,
          status: "AVAILABLE"
        }
      });

      res.status(201).json({ message: "Bed created successfully.", bed });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to create bed." });
    }
  }
);

// 5. Allocate Bed to Student (Admin or Warden for own hostel)
hostelRouter.post(
  "/allocate",
  requireAuth,
  requireRoles(["ADMIN", "WARDEN"]),
  validateBody(AllocateBedSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { hostelBlock, roomNumber, bedNumber, studentId } = req.body;

      // Scope check
      if (req.user!.role === "WARDEN" && req.user!.hostelBlock !== hostelBlock) {
        res.status(403).json({ error: "Forbidden: You cannot allocate beds outside your assigned hostel." });
        return;
      }

      const student = await prisma.user.findUnique({ where: { id: studentId } });
      if (!student || student.role !== "STUDENT") {
        res.status(404).json({ error: "Student not found." });
        return;
      }

      // Find target bed
      const bed = await prisma.bed.findUnique({
        where: {
          hostelBlock_roomNumber_bedNumber: {
            hostelBlock,
            roomNumber,
            bedNumber
          }
        }
      });

      if (!bed) {
        res.status(404).json({ error: `Bed '${bedNumber}' in Room ${roomNumber} (${hostelBlock}) not found.` });
        return;
      }

      if (bed.status === "OCCUPIED" && bed.studentId !== studentId) {
        res.status(400).json({ error: `Bed '${bedNumber}' is already occupied by another student.` });
        return;
      }

      // Free previous bed of this student if any
      const currentBed = await prisma.bed.findFirst({
        where: { studentId }
      });
      if (currentBed && currentBed.id !== bed.id) {
        await prisma.bed.update({
          where: { id: currentBed.id },
          data: { status: "AVAILABLE", studentId: null }
        });
      }

      // Allocate new bed
      const updatedBed = await prisma.bed.update({
        where: { id: bed.id },
        data: {
          status: "OCCUPIED",
          studentId: student.id
        }
      });

      // Update student record
      await prisma.user.update({
        where: { id: student.id },
        data: {
          hostelBlock,
          roomNumber,
          bedNumber
        }
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          action: "BED_ALLOCATED",
          actorId: req.user!.id,
          actorRole: req.user!.role,
          targetType: "BED",
          targetId: bed.id,
          details: `Bed ${bedNumber} in ${roomNumber} (${hostelBlock}) allocated to ${student.fullName} (${student.rollNumber || student.email}).`,
          hostelBlock
        }
      });

      // In-App Notification to Student
      await prisma.inAppNotification.create({
        data: {
          userId: student.id,
          title: "Hostel Bed Allocation Confirmed",
          message: `You have been allocated Room ${roomNumber} (${bedNumber}) in ${hostelBlock}.`,
          type: "HOSTEL",
          linkUrl: "/dashboard"
        }
      });

      res.json({ message: "Bed allocated successfully.", bed: updatedBed });
    } catch (err: any) {
      console.error("Bed allocation error:", err);
      res.status(500).json({ error: "Failed to allocate bed." });
    }
  }
);

// 6. Deallocate Bed (Admin or Warden for own hostel)
hostelRouter.post(
  "/deallocate",
  requireAuth,
  requireRoles(["ADMIN", "WARDEN"]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { bedId } = req.body;
      if (!bedId) {
        res.status(400).json({ error: "Bed ID is required." });
        return;
      }

      const bed = await prisma.bed.findUnique({
        where: { id: bedId },
        include: { student: true }
      });

      if (!bed) {
        res.status(404).json({ error: "Bed not found." });
        return;
      }

      if (req.user!.role === "WARDEN" && req.user!.hostelBlock !== bed.hostelBlock) {
        res.status(403).json({ error: "Forbidden: You cannot deallocate beds outside your assigned hostel." });
        return;
      }

      const studentId = bed.studentId;

      await prisma.bed.update({
        where: { id: bed.id },
        data: {
          status: "AVAILABLE",
          studentId: null
        }
      });

      if (studentId) {
        await prisma.user.update({
          where: { id: studentId },
          data: {
            roomNumber: null,
            bedNumber: null
          }
        });
      }

      await prisma.auditLog.create({
        data: {
          action: "BED_DEALLOCATED",
          actorId: req.user!.id,
          actorRole: req.user!.role,
          targetType: "BED",
          targetId: bed.id,
          details: `Bed ${bed.bedNumber} in ${bed.roomNumber} (${bed.hostelBlock}) vacated.`,
          hostelBlock: bed.hostelBlock
        }
      });

      res.json({ message: "Bed deallocated successfully." });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to deallocate bed." });
    }
  }
);

// 7. Student Submit Hostel/Room Transfer Request (Student Only)
hostelRouter.post(
  "/transfers",
  requireAuth,
  requireRoles(["STUDENT"]),
  validateBody(CreateTransferRequestSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
      if (!user) {
        res.status(404).json({ error: "Student not found." });
        return;
      }

      const { toHostel, toRoom, reason } = req.body;
      const fromHostel = user.hostelBlock || "Unassigned";

      const requestNumber = `TRF-${Date.now().toString().slice(-6)}`;

      const transfer = await prisma.hostelTransferRequest.create({
        data: {
          requestNumber,
          studentId: user.id,
          fromHostel,
          fromRoom: user.roomNumber || null,
          fromBed: user.bedNumber || null,
          toHostel,
          toRoom: toRoom || null,
          reason,
          status: "PENDING_WARDEN"
        }
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          action: "TRANSFER_REQUESTED",
          actorId: user.id,
          actorRole: "STUDENT",
          targetType: "TRANSFER",
          targetId: transfer.id,
          details: `Transfer requested by ${user.fullName} from ${fromHostel} to ${toHostel}. Reason: ${reason}`,
          hostelBlock: fromHostel
        }
      });

      // Notify Current Hostel Warden
      const currentWardens = await prisma.user.findMany({
        where: { role: "WARDEN", hostelBlock: fromHostel, isActive: true }
      });
      for (const w of currentWardens) {
        await prisma.inAppNotification.create({
          data: {
            userId: w.id,
            title: "Hostel Transfer Request Submitted",
            message: `Student ${user.fullName} requested transfer from ${fromHostel} to ${toHostel}.`,
            type: "TRANSFER",
            linkUrl: "/admin"
          }
        });
      }

      res.status(201).json({ message: "Hostel transfer request submitted successfully.", transfer });
    } catch (err: any) {
      console.error("Transfer request error:", err);
      res.status(500).json({ error: "Failed to submit transfer request." });
    }
  }
);

// 8. List Hostel Transfer Requests (Role & Scope Protected)
hostelRouter.get(
  "/transfers",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const whereClause: any = {};

      if (user.role === "STUDENT") {
        whereClause.studentId = user.id;
      } else if (user.role === "WARDEN") {
        const wardenHostel = user.hostelBlock;
        if (wardenHostel) {
          whereClause.OR = [{ fromHostel: wardenHostel }, { toHostel: wardenHostel }];
        }
      } else if (user.role === "STAFF") {
        res.status(403).json({ error: "Forbidden: Staff cannot access hostel transfer records." });
        return;
      }
      // ADMIN sees all

      const transfers = await prisma.hostelTransferRequest.findMany({
        where: whereClause,
        include: {
          student: {
            select: {
              id: true,
              fullName: true,
              rollNumber: true,
              phone: true,
              course: true,
              branch: true,
              year: true
            }
          }
        },
        orderBy: { createdAt: "desc" }
      });

      res.json({ transfers });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch transfer requests." });
    }
  }
);

// 9. Warden Review Transfer Request (Warden of fromHostel or toHostel)
hostelRouter.patch(
  "/transfers/:id/warden-review",
  requireAuth,
  requireRoles(["WARDEN", "ADMIN"]),
  validateBody(ReviewTransferRequestSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { action, remark } = req.body;

      const transfer = await prisma.hostelTransferRequest.findUnique({
        where: { id },
        include: { student: true }
      });

      if (!transfer) {
        res.status(404).json({ error: "Transfer request not found." });
        return;
      }

      // Scope Check: Warden must belong to fromHostel or toHostel
      if (
        req.user!.role === "WARDEN" &&
        req.user!.hostelBlock !== transfer.fromHostel &&
        req.user!.hostelBlock !== transfer.toHostel
      ) {
        res.status(403).json({
          error: "Forbidden: You are only authorized to review transfers concerning your assigned hostel."
        });
        return;
      }

      const newStatus = action === "APPROVE" ? "PENDING_ADMIN" : "REJECTED_BY_WARDEN";

      const updated = await prisma.hostelTransferRequest.update({
        where: { id },
        data: {
          status: newStatus,
          wardenRemark: remark || (action === "APPROVE" ? "Recommended by Warden." : "Rejected by Warden.")
        }
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          action: action === "APPROVE" ? "TRANSFER_WARDEN_APPROVED" : "TRANSFER_WARDEN_REJECTED",
          actorId: req.user!.id,
          actorRole: req.user!.role,
          targetType: "TRANSFER",
          targetId: transfer.id,
          details: `Warden ${req.user!.fullName} ${action === "APPROVE" ? "recommended" : "rejected"} transfer #${transfer.requestNumber} for ${transfer.student.fullName}.`,
          hostelBlock: transfer.fromHostel
        }
      });

      // Notify Student
      await prisma.inAppNotification.create({
        data: {
          userId: transfer.studentId,
          title: `Transfer Request ${action === "APPROVE" ? "Recommended" : "Rejected"} by Warden`,
          message:
            action === "APPROVE"
              ? `Your hostel transfer request has been verified by the Warden and forwarded for Central Admin approval.`
              : `Your hostel transfer request was rejected by Warden. Reason: ${remark || "Requirements not met."}`,
          type: "TRANSFER",
          linkUrl: "/dashboard"
        }
      });

      res.json({ message: "Warden review recorded successfully.", transfer: updated });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to record warden review." });
    }
  }
);

// 10. Admin Final Approval for Transfer Request (Admin Only)
hostelRouter.patch(
  "/transfers/:id/admin-review",
  requireAuth,
  requireRoles(["ADMIN"]),
  validateBody(ReviewTransferRequestSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { action, remark } = req.body;

      const transfer = await prisma.hostelTransferRequest.findUnique({
        where: { id },
        include: { student: true }
      });

      if (!transfer) {
        res.status(404).json({ error: "Transfer request not found." });
        return;
      }

      const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED_BY_ADMIN";

      if (action === "APPROVE") {
        // Free previous bed if any
        const oldBed = await prisma.bed.findFirst({
          where: { studentId: transfer.studentId }
        });
        if (oldBed) {
          await prisma.bed.update({
            where: { id: oldBed.id },
            data: { status: "AVAILABLE", studentId: null }
          });
        }

        // Update student record to new hostel
        await prisma.user.update({
          where: { id: transfer.studentId },
          data: {
            hostelBlock: transfer.toHostel,
            roomNumber: transfer.toRoom || null,
            bedNumber: null // Warden or Admin will allocate bed in new hostel
          }
        });
      }

      const updated = await prisma.hostelTransferRequest.update({
        where: { id },
        data: {
          status: newStatus,
          adminRemark: remark || (action === "APPROVE" ? "Approved by Administration." : "Rejected by Administration.")
        }
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          action: action === "APPROVE" ? "TRANSFER_ADMIN_APPROVED" : "TRANSFER_ADMIN_REJECTED",
          actorId: req.user!.id,
          actorRole: "ADMIN",
          targetType: "TRANSFER",
          targetId: transfer.id,
          details: `Admin ${action === "APPROVE" ? "approved" : "rejected"} transfer #${transfer.requestNumber} for ${transfer.student.fullName} to ${transfer.toHostel}.`,
          hostelBlock: transfer.toHostel
        }
      });

      // Notify Student
      await prisma.inAppNotification.create({
        data: {
          userId: transfer.studentId,
          title: `Transfer Request ${action === "APPROVE" ? "Approved" : "Rejected"}`,
          message:
            action === "APPROVE"
              ? `Congratulations! Your hostel transfer to ${transfer.toHostel} has been approved by Central Administration.`
              : `Your hostel transfer request was rejected by Administration. Reason: ${remark || "Capacity constraints."}`,
          type: "TRANSFER",
          linkUrl: "/dashboard"
        }
      });

      res.json({ message: "Admin transfer decision applied successfully.", transfer: updated });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to apply admin decision." });
    }
  }
);
