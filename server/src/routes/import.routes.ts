import { Router, Request, Response } from "express";
import multer from "multer";
import { requireAuth, requireRoles } from "../middleware/auth.middleware.js";
import {
  importStudentsCsv,
  importTimetableCsv,
  importFeesCsv,
  importMessMenuCsv
} from "../services/csvImport.service.js";

export const importRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Import Students CSV
importRouter.post(
  "/students",
  requireAuth,
  requireRoles(["ADMIN"]),
  upload.single("file"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "CSV file is required." });
        return;
      }
      const result = await importStudentsCsv(req.file.buffer);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: "Students import failed: " + err.message });
    }
  }
);

// Import Timetable CSV
importRouter.post(
  "/timetable",
  requireAuth,
  requireRoles(["ADMIN", "STAFF"]),
  upload.single("file"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "CSV file is required." });
        return;
      }
      const result = await importTimetableCsv(req.file.buffer);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: "Timetable import failed: " + err.message });
    }
  }
);

// Import Fees CSV
importRouter.post(
  "/fees",
  requireAuth,
  requireRoles(["ADMIN"]),
  upload.single("file"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "CSV file is required." });
        return;
      }
      const result = await importFeesCsv(req.file.buffer);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: "Fees import failed: " + err.message });
    }
  }
);

// Import Mess Menu CSV
importRouter.post(
  "/mess-menu",
  requireAuth,
  requireRoles(["ADMIN", "WARDEN"]),
  upload.single("file"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "CSV file is required." });
        return;
      }
      const result = await importMessMenuCsv(req.file.buffer);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: "Mess menu import failed: " + err.message });
    }
  }
);
