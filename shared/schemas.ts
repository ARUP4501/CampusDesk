import { z } from "zod";

// User roles
export const UserRoleEnum = z.enum(["STUDENT", "FACULTY", "WARDEN", "STAFF", "ADMIN"]);
export type UserRole = z.infer<typeof UserRoleEnum>;

// Living Types (Hosteller vs Day Scholar)
export const LivingTypeEnum = z.enum(["HOSTELLER", "DAY_SCHOLAR"]);
export type LivingType = z.infer<typeof LivingTypeEnum>;

// Ticket categories
export const TicketCategoryEnum = z.enum([
  "PLUMBING",
  "ELECTRICAL",
  "CARPENTRY",
  "MASONRY",
  "NETWORK_WIFI",
  "HOUSEKEEPING",
  "SECURITY",
  "OTHER"
]);
export type TicketCategory = z.infer<typeof TicketCategoryEnum>;

// Ticket statuses
export const TicketStatusEnum = z.enum([
  "SUBMITTED",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED"
]);
export type TicketStatus = z.infer<typeof TicketStatusEnum>;

// Ticket priorities
export const TicketPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL", "EMERGENCY"]);
export type TicketPriority = z.infer<typeof TicketPriorityEnum>;

// Gate pass types
export const GatePassTypeEnum = z.enum(["OUTING", "HOME_LEAVE", "EMERGENCY"]);
export type GatePassType = z.infer<typeof GatePassTypeEnum>;

// Gate pass statuses
export const GatePassStatusEnum = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
  "EXITED",
  "RETURNED",
  "EXPIRED"
]);
export type GatePassStatus = z.infer<typeof GatePassStatusEnum>;

// Notice priorities
export const NoticePriorityEnum = z.enum(["NORMAL", "URGENT", "CRITICAL"]);
export type NoticePriority = z.infer<typeof NoticePriorityEnum>;

// Notice target types
export const NoticeTargetTypeEnum = z.enum(["ALL", "BATCH", "BRANCH", "HOSTEL", "YEAR", "HOSTELLER", "DAY_SCHOLAR", "INDIVIDUAL"]);
export type NoticeTargetType = z.infer<typeof NoticeTargetTypeEnum>;

// Notice action types
export const NoticeActionTypeEnum = z.enum(["NONE", "FORM", "PAYMENT", "ACKNOWLEDGEMENT"]);
export type NoticeActionType = z.infer<typeof NoticeActionTypeEnum>;

// Document request types
export const DocumentTypeEnum = z.enum([
  "BONAFIDE_CERTIFICATE",
  "FEE_ESTIMATE",
  "CHARACTER_CERTIFICATE",
  "HOSTEL_STAY_CERTIFICATE",
  "TRANSCRIPT"
]);
export type DocumentType = z.infer<typeof DocumentTypeEnum>;

// Document request statuses
export const DocumentStatusEnum = z.enum(["SUBMITTED", "PROCESSING", "APPROVED", "REJECTED"]);
export type DocumentStatus = z.infer<typeof DocumentStatusEnum>;

// Auth schemas
export const LoginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must have at least 6 characters.")
});

export const RegisterSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(8, "Password must have at least 8 characters."),
  fullName: z.string().min(2, "Full name is required."),
  role: UserRoleEnum.default("STUDENT"),
  livingType: LivingTypeEnum.default("HOSTELLER"),
  rollNumber: z.string().optional().nullable(),
  phone: z.string().min(10, "Phone number must have at least 10 digits."),
  hostelBlock: z.string().optional().nullable(),
  roomNumber: z.string().optional().nullable(),
  batch: z.string().optional().nullable(),
  branch: z.string().optional().nullable(),
  year: z.number().int().min(1).max(5).optional(),
  department: z.string().optional().nullable(),
  busRoute: z.string().optional().nullable(),
  pickupPoint: z.string().optional().nullable(),
  vehicleNumber: z.string().optional().nullable(),
  parkingZone: z.string().optional().nullable(),
  consentAgreed: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the Privacy Policy and Terms of Service." })
  })
});

// Ticket create schema
export const CreateTicketSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters.").max(120),
  description: z.string().min(10, "Description must be at least 10 characters.").max(2000),
  category: TicketCategoryEnum.optional(),
  hostelBlock: z.string().min(1, "Hostel block or campus location is required."),
  roomNumber: z.string().min(1, "Room number or area is required."),
  priority: TicketPriorityEnum.default("MEDIUM")
});

