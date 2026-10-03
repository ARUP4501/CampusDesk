import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

// Fictional synthetic names for demo generation
const FIRST_NAMES_MALE = [
  "Aarav", "Rohan", "Vikram", "Rahul", "Deepak", "Aditya", "Rajesh", "Amit",
  "Kunal", "Ayush", "Sourav", "Manish", "Abhishek", "Pritam", "Subham", "Siddharth",
  "Biswajit", "Alok", "Chandan", "Debabrata", "Gourab", "Himanshu", "Jagannath", "Kaushik"
];

const FIRST_NAMES_FEMALE = [
  "Ananya", "Sneha", "Priya", "Ishita", "Swati", "Pooja", "Neha", "Riya",
  "Tanvi", "Sonali", "Madhusmita", "Barsha", "Lopamudra", "Sanjukta", "Padmini", "Smruti",
  "Archana", "Kavita", "Shreya", "Lipika", "Namrata", "Puspa", "Rasmita", "Subhashree"
];

const LAST_NAMES = [
  "Sharma", "Das", "Mishra", "Pattnaik", "Sen", "Mohanty", "Nayak", "Ray",
  "Sahoo", "Tripathy", "Verma", "Pradhan", "Behera", "Jena", "Barik", "Choudhury",
  "Samal", "Mohapatra", "Rout", "Panda", "Mallick", "Swain", "Biswal", "Bhol"
];

const BHUBANESWAR_AREAS = [
  { area: "Master Canteen Area", route: "Route 1", stop: "Master Canteen" },
  { area: "Vani Vihar Square", route: "Route 1", stop: "Vani Vihar" },
  { area: "Rasulgarh Square", route: "Route 1", stop: "Rasulgarh" },
  { area: "Saheed Nagar", route: "Route 1", stop: "Master Canteen" },
  { area: "Patia Station Road", route: "Route 2", stop: "Patia Chowk" },
  { area: "KIIT Square", route: "Route 2", stop: "KIIT Square" },
  { area: "Infocity DLF Cybercity", route: "Route 2", stop: "Infocity" },
  { area: "Khandagiri Square", route: "Route 3", stop: "Khandagiri Square" },
  { area: "Baramunda Bus Stand", route: "Route 3", stop: "Baramunda" },
  { area: "Nayapalli IRC Village", route: "Route 3", stop: "Jayadev Vihar" },
  { area: "Badambadi Cuttack", route: "Route 2", stop: "Badambadi" },
  { area: "Link Road Cuttack", route: "Route 2", stop: "Link Road" }
];

