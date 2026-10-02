import { Router, Request, Response } from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const directoryRouter = Router();

// Campus Help & Services Directory Catalog
directoryRouter.get("/", requireAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const wardens = await prisma.user.findMany({
      where: { role: "WARDEN", isActive: true },
      select: { fullName: true, hostelBlock: true, phone: true, email: true }
    });

    const services = [
      {
        id: "accounts",
        category: "ACCOUNTS_FEES",
        title: "Finance & Accounts Office",
        description: "Semester fee reconciliation, payment slips, challans, scholarship queries.",
        officeLocation: "Administrative Block, 1st Floor, Room 104",
        workingHours: "10:00 AM – 4:30 PM (Mon – Fri)",
        email: "accounts@campusdesk.edu",
        actionLink: "/fees",
        actionLabel: "View Fee Statement",
        icon: "IndianRupee"
      },
      {
        id: "warden_office",
        category: "HOSTEL_RESIDENCE",
        title: "Hostel Administration & Chief Warden",
        description: "Room maintenance, curfew adjustments, mess monitoring, room change applications.",
        officeLocation: "Hostel Complex Central Office, Ground Floor",
        workingHours: "8:00 AM – 1:00 PM & 5:00 PM – 8:00 PM (Daily)",
        email: "warden@campusdesk.edu",
        wardens: wardens.map((w) => ({ name: w.fullName, block: w.hostelBlock, email: w.email })),
        actionLink: "/tickets/new",
        actionLabel: "File Hostel Complaint",
        icon: "DoorOpen"
      },
      {
        id: "it_helpdesk",
        category: "IT_TECHNICAL",
        title: "Campus IT & Network Operations Center (NOC)",
        description: "Campus Wi-Fi credentials, lab LAN connectivity, portal access, smart board issues.",
        officeLocation: "Computer Center, 2nd Floor, Room 210",
        workingHours: "9:00 AM – 6:00 PM (Mon – Sat)",
        email: "it-support@campusdesk.edu",
        actionLink: "/tickets/new",
        actionLabel: "Report IT / Wi-Fi Issue",
        icon: "Wifi"
      },
      {
        id: "academic_registry",
        category: "ACADEMICS_REGISTRY",
        title: "Academic Section & Controller of Examinations",
        description: "Bonafide certificates, grade sheets, course registration, attendance condonation.",
        officeLocation: "Main Academic Block, Ground Floor, Counter 2 & 3",
        workingHours: "10:00 AM – 5:00 PM (Mon – Fri)",
        email: "registry@campusdesk.edu",
        actionLink: "/documents",
        actionLabel: "Request Certificate",
        icon: "Files"
      },
      {
        id: "medical_center",
        category: "HEALTH_WELLNESS",
        title: "Campus Health Center & Pharmacy",
        description: "24/7 First aid, emergency ambulance requisition, resident doctor consultations.",
        officeLocation: "Health Center Building (Opposite Boys Hostel Gate)",
        workingHours: "24/7 Emergency Service • Doctor: 9 AM - 1 PM & 4 PM - 7 PM",
        email: "medical@campusdesk.edu",
        actionLink: "/sos",
        actionLabel: "Emergency SOS",
        icon: "HeartPulse"
      },
      {
        id: "transport_cell",
        category: "DAY_SCHOLAR_TRANSPORT",
        title: "Transport & Fleet Management Cell",
        description: "Day scholar bus pass, route timings, parking stickers, vehicle registration.",
        officeLocation: "Transport Office (Near Main Security Gate 1)",
        workingHours: "8:30 AM – 5:30 PM (Mon – Fri)",
        email: "transport@campusdesk.edu",
        actionLink: "/transport",
        actionLabel: "View Transit Routes",
        icon: "Bus"
      },
      {
        id: "security_office",
        category: "SECURITY_SAFETY",
        title: "Chief Security Officer & Main Gate Desk",
        description: "Lost & Found, parcel collection, gate pass exit/entry scanning, parking supervision.",
        officeLocation: "Main Campus Gate Security Station",
        workingHours: "24 Hours Open",
        email: "security@campusdesk.edu",
        actionLink: "/parcels",
        actionLabel: "Parcel Collection Desk",
        icon: "Shield"
      }
    ];

    res.json({ services });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch campus services directory." });
  }
});
