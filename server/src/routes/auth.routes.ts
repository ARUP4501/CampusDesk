import { Router, Request, Response } from "express";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma.js";
import { config } from "../config.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { authRateLimiter } from "../middleware/rateLimit.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { LoginSchema, RegisterSchema } from "../shared/schemas.js";

export const authRouter = Router();

// Register new user (Student Registration with 2-step verification)
authRouter.post("/register", authRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      email,
      password,
      fullName,
      phone,
      dob,
      gender,
      bloodGroup,
      rollNumber,
      course,
      department,
      branch,
      year,
      semester,
      batch,
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
      requestedHostel,
      roomPreference,
      consentAgreed
    } = req.body;

    if (!email || !password || !fullName || !phone) {
      res.status(400).json({ error: "Required basic fields are missing." });
      return;
    }

    if (!consentAgreed) {
      res.status(400).json({ error: "You must agree to the Privacy Policy and Terms of Service." });
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      res.status(409).json({ error: "An account with this email address already exists." });
      return;
    }

    if (rollNumber) {
      const existingRoll = await prisma.user.findUnique({
        where: { rollNumber: rollNumber.toUpperCase() }
      });
      if (existingRoll) {
        res.status(409).json({ error: "An account with this registration/roll number already exists." });
        return;
      }
    }

    const passwordHash = await argon2.hash(password);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        fullName,
        role: "STUDENT",
        rollNumber: rollNumber ? rollNumber.toUpperCase() : null,
        phone,
        dob: dob ? new Date(dob) : null,
        gender: gender || null,
        bloodGroup: bloodGroup || null,
        course: course || "B.Tech",
        department: department || "General",
        branch: branch ? branch.toUpperCase() : (department ? department.toUpperCase() : null),
        year: year ? parseInt(String(year), 10) : 1,
        semester: semester ? parseInt(String(semester), 10) : 1,
        batch: batch || `${new Date().getFullYear()}-${new Date().getFullYear() + 4}`,
        permanentAddress: permanentAddress || null,
        currentAddress: currentAddress || null,
        fatherName: fatherName || null,
        fatherPhone: fatherPhone || null,
        motherName: motherName || null,
        motherPhone: motherPhone || null,
        guardianName: guardianName || null,
        guardianRelation: guardianRelation || null,
        guardianPhone: guardianPhone || null,
        guardianAddress: guardianAddress || null,
        requestedHostel: requestedHostel || "Hostel-A",
        roomPreference: roomPreference || null,
        verificationStatus: "PENDING_WARDEN_VERIFICATION",
        isActive: false // Activated upon final Admin approval
      }
    });

    // 1. Audit Log
    await prisma.auditLog.create({
      data: {
        action: "STUDENT_REGISTERED",
        actorId: user.id,
        actorRole: "STUDENT",
        targetType: "STUDENT",
        targetId: user.id,
        details: `Student ${user.fullName} (${user.rollNumber || user.email}) registered requesting ${user.requestedHostel}.`,
        hostelBlock: user.requestedHostel
      }
    });

    // 2. Notify Assigned Warden(s)
    const wardens = await prisma.user.findMany({
      where: {
        role: "WARDEN",
        hostelBlock: user.requestedHostel,
        isActive: true
      }
    });

    for (const w of wardens) {
      await prisma.inAppNotification.create({
        data: {
          userId: w.id,
          title: "New Student Verification Request",
          message: `Student ${user.fullName} (${user.rollNumber || "No Roll"}) requested admission to ${user.requestedHostel} and is awaiting your review.`,
          type: "VERIFICATION",
          linkUrl: "/admin"
        }
      });
    }

    // Sign session token
    const token = jwt.sign({ userId: user.id }, config.JWT_SECRET, { expiresIn: "7d" });

    res.cookie("campusdesk_token", token, {
      httpOnly: true,
      secure: config.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      message: "Registration submitted successfully. Your profile is now under review by the Hostel Warden.",
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        rollNumber: user.rollNumber,
        phone: user.phone,
        course: user.course,
        department: user.department,
        branch: user.branch,
        year: user.year,
        semester: user.semester,
        requestedHostel: user.requestedHostel,
        hostelBlock: user.hostelBlock,
        roomNumber: user.roomNumber,
        bedNumber: user.bedNumber,
        verificationStatus: user.verificationStatus,
        isActive: user.isActive
      }
    });
  } catch (err: any) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Failed to create account. Please try again." });
  }
});

// Login
authRouter.post("/login", authRateLimiter, validateBody(LoginSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    const isValid = await argon2.verify(user.passwordHash, password);
    if (!isValid) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    const token = jwt.sign({ userId: user.id }, config.JWT_SECRET, { expiresIn: "7d" });

    res.cookie("campusdesk_token", token, {
      httpOnly: true,
      secure: config.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        rollNumber: user.rollNumber,
        employeeId: user.employeeId,
        phone: user.phone,
        hostelBlock: user.hostelBlock,
        roomNumber: user.roomNumber,
        bedNumber: user.bedNumber,
        requestedHostel: user.requestedHostel,
        batch: user.batch,
        branch: user.branch,
        course: user.course,
        year: user.year,
        semester: user.semester,
        department: user.department,
        verificationStatus: user.verificationStatus,
        rejectionReason: user.rejectionReason,
        isActive: user.isActive
      }
    });
  } catch (err: any) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Authentication failed. Please try again." });
  }
});

// Get current user profile
authRouter.get("/me", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        employeeId: true,
        rollNumber: true,
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
        hostelBlock: true,
        roomNumber: true,
        bedNumber: true,
        requestedHostel: true,
        roomPreference: true,
        verificationStatus: true,
        wardenVerificationDate: true,
        adminApprovalDate: true,
        rejectionReason: true,
        isActive: true,
        createdAt: true
      }
    });

    if (!user) {
      res.status(404).json({ error: "User profile not found." });
      return;
    }

    res.json({ user });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch user profile." });
  }
});


// Logout
authRouter.post("/logout", (req: Request, res: Response): void => {
  res.clearCookie("campusdesk_token");
  res.json({ message: "Logged out successfully." });
});

// List staff and wardens for assignment
authRouter.get("/staff-list", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const staff = await prisma.user.findMany({
      where: {
        role: { in: ["STAFF", "WARDEN", "ADMIN"] },
        isActive: true
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        department: true
      },
      orderBy: { fullName: "asc" }
    });

    res.json({ staff });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to load staff list." });
  }
});
