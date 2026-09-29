import { Router, Request, Response } from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const notificationRouter = Router();

// Get in-app notifications
notificationRouter.get("/", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const notifications = await prisma.inAppNotification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
      take: 50
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    res.json({ notifications, unreadCount });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch notifications." });
  }
});

// Mark all or single notification as read
notificationRouter.post("/mark-read", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.body;

    if (id) {
      await prisma.inAppNotification.updateMany({
        where: { id, userId: req.user!.id },
        data: { isRead: true }
      });
    } else {
      await prisma.inAppNotification.updateMany({
        where: { userId: req.user!.id, isRead: false },
        data: { isRead: true }
      });
    }

    res.json({ message: "Notifications marked as read." });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update notification read status." });
  }
});

// Register Web Push subscription
notificationRouter.post("/subscribe", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { endpoint, keys } = req.body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      res.status(400).json({ error: "Invalid push subscription object." });
      return;
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        userId: req.user!.id,
        p256dh: keys.p256dh,
        auth: keys.auth
      },
      create: {
        userId: req.user!.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth
      }
    });

    res.status(201).json({ message: "Push notifications subscribed." });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to save push subscription." });
  }
});
