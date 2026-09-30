import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Clock,
  Printer,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  User,
  Image as ImageIcon,
  Wrench,
  Layers
} from "lucide-react";
import { apiRequest, UserProfile } from "../api/client.js";

interface AuditLogRow {
  id: string;
  action: string;
  fromStatus?: string;
  toStatus: string;
  note: string;
  createdAt: string;
  changedBy: { fullName: string; role: string };
}

interface TicketDetail {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: string;
  predictedCategory?: string;
  isCategoryCorrected: boolean;
  hostelBlock: string;
  roomNumber: string;
  priority: string;
  status: string;
  escalationLevel: number;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolutionNote?: string;
  hasPhoto: boolean;
  ageHours: number;
  isRecurring: boolean;
  recurringCount: number;
  student: {
    id: string;
    fullName: string;
    rollNumber: string;
    phone: string;
    hostelBlock: string;
    roomNumber: string;
  };
  assignedStaff?: {
    id: string;
    fullName: string;
    department: string;
    email: string;
  };
  auditLogs: AuditLogRow[];
}

interface StaffMember {
  id: string;
  fullName: string;
  department?: string;
  role: string;
}

export const TicketDetailPage: React.FC<{ user: UserProfile | null }> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Staff update form states
  const [statusInput, setStatusInput] = useState<string>("IN_PROGRESS");
  const [assignedStaffInput, setAssignedStaffInput] = useState<string>("");
  const [categoryCorrectionInput, setCategoryCorrectionInput] = useState<string>("");
  const [auditNoteInput, setAuditNoteInput] = useState<string>("");
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [updateLoading, setUpdateLoading] = useState<boolean>(false);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);

  const isStaffOrAdmin = user && (user.role === "STAFF" || user.role === "WARDEN" || user.role === "ADMIN");

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<{ ticket: TicketDetail }>(`/api/tickets/${id}`);
      setTicket(data.ticket);
      setStatusInput(data.ticket.status);
      setAssignedStaffInput(data.ticket.assignedStaff?.id || "");
    } catch (err: any) {
      setError(err.message || "Failed to load ticket.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffList = async () => {
    if (isStaffOrAdmin) {
      try {
        const data = await apiRequest<{ staff: StaffMember[] }>("/api/auth/staff-list");
        setStaffList(data.staff || []);
      } catch {
        // Ignore
      }
    }
  };

  useEffect(() => {
    fetchTicket();
    fetchStaffList();
  }, [id]);

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditNoteInput.trim()) {
      alert("A mandatory audit note is required for every status change.");
      return;
    }

    setUpdateLoading(true);
    setUpdateSuccess(null);
    try {
      await apiRequest(`/api/tickets/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: statusInput,
          assignedStaffId: assignedStaffInput || undefined,
          correctedCategory: categoryCorrectionInput || undefined,
          note: auditNoteInput
        })
      });
      setUpdateSuccess("Ticket status updated and logged to immutable audit trail.");
      setAuditNoteInput("");
      setCategoryCorrectionInput("");
      fetchTicket();
    } catch (err: any) {
      alert("Update failed: " + err.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handlePrintSlip = () => {
    window.open(`/api/tickets/${id}/slip`, "_blank");
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-[#A7ADB5] flex flex-col items-center justify-center space-y-2">
        <div className="w-6 h-6 border-2 border-[#D6A84F] border-t-transparent rounded-full animate-spin"></div>
        <span className="font-mono">Loading ticket record from database...</span>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/30 text-red-200 rounded-[4px] text-xs">
        {error || "Ticket record not found."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#14181C] border border-[#252B31] p-4 rounded-[6px] shadow-subtle">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate("/tickets")}
            className="p-1.5 bg-[#101316] border border-[#252B31] rounded-[4px] text-[#A7ADB5] hover:text-[#F3F4F6] hover:bg-[#181D22] transition-colors"
            aria-label="Back to tickets list"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono font-bold text-sm text-[#D6A84F]">
                #{ticket.ticketNumber}
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-[#181D22] text-[#F3F4F6] border border-[#252B31] rounded-[3px]">
                {ticket.status}
              </span>
              {ticket.escalationLevel > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-[3px]">
                  ESCALATED L{ticket.escalationLevel}
                </span>
              )}
            </div>
            <h1 className="text-base font-bold text-[#F3F4F6] mt-0.5">{ticket.title}</h1>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrintSlip}
            className="inline-flex items-center space-x-1.5 bg-[#101316] hover:bg-[#181D22] text-[#F3F4F6] border border-[#252B31] hover:border-[#363E48] text-xs font-medium px-3 py-1.5 rounded-[4px] transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-[#D6A84F]" />
            <span>Print Physical Slip</span>
          </button>
        </div>
      </div>

      {/* Recurring Issue Alert Banner */}
      {ticket.isRecurring && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-[4px] flex items-start space-x-2.5 text-xs text-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-300">Recurring Issue Detected:</span> {ticket.recurringCount} similar complaints in category <strong className="text-[#F3F4F6]">{ticket.category}</strong> were registered for <strong className="text-[#F3F4F6]">{ticket.hostelBlock} {ticket.roomNumber}</strong> within the past 14 days. Staff should inspect for underlying structural defects.
          </div>
        </div>
      )}

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Issue Overview Card */}
          <div className="bg-[#14181C] border border-[#252B31] rounded-[6px] p-5 space-y-4 shadow-subtle">
            <h2 className="text-xs font-mono font-bold text-[#D6A84F] uppercase tracking-wider border-b border-[#252B31] pb-2">
              Complaint Description & Location Context
            </h2>

            <p className="text-xs text-[#F3F4F6] whitespace-pre-wrap leading-relaxed">
              {ticket.description}
            </p>

            {ticket.hasPhoto && (
              <div className="pt-3 border-t border-[#252B31]">
                <div className="text-xs font-semibold text-[#A7ADB5] mb-2 flex items-center space-x-1.5">
                  <ImageIcon className="w-4 h-4 text-[#D6A84F]" />
                  <span>Attached Evidence Photo (Stored in Database Bytea):</span>
                </div>
                <img
                  src={`/api/tickets/${ticket.id}/photo`}
                  alt="Complaint evidence"
                  className="max-h-72 max-w-full rounded-[4px] border border-[#252B31] object-contain bg-[#101316]"
                />
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#252B31] text-xs">
              <div>
                <span className="text-[#6F7781] block font-mono text-[11px]">Hostel Block</span>
                <span className="font-semibold text-[#F3F4F6]">{ticket.hostelBlock}</span>
              </div>
              <div>
                <span className="text-[#6F7781] block font-mono text-[11px]">Room / Location</span>
                <span className="font-semibold text-[#F3F4F6]">{ticket.roomNumber}</span>
              </div>
              <div>
                <span className="text-[#6F7781] block font-mono text-[11px]">Priority Level</span>
                <span className="font-semibold text-[#F3F4F6]">{ticket.priority}</span>
              </div>
              <div>
                <span className="text-[#6F7781] block font-mono text-[11px]">Queue Age</span>
                <span className="font-semibold text-[#D6A84F] font-mono">{ticket.ageHours} hours</span>
              </div>
            </div>
          </div>

          {/* Immutable Audit Trail */}
          <div className="bg-[#14181C] border border-[#252B31] rounded-[6px] p-5 shadow-subtle">
            <div className="flex items-center justify-between border-b border-[#252B31] pb-2 mb-4">
              <h2 className="text-xs font-mono font-bold text-[#D6A84F] uppercase tracking-wider flex items-center space-x-1.5">
                <ShieldAlert className="w-4 h-4 text-[#10B981]" />
                <span>Immutable Audit Log ({ticket.auditLogs.length} Events)</span>
              </h2>
              <span className="text-[10px] font-mono text-[#6F7781]">Cryptographically Logged</span>
            </div>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#252B31]">
              {ticket.auditLogs.map((log) => (
                <div key={log.id} className="relative text-xs">
                  <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-[#D6A84F] border-2 border-[#14181C]" />
                  <div className="flex items-center space-x-2 flex-wrap">
                    <span className="font-semibold text-[#F3F4F6]">{log.action.replace(/_/g, " ")}</span>
                    <span className="text-[#6F7781]">&bull;</span>
                    <span className="text-[#A7ADB5] font-mono text-[11px]">
                      By {log.changedBy.fullName} ({log.changedBy.role})
                    </span>
                    <span className="text-[#6F7781]">&bull;</span>
                    <span className="text-[10px] font-mono text-[#6F7781]">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[#A7ADB5] mt-1 bg-[#101316] p-2.5 border border-[#252B31] rounded-[4px] leading-relaxed">
                    {log.note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Student Info & Staff Update Panel */}
        <div className="space-y-6">
          {/* Student Info Card */}
          <div className="bg-[#14181C] border border-[#252B31] rounded-[6px] p-4 text-xs space-y-3 shadow-subtle">
            <h3 className="font-mono font-bold text-[#D6A84F] uppercase tracking-wider border-b border-[#252B31] pb-2 flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-[#D6A84F]" />
              <span>Reported By</span>
            </h3>
            <div>
              <div className="font-bold text-[#F3F4F6] text-sm">{ticket.student.fullName}</div>
              <div className="text-[#D6A84F] font-mono">Roll: {ticket.student.rollNumber || "N/A"}</div>
              <div className="text-[#A7ADB5] font-mono">Phone: {ticket.student.phone}</div>
              <div className="text-[#6F7781] text-[11px] mt-1">
                Resident: {ticket.student.hostelBlock}, Room {ticket.student.roomNumber}
              </div>
            </div>

            <div className="pt-2 border-t border-[#252B31]">
              <div className="text-[#6F7781] font-mono text-[10px] uppercase">Department Routing:</div>
              <div className="font-semibold text-[#F3F4F6] mt-0.5">{ticket.category}</div>
              {ticket.predictedCategory && (
                <div className="text-[10px] font-mono text-[#D6A84F] mt-0.5">
                  Initial AI Prediction: {ticket.predictedCategory}
                </div>
              )}
            </div>
          </div>

          {/* Staff Update Action Box */}
          {isStaffOrAdmin && (
            <div className="bg-[#14181C] border border-[#252B31] rounded-[6px] p-4 text-xs space-y-4 shadow-subtle">
              <h3 className="font-mono font-bold text-[#D6A84F] uppercase tracking-wider border-b border-[#252B31] pb-2 flex items-center space-x-1.5">
                <Wrench className="w-3.5 h-3.5 text-[#D6A84F]" />
                <span>Staff Work Order Controls</span>
              </h3>

              {updateSuccess && (
                <div className="p-2.5 bg-emerald-500/10 text-emerald-200 border border-emerald-500/30 rounded-[4px] font-medium">
                  {updateSuccess}
                </div>
              )}

              <form onSubmit={handleStatusUpdate} className="space-y-3">
                <div>
                  <label htmlFor="statusInput" className="block font-semibold text-[#A7ADB5] mb-1">
                    Update Status *
                  </label>
                  <select
                    id="statusInput"
                    value={statusInput}
                    onChange={(e) => setStatusInput(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-[#252B31] rounded-[4px] bg-[#101316] text-[#F3F4F6] focus:outline-none focus:border-[#D6A84F]"
                  >
                    <option value="SUBMITTED">Submitted</option>
                    <option value="ASSIGNED">Assigned</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="assignedStaffInput" className="block font-semibold text-[#A7ADB5] mb-1">
                    Assign Staff Member
                  </label>
                  <select
                    id="assignedStaffInput"
                    value={assignedStaffInput}
                    onChange={(e) => setAssignedStaffInput(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-[#252B31] rounded-[4px] bg-[#101316] text-[#F3F4F6] focus:outline-none focus:border-[#D6A84F]"
                  >
                    <option value="">Unassigned (Queue)</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.department || s.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="categoryCorrectionInput" className="block font-semibold text-[#A7ADB5] mb-1">
                    Correct Category (if misclassified)
                  </label>
                  <select
                    id="categoryCorrectionInput"
                    value={categoryCorrectionInput}
                    onChange={(e) => setCategoryCorrectionInput(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-[#252B31] rounded-[4px] bg-[#101316] text-[#F3F4F6] focus:outline-none focus:border-[#D6A84F]"
                  >
                    <option value="">Keep current ({ticket.category})</option>
                    <option value="PLUMBING">Plumbing</option>
                    <option value="ELECTRICAL">Electrical</option>
                    <option value="CARPENTRY">Carpentry</option>
                    <option value="MASONRY">Masonry</option>
                    <option value="NETWORK_WIFI">Network/Wi-Fi</option>
                    <option value="HOUSEKEEPING">Housekeeping</option>
                    <option value="SECURITY">Security</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="auditNoteInput" className="block font-semibold text-[#A7ADB5] mb-1">
                    Audit Note (Mandatory) *
                  </label>
                  <textarea
                    id="auditNoteInput"
                    required
                    rows={3}
                    value={auditNoteInput}
                    onChange={(e) => setAuditNoteInput(e.target.value)}
                    placeholder="Describe action taken, inspection findings or parts replaced..."
                    className="w-full text-xs px-2.5 py-1.5 border border-[#252B31] rounded-[4px] bg-[#101316] text-[#F3F4F6] focus:outline-none focus:border-[#D6A84F]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={updateLoading}
                  className="w-full bg-[#D6A84F] hover:bg-[#F0C86A] text-[#090B0D] font-bold py-2 px-3 text-xs rounded-[4px] disabled:opacity-50 transition-colors shadow-xs"
                >
                  {updateLoading ? "Saving Audit Entry..." : "Save Audit Status"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
