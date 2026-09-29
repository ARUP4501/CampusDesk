import { Router, Request, Response } from "express";
import { stringify } from "csv-stringify/sync";
import argon2 from "argon2";
import { prisma } from "../prisma.js";
import { requireAuth, requireRoles } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import {
  AdminCreateUserSchema,
  AdminUpdateUserSchema,
  CreateWardenSchema,
  UpdateWardenSchema,
  CreateStaffSchema,
  UpdateStaffSchema,
  AdminUpdateStudentSchema,
  WardenReviewVerificationSchema,
  AdminReviewVerificationSchema
} from "../shared/schemas.js";
import { config } from "../config.js";

export const adminRouter = Router();

// =========================================================================
// 1. DASHBOARD STATISTICS (Admin & Warden)
// =========================================================================
adminRouter.get(
  "/dashboard-stats",
  requireAuth,
  requireRoles(["ADMIN", "WARDEN"]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { startDate, endDate, hostelBlock } = req.query;

      const dateFilter: any = {};
      if (startDate && endDate) {
        dateFilter.createdAt = {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        };
      }

      // Wardens automatically filter by their assigned hostel if not ALL
      const effectiveHostel =
        req.user!.role === "WARDEN" && req.user!.hostelBlock
          ? req.user!.hostelBlock
          : hostelBlock && hostelBlock !== "ALL"
          ? (hostelBlock as string)
          : undefined;

      // Student statistics
      const totalStudents = await prisma.user.count({
        where: {
          role: "STUDENT",
          ...(effectiveHostel ? { OR: [{ hostelBlock: effectiveHostel }, { requestedHostel: effectiveHostel }] } : {})
        }
      });

      const activeStudents = await prisma.user.count({
        where: {
          role: "STUDENT",
          verificationStatus: "ACTIVE",
          ...(effectiveHostel ? { hostelBlock: effectiveHostel } : {})
        }
      });

      const pendingWardenVerifications = await prisma.user.count({
        where: {
          role: "STUDENT",
          verificationStatus: "PENDING_WARDEN_VERIFICATION",
          ...(effectiveHostel ? { requestedHostel: effectiveHostel } : {})
        }
      });

      const pendingAdminApprovals = await prisma.user.count({
        where: {
          role: "STUDENT",
          verificationStatus: "PENDING_ADMIN_APPROVAL",
          ...(effectiveHostel ? { requestedHostel: effectiveHostel } : {})
        }
      });

      const totalWardens = await prisma.user.count({ where: { role: "WARDEN", isActive: true } });
      const totalStaff = await prisma.user.count({ where: { role: "STAFF", isActive: true } });
      const totalHostels = await prisma.hostel.count();

      // Bed Occupancy
      const totalBeds = await prisma.bed.count({
        where: { ...(effectiveHostel ? { hostelBlock: effectiveHostel } : {}) }
      });
      const occupiedBeds = await prisma.bed.count({
        where: {
          status: "OCCUPIED",
          ...(effectiveHostel ? { hostelBlock: effectiveHostel } : {})
        }
      });
      const availableBeds = await prisma.bed.count({
        where: {
          status: "AVAILABLE",
          ...(effectiveHostel ? { hostelBlock: effectiveHostel } : {})
        }
      });

      // Pending items by type
      const pendingTickets = await prisma.ticket.count({
        where: {
          status: { in: ["SUBMITTED", "ASSIGNED", "IN_PROGRESS"] },
          ...(effectiveHostel ? { hostelBlock: effectiveHostel } : {}),
          ...dateFilter
        }
      });

      const pendingGatePasses = await prisma.gatePass.count({
        where: {
          status: "PENDING",
          ...(effectiveHostel ? { student: { hostelBlock: effectiveHostel } } : {}),
          ...dateFilter
        }
      });

      const pendingDocuments = await prisma.documentRequest.count({
        where: { status: { in: ["SUBMITTED", "PROCESSING"] }, ...dateFilter }
      });

      // Staff Workload
      const staffMembers = await prisma.user.findMany({
        where: {
          role: { in: ["STAFF", "WARDEN"] },
          isActive: true
        },
        include: {
          ticketsAssigned: {
            select: { status: true, resolvedAt: true }
          }
        }
      });

      const staffWorkload = staffMembers.map((s) => {
        const assigned = s.ticketsAssigned.length;
        const resolved = s.ticketsAssigned.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED").length;
        const pending = assigned - resolved;
        return {
          id: s.id,
          name: s.fullName,
          department: s.department || "General",
          totalAssigned: assigned,
          resolved,
          pending
        };
      });

      // Recent System Notices
      const recentNotices = await prisma.notice.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          category: true,
          priority: true,
          createdAt: true
        }
      });

      // Recent Activity / Audit Logs
      const recentLogs = await prisma.auditLog.findMany({
        where: { ...(effectiveHostel ? { hostelBlock: effectiveHostel } : {}) },
        take: 8,
        orderBy: { createdAt: "desc" },
        include: {
          actor: { select: { fullName: true, role: true, email: true } }
        }
      });

      res.json({
        showSampleBanner: config.SHOW_SAMPLE_BANNER === "true",
        stats: {
          totalStudents,
          activeStudents,
          pendingWardenVerifications,
          pendingAdminApprovals,
          totalWardens,
          totalStaff,
          totalHostels,
          totalBeds,
          occupiedBeds,
          availableBeds,
          occupancyRate: totalBeds > 0 ? Number(((occupiedBeds / totalBeds) * 100).toFixed(1)) : 0
        },
        pending: {
          tickets: pendingTickets,
          gatePasses: pendingGatePasses,
          documents: pendingDocuments,
          verifications: req.user!.role === "WARDEN" ? pendingWardenVerifications : pendingAdminApprovals,
          total: pendingTickets + pendingGatePasses + pendingDocuments
        },
        staffWorkload,
        recentNotices,
        recentLogs
      });
    } catch (err: any) {
      console.error("Admin dashboard error:", err);
      res.status(500).json({ error: "Failed to generate dashboard statistics." });
    }
  }
);

