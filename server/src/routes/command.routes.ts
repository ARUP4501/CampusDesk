import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { commandRateLimiter } from "../middleware/rateLimit.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { parseAndExecuteCommand } from "../services/commandParser.service.js";
import { CommandInputSchema } from "../shared/schemas.js";

export const commandRouter = Router();

// Execute text command (usable by students or hostel staff on behalf of students)
commandRouter.post(
  "/execute",
  requireAuth,
  commandRateLimiter,
  validateBody(CommandInputSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { command, studentRollNumber } = req.body;

      const result = await parseAndExecuteCommand(
        command,
        studentRollNumber,
        req.user!.id
      );

      res.json(result);
    } catch (err: any) {
      console.error("Command execution error:", err);
      res.status(500).json({
        success: false,
        command: req.body.command || "",
        message: "An internal error occurred while parsing the command."
      });
    }
  }
);
