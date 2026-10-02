import { Router, Request, Response } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, requireRoles } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { createNotification } from "../services/push.service.js";
import {
  CreateClubSchema,
  CreateClubEventSchema,
  CreateClubAnnouncementSchema
} from "../shared/schemas.js";

export const clubRouter = Router();

// 1. List all active campus clubs with member counts & student's joined status
clubRouter.get("/", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, search } = req.query;
    const whereClause: any = {};

    if (category && category !== "ALL") {
      whereClause.category = category;
    }

    if (search) {
      const s = String(search).trim();
      whereClause.OR = [
        { name: { contains: s } },
        { description: { contains: s } },
        { coordinatorName: { contains: s } }
      ];
    }

    const clubs = await prisma.club.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { members: true, events: true }
        },
        members: {
          where: { studentId: req.user!.id },
          select: { role: true, joinedAt: true }
        },
        events: {
          where: { date: { gte: new Date() }, isCancelled: false },
          orderBy: { date: "asc" },
          take: 2,
          include: {
            _count: { select: { registrations: true } },
            registrations: {
              where: { studentId: req.user!.id },
              select: { id: true }
            }
          }
        }
      },
      orderBy: { name: "asc" }
    });

    const enrichedClubs = clubs.map((c) => ({
      id: c.id,
      name: c.name,
      category: c.category,
      description: c.description,
      logoIcon: c.logoIcon,
      coordinatorName: c.coordinatorName,
      coordinatorEmail: c.coordinatorEmail,
      coordinatorPhone: c.coordinatorPhone,
      meetingSchedule: c.meetingSchedule,
      roomLocation: c.roomLocation,
      isRecruiting: c.isRecruiting,
      memberCount: c._count.members,
      eventCount: c._count.events,
      isJoined: c.members.length > 0,
      userRoleInClub: c.members[0]?.role || null,
      upcomingEvents: c.events.map((e) => ({
        ...e,
        registrationCount: e._count.registrations,
        isRegistered: e.registrations.length > 0
      }))
    }));

    res.json({ clubs: enrichedClubs });
  } catch (err: any) {
    console.error("Failed to load clubs:", err);
    res.status(500).json({ error: "Failed to load campus clubs." });
  }
});

// 2. Get Single Club details with full announcements and upcoming events
clubRouter.get("/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const club = await prisma.club.findUnique({
      where: { id },
      include: {
        _count: { select: { members: true } },
        members: {
          include: {
            student: {
              select: { id: true, fullName: true, rollNumber: true, department: true }
            }
          }
        },
        events: {
          orderBy: { date: "asc" },
          include: {
            _count: { select: { registrations: true } },
            registrations: {
              include: {
                student: { select: { id: true, fullName: true, rollNumber: true } }
              }
            }
          }
        },
        announcements: {
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!club) {
      res.status(404).json({ error: "Club not found." });
      return;
    }

    const membership = club.members.find((m) => m.studentId === req.user!.id);

    const enrichedEvents = club.events.map((e) => ({
      ...e,
      registrationCount: e._count.registrations,
      isRegistered: e.registrations.some((r) => r.studentId === req.user!.id)
    }));

    res.json({
      club: {
        ...club,
        memberCount: club._count.members,
        isJoined: !!membership,
        userRoleInClub: membership?.role || null,
        events: enrichedEvents
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch club details." });
  }
});

// 3. Join a Club (Student)
clubRouter.post("/:id/join", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const club = await prisma.club.findUnique({ where: { id } });
    if (!club) {
      res.status(404).json({ error: "Club not found." });
      return;
    }

    const existing = await prisma.clubMember.findUnique({
      where: {
        clubId_studentId: {
          clubId: id,
          studentId: req.user!.id
        }
      }
    });

    if (existing) {
      res.status(400).json({ error: "You are already a registered member of this club." });
      return;
    }

    const membership = await prisma.clubMember.create({
      data: {
        clubId: id,
        studentId: req.user!.id,
        role: "MEMBER"
      }
    });

    await createNotification(
      req.user!.id,
      `Welcome to ${club.name}!`,
      `You have joined ${club.name}. Check out upcoming events and weekly meetings.`,
      "CLUB",
      `/clubs/${club.id}`
    );

    res.status(201).json({ message: `Successfully joined ${club.name}!`, membership });
  } catch (err: any) {
    console.error("Error joining club:", err);
    res.status(500).json({ error: "Failed to join club." });
  }
});

