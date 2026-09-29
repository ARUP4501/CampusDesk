import { prisma } from "../prisma.js";
import { createNotification } from "./push.service.js";

export class EscalationService {
  private timer: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  public start(intervalMs: number = 60000): void {
    if (this.timer) clearInterval(this.timer);
    // Run immediately on start then every minute
    this.checkEscalationsAndReminders();
    this.timer = setInterval(() => {
      this.checkEscalationsAndReminders();
    }, intervalMs);
    console.log("Background escalation and reminder worker started.");
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  // Scan tickets for SLA breach and auto-escalate
  public async checkEscalationsAndReminders(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

      // Find system admin user to act as actor for audit log
      const adminUser = await prisma.user.findFirst({
        where: { role: "ADMIN" }
      });
      const systemActorId = adminUser ? adminUser.id : undefined;

      // 1. Level 1 Escalation: > 24 hours open, level 0
      const level1Tickets = await prisma.ticket.findMany({
        where: {
          status: { in: ["SUBMITTED", "ASSIGNED", "IN_PROGRESS"] },
          escalationLevel: 0,
          createdAt: { lte: twentyFourHoursAgo }
        },
        include: { student: true, assignedStaff: true }
      });

      for (const ticket of level1Tickets) {
        await prisma.$transaction(async (tx) => {
          await tx.ticket.update({
            where: { id: ticket.id },
            data: {
              escalationLevel: 1,
              escalatedAt: now
            }
          });

          if (systemActorId) {
            await tx.ticketAuditLog.create({
              data: {
                ticketId: ticket.id,
                changedById: systemActorId,
                fromStatus: ticket.status,
                toStatus: ticket.status,
                action: "ESCALATION_LEVEL_1",
                note: "Ticket open past 24 hours. Automatically escalated to Hostel Warden queue."
              }
            });
          }
        });

        // Notify wardens
        const wardens = await prisma.user.findMany({ where: { role: "WARDEN" } });
        for (const w of wardens) {
          await createNotification(
            w.id,
            `Ticket Escalated: #${ticket.ticketNumber}`,
            `Ticket "${ticket.title}" (${ticket.hostelBlock} ${ticket.roomNumber}) has exceeded 24h SLA.`,
            "ESCALATION",
            `/tickets/${ticket.id}`
          );
        }

        // Notify student
        await createNotification(
          ticket.studentId,
          `Ticket #${ticket.ticketNumber} Escalated`,
          `Your ticket "${ticket.title}" has been escalated to the Warden for priority resolution.`,
          "TICKET",
          `/tickets/${ticket.id}`
        );
      }

      // 2. Level 2 Escalation: > 48 hours open, level 1
      const level2Tickets = await prisma.ticket.findMany({
        where: {
          status: { in: ["SUBMITTED", "ASSIGNED", "IN_PROGRESS"] },
          escalationLevel: 1,
          createdAt: { lte: fortyEightHoursAgo }
        },
        include: { student: true }
      });

      for (const ticket of level2Tickets) {
        await prisma.$transaction(async (tx) => {
          await tx.ticket.update({
            where: { id: ticket.id },
            data: {
              escalationLevel: 2,
              escalatedAt: now
            }
          });

          if (systemActorId) {
            await tx.ticketAuditLog.create({
              data: {
                ticketId: ticket.id,
                changedById: systemActorId,
                fromStatus: ticket.status,
                toStatus: ticket.status,
                action: "ESCALATION_LEVEL_2",
                note: "Ticket open past 48 hours. Automatically escalated to Central Admin oversight."
              }
            });
          }
        });

        // Notify Admins
        const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
        for (const a of admins) {
          await createNotification(
            a.id,
            `Critical Escalation: #${ticket.ticketNumber}`,
            `Ticket "${ticket.title}" in ${ticket.hostelBlock} has breached 48h SLA.`,
            "ESCALATION",
            `/tickets/${ticket.id}`
          );
        }
      }

      // 3. Notice Action Reminders: students who haven't completed required actions
      const pendingNoticeRecipients = await prisma.noticeRecipient.findMany({
        where: {
          isActionDone: false,
          notice: {
            requiresAction: true,
            actionDeadline: { gte: now }
          },
          reminderSentCount: { lt: 3 }
        },
        include: {
          notice: true,
          student: true
        },
        take: 50
      });

      for (const nr of pendingNoticeRecipients) {
        // Send at most 1 reminder per 24 hours
        const lastSent = nr.lastReminderSentAt;
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        if (!lastSent || lastSent < oneDayAgo) {
          await prisma.noticeRecipient.update({
            where: { id: nr.id },
            data: {
              reminderSentCount: nr.reminderSentCount + 1,
              lastReminderSentAt: now
            }
          });

          await createNotification(
            nr.studentId,
            `Action Required: ${nr.notice.title}`,
            `Please complete the pending action for notice "${nr.notice.title}". Deadline: ${nr.notice.actionDeadline ? new Date(nr.notice.actionDeadline).toLocaleDateString() : "Soon"}.`,
            "REMINDER",
            `/notices/${nr.noticeId}`
          );
        }
      }
    } catch (err) {
      console.error("Error running background escalation checks:", err);
    } finally {
      this.isRunning = false;
    }
  }
}

export const escalationService = new EscalationService();