// =========================================================================
// 2. STUDENT VERIFICATION WORKFLOW (Warden & Admin Scoped)
// =========================================================================

// List Verification Queue
adminRouter.get(
  "/verifications",
  requireAuth,
  requireRoles(["ADMIN", "WARDEN"]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { status, search } = req.query;

      const whereClause: any = { role: "STUDENT" };

      // Scope Check: Warden can ONLY see students requesting/belonging to their hostel
      if (user.role === "WARDEN") {
        if (!user.hostelBlock) {
          res.status(403).json({ error: "Forbidden: No hostel assigned to your warden profile." });
          return;
        }
        whereClause.OR = [
          { requestedHostel: user.hostelBlock },
          { hostelBlock: user.hostelBlock }
        ];
      }

      if (status && status !== "ALL") {
        whereClause.verificationStatus = status as string;
      }

      if (search) {
        const q = String(search).trim();
        whereClause.AND = [
          {
            OR: [
              { fullName: { contains: q } },
              { email: { contains: q } },
              { rollNumber: { contains: q } }
            ]
          }
        ];
      }

      const verifications = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          fullName: true,
          rollNumber: true,
          email: true,
          phone: true,
          dob: true,
          gender: true,
          bloodGroup: true,
          course: true,
          department: true,
          branch: true,
          year: true,
          semester: true,
          batch: true,
          permanentAddress: true,
          currentAddress: true,
          fatherName: true,
          fatherPhone: true,
          motherName: true,
          motherPhone: true,
          guardianName: true,
          guardianRelation: true,
          guardianPhone: true,
          guardianAddress: true,
          requestedHostel: true,
          roomPreference: true,
          hostelBlock: true,
          roomNumber: true,
          bedNumber: true,
          verificationStatus: true,
          wardenVerificationDate: true,
          adminApprovalDate: true,
          rejectionReason: true,
          createdAt: true,
          documents: {
            select: {
              id: true,
              docType: true,
              docName: true,
              fileUrl: true,
              status: true
            }
          }
        },
        orderBy: [{ createdAt: "desc" }]
      });

      res.json({ verifications, count: verifications.length });
    } catch (err: any) {
      console.error("Verifications queue error:", err);
      res.status(500).json({ error: "Failed to load verification queue." });
    }
  }
);

