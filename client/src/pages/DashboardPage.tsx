import React, { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  Wrench,
  DoorOpen,
  CalendarDays,
  Utensils,
  Megaphone,
  AlertTriangle,
  ArrowRightLeft,
  X,
  QrCode,
  Plus,
  ChevronRight,
  Clock,
  Sparkles,
  CheckCircle2,
  Bell
} from "lucide-react";
import { apiRequest, UserProfile } from "../api/client.js";

export const DashboardPage: React.FC<{ user: UserProfile | null }> = ({ user }) => {
  const [studentStats, setStudentStats] = useState<any>(null);
  const [staffStats, setStaffStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [recentNotices, setRecentNotices] = useState<any[]>([]);
  const [recentTickets, setRecentTickets] = useState<any[]>([]);
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);
  const [showIdModal, setShowIdModal] = useState<boolean>(false);
  const [transferForm, setTransferForm] = useState({
    toHostel: "Hostel-B",
    toRoom: "",
    reason: ""
  });
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);
  const [transferError, setTransferError] = useState<string | null>(null);

  // If Admin or Warden, redirect to the Oversight Dashboard
  if (user?.role === "ADMIN" || user?.role === "WARDEN") {
    return <Navigate to="/admin" replace />;
  }

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        if (user?.role === "STUDENT") {
          const [tickets, passes, notices] = await Promise.all([
            apiRequest<{ tickets: any[] }>("/api/tickets"),
            apiRequest<{ passes: any[] }>("/api/gatepass"),
            apiRequest<{ notices: any[] }>("/api/notices")
          ]);
          setStudentStats({
            openTickets: tickets.tickets.filter((t) => t.status !== "CLOSED" && t.status !== "RESOLVED").length,
            activePasses: passes.passes.filter((p) => p.status === "APPROVED" || p.status === "PENDING" || p.status === "EXITED").length,
            unreadNotices: notices.notices.filter((n) => !n.isRead).length,
            latestPass: passes.passes[0] || null
          });
          setRecentNotices(notices.notices.slice(0, 3));
          setRecentTickets(tickets.tickets.slice(0, 3));
        } else if (user?.role === "STAFF") {
          const [tickets, notices] = await Promise.all([
            apiRequest<{ tickets: any[] }>("/api/tickets"),
            apiRequest<{ notices: any[] }>("/api/notices")
          ]);
          const myAssigned = tickets.tickets.filter((t) => t.assignedStaff?.id === user.id || t.assignedStaffId === user.id);
          const activePending = myAssigned.filter((t) => t.status !== "RESOLVED" && t.status !== "CLOSED");
          setStaffStats({
            assignedCount: myAssigned.length,
            pendingCount: activePending.length,
            totalNotices: notices.notices.length
          });
          setRecentNotices(notices.notices.slice(0, 3));
          setRecentTickets(myAssigned.slice(0, 3));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [user]);

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError(null);
    setTransferSuccess(null);
    try {
      await apiRequest("/api/hostels/transfers", {
        method: "POST",
        body: JSON.stringify(transferForm)
      });
      setTransferSuccess("Transfer request submitted to your Warden.");
      setTimeout(() => {
        setShowTransferModal(false);
        setTransferSuccess(null);
      }, 2000);
    } catch (err: any) {
      setTransferError(err.message || "Failed to submit transfer request.");
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* 1. Verification Alert (When not ACTIVE) */}
      {user.role === "STUDENT" && user.verificationStatus !== "ACTIVE" && (
        <div className="status-badge-warning rounded-2xl p-4 flex items-start space-x-3 text-xs shadow-xs animate-fadeIn">
          <AlertTriangle className="w-5 h-5 text-campus-accent shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-campus-text">
              {user.verificationStatus === "PENDING_WARDEN_VERIFICATION" && "Pending Warden Verification"}
              {user.verificationStatus === "PENDING_ADMIN_APPROVAL" && "Warden Approved — Pending Admin Activation"}
              {(user.verificationStatus === "REJECTED_BY_WARDEN" || user.verificationStatus === "REJECTED_BY_ADMIN") && "Registration Application Rejected"}
            </div>
            <p className="text-campus-muted mt-0.5 leading-relaxed">
              {user.verificationStatus === "PENDING_WARDEN_VERIFICATION" && "Your hostel room allocation is currently being verified by your Warden."}
              {user.verificationStatus === "PENDING_ADMIN_APPROVAL" && "Warden verified. Awaiting central registry confirmation."}
              {user.rejectionReason && `Note: ${user.rejectionReason}`}
            </p>
          </div>
        </div>
      )}

      {/* 2. Top Greeting & Context Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-campus-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-campus-text">
            Welcome back, {user.fullName.split(" ")[0]}
          </h1>
          <p className="text-xs sm:text-sm text-campus-secondary mt-1">
            {user.role === "STUDENT" ? (
              <span>
                Roll: <strong className="text-campus-accent font-mono font-semibold">{user.rollNumber || "2024CS101"}</strong> • {user.hostelBlock || "Hostel"} {user.roomNumber ? `(Room ${user.roomNumber})` : ""} • {user.course || "B.Tech"} {user.branch || "CSE"}
              </span>
            ) : (
              <span>{user.role} Workspace • {user.department || "Campus Operations"}</span>
            )}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {user.role === "STUDENT" && (
            <>
              <button
                onClick={() => setShowIdModal(true)}
                className="btn-secondary px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center space-x-1.5 shadow-sm group"
              >
                <QrCode className="w-3.5 h-3.5 text-campus-accent group-hover:scale-105 transition-transform" />
                <span>Digital ID</span>
              </button>
              <button
                onClick={() => setShowTransferModal(true)}
                className="btn-secondary px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center space-x-1.5 shadow-sm group"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-campus-accent group-hover:rotate-180 transition-transform duration-300" />
                <span>Hostel Transfer</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 3. Primary Metrics / Status Bar (Visual Card Hierarchy) */}
      {user.role === "STUDENT" ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          <Link
            to="/tickets"
            className="p-5 rounded-2xl card-stat flex flex-col justify-between group hover:border-campus-accent/30 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-campus-muted">Open Complaints</span>
              <div className="p-2 rounded-xl bg-white/60 text-campus-accent border border-campus-border shadow-xs group-hover:scale-105 transition-transform">
                <Wrench className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold text-campus-accent font-mono block">
                {studentStats?.openTickets ?? 0}
              </span>
              <span className="text-[11px] text-campus-muted group-hover:text-campus-accent transition-colors flex items-center space-x-1 mt-1 font-medium">
                <span>View complaint tickets</span>
                <ChevronRight className="w-3.5 h-3.5 text-campus-accent group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </Link>

          <Link
            to="/gatepass"
            className="p-5 rounded-2xl card-stat flex flex-col justify-between group hover:border-campus-accent/30 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-campus-muted">Active Gate Passes</span>
              <div className="p-2 rounded-xl bg-white/60 text-campus-accent border border-campus-border shadow-xs group-hover:scale-105 transition-transform">
                <DoorOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold text-campus-text font-mono block">
                {studentStats?.activePasses ?? 0}
              </span>
              <span className="text-[11px] text-campus-muted group-hover:text-campus-accent transition-colors flex items-center space-x-1 mt-1 font-medium">
                <span>Manage leave passes</span>
                <ChevronRight className="w-3.5 h-3.5 text-campus-accent group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </Link>

          <Link
            to="/notices"
            className="p-5 rounded-2xl card-stat flex flex-col justify-between group hover:border-campus-accent/30 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-campus-muted">New Notices</span>
              <div className="p-2 rounded-xl bg-white/60 text-campus-accent border border-campus-border shadow-xs group-hover:scale-105 transition-transform">
                <Megaphone className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold text-campus-accent font-mono block">
                {studentStats?.unreadNotices ?? 0}
              </span>
              <span className="text-[11px] text-campus-muted group-hover:text-campus-accent transition-colors flex items-center space-x-1 mt-1 font-medium">
                <span>Read official circulars</span>
                <ChevronRight className="w-3.5 h-3.5 text-campus-accent group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </Link>

          <Link
            to="/academics"
            className="p-5 rounded-2xl card-featured flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-campus-text">Today's Schedule</span>
              <div className="p-2 rounded-xl bg-white/70 text-campus-accent border border-campus-accent/20 shadow-xs group-hover:scale-105 transition-transform">
                <CalendarDays className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-bold text-campus-text font-mono block">
                Active
              </span>
              <span className="text-[11px] text-campus-secondary group-hover:text-campus-accent transition-colors flex items-center space-x-1 mt-1 font-semibold">
                <span>View timetable</span>
                <ChevronRight className="w-3.5 h-3.5 text-campus-accent group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/tickets"
            className="p-5 rounded-2xl card-stat group hover:border-campus-accent/30 transition-all"
          >
            <span className="text-xs font-medium text-campus-muted block">Assigned Work Orders</span>
            <span className="text-3xl font-bold text-campus-accent font-mono mt-3 block">{staffStats?.assignedCount ?? 0}</span>
            <span className="text-xs text-campus-muted group-hover:text-campus-accent transition-colors mt-2 flex items-center space-x-1 font-medium">
              <span>Open tasks</span>
              <ChevronRight className="w-3 h-3 text-campus-accent group-hover:translate-x-0.5 transition-transform" />
            </span>
          </Link>

          <Link
            to="/tickets"
            className="p-5 rounded-2xl card-stat group hover:border-campus-accent/30 transition-all"
          >
            <span className="text-xs font-medium text-campus-muted block">Pending Resolution Proof</span>
            <span className="text-3xl font-bold text-campus-text font-mono mt-3 block">{staffStats?.pendingCount ?? 0}</span>
            <span className="text-xs text-campus-muted group-hover:text-campus-accent transition-colors mt-2 flex items-center space-x-1 font-medium">
              <span>Action required</span>
              <ChevronRight className="w-3 h-3 text-campus-accent group-hover:translate-x-0.5 transition-transform" />
            </span>
          </Link>

          <Link
            to="/notices"
            className="p-5 rounded-2xl card-stat group hover:border-campus-accent/30 transition-all"
          >
            <span className="text-xs font-medium text-campus-muted block">Institutional Circulars</span>
            <span className="text-3xl font-bold text-campus-accent font-mono mt-3 block">{staffStats?.totalNotices ?? 0}</span>
            <span className="text-xs text-campus-muted group-hover:text-campus-accent transition-colors mt-2 flex items-center space-x-1 font-medium">
              <span>View announcements</span>
              <ChevronRight className="w-3 h-3 text-campus-accent group-hover:translate-x-0.5 transition-transform" />
            </span>
          </Link>
        </div>
      )}

      {/* 4. Quick Actions Launchpad (Interactive Action Cards) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono uppercase tracking-widest text-campus-accent font-bold">
            Quick Actions
          </h2>
          <span className="text-[11px] text-campus-muted font-mono">1-Click Launchpad</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            to="/tickets/new"
            className="p-4 rounded-2xl btn-primary text-xs font-bold flex items-center space-x-3 group"
          >
            <div className="w-8 h-8 rounded-xl bg-white/40 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Plus className="w-4 h-4 text-campus-text" />
            </div>
            <span>Report Complaint</span>
          </Link>

          <Link
            to="/gatepass"
            className="p-4 rounded-2xl card-action flex items-center space-x-3 text-xs font-semibold text-campus-text group"
          >
            <div className="w-8 h-8 rounded-xl bg-white/60 flex items-center justify-center text-campus-accent shrink-0 border border-campus-border group-hover:scale-110 transition-transform">
              <DoorOpen className="w-4 h-4" />
            </div>
            <span>Apply Gate Pass</span>
          </Link>

          <Link
            to="/mess"
            className="p-4 rounded-2xl card-action flex items-center space-x-3 text-xs font-semibold text-campus-text group"
          >
            <div className="w-8 h-8 rounded-xl bg-white/60 flex items-center justify-center text-campus-accent shrink-0 border border-campus-border group-hover:scale-110 transition-transform">
              <Utensils className="w-4 h-4" />
            </div>
            <span>Today's Menu</span>
          </Link>

          <Link
            to="/academics"
            className="p-4 rounded-2xl card-action flex items-center space-x-3 text-xs font-semibold text-campus-text group"
          >
            <div className="w-8 h-8 rounded-xl bg-white/60 flex items-center justify-center text-campus-accent shrink-0 border border-campus-border group-hover:scale-110 transition-transform">
              <CalendarDays className="w-4 h-4" />
            </div>
            <span>View Timetable</span>
          </Link>
        </div>
      </div>

      {/* 5. Main Activity Grid: Recent Notices & Active Complaints */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Official Notices */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono uppercase tracking-widest text-campus-accent font-bold">
              Official Campus Notices
            </h2>
            <Link to="/notices" className="text-xs text-campus-accent hover:text-campus-text transition-colors font-semibold flex items-center space-x-1">
              <span>View all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentNotices.length === 0 ? (
            <div className="p-8 text-center text-xs text-campus-muted glass-card rounded-2xl border border-campus-border">
              No recent campus circulars posted.
            </div>
          ) : (
            <div className="space-y-3">
              {recentNotices.map((n) => (
                <Link
                  key={n.id}
                  to={`/notices/${n.id}`}
                  className="p-4 sm:p-4.5 rounded-2xl glass-card flex items-start justify-between gap-3.5 block group min-w-0"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1 min-w-0">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/70 text-campus-accent border border-campus-border shrink-0">
                        {n.category || "NOTICE"}
                      </span>
                      <h3 className="font-bold text-xs sm:text-[13px] text-campus-text group-hover:text-campus-accent transition-colors leading-snug break-words min-w-0">
                        {n.title}
                      </h3>
                    </div>
                    <p className="text-xs text-campus-secondary line-clamp-2 leading-[1.55] break-words">{n.content}</p>
                  </div>
                  <span className="text-[11px] text-campus-muted font-mono shrink-0 pt-0.5 whitespace-nowrap">
                    {new Date(n.publishedAt || n.createdAt).toLocaleDateString()}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Recent Complaints/Tickets */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono uppercase tracking-widest text-campus-accent font-bold">
              Recent Maintenance Requests
            </h2>
            <Link to="/tickets" className="text-xs text-campus-accent hover:text-campus-text transition-colors font-semibold flex items-center space-x-1">
              <span>View queue</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentTickets.length === 0 ? (
            <div className="p-8 text-center text-xs text-campus-muted glass-card rounded-2xl border border-campus-border">
              No recent complaint tickets logged.
            </div>
          ) : (
            <div className="space-y-3">
              {recentTickets.map((t) => (
                <Link
                  key={t.id}
                  to={`/tickets/${t.id}`}
                  className="p-4 sm:p-4.5 rounded-2xl glass-card flex items-center justify-between gap-3.5 block group min-w-0"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="font-bold font-mono text-xs text-campus-accent shrink-0">
                        #{t.ticketNumber}
                      </span>
                      <h3 className="font-semibold text-xs sm:text-[13px] text-campus-text group-hover:text-campus-accent transition-colors truncate min-w-0">
                        {t.title}
                      </h3>
                    </div>
                    <p className="text-xs text-campus-muted leading-normal truncate">
                      {t.category} • {t.hostelBlock} (Rm {t.roomNumber})
                    </p>
                  </div>

                  <span className="px-2.5 py-1 text-[11px] font-mono font-semibold rounded-full bg-white/70 border border-campus-border text-campus-secondary shrink-0">
                    {t.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Student Digital ID Modal */}
      {showIdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-fadeIn">
          <div className="glass-modal rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-elevated">
            <div className="flex items-center justify-between border-b border-campus-border pb-3">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-lg bg-campus-btnPrimary text-campus-text font-extrabold flex items-center justify-center text-xs shadow-sm">CD</span>
                <h3 className="text-sm font-bold text-campus-text">Student Digital ID</h3>
              </div>
              <button onClick={() => setShowIdModal(false)} className="text-campus-muted hover:text-campus-text p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-campus-btnPrimary text-campus-text border border-campus-accent/20 mx-auto flex items-center justify-center text-lg font-bold font-mono shadow-sm">
                {user.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
              </div>
              <div>
                <p className="font-bold text-base text-campus-text">{user.fullName}</p>
                <p className="text-xs text-campus-accent font-mono font-bold">Roll: {user.rollNumber || "2024CS101"}</p>
                <p className="text-xs text-campus-secondary mt-0.5">{user.course || "B.Tech"} • {user.branch || "CSE"}</p>
                <p className="text-xs text-campus-muted mt-1">
                  {user.hostelBlock || "Hostel"} • Room {user.roomNumber || "N/A"}
                </p>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl flex items-center justify-center shadow-inner border border-campus-border">
              <QrCode className="w-32 h-32 text-[#4D2A00]" />
            </div>

            <p className="text-[11px] text-center text-campus-muted font-mono">
              Emergency Contact: {user.fatherPhone || user.phone}
            </p>
          </div>
        </div>
      )}

      {/* Hostel Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-fadeIn">
          <div className="glass-modal rounded-3xl max-w-md w-full p-6 space-y-4 text-xs shadow-elevated">
            <div className="flex items-center justify-between border-b border-campus-border pb-3">
              <h3 className="text-base font-bold text-campus-text">Request Hostel Transfer</h3>
              <button onClick={() => setShowTransferModal(false)} className="text-campus-muted hover:text-campus-text p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {transferSuccess && (
              <div className="status-badge-success p-3 rounded-xl font-medium">
                {transferSuccess}
              </div>
            )}

            {transferError && (
              <div className="status-badge-error p-3 rounded-xl font-medium">
                {transferError}
              </div>
            )}

            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div>
                <label className="block text-campus-text mb-1.5 font-semibold">Target Hostel Block *</label>
                <select
                  required
                  value={transferForm.toHostel}
                  onChange={(e) => setTransferForm({ ...transferForm, toHostel: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-campus-border rounded-xl bg-white/70 text-campus-text focus:outline-none focus:border-campus-accent"
                >
                  <option value="Hostel-A">Hostel-A (Boys Senior)</option>
                  <option value="Hostel-B">Hostel-B (Boys Junior)</option>
                  <option value="Hostel-C">Hostel-C (Girls Campus)</option>
                </select>
              </div>

              <div>
                <label className="block text-campus-text mb-1.5 font-semibold">Reason for Transfer *</label>
                <textarea
                  required
                  rows={4}
                  value={transferForm.reason}
                  onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
                  placeholder="Explain why you are requesting a hostel transfer..."
                  className="w-full px-3.5 py-2.5 border border-campus-border rounded-xl bg-white/70 text-campus-text focus:outline-none focus:border-campus-accent resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2.5 pt-3 border-t border-campus-border">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="btn-secondary px-4 py-2 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-5 py-2 rounded-xl text-xs font-bold"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;

