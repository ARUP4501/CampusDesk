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
  ChevronRight,
  Repeat,
  Flame,
  Zap,
  Edit3,
  X
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
  location?: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
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
  slaDeadline?: string;
  isOverdue?: boolean;
  manualPriorityOverride?: boolean;
  priorityOverrideReason?: string;
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

  // Priority override modal states
  const [showOverrideModal, setShowOverrideModal] = useState<boolean>(false);
  const [overridePriority, setOverridePriority] = useState<string>("HIGH");
  const [overrideReason, setOverrideReason] = useState<string>("");
  const [overrideLoading, setOverrideLoading] = useState<boolean>(false);

  const isStaffOrAdmin = user && (user.role === "STAFF" || user.role === "WARDEN" || user.role === "ADMIN");
  const isWardenOrAdmin = user && (user.role === "WARDEN" || user.role === "ADMIN");

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<{ ticket: TicketDetail }>(`/api/tickets/${id}`);
      setTicket(data.ticket);
      setStatusInput(data.ticket.status);
      setAssignedStaffInput(data.ticket.assignedStaff?.id || "");
      setOverridePriority(data.ticket.priority || "MEDIUM");
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

  const handlePriorityOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket) return;
    setOverrideLoading(true);
    try {
      const res = await apiRequest<{ ticket: TicketDetail }>(`/api/tickets/${ticket.id}/priority`, {
        method: "PATCH",
        body: JSON.stringify({
          priority: overridePriority,
          reason: overrideReason
        })
      });
      setTicket(res.ticket);
      setShowOverrideModal(false);
      setOverrideReason("");
      setUpdateSuccess("Priority overridden and SLA recalculated!");
    } catch (err: any) {
      setError(err.message || "Priority override failed.");
    } finally {
      setOverrideLoading(false);
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
          className="btn-secondary px-4 py-2 text-xs font-semibold rounded-xl"
        >
          Back to Tickets Queue
        </button>
      </div>
    );
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return <span className="px-2.5 py-1 text-[10px] font-mono font-bold bg-rose-500/20 text-rose-900 border border-rose-500/30 rounded-md">CRITICAL (4h SLA)</span>;
      case "HIGH":
        return <span className="px-2.5 py-1 text-[10px] font-mono font-bold bg-amber-500/20 text-amber-900 border border-amber-500/30 rounded-md">HIGH (12h SLA)</span>;
      case "LOW":
        return <span className="px-2.5 py-1 text-[10px] font-mono font-bold bg-slate-200 text-slate-800 border border-slate-300 rounded-md">LOW (48h SLA)</span>;
      default:
        return <span className="px-2.5 py-1 text-[10px] font-mono font-bold bg-[#FDB773]/30 text-[#4D2A00] border border-[#CC6F00]/25 rounded-md">MEDIUM (24h SLA)</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
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
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="font-bold font-mono text-[#CC6F00] text-base">#{ticket.ticketNumber}</span>
              <span className="text-xs font-semibold uppercase text-[#4D2A00]/60">• {ticket.category}</span>
              {getPriorityBadge(ticket.priority)}
            </div>
            <h1 className="text-lg font-bold text-[#4D2A00] leading-tight mt-0.5">{ticket.title}</h1>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isWardenOrAdmin && (
            <button
              onClick={() => setShowOverrideModal(true)}
              className="btn-secondary inline-flex items-center space-x-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#CC6F00]" />
              <span>Override Priority</span>
            </button>
          )}

          <button
            onClick={handlePrintSlip}
            className="btn-secondary inline-flex items-center space-x-2 text-xs font-semibold px-4 py-2 shrink-0 rounded-xl"
          >
            <Printer className="w-4 h-4 text-[#CC6F00]" />
            <span>Print Work Order</span>
          </button>
        </div>
      </div>

      {/* Recurring Issue Banner */}
      {ticket.isRecurring && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-900 text-xs flex items-center space-x-3 animate-fadeIn">
          <Repeat className="w-5 h-5 text-amber-700 shrink-0" />
          <div>
            <strong className="font-bold">Recurring Campus Issue Detected!</strong>
            <p className="mt-0.5 text-amber-800 leading-relaxed">
              This location ({ticket.hostelBlock} Rm {ticket.roomNumber}) has logged {ticket.recurringCount} repeated {ticket.category} tickets in the past 30 days. Consider permanent asset replacement.
            </p>
          </div>
        </div>
      )}

      {/* SLA Escalation Warning Banner */}
      {(ticket.isOverdue || ticket.escalationLevel > 0) && (
        <div className={`p-4 rounded-2xl text-xs flex items-start space-x-3 ${
          ticket.escalationLevel === 2 || ticket.isOverdue
            ? "bg-rose-500/20 border border-rose-500/30 text-rose-900"
            : "bg-[#FDB773]/30 border border-[#CC6F00]/30 text-[#4D2A00]"
        }`}>
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-[#CC6F00]" />
          <div>
            <span className="font-bold">
              {ticket.isOverdue ? "SLA Overdue Target Breached" : ticket.escalationLevel === 2 ? "Central Administration SLA Escalation Alert" : "Warden Escalation Alert"}
            </span>
            <p className="mt-0.5 text-[#4D2A00]/80 leading-relaxed">
              {ticket.slaDeadline && `Target Deadline was: ${new Date(ticket.slaDeadline).toLocaleString()}. `}
              {ticket.escalationLevel === 2
                ? "This ticket has exceeded standard response window and is under active Dean review."
                : "This ticket has remained unaddressed past first response target."}
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

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-[rgba(77,42,0,0.08)] font-mono">
              <div>
                <span className="text-[#4D2A00]/60 block text-[11px]">Location</span>
                <span className="font-bold text-[#4D2A00] mt-0.5 block">
                  {ticket.hostelBlock ? `${ticket.hostelBlock} - ${ticket.roomNumber}` : (ticket.location || "Campus")}
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
                <span className="text-[#4D2A00]/60 block text-[11px]">SLA Target</span>
                <span className="text-[#4D2A00]/80 mt-0.5 block">
                  {ticket.slaDeadline ? new Date(ticket.slaDeadline).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : `${ticket.ageHours}h`}
                </span>
              </div>
            </div>
          </div>

          {/* Timeline & Audit Logs */}
          <div className="glass-panel rounded-3xl p-6 space-y-4 border border-[rgba(77,42,0,0.1)] shadow-glass">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#CC6F00] flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Immutable Status & Priority Audit Trail</span>
            </h2>

            <div className="space-y-3 pt-2">
              {ticket.auditLogs && ticket.auditLogs.map((log, index) => (
                <div key={log.id || index} className="flex items-start space-x-3 text-xs p-3.5 rounded-2xl bg-white/50 border border-[rgba(77,42,0,0.08)]">
                  <div className="w-6 h-6 rounded-full bg-[#FDB773]/40 text-[#4D2A00] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 font-mono">
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
                  className="btn-primary w-full py-2.5 px-4 text-xs font-bold disabled:opacity-50 shadow-sm rounded-xl"
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

      {/* Priority Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-fadeIn">
          <div className="glass-modal rounded-3xl max-w-md w-full p-6 space-y-4 shadow-elevated">
            <div className="flex items-center justify-between border-b border-campus-border pb-3">
              <h3 className="text-base font-bold text-campus-text">Override Complaint Priority & SLA</h3>
              <button onClick={() => setShowOverrideModal(false)} className="text-campus-muted hover:text-campus-text p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePriorityOverride} className="space-y-4 text-xs">
              <div>
                <label className="block text-campus-text mb-1 font-semibold">Priority Tier *</label>
                <select
                  value={overridePriority}
                  onChange={(e) => setOverridePriority(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-campus-border rounded-xl bg-white/70 text-campus-text focus:outline-none focus:border-campus-accent font-semibold"
                >
                  <option value="CRITICAL">CRITICAL — Immediate Assignment (4h Target SLA)</option>
                  <option value="HIGH">HIGH — High Urgency (12h Target SLA)</option>
                  <option value="MEDIUM">MEDIUM — Normal Queue (24h Target SLA)</option>
                  <option value="LOW">LOW — Cosmetic / Minor (48h Target SLA)</option>
                </select>
              </div>

              <div>
                <label className="block text-campus-text mb-1 font-semibold">Audit Justification Reason *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain why priority is being modified (e.g. Electrical hazard / exam period / dean instruction)..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-campus-border rounded-xl bg-white/70 text-campus-text focus:outline-none focus:border-campus-accent resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2.5 pt-3 border-t border-campus-border">
                <button
                  type="button"
                  onClick={() => setShowOverrideModal(false)}
                  className="btn-secondary px-4 py-2 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={overrideLoading}
                  className="btn-primary px-5 py-2 rounded-xl font-bold disabled:opacity-50"
                >
                  {overrideLoading ? "Saving..." : "Override & Recalculate SLA"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketDetailPage;