// Step 1: Warden Verification (Warden or Admin)
adminRouter.patch(
  "/verifications/:id/warden-review",
  requireAuth,
  requireRoles(["WARDEN", "ADMIN"]),
  validateBody(WardenReviewVerificationSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { action, rejectionReason } = req.body;

      const student = await prisma.user.findUnique({ where: { id } });
      if (!student || student.role !== "STUDENT") {
        res.status(404).json({ error: "Student registration not found." });
        return;
      }

      // Strict Scope Authorization: Warden can ONLY review student requesting their assigned hostel
      if (
        req.user!.role === "WARDEN" &&
        student.requestedHostel !== req.user!.hostelBlock &&
        student.hostelBlock !== req.user!.hostelBlock
      ) {
        res.status(403).json({
          error: "Forbidden: You are only authorized to verify students for your assigned hostel block."
        });
        return;
      }

      if (action === "REJECT" && (!rejectionReason || rejectionReason.trim().length < 3)) {
        res.status(400).json({ error: "A rejection reason is required when rejecting student verification." });
        return;
      }

      const newStatus = action === "APPROVE" ? "PENDING_ADMIN_APPROVAL" : "REJECTED_BY_WARDEN";

      const updated = await prisma.user.update({
        where: { id },
        data: {
          verificationStatus: newStatus,
          wardenVerificationDate: new Date(),
          wardenVerificationById: req.user!.id,
          rejectionReason: action === "REJECT" ? rejectionReason : null
        }
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          action: action === "APPROVE" ? "WARDEN_APPROVED_STUDENT" : "WARDEN_REJECTED_STUDENT",
          actorId: req.user!.id,
          actorRole: req.user!.role,
          targetType: "STUDENT",
          targetId: student.id,
          details: `Warden ${req.user!.fullName} ${action === "APPROVE" ? "verified and approved" : "rejected"} student ${student.fullName} (${student.rollNumber || student.email}). ${action === "REJECT" ? "Reason: " + rejectionReason : ""}`,
          hostelBlock: student.requestedHostel || req.user!.hostelBlock
        }
      });

      // In-App Notification
      if (action === "APPROVE") {
        // Notify Admins
        const admins = await prisma.user.findMany({ where: { role: "ADMIN", isActive: true } });
        for (const adm of admins) {
          await prisma.inAppNotification.create({
            data: {
              userId: adm.id,
              title: "Student Awaiting Final Admin Approval",
              message: `Student ${student.fullName} (${student.rollNumber || student.email}) was verified by Warden and awaits your final approval.`,
              type: "VERIFICATION",
              linkUrl: "/admin"
            }
          });
        }
      } else {
        // Notify Student
        await prisma.inAppNotification.create({
          data: {
            userId: student.id,
            title: "Registration Verification Update",
            message: `Your registration review was rejected by the Warden. Reason: ${rejectionReason}`,
            type: "VERIFICATION",
            linkUrl: "/dashboard"
          }
        });
      }

      res.json({ message: `Student registration ${action === "APPROVE" ? "approved" : "rejected"} successfully.`, student: updated });
    } catch (err: any) {
      console.error("Warden review error:", err);
      res.status(500).json({ error: "Failed to record warden review." });
    }
  }
);

// Step 2: Admin Final Approval & Activation (Admin ONLY)
adminRouter.patch(
  "/verifications/:id/admin-review",
  requireAuth,
  requireRoles(["ADMIN"]),
  validateBody(AdminReviewVerificationSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { action, rejectionReason, hostelBlock, roomNumber, bedNumber } = req.body;

      const student = await prisma.user.findUnique({ where: { id } });
      if (!student || student.role !== "STUDENT") {
        res.status(404).json({ error: "Student not found." });
        return;
      }

      if (action === "REJECT" && (!rejectionReason || rejectionReason.trim().length < 3)) {
        res.status(400).json({ error: "A rejection reason is required when rejecting student registration." });
        return;
      }

      const newStatus = action === "APPROVE" ? "ACTIVE" : "REJECTED_BY_ADMIN";
      const assignedHostel = hostelBlock || student.requestedHostel || "Hostel-A";

      // If room & bed provided during approval, allocate it
      if (action === "APPROVE" && assignedHostel && roomNumber && bedNumber) {
        const bed = await prisma.bed.findUnique({
          where: {
            hostelBlock_roomNumber_bedNumber: {
              hostelBlock: assignedHostel,
              roomNumber,
              bedNumber
            }
          }
        });
        if (bed && bed.status === "AVAILABLE") {
          await prisma.bed.update({
            where: { id: bed.id },
            data: { status: "OCCUPIED", studentId: student.id }
          });
        }
      }

      const updated = await prisma.user.update({
        where: { id },
        data: {
          verificationStatus: newStatus,
          isActive: action === "APPROVE",
          adminApprovalDate: new Date(),
          adminApprovalById: req.user!.id,
          rejectionReason: action === "REJECT" ? rejectionReason : null,
          hostelBlock: action === "APPROVE" ? assignedHostel : student.hostelBlock,
          roomNumber: action === "APPROVE" ? (roomNumber || student.roomNumber) : student.roomNumber,
          bedNumber: action === "APPROVE" ? (bedNumber || student.bedNumber) : student.bedNumber
        }
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          action: action === "APPROVE" ? "ADMIN_APPROVED_STUDENT" : "ADMIN_REJECTED_STUDENT",
          actorId: req.user!.id,
          actorRole: "ADMIN",
          targetType: "STUDENT",
          targetId: student.id,
          details: `Admin ${req.user!.fullName} ${action === "APPROVE" ? "granted final activation for" : "rejected"} student ${student.fullName} (${student.rollNumber || student.email}). ${action === "REJECT" ? "Reason: " + rejectionReason : ""}`,
          hostelBlock: assignedHostel
        }
      });

      // In-App Notification to Student
      await prisma.inAppNotification.create({
        data: {
          userId: student.id,
          title: action === "APPROVE" ? "Student Account Activated!" : "Registration Rejected by Administration",
          message:
            action === "APPROVE"
              ? `Your registration has been verified and activated! Welcome to CampusDesk.`
              : `Your registration was rejected by Central Administration. Reason: ${rejectionReason}`,
          type: "VERIFICATION",
          linkUrl: "/dashboard"
        }
      });

      res.json({ message: `Student registration ${action === "APPROVE" ? "activated" : "rejected"} successfully.`, student: updated });
    } catch (err: any) {
      console.error("Admin review error:", err);
      res.status(500).json({ error: "Failed to record admin review." });
    }
  }
);

