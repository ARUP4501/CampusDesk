import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding CampusDesk database with verified sample dataset...");

  // Clear existing records in logical order
  await prisma.academicBranch.deleteMany();
  await prisma.academicCourse.deleteMany();
  await prisma.emergency.deleteMany();
  await prisma.clubEventRegistration.deleteMany();
  await prisma.clubEvent.deleteMany();
  await prisma.clubAnnouncement.deleteMany();
  await prisma.clubMember.deleteMany();
  await prisma.club.deleteMany();
  await prisma.plannedMaintenance.deleteMany();
  await prisma.parcel.deleteMany();
  await prisma.routeStop.deleteMany();
  await prisma.busRoute.deleteMany();
  await prisma.bus.deleteMany();
  await prisma.transportRoute.deleteMany();
  await prisma.parkingZone.deleteMany();
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
  await prisma.studentResult.deleteMany();
  await prisma.attendanceRecordItem.deleteMany();
  await prisma.attendanceSession.deleteMany();
  await prisma.courseSchedule.deleteMany();
  await prisma.facultyAssignment.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.classCancellation.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.messFeedback.deleteMany();
  await prisma.messMenu.deleteMany();
  await prisma.documentRequest.deleteMany();
  await prisma.feeRecord.deleteMany();
  await prisma.classifierTrainingData.deleteMany();
  await prisma.user.deleteMany();

  const commonPassword = await argon2.hash("Password@123");
 
  // 0. Seed Academic Courses and Branches Master Data
  console.log("Seeding Academic Courses and Branches...");
  const courseMca = await prisma.academicCourse.create({
    data: {
      code: "MCA",
      name: "Master of Computer Applications",
      durationYears: 2,
      isActive: true,
      branches: {
        create: [
          { code: "CA", name: "Computer Applications", isActive: true },
          { code: "DS", name: "Data Science", isActive: true }
        ]
      }
    }
  });

  const courseBca = await prisma.academicCourse.create({
    data: {
      code: "BCA",
      name: "Bachelor of Computer Applications",
      durationYears: 3,
      isActive: true,
      branches: {
        create: [
          { code: "CA", name: "Computer Applications", isActive: true },
          { code: "DS", name: "Data Science", isActive: true }
        ]
      }
    }
  });

  const courseBba = await prisma.academicCourse.create({
    data: {
      code: "BBA",
      name: "Bachelor of Business Administration",
      durationYears: 3,
      isActive: true,
      branches: {
        create: [
          { code: "GEN", name: "General", isActive: true },
          { code: "FIN", name: "Finance", isActive: true },
          { code: "MKT", name: "Marketing", isActive: true },
          { code: "HRM", name: "Human Resource Management", isActive: true }
        ]
      }
    }
  });

  const courseBtech = await prisma.academicCourse.create({
    data: {
      code: "B.Tech",
      name: "Bachelor of Technology",
      durationYears: 4,
      isActive: true,
      branches: {
        create: [
          { code: "CSE", name: "Computer Science & Engineering", isActive: true },
          { code: "IT", name: "Information Technology", isActive: true },
          { code: "ECE", name: "Electronics & Communication Engineering", isActive: true },
          { code: "MECH", name: "Mechanical Engineering", isActive: true },
          { code: "CIVIL", name: "Civil Engineering", isActive: true }
        ]
      }
    }
  });

  const courseMba = await prisma.academicCourse.create({
    data: {
      code: "MBA",
      name: "Master of Business Administration",
      durationYears: 2,
      isActive: true,
      branches: {
        create: [
          { code: "FIN", name: "Finance", isActive: true },
          { code: "MKT", name: "Marketing", isActive: true },
          { code: "HRM", name: "Human Resource Management", isActive: true },
          { code: "OPS", name: "Operations", isActive: true }
        ]
      }
    }
  });

  const courseMtech = await prisma.academicCourse.create({
    data: {
      code: "M.Tech",
      name: "Master of Technology",
      durationYears: 2,
      isActive: true,
      branches: {
        create: [
          { code: "CSE", name: "Computer Science & Engineering", isActive: true },
          { code: "OTHER", name: "Other available specializations", isActive: true }
        ]
      }
    }
  });

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

  // 4b. Create Faculty
  const facultyCse = await prisma.user.create({
    data: {
      email: "faculty@campusdesk.edu",
      passwordHash: commonPassword,
      fullName: "Prof. Rajesh Sharma",
      role: "FACULTY",
      phone: "9876543204",
      department: "Computer Science & Engineering",
      employeeId: "FAC-CSE-001",
      verificationStatus: "ACTIVE",
      isActive: true
    }
  });

  const facultyMca = await prisma.user.create({
    data: {
      email: "faculty.mca@campusdesk.edu",
      passwordHash: commonPassword,
      fullName: "Dr. Ananya Patnaik",
      role: "FACULTY",
      phone: "9876543205",
      department: "Computer Applications",
      employeeId: "FAC-MCA-002",
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
      course: "BCA",
      department: "Computer Applications",
      branch: "Data Science",
      year: 2,
      semester: 4,
      batch: "2024-2027",
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

  // 14. Create Academic Subjects & Faculty Assignments
  console.log("Seeding Academic Subjects & Assignments...");
  const subDbms = await prisma.subject.create({
    data: {
      code: "CS403",
      name: "Database Engineering & SQL Internals",
      course: "B.Tech",
      branch: "CSE",
      year: 2,
      semester: 4,
      type: "THEORY",
      credits: 4,
      isActive: true
    }
  });

  const subCloud = await prisma.subject.create({
    data: {
      code: "CS401",
      name: "Distributed Systems & Cloud Computing",
      course: "B.Tech",
      branch: "CSE",
      year: 2,
      semester: 4,
      type: "THEORY",
      credits: 3,
      isActive: true
    }
  });

  const subAlgo = await prisma.subject.create({
    data: {
      code: "CS402",
      name: "Design & Analysis of Algorithms",
      course: "B.Tech",
      branch: "CSE",
      year: 2,
      semester: 4,
      type: "THEORY",
      credits: 4,
      isActive: true
    }
  });

  const subPythonLab = await prisma.subject.create({
    data: {
      code: "CS404L",
      name: "Python Programming Lab",
      course: "B.Tech",
      branch: "CSE",
      year: 2,
      semester: 4,
      type: "LAB",
      credits: 2,
      isActive: true
    }
  });

  const subMcaDbms = await prisma.subject.create({
    data: {
      code: "MCA101",
      name: "Advanced Database Management Systems",
      course: "MCA",
      branch: "CA",
      year: 1,
      semester: 1,
      type: "THEORY",
      credits: 4,
      isActive: true
    }
  });

  // Assign Faculty to Classes
  await prisma.facultyAssignment.createMany({
    data: [
      {
        facultyId: facultyCse.id,
        subjectId: subDbms.id,
        course: "B.Tech",
        branch: "CSE",
        year: 2,
        semester: 4,
        section: "A",
        academicYear: "2026-2027",
        isActive: true
      },
      {
        facultyId: facultyCse.id,
        subjectId: subPythonLab.id,
        course: "B.Tech",
        branch: "CSE",
        year: 2,
        semester: 4,
        section: "A",
        academicYear: "2026-2027",
        isActive: true
      },
      {
        facultyId: facultyMca.id,
        subjectId: subMcaDbms.id,
        course: "MCA",
        branch: "CA",
        year: 1,
        semester: 1,
        section: "A",
        academicYear: "2026-2027",
        isActive: true
      }
    ]
  });

  // 14b. Create Course Schedule / Timetable connected to Subjects & Faculty
  const sched1 = await prisma.courseSchedule.create({
    data: {
      course: "B.Tech",
      branch: "CSE",
      year: 2,
      semester: 4,
      section: "A",
      batch: "2024",
      subjectId: subCloud.id,
      subjectCode: "CS401",
      subjectName: "Distributed Systems & Cloud Computing",
      facultyId: facultyCse.id,
      facultyName: facultyCse.fullName,
      dayOfWeek: 1, // Monday
      startTime: "09:00",
      endTime: "10:30",
      room: "LH-301",
      isActive: true
    }
  });

  const sched2 = await prisma.courseSchedule.create({
    data: {
      course: "B.Tech",
      branch: "CSE",
      year: 2,
      semester: 4,
      section: "A",
      batch: "2024",
      subjectId: subAlgo.id,
      subjectCode: "CS402",
      subjectName: "Design & Analysis of Algorithms",
      facultyName: "Prof. S. Swain",
      dayOfWeek: 1, // Monday
      startTime: "11:00",
      endTime: "12:30",
      room: "LH-302",
      isActive: true
    }
  });

  const sched3 = await prisma.courseSchedule.create({
    data: {
      course: "B.Tech",
      branch: "CSE",
      year: 2,
      semester: 4,
      section: "A",
      batch: "2024",
      subjectId: subDbms.id,
      subjectCode: "CS403",
      subjectName: "Database Engineering & SQL Internals",
      facultyId: facultyCse.id,
      facultyName: facultyCse.fullName,
      dayOfWeek: 2, // Tuesday
      startTime: "10:00",
      endTime: "11:30",
      room: "LH-301",
      isActive: true
    }
  });

  // Also add scheduled classes for Wednesday, Thursday, Friday
  await prisma.courseSchedule.create({
    data: {
      course: "B.Tech",
      branch: "CSE",
      year: 2,
      semester: 4,
      section: "A",
      batch: "2024",
      subjectId: subPythonLab.id,
      subjectCode: "CS404L",
      subjectName: "Python Programming Lab",
      facultyId: facultyCse.id,
      facultyName: facultyCse.fullName,
      dayOfWeek: 3, // Wednesday
      startTime: "14:00",
      endTime: "16:00",
      room: "Lab-2",
      isActive: true
    }
  });

  // 15. Create Attendance Records & Live Attendance Session
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

  // Demo Attendance Session
  const session1 = await prisma.attendanceSession.create({
    data: {
      date: new Date(),
      timetableEntryId: sched1.id,
      facultyId: facultyCse.id,
      subjectId: subDbms.id,
      course: "B.Tech",
      branch: "CSE",
      year: 2,
      semester: 4,
      section: "A",
      startTime: "09:00",
      endTime: "10:30",
      topic: "Relational Algebra and B-Tree Indexes",
      records: {
        create: [
          {
            studentId: student.id,
            status: "PRESENT"
          }
        ]
      }
    }
  });

  // 15b. Create Published Results for Demo Student
  await prisma.studentResult.createMany({
    data: [
      {
        studentId: student.id,
        subjectId: subDbms.id,
        facultyId: facultyCse.id,
        course: "B.Tech",
        branch: "CSE",
        year: 2,
        semester: 4,
        section: "A",
        internalMarks: 27,
        assignmentMarks: 18,
        practicalMarks: 25,
        endSemMarks: 68,
        totalMarks: 88,
        grade: "E",
        credits: 4,
        status: "PUBLISHED",
        publishedAt: new Date()
      },
      {
        studentId: student.id,
        subjectId: subCloud.id,
        facultyId: facultyCse.id,
        course: "B.Tech",
        branch: "CSE",
        year: 2,
        semester: 4,
        section: "A",
        internalMarks: 25,
        assignmentMarks: 17,
        practicalMarks: 24,
        endSemMarks: 60,
        totalMarks: 81,
        grade: "A",
        credits: 3,
        status: "PUBLISHED",
        publishedAt: new Date()
      },
      {
        studentId: student.id,
        subjectId: subAlgo.id,
        facultyId: facultyCse.id,
        course: "B.Tech",
        branch: "CSE",
        year: 2,
        semester: 4,
        section: "A",
        internalMarks: 28,
        assignmentMarks: 19,
        practicalMarks: 26,
        endSemMarks: 72,
        totalMarks: 91,
        grade: "O",
        credits: 4,
        status: "PUBLISHED",
        publishedAt: new Date()
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

  // 19. Create Dedicated Day Scholar Student
  const dayScholar = await prisma.user.create({
    data: {
      email: "dayscholar@campusdesk.edu",
      passwordHash: commonPassword,
      fullName: "Ananya Mishra",
      role: "STUDENT",
      livingType: "DAY_SCHOLAR",
      rollNumber: "2024DS201",
      phone: "9876543230",
      dob: new Date("2004-03-18"),
      gender: "FEMALE",
      bloodGroup: "O+",
      course: "MCA",
      department: "Computer Applications",
      branch: "Computer Applications",
      year: 1,
      semester: 2,
      batch: "2024-2026",
      permanentAddress: "Plot 84, Nayapalli, Bhubaneswar, Odisha 751012",
      currentAddress: "Plot 84, Nayapalli, Bhubaneswar, Odisha 751012",
      fatherName: "Pradeep Mishra",
      fatherPhone: "9876543277",
      motherName: "Geeta Mishra",
      motherPhone: "9876543278",
      guardianName: "Pradeep Mishra",
      guardianRelation: "Father",
      guardianPhone: "9876543277",
      guardianAddress: "Plot 84, Nayapalli, Bhubaneswar",
      busRoute: "Route 1 - Master Canteen to Campus",
      pickupPoint: "Vani Vihar Square",
      vehicleNumber: "OD-02-CD-8910",
      parkingZone: "Zone A - 2-Wheeler (Near Gate 1)",
      verificationStatus: "ACTIVE",
      isActive: true
    }
  });

  // 20. Create Specialized Staff Members
  const itStaff = await prisma.user.create({
    data: {
      email: "itstaff@campusdesk.edu",
      passwordHash: commonPassword,
      fullName: "Priya Mohanty",
      role: "STAFF",
      phone: "9876543207",
      department: "IT & Technical Support",
      employeeId: "EMP-STF-003",
      verificationStatus: "ACTIVE",
      isActive: true
    }
  });

  const housekeepingStaff = await prisma.user.create({
    data: {
      email: "cleaning@campusdesk.edu",
      passwordHash: commonPassword,
      fullName: "Ramesh Nayak",
      role: "STAFF",
      phone: "9876543209",
      department: "Housekeeping & Sanitation",
      employeeId: "EMP-STF-004",
      verificationStatus: "ACTIVE",
      isActive: true
    }
  });

  // 21. Create Campus Clubs
  const codingClub = await prisma.club.create({
    data: {
      name: "ByteCraft - Coding & Technology Club",
      category: "CODING_TECH",
      description: "Premier competitive programming, open source development, web3, and AI building community of BPUT.",
      logoIcon: "Code2",
      coordinatorName: "Prof. S. Das",
      coordinatorEmail: "bytecraft@campusdesk.edu",
      coordinatorPhone: "9876543301",
      meetingSchedule: "Every Wednesday & Saturday @ 5:30 PM",
      roomLocation: "Computer Center Lab 4",
      isRecruiting: true
    }
  });

  const yogaClub = await prisma.club.create({
    data: {
      name: "Prana - Yoga & Wellness Society",
      category: "YOGA_WELLNESS",
      description: "Dedicated to holistic student mental health, mindfulness meditation, morning asanas, and stress relief sessions.",
      logoIcon: "HeartHandshake",
      coordinatorName: "Dr. M. Sahu",
      coordinatorEmail: "wellness@campusdesk.edu",
      coordinatorPhone: "9876543302",
      meetingSchedule: "Daily 6:30 AM – 7:30 AM",
      roomLocation: "SAC Yoga Hall",
      isRecruiting: true
    }
  });

  const musicClub = await prisma.club.create({
    data: {
      name: "Dhwani - Music & Performing Arts Society",
      category: "MUSIC",
      description: "Classical, contemporary, instrumental bands, and vocal harmony club organizing campus musical nights and concerts.",
      logoIcon: "Music",
      coordinatorName: "Ritu Verma",
      coordinatorEmail: "dhwani@campusdesk.edu",
      coordinatorPhone: "9876543303",
      meetingSchedule: "Tuesday & Friday @ 5:00 PM",
      roomLocation: "Auditorium Acoustic Room",
      isRecruiting: true
    }
  });

  const sportsClub = await prisma.club.create({
    data: {
      name: "Strikers - Sports & Athletics Association",
      category: "SPORTS_FITNESS",
      description: "Organizing inter-hostel football tournaments, cricket leagues, badminton championships, and gymnasium fitness.",
      logoIcon: "Trophy",
      coordinatorName: "Coach K. Mohapatra",
      coordinatorEmail: "sports@campusdesk.edu",
      coordinatorPhone: "9876543304",
      meetingSchedule: "Weekdays @ 4:30 PM",
      roomLocation: "Main Sports Complex",
      isRecruiting: true
    }
  });

  const debateClub = await prisma.club.create({
    data: {
      name: "Vakya - Literature & Debate Society",
      category: "LITERATURE_DEBATE",
      description: "Parliamentary debating, Model United Nations (MUN), creative writing, and public speaking forum.",
      logoIcon: "MessageSquareText",
      coordinatorName: "Prof. P. Ray",
      coordinatorEmail: "debate@campusdesk.edu",
      coordinatorPhone: "9876543305",
      meetingSchedule: "Thursdays @ 6:00 PM",
      roomLocation: "Seminar Hall 2",
      isRecruiting: true
    }
  });

  // 22. Register Students in Clubs
  await prisma.clubMember.createMany({
    data: [
      { clubId: codingClub.id, studentId: student.id, role: "COORDINATOR" },
      { clubId: yogaClub.id, studentId: student.id, role: "MEMBER" },
      { clubId: codingClub.id, studentId: dayScholar.id, role: "MEMBER" },
      { clubId: debateClub.id, studentId: dayScholar.id, role: "MEMBER" }
    ]
  });

  // 23. Create Club Events
  const hackathonEvent = await prisma.clubEvent.create({
    data: {
      clubId: codingClub.id,
      title: "HackOdisha 2026 - 24-Hour Campus Hackathon",
      description: "Build innovative real-world campus operations and smart governance solutions with cash prizes and internship tracks.",
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      location: "Main Auditorium & Computing Complex",
      capacity: 150
    }
  });

  const yogaWorkshop = await prisma.clubEvent.create({
    data: {
      clubId: yogaClub.id,
      title: "Mindfulness & Exam Stress Detox Workshop",
      description: "Guided pranayama and guided sound bath meditation for pre-semester exam focus.",
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      location: "SAC Open Lawn",
      capacity: 80
    }
  });

  // Event Registrations
  await prisma.clubEventRegistration.createMany({
    data: [
      { eventId: hackathonEvent.id, studentId: student.id },
      { eventId: hackathonEvent.id, studentId: dayScholar.id },
      { eventId: yogaWorkshop.id, studentId: dayScholar.id }
    ]
  });

  // Club Announcements
  await prisma.clubAnnouncement.create({
    data: {
      clubId: codingClub.id,
      title: "HackOdisha Problem Statements Released",
      content: "Track themes for Smart Campus, Healthcare, and FinTech are live on the portal. Form teams of 2-4 members."
    }
  });

  // 24. Create Planned Maintenance Schedules
  await prisma.plannedMaintenance.createMany({
    data: [
      {
        title: "Hostel-A & B Overhead Water Tank Cleaning",
        description: "Routine tank deep cleaning and booster pump maintenance. Water supply will be suspended temporarily.",
        location: "Hostel-A & Hostel-B",
        category: "WATER",
        startTime: new Date(Date.now() + 18 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 22 * 60 * 60 * 1000),
        targetAudience: "HOSTELLER",
        status: "SCHEDULED",
        createdById: admin.id
      },
      {
        title: "Campus Core Fiber Backbone Upgrade",
        description: "Upgrading core switch hardware in Academic Block 2. Intermittent Wi-Fi drops expected for 45 minutes.",
        location: "Academic Block 2 & Library",
        category: "NETWORK",
        startTime: new Date(Date.now() + 40 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 42 * 60 * 60 * 1000),
        targetAudience: "ALL",
        status: "SCHEDULED",
        createdById: admin.id
      }
    ]
  });

  // 25. Create SOS Emergency Records
  await prisma.emergency.create({
    data: {
      alertNumber: "SOS-8001",
      studentId: student.id,
      category: "ELECTRICAL",
      location: "Hostel-A, Floor 2, Room A-204",
      description: "Severe sparks and smoke coming from the corridor electrical breaker panel.",
      status: "RESOLVED",
      acknowledgedById: wardenA.id,
      acknowledgedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      resolvedById: electricalStaff.id,
      resolvedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      responderNotes: "Main breaker isolated and charred fuse cartridge replaced safely."
    }
  });

  await prisma.emergency.create({
    data: {
      alertNumber: "SOS-8002",
      studentId: dayScholar.id,
      category: "MEDICAL",
      location: "Academic Block 1, Ground Floor Lab 2",
      description: "Student feeling sudden dizziness and acute dehydration. First aid requested.",
      status: "RESPONDING",
      acknowledgedById: wardenA.id,
      acknowledgedAt: new Date(Date.now() - 15 * 60 * 1000),
      responderNotes: "Campus medical attendant dispatched with ORS kit and stretcher."
    }
  });

  // 26. Create Inward Parcels
  await prisma.parcel.create({
    data: {
      parcelNumber: "PCL-7001",
      studentId: student.id,
      courierService: "Amazon",
      trackingNumber: "AMZN-OD-992144",
      securityLocation: "Main Gate Security Desk",
      otpCode: "4819",
      status: "RECEIVED",
      notes: "Medium cardboard parcel for Aarav Sharma."
    }
  });

  await prisma.parcel.create({
    data: {
      parcelNumber: "PCL-7002",
      studentId: dayScholar.id,
      courierService: "SpeedPost",
      trackingNumber: "SP-882190-IN",
      securityLocation: "Academic Registry Counter",
      otpCode: "7124",
      status: "COLLECTED",
      collectedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      verifiedByGuard: "Officer Rajesh Nayak",
      notes: "Document envelope delivered."
    }
  });

  // 27. Create Fleet Buses
  const bus1 = await prisma.bus.create({
    data: {
      busNumber: "BUS-01",
      vehicleNumber: "OD-02-AX-4450",
      capacity: 52,
      driverName: "Bishnu Charan Das",
      driverPhone: "9876543401",
      status: "ACTIVE"
    }
  });

  const bus2 = await prisma.bus.create({
    data: {
      busNumber: "BUS-02",
      vehicleNumber: "OD-02-BY-7812",
      capacity: 50,
      driverName: "Dilip Kumar Jena",
      driverPhone: "9876543402",
      status: "ACTIVE"
    }
  });

  const bus3 = await prisma.bus.create({
    data: {
      busNumber: "BUS-03",
      vehicleNumber: "OD-05-CT-2291",
      capacity: 55,
      driverName: "Satyajit Rout",
      driverPhone: "9876543403",
      status: "ACTIVE"
    }
  });

  // 27b. Create Bus Routes with Assigned Buses & Ordered Stops
  await prisma.busRoute.create({
    data: {
      routeNumber: "Route 1",
      routeName: "Master Canteen to Campus",
      description: "Central commuter route connecting Master Canteen railway station, Vani Vihar, Rasulgarh and Patia to campus.",
      startPoint: "Master Canteen",
      destination: "Campus Main Gate",
      status: "ACTIVE",
      delayStatus: "ON_TIME",
      busId: bus1.id,
      stops: {
        create: [
          { stopName: "Master Canteen Station", location: "Platform 1 Exit Gate", pickupTime: "07:30 AM", dropTime: "05:45 PM", stopOrder: 1 },
          { stopName: "Vani Vihar Square", location: "Near University Flyover", pickupTime: "07:45 AM", dropTime: "05:30 PM", stopOrder: 2 },
          { stopName: "Rasulgarh Square", location: "Overbridge Service Lane", pickupTime: "08:00 AM", dropTime: "05:15 PM", stopOrder: 3 },
          { stopName: "Patia Big Bazaar", location: "Big Bazaar Bus Bay", pickupTime: "08:20 AM", dropTime: "04:55 PM", stopOrder: 4 },
          { stopName: "Campus Main Gate", location: "Security Terminal 1", pickupTime: "08:40 AM", dropTime: "04:30 PM", stopOrder: 5 }
        ]
      }
    }
  });

  await prisma.busRoute.create({
    data: {
      routeNumber: "Route 2",
      routeName: "Khandagiri to Campus",
      description: "West corridor transit covering Khandagiri, Jayadev Vihar, and Infocity IT corridor.",
      startPoint: "Khandagiri Square",
      destination: "Campus Main Gate",
      status: "ACTIVE",
      delayStatus: "ON_TIME",
      busId: bus2.id,
      stops: {
        create: [
          { stopName: "Khandagiri Square", location: "Near Caves Junction", pickupTime: "07:25 AM", dropTime: "05:40 PM", stopOrder: 1 },
          { stopName: "Jayadev Vihar", location: "Hotel Mayfair Bus Bay", pickupTime: "07:50 AM", dropTime: "05:15 PM", stopOrder: 2 },
          { stopName: "Infocity Square", location: "Software Complex Gate", pickupTime: "08:15 AM", dropTime: "04:50 PM", stopOrder: 3 },
          { stopName: "Campus Main Gate", location: "Security Terminal 1", pickupTime: "08:35 AM", dropTime: "04:30 PM", stopOrder: 4 }
        ]
      }
    }
  });

  await prisma.busRoute.create({
    data: {
      routeNumber: "Route 3",
      routeName: "Cuttack Badambadi to Campus",
      description: "Inter-city route linking Cuttack Badambadi, Link Road, and Phulnakhara to Campus.",
      startPoint: "Badambadi Bus Stand",
      destination: "Campus Main Gate",
      status: "ACTIVE",
      delayStatus: "DELAYED",
      delayNotice: "Delay of 15 mins due to NH-16 flyover maintenance work near Nakhara.",
      busId: bus3.id,
      stops: {
        create: [
          { stopName: "Badambadi Bus Stand", location: "Bay No 4", pickupTime: "07:00 AM", dropTime: "06:00 PM", stopOrder: 1 },
          { stopName: "Link Road Cuttack", location: "Madhupatna Junction", pickupTime: "07:15 AM", dropTime: "05:45 PM", stopOrder: 2 },
          { stopName: "Phulnakhara Square", location: "Near Toll Gate Service Road", pickupTime: "07:45 AM", dropTime: "05:15 PM", stopOrder: 3 },
          { stopName: "Campus Main Gate", location: "Security Terminal 1", pickupTime: "08:30 AM", dropTime: "04:30 PM", stopOrder: 4 }
        ]
      }
    }
  });

  // 27c. Legacy TransportRoute table for backwards compatibility
  await prisma.transportRoute.createMany({
    data: [
      {
        routeNumber: "Route 1 - Master Canteen to Campus",
        routeName: "Master Canteen – Vani Vihar – Rasulgarh – Patia – Campus",
        busNumber: "OD-02-AX-4450",
        driverName: "Bishnu Charan Das",
        driverPhone: "9876543401",
        stops: JSON.stringify([
          { name: "Master Canteen", time: "07:30 AM" },
          { name: "Vani Vihar Square", time: "07:45 AM" },
          { name: "Rasulgarh Square", time: "08:00 AM" },
          { name: "Patia Big Bazaar", time: "08:20 AM" },
          { name: "Campus Main Gate", time: "08:40 AM" }
        ]),
        morningDeparture: "07:30 AM",
        eveningDeparture: "05:15 PM",
        status: "ON_TIME"
      },
      {
        routeNumber: "Route 2 - Khandagiri to Campus",
        routeName: "Khandagiri – Jayadev Vihar – Infocity – Campus",
        busNumber: "OD-02-BY-7812",
        driverName: "Dilip Kumar Jena",
        driverPhone: "9876543402",
        stops: JSON.stringify([
          { name: "Khandagiri Square", time: "07:25 AM" },
          { name: "Jayadev Vihar", time: "07:50 AM" },
          { name: "Infocity Square", time: "08:15 AM" },
          { name: "Campus Main Gate", time: "08:35 AM" }
        ]),
        morningDeparture: "07:25 AM",
        eveningDeparture: "05:15 PM",
        status: "ON_TIME"
      },
      {
        routeNumber: "Route 3 - Cuttack Badambadi to Campus",
        routeName: "Badambadi – Link Road – Phulnakhara – Campus",
        busNumber: "OD-05-CT-2291",
        driverName: "Satyajit Rout",
        driverPhone: "9876543403",
        stops: JSON.stringify([
          { name: "Badambadi Bus Stand", time: "07:00 AM" },
          { name: "Link Road Cuttack", time: "07:15 AM" },
          { name: "Phulnakhara Square", time: "07:45 AM" },
          { name: "Campus Main Gate", time: "08:30 AM" }
        ]),
        morningDeparture: "07:00 AM",
        eveningDeparture: "05:30 PM",
        status: "DELAYED",
        statusNote: "Delay of 15 mins due to NH-16 flyover maintenance work near Nakhara."
      }
    ]
  });

  // 28. Create Campus Parking Zones
  await prisma.parkingZone.createMany({
    data: [
      {
        name: "Zone A - 2-Wheeler (Near Gate 1)",
        vehicleType: "TWO_WHEELER",
        totalSlots: 150,
        occupiedSlots: 92,
        status: "AVAILABLE",
        notice: "Helmet mandatory for campus entry."
      },
      {
        name: "Zone B - 4-Wheeler Student & Staff (East Lawn)",
        vehicleType: "FOUR_WHEELER",
        totalSlots: 40,
        occupiedSlots: 38,
        status: "AVAILABLE",
        notice: "Park only inside marked yellow bays."
      },
      {
        name: "Zone C - 2-Wheeler (Near Academic Block 2)",
        vehicleType: "TWO_WHEELER",
        totalSlots: 100,
        occupiedSlots: 100,
        status: "FULL",
        notice: "Lot full. Diverted to Zone A."
      }
    ]
  });

  // 29. Create Recurring Issue Dataset (Multiple complaints for Fan/Plumbing in Hostel-A Room A-204)
  await prisma.ticket.createMany({
    data: [
      {
        ticketNumber: "CD-1091",
        studentId: student.id,
        title: "Ceiling Fan Regulator Sparking and Speed Stuck",
        description: "Ceiling fan regulator emits burning smell and is stuck on highest speed.",
        category: "ELECTRICAL",
        hostelBlock: "Hostel-A",
        roomNumber: "A-204",
        priority: "HIGH",
        status: "RESOLVED",
        assignedStaffId: electricalStaff.id,
        resolvedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        resolutionNote: "Repaired capacitor and regulator wiring."
      },
      {
        ticketNumber: "CD-1092",
        studentId: student.id,
        title: "Ceiling Fan Stopped Working Again",
        description: "Fan in room A-204 has completely stopped spinning again after last week repair.",
        category: "ELECTRICAL",
        hostelBlock: "Hostel-A",
        roomNumber: "A-204",
        priority: "HIGH",
        status: "RESOLVED",
        assignedStaffId: electricalStaff.id,
        resolvedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        resolutionNote: "Motor winding lubricated."
      },
      {
        ticketNumber: "CD-1093",
        studentId: student.id,
        title: "Ceiling Fan Stator Burnt - Recurring Failure",
        description: "Fan bearing jammed and stator burnt with loud humming noise in A-204.",
        category: "ELECTRICAL",
        hostelBlock: "Hostel-A",
        roomNumber: "A-204",
        priority: "CRITICAL",
        slaDeadline: new Date(Date.now() + 3 * 60 * 60 * 1000),
        status: "ASSIGNED",
        assignedStaffId: electricalStaff.id
      }
    ]
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
