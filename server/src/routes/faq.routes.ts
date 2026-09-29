import { Router, Request, Response } from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const faqRouter = Router();

// FAQ Assistant: answers strictly from database
faqRouter.post("/ask", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { question } = req.body;
    if (!question || typeof question !== "string") {
      res.status(400).json({ error: "Question is required." });
      return;
    }

    const q = question.toLowerCase().trim();
    const user = req.user!;

    // 1. Class Cancellations Query
    if (q.includes("cancel") || q.includes("class cancelled") || q.includes("is class on")) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

      const cancellations = await prisma.classCancellation.findMany({
        where: {
          date: { gte: today, lt: tomorrow },
          ...(user.branch ? { branch: user.branch } : {})
        }
      });

      if (cancellations.length === 0) {
        res.json({
          answer: "No classes are marked cancelled for today in the academic database. All regular lectures and labs will proceed as scheduled.",
          source: "Academic Timetable Database",
          contactOffice: "Department Academic Office"
        });
        return;
      }

      const list = cancellations.map((c) => `${c.subjectName} (${c.branch} Year ${c.year}) - Reason: ${c.reason}`).join("\n");
      res.json({
        answer: `Cancelled classes today:\n${list}`,
        source: "Class Cancellation Registry",
        contactOffice: "Dean Academics Office"
      });
      return;
    }

    // 2. Mess Menu Query
    if (q.includes("mess") || q.includes("menu") || q.includes("food") || q.includes("lunch") || q.includes("dinner") || q.includes("breakfast")) {
      const hostel = user.hostelBlock || "Hostel-A";
      let dayOfWeek = new Date().getDay();
      if (dayOfWeek === 0) dayOfWeek = 7;

      if (q.includes("tomorrow")) {
        dayOfWeek = (dayOfWeek % 7) + 1;
      }

      const menu = await prisma.messMenu.findFirst({
        where: { hostelBlock: hostel, dayOfWeek }
      });

      if (!menu) {
        res.json({
          answer: `No mess menu data is recorded in the database for ${hostel} on day ${dayOfWeek}.`,
          source: "Hostel Mess Database",
          contactOffice: "Hostel Mess Committee (Hostel Office)"
        });
        return;
      }

      if (q.includes("breakfast")) {
        res.json({ answer: `Today's Breakfast at ${hostel}: ${menu.breakfast}`, source: "Mess Menu DB" });
        return;
      }
      if (q.includes("lunch")) {
        res.json({ answer: `Today's Lunch at ${hostel}: ${menu.lunch}`, source: "Mess Menu DB" });
        return;
      }
      if (q.includes("dinner")) {
        res.json({ answer: `Today's Dinner at ${hostel}: ${menu.dinner}`, source: "Mess Menu DB" });
        return;
      }

      res.json({
        answer: `Today's Mess Menu at ${hostel}:\n- Breakfast: ${menu.breakfast}\n- Lunch: ${menu.lunch}\n- Snacks: ${menu.snacks}\n- Dinner: ${menu.dinner}`,
        source: "Hostel Mess Database",
        contactOffice: "Hostel Office"
      });
      return;
    }

    // 3. Fee & Dues Query
    if (q.includes("fee") || q.includes("due") || q.includes("payment") || q.includes("dues")) {
      if (!user.rollNumber) {
        res.json({
          answer: "Your account does not have a roll number linked. Please update your profile or contact the Accounts Office.",
          contactOffice: "Accounts & Finance Office (Admin Block Room 104)"
        });
        return;
      }

      const fee = await prisma.feeRecord.findFirst({
        where: { rollNumber: user.rollNumber },
        orderBy: { importedAt: "desc" }
      });

      if (!fee) {
        res.json({
          answer: `No fee record is registered for roll number ${user.rollNumber} in the database.`,
          contactOffice: "Accounts Office, Email: accounts@campusdesk.edu"
        });
        return;
      }

      res.json({
        answer: `Fee Status for ${fee.studentName} (Semester ${fee.semester}):\n- Total: Rs. ${fee.totalFee}\n- Paid: Rs. ${fee.paidFee}\n- Due Amount: Rs. ${fee.dueFee}\n- Due Date: ${new Date(fee.dueDate).toLocaleDateString()}\n- Status: ${fee.status}`,
        source: "Accounts Fee Database",
        contactOffice: "Accounts Office"
      });
      return;
    }

    // 4. Gate Pass Status Query
    if (q.includes("gate pass") || q.includes("leave pass") || q.includes("pass status")) {
      const latestPass = await prisma.gatePass.findFirst({
        where: { studentId: user.id },
        orderBy: { createdAt: "desc" }
      });

      if (!latestPass) {
        res.json({
          answer: "You have not submitted any gate pass or leave requests yet.",
          contactOffice: "Hostel Warden Office"
        });
        return;
      }

      res.json({
        answer: `Latest Gate Pass #${latestPass.passNumber}:\n- Status: ${latestPass.status}\n- Destination: ${latestPass.destination}\n- Departure: ${new Date(latestPass.departureDate).toLocaleString()}\n- Warden Note: ${latestPass.wardenComment || "None"}`,
        source: "Gate Pass Registry",
        contactOffice: "Hostel Warden Office"
      });
      return;
    }

    // 5. Open Ticket / Maintenance Query
    if (q.includes("complaint") || q.includes("ticket") || q.includes("repair") || q.includes("maintenance")) {
      const latestTicket = await prisma.ticket.findFirst({
        where: { studentId: user.id },
        orderBy: { createdAt: "desc" }
      });

      if (!latestTicket) {
        res.json({
          answer: "You have no active maintenance complaints registered in the system.",
          contactOffice: "Hostel Maintenance Desk"
        });
        return;
      }

      res.json({
        answer: `Latest Ticket #${latestTicket.ticketNumber}:\n- Title: ${latestTicket.title}\n- Category: ${latestTicket.category}\n- Status: ${latestTicket.status}\n- Escalation Level: ${latestTicket.escalationLevel === 0 ? "Normal Queue" : latestTicket.escalationLevel === 1 ? "Escalated to Warden" : "Escalated to Admin"}`,
        source: "Ticket Tracking Database",
        contactOffice: "Hostel Maintenance Supervisor"
      });
      return;
    }

    // 6. Contact Directory / Timings
    if (q.includes("contact") || q.includes("phone") || q.includes("warden") || q.includes("timing") || q.includes("hours") || q.includes("office")) {
      res.json({
        answer: "Campus Office Directory and Working Hours (Monday to Saturday, 09:00 to 17:00):\n- Hostel Warden Office: +91-9876543201 (warden@campusdesk.edu)\n- Maintenance Supervisor: +91-9876543202 (maintenance@campusdesk.edu)\n- Academic & Exam Section: +91-9876543203 (academics@campusdesk.edu)\n- Accounts Office: +91-9876543204 (accounts@campusdesk.edu)\n- Main Security Gate: +91-9876543205",
        source: "College Administration Directory",
        contactOffice: "Central Administration"
      });
      return;
    }

    // Fallback: strictly honest, no hallucination
    res.json({
      answer: "This information is not available in the campus database. Please contact the relevant office directly.",
      source: "Database Lookup",
      contactOffice: "Campus Administrative Desk, Office Room 101 (Tel: +91-9876543200, Email: helpdesk@campusdesk.edu)"
    });
  } catch (err: any) {
    res.status(500).json({ error: "FAQ service error." });
  }
});