// =========================================================================
// 3. WARDEN MANAGEMENT (Admin Only)
// =========================================================================

// List Wardens
adminRouter.get(
  "/wardens",
  requireAuth,
  requireRoles(["ADMIN"]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const wardens = await prisma.user.findMany({
        where: { role: "WARDEN" },
        select: {
          id: true,
          fullName: true,
          employeeId: true,
          email: true,
          phone: true,
          hostelBlock: true,
          department: true,
          isActive: true,
          createdAt: true
        },
        orderBy: [{ hostelBlock: "asc" }, { fullName: "asc" }]
      });

      res.json({ wardens, count: wardens.length });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch wardens list." });
    }
  }
);

// Create Warden (Admin Only)
adminRouter.post(
  "/wardens",
  requireAuth,
  requireRoles(["ADMIN"]),
  validateBody(CreateWardenSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { fullName, employeeId, email, password, phone, hostelBlock } = req.body;

      const existingEmail = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (existingEmail) {
        res.status(409).json({ error: "User with this email already exists." });
        return;
      }

      if (employeeId) {
        const existingEmp = await prisma.user.findUnique({ where: { employeeId: employeeId.toUpperCase() } });
        if (existingEmp) {
          res.status(409).json({ error: "Employee ID already exists." });
          return;
        }
      }

      const passwordHash = await argon2.hash(password);

      const warden = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          fullName,
          role: "WARDEN",
          employeeId: employeeId.toUpperCase(),
          phone,
          hostelBlock,
          department: "Hostel Administration",
          verificationStatus: "ACTIVE",
          isActive: true
        }
      });

      // Update hostel warden link if exists
      const hostel = await prisma.hostel.findUnique({ where: { name: hostelBlock } });
      if (hostel) {
        await prisma.hostel.update({
          where: { id: hostel.id },
          data: { wardenId: warden.id }
        });
      }

      await prisma.auditLog.create({
        data: {
          action: "WARDEN_CREATED",
          actorId: req.user!.id,
          actorRole: "ADMIN",
          targetType: "WARDEN",
          targetId: warden.id,
          details: `Warden account created for ${fullName} (${employeeId}) assigned to ${hostelBlock}.`,
          hostelBlock
        }
      });

      res.status(201).json({ message: "Warden account created successfully.", warden });
    } catch (err: any) {
      console.error("Create warden error:", err);
      res.status(500).json({ error: "Failed to create warden account." });
    }
  }
);

