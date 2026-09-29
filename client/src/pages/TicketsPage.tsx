import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Wrench, Plus, AlertCircle, Clock, CheckCircle2, ChevronRight, Filter } from "lucide-react";
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
        return <span className="px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300 rounded-[4px]">Submitted</span>;
      case "ASSIGNED":
        return <span className="px-2 py-0.5 text-xs font-semibold bg-sky-100 text-sky-900 border border-sky-300 rounded-[4px]">Assigned</span>;
      case "IN_PROGRESS":
        return <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-900 border border-blue-300 rounded-[4px]">In Progress</span>;
      case "RESOLVED":
        return <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-[4px]">Resolved</span>;
      case "CLOSED":
        return <span className="px-2 py-0.5 text-xs font-semibold bg-stone-200 text-stone-800 border border-stone-300 rounded-[4px]">Closed</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold bg-stone-100 text-stone-800 rounded-[4px]">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-stone-300 p-4 rounded-[6px]">
        <div>
          <h1 className="text-xl font-bold text-stone-900">
            {t("tickets.title", "Complaint & Maintenance Ticketing")}
          </h1>
          <p className="text-xs text-stone-600 mt-0.5">
            {user?.role === "STUDENT"
              ? "Track your reported hostel repairs, plumbing, electrical and network issues"
              : "Review, assign, and resolve campus maintenance tickets across departments"}
          </p>
        </div>

        {user?.role === "STUDENT" && (
          <Link
            to="/tickets/new"
            className="inline-flex items-center space-x-2 bg-[#0f4c3a] text-white hover:bg-[#0b392b] text-xs font-semibold px-4 py-2 rounded-[4px]"
          >
            <Plus className="w-4 h-4" />
            <span>{t("tickets.newTicket", "New Complaint")}</span>
          </Link>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-stone-300 p-3 rounded-[4px] flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 flex-grow sm:max-w-md">
          <input
            type="text"
            placeholder="Search by ticket #, title, description, or room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs px-3 py-1.5 border border-stone-300 rounded-[4px] focus:outline-none"
          />
          <button
            type="submit"
            className="bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-800 text-xs font-medium px-3 py-1.5 rounded-[4px]"
          >
            Search
          </button>
        </form>

        <div className="flex items-center space-x-2 flex-wrap text-xs">
          <div className="flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5 text-stone-500" />
            <span className="font-semibold text-stone-700">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-stone-300 rounded-[4px] px-2 py-1 bg-white text-stone-800"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          <div className="flex items-center space-x-1">
            <span className="font-semibold text-stone-700">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-stone-300 rounded-[4px] px-2 py-1 bg-white text-stone-800"
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
      <div className="bg-white border border-stone-300 rounded-[6px] overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-xs text-stone-500">Loading tickets from database...</div>
        ) : tickets.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-500">
            {t("tickets.noTickets", "No tickets found matching the selected criteria.")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-100 border-b border-stone-300 text-stone-700 font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Ticket #</th>
                  <th className="py-2.5 px-3">Issue</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Waiting Time</th>
                  <th className="py-2.5 px-3">Escalation</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {tickets.map((tItem) => (
                  <tr key={tItem.id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-emerald-950 font-mono">
                      #{tItem.ticketNumber}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-stone-900">{tItem.title}</div>
                      {tItem.student && user?.role !== "STUDENT" && (
                        <div className="text-[11px] text-stone-500">
                          By: {tItem.student.fullName} ({tItem.student.rollNumber})
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-medium text-stone-800">{tItem.category}</span>
                      {tItem.isCategoryCorrected && (
                        <span className="block text-[10px] text-amber-700 font-semibold">
                          [Category Corrected]
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-stone-700 font-medium">
                      {tItem.hostelBlock} - {tItem.roomNumber}
                    </td>
                    <td className="py-2.5 px-3">{getStatusBadge(tItem.status)}</td>
                    <td className="py-2.5 px-3 font-medium text-stone-600">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        <span>{tItem.ageHours} hrs</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      {tItem.escalationLevel === 0 ? (
                        <span className="text-stone-500 text-[11px]">Normal Queue</span>
                      ) : tItem.escalationLevel === 1 ? (
                        <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 rounded-[4px] flex items-center space-x-1 w-max">
                          <AlertCircle className="w-3 h-3 text-amber-700" />
                          <span>Warden Escalated</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[11px] font-bold bg-red-100 text-red-900 border border-red-300 rounded-[4px] flex items-center space-x-1 w-max">
                          <AlertCircle className="w-3 h-3 text-red-700" />
                          <span>Admin SLA Breach</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        to={`/tickets/${tItem.id}`}
                        className="inline-flex items-center space-x-1 text-emerald-800 font-semibold hover:underline"
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