export const UpdateTicketStatusSchema = z.object({
  status: TicketStatusEnum,
  assignedStaffId: z.string().optional().nullable(),
  correctedCategory: TicketCategoryEnum.optional(),
  note: z.string().min(2, "An audit note is required for status changes.").max(500)
});

// Gate pass schemas
export const CreateGatePassSchema = z.object({
  type: GatePassTypeEnum,
  departureDate: z.string().datetime("Valid departure date and time is required."),
  expectedReturnDate: z.string().datetime("Valid return date and time is required."),
  destination: z.string().min(2, "Destination is required.").max(200),
  reason: z.string().min(5, "Reason is required.").max(500),
  parentContact: z.string().min(10, "Parent contact number is required.").max(15)
});

export const ReviewGatePassSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  wardenComment: z.string().max(500).optional()
});

// Gate pass action schema (CRITICAL FIX: passIdentifier included so Zod does not strip it)
export const GatePassActionSchema = z.object({
  action: z.enum(["EXIT", "ENTRY"]),
  passIdentifier: z.string().min(1, "Pass number or QR token is required."),
  securityNotes: z.string().max(300).optional().nullable(),
  guardName: z.string().min(2, "Security guard name is required.")
});

// Priority Override Schema with reason audit
export const OverrideTicketPrioritySchema = z.object({
  priority: TicketPriorityEnum,
  reason: z.string().min(3, "Reason for manual priority override is required.").max(500)
});

// Notice categories
export const NoticeCategoryEnum = z.enum([
  "GENERAL",
  "ACADEMIC",
  "HOSTEL",
  "MESS",
  "EMERGENCY",
  "MAINTENANCE",
  "HOLIDAY"
]);
export type NoticeCategory = z.infer<typeof NoticeCategoryEnum>;

// Notice schema
export const CreateNoticeSchema = z.object({
  title: z.string().min(5, "Notice title is required.").max(200),
  content: z.string().min(10, "Notice content is required.").max(5000),
  category: NoticeCategoryEnum.default("GENERAL"),
  priority: NoticePriorityEnum.default("NORMAL"),
  targetType: NoticeTargetTypeEnum.default("ALL"),
  targetValue: z.string().optional().nullable(),
  requiresAction: z.boolean().default(false),
  actionType: NoticeActionTypeEnum.default("NONE"),
  actionDeadline: z.string().datetime().optional().nullable(),
  actionLink: z.string().url().optional().or(z.literal("")).nullable(),
  expiresAt: z.string().datetime().optional().nullable()
});

export const UpdateNoticeSchema = z.object({
  title: z.string().min(5, "Notice title is required.").max(200),
  content: z.string().min(10, "Notice content is required.").max(5000),
  category: NoticeCategoryEnum.default("GENERAL"),
  priority: NoticePriorityEnum.default("NORMAL"),
  targetType: NoticeTargetTypeEnum.default("ALL"),
  targetValue: z.string().optional().nullable(),
  requiresAction: z.boolean().default(false),
  actionType: NoticeActionTypeEnum.default("NONE"),
  actionDeadline: z.string().datetime().optional().nullable(),
  actionLink: z.string().url().optional().or(z.literal("")).nullable(),
  expiresAt: z.string().datetime().optional().nullable()
});

// Admin User Management Schemas
export const AdminCreateUserSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(8, "Password must have at least 8 characters."),
  fullName: z.string().min(2, "Full name is required."),
  role: UserRoleEnum,
  livingType: LivingTypeEnum.default("HOSTELLER"),
  rollNumber: z.string().optional().nullable(),
  phone: z.string().min(10, "Phone number must have at least 10 digits."),
  hostelBlock: z.string().optional().nullable(),
  roomNumber: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  branch: z.string().optional().nullable(),
  year: z.number().int().min(1).max(5).optional().nullable()
});

export const AdminUpdateUserSchema = z.object({
  fullName: z.string().min(2, "Full name is required.").optional(),
  role: UserRoleEnum.optional(),
  livingType: LivingTypeEnum.optional(),
  rollNumber: z.string().optional().nullable(),
  phone: z.string().min(10, "Phone number must have at least 10 digits.").optional(),
  hostelBlock: z.string().optional().nullable(),
  roomNumber: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  branch: z.string().optional().nullable(),
  year: z.number().int().min(1).max(5).optional().nullable(),
  isActive: z.boolean().optional()
});

