import React, { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  Wrench,
  DoorOpen,
  CalendarDays,
  Utensils,
  Megaphone,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  ArrowRightLeft,
  X,
  QrCode,
  Clock,
  Plus,
  IndianRupee,
  Files
} from "lucide-react";
import { apiRequest, UserProfile } from "../api/client.js";

export const DashboardPage: React.FC<{ user: UserProfile | null }> = ({ user }) => {
  const [studentStats, setStudentStats] = useState<any>(null);
  const [staffStats, setStaffStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [recentNotices, setRecentNotices] = useState<any[]>([]);
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
          setRecentNotices(notices.notices.slice(0, 2));
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
          setRecentNotices(notices.notices.slice(0, 2));
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
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 1. Verification Alert (Only when pending) */}
      {user.role === "STUDENT" && user.verificationStatus !== "ACTIVE" && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded p-4 flex items-start space-x-3 text-xs text-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-campus-text">
              {user.verificationStatus === "PENDING_WARDEN_VERIFICATION" && "Pending Warden Verification"}
              {user.verificationStatus === "PENDING_ADMIN_APPROVAL" && "Warden Approved — Pending Admin Activation"}
              {(user.verificationStatus === "REJECTED_BY_WARDEN" || user.verificationStatus === "REJECTED_BY_ADMIN") && "Registration Application Rejected"}
            </div>
            <p className="text-campus-muted mt-0.5">
              {user.verificationStatus === "PENDING_WARDEN_VERIFICATION" && "Your hostel room allocation is currently being verified by your Warden."}
              {user.verificationStatus === "PENDING_ADMIN_APPROVAL" && "Warden verified. Awaiting central registry confirmation."}
              {user.rejectionReason && `Note: ${user.rejectionReason}`}
            </p>
          </div>
        </div>
      )}

      {/* 2. Small, Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div>
          <h1 className="text-xl font-bold text-campus-text">
            Welcome back, {user.fullName.split(" ")[0]}
          </h1>
          <p className="text-xs text-campus-muted mt-0.5">
            {user.role === "STUDENT" ? (
              <span>Roll: {user.rollNumber || "2024CS101"} • {user.hostelBlock || "Hostel"} {user.roomNumber ? `(Rm ${user.roomNumber})` : ""} • {user.branch || "CSE"}</span>
            ) : (
              <span>{user.role} Workspace • {user.department || "Operations"}</span>
            )}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {user.role === "STUDENT" && (
            <>
              <button
                onClick={() => setShowIdModal(true)}
                className="px-3 py-1.5 text-xs font-medium rounded border border-white/[0.08] bg-campus-surface hover:bg-white/5 text-campus-secondary hover:text-campus-text transition-colors flex items-center space-x-1.5"
              >
                <QrCode className="w-3.5 h-3.5 text-campus-gold" />
                <span>Digital ID</span>
              </button>
              <button
                onClick={() => setShowTransferModal(true)}
                className="px-3 py-1.5 text-xs font-medium rounded border border-white/[0.08] bg-campus-surface hover:bg-white/5 text-campus-secondary hover:text-campus-text transition-colors flex items-center space-x-1.5"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Hostel Transfer</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 3. Key Summary Stats (Simple 3–4 items) */}
      {user.role === "STUDENT" ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            to="/tickets"
            className="p-3.5 rounded bg-campus-card border border-white/[0.08] hover:border-campus-gold/40 transition-colors group"
          >
            <span className="text-[11px] text-campus-muted block">Open Complaints</span>
            <span className="text-2xl font-bold text-campus-gold mt-1 block">
              {studentStats?.openTickets ?? 0}
            </span>
            <span className="text-[10px] text-campus-secondary group-hover:text-campus-text mt-1 flex items-center space-x-1">
              <span>View queue</span>
              <ArrowRight className="w-3 h-3 text-campus-gold" />
            </span>
          </Link>

          <Link
            to="/gatepass"
            className="p-3.5 rounded bg-campus-card border border-white/[0.08] hover:border-campus-gold/40 transition-colors group"
          >
            <span className="text-[11px] text-campus-muted block">Active Passes</span>
            <span className="text-2xl font-bold text-campus-text mt-1 block">
              {studentStats?.activePasses ?? 0}
            </span>
            <span className="text-[10px] text-campus-secondary group-hover:text-campus-text mt-1 flex items-center space-x-1">
              <span>View passes</span>
              <ArrowRight className="w-3 h-3 text-campus-gold" />
            </span>
          </Link>

          <Link
            to="/notices"
            className="p-3.5 rounded bg-campus-card border border-white/[0.08] hover:border-campus-gold/40 transition-colors group"
          >
            <span className="text-[11px] text-campus-muted block">New Notices</span>
            <span className="text-2xl font-bold text-campus-text mt-1 block">
              {studentStats?.unreadNotices ?? 0}
            </span>
            <span className="text-[10px] text-campus-secondary group-hover:text-campus-text mt-1 flex items-center space-x-1">
              <span>Read notices</span>
              <ArrowRight className="w-3 h-3 text-campus-gold" />
            </span>
          </Link>

          <Link
            to="/academics"
            className="p-3.5 rounded bg-campus-card border border-white/[0.08] hover:border-campus-gold/40 transition-colors group"
          >
            <span className="text-[11px] text-campus-muted block">Classes Today</span>
            <span className="text-2xl font-bold text-campus-success mt-1 block">
              Active
            </span>
            <span className="text-[10px] text-campus-secondary group-hover:text-campus-text mt-1 flex items-center space-x-1">
              <span>Timetable</span>
              <ArrowRight className="w-3 h-3 text-campus-gold" />
            </span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            to="/tickets"
            className="p-3.5 rounded bg-campus-card border border-white/[0.08] hover:border-campus-gold/40 transition-colors"
          >
            <span className="text-[11px] text-campus-muted block">Assigned Work Orders</span>
            <span className="text-2xl font-bold text-campus-gold mt-1 block">{staffStats?.assignedCount ?? 0}</span>
            <span className="text-[10px] text-campus-secondary mt-1 block">Open maintenance tasks &rarr;</span>
          </Link>

          <Link
            to="/tickets"
            className="p-3.5 rounded bg-campus-card border border-white/[0.08] hover:border-campus-gold/40 transition-colors"
          >
            <span className="text-[11px] text-campus-muted block">Pending Resolution</span>
            <span className="text-2xl font-bold text-campus-warning mt-1 block">{staffStats?.pendingCount ?? 0}</span>
            <span className="text-[10px] text-campus-secondary mt-1 block">Requires completion proof &rarr;</span>
          </Link>

          <Link
            to="/notices"
            className="p-3.5 rounded bg-campus-card border border-white/[0.08] hover:border-campus-gold/40 transition-colors"
          >
            <span className="text-[11px] text-campus-muted block">Published Circulars</span>
            <span className="text-2xl font-bold text-campus-text mt-1 block">{staffStats?.totalNotices ?? 0}</span>
            <span className="text-[10px] text-campus-secondary mt-1 block">Official college notices &rarr;</span>
          </Link>
        </div>
      )}

      {/* 4. Quick Actions Launcher (4 clean, distinct actions) */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-campus-muted uppercase tracking-wider">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            to="/tickets/new"
            className="p-3 rounded bg-campus-surface border border-white/[0.08] hover:border-campus-gold/40 hover:bg-white/5 transition-colors flex items-center space-x-2.5"
          >
            <div className="w-7 h-7 rounded bg-campus-card border border-white/[0.08] flex items-center justify-center text-campus-gold shrink-0">
              <Plus className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium text-campus-text">New Complaint</span>
          </Link>

          <Link
            to="/gatepass"
            className="p-3 rounded bg-campus-surface border border-white/[0.08] hover:border-campus-gold/40 hover:bg-white/5 transition-colors flex items-center space-x-2.5"
          >
            <div className="w-7 h-7 rounded bg-campus-card border border-white/[0.08] flex items-center justify-center text-campus-gold shrink-0">
              <DoorOpen className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium text-campus-text">Apply Gate Pass</span>
          </Link>

          <Link
            to="/mess"
            className="p-3 rounded bg-campus-surface border border-white/[0.08] hover:border-campus-gold/40 hover:bg-white/5 transition-colors flex items-center space-x-2.5"
          >
            <div className="w-7 h-7 rounded bg-campus-card border border-white/[0.08] flex items-center justify-center text-campus-gold shrink-0">
              <Utensils className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium text-campus-text">Today's Mess Menu</span>
          </Link>

          <Link
            to="/notices"
            className="p-3 rounded bg-campus-surface border border-white/[0.08] hover:border-campus-gold/40 hover:bg-white/5 transition-colors flex items-center space-x-2.5"
          >
            <div className="w-7 h-7 rounded bg-campus-card border border-white/[0.08] flex items-center justify-center text-campus-gold shrink-0">
              <Megaphone className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium text-campus-text">View Notices</span>
          </Link>
        </div>
      </div>

      {/* 5. What's Happening (Recent Updates & Notices) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-campus-muted uppercase tracking-wider">
            What's Happening on Campus
          </h2>
          <Link to="/notices" className="text-xs text-campus-gold hover:underline">
            View all circulars &rarr;
          </Link>
        </div>

        {recentNotices.length === 0 ? (
          <div className="p-6 text-center text-xs text-campus-muted bg-campus-card border border-white/[0.08] rounded">
            No active campus alerts or circulars at this time.
          </div>
        ) : (
          <div className="space-y-2">
            {recentNotices.map((n) => (
              <Link
                key={n.id}
                to={`/notices/${n.id}`}
                className="p-3.5 rounded bg-campus-card border border-white/[0.08] hover:border-white/20 transition-colors flex items-start justify-between gap-3 block"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-campus-gold/10 text-campus-goldLight border border-campus-gold/20">
                      {n.category || "NOTICE"}
                    </span>
                    <h3 className="font-semibold text-xs text-campus-text hover:text-campus-gold transition-colors">
                      {n.title}
                    </h3>
                  </div>
                  <p className="text-xs text-campus-muted line-clamp-1">{n.content}</p>
                </div>
                <span className="text-[11px] text-campus-muted font-mono shrink-0">
                  {new Date(n.publishedAt || n.createdAt).toLocaleDateString()}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Digital ID Modal for Students */}
      {showIdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-campus-card border border-white/[0.1] rounded-lg max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 rounded bg-campus-gold text-campus-bg font-bold flex items-center justify-center text-[10px]">CD</span>
                <h3 className="text-xs font-semibold text-campus-text">Student Digital ID</h3>
              </div>
              <button onClick={() => setShowIdModal(false)} className="text-campus-muted hover:text-campus-text">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded bg-campus-elevated border border-white/[0.08] mx-auto flex items-center justify-center text-lg font-bold text-campus-gold font-mono">
                {user.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
              </div>
              <div>
                <p className="font-bold text-sm text-campus-text">{user.fullName}</p>
                <p className="text-xs text-campus-gold font-mono">Roll: {user.rollNumber || "2024CS101"}</p>
                <p className="text-xs text-campus-muted">{user.course || "B.Tech"} • {user.branch || "CSE"}</p>
                <p className="text-xs text-campus-secondary mt-1 font-medium">
                  {user.hostelBlock || "Hostel"} • Room {user.roomNumber || "N/A"}
                </p>
              </div>
            </div>

            <div className="p-3 bg-white rounded flex items-center justify-center">
              <QrCode className="w-28 h-28 text-black" />
            </div>

            <p className="text-[10px] text-center text-campus-muted font-mono">
              Emergency: {user.fatherPhone || user.phone}
            </p>
          </div>
        </div>
      )}

      {/* Hostel Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-campus-card border border-white/[0.1] rounded-lg max-w-md w-full p-5 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
              <h3 className="text-sm font-semibold text-campus-text">Request Hostel Transfer</h3>
              <button onClick={() => setShowTransferModal(false)} className="text-campus-muted hover:text-campus-text">
                <X className="w-4 h-4" />
              </button>
            </div>

            {transferSuccess && (
              <div className="p-2.5 bg-campus-success/10 border border-campus-success/30 rounded text-campus-success">
                {transferSuccess}
              </div>
            )}

            {transferError && (
              <div className="p-2.5 bg-campus-error/10 border border-campus-error/30 rounded text-campus-error">
                {transferError}
              </div>
            )}

            <form onSubmit={handleTransferSubmit} className="space-y-3">
              <div>
                <label className="block text-campus-secondary mb-1">Target Hostel Block *</label>
                <select
                  required
                  value={transferForm.toHostel}
                  onChange={(e) => setTransferForm({ ...transferForm, toHostel: e.target.value })}
                  className="w-full px-3 py-2 border border-white/[0.08] rounded bg-campus-bg text-campus-text focus:outline-none focus:border-campus-gold"
                >
                  <option value="Hostel-A">Hostel-A (Boys Senior)</option>
                  <option value="Hostel-B">Hostel-B (Boys Junior)</option>
                  <option value="Hostel-C">Hostel-C (Girls Campus)</option>
                </select>
              </div>

              <div>
                <label className="block text-campus-secondary mb-1">Reason for Transfer *</label>
                <textarea
                  required
                  rows={3}
                  value={transferForm.reason}
                  onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
                  placeholder="Explain why you are requesting a hostel transfer..."
                  className="w-full px-3 py-2 border border-white/[0.08] rounded bg-campus-bg text-campus-text focus:outline-none focus:border-campus-gold resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-3 py-1.5 border border-white/[0.08] rounded text-campus-secondary hover:text-campus-text"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-campus-gold hover:bg-campus-goldLight text-campus-bg font-semibold rounded"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
