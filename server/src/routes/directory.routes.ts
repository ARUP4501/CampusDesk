import { Router, Request, Response } from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const directoryRouter = Router();

// Campus Help & Services Directory Catalog
directoryRouter.get("/", requireAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const wardens = await prisma.user.findMany({
      where: { role: "WARDEN", isActive: true },
      select: { fullName: true, hostelBlock: true, phone: true, email: true },
      orderBy: { hostelBlock: "asc" }
    });

    const hotlines = [
      {
        id: "hl_security",
        name: "Campus Security Command (24x7)",
        role: "Main Gate & Perimeter Response",
        phone: "1800-CAMPUS",
        directDial: "tel:1800CAMPUS",
        altPhone: "+91 98611 00001",
        badge: "24/7 ACTIVE",
        type: "SECURITY"
      },
      {
        id: "hl_medical",
        name: "Health Center & Ambulance",
        role: "Critical Medical Care & Transit",
        phone: "Ext. 108",
        directDial: "tel:+919861100099",
        altPhone: "+91 98611 00099",
        badge: "EMERGENCY",
        type: "MEDICAL"
      },
      {
        id: "hl_women",
        name: "Women's Safety & Internal Complaints",
        role: "Confidential Student Protection",
        phone: "+91 98610 03001",
        directDial: "tel:+919861003001",
        altPhone: "Ext. 301",
        badge: "CONFIDENTIAL",
        type: "SAFETY"
      },
      {
        id: "hl_warden",
        name: "Chief Warden Operations Desk",
        role: "Hostel Residence Emergency Lead",
        phone: "+91 98610 01001",
        directDial: "tel:+919861001001",
        altPhone: "Ext. 101",
        badge: "RESIDENTIAL",
        type: "HOSTEL"
      },
      {
        id: "hl_power",
        name: "Power Substation & Fire Control",
        role: "Electrical Outages & Fire Hazards",
        phone: "Ext. 204",
        directDial: "tel:+919861100004",
        altPhone: "+91 98611 00004",
        badge: "UTILITIES",
        type: "UTILITY"
      }
    ];

    const services = [
      {
        id: "security_office",
        category: "SECURITY",
        title: "Chief Security Officer & Main Gate Command",
        department: "Chief Security Officer & Main Gate Command",
        description: "Campus gate access verification, night patrolling, emergency dispatch, lost & found, and visitor verification.",
        officeLocation: "Main Campus Gate Security Station (Gate 1)",
        workingHours: "24 Hours · 7 Days A Week",
        contactPerson: "Col. Sanjeev Mohapatra (CSO)",
        phone: "1800-CAMPUS / +91 98611 00001",
        contactPhone: "1800-CAMPUS",
        email: "security@campusdesk.edu",
        contactEmail: "security@campusdesk.edu",
        actionLink: "/parcels",
        actionUrl: "/parcels",
        actionLabel: "Parcel Collection Desk",
        actionType: "Parcel Desk",
        icon: "Shield",
        isEmergency: true,
        priority: 1
      },
      {
        id: "medical_center",
        category: "MEDICAL",
        title: "Campus Health Center & Ambulance Services",
        department: "Campus Health Center & Ambulance Services",
        description: "24/7 emergency first-aid, on-call ambulance requisition, resident doctor consultation, and emergency medicines dispensary.",
        officeLocation: "Health Center Building (Opposite Boys Hostel Block)",
        workingHours: "24/7 Emergency · Doctor OPD: 9:00 AM - 1:00 PM & 4:00 PM - 7:00 PM",
        contactPerson: "Dr. Ananya Roy (Chief Medical Officer)",
        phone: "Ext. 108 / +91 98611 00099",
        contactPhone: "+91 98611 00099",
        email: "medical@campusdesk.edu",
        contactEmail: "medical@campusdesk.edu",
        actionLink: "/help",
        actionUrl: "/help",
        actionLabel: "Health Services",
        actionType: "Health Desk",
        icon: "HeartPulse",
        isEmergency: true,
        priority: 2
      },
      {
        id: "womens_cell",
        category: "SECURITY",
        title: "Women's Safety & Internal Complaints Committee (ICC)",
        department: "Women's Safety & Internal Complaints Committee (ICC)",
        description: "Zero-tolerance anti-harassment cell, confidential grievance reception, psychological counseling, and hostel safety escort support.",
        officeLocation: "Administrative Block, 1st Floor, Room 102",
        workingHours: "9:00 AM – 6:00 PM (Emergency Hotline: 24/7)",
        contactPerson: "Prof. (Dr.) Meenakshi Sahoo (Presiding Officer)",
        phone: "+91 98610 03001",
        contactPhone: "+91 98610 03001",
        email: "womenscell@campusdesk.edu",
        contactEmail: "womenscell@campusdesk.edu",
        actionLink: "/tickets/new",
        actionUrl: "/tickets/new",
        actionLabel: "Confidential Grievance",
        actionType: "Report Concern",
        icon: "ShieldAlert",
        isEmergency: true,
        priority: 3
      },
      {
        id: "warden_office",
        category: "HOSTEL",
        title: "Hostel Administration & Chief Warden Office",
        department: "Hostel Administration & Chief Warden Office",
        description: "Curfew management, room allocations, evening roll-calls, mess hygiene oversight, and residential maintenance coordination.",
        officeLocation: "Hostel Complex Central Office, Ground Floor",
        workingHours: "8:00 AM – 1:00 PM & 5:00 PM – 8:30 PM (Daily)",
        contactPerson: "Dr. Ramesh Chandra Mohanty (Chief Warden)",
        phone: "+91 98610 01001",
        contactPhone: "+91 98610 01001",
        email: "warden@campusdesk.edu",
        contactEmail: "warden@campusdesk.edu",
        wardens: wardens.map((w) => ({
          name: w.fullName,
          block: w.hostelBlock || "Hostel Block",
          phone: w.phone || "+91 98610 01000",
          email: w.email
        })),
        actionLink: "/tickets/new",
        actionUrl: "/tickets/new",
        actionLabel: "File Hostel Issue",
        actionType: "Hostel Ticket",
        icon: "Building",
        isEmergency: false,
        priority: 4
      },
      {
        id: "substation_power",
        category: "MAINTENANCE",
        title: "Electrical Substation & Fire Command",
        department: "Electrical Substation & Fire Command",
        description: "Campus 33kV Substation, DG set backup power, elevator emergency rescue, electrical surge protection, and fire safety systems.",
        officeLocation: "Utility Block Substation (Behind Mechanical Workshops)",
        workingHours: "24/7 Shift Operations",
        contactPerson: "Er. Dilip Kumar Jena (AE Electrical)",
        phone: "Ext. 204 / +91 98611 00004",
        contactPhone: "Ext. 204",
        email: "substation@campusdesk.edu",
        contactEmail: "substation@campusdesk.edu",
        actionLink: "/tickets/new",
        actionUrl: "/tickets/new",
        actionLabel: "Report Power Failure",
        actionType: "Electrical Report",
        icon: "Wrench",
        isEmergency: true,
        priority: 5
      },
      {
        id: "water_plumbing",
        category: "MAINTENANCE",
        title: "Water Works & Civil Estate Desk",
        department: "Water Works & Civil Estate Desk",
        description: "Hostel overhead water storage, RO drinking water plants, solar water heating systems, and emergency plumbing pipeline repair.",
        officeLocation: "Estate Maintenance Wing, Works Building",
        workingHours: "7:00 AM – 7:00 PM (Emergency Plumber on 24x7 call)",
        contactPerson: "Mr. Bimal Patra (Works Supervisor)",
        phone: "Ext. 205 / +91 98611 00005",
        contactPhone: "Ext. 205",
        email: "maintenance@campusdesk.edu",
        contactEmail: "maintenance@campusdesk.edu",
        actionLink: "/tickets/new",
        actionUrl: "/tickets/new",
        actionLabel: "Plumbing Request",
        actionType: "Plumbing Ticket",
        icon: "Wrench",
        isEmergency: false,
        priority: 6
      },
      {
        id: "academic_registry",
        category: "ACADEMIC",
        title: "Academic Affairs & Controller of Examinations",
        department: "Academic Affairs & Controller of Examinations",
        description: "Bonafide certificates, semester grade cards, duplicate ID cards, course registration, attendance condonation, and degree verification.",
        officeLocation: "Main Academic Block, Ground Floor, Counters 2 & 3",
        workingHours: "10:00 AM – 5:00 PM (Mon – Fri)",
        contactPerson: "Prof. S. K. Nayak (Dean Academics)",
        phone: "+91 98611 00010",
        contactPhone: "+91 98611 00010",
        email: "registry@campusdesk.edu",
        contactEmail: "registry@campusdesk.edu",
        actionLink: "/documents",
        actionUrl: "/documents",
        actionLabel: "Request Certificate",
        actionType: "Certificates",
        icon: "FileText",
        isEmergency: false,
        priority: 7
      },
      {
        id: "accounts",
        category: "FINANCE",
        title: "Finance & Accounts Department",
        department: "Finance & Accounts Department",
        description: "Semester tuition & hostel fee reconciliation, payment slips, SBI collect challans, scholarship verification, and caution deposit refund.",
        officeLocation: "Administrative Block, 1st Floor, Room 104",
        workingHours: "10:00 AM – 4:30 PM (Mon – Fri)",
        contactPerson: "Mr. P. K. Swain (Comptroller of Finance)",
        phone: "+91 98611 00012",
        contactPhone: "+91 98611 00012",
        email: "accounts@campusdesk.edu",
        contactEmail: "accounts@campusdesk.edu",
        actionLink: "/fees",
        actionUrl: "/fees",
        actionLabel: "View Fee Ledger",
        actionType: "Fee Ledger",
        icon: "CreditCard",
        isEmergency: false,
        priority: 8
      },
      {
        id: "it_helpdesk",
        category: "IT",
        title: "Campus IT & Network Operations Center (NOC)",
        department: "Campus IT & Network Operations Center (NOC)",
        description: "Hostel Wi-Fi MAC registration, lab LAN switchboards, portal password resets, smart classroom projection, and cyber security.",
        officeLocation: "Computer Center Building, 2nd Floor, Room 210",
        workingHours: "9:00 AM – 6:00 PM (Mon – Sat)",
        contactPerson: "Er. Manoj Tripathy (System Admin)",
        phone: "+91 98611 00015",
        contactPhone: "+91 98611 00015",
        email: "it-support@campusdesk.edu",
        contactEmail: "it-support@campusdesk.edu",
        actionLink: "/tickets/new",
        actionUrl: "/tickets/new",
        actionLabel: "Report Wi-Fi Issue",
        actionType: "IT Helpdesk",
        icon: "Laptop",
        isEmergency: false,
        priority: 9
      },
      {
        id: "transport_cell",
        category: "TRANSPORT",
        title: "Transit & Day Scholar Fleet Desk",
        department: "Transit & Day Scholar Fleet Desk",
        description: "Day scholar bus route allocation, monthly transit passes, student bus timing alerts, and two-wheeler parking pass verification.",
        officeLocation: "Transport Dispatch Booth (Near Gate 1)",
        workingHours: "8:00 AM – 5:30 PM (Mon – Sat)",
        contactPerson: "Mr. Rakesh Rout (Transport Officer)",
        phone: "+91 98611 00020",
        contactPhone: "+91 98611 00020",
        email: "transport@campusdesk.edu",
        contactEmail: "transport@campusdesk.edu",
        actionLink: "/transport",
        actionUrl: "/transport",
        actionLabel: "View Transit Routes",
        actionType: "Bus Routes",
        icon: "Bus",
        isEmergency: false,
        priority: 10
      }
    ];

    res.json({
      success: true,
      services,
      directory: services,
      hotlines,
      totalServices: services.length,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error("Directory catalog fetch error:", err);
    res.status(500).json({ error: "Failed to fetch campus services directory." });
  }
});