// Document request schema
export const CreateDocumentRequestSchema = z.object({
  docType: DocumentTypeEnum,
  purpose: z.string().min(5, "Purpose must be specified.").max(500)
});

// Mess feedback schema
export const CreateMessFeedbackSchema = z.object({
  hostelBlock: z.string().min(1, "Hostel block is required."),
  mealType: z.enum(["BREAKFAST", "LUNCH", "SNACKS", "DINNER"]),
  rating: z.number().int().min(1).max(5),
  comments: z.string().max(500).optional()
});

// Class cancellation schema
export const CreateClassCancellationSchema = z.object({
  subjectName: z.string().min(2, "Subject name is required."),
  facultyName: z.string().min(2, "Faculty name is required."),
  date: z.string(),
  branch: z.string().min(2, "Branch is required."),
  year: z.number().int().min(1).max(5),
  reason: z.string().min(3, "Reason for cancellation is required.")
});

// Mess menu update schema
export const UpdateMessMenuSchema = z.object({
  hostelBlock: z.string().min(1, "Hostel block is required."),
  dayOfWeek: z.number().int().min(1).max(7),
  breakfast: z.string().min(1, "Breakfast menu items are required."),
  lunch: z.string().min(1, "Lunch menu items are required."),
  snacks: z.string().min(1, "Evening snacks menu items are required."),
  dinner: z.string().min(1, "Dinner menu items are required.")
});

// Student Registration Schema with All Requirements
export const StudentRegisterSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(8, "Password must have at least 8 characters."),
  fullName: z.string().min(2, "Full name is required."),
  phone: z.string().min(10, "Phone number must have at least 10 digits."),
  dob: z.string().optional().nullable(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional().nullable(),
  bloodGroup: z.string().optional().nullable(),
  livingType: LivingTypeEnum.default("HOSTELLER"),
  rollNumber: z.string().min(2, "Student Registration / Roll Number is required."),
  course: z.string().min(1, "Course is required (e.g. B.Tech, MCA, MBA)."),
  department: z.string().min(1, "Department is required (e.g. CSE, ECE, MECH)."),
  branch: z.string().optional().nullable(),
  year: z.number().int().min(1).max(5).default(1),
  semester: z.number().int().min(1).max(10).default(1),
  batch: z.string().optional().nullable(),
  permanentAddress: z.string().min(5, "Permanent address is required."),
  currentAddress: z.string().optional().nullable(),
  fatherName: z.string().min(2, "Father's name is required."),
  fatherPhone: z.string().min(10, "Father's contact number is required."),
  motherName: z.string().optional().nullable(),
  motherPhone: z.string().optional().nullable(),
  guardianName: z.string().min(2, "Local guardian name is required."),
  guardianRelation: z.string().min(2, "Local guardian relationship is required."),
  guardianPhone: z.string().min(10, "Local guardian contact number is required."),
  guardianAddress: z.string().optional().nullable(),
  // Hostel fields (optional for Day Scholars)
  requestedHostel: z.string().optional().nullable(),
  roomPreference: z.string().optional().nullable(),
  // Day Scholar transport / parking fields
  busRoute: z.string().optional().nullable(),
  pickupPoint: z.string().optional().nullable(),
  vehicleNumber: z.string().optional().nullable(),
  parkingZone: z.string().optional().nullable(),
  consentAgreed: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the Privacy Policy and Terms of Service." })
  })
});

// Warden Verification Review Schema
export const WardenReviewVerificationSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  rejectionReason: z.string().optional()
});

// Admin Final Approval Schema
export const AdminReviewVerificationSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  rejectionReason: z.string().optional(),
  hostelBlock: z.string().optional(),
  roomNumber: z.string().optional(),
  bedNumber: z.string().optional()
});

// Warden Management Schemas
export const CreateWardenSchema = z.object({
  fullName: z.string().min(2, "Full name is required."),
  employeeId: z.string().min(2, "Employee ID is required."),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(8, "Password must have at least 8 characters."),
  phone: z.string().min(10, "Phone number must have at least 10 digits."),
  hostelBlock: z.string().min(1, "Assigned hostel is required.")
});

