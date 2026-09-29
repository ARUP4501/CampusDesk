import webpush from "web-push";
import { config } from "../config.js";
import { prisma } from "../prisma.js";

// Initialize web-push with VAPID keys
if (config.VAPID_PUBLIC_KEY && config.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    config.VAPID_SUBJECT,
    config.VAPID_PUBLIC_KEY,
    config.VAPID_PRIVATE_KEY
  );
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

// Send push notification to all active subscriptions of a user
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId }
    });

    if (subscriptions.length === 0) return;

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || "/",
      tag: payload.tag || "campusdesk-notification"
    });

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          },
          notificationPayload
        );
      } catch (err: any) {
        // If expired or gone, delete subscription
        if (err.statusCode === 410 || err.statusCode === 404) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    }
  } catch (err) {
    console.error(`Failed to send push notification to user ${userId}:`, err);
  }
}

// Create in-app notification + optionally dispatch push
export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: string,
  linkUrl?: string
): Promise<void> {
  try {
    await prisma.inAppNotification.create({
      data: {
        userId,
        title,
        message,
        type,
        linkUrl
      }
    });

    // Also trigger web push
    await sendPushToUser(userId, {
      title,
      body: message,
      url: linkUrl
    });
  } catch (err) {
    console.error("Failed to create in-app notification:", err);
  }
}
