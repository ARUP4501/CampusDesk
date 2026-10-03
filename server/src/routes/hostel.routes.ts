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
const handleAllocateBed = async (req: Request, res: Response): Promise<void> => {
  try {
    let { hostelBlock, roomNumber, bedNumber, studentId, bedId } = req.body;

    // If bedId is provided instead of room/bed details, resolve them from database
    if (bedId && (!hostelBlock || !roomNumber || !bedNumber)) {
      const targetBed = await prisma.bed.findUnique({ where: { id: bedId } });
      if (!targetBed) {
        res.status(404).json({ error: "Selected bed not found." });
        return;
      }
      hostelBlock = targetBed.hostelBlock;
      roomNumber = targetBed.roomNumber;
      bedNumber = targetBed.bedNumber;
    }

    if (!hostelBlock || !roomNumber || !bedNumber || !studentId) {
      res.status(400).json({ error: "Hostel block, room number, bed number, and student ID are required." });
      return;
    }

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
};

hostelRouter.post("/allocate", requireAuth, requireRoles(["ADMIN", "WARDEN"]), handleAllocateBed);
hostelRouter.post("/beds/allocate", requireAuth, requireRoles(["ADMIN", "WARDEN"]), handleAllocateBed);

// 6. Deallocate Bed (Admin or Warden for own hostel)
const handleDeallocateBed = async (req: Request, res: Response): Promise<void> => {
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
};

hostelRouter.post("/deallocate", requireAuth, requireRoles(["ADMIN", "WARDEN"]), handleDeallocateBed);
hostelRouter.post("/beds/vacate", requireAuth, requireRoles(["ADMIN", "WARDEN"]), handleDeallocateBed);

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

// ----------------------------------------------------
// 11. Evening Hostel Return & Curfew Attendance Summary
// ----------------------------------------------------
hostelRouter.get(
  "/evening-return/summary",
  requireAuth,
  requireRoles(["WARDEN", "STAFF", "ADMIN"]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const isWarden = user.role === "WARDEN";
      const queryDateStr = req.query.date as string;
      const targetDate = queryDateStr ? new Date(queryDateStr) : new Date();
      targetDate.setHours(0, 0, 0, 0);

      const whereClause: any = {};
      if (isWarden && user.hostelBlock && req.query.scoped === "true") {
        whereClause.name = user.hostelBlock;
      }

      const hostels = await prisma.hostel.findMany({
        where: whereClause,
        orderBy: { name: "asc" }
      });

      // Find all wardens for display
      const wardens = await prisma.user.findMany({
        where: { role: "WARDEN" },
        select: { id: true, fullName: true, hostelBlock: true }
      });
      const wardenMap = new Map<string, string>();
      wardens.forEach((w) => {
        if (w.hostelBlock) wardenMap.set(w.hostelBlock, w.fullName);
      });

      const summaries = await Promise.all(
        hostels.map(async (h) => {
          // Only active HOSTELLER residents in this hostel block (day scholars excluded)
          const residents = await prisma.user.findMany({
            where: {
              role: "STUDENT",
              livingType: "HOSTELLER",
              hostelBlock: h.name,
              isActive: true
            },
            select: {
              id: true,
              fullName: true,
              rollNumber: true,
              hostelBlock: true,
              roomNumber: true,
              bedNumber: true,
              phone: true,
              course: true,
              branch: true
            },
            orderBy: [{ roomNumber: "asc" }, { fullName: "asc" }]
          });

          // Fetch evening attendance for this targetDate
          const eveningRecords = await prisma.hostelEveningAttendance.findMany({
            where: {
              hostelBlock: h.name,
              date: targetDate
            },
            include: {
              recordedBy: { select: { fullName: true, role: true } }
            }
          });
          const recordMap = new Map(eveningRecords.map((r) => [r.studentId, r]));

          // Fetch active approved gate passes on this date
          const activeGatePasses = await prisma.gatePass.findMany({
            where: {
              student: { hostelBlock: h.name },
              status: { in: ["APPROVED", "EXITED"] },
              departureDate: { lte: new Date(targetDate.getTime() + 86400000 - 1) },
              expectedReturnDate: { gte: targetDate }
            },
            select: { studentId: true, type: true, passNumber: true, expectedReturnDate: true }
          });
          const gatePassMap = new Map(activeGatePasses.map((g) => [g.studentId, g]));

          let returnedCount = 0;
          let notReturnedCount = 0;
          let onLeaveCount = 0;
          const unreturnedResidents: any[] = [];

          residents.forEach((student) => {
            const record = recordMap.get(student.id);
            const pass = gatePassMap.get(student.id);

            let status = "NOT_RETURNED";
            if (record) {
              status = record.status;
            } else if (pass) {
              status = "ON_LEAVE";
            }

            if (status === "RETURNED") {
              returnedCount++;
            } else if (status === "ON_LEAVE") {
              onLeaveCount++;
            } else {
              notReturnedCount++;
              unreturnedResidents.push({
                ...student,
                status,
                hasApprovedGatePass: !!pass,
                gatePassInfo: pass || null,
                remarks: record?.remarks || "Awaiting evening return roll call"
              });
            }
          });

          return {
            id: h.id,
            hostelBlock: h.name,
            type: h.type,
            wardenName: wardenMap.get(h.name) || "Assigned Warden",
            totalResidents: residents.length,
            returnedCount,
            notReturnedCount,
            onLeaveCount,
            returnRate:
              residents.length > 0
                ? Number(((returnedCount / residents.length) * 100).toFixed(1))
                : 0,
            unreturnedResidents
          };
        })
      );

      res.json({ date: targetDate.toISOString(), summaries });
    } catch (err: any) {
      console.error("Evening return summary error:", err);
      res.status(500).json({ error: "Failed to fetch evening return summary." });
    }
  }
);