export const UpdateWardenSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  hostelBlock: z.string().min(1).optional(),
  isActive: z.boolean().optional()
});

// Staff Management Schemas
export const CreateStaffSchema = z.object({
  fullName: z.string().min(2, "Full name is required."),
  employeeId: z.string().min(2, "Employee ID is required."),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(8, "Password must have at least 8 characters."),
  phone: z.string().min(10, "Phone number must have at least 10 digits."),
  department: z.string().min(2, "Work responsibility / Department is required.")
});

export const UpdateStaffSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  department: z.string().min(2).optional(),
  isActive: z.boolean().optional()
});

// Student Management Schemas
export const AdminUpdateStudentSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  livingType: LivingTypeEnum.optional(),
  dob: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  bloodGroup: z.string().optional().nullable(),
  course: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  branch: z.string().optional().nullable(),
  year: z.number().int().optional().nullable(),
  semester: z.number().int().optional().nullable(),
  permanentAddress: z.string().optional().nullable(),
  currentAddress: z.string().optional().nullable(),
  fatherName: z.string().optional().nullable(),
  fatherPhone: z.string().optional().nullable(),
  motherName: z.string().optional().nullable(),
  motherPhone: z.string().optional().nullable(),
  guardianName: z.string().optional().nullable(),
  guardianRelation: z.string().optional().nullable(),
  guardianPhone: z.string().optional().nullable(),
  guardianAddress: z.string().optional().nullable(),
  hostelBlock: z.string().optional().nullable(),
  roomNumber: z.string().optional().nullable(),
  bedNumber: z.string().optional().nullable(),
  busRoute: z.string().optional().nullable(),
  pickupPoint: z.string().optional().nullable(),
  vehicleNumber: z.string().optional().nullable(),
  parkingZone: z.string().optional().nullable(),
  verificationStatus: z.string().optional(),
  isActive: z.boolean().optional()
});

// Hostel & Room/Bed Schemas
export const CreateHostelSchema = z.object({
  name: z.string().min(2, "Hostel name is required."),
  type: z.enum(["BOYS", "GIRLS", "COED"]).default("BOYS"),
  wardenId: z.string().optional().nullable(),
  description: z.string().optional().nullable()
});

export const CreateRoomSchema = z.object({
  hostelBlock: z.string().min(1, "Hostel name is required."),
  roomNumber: z.string().min(1, "Room number is required."),
  floor: z.number().int().min(0).default(1),
  capacity: z.number().int().min(1).max(6).default(2)
});

export const CreateBedSchema = z.object({
  hostelBlock: z.string().min(1, "Hostel name is required."),
  roomNumber: z.string().min(1, "Room number is required."),
  bedNumber: z.string().min(1, "Bed identifier is required (e.g. Bed-1, Bed-2).")
});

export const AllocateBedSchema = z.object({
  hostelBlock: z.string().min(1, "Hostel name is required."),
  roomNumber: z.string().min(1, "Room number is required."),
  bedNumber: z.string().min(1, "Bed identifier is required."),
  studentId: z.string().min(1, "Student ID is required.")
});

export const CreateTransferRequestSchema = z.object({
  toHostel: z.string().min(1, "Destination hostel is required."),
  toRoom: z.string().optional().nullable(),
  reason: z.string().min(5, "Reason for transfer is required.")
});

export const ReviewTransferRequestSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  remark: z.string().optional()
});

// Command text schema
export const CommandInputSchema = z.object({
  command: z.string().min(1, "Command text cannot be empty."),
  studentRollNumber: z.string().optional()
});

// SOS Emergency Schemas
export const EmergencyCategoryEnum = z.enum([
  "MEDICAL",
  "FIRE_SMOKE",
  "LIFT_STUCK",
  "SECURITY",
  "ELECTRICAL",
  "OTHER"
]);
export type EmergencyCategory = z.infer<typeof EmergencyCategoryEnum>;

export const CreateEmergencySchema = z.object({
  category: EmergencyCategoryEnum,
  location: z.string().min(2, "Location is required.").max(200),
  coordinates: z.string().optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  studentType: z.string().optional().nullable(),
  emergencyContact: z.string().optional().nullable()
});

