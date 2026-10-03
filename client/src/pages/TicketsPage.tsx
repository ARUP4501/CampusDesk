import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Wrench,
  Plus,
  AlertCircle,
  Clock,
  ChevronRight,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  User,
  Building,
  ArrowRight
} from "lucide-react";
import { apiRequest, UserProfile } from "../api/client.js";

interface TicketItem {
  id: string;
  ticketNumber: string;
  title: string;
  category: string;
  predictedCategory?: string;
  isCategoryCorrected: boolean;
  hostelBlock: string;
  roomNumber: string;
  priority: string;
  status: string;
  escalationLevel: number;
  createdAt: string;
  ageHours: number;
  hasPhoto: boolean;
  student?: { fullName: string; rollNumber: string };
  assignedStaff?: { fullName: string; department: string };
}

export const TicketsPage: React.FC<{ user: UserProfile | null }> = ({ user }) => {
  const { t } = useTranslation();
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (categoryFilter !== "ALL") params.append("category", categoryFilter);
      if (searchQuery) params.append("search", searchQuery);

      const data = await apiRequest<{ tickets: TicketItem[] }>(`/api/tickets?${params.toString()}`);
      setTickets(data.tickets || []);
    } catch (err) {
      console.error("Failed to load tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, categoryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTickets();
  };

  // Section 28: Operational metrics calculation
  const metrics = useMemo(() => {
    const openCount = tickets.filter((t) => t.status === "SUBMITTED" || t.status === "ASSIGNED").length;
    const inProgressCount = tickets.filter((t) => t.status === "IN_PROGRESS").length;
    const resolvedCount = tickets.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED").length;
    const criticalCount = tickets.filter((t) => t.priority === "CRITICAL" && t.status !== "RESOLVED" && t.status !== "CLOSED").length;
    return { openCount, inProgressCount, resolvedCount, criticalCount };
  }, [tickets]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#FF6D1F]/15 text-[#FF6D1F] border border-[#FF6D1F]/30 rounded">SUBMITTED</span>;
      case "ASSIGNED":
        return <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 rounded">ASSIGNED</span>;
      case "IN_PROGRESS":
        return <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 rounded">IN PROGRESS</span>;
      case "RESOLVED":
        return <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded">RESOLVED</span>;
      case "CLOSED":
        return <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)] rounded">CLOSED</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[var(--bg-elevated)] text-[var(--text-secondary)] rounded border border-[var(--border-subtle)]">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded">CRITICAL</span>;
      case "HIGH":
        return <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-[#FF6D1F]/20 text-[#FF6D1F] border border-[#FF6D1F]/30 rounded">HIGH</span>;
      case "MEDIUM":
        return <span className="px-1.5 py-0.2 text-[9px] font-mono font-medium text-[var(--text-secondary)] border border-[var(--border-subtle)] rounded">MED</span>;
      default:
        return <span className="px-1.5 py-0.2 text-[9px] font-mono text-[var(--text-muted)] border border-[var(--border-subtle)] rounded">LOW</span>;
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="campus-panel rounded-2xl p-6 sm:p-8 border border-[var(--border-subtle)]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="editorial-eyebrow">07 // WORK ORDERS & DISPATCH</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-1">
                SLA ENGINE ACTIVE
              </span>
            </div>
            <h1 className="editorial-title text-2xl sm:text-3xl text-[var(--text-primary)]">
              {t("tickets.title", "Campus Operational Maintenance Queue")}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-2xl leading-relaxed">
              {user?.role === "STUDENT"
                ? "Track reported hostel repairs, plumbing, electrical and network work orders with SLA deadlines."
                : "Operational triage queue: review, assign, and resolve campus maintenance tickets across department teams."}
            </p>
          </div>

          {user?.role === "STUDENT" && (
            <Link
              to="/tickets/new"
              className="btn-primary inline-flex items-center space-x-2 text-xs font-bold px-5 py-2.5 rounded-xl shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{t("tickets.newTicket", "Report Complaint")}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Section 28: Operational Queue Metric Blocks */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 campus-block rounded-xl border border-[var(--border-subtle)]">
          <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest block">OPEN QUEUE</span>
          <div className="text-3xl font-black text-[var(--text-primary)] font-mono mt-1">{metrics.openCount}</div>
          <span className="text-[10px] text-[var(--text-subtle)] font-mono">Submitted & Assigned</span>
        </div>

        <div className="p-4 campus-block rounded-xl border border-[var(--border-subtle)]">
          <span className="text-[10px] font-mono text-amber-600 dark:text-amber-300 uppercase tracking-widest block">IN PROGRESS</span>
          <div className="text-3xl font-black text-amber-600 dark:text-amber-300 font-mono mt-1">{metrics.inProgressCount}</div>
          <span className="text-[10px] text-[var(--text-subtle)] font-mono">Active Crew Work</span>
        </div>

        <div className="p-4 campus-block rounded-xl border border-[var(--border-subtle)]">
          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block">RESOLVED</span>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">{metrics.resolvedCount}</div>
          <span className="text-[10px] text-[var(--text-subtle)] font-mono">Closed & Verified</span>
        </div>

        <div className="p-4 campus-block rounded-xl border border-[var(--border-subtle)]">
          <span className="text-[10px] font-mono text-[#FF6D1F] uppercase tracking-widest block">CRITICAL SLA</span>
          <div className="text-3xl font-black text-[#FF6D1F] font-mono mt-1">{metrics.criticalCount}</div>
          <span className="text-[10px] text-[var(--text-subtle)] font-mono">Priority Attention</span>
        </div>
      </div>

      {/* Search & Filters Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 flex-grow sm:max-w-md">
          <div className="relative w-full flex items-center">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search ticket #, title, description, or room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3.5 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-xl focus:outline-none focus:border-[#FF6D1F]"
            />
          </div>
          <button
            type="submit"
            className="btn-secondary text-xs font-semibold px-4 py-2 rounded-xl"
          >
            Filter
          </button>
        </form>

        <div className="flex items-center space-x-2 flex-wrap text-xs font-mono">
          <div className="flex items-center space-x-1.5">
            <span className="text-[var(--text-muted)] uppercase text-[10px]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-[var(--border-subtle)] rounded-lg px-2.5 py-1 bg-[var(--bg-input)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-[#FF6D1F]"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-[var(--text-muted)] uppercase text-[10px]">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-[var(--border-subtle)] rounded-lg px-2.5 py-1 bg-[var(--bg-input)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-[#FF6D1F]"
            >
              <option value="ALL">All Categories</option>
              <option value="ELECTRICAL">Electrical</option>
              <option value="PLUMBING">Plumbing</option>
              <option value="CARPENTRY">Carpentry</option>
              <option value="WIFI">WiFi & Network</option>
              <option value="MESS">Mess / Food</option>
              <option value="HOUSEKEEPING">Housekeeping</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section 28: Clean Operational Queue Table (No giant cards) */}
      <div className="campus-panel rounded-2xl overflow-hidden border border-[var(--border-subtle)]">
        {loading ? (
          <div className="p-16 text-center text-xs text-[var(--text-muted)] flex flex-col items-center justify-center space-y-2 font-mono">
            <div className="w-7 h-7 border-2 border-[#FF6D1F] border-t-transparent rounded-full animate-spin"></div>
            <span>Syncing maintenance queue...</span>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-16 text-center text-xs text-[var(--text-muted)] font-mono space-y-2">
            <Wrench className="w-8 h-8 text-[var(--text-muted)]/40 mx-auto" />
            <p>No complaints or maintenance tickets matching this filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] text-[var(--text-secondary)] font-mono uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Ticket</th>
                  <th className="py-3 px-4">Complaint Description</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Assigned Crew</th>
                  <th className="py-3 px-4">SLA / Age</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] font-mono text-xs">
                {tickets.map((tkt) => (
                  <tr key={tkt.id} className="hover:bg-[var(--bg-hover)]/40 transition-colors">
                    {/* Ticket Code & Priority */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-[#FF6D1F]">#{tkt.ticketNumber}</span>
                        {getPriorityBadge(tkt.priority)}
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] uppercase block mt-0.5">
                        {tkt.category}
                      </span>
                    </td>

                    {/* Complaint */}
                    <td className="py-3.5 px-4 max-w-sm">
                      <Link
                        to={`/tickets/${tkt.id}`}
                        className="font-medium text-[var(--text-primary)] hover:text-[#FF6D1F] transition-colors font-sans block leading-tight"
                      >
                        {tkt.title}
                      </Link>
                      {tkt.student && (
                        <span className="text-[10px] text-[var(--text-muted)] font-mono block mt-0.5">
                          Reported by: {tkt.student.fullName} ({tkt.student.rollNumber})
                        </span>
                      )}
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-[var(--text-primary)] font-medium">{tkt.hostelBlock}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">Room {tkt.roomNumber}</div>
                    </td>

                    {/* Assigned */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {tkt.assignedStaff ? (
                        <div>
                          <span className="text-[var(--text-primary)] font-sans font-medium">{tkt.assignedStaff.fullName}</span>
                          <span className="text-[10px] text-[var(--text-muted)] block">{tkt.assignedStaff.department}</span>
                        </div>
                      ) : (
                        <span className="text-[var(--text-muted)] text-[11px] italic">Unassigned</span>
                      )}
                    </td>

                    {/* SLA / Age */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-[var(--text-secondary)]">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-[var(--text-muted)]" />
                        <span>{tkt.ageHours}h elapsed</span>
                      </div>
                      {tkt.escalationLevel > 0 && (
                        <span className="text-[9px] text-rose-600 dark:text-rose-400 font-bold block">
                          Level {tkt.escalationLevel} Escalated
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(tkt.status)}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Link
                        to={`/tickets/${tkt.id}`}
                        className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[#FF6D1F] hover:text-[#FF6D1F] inline-flex items-center space-x-1 transition-all"
                      >
                        <span>View</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketsPage;
