import { z } from "zod";

// User roles
export const UserRoleEnum = z.enum(["STUDENT", "WARDEN", "STAFF", "ADMIN"]);
export type UserRole = z.infer<typeof UserRoleEnum>;

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
export const TicketPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "EMERGENCY"]);
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
export const NoticeTargetTypeEnum = z.enum(["ALL", "BATCH", "BRANCH", "HOSTEL", "YEAR"]);
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
  rollNumber: z.string().optional(),
  phone: z.string().min(10, "Phone number must have at least 10 digits."),
  hostelBlock: z.string().optional(),
  roomNumber: z.string().optional(),
  batch: z.string().optional(),
  branch: z.string().optional(),
  year: z.number().int().min(1).max(5).optional(),
  department: z.string().optional(),
  consentAgreed: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the Privacy Policy and Terms of Service." })
  })
});

// Ticket create schema
export const CreateTicketSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters.").max(120),
  description: z.string().min(10, "Description must be at least 10 characters.").max(2000),
  category: TicketCategoryEnum.optional(),
  hostelBlock: z.string().min(1, "Hostel block is required."),
  roomNumber: z.string().min(1, "Room number is required."),
  priority: TicketPriorityEnum.default("MEDIUM")
});

export const UpdateTicketStatusSchema = z.object({
  status: TicketStatusEnum,
  assignedStaffId: z.string().optional(),
  correctedCategory: TicketCategoryEnum.optional(),
  note: z.string().min(2, "An audit note is required for status changes.").max(500)
});

// Gate pass schema
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

export const GatePassActionSchema = z.object({
  action: z.enum(["EXIT", "ENTRY"]),
  securityNotes: z.string().max(300).optional(),
  guardName: z.string().min(2, "Security guard name is required.")
});

// Notice schema
export const CreateNoticeSchema = z.object({
  title: z.string().min(5, "Notice title is required.").max(200),
  content: z.string().min(10, "Notice content is required.").max(5000),
  priority: NoticePriorityEnum.default("NORMAL"),
  targetType: NoticeTargetTypeEnum.default("ALL"),
  targetValue: z.string().optional(),
  requiresAction: z.boolean().default(false),
  actionType: NoticeActionTypeEnum.default("NONE"),
  actionDeadline: z.string().datetime().optional().nullable(),
  actionLink: z.string().url().optional().or(z.literal(""))
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

// Command text schema
export const CommandInputSchema = z.object({
  command: z.string().min(1, "Command text cannot be empty."),
  studentRollNumber: z.string().optional()
});