// Update Warden / Change Assigned Hostel (Admin Only)
adminRouter.put(
  "/wardens/:id",
  requireAuth,
  requireRoles(["ADMIN"]),
  validateBody(UpdateWardenSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { fullName, phone, hostelBlock, isActive } = req.body;

      const existing = await prisma.user.findUnique({ where: { id } });
      if (!existing || existing.role !== "WARDEN") {
        res.status(404).json({ error: "Warden not found." });
        return;
      }

      const updated = await prisma.user.update({
        where: { id },
        data: {
          ...(fullName ? { fullName } : {}),
          ...(phone ? { phone } : {}),
          ...(hostelBlock ? { hostelBlock } : {}),
          ...(isActive !== undefined ? { isActive } : {})
        }
      });

      // Update hostel linkage if hostelBlock changed
      if (hostelBlock && hostelBlock !== existing.hostelBlock) {
        const newHostel = await prisma.hostel.findUnique({ where: { name: hostelBlock } });
        if (newHostel) {
          await prisma.hostel.update({
            where: { id: newHostel.id },
            data: { wardenId: updated.id }
          });
        }
      }

      await prisma.auditLog.create({
        data: {
          action: "WARDEN_UPDATED",
          actorId: req.user!.id,
          actorRole: "ADMIN",
          targetType: "WARDEN",
          targetId: updated.id,
          details: `Warden ${updated.fullName} updated by Admin (Hostel: ${updated.hostelBlock}, Active: ${updated.isActive}).`,
          hostelBlock: updated.hostelBlock
        }
      });

      res.json({ message: "Warden updated successfully.", warden: updated });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to update warden." });
    }
  }
);

// =========================================================================
// 4. STAFF MANAGEMENT (Admin Only)
// =========================================================================

// List Staff
adminRouter.get(
  "/staff",
  requireAuth,
  requireRoles(["ADMIN"]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const staff = await prisma.user.findMany({
        where: { role: "STAFF" },
        select: {
          id: true,
          fullName: true,
          employeeId: true,
          email: true,
          phone: true,
          department: true,
          isActive: true,
          createdAt: true
        },
        orderBy: [{ department: "asc" }, { fullName: "asc" }]
      });

      res.json({ staff, count: staff.length });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch staff list." });
    }
  }
);

// Create Staff (Admin Only)
adminRouter.post(
  "/staff",
  requireAuth,
  requireRoles(["ADMIN"]),
  validateBody(CreateStaffSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { fullName, employeeId, email, password, phone, department } = req.body;

      const existingEmail = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (existingEmail) {
        res.status(409).json({ error: "User with this email already exists." });
        return;
      }

      if (employeeId) {
        const existingEmp = await prisma.user.findUnique({ where: { employeeId: employeeId.toUpperCase() } });
        if (existingEmp) {
          res.status(409).json({ error: "Employee ID already exists." });
          return;
        }
      }

      const passwordHash = await argon2.hash(password);

      const staff = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          fullName,
          role: "STAFF",
          employeeId: employeeId.toUpperCase(),
          phone,
          department,
          verificationStatus: "ACTIVE",
          isActive: true
        }
      });

      await prisma.auditLog.create({
        data: {
          action: "STAFF_CREATED",
          actorId: req.user!.id,
          actorRole: "ADMIN",
          targetType: "STAFF",
          targetId: staff.id,
          details: `Staff account created for ${fullName} (${employeeId}) - Department: ${department}.`
        }
      });

      res.status(201).json({ message: "Staff account created successfully.", staff });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to create staff account." });
    }
  }
);

// Update Staff (Admin Only)
adminRouter.put(
  "/staff/:id",
  requireAuth,
  requireRoles(["ADMIN"]),
  validateBody(UpdateStaffSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { fullName, phone, department, isActive } = req.body;

      const existing = await prisma.user.findUnique({ where: { id } });
      if (!existing || existing.role !== "STAFF") {
        res.status(404).json({ error: "Staff member not found." });
        return;
      }

      const updated = await prisma.user.update({
        where: { id },
        data: {
          ...(fullName ? { fullName } : {}),
          ...(phone ? { phone } : {}),
          ...(department ? { department } : {}),
          ...(isActive !== undefined ? { isActive } : {})
        }
      });

      await prisma.auditLog.create({
        data: {
          action: "STAFF_UPDATED",
          actorId: req.user!.id,
          actorRole: "ADMIN",
          targetType: "STAFF",
          targetId: updated.id,
          details: `Staff ${updated.fullName} updated by Admin (Dept: ${updated.department}, Active: ${updated.isActive}).`
        }
      });

      res.json({ message: "Staff updated successfully.", staff: updated });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to update staff member." });
    }
  }
);

// =========================================================================
// 5. STUDENT MANAGEMENT & DETAILED PROFILES (Role & Scope Protected)
// =========================================================================