export const UpdateEmergencyStatusSchema = z.object({
  status: z.enum(["ACTIVE", "ACKNOWLEDGED", "RESPONDING", "RESOLVED"]),
  responderNotes: z.string().max(500).optional().nullable()
});

// Club Schemas
export const ClubCategoryEnum = z.enum([
  "CODING_TECH",
  "YOGA_WELLNESS",
  "MUSIC",
  "DANCE",
  "ART_CREATIVITY",
  "PHOTOGRAPHY",
  "DRAMA_THEATRE",
  "SPORTS_FITNESS",
  "LITERATURE_DEBATE",
  "PUBLIC_SPEAKING",
  "SOCIAL_SERVICE",
  "MEDIA_CONTENT"
]);
export type ClubCategory = z.infer<typeof ClubCategoryEnum>;

export const CreateClubSchema = z.object({
  name: z.string().min(2).max(100),
  category: ClubCategoryEnum,
  description: z.string().min(10).max(1000),
  logoIcon: z.string().optional().nullable(),
  coordinatorName: z.string().optional().nullable(),
  coordinatorEmail: z.string().email().optional().nullable(),
  coordinatorPhone: z.string().optional().nullable(),
  meetingSchedule: z.string().optional().nullable(),
  roomLocation: z.string().optional().nullable()
});

export const CreateClubEventSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().min(5).max(1000),
  date: z.string().datetime("Valid event date/time is required."),
  location: z.string().min(2).max(150),
  capacity: z.number().int().min(1).default(100)
});

export const CreateClubAnnouncementSchema = z.object({
  title: z.string().min(2).max(150),
  content: z.string().min(5).max(2000)
});

// Planned Maintenance Schemas
export const CreatePlannedMaintenanceSchema = z.object({
  title: z.string().min(3).max(150),
  description: z.string().min(10).max(1000),
  location: z.string().min(2).max(150),
  category: z.enum(["WATER", "ELECTRICAL", "NETWORK", "ELEVATOR", "GENERAL"]).default("GENERAL"),
  startTime: z.string().datetime("Valid start date/time is required."),
  endTime: z.string().datetime("Valid end date/time is required."),
  targetAudience: z.string().default("ALL")
});

// Parcel Schemas
export const CreateParcelSchema = z.object({
  studentRollNumber: z.string().min(2, "Student roll number is required."),
  courierService: z.string().min(2, "Courier service is required."),
  trackingNumber: z.string().optional().nullable(),
  securityLocation: z.string().default("Main Gate Security Desk"),
  notes: z.string().optional().nullable()
});

export const VerifyParcelPickupSchema = z.object({
  otpCode: z.string().min(4, "4-digit OTP is required.").max(6),
  verifiedByGuard: z.string().min(2, "Security officer name is required.")
});

// Transport & Parking Schemas
export const CreateBusSchema = z.object({
  busNumber: z.string().min(1, "Bus number is required").max(50),
  vehicleNumber: z.string().min(1, "Vehicle registration number is required").max(50),
  capacity: z.coerce.number().int().min(1, "Capacity must be at least 1").max(200),
  driverName: z.string().min(2, "Driver name is required").max(100),
  driverPhone: z.string().min(7, "Driver contact is required").max(20),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE")
});
export type CreateBusInput = z.infer<typeof CreateBusSchema>;

export const UpdateBusSchema = CreateBusSchema.partial();
export type UpdateBusInput = z.infer<typeof UpdateBusSchema>;

export const CreateRouteStopSchema = z.object({
  stopName: z.string().min(1, "Stop name is required").max(100),
  location: z.string().max(150).optional().nullable(),
  pickupTime: z.string().min(1, "Pickup time is required").max(30),
  dropTime: z.string().max(30).optional().nullable(),
  stopOrder: z.coerce.number().int().min(1, "Stop order must be at least 1")
});
export type CreateRouteStopInput = z.infer<typeof CreateRouteStopSchema>;

export const UpdateRouteStopSchema = CreateRouteStopSchema.partial();
export type UpdateRouteStopInput = z.infer<typeof UpdateRouteStopSchema>;

