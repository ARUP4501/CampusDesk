import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Wrench, Plus, AlertCircle, Clock, ChevronRight, Filter, Search } from "lucide-react";
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return <span className="px-2.5 py-1 text-[10px] font-mono font-bold bg-[#FDB773]/30 text-[#4D2A00] border border-[#CC6F00]/25 rounded-md">Submitted</span>;
      case "ASSIGNED":
        return <span className="px-2.5 py-1 text-[10px] font-mono font-bold bg-[#CC6F00]/15 text-[#CC6F00] border border-[#CC6F00]/30 rounded-md">Assigned</span>;
      case "IN_PROGRESS":
        return <span className="px-2.5 py-1 text-[10px] font-mono font-bold bg-[#FDB773]/40 text-[#4D2A00] border border-[#CC6F00]/40 rounded-md">In Progress</span>;
      case "RESOLVED":
        return <span className="px-2.5 py-1 text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-900 border border-emerald-500/30 rounded-md">Resolved</span>;
      case "CLOSED":
        return <span className="px-2.5 py-1 text-[10px] font-mono font-bold bg-white/60 text-[#4D2A00]/60 border border-[rgba(77,42,0,0.1)] rounded-md">Closed</span>;
      default:
        return <span className="px-2.5 py-1 text-[10px] font-mono font-bold bg-white/60 text-[#4D2A00] rounded-md border border-[rgba(77,42,0,0.1)]">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 glass-panel p-6 rounded-3xl border border-[rgba(77,42,0,0.1)] shadow-glass">
        <div>
          <div className="flex items-center space-x-2 text-[#CC6F00] text-[11px] font-bold uppercase mb-1">
            <Wrench className="w-3.5 h-3.5" />
            <span>Operations & Maintenance</span>
          </div>
          <h1 className="text-2xl font-bold text-[#4D2A00]">
            {t("tickets.title", "Complaints & Maintenance")}
          </h1>
          <p className="text-xs text-[#4D2A00]/70 mt-1">
            {user?.role === "STUDENT"
              ? "Track reported hostel repairs, plumbing, electrical and network work orders"
              : "Review, assign, and resolve campus maintenance tickets across department queues"}
          </p>
        </div>

        {user?.role === "STUDENT" && (
          <Link
            to="/tickets/new"
            className="btn-primary inline-flex items-center space-x-2 text-xs font-bold px-5 py-2.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{t("tickets.newTicket", "Report Complaint")}</span>
          </Link>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-[rgba(77,42,0,0.08)] flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 flex-grow sm:max-w-md">
          <div className="relative w-full flex items-center">
            <Search className="w-4 h-4 text-[#4D2A00]/40 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by ticket #, title, description, or room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-10 pr-3.5 py-2 bg-white/60 border border-[rgba(77,42,0,0.12)] text-[#4D2A00] placeholder-[#4D2A00]/40 rounded-xl focus:outline-none focus:border-[#CC6F00]"
            />
          </div>
          <button
            type="submit"
            className="btn-secondary text-xs font-semibold px-4 py-2"
          >
            Search
          </button>
        </form>

        <div className="flex items-center space-x-3 flex-wrap text-xs">
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-[#CC6F00]" />
            <span className="font-semibold text-[#4D2A00]/80">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-[rgba(77,42,0,0.12)] rounded-xl px-3 py-1.5 bg-white/60 text-[#4D2A00] focus:outline-none focus:border-[#CC6F00]"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="font-semibold text-[#4D2A00]/80">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-[rgba(77,42,0,0.12)] rounded-xl px-3 py-1.5 bg-white/60 text-[#4D2A00] focus:outline-none focus:border-[#CC6F00]"
            >
              <option value="ALL">All Categories</option>
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
        </div>
      </div>

      {/* Ticket Table */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-[rgba(77,42,0,0.1)] shadow-glass">
        {loading ? (
          <div className="p-14 text-center text-xs text-[#4D2A00]/70 flex flex-col items-center justify-center space-y-2">
            <div className="w-7 h-7 border-2 border-[#CC6F00] border-t-transparent rounded-full animate-spin"></div>
            <span className="font-medium text-[#4D2A00]/70">Loading maintenance queue...</span>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-14 text-center text-xs text-[#4D2A00]/60">
            {t("tickets.noTickets", "No tickets found matching the selected filter parameters.")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FDB773]/30 border-b border-[rgba(77,42,0,0.1)] text-[#4D2A00] font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 font-bold">Ticket ID</th>
                  <th className="py-3.5 px-4 font-bold">Issue Description</th>
                  <th className="py-3.5 px-4 font-bold">Category</th>
                  <th className="py-3.5 px-4 font-bold">Location</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 font-bold">Age</th>
                  <th className="py-3.5 px-4 font-bold">Escalation</th>
                  <th className="py-3.5 px-4 font-bold text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(77,42,0,0.06)]">
                {tickets.map((tItem) => (
                  <tr key={tItem.id} className="hover:bg-white/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#CC6F00] font-mono">
                      #{tItem.ticketNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#4D2A00]">{tItem.title}</div>
                      {tItem.student && user?.role !== "STUDENT" && (
                        <div className="text-[11px] text-[#4D2A00]/60 font-mono mt-0.5">
                          Student: {tItem.student.fullName} ({tItem.student.rollNumber})
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[#4D2A00]/80 font-medium">{tItem.category}</span>
                      {tItem.isCategoryCorrected && (
                        <span className="block text-[9px] font-mono font-bold text-[#CC6F00]">
                          [CORRECTED]
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[#4D2A00] font-mono">
                      {tItem.hostelBlock} - {tItem.roomNumber}
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(tItem.status)}</td>
                    <td className="py-3.5 px-4 font-mono text-[#4D2A00]/70">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-[#4D2A00]/40" />
                        <span>{tItem.ageHours}h</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {tItem.escalationLevel === 0 ? (
                        <span className="text-[#4D2A00]/60 text-[11px] font-medium">Normal SLA</span>
                      ) : tItem.escalationLevel === 1 ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-[#FDB773]/40 text-[#4D2A00] border border-[#CC6F00]/40 rounded flex items-center space-x-1 w-max">
                          <AlertCircle className="w-3 h-3 text-[#CC6F00]" />
                          <span>Warden Escalated</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-500/20 text-rose-900 border border-rose-500/30 rounded flex items-center space-x-1 w-max">
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                          <span>Admin SLA Breach</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/tickets/${tItem.id}`}
                        className="inline-flex items-center space-x-1 text-[#CC6F00] hover:text-[#4D2A00] font-bold transition-colors"
                      >
                        <span>View</span>
                        <ChevronRight className="w-3.5 h-3.5" />
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
