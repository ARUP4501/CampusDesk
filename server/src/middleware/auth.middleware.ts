import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { prisma } from "../prisma.js";

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: "STUDENT" | "WARDEN" | "STAFF" | "ADMIN";
  rollNumber?: string | null;
  hostelBlock?: string | null;
  roomNumber?: string | null;
  department?: string | null;
  branch?: string | null;
  year?: number | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

// Middleware to verify session cookie or Bearer token
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let token = req.cookies?.campusdesk_token;

    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      res.status(401).json({ error: "Authentication required. Please log in." });
      return;
    }

    const decoded = jwt.verify(token, config.JWT_SECRET) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || !user.isActive) {
      res.status(401).json({ error: "Session invalid or user account deactivated." });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      rollNumber: user.rollNumber,
      hostelBlock: user.hostelBlock,
      roomNumber: user.roomNumber,
      department: user.department,
      branch: user.branch,
      year: user.year
    };

    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired session. Please log in again." });
  }
}

// Role authorization middleware
export function requireRoles(allowedRoles: ("STUDENT" | "WARDEN" | "STAFF" | "ADMIN")[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required." });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Forbidden. Role ${req.user.role} does not have permission for this resource.`
      });
      return;
    }

    next();
  };
}