export const CreateRouteSchema = z.object({
  routeNumber: z.string().min(1, "Route number is required").max(50),
  routeName: z.string().min(2, "Route name is required").max(150),
  description: z.string().max(500).optional().nullable(),
  startPoint: z.string().min(1, "Starting point is required").max(100),
  destination: z.string().min(1, "Destination is required").max(100),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  busId: z.string().optional().nullable(),
  stops: z.array(CreateRouteStopSchema).optional()
});
export type CreateRouteInput = z.infer<typeof CreateRouteSchema>;

export const UpdateRouteSchema = z.object({
  routeNumber: z.string().min(1).max(50).optional(),
  routeName: z.string().min(2).max(150).optional(),
  description: z.string().max(500).optional().nullable(),
  startPoint: z.string().min(1).max(100).optional(),
  destination: z.string().min(1).max(100).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  busId: z.string().optional().nullable(),
  delayStatus: z.enum(["ON_TIME", "DELAYED", "CANCELLED"]).optional(),
  delayNotice: z.string().max(300).optional().nullable()
});
export type UpdateRouteInput = z.infer<typeof UpdateRouteSchema>;

export const AssignBusSchema = z.object({
  busId: z.string().nullable()
});
export type AssignBusInput = z.infer<typeof AssignBusSchema>;

export const UpdateTransportRouteSchema = z.object({
  status: z.enum(["ON_TIME", "DELAYED", "MAINTENANCE", "CANCELLED"]),
  statusNote: z.string().max(300).optional().nullable()
});

export const UpdateParkingZoneSchema = z.object({
  occupiedSlots: z.number().int().min(0),
  status: z.enum(["AVAILABLE", "FULL", "RESTRICTED"]).optional(),
  notice: z.string().max(200).optional().nullable()
});

// Academic Course & Branch Master Data Schemas
export const CreateCourseSchema = z.object({
  code: z.string().min(1, "Course code is required (e.g. MCA, B.Tech).").max(30),
  name: z.string().min(2, "Course name is required.").max(120),
  durationYears: z.coerce.number().int().min(1).max(6).default(2),
  isActive: z.boolean().default(true)
});
export type CreateCourseInput = z.infer<typeof CreateCourseSchema>;

export const UpdateCourseSchema = CreateCourseSchema.partial();
export type UpdateCourseInput = z.infer<typeof UpdateCourseSchema>;

export const CreateBranchSchema = z.object({
  courseId: z.string().min(1, "Course ID is required."),
  code: z.string().min(1, "Branch code is required (e.g. CSE, DS).").max(30),
  name: z.string().min(2, "Branch name is required.").max(120),
  isActive: z.boolean().default(true)
});
export type CreateBranchInput = z.infer<typeof CreateBranchSchema>;

export const UpdateBranchSchema = z.object({
  courseId: z.string().optional(),
  code: z.string().min(1).max(30).optional(),
  name: z.string().min(2).max(120).optional(),
  isActive: z.boolean().optional()
});
export type UpdateBranchInput = z.infer<typeof UpdateBranchSchema>;

// Academic Subject, Faculty Assignment, Timetable, Attendance & Marks Schemas
export const SubjectTypeEnum = z.enum(["THEORY", "PRACTICAL", "LAB"]);
export type SubjectType = z.infer<typeof SubjectTypeEnum>;

export const CreateSubjectSchema = z.object({
  name: z.string().min(2, "Subject name must be at least 2 characters").max(120),
  code: z.string().min(1, "Subject code is required").max(30),
  course: z.string().min(1, "Course is required").max(50),
  branch: z.string().min(1, "Branch is required").max(50),
  year: z.coerce.number().int().min(1).max(6),
  semester: z.coerce.number().int().min(1).max(12),
  section: z.string().max(10).optional().default("A"),
  type: SubjectTypeEnum.default("THEORY"),
  credits: z.coerce.number().min(0).max(20).default(3),
  isActive: z.boolean().default(true)
});
export type CreateSubjectInput = z.infer<typeof CreateSubjectSchema>;

export const UpdateSubjectSchema = CreateSubjectSchema.partial();
export type UpdateSubjectInput = z.infer<typeof UpdateSubjectSchema>;

export const CreateFacultyUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Full name is required").max(100),
  department: z.string().min(1, "Department is required").max(100),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(20),
  employeeId: z.string().max(50).optional().nullable()
});
export type CreateFacultyUserInput = z.infer<typeof CreateFacultyUserSchema>;

