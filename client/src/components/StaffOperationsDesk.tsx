import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Wrench,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Building,
  Phone,
  ArrowRight,
  RefreshCw,
  Radio,
  Megaphone,
  User,
  Check,
  X,
  ShieldAlert,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { apiRequest, UserProfile } from "../api/client.js";

interface TicketItem {
  id: string;
  ticketNumber: string;
  title: string;
  category: string;
  hostelBlock?: string;
  roomNumber?: string;
  priority: string;
  status: string;
  createdAt: string;
  ageHours: number;
  student?: {
    id: string;
    fullName: string;
    rollNumber: string;
    phone: string;
  };
  assignedStaff?: {
    id: string;
    fullName: string;
    department?: string;
  };
}

interface MaintenanceAlert {
  id: string;
  title: string;
  category: string;
  location: string;
  affectedAudience: string;
  status: string;
  startTime: string;
  endTime: string;
}

interface NoticeItem {
  id: string;
  title: string;
  content: string;
  category: string;
  publishedAt?: string;
  createdAt: string;
}

export const StaffOperationsDesk: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceAlert[]>([]);
  const [notices, setNotices] = useState<NoticeItem[]>([]);

  // Filtering
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Resolution modal state
  const [resolvingTicket, setResolvingTicket] = useState<TicketItem | null>(null);
  const [resolutionNote, setResolutionNote] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchStaffData = async () => {
    try {
      setRefreshing(true);
      const [ticketsRes, maintRes, noticesRes] = await Promise.all([
        apiRequest<{ tickets: TicketItem[] }>("/api/tickets").catch(() => ({ tickets: [] })),
        apiRequest<{ maintenance: MaintenanceAlert[] }>("/api/maintenance").catch(() => ({ maintenance: [] })),
        apiRequest<{ notices: NoticeItem[] }>("/api/notices").catch(() => ({ notices: [] }))
      ]);

      setTickets(ticketsRes.tickets || []);
      setMaintenance(maintRes.maintenance || []);
      setNotices(noticesRes.notices || []);
    } catch (err) {
      console.error("Failed to load staff operational data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, [user]);

  // Determine tickets relevant to this staff member (assigned or department-matching or general)
  const myAssignedTickets = tickets.filter((t) => {
    if (t.assignedStaff?.id === user.id) return true;
    if (user.department) {
      const dept = user.department.toLowerCase();
      if (dept.includes("plumb") && t.category === "PLUMBING") return true;
      if (dept.includes("electr") && t.category === "ELECTRICAL") return true;
      if (dept.includes("carpent") && t.category === "CARPENTRY") return true;
      if (dept.includes("civil") && (t.category === "MASONRY" || t.category === "PLUMBING")) return true;
    }
    return false;
  });

  // Display queue: if staff has direct/dept assignments, prioritize them; otherwise show all actionable campus tickets
  const activeQueue = myAssignedTickets.length > 0 ? myAssignedTickets : tickets;

  // Filtered tickets
  const filteredTickets = activeQueue.filter((t) => {
    if (statusFilter === "PENDING" && !["SUBMITTED", "ASSIGNED"].includes(t.status)) return false;
    if (statusFilter === "IN_PROGRESS" && t.status !== "IN_PROGRESS") return false;
    if (statusFilter === "RESOLVED" && !["RESOLVED", "CLOSED"].includes(t.status)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = t.ticketNumber?.toLowerCase().includes(q);
      const matchTitle = t.title?.toLowerCase().includes(q);
      const matchStudent = t.student?.fullName?.toLowerCase().includes(q) || t.student?.rollNumber?.toLowerCase().includes(q);
      const matchLoc = t.hostelBlock?.toLowerCase().includes(q) || t.roomNumber?.toLowerCase().includes(q);
      if (!matchNum && !matchTitle && !matchStudent && !matchLoc) return false;
    }
    return true;
  });

  // Metrics
  const totalAssigned = activeQueue.length;
  const pendingCount = activeQueue.filter((t) => ["SUBMITTED", "ASSIGNED"].includes(t.status)).length;
  const inProgressCount = activeQueue.filter((t) => t.status === "IN_PROGRESS").length;
  const resolvedCount = activeQueue.filter((t) => ["RESOLVED", "CLOSED"].includes(t.status)).length;

  // Handle Start Work (SUBMITTED/ASSIGNED -> IN_PROGRESS)
  const handleStartWork = async (ticket: TicketItem) => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await apiRequest(`/api/tickets/${ticket.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "IN_PROGRESS",
          note: `Work commenced on site by ${user.fullName} (${user.department || "Staff Desk"}).`
        })
      });
      setActionSuccess(`Ticket #${ticket.ticketNumber} marked IN PROGRESS.`);
      await fetchStaffData();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      setActionError(err.message || "Failed to update ticket status.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Mark Resolved
  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingTicket) return;
    if (!resolutionNote.trim() || resolutionNote.trim().length < 5) {
      setActionError("Please provide an audit note describing the resolution (min 5 characters).");
      return;
    }

    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await apiRequest(`/api/tickets/${resolvingTicket.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "RESOLVED",
          note: resolutionNote.trim()
        })
      });
      setActionSuccess(`Ticket #${resolvingTicket.ticketNumber} marked RESOLVED successfully.`);
      setResolvingTicket(null);
      setResolutionNote("");
      await fetchStaffData();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      setActionError(err.message || "Failed to resolve ticket.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 font-mono">
      {/* 1. Planned Maintenance Alert (if active) */}
      {maintenance.length > 0 && (
        <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-amber-500/30 text-xs text-[var(--text-primary)] flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center space-x-3">
            <Radio className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <div>
              <span className="font-mono uppercase text-[10px] text-amber-400 font-bold tracking-wider block">
                Active Utility Outage / Maintenance Window
              </span>
              <span className="text-xs text-[var(--text-primary)]">
                {maintenance[0].title} — {maintenance[0].location} ({maintenance[0].affectedAudience})
              </span>
            </div>
          </div>
          <span className="text-[11px] font-mono text-[var(--text-muted)] shrink-0">
            {new Date(maintenance[0].startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      )}

      {/* 2. Header / Staff Identity */}
      <section className="border-b border-[var(--border-subtle)] pb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <span className="editorial-eyebrow text-[#FF6D1F] block mb-2">
            01 // CAMPUS FACILITIES & OPERATIONAL WORKSPACE
          </span>
          <h1 className="editorial-title text-xl sm:text-2xl text-[var(--text-primary)]">
            WELCOME, {user.fullName.toUpperCase()}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-2 font-mono tracking-tight flex items-center space-x-2 flex-wrap">
            <span className="px-2 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[#FF6D1F] font-bold">
              OPERATIONAL STAFF
            </span>
            <span>·</span>
            <span>{user.department || "CAMPUS OPERATIONS & MAINTENANCE"}</span>
            <span>·</span>
            <span className="text-[var(--text-muted)]">ID: {user.employeeId || "EMP-STF-001"}</span>
            <span>·</span>
            <span className="text-emerald-400 font-bold">● ACTIVE DUTY</span>
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={fetchStaffData}
            disabled={refreshing}
            className="btn-secondary px-3.5 py-2 rounded-lg text-xs font-mono font-medium flex items-center space-x-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#FF6D1F] ${refreshing ? "animate-spin" : ""}`} />
            <span>REFRESH QUEUE</span>
          </button>
          <Link
            to="/tickets"
            className="btn-primary px-3.5 py-2 rounded-lg text-xs font-mono font-bold flex items-center space-x-1.5 shadow-sm"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>FULL TICKETS REGISTER</span>
          </Link>
        </div>
      </section>

      {/* Action Feedback Alerts */}
      {actionSuccess && (
        <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="p-3.5 rounded-lg bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs flex items-center space-x-2 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* 3. Operational KPI Ribbon (Section 13 & 28) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="campus-block p-4 sm:p-5">
          <span className="editorial-eyebrow text-[var(--text-muted)] block mb-1">
            01 // ASSIGNED TASKS
          </span>
          <div className="text-3xl font-black text-[var(--text-primary)]">
            {totalAssigned}
          </div>
          <span className="text-[11px] text-[var(--text-muted)] mt-1 block">
            Work orders in current queue
          </span>
        </div>

        <div className="campus-block p-4 sm:p-5">
          <span className="editorial-eyebrow text-amber-400 block mb-1">
            02 // PENDING ACTION
          </span>
          <div className="text-3xl font-black text-amber-400">
            {pendingCount}
          </div>
          <span className="text-[11px] text-[var(--text-muted)] mt-1 block">
            Awaiting onsite kickoff
          </span>
        </div>

        <div className="campus-block p-4 sm:p-5">
          <span className="editorial-eyebrow text-blue-400 block mb-1">
            03 // IN PROGRESS
          </span>
          <div className="text-3xl font-black text-blue-400">
            {inProgressCount}
          </div>
          <span className="text-[11px] text-[var(--text-muted)] mt-1 block">
            Currently undergoing servicing
          </span>
        </div>

        <div className="campus-block p-4 sm:p-5">
          <span className="editorial-eyebrow text-emerald-400 block mb-1">
            04 // RESOLVED
          </span>
          <div className="text-3xl font-black text-emerald-400">
            {resolvedCount}
          </div>
          <span className="text-[11px] text-[var(--text-muted)] mt-1 block">
            Completed & verified orders
          </span>
        </div>
      </section>

      {/* 4. Active Work Orders Queue (Primary Task Center) */}
      <section className="campus-block p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
          <div>
            <span className="editorial-eyebrow text-[#FF6D1F]">
              02 // ACTIVE WORK ORDER QUEUE
            </span>
            <h2 className="editorial-title text-xl text-[var(--text-primary)] mt-1">
              ASSIGNED SERVICE & REPAIR TASKS
            </h2>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-2 flex-wrap">
            {[
              { key: "ALL", label: `ALL (${activeQueue.length})` },
              { key: "PENDING", label: `PENDING (${pendingCount})` },
              { key: "IN_PROGRESS", label: `IN PROGRESS (${inProgressCount})` },
              { key: "RESOLVED", label: `RESOLVED (${resolvedCount})` }
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  statusFilter === f.key
                    ? "bg-[#FF6D1F] text-[#222222]"
                    : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:border-[var(--border-medium)]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ticket #, room number, hostel block, or title..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[var(--bg-input)] border border-[var(--bg-input-border)] text-xs text-[var(--text-primary)] placeholder-[var(--text-subtle)] focus:border-[#FF6D1F] outline-none"
          />
        </div>

        {/* Task Cards List */}
        {loading ? (
          <div className="py-16 text-center text-xs text-[var(--text-muted)]">
            Loading assigned maintenance tickets...
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="text-xs font-bold text-[var(--text-primary)]">
              No work orders match the selected filter.
            </p>
            <p className="text-[11px] text-[var(--text-muted)]">
              All assigned complaints are currently up to date.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {filteredTickets.map((t) => {
              const isPending = ["SUBMITTED", "ASSIGNED"].includes(t.status);
              const isInProgress = t.status === "IN_PROGRESS";
              const isResolved = ["RESOLVED", "CLOSED"].includes(t.status);

              return (
                <div
                  key={t.id}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center md:justify-between gap-4 group"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2.5 flex-wrap">
                      <span className="font-bold text-xs text-[#FF6D1F]">
                        #{t.ticketNumber}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)] font-bold">
                        {t.category}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded border font-bold ${
                          t.priority === "URGENT" || t.priority === "HIGH"
                            ? "bg-rose-950/40 text-rose-300 border-rose-500/40"
                            : "bg-[var(--bg-elevated)] text-[var(--text-muted)] border-[var(--border-subtle)]"
                        }`}
                      >
                        PRIORITY: {t.priority}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded border font-bold ${
                          isResolved
                            ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/40"
                            : isInProgress
                            ? "bg-blue-950/40 text-blue-300 border-blue-500/40"
                            : "bg-amber-950/40 text-amber-300 border-amber-500/40"
                        }`}
                      >
                        STATUS: {t.status}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[#FF6D1F] transition-colors">
                      {t.title}
                    </h4>

                    <div className="flex items-center space-x-4 text-xs text-[var(--text-muted)] flex-wrap">
                      <span className="flex items-center space-x-1 text-[var(--text-secondary)]">
                        <Building className="w-3.5 h-3.5 text-[#FF6D1F]" />
                        <span>
                          {t.hostelBlock ? `${t.hostelBlock} · Rm ${t.roomNumber || "N/A"}` : "Campus Facility"}
                        </span>
                      </span>

                      {t.student && (
                        <span className="flex items-center space-x-1">
                          <User className="w-3.5 h-3.5" />
                          <span>{t.student.fullName} ({t.student.rollNumber})</span>
                          {t.student.phone && (
                            <span className="text-[#FF6D1F]">· Ph: {t.student.phone}</span>
                          )}
                        </span>
                      )}

                      <span className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Logged {t.ageHours || 0}h ago</span>
                      </span>
                    </div>
                  </div>

                  {/* 1-Click Operational Controls */}
                  <div className="flex items-center space-x-2 shrink-0">
                    {isPending && (
                      <button
                        onClick={() => handleStartWork(t)}
                        disabled={actionLoading}
                        className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-sm disabled:opacity-50"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>START WORK</span>
                      </button>
                    )}

                    {isInProgress && (
                      <button
                        onClick={() => {
                          setResolvingTicket(t);
                          setResolutionNote("");
                          setActionError(null);
                        }}
                        disabled={actionLoading}
                        className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>RESOLVE ORDER</span>
                      </button>
                    )}

                    <Link
                      to={`/tickets/${t.id}`}
                      className="btn-secondary px-3 py-2 rounded-lg text-xs font-bold flex items-center space-x-1"
                    >
                      <span>DETAILS</span>
                      <ExternalLink className="w-3 h-3 text-[#FF6D1F]" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. CAMPUS NOTICES & EMERGENCY DIRECTORY SPLIT */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Official Staff Circulars (7 cols) */}
        <div className="lg:col-span-7 campus-block p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border-subtle)]">
              <span className="editorial-eyebrow text-[var(--text-muted)]">
                03 // CAMPUS NOTICES & CIRCULARS
              </span>
              <Link to="/notices" className="text-xs text-[#FF6D1F] hover:underline">
                ALL NOTICES →
              </Link>
            </div>

            {notices.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] py-6 text-center">
                No recent official circulars published.
              </p>
            ) : (
              <div className="divide-y divide-[var(--border-subtle)]">
                {notices.slice(0, 3).map((n) => (
                  <Link
                    key={n.id}
                    to={`/notices/${n.id}`}
                    className="py-3.5 block group first:pt-0 last:pb-0"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-[10px] uppercase tracking-wider text-[#FF6D1F]">
                        [{n.category || "GENERAL"}]
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {new Date(n.publishedAt || n.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[#FF6D1F] transition-colors mt-1">
                      {n.title}
                    </h4>
                    <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 mt-1 leading-normal">
                      {n.content}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
            <span>Administration Circulars Archive</span>
            <Link to="/notices" className="text-[#FF6D1F] hover:underline font-bold">
              VIEW ARCHIVE
            </Link>
          </div>
        </div>

        {/* Right Column: Campus Duty & Emergency Contacts (5 cols) */}
        <div className="lg:col-span-5 campus-block p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <span className="editorial-eyebrow text-[var(--text-muted)] block mb-2">
              04 // RAPID DUTY DIRECTORY
            </span>
            <h3 className="editorial-title text-xl text-[var(--text-primary)]">
              EMERGENCY DESK LINES
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Immediate escalation points during operational shifts.
            </p>

            <div className="mt-4 space-y-2.5">
              <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[var(--text-primary)] block">
                    Campus Security Main Gate
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    Perimeter Control & Gate Log
                  </span>
                </div>
                <a
                  href="tel:1800CAMPUS"
                  className="px-2.5 py-1 rounded bg-[#FF6D1F]/15 text-[#FF6D1F] border border-[#FF6D1F]/30 text-xs font-bold flex items-center space-x-1"
                >
                  <Phone className="w-3 h-3" />
                  <span>1800-CAMPUS</span>
                </a>
              </div>

              <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[var(--text-primary)] block">
                    Electrical Substation Room
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    Main LT Switchgear & DG Set
                  </span>
                </div>
                <span className="text-xs font-bold text-[var(--text-primary)]">
                  Ext. 204
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[var(--text-primary)] block">
                    Hostel-A Warden Desk
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    Dr. Ramesh Chandra Mohanty
                  </span>
                </div>
                <span className="text-xs font-bold text-[var(--text-primary)]">
                  9861001001
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[var(--text-primary)] block">
                    Campus Health Center / Ambulance
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    24/7 Medical Emergency Response
                  </span>
                </div>
                <span className="text-xs font-bold text-rose-400">
                  Ext. 108
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[var(--border-subtle)]">
            <Link
              to="/help"
              className="text-xs text-[#FF6D1F] hover:underline font-bold flex items-center space-x-1"
            >
              <span>VIEW COMPLETE CAMPUS DIRECTORY</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* RESOLUTION AUDIT MODAL */}
      {resolvingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="campus-panel max-w-md w-full p-6 space-y-4 border border-[var(--border-medium)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase">
                  COMPLETE WORK ORDER #{resolvingTicket.ticketNumber}
                </h3>
              </div>
              <button
                onClick={() => setResolvingTicket(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs space-y-1">
              <p className="font-bold text-[var(--text-primary)]">{resolvingTicket.title}</p>
              <p className="text-[11px] text-[var(--text-muted)]">
                Location: {resolvingTicket.hostelBlock ? `${resolvingTicket.hostelBlock} Rm ${resolvingTicket.roomNumber}` : "Campus"}
              </p>
            </div>

            {actionError && (
              <div className="p-2.5 rounded bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs">
                {actionError}
              </div>
            )}

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] text-[var(--text-muted)] uppercase mb-1.5 font-bold">
                  Audit Resolution Note * (min 5 chars)
                </label>
                <textarea
                  required
                  rows={3}
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="Describe repair performed (e.g. Replaced faulty washer, tightened connection, tested flow)..."
                  className="w-full px-3 py-2 text-xs rounded-lg bg-[var(--bg-input)] border border-[var(--bg-input-border)] text-[var(--text-primary)] focus:border-[#FF6D1F] outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setResolvingTicket(null)}
                  className="btn-secondary px-4 py-2 text-xs rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn-primary px-4 py-2 text-xs rounded-lg font-bold flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{actionLoading ? "SUBMITTING..." : "CONFIRM RESOLUTION"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffOperationsDesk;