// List Students (Admin gets all, Warden gets ONLY their hostel block)
adminRouter.get(
  "/students",
  requireAuth,
  requireRoles(["ADMIN", "WARDEN"]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { hostelBlock, verificationStatus, search, year, course } = req.query;

      const whereClause: any = { role: "STUDENT" };

      // Scope Check: Warden CAN ONLY access students in their assigned hostel
      if (user.role === "WARDEN") {
        if (!user.hostelBlock) {
          res.status(403).json({ error: "Forbidden: No hostel assigned to your profile." });
          return;
        }
        whereClause.hostelBlock = user.hostelBlock;
      } else if (hostelBlock && hostelBlock !== "ALL") {
        whereClause.hostelBlock = hostelBlock as string;
      }

      if (verificationStatus && verificationStatus !== "ALL") {
        whereClause.verificationStatus = verificationStatus as string;
      }
      if (year && year !== "ALL") {
        whereClause.year = parseInt(String(year), 10);
      }
      if (course && course !== "ALL") {
        whereClause.course = course as string;
      }

      if (search) {
        const q = String(search).trim();
        whereClause.AND = [
          {
            OR: [
              { fullName: { contains: q } },
              { rollNumber: { contains: q } },
              { roomNumber: { contains: q } },
              { email: { contains: q } }
            ]
          }
        ];
      }

      const students = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          fullName: true,
          rollNumber: true,
          email: true,
          phone: true,
          course: true,
          department: true,
          branch: true,
          year: true,
          semester: true,
          batch: true,
          hostelBlock: true,
          roomNumber: true,
          bedNumber: true,
          requestedHostel: true,
          verificationStatus: true,
          isActive: true,
          fatherName: true,
          fatherPhone: true,
          guardianName: true,
          guardianPhone: true,
          createdAt: true
        },
        orderBy: [{ hostelBlock: "asc" }, { roomNumber: "asc" }, { fullName: "asc" }]
      });

      res.json({ students, count: students.length });
    } catch (err: any) {
      console.error("List students error:", err);
      res.status(500).json({ error: "Failed to list students." });
    }
  }
);

// Get Complete Detailed Student Profile (Role & Scope Protected)
adminRouter.get(
  "/students/:id",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { id } = req.params;

      const student = await prisma.user.findUnique({
        where: { id },
        include: {
          documents: true,
          transferRequests: { orderBy: { createdAt: "desc" } }
        }
      });

      if (!student || student.role !== "STUDENT") {
        res.status(404).json({ error: "Student not found." });
        return;
      }

      // Security / Privacy Access Control:
      // 1. Student can ONLY view their own profile
      if (user.role === "STUDENT" && user.id !== student.id) {
        res.status(403).json({ error: "Forbidden: You are not authorized to view another student's profile." });
        return;
      }

      // 2. Warden can ONLY view students belonging to / requesting their hostel
      if (
        user.role === "WARDEN" &&
        student.hostelBlock !== user.hostelBlock &&
        student.requestedHostel !== user.hostelBlock
      ) {
        res.status(403).json({ error: "Forbidden: You are only authorized to view students in your assigned hostel." });
        return;
      }

      // 3. Staff cannot view full private profile
      if (user.role === "STAFF") {
        res.status(403).json({ error: "Forbidden: Staff members are not authorized to access private student profiles." });
        return;
      }

      // Fetch recent student activity audit logs
      const studentLogs = await prisma.auditLog.findMany({
        where: { targetId: student.id },
        take: 10,
        orderBy: { createdAt: "desc" }
      });

      res.json({
        student: {
          id: student.id,
          email: student.email,
          fullName: student.fullName,
          rollNumber: student.rollNumber,
          phone: student.phone,
          dob: student.dob,
          gender: student.gender,
          bloodGroup: student.bloodGroup,
          course: student.course,
          department: student.department,
          branch: student.branch,
          year: student.year,
          semester: student.semester,
          batch: student.batch,
          permanentAddress: student.permanentAddress,
          currentAddress: student.currentAddress,
          fatherName: student.fatherName,
          fatherPhone: student.fatherPhone,
          motherName: student.motherName,
          motherPhone: student.motherPhone,
          guardianName: student.guardianName,
          guardianRelation: student.guardianRelation,
          guardianPhone: student.guardianPhone,
          guardianAddress: student.guardianAddress,
          hostelBlock: student.hostelBlock,
          roomNumber: student.roomNumber,
          bedNumber: student.bedNumber,
          requestedHostel: student.requestedHostel,
          roomPreference: student.roomPreference,
          verificationStatus: student.verificationStatus,
          wardenVerificationDate: student.wardenVerificationDate,
          adminApprovalDate: student.adminApprovalDate,
          rejectionReason: student.rejectionReason,
          isActive: student.isActive,
          createdAt: student.createdAt,
          documents: student.documents,
          transferRequests: student.transferRequests,
          activityLogs: studentLogs
        }
      });
    } catch (err: any) {
      console.error("Get student profile error:", err);
      res.status(500).json({ error: "Failed to fetch student profile." });
    }
  }
);