export const UpdateFacultyUserSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  department: z.string().min(1).max(100).optional(),
  phone: z.string().min(10).max(20).optional(),
  employeeId: z.string().max(50).optional().nullable(),
  isActive: z.boolean().optional()
});
export type UpdateFacultyUserInput = z.infer<typeof UpdateFacultyUserSchema>;

export const CreateFacultyAssignmentSchema = z.object({
  facultyId: z.string().min(1, "Faculty is required"),
  subjectId: z.string().min(1, "Subject is required"),
  course: z.string().min(1, "Course is required"),
  branch: z.string().min(1, "Branch is required"),
  year: z.coerce.number().int().min(1).max(6),
  semester: z.coerce.number().int().min(1).max(12),
  section: z.string().min(1, "Section is required").max(10),
  academicYear: z.string().max(20).optional().default("2026-2027"),
  isActive: z.boolean().default(true)
});
export type CreateFacultyAssignmentInput = z.infer<typeof CreateFacultyAssignmentSchema>;

export const CreateTimetableEntrySchema = z.object({
  dayOfWeek: z.coerce.number().int().min(1).max(6), // 1=Mon, 6=Sat
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid start time (HH:MM)"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid end time (HH:MM)"),
  subjectId: z.string().min(1, "Subject is required"),
  facultyId: z.string().min(1, "Faculty is required"),
  course: z.string().min(1, "Course is required"),
  branch: z.string().min(1, "Branch is required"),
  year: z.coerce.number().int().min(1).max(6),
  semester: z.coerce.number().int().min(1).max(12),
  section: z.string().min(1).max(10).default("A"),
  room: z.string().min(1, "Room/Lab is required").max(50),
  isActive: z.boolean().default(true)
});
export type CreateTimetableEntryInput = z.infer<typeof CreateTimetableEntrySchema>;

export const UpdateTimetableEntrySchema = CreateTimetableEntrySchema.partial();
export type UpdateTimetableEntryInput = z.infer<typeof UpdateTimetableEntrySchema>;

export const AttendanceItemSchema = z.object({
  studentId: z.string().min(1),
  status: z.enum(["PRESENT", "ABSENT", "LATE"]),
  remarks: z.string().max(200).optional().nullable()
});

export const SubmitAttendanceSessionSchema = z.object({
  timetableEntryId: z.string().optional().nullable(),
  subjectId: z.string().min(1, "Subject is required"),
  course: z.string().min(1, "Course is required"),
  branch: z.string().min(1, "Branch is required"),
  year: z.coerce.number().int().min(1).max(6),
  semester: z.coerce.number().int().min(1).max(12),
  section: z.string().min(1).max(10).default("A"),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  records: z.array(AttendanceItemSchema).min(1, "At least one attendance record is required")
});
export type SubmitAttendanceSessionInput = z.infer<typeof SubmitAttendanceSessionSchema>;

export const ResultStatusEnum = z.enum(["DRAFT", "PUBLISHED"]);
export type ResultStatus = z.infer<typeof ResultStatusEnum>;

export const MarkItemSchema = z.object({
  studentId: z.string().min(1),
  internalMarks: z.coerce.number().min(0).max(100).optional().nullable(),
  assignmentMarks: z.coerce.number().min(0).max(100).optional().nullable(),
  practicalMarks: z.coerce.number().min(0).max(100).optional().nullable(),
  endSemMarks: z.coerce.number().min(0).max(100).optional().nullable(),
  totalMarks: z.coerce.number().min(0).max(100).optional().nullable(),
  grade: z.string().max(5).optional().nullable(),
  credits: z.coerce.number().min(0).max(20).optional().nullable(),
  status: ResultStatusEnum.optional()
});

export const SaveMarksBatchSchema = z.object({
  subjectId: z.string().min(1, "Subject is required"),
  course: z.string().min(1, "Course is required"),
  branch: z.string().min(1, "Branch is required"),
  year: z.coerce.number().int().min(1).max(6),
  semester: z.coerce.number().int().min(1).max(12),
  section: z.string().min(1).max(10).default("A"),
  status: ResultStatusEnum.default("DRAFT"),
  records: z.array(MarkItemSchema).min(1, "At least one student marks record is required")
});
export type SaveMarksBatchInput = z.infer<typeof SaveMarksBatchSchema>;

