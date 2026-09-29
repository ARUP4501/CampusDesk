import { prisma } from "../prisma.js";
import { classifierService } from "./classifier.service.js";

export interface CommandResponse {
  success: boolean;
  command: string;
  message: string;
  data?: Record<string, any>;
  printableTicketId?: string;
}

export async function parseAndExecuteCommand(
  rawCommand: string,
  studentRollNumber?: string,
  actingUserId?: string
): Promise<CommandResponse> {
  const trimmed = rawCommand.trim();
  if (!trimmed) {
    return {
      success: false,
      command: "",
      message: "Empty command received. Type HELP for a list of valid commands."
    };
  }

  const parts = trimmed.split(/\s+/);
  const verb = parts[0].toUpperCase();
  const rest = parts.slice(1).join(" ");

  // Resolve student context
  let student = null;
  if (studentRollNumber) {
    student = await prisma.user.findFirst({
      where: { rollNumber: studentRollNumber.trim().toUpperCase() }
    });
  } else if (actingUserId) {
    student = await prisma.user.findUnique({
      where: { id: actingUserId }
    });
  }

  switch (verb) {
    case "HELP":
      return {
        success: true,
        command: "HELP",
        message: [
          "CampusDesk Text Command Console:",
          "1. STATUS <ticket_or_pass_number> - View live status of a ticket or gate pass",
          "2. COMPLAIN <description> [room] - Submit a maintenance complaint",
          "3. PASS <destination> <reason> - Submit an outing gate pass request",
          "4. MESS [today|tomorrow|monday..sunday] - View daily mess menu",
          "5. NOTICES - View top recent campus notices",
          "6. CANCEL - View today's class cancellations",
          "7. FEES - View pending fee status"
        ].join("\n")
      };

    case "STATUS": {
      if (!rest) {
        return { success: false, command: "STATUS", message: "Please provide a ticket or pass number. Example: STATUS CD-1001" };
      }
      const queryId = rest.trim().toUpperCase();

      // Check ticket
      const ticket = await prisma.ticket.findFirst({
        where: {
          OR: [
            { ticketNumber: queryId },
            { id: queryId }
          ]
        },
        include: { assignedStaff: true }
      });

      if (ticket) {
        const staffName = ticket.assignedStaff ? ticket.assignedStaff.fullName : "Unassigned (Queue)";
        return {
          success: true,
          command: "STATUS",
          message: `Ticket #${ticket.ticketNumber}\nStatus: ${ticket.status}\nCategory: ${ticket.category}\nLocation: ${ticket.hostelBlock} ${ticket.roomNumber}\nAssigned: ${staffName}\nTitle: ${ticket.title}`,
          data: { type: "TICKET", ticket }
        };
      }

      // Check gate pass
      const pass = await prisma.gatePass.findFirst({
        where: {
          OR: [
            { passNumber: queryId },
            { id: queryId }
          ]
        },
        include: { student: true }
      });

      if (pass) {
        return {
          success: true,
          command: "STATUS",
          message: `Gate Pass #${pass.passNumber}\nStudent: ${pass.student.fullName} (${pass.student.rollNumber})\nType: ${pass.type}\nStatus: ${pass.status}\nDestination: ${pass.destination}\nWarden Remark: ${pass.wardenComment || "None"}`,
          data: { type: "GATEPASS", pass }
        };
      }

      return {
        success: false,
        command: "STATUS",
        message: `No ticket or gate pass found matching ID "${queryId}". Please verify the reference number.`
      };
    }

    case "COMPLAIN": {
      if (!student) {
        return {
          success: false,
          command: "COMPLAIN",
          message: "Student roll number is required to file a complaint on their behalf."
        };
      }
      if (!rest || rest.length < 5) {
        return {
          success: false,
          command: "COMPLAIN",
          message: "Please describe the problem. Example: COMPLAIN tap leaking in washroom B-204"
        };
      }

      // Classify text
      const prediction = classifierService.classify(rest);
      const category = prediction.category;
      const count = await prisma.ticket.count();
      const ticketNumber = `CD-${1000 + count + 1}`;
      const hostel = student.hostelBlock || "Hostel-A";
      const room = student.roomNumber || "General";

      const newTicket = await prisma.ticket.create({
        data: {
          ticketNumber,
          studentId: student.id,
          title: rest.slice(0, 60),
          description: rest,
          category,
          predictedCategory: category,
          hostelBlock: hostel,
          roomNumber: room,
          priority: "MEDIUM",
          status: "SUBMITTED"
        }
      });

      // Audit log
      await prisma.ticketAuditLog.create({
        data: {
          ticketId: newTicket.id,
          changedById: student.id,
          toStatus: "SUBMITTED",
          action: "TEXT_COMMAND_CREATION",
          note: `Ticket created via Command Console. Auto-classified as ${category} (confidence: ${(prediction.confidence * 100).toFixed(0)}%).`
        }
      });

      return {
        success: true,
        command: "COMPLAIN",
        message: `Complaint registered successfully!\nTicket Number: ${ticketNumber}\nCategory: ${category}\nAssigned Queue: ${hostel} Maintenance\nStatus: SUBMITTED`,
        data: { ticket: newTicket },
        printableTicketId: newTicket.id
      };
    }

    case "PASS": {
      if (!student) {
        return {
          success: false,
          command: "PASS",
          message: "Student roll number is required to request a gate pass."
        };
      }
      if (!rest) {
        return {
          success: false,
          command: "PASS",
          message: "Format: PASS <destination> <reason>. Example: PASS Bhubaneswar Market Grocery shopping"
        };
      }

      const passCount = await prisma.gatePass.count();
      const passNumber = `GP-${5000 + passCount + 1}`;
      const now = new Date();
      const departure = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
      const returnDate = new Date(now.getTime() + 6 * 60 * 60 * 1000); // 6 hours from now

      const gatePass = await prisma.gatePass.create({
        data: {
          passNumber,
          studentId: student.id,
          type: "OUTING",
          departureDate: departure,
          expectedReturnDate: returnDate,
          destination: rest.split(" ")[0] || "City",
          reason: rest,
          parentContact: student.phone || "0000000000",
          status: "PENDING"
        }
      });

      return {
        success: true,
        command: "PASS",
        message: `Gate pass request #${passNumber} submitted for ${student.fullName}. Status is PENDING Warden review.`,
        data: { gatePass }
      };
    }

    case "MESS": {
      const dayMap: Record<string, number> = {
        SUNDAY: 7,
        MONDAY: 1,
        TUESDAY: 2,
        WEDNESDAY: 3,
        THURSDAY: 4,
        FRIDAY: 5,
        SATURDAY: 6
      };

      let targetDay = new Date().getDay();
      if (targetDay === 0) targetDay = 7; // Sunday = 7

      const sub = rest.trim().toUpperCase();
      if (sub === "TOMORROW") {
        targetDay = (targetDay % 7) + 1;
      } else if (dayMap[sub]) {
        targetDay = dayMap[sub];
      }

      const hostel = student?.hostelBlock || "Hostel-A";
      const menu = await prisma.messMenu.findFirst({
        where: { hostelBlock: hostel, dayOfWeek: targetDay }
      });

      if (!menu) {
        return {
          success: true,
          command: "MESS",
          message: `No mess menu updated yet for ${hostel} on day ${targetDay}.`
        };
      }

      return {
        success: true,
        command: "MESS",
        message: `Mess Menu (${hostel} - Day ${targetDay}):\nBreakfast: ${menu.breakfast}\nLunch: ${menu.lunch}\nSnacks: ${menu.snacks}\nDinner: ${menu.dinner}`,
        data: { menu }
      };
    }

    case "NOTICES": {
      const notices = await prisma.notice.findMany({
        take: 3,
        orderBy: { createdAt: "desc" }
      });

      if (notices.length === 0) {
        return { success: true, command: "NOTICES", message: "No active notices published at this time." };
      }

      const lines = notices.map((n, idx) => `${idx + 1}. [${n.priority}] ${n.title} (${new Date(n.createdAt).toLocaleDateString()})`);
      return {
        success: true,
        command: "NOTICES",
        message: `Recent College Notices:\n${lines.join("\n")}`,
        data: { notices }
      };
    }

    case "CANCEL": {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

      const cancels = await prisma.classCancellation.findMany({
        where: { date: { gte: today, lt: tomorrow } }
      });

      if (cancels.length === 0) {
        return { success: true, command: "CANCEL", message: "No class cancellations posted for today. All scheduled classes are running." };
      }

      const lines = cancels.map((c) => `- ${c.subjectName} (${c.branch} Year ${c.year}) by ${c.facultyName}: Reason: ${c.reason}`);
      return {
        success: true,
        command: "CANCEL",
        message: `Class Cancellations Today:\n${lines.join("\n")}`,
        data: { cancels }
      };
    }

    case "FEES": {
      if (!student || !student.rollNumber) {
        return {
          success: false,
          command: "FEES",
          message: "Please provide a valid student roll number to check fee status."
        };
      }

      const fee = await prisma.feeRecord.findFirst({
        where: { rollNumber: student.rollNumber },
        orderBy: { importedAt: "desc" }
      });

      if (!fee) {
        return {
          success: true,
          command: "FEES",
          message: `No fee records found on file for Roll Number ${student.rollNumber}. Please contact the Accounts Office.`
        };
      }

      return {
        success: true,
        command: "FEES",
        message: `Fee Status for ${fee.studentName} (${fee.rollNumber}):\nTotal Fee: Rs. ${fee.totalFee}\nPaid Fee: Rs. ${fee.paidFee}\nDue Fee: Rs. ${fee.dueFee}\nDue Date: ${new Date(fee.dueDate).toLocaleDateString()}\nStatus: ${fee.status}`,
        data: { fee }
      };
    }

    default:
      return {
        success: false,
        command: verb,
        message: `Unknown command "${verb}". Type HELP to see available commands.`
      };
  }
}
