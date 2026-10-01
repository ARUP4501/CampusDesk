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
  Layers,
  Sparkles,
  ChevronRight
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
      setError(err.message || "Failed to load ticket details.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffMembers = async () => {
    if (!isStaffOrAdmin) return;
    try {
      const data = await apiRequest<{ staff: StaffMember[] }>("/api/tickets/meta/staff");
      setStaffList(data.staff || []);
    } catch (err) {
      console.error("Failed to load staff list:", err);
    }
  };

  useEffect(() => {
    fetchTicket();
    fetchStaffMembers();
  }, [id]);

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket) return;

    setUpdateLoading(true);
    setUpdateSuccess(null);
    setError(null);

    try {
      const payload: any = {
        status: statusInput,
        note: auditNoteInput || `Status updated to ${statusInput}`
      };

      if (assignedStaffInput !== (ticket.assignedStaff?.id || "")) {
        payload.assignedStaffId = assignedStaffInput || null;
      }

      if (categoryCorrectionInput && categoryCorrectionInput !== ticket.category) {
        payload.categoryCorrection = categoryCorrectionInput;
      }

      const response = await apiRequest<{ ticket: TicketDetail }>(`/api/tickets/${ticket.id}/status`, {
        method: "PATCH",
        body: JSON.stringify(payload)
      });

      setTicket(response.ticket);
      setUpdateSuccess("Ticket status and audit record updated successfully.");
      setAuditNoteInput("");
    } catch (err: any) {
      setError(err.message || "Failed to update ticket.");
    } finally {
      setUpdateLoading(false);
    }
  };

  const handlePrintSlip = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-xs text-[#4D2A00]/70 flex flex-col items-center justify-center space-y-2">
        <div className="w-7 h-7 border-2 border-[#CC6F00] border-t-transparent rounded-full animate-spin"></div>
        <span className="font-medium text-[#4D2A00]/70">Loading ticket details...</span>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 glass-panel rounded-3xl text-center space-y-4 border border-[rgba(77,42,0,0.1)] shadow-glass">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-[#4D2A00]">Error Loading Ticket</h2>
        <p className="text-xs text-[#4D2A00]/70">{error || "Ticket not found."}</p>
        <button
          onClick={() => navigate("/tickets")}
          className="btn-secondary px-4 py-2 text-xs font-semibold"
        >
          Back to Tickets Queue
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 glass-panel p-5 rounded-3xl border border-[rgba(77,42,0,0.1)] shadow-glass no-print">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate("/tickets")}
            className="p-2.5 bg-white/60 border border-[rgba(77,42,0,0.1)] rounded-xl text-[#4D2A00]/70 hover:text-[#4D2A00] transition-colors"
            aria-label="Back to tickets list"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold font-mono text-[#CC6F00] text-base">#{ticket.ticketNumber}</span>
              <span className="text-xs font-semibold uppercase text-[#4D2A00]/60">• {ticket.category}</span>
            </div>
            <h1 className="text-lg font-bold text-[#4D2A00] leading-tight">{ticket.title}</h1>
          </div>
        </div>

        <button
          onClick={handlePrintSlip}
          className="btn-secondary inline-flex items-center space-x-2 text-xs font-semibold px-4 py-2 shrink-0"
        >
          <Printer className="w-4 h-4 text-[#CC6F00]" />
          <span>Print Work Order Slip</span>
        </button>
      </div>

      {/* SLA Escalation Warning Banner */}
      {ticket.escalationLevel > 0 && (
        <div className={`p-4 rounded-2xl text-xs flex items-start space-x-3 ${
          ticket.escalationLevel === 2
            ? "bg-rose-500/20 border border-rose-500/30 text-rose-900"
            : "bg-[#FDB773]/30 border border-[#CC6F00]/30 text-[#4D2A00]"
        }`}>
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-[#CC6F00]" />
          <div>
            <span className="font-bold">
              {ticket.escalationLevel === 2 ? "Central Administration SLA Escalation Alert" : "Warden Escalation Alert"}
            </span>
            <p className="mt-0.5 text-[#4D2A00]/80 leading-relaxed">
              {ticket.escalationLevel === 2
                ? "This ticket has exceeded the 48-hour resolution window and is under active Dean review."
                : "This ticket has remained unaddressed past the 24-hour first response window."}
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Details + Staff Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details & Audit Trail */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Ticket Card */}
          <div className="glass-panel rounded-3xl p-6 space-y-5 border border-[rgba(77,42,0,0.1)] shadow-glass">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#CC6F00] mb-1">
                Description & Reported Defect
              </h2>
              <p className="text-sm text-[#4D2A00] leading-relaxed whitespace-pre-line bg-white/50 p-4 rounded-2xl border border-[rgba(77,42,0,0.08)]">
                {ticket.description}
              </p>
            </div>

            {ticket.hasPhoto && (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#CC6F00] mb-2 flex items-center space-x-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-[#CC6F00]" />
                  <span>Attached Photo Evidence</span>
                </h2>
                <div className="bg-white/50 border border-[rgba(77,42,0,0.1)] p-2 rounded-2xl inline-block max-w-sm">
                  <img
                    src={`/api/tickets/${ticket.id}/photo`}
                    alt="Ticket defect"
                    className="rounded-xl object-contain max-h-64 w-auto"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-[rgba(77,42,0,0.08)]">
              <div>
                <span className="text-[#4D2A00]/60 block text-[11px]">Location</span>
                <span className="font-bold text-[#4D2A00] font-mono mt-0.5 block">
                  {ticket.hostelBlock} - {ticket.roomNumber}
                </span>
              </div>
              <div>
                <span className="text-[#4D2A00]/60 block text-[11px]">Status</span>
                <span className="font-bold text-[#CC6F00] mt-0.5 block">{ticket.status}</span>
              </div>
              <div>
                <span className="text-[#4D2A00]/60 block text-[11px]">Reported By</span>
                <span className="font-medium text-[#4D2A00] mt-0.5 block">
                  {ticket.student?.fullName || "Student"}
                </span>
              </div>
              <div>
                <span className="text-[#4D2A00]/60 block text-[11px]">Waiting Age</span>
                <span className="font-mono text-[#4D2A00]/80 mt-0.5 block">{ticket.ageHours} hours</span>
              </div>
            </div>
          </div>

          {/* Timeline & Audit Logs */}
          <div className="glass-panel rounded-3xl p-6 space-y-4 border border-[rgba(77,42,0,0.1)] shadow-glass">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#CC6F00] flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Immutable Status Audit Trail</span>
            </h2>

            <div className="space-y-3 pt-2">
              {ticket.auditLogs && ticket.auditLogs.map((log, index) => (
                <div key={log.id || index} className="flex items-start space-x-3 text-xs p-3.5 rounded-2xl bg-white/50 border border-[rgba(77,42,0,0.08)]">
                  <div className="w-6 h-6 rounded-full bg-[#FDB773]/40 text-[#4D2A00] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#4D2A00]">{log.action.replace(/_/g, " ")}</span>
                      <span className="text-[10px] font-mono text-[#4D2A00]/60">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[#4D2A00]/80">{log.note}</p>
                    <div className="text-[10px] font-mono text-[#4D2A00]/60">
                      Actor: {log.changedBy?.fullName} ({log.changedBy?.role})
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Staff Controls or Student Summary */}
        <div className="space-y-6">
          {isStaffOrAdmin ? (
            <div className="glass-panel rounded-3xl p-6 space-y-4 border border-[rgba(77,42,0,0.1)] shadow-glass no-print">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#CC6F00] flex items-center space-x-1.5">
                <Wrench className="w-3.5 h-3.5" />
                <span>Department Staff Controls</span>
              </h2>

              {updateSuccess && (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-xs text-emerald-950 font-medium">
                  {updateSuccess}
                </div>
              )}

              <form onSubmit={handleUpdateSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-[#4D2A00] mb-1">
                    Update Resolution Status
                  </label>
                  <select
                    value={statusInput}
                    onChange={(e) => setStatusInput(e.target.value)}
                    className="w-full px-3 py-2 bg-white/60 border border-[rgba(77,42,0,0.12)] rounded-xl text-[#4D2A00] focus:outline-none focus:border-[#CC6F00]"
                  >
                    <option value="SUBMITTED">SUBMITTED</option>
                    <option value="ASSIGNED">ASSIGNED</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#4D2A00] mb-1">
                    Assign Technician / Staff
                  </label>
                  <select
                    value={assignedStaffInput}
                    onChange={(e) => setAssignedStaffInput(e.target.value)}
                    className="w-full px-3 py-2 bg-white/60 border border-[rgba(77,42,0,0.12)] rounded-xl text-[#4D2A00] focus:outline-none focus:border-[#CC6F00]"
                  >
                    <option value="">Unassigned</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.department || "Operations"})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#4D2A00] mb-1">
                    Resolution Note / Audit Log *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={auditNoteInput}
                    onChange={(e) => setAuditNoteInput(e.target.value)}
                    placeholder="Document action taken, parts replaced, or completion notes..."
                    className="w-full px-3 py-2 bg-white/60 border border-[rgba(77,42,0,0.12)] rounded-xl text-[#4D2A00] placeholder-[#4D2A00]/40 focus:outline-none focus:border-[#CC6F00] resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={updateLoading}
                  className="btn-primary w-full py-2.5 px-4 text-xs font-bold disabled:opacity-50 shadow-sm"
                >
                  {updateLoading ? "Recording update..." : "Save Status Update"}
                </button>
              </form>
            </div>
          ) : (
            <div className="glass-panel rounded-3xl p-6 space-y-4 border border-[rgba(77,42,0,0.1)] shadow-glass">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#CC6F00]">
                Assigned Technician
              </h2>
              {ticket.assignedStaff ? (
                <div className="p-4 rounded-2xl bg-white/50 border border-[rgba(77,42,0,0.08)] space-y-1 text-xs">
                  <p className="font-bold text-[#4D2A00]">{ticket.assignedStaff.fullName}</p>
                  <p className="text-[#CC6F00] font-semibold text-[11px]">{ticket.assignedStaff.department} Department</p>
                  <p className="text-[#4D2A00]/60">{ticket.assignedStaff.email}</p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-white/50 border border-[rgba(77,42,0,0.08)] text-xs text-[#4D2A00]/60">
                  Awaiting technician assignment from department queue.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketDetailPage;
