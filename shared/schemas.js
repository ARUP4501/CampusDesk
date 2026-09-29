"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandInputSchema = exports.CreateClassCancellationSchema = exports.CreateMessFeedbackSchema = exports.CreateDocumentRequestSchema = exports.CreateNoticeSchema = exports.GatePassActionSchema = exports.ReviewGatePassSchema = exports.CreateGatePassSchema = exports.UpdateTicketStatusSchema = exports.CreateTicketSchema = exports.RegisterSchema = exports.LoginSchema = exports.DocumentStatusEnum = exports.DocumentTypeEnum = exports.NoticeActionTypeEnum = exports.NoticeTargetTypeEnum = exports.NoticePriorityEnum = exports.GatePassStatusEnum = exports.GatePassTypeEnum = exports.TicketPriorityEnum = exports.TicketStatusEnum = exports.TicketCategoryEnum = exports.UserRoleEnum = void 0;
const zod_1 = require("zod");
// User roles
exports.UserRoleEnum = zod_1.z.enum(["STUDENT", "WARDEN", "STAFF", "ADMIN"]);
// Ticket categories
exports.TicketCategoryEnum = zod_1.z.enum([
    "PLUMBING",
    "ELECTRICAL",
    "CARPENTRY",
    "MASONRY",
    "NETWORK_WIFI",
    "HOUSEKEEPING",
    "SECURITY",
    "OTHER"
]);
// Ticket statuses
exports.TicketStatusEnum = zod_1.z.enum([
    "SUBMITTED",
    "ASSIGNED",
    "IN_PROGRESS",
    "RESOLVED",
    "CLOSED"
]);
// Ticket priorities
exports.TicketPriorityEnum = zod_1.z.enum(["LOW", "MEDIUM", "HIGH", "EMERGENCY"]);
// Gate pass types
exports.GatePassTypeEnum = zod_1.z.enum(["OUTING", "HOME_LEAVE", "EMERGENCY"]);
// Gate pass statuses
exports.GatePassStatusEnum = zod_1.z.enum([
    "PENDING",
    "APPROVED",
    "REJECTED",
    "EXITED",
    "RETURNED",
    "EXPIRED"
]);
// Notice priorities
exports.NoticePriorityEnum = zod_1.z.enum(["NORMAL", "URGENT", "CRITICAL"]);
// Notice target types
exports.NoticeTargetTypeEnum = zod_1.z.enum(["ALL", "BATCH", "BRANCH", "HOSTEL", "YEAR"]);
// Notice action types
exports.NoticeActionTypeEnum = zod_1.z.enum(["NONE", "FORM", "PAYMENT", "ACKNOWLEDGEMENT"]);
// Document request types
exports.DocumentTypeEnum = zod_1.z.enum([
    "BONAFIDE_CERTIFICATE",
    "FEE_ESTIMATE",
    "CHARACTER_CERTIFICATE",
    "HOSTEL_STAY_CERTIFICATE",
    "TRANSCRIPT"
]);
// Document request statuses
exports.DocumentStatusEnum = zod_1.z.enum(["SUBMITTED", "PROCESSING", "APPROVED", "REJECTED"]);
// Auth schemas
exports.LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email("Please enter a valid email address."),
    password: zod_1.z.string().min(6, "Password must have at least 6 characters.")
});
exports.RegisterSchema = zod_1.z.object({
    email: zod_1.z.string().email("Please enter a valid email address."),
    password: zod_1.z.string().min(8, "Password must have at least 8 characters."),
    fullName: zod_1.z.string().min(2, "Full name is required."),
    role: exports.UserRoleEnum.default("STUDENT"),
    rollNumber: zod_1.z.string().optional(),
    phone: zod_1.z.string().min(10, "Phone number must have at least 10 digits."),
    hostelBlock: zod_1.z.string().optional(),
    roomNumber: zod_1.z.string().optional(),
    batch: zod_1.z.string().optional(),
    branch: zod_1.z.string().optional(),
    year: zod_1.z.number().int().min(1).max(5).optional(),
    department: zod_1.z.string().optional(),
    consentAgreed: zod_1.z.literal(true, {
        errorMap: () => ({ message: "You must agree to the Privacy Policy and Terms of Service." })
    })
});
// Ticket create schema
exports.CreateTicketSchema = zod_1.z.object({
    title: zod_1.z.string().min(3, "Title must be at least 3 characters.").max(120),
    description: zod_1.z.string().min(10, "Description must be at least 10 characters.").max(2000),
    category: exports.TicketCategoryEnum.optional(),
    hostelBlock: zod_1.z.string().min(1, "Hostel block is required."),
    roomNumber: zod_1.z.string().min(1, "Room number is required."),
    priority: exports.TicketPriorityEnum.default("MEDIUM")
});
exports.UpdateTicketStatusSchema = zod_1.z.object({
    status: exports.TicketStatusEnum,
    assignedStaffId: zod_1.z.string().optional(),
    correctedCategory: exports.TicketCategoryEnum.optional(),
    note: zod_1.z.string().min(2, "An audit note is required for status changes.").max(500)
});
// Gate pass schema
exports.CreateGatePassSchema = zod_1.z.object({
    type: exports.GatePassTypeEnum,
    departureDate: zod_1.z.string().datetime("Valid departure date and time is required."),
    expectedReturnDate: zod_1.z.string().datetime("Valid return date and time is required."),
    destination: zod_1.z.string().min(2, "Destination is required.").max(200),
    reason: zod_1.z.string().min(5, "Reason is required.").max(500),
    parentContact: zod_1.z.string().min(10, "Parent contact number is required.").max(15)
});
exports.ReviewGatePassSchema = zod_1.z.object({
    status: zod_1.z.enum(["APPROVED", "REJECTED"]),
    wardenComment: zod_1.z.string().max(500).optional()
});
exports.GatePassActionSchema = zod_1.z.object({
    action: zod_1.z.enum(["EXIT", "ENTRY"]),
    securityNotes: zod_1.z.string().max(300).optional(),
    guardName: zod_1.z.string().min(2, "Security guard name is required.")
});
// Notice schema
exports.CreateNoticeSchema = zod_1.z.object({
    title: zod_1.z.string().min(5, "Notice title is required.").max(200),
    content: zod_1.z.string().min(10, "Notice content is required.").max(5000),
    priority: exports.NoticePriorityEnum.default("NORMAL"),
    targetType: exports.NoticeTargetTypeEnum.default("ALL"),
    targetValue: zod_1.z.string().optional(),
    requiresAction: zod_1.z.boolean().default(false),
    actionType: exports.NoticeActionTypeEnum.default("NONE"),
    actionDeadline: zod_1.z.string().datetime().optional().nullable(),
    actionLink: zod_1.z.string().url().optional().or(zod_1.z.literal(""))
});
// Document request schema
exports.CreateDocumentRequestSchema = zod_1.z.object({
    docType: exports.DocumentTypeEnum,
    purpose: zod_1.z.string().min(5, "Purpose must be specified.").max(500)
});
// Mess feedback schema
exports.CreateMessFeedbackSchema = zod_1.z.object({
    hostelBlock: zod_1.z.string().min(1, "Hostel block is required."),
    mealType: zod_1.z.enum(["BREAKFAST", "LUNCH", "SNACKS", "DINNER"]),
    rating: zod_1.z.number().int().min(1).max(5),
    comments: zod_1.z.string().max(500).optional()
});
// Class cancellation schema
exports.CreateClassCancellationSchema = zod_1.z.object({
    subjectName: zod_1.z.string().min(2, "Subject name is required."),
    facultyName: zod_1.z.string().min(2, "Faculty name is required."),
    date: zod_1.z.string(),
    branch: zod_1.z.string().min(2, "Branch is required."),
    year: zod_1.z.number().int().min(1).max(5),
    reason: zod_1.z.string().min(3, "Reason for cancellation is required.")
});
// Command text schema
exports.CommandInputSchema = zod_1.z.object({
    command: zod_1.z.string().min(1, "Command text cannot be empty."),
    studentRollNumber: zod_1.z.string().optional()
});