// 4. Leave a Club (Student)
clubRouter.delete("/:id/leave", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.clubMember.deleteMany({
      where: {
        clubId: id,
        studentId: req.user!.id
      }
    });
    res.json({ message: "You have left the club." });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to leave club." });
  }
});

// 5. Register for a Club Event (Student)
clubRouter.post("/events/:eventId/register", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    const event = await prisma.clubEvent.findUnique({
      where: { id: eventId },
      include: { _count: { select: { registrations: true } }, club: true }
    });

    if (!event) {
      res.status(404).json({ error: "Event not found." });
      return;
    }

    if (event.isCancelled) {
      res.status(400).json({ error: "This event has been cancelled." });
      return;
    }

    if (event._count.registrations >= event.capacity) {
      res.status(400).json({ error: "Registration full. Maximum venue capacity reached." });
      return;
    }

    const registration = await prisma.clubEventRegistration.create({
      data: {
        eventId,
        studentId: req.user!.id
      }
    });

    await createNotification(
      req.user!.id,
      `Event Confirmed: ${event.title}`,
      `Your seat is reserved for ${event.title} at ${event.location} on ${new Date(event.date).toLocaleString()}.`,
      "EVENT",
      `/clubs/${event.clubId}`
    );

    res.status(201).json({ message: "Successfully registered for event!", registration });
  } catch (err: any) {
    if (err.code === "P2002") {
      res.status(400).json({ error: "You have already registered for this event." });
      return;
    }
    res.status(500).json({ error: "Failed to register for event." });
  }
});

// 6. Admin / Coordinator: Create new Club
clubRouter.post(
  "/",
  requireAuth,
  requireRoles(["ADMIN", "WARDEN"]),
  validateBody(CreateClubSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const club = await prisma.club.create({
        data: req.body
      });
      res.status(201).json({ message: "Club created successfully.", club });
    } catch (err: any) {
      if (err.code === "P2002") {
        res.status(400).json({ error: "A club with this name already exists." });
        return;
      }
      res.status(500).json({ error: "Failed to create club." });
    }
  }
);

// 7. Admin / Coordinator: Create Club Event
clubRouter.post(
  "/:id/events",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const isAuthorized =
        req.user!.role === "ADMIN" ||
        req.user!.role === "WARDEN" ||
        (await prisma.clubMember.findFirst({
          where: { clubId: id, studentId: req.user!.id, role: { in: ["LEAD", "COORDINATOR"] } }
        }));

      if (!isAuthorized) {
        res.status(403).json({ error: "Unauthorized. Must be Admin or Club Coordinator." });
        return;
      }

      const parsed = CreateClubEventSchema.parse(req.body);
      const event = await prisma.clubEvent.create({
        data: {
          clubId: id,
          title: parsed.title,
          description: parsed.description,
          date: new Date(parsed.date),
          location: parsed.location,
          capacity: parsed.capacity
        },
        include: { club: true }
      });

      // Notify all club members about the new event
      const members = await prisma.clubMember.findMany({ where: { clubId: id } });
      for (const m of members) {
        await createNotification(
          m.studentId,
          `New Event: ${event.title}`,
          `${event.club.name} posted a new event: "${event.title}" scheduled for ${new Date(event.date).toLocaleDateString()}.`,
          "EVENT",
          `/clubs/${id}`
        );
      }

      res.status(201).json({ message: "Event created successfully.", event });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to create club event." });
    }
  }
);

// 8. Admin / Coordinator: Post Club Announcement
clubRouter.post(
  "/:id/announcements",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const isAuthorized =
        req.user!.role === "ADMIN" ||
        req.user!.role === "WARDEN" ||
        (await prisma.clubMember.findFirst({
          where: { clubId: id, studentId: req.user!.id, role: { in: ["LEAD", "COORDINATOR"] } }
        }));

      if (!isAuthorized) {
        res.status(403).json({ error: "Unauthorized. Must be Admin or Club Coordinator." });
        return;
      }

      const parsed = CreateClubAnnouncementSchema.parse(req.body);
      const announcement = await prisma.clubAnnouncement.create({
        data: {
          clubId: id,
          title: parsed.title,
          content: parsed.content
        },
        include: { club: true }
      });

      // Notify all club members
      const members = await prisma.clubMember.findMany({ where: { clubId: id } });
      for (const m of members) {
        await createNotification(
          m.studentId,
          `Announcement: ${announcement.club.name}`,
          `${announcement.title}: ${announcement.content}`,
          "CLUB",
          `/clubs/${id}`
        );
      }

      res.status(201).json({ message: "Announcement broadcasted.", announcement });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to post announcement." });
    }
  }
);
