import { Router, Request, Response } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, requireRoles } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { CreateMessFeedbackSchema, UpdateMessMenuSchema } from "../shared/schemas.js";

export const messRouter = Router();

// Get weekly mess menu for hostel (All authenticated roles: STUDENT, STAFF, WARDEN, ADMIN)
messRouter.get("/menu", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const hostelBlock = req.query.hostelBlock as string || req.user!.hostelBlock || "Hostel-A";

    const menu = await prisma.messMenu.findMany({
      where: { hostelBlock },
      orderBy: { dayOfWeek: "asc" }
    });

    res.json({ menu, hostelBlock });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to load mess menu." });
  }
});

// Update or create mess menu items for a day (Only ADMIN and WARDEN)
messRouter.post(
  "/menu",
  requireAuth,
  requireRoles(["ADMIN", "WARDEN"]),
  validateBody(UpdateMessMenuSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { hostelBlock, dayOfWeek, breakfast, lunch, snacks, dinner } = req.body;

      const updated = await prisma.messMenu.upsert({
        where: {
          hostelBlock_dayOfWeek: {
            hostelBlock,
            dayOfWeek
          }
        },
        update: {
          breakfast,
          lunch,
          snacks,
          dinner,
          updatedAt: new Date()
        },
        create: {
          hostelBlock,
          dayOfWeek,
          breakfast,
          lunch,
          snacks,
          dinner
        }
      });

      res.json({ message: "Mess menu updated successfully.", item: updated });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to update mess menu: " + (err.message || "") });
    }
  }
);

// Reset or delete mess menu for a day (Only ADMIN and WARDEN)
messRouter.delete(
  "/menu",
  requireAuth,
  requireRoles(["ADMIN", "WARDEN"]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const hostelBlock = req.query.hostelBlock as string;
      const dayOfWeek = parseInt(req.query.dayOfWeek as string, 10);

      if (!hostelBlock || isNaN(dayOfWeek)) {
        res.status(400).json({ error: "hostelBlock and dayOfWeek query parameters are required." });
        return;
      }

      await prisma.messMenu.deleteMany({
        where: { hostelBlock, dayOfWeek }
      });

      res.json({ message: `Mess menu entry for day ${dayOfWeek} reset successfully.` });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to reset mess menu." });
    }
  }
);



// Submit mess feedback (Student)
messRouter.post("/feedback", requireAuth, validateBody(CreateMessFeedbackSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { hostelBlock, mealType, rating, comments } = req.body;

    const feedback = await prisma.messFeedback.create({
      data: {
        studentId: req.user!.id,
        hostelBlock,
        mealType,
        rating,
        comments: comments || null,
        date: new Date()
      }
    });

    res.status(201).json({ message: "Mess feedback submitted successfully.", feedback });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to submit feedback." });
  }
});

// Get mess feedback summary for admin/warden
messRouter.get("/feedback-summary", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const hostelBlock = req.query.hostelBlock as string || "Hostel-A";

    const feedbacks = await prisma.messFeedback.findMany({
      where: { hostelBlock },
      include: {
        student: { select: { fullName: true, rollNumber: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 100
    });

    // Compute averages per meal type
    const mealStats: Record<string, { count: number; totalRating: number }> = {
      BREAKFAST: { count: 0, totalRating: 0 },
      LUNCH: { count: 0, totalRating: 0 },
      SNACKS: { count: 0, totalRating: 0 },
      DINNER: { count: 0, totalRating: 0 }
    };

    feedbacks.forEach((f) => {
      if (mealStats[f.mealType]) {
        mealStats[f.mealType].count++;
        mealStats[f.mealType].totalRating += f.rating;
      }
    });

    const summary = Object.entries(mealStats).map(([mealType, stats]) => ({
      mealType,
      responseCount: stats.count,
      averageRating: stats.count > 0 ? Number((stats.totalRating / stats.count).toFixed(2)) : 0
    }));

    res.json({
      hostelBlock,
      totalResponses: feedbacks.length,
      summary,
      recentFeedbacks: feedbacks.slice(0, 20)
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to load mess feedback summary." });
  }
});
