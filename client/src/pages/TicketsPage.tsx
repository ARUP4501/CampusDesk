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
        return <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-[3px]">Submitted</span>;
      case "ASSIGNED":
        return <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-sky-500/10 text-sky-300 border border-sky-500/30 rounded-[3px]">Assigned</span>;
      case "IN_PROGRESS":
        return <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/30 rounded-[3px]">In Progress</span>;
      case "RESOLVED":
        return <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-[3px]">Resolved</span>;
      case "CLOSED":
        return <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-[#181D22] text-[#A7ADB5] border border-[#252B31] rounded-[3px]">Closed</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-[#181D22] text-[#F3F4F6] rounded-[3px] border border-[#252B31]">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#14181C] border border-[#252B31] p-5 rounded-[6px] shadow-subtle">
        <div>
          <div className="flex items-center space-x-2 text-[#D6A84F] text-[11px] font-mono uppercase mb-1">
            <Wrench className="w-3.5 h-3.5" />
            <span>Operations Queue</span>
          </div>
          <h1 className="text-xl font-bold text-[#F3F4F6]">
            {t("tickets.title", "Complaints & Maintenance Ticketing")}
          </h1>
          <p className="text-xs text-[#A7ADB5] mt-0.5">
            {user?.role === "STUDENT"
              ? "Track reported hostel repairs, plumbing, electrical and network work orders"
              : "Review, assign, and resolve campus maintenance tickets across department queues"}
          </p>
        </div>

        {user?.role === "STUDENT" && (
          <Link
            to="/tickets/new"
            className="inline-flex items-center space-x-2 bg-[#D6A84F] hover:bg-[#F0C86A] text-[#090B0D] text-xs font-bold px-4 py-2.5 rounded-[4px] shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{t("tickets.newTicket", "New Complaint")}</span>
          </Link>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#14181C] border border-[#252B31] p-3 rounded-[6px] flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 flex-grow sm:max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-[#6F7781] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ticket #, title, description, or room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-[#101316] border border-[#252B31] text-[#F3F4F6] rounded-[4px] focus:outline-none focus:border-[#D6A84F]"
            />
          </div>
          <button
            type="submit"
            className="bg-[#181D22] hover:bg-[#252B31] border border-[#252B31] text-[#F3F4F6] text-xs font-medium px-3.5 py-1.5 rounded-[4px] transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex items-center space-x-3 flex-wrap text-xs">
          <div className="flex items-center space-x-1.5">
            <Filter className="w-3.5 h-3.5 text-[#D6A84F]" />
            <span className="font-medium text-[#A7ADB5]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-[#252B31] rounded-[4px] px-2.5 py-1 bg-[#101316] text-[#F3F4F6] focus:outline-none focus:border-[#D6A84F]"
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
            <span className="font-medium text-[#A7ADB5]">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-[#252B31] rounded-[4px] px-2.5 py-1 bg-[#101316] text-[#F3F4F6] focus:outline-none focus:border-[#D6A84F]"
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
      <div className="bg-[#14181C] border border-[#252B31] rounded-[6px] overflow-hidden shadow-subtle">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#A7ADB5] flex flex-col items-center justify-center space-y-2">
            <div className="w-6 h-6 border-2 border-[#D6A84F] border-t-transparent rounded-full animate-spin"></div>
            <span className="font-mono">Querying PostgreSQL tickets table...</span>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#6F7781]">
            {t("tickets.noTickets", "No tickets found matching the selected filter parameters.")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#101316] border-b border-[#252B31] text-[#A7ADB5] font-mono uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Ticket ID</th>
                  <th className="py-3 px-4">Issue Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Waiting Age</th>
                  <th className="py-3 px-4">Escalation</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#252B31]">
                {tickets.map((tItem) => (
                  <tr key={tItem.id} className="hover:bg-[#181D22] transition-colors">
                    <td className="py-3 px-4 font-bold text-[#D6A84F] font-mono">
                      #{tItem.ticketNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-[#F3F4F6]">{tItem.title}</div>
                      {tItem.student && user?.role !== "STUDENT" && (
                        <div className="text-[11px] text-[#6F7781] font-mono mt-0.5">
                          Student: {tItem.student.fullName} ({tItem.student.rollNumber})
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[#A7ADB5] font-medium">{tItem.category}</span>
                      {tItem.isCategoryCorrected && (
                        <span className="block text-[9px] font-mono text-amber-400">
                          [CORRECTED]
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[#F3F4F6] font-mono">
                      {tItem.hostelBlock} - {tItem.roomNumber}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(tItem.status)}</td>
                    <td className="py-3 px-4 font-mono text-[#A7ADB5]">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-[#6F7781]" />
                        <span>{tItem.ageHours}h</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {tItem.escalationLevel === 0 ? (
                        <span className="text-[#6F7781] text-[11px] font-mono">Normal SLA</span>
                      ) : tItem.escalationLevel === 1 ? (
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded flex items-center space-x-1 w-max">
                          <AlertCircle className="w-3 h-3 text-amber-400" />
                          <span>Warden Escalated</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-red-500/10 text-red-300 border border-red-500/30 rounded flex items-center space-x-1 w-max">
                          <AlertCircle className="w-3 h-3 text-red-400" />
                          <span>Admin SLA Breach</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/tickets/${tItem.id}`}
                        className="inline-flex items-center space-x-1 text-[#D6A84F] hover:text-[#F0C86A] font-semibold transition-colors"
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
