import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding CampusDesk database with verified sample dataset...");

  // Clear existing records in logical order
  await prisma.auditLog.deleteMany();
  await prisma.studentDocument.deleteMany();
  await prisma.hostelTransferRequest.deleteMany();
  await prisma.bed.deleteMany();
  await prisma.room.deleteMany();
  await prisma.hostel.deleteMany();
  await prisma.inAppNotification.deleteMany();
  await prisma.pushSubscription.deleteMany();
  await prisma.ticketAuditLog.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.gatePass.deleteMany();
  await prisma.noticeRecipient.deleteMany();
  await prisma.notice.deleteMany();
  await prisma.courseSchedule.deleteMany();
  await prisma.classCancellation.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.messFeedback.deleteMany();
  await prisma.messMenu.deleteMany();
  await prisma.documentRequest.deleteMany();
  await prisma.feeRecord.deleteMany();
  await prisma.classifierTrainingData.deleteMany();
  await prisma.user.deleteMany();

  const commonPassword = await argon2.hash("Password@123");

  // 1. Create Hostels
  const hostelA = await prisma.hostel.create({
    data: {
      name: "Hostel-A",
      type: "BOYS",
      description: "Senior Boys Hostel (Blocks 1-4)",
      totalRooms: 12,
      totalBeds: 24
    }
  });

  const hostelB = await prisma.hostel.create({
    data: {
      name: "Hostel-B",
      type: "BOYS",
      description: "Junior Boys Hostel (Blocks 5-8)",
      totalRooms: 10,
      totalBeds: 20
    }
  });

  const hostelC = await prisma.hostel.create({
    data: {
      name: "Hostel-C",
      type: "GIRLS",
      description: "Girls Campus Hostel (Blocks 1-6)",
      totalRooms: 10,
      totalBeds: 20
    }
  });

  // 2. Create Rooms and Beds for Hostel-A
  const roomsA = ["A-101", "A-102", "A-201", "A-202", "A-204"];
  const roomMap: Record<string, any> = {};

  for (const rNum of roomsA) {
    const r = await prisma.room.create({
      data: {
        roomNumber: rNum,
        hostelId: hostelA.id,
        hostelBlock: "Hostel-A",
        floor: rNum.startsWith("A-1") ? 1 : 2,
        capacity: 2
      }
    });
    roomMap[rNum] = r;

    // Create 2 beds for each room
    await prisma.bed.createMany({
      data: [
        {
          bedNumber: "Bed-1",
          roomId: r.id,
          roomNumber: rNum,
          hostelBlock: "Hostel-A",
          status: "AVAILABLE"
        },
        {
          bedNumber: "Bed-2",
          roomId: r.id,
          roomNumber: rNum,
          hostelBlock: "Hostel-A",
          status: "AVAILABLE"
        }
      ]
    });
  }

  // Create Rooms and Beds for Hostel-B
  const roomsB = ["B-101", "B-102", "B-108"];
  for (const rNum of roomsB) {
    const r = await prisma.room.create({
      data: {
        roomNumber: rNum,
        hostelId: hostelB.id,
        hostelBlock: "Hostel-B",
        floor: 1,
        capacity: 2
      }
    });
    roomMap[rNum] = r;

    await prisma.bed.createMany({
      data: [
        {
          bedNumber: "Bed-1",
          roomId: r.id,
          roomNumber: rNum,
          hostelBlock: "Hostel-B",
          status: "AVAILABLE"
        },
        {
          bedNumber: "Bed-2",
          roomId: r.id,
          roomNumber: rNum,
          hostelBlock: "Hostel-B",
          status: "AVAILABLE"
        }
      ]
    });
  }

  // 3. Create Admin & Wardens
  const admin = await prisma.user.create({
    data: {
      email: "admin@campusdesk.edu",
      passwordHash: commonPassword,
      fullName: "Prof. R. N. Rath",
      role: "ADMIN",
      phone: "9876543200",
      department: "Central Administration",
      verificationStatus: "ACTIVE",
      isActive: true
    }
  });

  const wardenA = await prisma.user.create({
    data: {
      email: "warden@campusdesk.edu",
      passwordHash: commonPassword,
      fullName: "Dr. S. K. Mahapatra",
      role: "WARDEN",
      phone: "9876543201",
      department: "Hostel Administration",
      hostelBlock: "Hostel-A",
      employeeId: "EMP-WRD-001",
      verificationStatus: "ACTIVE",
      isActive: true
    }
  });

  const wardenB = await prisma.user.create({
    data: {
      email: "wardenb@campusdesk.edu",
      passwordHash: commonPassword,
      fullName: "Dr. A. K. Nayak",
      role: "WARDEN",
      phone: "9876543208",
      department: "Hostel Administration",
      hostelBlock: "Hostel-B",
      employeeId: "EMP-WRD-002",
      verificationStatus: "ACTIVE",
      isActive: true
    }
  });

  // Update Hostel warden links
  await prisma.hostel.update({
    where: { id: hostelA.id },
    data: { wardenId: wardenA.id }
  });
  await prisma.hostel.update({
    where: { id: hostelB.id },
    data: { wardenId: wardenB.id }
  });

  // 4. Create Staff
  const staff = await prisma.user.create({
    data: {
      email: "staff@campusdesk.edu",
      passwordHash: commonPassword,
      fullName: "Manoj Kumar",
      role: "STAFF",
      phone: "9876543202",
      department: "Plumbing & Maintenance",
      employeeId: "EMP-STF-001",
      verificationStatus: "ACTIVE",
      isActive: true
    }
  });

  const electricalStaff = await prisma.user.create({
    data: {
      email: "electrical@campusdesk.edu",
      passwordHash: commonPassword,
      fullName: "Bikash Pradhan",
      role: "STAFF",
      phone: "9876543206",
      department: "Electrical Maintenance",
      employeeId: "EMP-STF-002",
      verificationStatus: "ACTIVE",
      isActive: true
    }
  });

  // 5. Create Core Active Demo Students
  const student = await prisma.user.create({
    data: {
      email: "student@campusdesk.edu",
      passwordHash: commonPassword,
      fullName: "Aarav Sharma",
      role: "STUDENT",
      rollNumber: "2024CS101",
      phone: "9876543210",
      dob: new Date("2003-05-14"),
      gender: "MALE",
      bloodGroup: "O+",
      course: "B.Tech",
      department: "Computer Science & Engineering",
      branch: "CSE",
      year: 2,
      semester: 4,
      batch: "2024-2028",
      permanentAddress: "Flat 402, Niladri Vihar, Chandrasekharpur, Bhubaneswar, Odisha 751024",
      currentAddress: "Room A-204, Bed-1, Hostel-A, Campus",
      fatherName: "Rajesh Sharma",
      fatherPhone: "9876543288",
      motherName: "Sunita Sharma",
      motherPhone: "9876543289",
      guardianName: "Dr. Alok Mohanty",
      guardianRelation: "Uncle",
      guardianPhone: "9876543290",
      guardianAddress: "Plot 12, Saheed Nagar, Bhubaneswar",
      hostelBlock: "Hostel-A",
      roomNumber: "A-204",
      bedNumber: "Bed-1",
      requestedHostel: "Hostel-A",
      verificationStatus: "ACTIVE",
      wardenVerificationDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      wardenVerificationById: wardenA.id,
      adminApprovalDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
      adminApprovalById: admin.id,
      isActive: true
    }
  });

  // Assign Bed-1 of A-204 to student
  const bedA204_1 = await prisma.bed.findFirst({
    where: { hostelBlock: "Hostel-A", roomNumber: "A-204", bedNumber: "Bed-1" }
  });
  if (bedA204_1) {
    await prisma.bed.update({
      where: { id: bedA204_1.id },
      data: { status: "OCCUPIED", studentId: student.id }
    });
  }

  const student2 = await prisma.user.create({
    data: {
      email: "priya@campusdesk.edu",
      passwordHash: commonPassword,
      fullName: "Priya Patel",
      role: "STUDENT",
      rollNumber: "2024CS102",
      phone: "9876543211",
      dob: new Date("2004-02-20"),
      gender: "FEMALE",
      bloodGroup: "B+",
      course: "B.Tech",
      department: "Computer Science & Engineering",
      branch: "CSE",
      year: 2,
      semester: 4,
      batch: "2024-2028",
      permanentAddress: "Sector 5, Rourkela, Odisha 769002",
      currentAddress: "Room B-108, Bed-1, Hostel-B, Campus",
      fatherName: "Kishore Patel",
      fatherPhone: "9876543291",
      motherName: "Meena Patel",
      motherPhone: "9876543292",
      guardianName: "Sanjay Patel",
      guardianRelation: "Cousin",
      guardianPhone: "9876543293",
      guardianAddress: "Cuttack Road, Bhubaneswar",
      hostelBlock: "Hostel-B",
      roomNumber: "B-108",
      bedNumber: "Bed-1",
      requestedHostel: "Hostel-B",
      verificationStatus: "ACTIVE",
      wardenVerificationDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      wardenVerificationById: wardenB.id,
      adminApprovalDate: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000),
      adminApprovalById: admin.id,
      isActive: true
    }
  });

  const bedB108_1 = await prisma.bed.findFirst({
    where: { hostelBlock: "Hostel-B", roomNumber: "B-108", bedNumber: "Bed-1" }
  });
  if (bedB108_1) {
    await prisma.bed.update({
      where: { id: bedB108_1.id },
      data: { status: "OCCUPIED", studentId: student2.id }
    });
  }

  // 6. Create Students in Verification Workflow
  // A. Pending Warden Verification for Hostel-A
  const studentPendingWardenA = await prisma.user.create({
    data: {
      email: "rohan.verma@campusdesk.edu",
      passwordHash: commonPassword,
      fullName: "Rohan Verma",
      role: "STUDENT",
      rollNumber: "2024CS103",
      phone: "9876543213",
      dob: new Date("2004-08-11"),
      gender: "MALE",
      bloodGroup: "A+",
      course: "B.Tech",
      department: "Computer Science & Engineering",
      branch: "CSE",
      year: 1,
      semester: 1,
      batch: "2024-2028",
      permanentAddress: "Quarter 3B, Nalco Nagar, Angul, Odisha",
      fatherName: "Suresh Verma",
      fatherPhone: "9876543294",
      motherName: "Anjali Verma",
      motherPhone: "9876543295",
      guardianName: "Manoj Verma",
      guardianRelation: "Brother",
      guardianPhone: "9876543296",
      guardianAddress: "Patia, Bhubaneswar",
      requestedHostel: "Hostel-A",
      roomPreference: "Double Sharing",
      verificationStatus: "PENDING_WARDEN_VERIFICATION",
      isActive: false
    }
  });

  // B. Pending Admin Approval for Hostel-A (Approved by Warden)
  const studentPendingAdminA = await prisma.user.create({
    data: {
      email: "sneha.mohanty@campusdesk.edu",
      passwordHash: commonPassword,
      fullName: "Sneha Mohanty",
      role: "STUDENT",
      rollNumber: "2024CS104",
      phone: "9876543214",
      dob: new Date("2003-11-25"),
      gender: "FEMALE",
      bloodGroup: "AB+",
      course: "B.Tech",
      department: "Electronics & Communication Engineering",
      branch: "ECE",
      year: 1,
      semester: 1,
      batch: "2024-2028",
      permanentAddress: "Main Road, Berhampur, Ganjam, Odisha",
      fatherName: "Pradeep Mohanty",
      fatherPhone: "9876543297",
      motherName: "Geeta Mohanty",
      motherPhone: "9876543298",
      requestedHostel: "Hostel-A",
      verificationStatus: "PENDING_ADMIN_APPROVAL",
      wardenVerificationDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      wardenVerificationById: wardenA.id,
      isActive: false
    }
  });

  // C. Rejected by Warden for Hostel-A
  const studentRejectedWardenA = await prisma.user.create({
    data: {
      email: "amit.das@campusdesk.edu",
      passwordHash: commonPassword,
      fullName: "Amit Das",
      role: "STUDENT",
      rollNumber: "2024CS105",
      phone: "9876543215",
      dob: new Date("2003-09-19"),
      gender: "MALE",
      bloodGroup: "B-",
      course: "MCA",
      department: "Computer Applications",
      branch: "MCA",
      year: 1,
      semester: 1,
      batch: "2024-2026",
      permanentAddress: "Balasore Town, Odisha",
      fatherName: "Bhabani Das",
      fatherPhone: "9876543299",
      requestedHostel: "Hostel-A",
      verificationStatus: "REJECTED_BY_WARDEN",
      rejectionReason: "Incomplete address proof and invalid guardian contact number provided.",
      wardenVerificationDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      wardenVerificationById: wardenA.id,
      isActive: false
    }
  });

  // D. Pending Warden Verification for Hostel-B
  const studentPendingWardenB = await prisma.user.create({
    data: {
      email: "kavita.sahoo@campusdesk.edu",
      passwordHash: commonPassword,
      fullName: "Kavita Sahoo",
      role: "STUDENT",
      rollNumber: "2024CS106",
      phone: "9876543216",
      dob: new Date("2004-01-05"),
      gender: "FEMALE",
      bloodGroup: "O-",
      course: "B.Tech",
      department: "Mechanical Engineering",
      branch: "MECH",
      year: 1,
      semester: 1,
      batch: "2024-2028",
      permanentAddress: "Puri, Odisha",
      fatherName: "Narayan Sahoo",
      fatherPhone: "9876543277",
      requestedHostel: "Hostel-B",
      verificationStatus: "PENDING_WARDEN_VERIFICATION",
      isActive: false
    }
  });

  // 7. Create Student Documents
  await prisma.studentDocument.createMany({
    data: [
      {
        studentId: student.id,
        docType: "ID_PROOF",
        docName: "Aadhaar_Card_Aarav.pdf",
        status: "VERIFIED",
        verifiedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
      },
      {
        studentId: student.id,
        docType: "ADMISSION_PROOF",
        docName: "Rank_Card_Allotment_Letter.pdf",
        status: "VERIFIED",
        verifiedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
      },
      {
        studentId: studentPendingWardenA.id,
        docType: "ID_PROOF",
        docName: "Aadhaar_Card_Rohan.pdf",
        status: "PENDING"
      },
      {
        studentId: studentPendingWardenA.id,
        docType: "ADMISSION_PROOF",
        docName: "College_Admission_Receipt_2024.pdf",
        status: "PENDING"
      },
      {
        studentId: studentPendingAdminA.id,
        docType: "ID_PROOF",
        docName: "Govt_ID_Sneha.pdf",
        status: "VERIFIED",
        verifiedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      }
    ]
  });

  // 8. Create Hostel Transfer Request
  await prisma.hostelTransferRequest.create({
    data: {
      requestNumber: "TRF-2026-001",
      studentId: student.id,
      fromHostel: "Hostel-A",
      fromRoom: "A-204",
      fromBed: "Bed-1",
      toHostel: "Hostel-B",
      toRoom: "B-102",
      reason: "Requesting transfer closer to campus computer center for academic project work.",
      status: "PENDING_WARDEN",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
    }
  });

  // 9. Create System Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        action: "STUDENT_REGISTERED",
        actorId: studentPendingWardenA.id,
        actorRole: "STUDENT",
        targetType: "STUDENT",
        targetId: studentPendingWardenA.id,
        details: "Student Rohan Verma (2024CS103) submitted registration for Hostel-A.",
        hostelBlock: "Hostel-A",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        action: "WARDEN_APPROVED_STUDENT",
        actorId: wardenA.id,
        actorRole: "WARDEN",
        targetType: "STUDENT",
        targetId: studentPendingAdminA.id,
        details: "Warden Dr. S. K. Mahapatra verified and approved student Sneha Mohanty (2024CS104).",
        hostelBlock: "Hostel-A",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        action: "WARDEN_REJECTED_STUDENT",
        actorId: wardenA.id,
        actorRole: "WARDEN",
        targetType: "STUDENT",
        targetId: studentRejectedWardenA.id,
        details: "Warden Dr. S. K. Mahapatra rejected Amit Das (2024CS105). Reason: Incomplete address proof.",
        hostelBlock: "Hostel-A",
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
      },
      {
        action: "BED_ALLOCATED",
        actorId: admin.id,
        actorRole: "ADMIN",
        targetType: "BED",
        targetId: bedA204_1?.id || "bed-1",
        details: "Admin assigned Bed-1 in Room A-204 (Hostel-A) to student Aarav Sharma (2024CS101).",
        hostelBlock: "Hostel-A",
        createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
      },
      {
        action: "ADMIN_APPROVED_STUDENT",
        actorId: admin.id,
        actorRole: "ADMIN",
        targetType: "STUDENT",
        targetId: student.id,
        details: "Admin Prof. R. N. Rath granted final activation for student Aarav Sharma.",
        hostelBlock: "Hostel-A",
        createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
      }
    ]
  });

  // 10. Create Sample Tickets & Immutable Audit Trails
  const ticket1 = await prisma.ticket.create({
    data: {
      ticketNumber: "CD-1001",
      studentId: student.id,
      title: "Tap leaking continuously in washroom",
      description: "The cold water tap under the sink in washroom A-204 is leaking and flooding the floor.",
      category: "PLUMBING",
      predictedCategory: "PLUMBING",
      hostelBlock: "Hostel-A",
      roomNumber: "A-204",
      priority: "HIGH",
      status: "SUBMITTED",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    }
  });

  await prisma.ticketAuditLog.create({
    data: {
      ticketId: ticket1.id,
      changedById: student.id,
      toStatus: "SUBMITTED",
      action: "TICKET_CREATED",
      note: "Ticket created by student. Auto-classified as PLUMBING (confidence: 96%)."
    }
  });

  const ticket2 = await prisma.ticket.create({
    data: {
      ticketNumber: "CD-1002",
      studentId: student.id,
      title: "Ceiling fan making clicking sound",
      description: "Ceiling fan regulator is stuck at speed 5 and blades are making loud clicking noise.",
      category: "ELECTRICAL",
      predictedCategory: "ELECTRICAL",
      hostelBlock: "Hostel-A",
      roomNumber: "A-204",
      priority: "MEDIUM",
      status: "ASSIGNED",
      assignedStaffId: electricalStaff.id,
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000)
    }
  });

  await prisma.ticketAuditLog.create({
    data: {
      ticketId: ticket2.id,
      changedById: admin.id,
      fromStatus: "SUBMITTED",
      toStatus: "ASSIGNED",
      action: "ASSIGNED_TO_STAFF",
      note: `Assigned to ${electricalStaff.fullName} by Administration`
    }
  });

  const ticket3 = await prisma.ticket.create({
    data: {
      ticketNumber: "CD-1003",
      studentId: student.id,
      title: "LAN port wall socket loose and disconnecting",
      description: "Ethernet wall socket in room A-204 is physically damaged, RJ45 cable disconnects constantly.",
      category: "INTERNET",
      predictedCategory: "INTERNET",
      hostelBlock: "Hostel-A",
      roomNumber: "A-204",
      priority: "LOW",
      status: "RESOLVED",
      assignedStaffId: electricalStaff.id,
      resolvedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000)
    }
  });

  await prisma.ticketAuditLog.create({
    data: {
      ticketId: ticket3.id,
      changedById: electricalStaff.id,
      fromStatus: "ASSIGNED",
      toStatus: "RESOLVED",
      action: "STATUS_CHANGE",
      note: "Replaced RJ-45 wall faceplate and tested Gigabit link."
    }
  });

  // 11. Create Gate Passes
  const gatePassApproved = await prisma.gatePass.create({
    data: {
      passNumber: "GP-2026-0001",
      studentId: student.id,
      type: "NIGHT_PASS",
      reason: "Weekend visit to family in Bhubaneswar for sister wedding reception.",
      destination: "Chandrasekharpur, Bhubaneswar",
      parentContact: "9876543288",
      departureDate: new Date(Date.now() + 4 * 60 * 60 * 1000),
      expectedReturnDate: new Date(Date.now() + 52 * 60 * 60 * 1000),
      status: "APPROVED",
      wardenComment: "Verified with father Mr. Rajesh Sharma. Approved.",
      approvedById: wardenA.id
    }
  });

  await prisma.gatePass.create({
    data: {
      passNumber: "GP-2026-0002",
      studentId: student.id,
      type: "DAY_PASS",
      reason: "Emergency medical consultation at AIIMS Bhubaneswar.",
      destination: "AIIMS Hospital, Sijua, Bhubaneswar",
      parentContact: "9876543288",
      departureDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      expectedReturnDate: new Date(Date.now() + 30 * 60 * 60 * 1000),
      status: "PENDING"
    }
  });

  // 12. Create Official Notices
  const notice1 = await prisma.notice.create({
    data: {
      title: "Hostel Maintenance & Electrical Inspection Schedule - Blocks A & B",
      content:
        "All residents of Hostel-A and Hostel-B are hereby notified that routine electrical audit and backup inverter maintenance will be conducted between 10:00 AM and 04:00 PM this coming Saturday. Power supply may experience brief intermittent disruptions. Please keep essential devices charged.",
      category: "HOSTEL",
      priority: "NORMAL",
      publishedById: admin.id,
      targetType: "HOSTEL",
      targetValue: "Hostel-A",
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
    }
  });

  const notice2 = await prisma.notice.create({
    data: {
      title: "Mid-Semester Examination Schedule Notification - Spring 2026",
      content:
        "The tentative timetable for Spring 2026 Mid-Semester Theory Examinations (2nd & 4th Year B.Tech) is published. Students are required to verify their subject codes and report any scheduling clashes to the Academic Cell before the 5th of next month.",
      category: "ACADEMIC",
      priority: "HIGH",
      publishedById: admin.id,
      targetType: "ALL",
      createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000)
    }
  });

  // Notice recipients
  await prisma.noticeRecipient.createMany({
    data: [
      { noticeId: notice1.id, studentId: student.id, isRead: false },
      { noticeId: notice2.id, studentId: student.id, isRead: true, readAt: new Date() }
    ]
  });

  // 13. Create Mess Menu
  const messData = [
    {
      day: 1, // MONDAY
      breakfast: "Idli, Sambar, Coconut Chutney, Banana, Tea/Coffee",
      lunch: "Steamed Rice, Dal Tadka, Aloo Gobi Matar, Curd, Papad, Salad",
      snacks: "Samosa (2 pcs), Green Chutney, Hot Tea",
      dinner: "Roti (4 pcs), Paneer Butter Masala, Jeera Rice, Dal Fry, Gulab Jamun (1 pc)"
    },
    {
      day: 2, // TUESDAY
      breakfast: "Puri, Aloo Dum, Boiled Egg / Sprouted Moong, Milk / Tea",
      lunch: "Jeera Rice, Rajma Masala, Bhindi Fry, Boondi Raita, Salad",
      snacks: "Veg Cutlet, Tomato Sauce, Ginger Tea",
      dinner: "Roti, Chicken Curry / Kadai Paneer, Yellow Dal, Steamed Rice, Ice Cream"
    },
    {
      day: 3, // WEDNESDAY
      breakfast: "Masala Dosa, Sambar, Tomato Chutney, Boiled Egg, Coffee",
      lunch: "Steamed Rice, Chana Dal, Baingan Bharta, Mix Veg Korma, Curd",
      snacks: "Poha with Roasted Peanuts, Sev, Lemon Tea",
      dinner: "Tandoori Roti, Egg Curry / Malai Kofta, Dal Makhani, Pulao, Rasgulla"
    },
    {
      day: 4, // THURSDAY
      breakfast: "Aloo Paratha, Curd, Mint Chutney, Fresh Fruits, Tea",
      lunch: "Steamed Rice, Dal Maharani, Seasonal Veg Sukha, Dahi Vada, Salad",
      snacks: "Bread Pakora, Mint Dip, Masala Chai",
      dinner: "Poori, Chole Masala, Veg Biryani, Raita, Kheer"
    },
    {
      day: 5, // FRIDAY
      breakfast: "Uttapam, Sambar, Peanut Chutney, Apple, Coffee",
      lunch: "Steamed Rice, Fish Curry / Shahi Paneer, Moong Dal, Cabbage Fry, Curd",
      snacks: "Biscuits & Veg Sandwich, Lemonade / Tea",
      dinner: "Chapati, Veg Manchurian, Fried Rice, Sweet Corn Soup, Fruit Custard"
    },
    {
      day: 6, // SATURDAY
      breakfast: "Upma with Coconut Chutney, Sprouts Salad, Boiled Egg, Milk",
      lunch: "Khichdi Special / Plain Rice, Panchmel Dal, Aloo Bhaja, Papad, Pickle",
      snacks: "Onion Pakoda, Green Chutney, Hot Coffee",
      dinner: "Butter Naan, Butter Chicken / Butter Paneer, Dal Tadka, Gajar Halwa"
    },
    {
      day: 0, // SUNDAY
      breakfast: "Chole Bhature (2 pcs), Sweet Lassi, Banana",
      lunch: "Hyderabadi Chicken Dum Biryani / Veg Dum Biryani, Mirchi Ka Salan, Raita",
      snacks: "Sweet Corn Chaat, Tea",
      dinner: "Phulka, Dal Palak, Paneer Do Pyaza, Steamed Rice, Brownie with Ice Cream"
    }
  ];

  for (const item of messData) {
    await prisma.messMenu.create({
      data: {
        dayOfWeek: item.day,
        hostelBlock: "Hostel-A",
        breakfast: item.breakfast,
        lunch: item.lunch,
        snacks: item.snacks,
        dinner: item.dinner
      }
    });
  }

  // 14. Create Course Schedule
  await prisma.courseSchedule.createMany({
    data: [
      {
        branch: "CSE",
        year: 2,
        batch: "2024",
        subjectCode: "CS401",
        subjectName: "Distributed Systems & Cloud Computing",
        facultyName: "Dr. K. R. Mohapatra",
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "10:30",
        room: "LH-301"
      },
      {
        branch: "CSE",
        year: 2,
        batch: "2024",
        subjectCode: "CS402",
        subjectName: "Design & Analysis of Algorithms",
        facultyName: "Prof. S. Swain",
        dayOfWeek: 1,
        startTime: "11:00",
        endTime: "12:30",
        room: "LH-302"
      },
      {
        branch: "CSE",
        year: 2,
        batch: "2024",
        subjectCode: "CS403",
        subjectName: "Database Engineering & SQL Internals",
        facultyName: "Dr. P. K. Sahoo",
        dayOfWeek: 2,
        startTime: "10:00",
        endTime: "11:30",
        room: "LH-301"
      }
    ]
  });

  // 15. Create Attendance Records
  await prisma.attendanceRecord.createMany({
    data: [
      {
        studentId: student.id,
        subjectCode: "CS401",
        subjectName: "Distributed Systems & Cloud Computing",
        totalClasses: 36,
        attendedClasses: 31,
        semester: 4
      },
      {
        studentId: student.id,
        subjectCode: "CS402",
        subjectName: "Design & Analysis of Algorithms",
        totalClasses: 34,
        attendedClasses: 27,
        semester: 4
      },
      {
        studentId: student.id,
        subjectCode: "CS403",
        subjectName: "Database Engineering & SQL Internals",
        totalClasses: 38,
        attendedClasses: 35,
        semester: 4
      }
    ]
  });

  // 16. Create Document Requests
  await prisma.documentRequest.create({
    data: {
      requestNumber: "DOC-3001",
      studentId: student.id,
      docType: "BONAFIDE",
      purpose: "Passport verification and Odisha State Scholarship renewal application",
      status: "APPROVED",
      approvedById: admin.id,
      generatedPdfUrl: "/documents/sample-bonafide.pdf"
    }
  });

  await prisma.documentRequest.create({
    data: {
      requestNumber: "DOC-3002",
      studentId: student.id,
      docType: "FEE_ESTIMATE",
      purpose: "Bank education loan renewal for 3rd year",
      status: "SUBMITTED"
    }
  });

  // 17. Create Fee Records
  await prisma.feeRecord.createMany({
    data: [
      {
        rollNumber: "2024CS101",
        studentName: "Aarav Sharma",
        totalFee: 55000,
        paidFee: 55000,
        dueFee: 0,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        semester: 4,
        academicYear: "2025-26",
        status: "PAID"
      },
      {
        rollNumber: "2024CS102",
        studentName: "Priya Patel",
        totalFee: 55000,
        paidFee: 30000,
        dueFee: 25000,
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        semester: 4,
        academicYear: "2025-26",
        status: "PARTIAL"
      }
    ]
  });

  // 18. Create In-App Notification
  await prisma.inAppNotification.create({
    data: {
      userId: student.id,
      title: "Bonafide Certificate Approved",
      message: "Your Bonafide Certificate #DOC-3001 has been approved and is ready for download.",
      type: "DOCUMENT",
      linkUrl: "/documents"
    }
  });

  console.log("Database seeded successfully with all sample records!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