// Edit Student Information (Admin / Warden Scoped)
adminRouter.put(
  "/students/:id",
  requireAuth,
  requireRoles(["ADMIN", "WARDEN"]),
  validateBody(AdminUpdateStudentSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const user = req.user!;

      const existing = await prisma.user.findUnique({ where: { id } });
      if (!existing || existing.role !== "STUDENT") {
        res.status(404).json({ error: "Student not found." });
        return;
      }

      // Scope Check: Warden can only edit students in their hostel
      if (user.role === "WARDEN" && existing.hostelBlock !== user.hostelBlock) {
        res.status(403).json({ error: "Forbidden: You can only manage students in your assigned hostel." });
        return;
      }

      const {
        fullName,
        phone,
        dob,
        gender,
        bloodGroup,
        course,
        department,
        branch,
        year,
        semester,
        permanentAddress,
        currentAddress,
        fatherName,
        fatherPhone,
        motherName,
        motherPhone,
        guardianName,
        guardianRelation,
        guardianPhone,
        guardianAddress,
        hostelBlock,
        roomNumber,
        bedNumber,
        verificationStatus,
        isActive
      } = req.body;

      // Handle Bed Allocation changes if bedNumber is updated
      if (hostelBlock && roomNumber && bedNumber && (bedNumber !== existing.bedNumber || roomNumber !== existing.roomNumber || hostelBlock !== existing.hostelBlock)) {
        // Free old bed if any
        const oldBed = await prisma.bed.findFirst({ where: { studentId: existing.id } });
        if (oldBed) {
          await prisma.bed.update({
            where: { id: oldBed.id },
            data: { status: "AVAILABLE", studentId: null }
          });
        }

        // Occupy new bed
        const newBed = await prisma.bed.findUnique({
          where: {
            hostelBlock_roomNumber_bedNumber: {
              hostelBlock,
              roomNumber,
              bedNumber
            }
          }
        });
        if (newBed) {
          await prisma.bed.update({
            where: { id: newBed.id },
            data: { status: "OCCUPIED", studentId: existing.id }
          });
        }
      }

      const updated = await prisma.user.update({
        where: { id },
        data: {
          ...(fullName !== undefined ? { fullName } : {}),
          ...(phone !== undefined ? { phone } : {}),
          ...(dob ? { dob: new Date(dob) } : {}),
          ...(gender !== undefined ? { gender } : {}),
          ...(bloodGroup !== undefined ? { bloodGroup } : {}),
          ...(course !== undefined ? { course } : {}),
          ...(department !== undefined ? { department } : {}),
          ...(branch !== undefined ? { branch } : {}),
          ...(year !== undefined ? { year } : {}),
          ...(semester !== undefined ? { semester } : {}),
          ...(permanentAddress !== undefined ? { permanentAddress } : {}),
          ...(currentAddress !== undefined ? { currentAddress } : {}),
          ...(fatherName !== undefined ? { fatherName } : {}),
          ...(fatherPhone !== undefined ? { fatherPhone } : {}),
          ...(motherName !== undefined ? { motherName } : {}),
          ...(motherPhone !== undefined ? { motherPhone } : {}),
          ...(guardianName !== undefined ? { guardianName } : {}),
          ...(guardianRelation !== undefined ? { guardianRelation } : {}),
          ...(guardianPhone !== undefined ? { guardianPhone } : {}),
          ...(guardianAddress !== undefined ? { guardianAddress } : {}),
          ...(hostelBlock !== undefined ? { hostelBlock } : {}),
          ...(roomNumber !== undefined ? { roomNumber } : {}),
          ...(bedNumber !== undefined ? { bedNumber } : {}),
          ...(verificationStatus !== undefined ? { verificationStatus } : {}),
          ...(isActive !== undefined ? { isActive } : {})
        }
      });

      await prisma.auditLog.create({
        data: {
          action: "STUDENT_UPDATED",
          actorId: user.id,
          actorRole: user.role,
          targetType: "STUDENT",
          targetId: updated.id,
          details: `Student profile for ${updated.fullName} (${updated.rollNumber || updated.email}) modified by ${user.fullName}.`,
          hostelBlock: updated.hostelBlock
        }
      });

      res.json({ message: "Student record updated successfully.", student: updated });
    } catch (err: any) {
      console.error("Update student error:", err);
      res.status(500).json({ error: "Failed to update student." });
    }
  }
);

