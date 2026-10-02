import { prisma } from "../prisma.js";

export interface AssignmentResult {
  assignedStaffId: string | null;
  assignedStaffName?: string;
  slaDeadline: Date;
  explanation: string;
}

export class AssignmentService {
  /**
   * Calculate SLA Deadline from priority
   */
  public calculateSlaDeadline(priority: string, fromDate: Date = new Date()): Date {
    const deadline = new Date(fromDate.getTime());
    switch (priority) {
      case "CRITICAL":
      case "EMERGENCY":
        deadline.setHours(deadline.getHours() + 4);
        break;
      case "HIGH":
        deadline.setHours(deadline.getHours() + 12);
        break;
      case "MEDIUM":
        deadline.setHours(deadline.getHours() + 24);
        break;
      case "LOW":
      default:
        deadline.setHours(deadline.getHours() + 48);
        break;
    }
    return deadline;
  }

  /**
   * Smart Staff Workload & Skill-Based Assignment
   */
  public async smartAssignStaff(category: string, _hostelBlock?: string): Promise<AssignmentResult> {
    const defaultDeadline = this.calculateSlaDeadline("MEDIUM");

    try {
      // 1. Map ticket category to department keyword
      let departmentKeyword = "";
      switch (category) {
        case "ELECTRICAL":
          departmentKeyword = "Electrical";
          break;
        case "PLUMBING":
          departmentKeyword = "Plumbing";
          break;
        case "NETWORK_WIFI":
          departmentKeyword = "IT";
          break;
        case "HOUSEKEEPING":
          departmentKeyword = "Housekeeping";
          break;
        case "CARPENTRY":
        case "MASONRY":
          departmentKeyword = "Maintenance";
          break;
        case "SECURITY":
          departmentKeyword = "Security";
          break;
        default:
          departmentKeyword = "";
          break;
      }

      // 2. Query active staff candidates
      const allStaff = await prisma.user.findMany({
        where: {
          role: "STAFF",
          isActive: true
        },
        select: {
          id: true,
          fullName: true,
          department: true,
          phone: true,
          email: true
        }
      });

      if (allStaff.length === 0) {
        return {
          assignedStaffId: null,
          slaDeadline: defaultDeadline,
          explanation: "No active operational staff registered in the directory."
        };
      }

      // Filter by department skill if match exists
      let eligibleStaff = allStaff;
      if (departmentKeyword) {
        const matched = allStaff.filter((s) =>
          s.department && s.department.toLowerCase().includes(departmentKeyword.toLowerCase())
        );
        if (matched.length > 0) {
          eligibleStaff = matched;
        }
      }

      // 3. Calculate current active workload per candidate
      const staffWorkloads = await Promise.all(
        eligibleStaff.map(async (s) => {
          const activeCount = await prisma.ticket.count({
            where: {
              assignedStaffId: s.id,
              status: { in: ["SUBMITTED", "ASSIGNED", "IN_PROGRESS"] }
            }
          });
          return {
            staff: s,
            activeCount
          };
        })
      );

      // 4. Sort by active workload ascending (least loaded staff first)
      staffWorkloads.sort((a, b) => a.activeCount - b.activeCount);
      const chosen = staffWorkloads[0];

      return {
        assignedStaffId: chosen.staff.id,
        assignedStaffName: chosen.staff.fullName,
        slaDeadline: defaultDeadline,
        explanation: `Smart Assigned to ${chosen.staff.fullName} (${chosen.staff.department || "General"}) based on skill match and lowest active workload (${chosen.activeCount} active tasks).`
      };
    } catch (err) {
      console.error("Smart assignment error:", err);
      return {
        assignedStaffId: null,
        slaDeadline: defaultDeadline,
        explanation: "Auto-assignment bypassed due to directory lookup exception."
      };
    }
  }
}

export const assignmentService = new AssignmentService();