// ----------------------------------------------------
// 12. Hostel-Specific Evening Return Roster & Details
// ----------------------------------------------------
hostelRouter.get(
  "/:hostelBlock/evening-return",
  requireAuth,
  requireRoles(["WARDEN", "STAFF", "ADMIN"]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { hostelBlock } = req.params;
      const user = req.user!;

      // Scope Check: Warden can only see their own hostel
      if (user.role === "WARDEN" && user.hostelBlock && user.hostelBlock !== hostelBlock) {
        res.status(403).json({
          error: `Forbidden: You are assigned to ${user.hostelBlock} and cannot view ${hostelBlock}.`
        });
        return;
      }

      const queryDateStr = req.query.date as string;
      const targetDate = queryDateStr ? new Date(queryDateStr) : new Date();
      targetDate.setHours(0, 0, 0, 0);

      // Fetch only hostel residents belonging to this block (strictly HOSTELLER)
      const residents = await prisma.user.findMany({
        where: {
          role: "STUDENT",
          livingType: "HOSTELLER",
          hostelBlock: hostelBlock,
          isActive: true
        },
        select: {
          id: true,
          fullName: true,
          rollNumber: true,
          hostelBlock: true,
          roomNumber: true,
          bedNumber: true,
          phone: true,
          course: true,
          branch: true,
          year: true,
          semester: true
        },
        orderBy: [{ roomNumber: "asc" }, { fullName: "asc" }]
      });

      const eveningRecords = await prisma.hostelEveningAttendance.findMany({
        where: {
          hostelBlock: hostelBlock,
          date: targetDate
        },
        include: {
          recordedBy: { select: { fullName: true, role: true } }
        }
      });
      const recordMap = new Map(eveningRecords.map((r) => [r.studentId, r]));

      const activeGatePasses = await prisma.gatePass.findMany({
        where: {
          student: { hostelBlock: hostelBlock },
          status: { in: ["APPROVED", "EXITED"] },
          departureDate: { lte: new Date(targetDate.getTime() + 86400000 - 1) },
          expectedReturnDate: { gte: targetDate }
        },
        select: {
          id: true,
          studentId: true,
          type: true,
          passNumber: true,
          departureDate: true,
          expectedReturnDate: true,
          status: true
        }
      });
      const gatePassMap = new Map(activeGatePasses.map((g) => [g.studentId, g]));

      let returnedCount = 0;
      let notReturnedCount = 0;
      let onLeaveCount = 0;

      const roster = residents.map((student) => {
        const record = recordMap.get(student.id);
        const pass = gatePassMap.get(student.id);

        let status = "NOT_RETURNED";
        if (record) {
          status = record.status;
        } else if (pass) {
          status = "ON_LEAVE";
        }

        if (status === "RETURNED") returnedCount++;
        else if (status === "ON_LEAVE") onLeaveCount++;
        else notReturnedCount++;

        return {
          studentId: student.id,
          fullName: student.fullName,
          rollNumber: student.rollNumber,
          roomNumber: student.roomNumber,
          bedNumber: student.bedNumber,
          phone: student.phone,
          course: student.course,
          branch: student.branch,
          year: student.year,
          semester: student.semester,
          status,
          returnTime: record?.returnTime || null,
          recordedBy: record?.recordedBy?.fullName || null,
          remarks: record?.remarks || (pass ? `Approved ${pass.type} Leave (#${pass.passNumber})` : null),
          hasApprovedGatePass: !!pass,
          gatePass: pass || null,
          recordId: record?.id || null
        };
      });

      res.json({
        hostelBlock,
        date: targetDate.toISOString(),
        stats: {
          totalResidents: residents.length,
          returnedCount,
          notReturnedCount,
          onLeaveCount
        },
        roster
      });
    } catch (err: any) {
      console.error("Fetch hostel evening return error:", err);
      res.status(500).json({ error: "Failed to fetch hostel evening return roster." });
    }
  }
);