export async function seedDemoEnvironment() {
  console.log("==========================================================");
  console.log("CAMPUSDESK: SEEDING COMPLETE IDEMPOTENT DEMO ENVIRONMENT");
  console.log("==========================================================");

  const defaultPasswordHash = await argon2.hash("Password@123");

  // ------------------------------------------------------------------
  // 1. ENSURE 5 DISTINCT DEMO HOSTELS
  // ------------------------------------------------------------------
  console.log("\n1. Ensuring 5 Demo Hostels (Hostel-A through Hostel-E)...");
  const hostelConfigs = [
    { name: "Hostel-A", type: "BOYS", description: "Senior Boys Residence (Engineering & Computing)", totalRooms: 25, totalBeds: 50 },
    { name: "Hostel-B", type: "BOYS", description: "Junior Boys Residence (Undergraduate Blocks)", totalRooms: 25, totalBeds: 50 },
    { name: "Hostel-C", type: "GIRLS", description: "Main Girls Residence Block (Kalinga Bhavan)", totalRooms: 25, totalBeds: 50 },
    { name: "Hostel-D", type: "GIRLS", description: "Senior Girls & PG Scholars Residence (Pratibha Bhavan)", totalRooms: 25, totalBeds: 50 },
    { name: "Hostel-E", type: "BOYS", description: "Postgraduate & International Scholars Residence", totalRooms: 25, totalBeds: 50 }
  ];

  const hostelMap = new Map<string, any>();
  for (const h of hostelConfigs) {
    const record = await prisma.hostel.upsert({
      where: { name: h.name },
      create: {
        name: h.name,
        type: h.type,
        description: h.description,
        totalRooms: h.totalRooms,
        totalBeds: h.totalBeds
      },
      update: {
        type: h.type,
        description: h.description,
        totalRooms: h.totalRooms,
        totalBeds: h.totalBeds
      }
    });
    hostelMap.set(h.name, record);
  }
  console.log(`✓ 5 Hostels verified.`);

  // ------------------------------------------------------------------
  // 2. DEMO WARDENS (1 per hostel + primary alias)
  // ------------------------------------------------------------------
  console.log("\n2. Ensuring 5 Demo Wardens (Assigned 1-to-1 to Hostels)...");
  const wardenConfigs = [
    {
      email: "warden@campusdesk.edu",
      fullName: "Dr. Ramesh Chandra Mohanty (Hostel-A)",
      phone: "9861001001",
      employeeId: "EMP-WRD-001",
      hostelBlock: "Hostel-A",
      gender: "MALE"
    },
    {
      email: "wardenb@campusdesk.edu",
      fullName: "Prof. Suresh Kumar Dash (Hostel-B)",
      phone: "9861002001",
      employeeId: "EMP-WRD-002",
      hostelBlock: "Hostel-B",
      gender: "MALE"
    },
    {
      email: "warden.c@campusdesk.edu",
      fullName: "Dr. Sunita Devi Pattnaik (Hostel-C)",
      phone: "9861003001",
      employeeId: "EMP-WRD-013",
      hostelBlock: "Hostel-C",
      gender: "FEMALE"
    },
    {
      email: "warden.d@campusdesk.edu",
      fullName: "Mrs. Minati Ray (Hostel-D)",
      phone: "9861004001",
      employeeId: "EMP-WRD-014",
      hostelBlock: "Hostel-D",
      gender: "FEMALE"
    },
    {
      email: "warden.e@campusdesk.edu",
      fullName: "Dr. Binod Bihari Sahoo (Hostel-E)",
      phone: "9861005001",
      employeeId: "EMP-WRD-015",
      hostelBlock: "Hostel-E",
      gender: "MALE"
    }
  ];

  const wardenUserMap = new Map<string, any>();
  for (const w of wardenConfigs) {
    const existingUser = await prisma.user.findUnique({ where: { email: w.email } });
    const user = await prisma.user.upsert({
      where: { email: w.email },
      create: {
        email: w.email,
        passwordHash: defaultPasswordHash,
        fullName: w.fullName,
        role: "WARDEN",
        employeeId: w.employeeId,
        phone: w.phone,
        gender: w.gender,
        hostelBlock: w.hostelBlock,
        verificationStatus: "ACTIVE",
        isActive: true
      },
      update: {
        fullName: w.fullName,
        role: "WARDEN",
        hostelBlock: w.hostelBlock,
        employeeId: existingUser?.employeeId || w.employeeId,
        verificationStatus: "ACTIVE",
        isActive: true
      }
    });
    wardenUserMap.set(w.hostelBlock, user);

    // Link wardenId in Hostel
    await prisma.hostel.update({
      where: { name: w.hostelBlock },
      data: { wardenId: user.id }
    });
  }
  console.log(`✓ 5 Hostels linked to 5 dedicated Warden accounts.`);

  // ------------------------------------------------------------------
  // 3. DEMO STAFF ACCOUNTS (10 Operational Functions)
  // ------------------------------------------------------------------
  console.log("\n3. Ensuring 10 Demo Staff Members across campus operations...");
  const staffConfigs = [
    { email: "security.main@campusdesk.edu", name: "Havildar Manoj Behera", empId: "EMP-STF-021", phone: "9861100001", dept: "Campus Security (Main Gate)" },
    { email: "security.hostela@campusdesk.edu", name: "Niranjan Nayak", empId: "EMP-STF-022", phone: "9861100002", dept: "Hostel-A Security & Gate Log" },
    { email: "security.hostelc@campusdesk.edu", name: "Pratima Jena", empId: "EMP-STF-023", phone: "9861100003", dept: "Hostel-C Security & Curfew Desk" },
    { email: "hostel.ops@campusdesk.edu", name: "Ashok Samantaray", empId: "EMP-STF-024", phone: "9861100004", dept: "Hostel Operations & Room Allocation" },
    { email: "mess.manager@campusdesk.edu", name: "Kailash Chandra Rout", empId: "EMP-STF-025", phone: "9861100005", dept: "Catering & Mess Operations" },
    { email: "transport.staff@campusdesk.edu", name: "Bishnu Charan Das", empId: "EMP-STF-026", phone: "9861100006", dept: "Campus Transport & Bus Logistics" },
    { email: "parcels.staff@campusdesk.edu", name: "Debasish Pradhan", empId: "EMP-STF-027", phone: "9861100007", dept: "Parcel Desk & Logistics" },
    { email: "maintenance.electrical@campusdesk.edu", name: "Ranjan Mohapatra", empId: "EMP-STF-028", phone: "9861100008", dept: "Electrical & Power Maintenance" },
    { email: "maintenance.civil@campusdesk.edu", name: "Babulal Hansdah", empId: "EMP-STF-029", phone: "9861100009", dept: "Sanitary & Water Maintenance" },
    { email: "academic.staff@campusdesk.edu", name: "Subhashree Mishra", empId: "EMP-STF-030", phone: "9861100010", dept: "Academic Section Administration" }
  ];

  const staffUserMap = new Map<string, any>();
  for (const s of staffConfigs) {
    const existingUser = await prisma.user.findUnique({ where: { email: s.email } });
    const user = await prisma.user.upsert({
      where: { email: s.email },
      create: {
        email: s.email,
        passwordHash: defaultPasswordHash,
        fullName: s.name,
        role: "STAFF",
        employeeId: s.empId,
        phone: s.phone,
        department: s.dept,
        verificationStatus: "ACTIVE",
        isActive: true
      },
      update: {
        fullName: s.name,
        role: "STAFF",
        department: s.dept,
        employeeId: existingUser?.employeeId || s.empId,
        verificationStatus: "ACTIVE",
        isActive: true
      }
    });
    staffUserMap.set(s.email, user);
  }
  console.log(`✓ 10 Staff accounts ready.`);

  // ------------------------------------------------------------------
  // 4. ENSURE ROOMS AND BEDS IN ALL 5 HOSTELS
  // ------------------------------------------------------------------
  console.log("\n4. Ensuring Room & Bed Inventory for all 5 Hostels (25 rooms each, 2 beds/room)...");
  for (const h of hostelConfigs) {
    const hostelRecord = hostelMap.get(h.name);
    for (let r = 1; r <= 25; r++) {
      const floor = Math.floor((r - 1) / 8) + 1; // Floor 1, 2, 3
      const roomNum = `${floor}${r < 10 ? "0" + r : r}`;

      const room = await prisma.room.upsert({
        where: {
          hostelBlock_roomNumber: {
            hostelBlock: h.name,
            roomNumber: roomNum
          }
        },
        create: {
          roomNumber: roomNum,
          hostelId: hostelRecord.id,
          hostelBlock: h.name,
          floor,
          capacity: 2
        },
        update: {
          capacity: 2,
          floor
        }
      });

      // Bed-1 and Bed-2
      for (const bedLetter of ["Bed-1", "Bed-2"]) {
        await prisma.bed.upsert({
          where: {
            hostelBlock_roomNumber_bedNumber: {
              hostelBlock: h.name,
              roomNumber: roomNum,
              bedNumber: bedLetter
            }
          },
          create: {
            bedNumber: bedLetter,
            roomId: room.id,
            roomNumber: roomNum,
            hostelBlock: h.name,
            status: "AVAILABLE"
          },
          update: {}
        });
      }
    }
  }
  console.log(`✓ 125 Rooms and 250 Beds verified across 5 Hostels.`);

  // ------------------------------------------------------------------
  // 5. DEMO FACULTY (Multi-Branch & Multi-Course Assignments)
  // ------------------------------------------------------------------
  console.log("\n5. Ensuring Demo Faculty Teaching across Multiple Branches & Courses...");
  const facultyConfigs = [
    {
      email: "dr.rajesh.sharma@campusdesk.edu",
      name: "Dr. Rajesh Sharma",
      empId: "EMP-FAC-201",
      phone: "9861200001",
      dept: "Computer Science & Applications",
      designation: "Professor & Academic Head"
    },
    {
      email: "dr.priya.patel@campusdesk.edu",
      name: "Dr. Priya Patel",
      empId: "EMP-FAC-202",
      phone: "9861200002",
      dept: "Information Technology & Data Science",
      designation: "Associate Professor"
    },
    {
      email: "prof.alok.verma@campusdesk.edu",
      name: "Prof. Alok Verma",
      empId: "EMP-FAC-203",
      phone: "9861200003",
      dept: "Business Administration & Management",
      designation: "Assistant Professor"
    },
    {
      email: "dr.anita.deshmukh@campusdesk.edu",
      name: "Dr. Anita Deshmukh",
      empId: "EMP-FAC-204",
      phone: "9861200004",
      dept: "Electronics & Advanced Systems",
      designation: "Associate Professor"
    },
    {
      email: "faculty@campusdesk.edu",
      name: "Dr. Arindam Sen",
      empId: "EMP-FAC-205",
      phone: "9861200005",
      dept: "Computer Science & Engineering",
      designation: "Senior Faculty"
    }
  ];

  const facultyUserMap = new Map<string, any>();
  for (const f of facultyConfigs) {
    const existingUser = await prisma.user.findUnique({ where: { email: f.email } });
    const user = await prisma.user.upsert({
      where: { email: f.email },
      create: {
        email: f.email,
        passwordHash: defaultPasswordHash,
        fullName: f.name,
        role: "FACULTY",
        employeeId: f.empId,
        phone: f.phone,
        department: f.dept,
        verificationStatus: "ACTIVE",
        isActive: true
      },
      update: {
        fullName: f.name,
        role: "FACULTY",
        department: f.dept,
        employeeId: existingUser?.employeeId || f.empId,
        verificationStatus: "ACTIVE",
        isActive: true
      }
    });
    facultyUserMap.set(f.email, user);
  }
  console.log(`✓ 5 Faculty members verified.`);

  // ------------------------------------------------------------------
  // 6. SUBJECTS & FACULTY ASSIGNMENTS ACROSS BRANCHES
  // ------------------------------------------------------------------
  console.log("\n6. Ensuring Master Subjects & Faculty Multi-Branch Assignments...");
  const subjectConfigs = [
    // Faculty 1: Dr. Rajesh Sharma (MCA CA, B.Tech CSE, BCA CA)
    {
      code: "MCA101",
      name: "Database Management Systems",
      course: "MCA",
      branch: "CA",
      year: 1,
      semester: 1,
      section: "A",
      credits: 4,
      facultyEmail: "dr.rajesh.sharma@campusdesk.edu"
    },
    {
      code: "CS301",
      name: "Operating Systems",
      course: "B.Tech",
      branch: "CSE",
      year: 2,
      semester: 3,
      section: "A",
      credits: 4,
      facultyEmail: "dr.rajesh.sharma@campusdesk.edu"
    },
    {
      code: "BCA302",
      name: "Python Programming & Applications",
      course: "BCA",
      branch: "CA",
      year: 2,
      semester: 3,
      section: "B",
      credits: 3,
      facultyEmail: "dr.rajesh.sharma@campusdesk.edu"
    },

    // Faculty 2: Dr. Priya Patel (B.Tech CSE, MCA DS, B.Tech IT)
    {
      code: "CS501",
      name: "Computer Networks & Security",
      course: "B.Tech",
      branch: "CSE",
      year: 3,
      semester: 5,
      section: "A",
      credits: 4,
      facultyEmail: "dr.priya.patel@campusdesk.edu"
    },
    {
      code: "MCA102",
      name: "Machine Learning & Big Data",
      course: "MCA",
      branch: "DS",
      year: 1,
      semester: 1,
      section: "A",
      credits: 4,
      facultyEmail: "dr.priya.patel@campusdesk.edu"
    },
    {
      code: "IT301",
      name: "Data Structures & Algorithms",
      course: "B.Tech",
      branch: "IT",
      year: 2,
      semester: 3,
      section: "A",
      credits: 4,
      facultyEmail: "dr.priya.patel@campusdesk.edu"
    },

    // Faculty 3: Prof. Alok Verma (BBA FIN, MBA FIN, B.Tech CIVIL)
    {
      code: "BBA301",
      name: "Financial Management",
      course: "BBA",
      branch: "FIN",
      year: 2,
      semester: 3,
      section: "A",
      credits: 3,
      facultyEmail: "prof.alok.verma@campusdesk.edu"
    },
    {
      code: "MBA101",
      name: "Managerial Economics",
      course: "MBA",
      branch: "FIN",
      year: 1,
      semester: 1,
      section: "A",
      credits: 4,
      facultyEmail: "prof.alok.verma@campusdesk.edu"
    },
    {
      code: "CE301",
      name: "Structural Analysis & Design",
      course: "B.Tech",
      branch: "CIVIL",
      year: 2,
      semester: 3,
      section: "A",
      credits: 4,
      facultyEmail: "prof.alok.verma@campusdesk.edu"
    },

    // Faculty 4: Dr. Anita Deshmukh (B.Tech ECE, M.Tech CSE, B.Tech MECH)
    {
      code: "EC301",
      name: "Digital Electronics & Microprocessors",
      course: "B.Tech",
      branch: "ECE",
      year: 2,
      semester: 3,
      section: "A",
      credits: 4,
      facultyEmail: "dr.anita.deshmukh@campusdesk.edu"
    },
    {
      code: "MT101",
      name: "Advanced Algorithm Design",
      course: "M.Tech",
      branch: "CSE",
      year: 1,
      semester: 1,
      section: "A",
      credits: 4,
      facultyEmail: "dr.anita.deshmukh@campusdesk.edu"
    },
    {
      code: "ME301",
      name: "Thermodynamics & Heat Transfer",
      course: "B.Tech",
      branch: "MECH",
      year: 2,
      semester: 3,
      section: "A",
      credits: 4,
      facultyEmail: "dr.anita.deshmukh@campusdesk.edu"
    },

    // Faculty 5: Dr. Arindam Sen (Primary demo faculty)
    {
      code: "CS101",
      name: "Programming in C & Problem Solving",
      course: "B.Tech",
      branch: "CSE",
      year: 1,
      semester: 1,
      section: "A",
      credits: 4,
      facultyEmail: "faculty@campusdesk.edu"
    },
    {
      code: "BCA101",
      name: "Web Technologies & UI/UX",
      course: "BCA",
      branch: "DS",
      year: 1,
      semester: 1,
      section: "A",
      credits: 3,
      facultyEmail: "faculty@campusdesk.edu"
    }
  ];

  const subjectMap = new Map<string, any>();
  for (const s of subjectConfigs) {
    const subject = await prisma.subject.upsert({
      where: {
        course_branch_semester_code: {
          course: s.course,
          branch: s.branch,
          semester: s.semester,
          code: s.code
        }
      },
      create: {
        code: s.code,
        name: s.name,
        course: s.course,
        branch: s.branch,
        year: s.year,
        semester: s.semester,
        credits: s.credits,
        type: "THEORY",
        isActive: true
      },
      update: {
        name: s.name,
        year: s.year,
        credits: s.credits,
        isActive: true
      }
    });
    subjectMap.set(`${s.course}_${s.branch}_${s.semester}_${s.code}`, subject);

    // Create Faculty Assignment
    const faculty = facultyUserMap.get(s.facultyEmail);
    if (faculty) {
      await prisma.facultyAssignment.upsert({
        where: {
          facultyId_subjectId_section_semester: {
            facultyId: faculty.id,
            subjectId: subject.id,
            section: s.section,
            semester: s.semester
          }
        },
        create: {
          facultyId: faculty.id,
          subjectId: subject.id,
          course: s.course,
          branch: s.branch,
          year: s.year,
          semester: s.semester,
          section: s.section,
          academicYear: "2024-2025",
          isActive: true
        },
        update: {
          course: s.course,
          branch: s.branch,
          year: s.year,
          isActive: true
        }
      });
    }
  }
  console.log(`✓ Master Subjects & Multi-Branch Faculty Assignments configured.`);

  // ------------------------------------------------------------------
  // 7. TIMETABLE SCHEDULES
  // ------------------------------------------------------------------
  console.log("\n7. Ensuring Non-Conflicting Timetable Entries...");
  const timetableConfigs = [
    // Dr. Rajesh Sharma: Mon/Wed/Fri classes
    {
      course: "MCA",
      branch: "CA",
      year: 1,
      semester: 1,
      section: "A",
      code: "MCA101",
      name: "Database Management Systems",
      facultyEmail: "dr.rajesh.sharma@campusdesk.edu",
      dayOfWeek: 1, // Mon
      startTime: "10:00",
      endTime: "11:00",
      room: "LH-101"
    },
    {
      course: "B.Tech",
      branch: "CSE",
      year: 2,
      semester: 3,
      section: "A",
      code: "CS301",
      name: "Operating Systems",
      facultyEmail: "dr.rajesh.sharma@campusdesk.edu",
      dayOfWeek: 1, // Mon
      startTime: "11:15",
      endTime: "12:15",
      room: "LH-102"
    },
    {
      course: "BCA",
      branch: "CA",
      year: 2,
      semester: 3,
      section: "B",
      code: "BCA302",
      name: "Python Programming & Applications",
      facultyEmail: "dr.rajesh.sharma@campusdesk.edu",
      dayOfWeek: 1, // Mon
      startTime: "14:00",
      endTime: "15:00",
      room: "CS-Lab 2"
    },

    // Dr. Priya Patel: Tue/Thu classes
    {
      course: "B.Tech",
      branch: "CSE",
      year: 3,
      semester: 5,
      section: "A",
      code: "CS501",
      name: "Computer Networks & Security",
      facultyEmail: "dr.priya.patel@campusdesk.edu",
      dayOfWeek: 2, // Tue
      startTime: "09:00",
      endTime: "10:00",
      room: "LH-201"
    },
    {
      course: "MCA",
      branch: "DS",
      year: 1,
      semester: 1,
      section: "A",
      code: "MCA102",
      name: "Machine Learning & Big Data",
      facultyEmail: "dr.priya.patel@campusdesk.edu",
      dayOfWeek: 2, // Tue
      startTime: "10:15",
      endTime: "11:15",
      room: "DS-Lab 1"
    },
    {
      course: "B.Tech",
      branch: "IT",
      year: 2,
      semester: 3,
      section: "A",
      code: "IT301",
      name: "Data Structures & Algorithms",
      facultyEmail: "dr.priya.patel@campusdesk.edu",
      dayOfWeek: 2, // Tue
      startTime: "11:30",
      endTime: "12:30",
      room: "LH-103"
    },

    // Prof. Alok Verma: Wed/Fri classes
    {
      course: "BBA",
      branch: "FIN",
      year: 2,
      semester: 3,
      section: "A",
      code: "BBA301",
      name: "Financial Management",
      facultyEmail: "prof.alok.verma@campusdesk.edu",
      dayOfWeek: 3, // Wed
      startTime: "09:30",
      endTime: "10:30",
      room: "BBA-Hall 1"
    },
    {
      course: "MBA",
      branch: "FIN",
      year: 1,
      semester: 1,
      section: "A",
      code: "MBA101",
      name: "Managerial Economics",
      facultyEmail: "prof.alok.verma@campusdesk.edu",
      dayOfWeek: 3, // Wed
      startTime: "11:00",
      endTime: "12:00",
      room: "MBA-Auditorium"
    },
    {
      course: "B.Tech",
      branch: "CIVIL",
      year: 2,
      semester: 3,
      section: "A",
      code: "CE301",
      name: "Structural Analysis & Design",
      facultyEmail: "prof.alok.verma@campusdesk.edu",
      dayOfWeek: 3, // Wed
      startTime: "14:00",
      endTime: "15:00",
      room: "Civil-CAD Lab"
    },

    // Dr. Arindam Sen: Mon/Thu classes
    {
      course: "B.Tech",
      branch: "CSE",
      year: 1,
      semester: 1,
      section: "A",
      code: "CS101",
      name: "Programming in C & Problem Solving",
      facultyEmail: "faculty@campusdesk.edu",
      dayOfWeek: 1, // Mon
      startTime: "09:00",
      endTime: "10:00",
      room: "LH-101"
    },
    {
      course: "BCA",
      branch: "DS",
      year: 1,
      semester: 1,
      section: "A",
      code: "BCA101",
      name: "Web Technologies & UI/UX",
      facultyEmail: "faculty@campusdesk.edu",
      dayOfWeek: 4, // Thu
      startTime: "10:00",
      endTime: "11:00",
      room: "Web-Studio"
    }
  ];

  const timetableMap = new Map<string, any>();
  for (const tt of timetableConfigs) {
    const faculty = facultyUserMap.get(tt.facultyEmail);
    const subjectKey = `${tt.course}_${tt.branch}_${tt.semester}_${tt.code}`;
    const subject = subjectMap.get(subjectKey);

    const existing = await prisma.courseSchedule.findFirst({
      where: {
        course: tt.course,
        branch: tt.branch,
        semester: tt.semester,
        section: tt.section,
        subjectCode: tt.code,
        dayOfWeek: tt.dayOfWeek
      }
    });

    if (existing) {
      timetableMap.set(tt.code, existing);
    } else {
      const created = await prisma.courseSchedule.create({
        data: {
          course: tt.course,
          branch: tt.branch,
          year: tt.year,
          semester: tt.semester,
          section: tt.section,
          subjectCode: tt.code,
          subjectName: tt.name,
          facultyName: faculty?.fullName || "Faculty Member",
          facultyId: faculty?.id || null,
          subjectId: subject?.id || null,
          dayOfWeek: tt.dayOfWeek,
          startTime: tt.startTime,
          endTime: tt.endTime,
          room: tt.room,
          isActive: true
        }
      });
      timetableMap.set(tt.code, created);
    }
  }
  console.log(`✓ Timetable schedules seeded.`);

  // ------------------------------------------------------------------
  // 8. AT LEAST 20 STUDENTS PER ACTIVE COURSE/BRANCH COMBINATION
  // ------------------------------------------------------------------
  console.log("\n8. Seeding At Least 20 Demo Students per Active Course/Branch...");

  const activePrograms = [
    { course: "MCA", branch: "CA", codePrefix: "MCA", duration: 2 },
    { course: "MCA", branch: "DS", codePrefix: "MDS", duration: 2 },
    { course: "BCA", branch: "CA", codePrefix: "BCA", duration: 3 },
    { course: "BCA", branch: "DS", codePrefix: "BDS", duration: 3 },
    { course: "BBA", branch: "GEN", codePrefix: "BBG", duration: 3 },
    { course: "BBA", branch: "FIN", codePrefix: "BBF", duration: 3 },
    { course: "BBA", branch: "MKT", codePrefix: "BBM", duration: 3 },
    { course: "BBA", branch: "HRM", codePrefix: "BBH", duration: 3 },
    { course: "B.Tech", branch: "CSE", codePrefix: "CSE", duration: 4 },
    { course: "B.Tech", branch: "IT", codePrefix: "BIT", duration: 4 },
    { course: "B.Tech", branch: "ECE", codePrefix: "ECE", duration: 4 },
    { course: "B.Tech", branch: "MECH", codePrefix: "MEC", duration: 4 },
    { course: "B.Tech", branch: "CIVIL", codePrefix: "CIV", duration: 4 },
    { course: "MBA", branch: "FIN", codePrefix: "MBF", duration: 2 },
    { course: "MBA", branch: "MKT", codePrefix: "MBM", duration: 2 },
    { course: "MBA", branch: "HRM", codePrefix: "MBH", duration: 2 },
    { course: "MBA", branch: "OPS", codePrefix: "MBO", duration: 2 },
    { course: "M.Tech", branch: "CSE", codePrefix: "MTC", duration: 2 },
    { course: "M.Tech", branch: "OTHER", codePrefix: "MTO", duration: 2 }
  ];

  // We will track allocated beds per hostel to ensure no bed is double booked
  const availableBedsByHostel: Record<string, any[]> = {};
  for (const h of ["Hostel-A", "Hostel-B", "Hostel-C", "Hostel-D", "Hostel-E"]) {
    availableBedsByHostel[h] = await prisma.bed.findMany({
      where: { hostelBlock: h, status: "AVAILABLE" },
      orderBy: [{ roomNumber: "asc" }, { bedNumber: "asc" }]
    });
  }

  let totalSeededStudents = 0;
  const seededStudentsList: any[] = [];

  for (const prog of activePrograms) {
    // Check how many students already exist for this course + branch
    const existingCount = await prisma.user.count({
      where: {
        role: "STUDENT",
        course: prog.course,
        branch: prog.branch
      }
    });

    const needed = Math.max(0, 20 - existingCount);
    const targetTotal = existingCount + needed;

    for (let i = existingCount + 1; i <= targetTotal; i++) {
      const padNum = i < 10 ? `0${i}` : `${i}`;
      const rollNumber = `2024${prog.codePrefix}${padNum}`;
      const email = `demo.${prog.codePrefix.toLowerCase()}.${padNum}@campusdesk.edu`;

      // Gender balance
      const isFemale = i % 2 === 0;
      const firstNameList = isFemale ? FIRST_NAMES_FEMALE : FIRST_NAMES_MALE;
      const firstName = firstNameList[(i + prog.branch.length) % firstNameList.length];
      const lastName = LAST_NAMES[(i * 3 + prog.codePrefix.length) % LAST_NAMES.length];
      const fullName = `${firstName} ${lastName}`;

      // Distribute years & semesters
      const year = ((i - 1) % prog.duration) + 1;
      const semester = year * 2 - (i % 2 === 1 ? 1 : 0);
      const section = i % 2 === 0 ? "B" : "A";

      // 50% Hosteller, 50% Day Scholar
      const isHosteller = i % 2 === 1;
      const livingType = isHosteller ? "HOSTELLER" : "DAY_SCHOLAR";

      // Choose appropriate hostel:
      // Boys: Hostel-A (Undergrad), Hostel-B (Undergrad/Engg), Hostel-E (PG: MCA, MBA, M.Tech)
      // Girls: Hostel-C (Undergrad), Hostel-D (PG & Senior)
      let targetHostel = "Hostel-A";
      if (isHosteller) {
        if (isFemale) {
          targetHostel = prog.duration === 2 || year > 2 ? "Hostel-D" : "Hostel-C";
        } else {
          if (prog.duration === 2) targetHostel = "Hostel-E";
          else targetHostel = i % 4 === 1 ? "Hostel-A" : "Hostel-B";
        }
      }

      let assignedRoom: string | null = null;
      let assignedBedNumber: string | null = null;
      let allocatedBedRecordId: string | null = null;

      if (isHosteller) {
        const pool = availableBedsByHostel[targetHostel];
        if (pool && pool.length > 0) {
          const nextBed = pool.shift();
          assignedRoom = nextBed.roomNumber;
          assignedBedNumber = nextBed.bedNumber;
          allocatedBedRecordId = nextBed.id;
        }
      }

      // Day Scholar transport info
      const transportArea = BHUBANESWAR_AREAS[i % BHUBANESWAR_AREAS.length];
      const busRoute = isHosteller ? null : transportArea.route;
      const pickupPoint = isHosteller ? null : transportArea.stop;
      const currentAddress = isHosteller
        ? `${targetHostel}, Room ${assignedRoom || "101"}, CampusDesk Hostels`
        : `${i * 12}, ${transportArea.area}, Bhubaneswar, Odisha`;

      // Synthetic Parent & Guardian details
      const fatherName = `Mr. Ramesh ${lastName}`;
      const fatherPhone = `9861${padNum}4401`;
      const motherName = `Mrs. Shanti ${lastName}`;
      const motherPhone = `9861${padNum}4402`;
      const guardianName = `Mr. Debabrata ${lastName}`;
      const guardianRelation = "Uncle";
      const guardianPhone = `9861${padNum}4403`;
      const guardianAddress = `Plot ${i * 5}, Saheed Nagar, Bhubaneswar`;

      // 2 sample pending students for demoing verification workflow
      const isDemoPending = prog.codePrefix === "CSE" && i === 19;
      const isDemoWardenApprovedPendingAdmin = prog.codePrefix === "CSE" && i === 20;

      let verificationStatus = "ACTIVE";
      if (isDemoPending) verificationStatus = "PENDING_WARDEN_VERIFICATION";
      else if (isDemoWardenApprovedPendingAdmin) verificationStatus = "PENDING_ADMIN_APPROVAL";

      const student = await prisma.user.upsert({
        where: { email },
        create: {
          email,
          passwordHash: defaultPasswordHash,
          fullName,
          role: "STUDENT",
          rollNumber,
          phone: `9861${padNum}${i < 10 ? "0" + i : i}0`,
          gender: isFemale ? "FEMALE" : "MALE",
          course: prog.course,
          branch: prog.branch,
          department: prog.branch,
          year,
          semester,
          section,
          batch: "2024-2028",
          livingType,
          hostelBlock: isHosteller ? targetHostel : null,
          roomNumber: assignedRoom,
          bedNumber: assignedBedNumber,
          busRoute,
          pickupPoint,
          currentAddress,
          permanentAddress: `Village/PO: Badagada, Dist: Khordha, Odisha - 751014`,
          fatherName,
          fatherPhone,
          motherName,
          motherPhone,
          guardianName,
          guardianRelation,
          guardianPhone,
          guardianAddress,
          verificationStatus,
          isActive: true
        },
        update: {
          course: prog.course,
          branch: prog.branch,
          department: prog.branch,
          livingType,
          hostelBlock: isHosteller ? targetHostel : null,
          roomNumber: assignedRoom || undefined,
          bedNumber: assignedBedNumber || undefined,
          busRoute,
          pickupPoint,
          verificationStatus
        }
      });

      // If hosteller with allocated bed, mark Bed as OCCUPIED
      if (isHosteller && allocatedBedRecordId) {
        await prisma.bed.update({
          where: { id: allocatedBedRecordId },
          data: {
            status: "OCCUPIED",
            studentId: student.id
          }
        });
      }

      seededStudentsList.push(student);
      totalSeededStudents++;
    }
  }
  console.log(`✓ Total Demo Students processed: ${totalSeededStudents}. (At least 20 students verified in each of the 19 active branches).`);

  // ------------------------------------------------------------------
  // 9. COLLEGE / CLASS ATTENDANCE SESSIONS & STUDENT RECORDS
  // ------------------------------------------------------------------
  console.log("\n9. Seeding College Academic Attendance Sessions & Student Records...");

  // Generate sessions for past 3 lecture days
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const pastLectureDates = [
    new Date(today.getTime() - 2 * 86400000), // 2 days ago
    new Date(today.getTime() - 1 * 86400000), // yesterday
    new Date(today.getTime())                 // today morning
  ];

  // We seed attendance for MCA101 (Dr. Rajesh Sharma) and CS101 (Dr. Arindam Sen)
  const targetClassesForAttendance = [
    {
      course: "MCA",
      branch: "CA",
      year: 1,
      semester: 1,
      section: "A",
      subjectCode: "MCA101",
      facultyEmail: "dr.rajesh.sharma@campusdesk.edu",
      topic: "Relational Algebra, SQL Joins & Query Optimization"
    },
    {
      course: "B.Tech",
      branch: "CSE",
      year: 1,
      semester: 1,
      section: "A",
      subjectCode: "CS101",
      facultyEmail: "faculty@campusdesk.edu",
      topic: "Dynamic Memory Allocation & Pointers in C"
    },
    {
      course: "B.Tech",
      branch: "CSE",
      year: 2,
      semester: 3,
      section: "A",
      subjectCode: "CS301",
      facultyEmail: "dr.rajesh.sharma@campusdesk.edu",
      topic: "CPU Scheduling Algorithms & Deadlock Avoidance"
    }
  ];

  let totalAttendanceItemsSeeded = 0;

  for (const cls of targetClassesForAttendance) {
    const faculty = facultyUserMap.get(cls.facultyEmail);
    const subject = subjectMap.get(`${cls.course}_${cls.branch}_${cls.semester}_${cls.subjectCode}`);
    const timetable = timetableMap.get(cls.subjectCode);

    if (!faculty || !subject) continue;

    // Find enrolled students in this exact class
    const enrolledStudents = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        course: cls.course,
        branch: cls.branch,
        semester: cls.semester,
        section: cls.section
      }
    });

    for (let dIdx = 0; dIdx < pastLectureDates.length; dIdx++) {
      const lectureDate = pastLectureDates[dIdx];

      // Check if session already exists
      let session = await prisma.attendanceSession.findFirst({
        where: {
          course: cls.course,
          branch: cls.branch,
          semester: cls.semester,
          section: cls.section,
          subjectId: subject.id,
          date: lectureDate
        }
      });

      if (!session) {
        session = await prisma.attendanceSession.create({
          data: {
            date: lectureDate,
            timetableEntryId: timetable?.id || null,
            facultyId: faculty.id,
            subjectId: subject.id,
            course: cls.course,
            branch: cls.branch,
            year: cls.year,
            semester: cls.semester,
            section: cls.section,
            topic: `${cls.topic} (Part ${dIdx + 1})`,
            startTime: "10:00",
            endTime: "11:00"
          }
        });
      }

      // Record items for each student: PRESENT, ABSENT, or LATE
      for (let sIdx = 0; sIdx < enrolledStudents.length; sIdx++) {
        const student = enrolledStudents[sIdx];

        // Seed realistic statuses: 85% Present, 10% Late, 5% Absent
        let status = "PRESENT";
        let remarks = "Attended lecture";

        if ((sIdx + dIdx) % 15 === 0) {
          status = "ABSENT";
          remarks = "Uninformed absence";
        } else if ((sIdx + dIdx) % 8 === 0) {
          status = "LATE";
          remarks = "Late arrival by 10 mins";
        }

        await prisma.attendanceRecordItem.upsert({
          where: {
            sessionId_studentId: {
              sessionId: session.id,
              studentId: student.id
            }
          },
          create: {
            sessionId: session.id,
            studentId: student.id,
            status,
            remarks
          },
          update: {
            status,
            remarks
          }
        });
        totalAttendanceItemsSeeded++;
      }
    }
  }
  console.log(`✓ College Academic Attendance Sessions verified (${totalAttendanceItemsSeeded} student record items).`);

  // ------------------------------------------------------------------
  // 10. LEAVE MANAGEMENT & GATE PASSES (Realistic Demo Cases)
  // ------------------------------------------------------------------
  console.log("\n10. Seeding Realistic Leave Requests & Gate Passes...");

  // Pick specific demo students to showcase all leave cases
  const cseHostelers = await prisma.user.findMany({
    where: { role: "STUDENT", course: "B.Tech", branch: "CSE", livingType: "HOSTELLER" },
    take: 5
  });

  const wardenA = wardenUserMap.get("Hostel-A");

  if (cseHostelers.length >= 4) {
    const studentApprovedLeave = cseHostelers[0];
    const studentPendingLeave = cseHostelers[1];
    const studentRejectedLeave = cseHostelers[2];
    const studentExitedActive = cseHostelers[3];

    // Case 1: APPROVED Home Leave covering today and tomorrow
    await prisma.gatePass.upsert({
      where: { passNumber: "GP-5101" },
      create: {
        passNumber: "GP-5101",
        studentId: studentApprovedLeave.id,
        type: "HOME_LEAVE",
        departureDate: new Date(today.getTime() - 12 * 3600000), // Left morning
        expectedReturnDate: new Date(today.getTime() + 48 * 3600000), // Returns day after tomorrow
        destination: "Cuttack (Home Visit)",
        reason: "Attending family function & medical appointment",
        parentContact: "9861009988",
        status: "APPROVED",
        approvedById: wardenA?.id || null,
        wardenComment: "Approved after verifying parent contact."
      },
      update: { status: "APPROVED" }
    });

    // Case 2: PENDING Leave request
    await prisma.gatePass.upsert({
      where: { passNumber: "GP-5102" },
      create: {
        passNumber: "GP-5102",
        studentId: studentPendingLeave.id,
        type: "OUTING",
        departureDate: new Date(today.getTime() + 2 * 3600000),
        expectedReturnDate: new Date(today.getTime() + 8 * 3600000),
        destination: "Forum Esplanade Mall, Rasulgarh",
        reason: "Project research books purchase and team meet",
        parentContact: "9861009977",
        status: "PENDING"
      },
      update: { status: "PENDING" }
    });

    // Case 3: REJECTED Leave request
    await prisma.gatePass.upsert({
      where: { passNumber: "GP-5103" },
      create: {
        passNumber: "GP-5103",
        studentId: studentRejectedLeave.id,
        type: "OUTING",
        departureDate: new Date(today.getTime() - 24 * 3600000),
        expectedReturnDate: new Date(today.getTime() - 16 * 3600000),
        destination: "Puri Beach",
        reason: "Weekend recreation with friends",
        parentContact: "9861009966",
        status: "REJECTED",
        approvedById: wardenA?.id || null,
        wardenComment: "Overnight outstation outing disallowed without direct parent written consent."
      },
      update: { status: "REJECTED" }
    });

    // Case 4: EXITED (Active outside campus right now)
    await prisma.gatePass.upsert({
      where: { passNumber: "GP-5104" },
      create: {
        passNumber: "GP-5104",
        studentId: studentExitedActive.id,
        type: "OUTING",
        departureDate: new Date(today.getTime() + 14 * 3600000), // Exited 2 PM
        expectedReturnDate: new Date(today.getTime() + 20 * 3600000), // Due by 8 PM
        actualExitTime: new Date(today.getTime() + 14 * 3600000),
        destination: "Central Library & City Center",
        reason: "GATE Exam Coaching Reference Materials",
        parentContact: "9861009955",
        status: "EXITED",
        approvedById: wardenA?.id || null,
        wardenComment: "Authorized for local academic outing.",
        securityGuardName: "Havildar Manoj Behera",
        securityNotes: "Scanned QR code at Main Gate 1."
      },
      update: { status: "EXITED" }
    });
  }
  console.log(`✓ Realistic Gate Passes & Leave requests ready.`);

  // ------------------------------------------------------------------
  // 11. EVENING HOSTEL RETURN & CURFEW ATTENDANCE
  // ------------------------------------------------------------------
  console.log("\n11. Seeding Evening Hostel Return Attendance (Completely Separate from Academic Attendance)...");

  const securityStaff = staffUserMap.get("security.hostela@campusdesk.edu");

  // For each of the 5 hostels, seed today's evening return roll call
  for (const h of ["Hostel-A", "Hostel-B", "Hostel-C", "Hostel-D", "Hostel-E"]) {
    const hostelResidents = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        livingType: "HOSTELLER",
        hostelBlock: h,
        isActive: true
      }
    });

    // Seed realistic evening attendance records:
    // - 75% RETURNED by curfew
    // - 15% NOT_RETURNED (Late / Curfew Alert)
    // - 10% ON_LEAVE (Authorized)
    for (let rIdx = 0; rIdx < hostelResidents.length; rIdx++) {
      const resident = hostelResidents[rIdx];

      // Check if student has approved gatepass
      const approvedPass = await prisma.gatePass.findFirst({
        where: {
          studentId: resident.id,
          status: { in: ["APPROVED", "EXITED"] }
        }
      });

      let status = "RETURNED";
      let returnTime: Date | null = new Date(today.getTime() + 19 * 3600000 + (rIdx % 50) * 60000); // 7:00 PM to 7:50 PM
      let remarks = "Returned within curfew hours";

      if (approvedPass) {
        status = "ON_LEAVE";
        returnTime = null;
        remarks = `Authorized on ${approvedPass.type} Leave (#${approvedPass.passNumber})`;
      } else if (rIdx % 6 === 0) {
        // Unreturned curfew breach
        status = "NOT_RETURNED";
        returnTime = null;
        remarks = "Curfew warning: Student not yet checked in at hostel gate";
      }

      await prisma.hostelEveningAttendance.upsert({
        where: {
          date_studentId: {
            date: today,
            studentId: resident.id
          }
        },
        create: {
          date: today,
          hostelBlock: h,
          studentId: resident.id,
          status,
          returnTime,
          recordedById: securityStaff?.id || null,
          remarks
        },
        update: {
          status,
          returnTime,
          remarks
        }
      });
    }
  }
  console.log(`✓ Evening Hostel Return Attendance records seeded for all 5 Hostels.`);

  // ------------------------------------------------------------------
  // 12. CONNECTED DEMO SCENARIOS: TICKETS, NOTICES, PARCELS, BUSES, SOS
  // ------------------------------------------------------------------
  console.log("\n12. Seeding Connected Demo Modules (Complaints, Notices, Parcels, Mess, Transport, SOS)...");

  // A. Buses & Bus Routes
  const bus1 = await prisma.bus.upsert({
    where: { busNumber: "BUS-01" },
    create: {
      busNumber: "BUS-01",
      vehicleNumber: "OD-02-AX-4450",
      capacity: 52,
      driverName: "Bishnu Charan Das",
      driverPhone: "9861300001",
      status: "ACTIVE"
    },
    update: { status: "ACTIVE" }
  });

  const bus2 = await prisma.bus.upsert({
    where: { busNumber: "BUS-02" },
    create: {
      busNumber: "BUS-02",
      vehicleNumber: "OD-02-AX-5520",
      capacity: 52,
      driverName: "Kanhu Charan Nayak",
      driverPhone: "9861300002",
      status: "ACTIVE"
    },
    update: { status: "ACTIVE" }
  });

  const bus3 = await prisma.bus.upsert({
    where: { busNumber: "BUS-03" },
    create: {
      busNumber: "BUS-03",
      vehicleNumber: "OD-02-AX-6610",
      capacity: 45,
      driverName: "Prasanta Kumar Sahoo",
      driverPhone: "9861300003",
      status: "ACTIVE"
    },
    update: { status: "ACTIVE" }
  });

  // Bus Routes
  const route1 = await prisma.busRoute.upsert({
    where: { routeNumber: "Route 1" },
    create: {
      routeNumber: "Route 1",
      routeName: "Master Canteen to Campus Express",
      description: "Covers Master Canteen, Vani Vihar, Rasulgarh, and Patia",
      startPoint: "Master Canteen",
      destination: "CampusDesk Main Gate",
      busId: bus1.id,
      status: "ACTIVE",
      delayStatus: "ON_TIME"
    },
    update: { busId: bus1.id }
  });

  // Add route stops
  const stopsRoute1 = [
    { stopName: "Master Canteen Square", pickupTime: "07:30 AM", dropTime: "05:30 PM", order: 1 },
    { stopName: "Vani Vihar Overbridge", pickupTime: "07:45 AM", dropTime: "05:15 PM", order: 2 },
    { stopName: "Rasulgarh Square", pickupTime: "08:00 AM", dropTime: "05:00 PM", order: 3 },
    { stopName: "Patia Big Bazaar Chowk", pickupTime: "08:20 AM", dropTime: "04:40 PM", order: 4 },
    { stopName: "CampusDesk Academic Gate", pickupTime: "08:35 AM", dropTime: "04:30 PM", order: 5 }
  ];

  for (const st of stopsRoute1) {
    const existingStop = await prisma.routeStop.findFirst({
      where: { routeId: route1.id, stopOrder: st.order }
    });
    if (!existingStop) {
      await prisma.routeStop.create({
        data: {
          routeId: route1.id,
          stopName: st.stopName,
          pickupTime: st.pickupTime,
          dropTime: st.dropTime,
          stopOrder: st.order
        }
      });
    }
  }

  // B. Mess Menu for all 5 Hostels
  const sampleMenu = {
    breakfast: "Idli, Sambar, Coconut Chutney, Boiled Egg / Banana, Tea & Coffee",
    lunch: "Rice, Dalma, Paneer Butter Masala / Fish Curry, Papad, Salad",
    snacks: "Veg Pakoda, Samosa, Green Chutney, Hot Masala Tea",
    dinner: "Roti, Jeera Rice, Tadka Dal, Chicken Curry / Kadai Paneer, Gulab Jamun"
  };

  for (const h of ["Hostel-A", "Hostel-B", "Hostel-C", "Hostel-D", "Hostel-E"]) {
    for (let day = 0; day <= 6; day++) {
      await prisma.messMenu.upsert({
        where: {
          hostelBlock_dayOfWeek: {
            hostelBlock: h,
            dayOfWeek: day
          }
        },
        create: {
          hostelBlock: h,
          dayOfWeek: day,
          breakfast: sampleMenu.breakfast,
          lunch: sampleMenu.lunch,
          snacks: sampleMenu.snacks,
          dinner: sampleMenu.dinner
        },
        update: {
          breakfast: sampleMenu.breakfast,
          lunch: sampleMenu.lunch,
          snacks: sampleMenu.snacks,
          dinner: sampleMenu.dinner
        }
      });
    }
  }

  // C. Official Notices
  const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (adminUser) {
    await prisma.notice.upsert({
      where: { id: "demo-notice-curfew" },
      create: {
        id: "demo-notice-curfew",
        title: "Standard Evening Hostel Curfew & Safety Protocol 2024",
        content: "All resident students are hereby reminded that the evening hostel gate closes strictly at 8:30 PM. Any late arrival must have prior approved gate pass authorization verified by their respective hostel warden.",
        category: "HOSTEL",
        priority: "HIGH",
        targetType: "ALL",
        publishedById: adminUser.id
      },
      update: {
        title: "Standard Evening Hostel Curfew & Safety Protocol 2024"
      }
    });

    await prisma.notice.upsert({
      where: { id: "demo-notice-bput-hackathon" },
      create: {
        id: "demo-notice-bput-hackathon",
        title: "BPUT State Innovation Hackathon 2024 Announced",
        content: "CampusDesk is serving as the primary digital campus operations platform for the BPUT Hackathon. All department project presentations and jury rounds will proceed as per published academic schedule.",
        category: "ACADEMIC",
        priority: "NORMAL",
        targetType: "ALL",
        publishedById: adminUser.id
      },
      update: {
        title: "BPUT State Innovation Hackathon 2024 Announced"
      }
    });
  }

  // D. Complaints / Tickets
  const demoStudent1 = await prisma.user.findFirst({
    where: { role: "STUDENT", hostelBlock: "Hostel-A" }
  });

  const electricalStaff = staffUserMap.get("maintenance.electrical@campusdesk.edu");
  const civilStaff = staffUserMap.get("maintenance.civil@campusdesk.edu");

  if (demoStudent1) {
    // Ticket 1: SUBMITTED (Open)
    await prisma.ticket.upsert({
      where: { ticketNumber: "TKT-3101" },
      create: {
        ticketNumber: "TKT-3101",
        studentId: demoStudent1.id,
        title: "Water seepage near washroom corridor",
        description: "Ceiling leak detected on Floor 2 washroom corridor in Hostel-A.",
        category: "MAINTENANCE",
        hostelBlock: "Hostel-A",
        roomNumber: "204",
        priority: "MEDIUM",
        status: "SUBMITTED"
      },
      update: { status: "SUBMITTED" }
    });

    // Ticket 2: IN_PROGRESS
    await prisma.ticket.upsert({
      where: { ticketNumber: "TKT-3102" },
      create: {
        ticketNumber: "TKT-3102",
        studentId: demoStudent1.id,
        title: "Ceiling fan regulator sparking",
        description: "Speed regulator switch is sparking when turned to speed 4.",
        category: "ELECTRICAL",
        hostelBlock: "Hostel-A",
        roomNumber: "102",
        priority: "HIGH",
        status: "IN_PROGRESS",
        assignedStaffId: electricalStaff?.id || null
      },
      update: { status: "IN_PROGRESS" }
    });

    // Ticket 3: RESOLVED
    await prisma.ticket.upsert({
      where: { ticketNumber: "TKT-3103" },
      create: {
        ticketNumber: "TKT-3103",
        studentId: demoStudent1.id,
        title: "Drinking water dispenser filter choked",
        description: "Water output flow is extremely slow at Floor 1 dispenser.",
        category: "PLUMBING",
        hostelBlock: "Hostel-A",
        roomNumber: "101",
        priority: "MEDIUM",
        status: "RESOLVED",
        assignedStaffId: civilStaff?.id || null,
        resolvedAt: new Date(today.getTime() - 4 * 3600000),
        resolutionNote: "Replaced 5-micron sediment filter and sanitized cooling tank. Flow rate restored."
      },
      update: { status: "RESOLVED" }
    });
  }

  // E. Parcels (Pending and Collected)
  if (demoStudent1) {
    await prisma.parcel.upsert({
      where: { parcelNumber: "PCL-9101" },
      create: {
        parcelNumber: "PCL-9101",
        studentId: demoStudent1.id,
        trackingNumber: "BLUEDART-88291039",
        courierService: "BlueDart",
        securityLocation: "Main Gate Security Desk",
        otpCode: "7412",
        status: "RECEIVED",
        notes: "Dell Laptop accessories package"
      },
      update: { status: "RECEIVED" }
    });

    await prisma.parcel.upsert({
      where: { parcelNumber: "PCL-9102" },
      create: {
        parcelNumber: "PCL-9102",
        studentId: demoStudent1.id,
        trackingNumber: "AMZN-IN-492019",
        courierService: "Amazon",
        securityLocation: "Main Gate Security Desk",
        otpCode: "3891",
        status: "COLLECTED",
        collectedAt: new Date(today.getTime() - 2 * 3600000),
        verifiedByGuard: "Havildar Manoj Behera",
        notes: "Textbooks & stationery bundle collected"
      },
      update: { status: "COLLECTED" }
    });
  }

  // F. Historical Resolved SOS Incident (Safe demo workflow)
  if (demoStudent1) {
    await prisma.emergency.upsert({
      where: { alertNumber: "SOS-HIST-101" },
      create: {
        alertNumber: "SOS-HIST-101",
        studentId: demoStudent1.id,
        studentType: "HOSTELLER",
        category: "MEDICAL",
        location: "Hostel-A, Ground Floor Basketball Court",
        emergencyContact: "9861009988",
        description: "[HISTORICAL DEMO RECORD] Student experienced ankle sprain during evening practice.",
        status: "RESOLVED",
        resolvedAt: new Date(today.getTime() - 48 * 3600000),
        responderNotes: "Medical officer applied crepe bandage and cold compress. Student assisted back to room safely."
      },
      update: { status: "RESOLVED" }
    });
  }

  console.log("✓ Connected Demo Modules verified.");
  console.log("\n==========================================================");
  console.log("DEMO ENVIRONMENT SEED COMPLETE & IDEMPOTENT");
  console.log("==========================================================");
}

seedDemoEnvironment()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error("Error seeding demo environment:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