// Toggle Student Active / Inactive (Admin Only)
adminRouter.patch(
  "/students/:id/toggle-status",
  requireAuth,
  requireRoles(["ADMIN"]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const student = await prisma.user.findUnique({ where: { id } });
      if (!student || student.role !== "STUDENT") {
        res.status(404).json({ error: "Student not found." });
        return;
      }

      const newActive = !student.isActive;
      const updated = await prisma.user.update({
        where: { id },
        data: {
          isActive: newActive,
          verificationStatus: newActive ? "ACTIVE" : "INACTIVE"
        }
      });

      await prisma.auditLog.create({
        data: {
          action: newActive ? "STUDENT_ACTIVATED" : "STUDENT_DEACTIVATED",
          actorId: req.user!.id,
          actorRole: "ADMIN",
          targetType: "STUDENT",
          targetId: student.id,
          details: `Student ${student.fullName} was ${newActive ? "activated" : "deactivated"} by Admin.`,
          hostelBlock: student.hostelBlock
        }
      });

      res.json({ message: `Student ${newActive ? "activated" : "deactivated"} successfully.`, student: updated });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to update student status." });
    }
  }
);

// =========================================================================
// 6. SYSTEM AUDIT LOGS (Admin Only)
// =========================================================================
adminRouter.get(
  "/audit-logs",
  requireAuth,
  requireRoles(["ADMIN"]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { action, actorRole, targetType, hostelBlock, search } = req.query;

      const whereClause: any = {};
      if (action && action !== "ALL") {
        whereClause.action = action as string;
      }
      if (actorRole && actorRole !== "ALL") {
        whereClause.actorRole = actorRole as string;
      }
      if (targetType && targetType !== "ALL") {
        whereClause.targetType = targetType as string;
      }
      if (hostelBlock && hostelBlock !== "ALL") {
        whereClause.hostelBlock = hostelBlock as string;
      }
      if (search) {
        const q = String(search).trim();
        whereClause.details = { contains: q };
      }

      const logs = await prisma.auditLog.findMany({
        where: whereClause,
        include: {
          actor: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        take: 100
      });

      res.json({ logs, count: logs.length });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch audit logs." });
    }
  }
);

// =========================================================================
// 7. EXPORT DATA (Admin and Warden)
// =========================================================================
adminRouter.get(
  "/export/tickets",
  requireAuth,
  requireRoles(["ADMIN", "WARDEN"]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const tickets = await prisma.ticket.findMany({
        include: {
          student: { select: { fullName: true, rollNumber: true } },
          assignedStaff: { select: { fullName: true } }
        },
        orderBy: { createdAt: "desc" }
      });

      const rows = tickets.map((t) => ({
        "Ticket Number": t.ticketNumber,
        "Student Name": t.student.fullName,
        "Roll Number": t.student.rollNumber || "",
        "Hostel Block": t.hostelBlock,
        "Room Number": t.roomNumber,
        "Category": t.category,
        "Priority": t.priority,
        "Status": t.status,
        "Assigned Staff": t.assignedStaff?.fullName || "Unassigned",
        "Title": t.title,
        "Created At": t.createdAt.toISOString()
      }));

      const csvData = stringify(rows, { header: true });
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="CampusDesk_Tickets_Report_${Date.now()}.csv"`);
      res.send(csvData);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to export tickets CSV." });
    }
  }
);

adminRouter.get(
  "/export/gatepasses",
  requireAuth,
  requireRoles(["ADMIN", "WARDEN"]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const passes = await prisma.gatePass.findMany({
        include: {
          student: { select: { fullName: true, rollNumber: true, hostelBlock: true, roomNumber: true } },
          approvedBy: { select: { fullName: true } }
        },
        orderBy: { createdAt: "desc" }
      });

      const rows = passes.map((p) => ({
        "Pass Number": p.passNumber,
        "Student Name": p.student.fullName,
        "Roll Number": p.student.rollNumber || "",
        "Hostel & Room": `${p.student.hostelBlock || ""} ${p.student.roomNumber || ""}`.trim(),
        "Pass Type": p.type,
        "Destination": p.destination,
        "Reason": p.reason,
        "Status": p.status,
        "Departure Time": p.departureDate.toISOString(),
        "Expected Return": p.expectedReturnDate.toISOString()
      }));

      const csvData = stringify(rows, { header: true });
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="CampusDesk_GatePasses_Report_${Date.now()}.csv"`);
      res.send(csvData);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to export gate passes CSV." });
    }
  }
);