// ----------------------------------------------------
// 13. Record Evening Hostel Return Attendance
// ----------------------------------------------------
hostelRouter.post(
  "/:hostelBlock/evening-return",
  requireAuth,
  requireRoles(["WARDEN", "STAFF", "ADMIN"]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { hostelBlock } = req.params;
      const user = req.user!;

      // Scope Check: Warden can only manage their own hostel
      if (user.role === "WARDEN" && user.hostelBlock && user.hostelBlock !== hostelBlock) {
        res.status(403).json({
          error: `Forbidden: You are assigned to ${user.hostelBlock} and cannot record attendance for ${hostelBlock}.`
        });
        return;
      }

      const { studentId, status, returnTime, remarks, date, records } = req.body;
      const targetDate = date ? new Date(date) : new Date();
      targetDate.setHours(0, 0, 0, 0);

      // Support batch or single record
      const itemsToRecord: Array<{
        studentId: string;
        status: string;
        returnTime?: string | null;
        remarks?: string | null;
      }> = records && Array.isArray(records)
        ? records
        : studentId
        ? [{ studentId, status: status || "RETURNED", returnTime, remarks }]
        : [];

      if (itemsToRecord.length === 0) {
        res.status(400).json({ error: "No student attendance records provided." });
        return;
      }

      const results = [];
      for (const item of itemsToRecord) {
        const student = await prisma.user.findUnique({
          where: { id: item.studentId },
          select: { id: true, hostelBlock: true, livingType: true }
        });

        if (!student || student.livingType !== "HOSTELLER" || student.hostelBlock !== hostelBlock) {
          continue; // Skip invalid or non-resident entries
        }

        const effectiveReturnTime =
          item.status === "RETURNED"
            ? item.returnTime
              ? new Date(item.returnTime)
              : new Date()
            : null;

        const record = await prisma.hostelEveningAttendance.upsert({
          where: {
            date_studentId: {
              date: targetDate,
              studentId: item.studentId
            }
          },
          create: {
            date: targetDate,
            hostelBlock,
            studentId: item.studentId,
            status: item.status,
            returnTime: effectiveReturnTime,
            recordedById: user.id,
            remarks: item.remarks || null
          },
          update: {
            status: item.status,
            returnTime: effectiveReturnTime,
            recordedById: user.id,
            remarks: item.remarks !== undefined ? item.remarks : undefined
          }
        });

        results.push(record);
      }

      res.json({
        message: `Successfully recorded evening return for ${results.length} resident(s).`,
        count: results.length
      });
    } catch (err: any) {
      console.error("Record evening return error:", err);
      res.status(500).json({ error: "Failed to record evening return attendance." });
    }
  }
);

// ----------------------------------------------------
// 14. Student Personal Evening Return Status & Dossier
// ----------------------------------------------------
hostelRouter.get(
  "/evening-return/my-status",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      if (user.role !== "STUDENT" || user.livingType !== "HOSTELLER" || !user.hostelBlock) {
        res.json({ isHosteller: false, record: null });
        return;
      }
      const targetDate = new Date();
      targetDate.setHours(0, 0, 0, 0);

      const record = await prisma.hostelEveningAttendance.findUnique({
        where: {
          date_studentId: {
            date: targetDate,
            studentId: user.id
          }
        },
        include: {
          recordedBy: {
            select: { fullName: true }
          }
        }
      });

      // Find if student has an active approved gate pass for today
      const activePass = await prisma.gatePass.findFirst({
        where: {
          studentId: user.id,
          status: "APPROVED"
        },
        orderBy: { createdAt: "desc" }
      });

      // Find assigned warden for this hostel block
      const warden = await prisma.user.findFirst({
        where: { role: "WARDEN", hostelBlock: user.hostelBlock },
        select: { fullName: true, phone: true }
      });

      res.json({
        isHosteller: true,
        hostelBlock: user.hostelBlock,
        roomNumber: user.roomNumber,
        bedNumber: user.bedNumber,
        warden: warden ? warden.fullName : "Assigned Warden",
        wardenPhone: warden?.phone || null,
        record: record || null,
        hasApprovedPass: !!activePass,
        activePassNumber: activePass?.passNumber || null
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch student evening return status." });
    }
  }
);
