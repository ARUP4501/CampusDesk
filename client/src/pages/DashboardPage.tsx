import React, { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  Wrench,
  QrCode,
  Calendar,
  Utensils,
  FileText,
  CreditCard,
  HelpCircle,
  Terminal,
  BarChart2,
  ArrowRight,
  Clock,
  CheckCircle2,
  Megaphone,
  Shield,
  AlertTriangle,
  ArrowRightLeft,
  X,
  Building,
  UserCheck,
  Check
} from "lucide-react";
import { apiRequest, UserProfile } from "../api/client.js";

export const DashboardPage: React.FC<{ user: UserProfile | null }> = ({ user }) => {
  const [studentStats, setStudentStats] = useState<any>(null);
  const [staffStats, setStaffStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);
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
            totalTickets: tickets.tickets.length,
            activePasses: passes.passes.filter((p) => p.status === "APPROVED" || p.status === "PENDING" || p.status === "EXITED").length,
            unreadNotices: notices.notices.filter((n) => !n.isRead).length
          });
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
      setTransferSuccess("Hostel transfer request submitted successfully. It will now be reviewed by your Warden.");
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
    <div className="space-y-6">
      {/* 1. Student Verification Status Banner */}
      {user.role === "STUDENT" && (
        <>
          {user.verificationStatus === "PENDING_WARDEN_VERIFICATION" && (
            <div className="bg-amber-50 border border-amber-300 rounded-[6px] p-4 flex items-start space-x-3 text-xs text-amber-900 shadow-xs">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm text-amber-900">Registration Status: Pending Warden Verification</h3>
                <p className="mt-0.5 text-amber-800">
                  Your admission application for <strong>{user.requestedHostel || "your requested hostel"}</strong> is currently under review by your assigned Hostel Warden. Room and bed assignments will become visible once verified.
                </p>
              </div>
            </div>
          )}

          {user.verificationStatus === "PENDING_ADMIN_APPROVAL" && (
            <div className="bg-blue-50 border border-blue-300 rounded-[6px] p-4 flex items-start space-x-3 text-xs text-blue-900 shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm text-blue-900">Registration Status: Verified by Warden & Awaiting Admin Approval</h3>
                <p className="mt-0.5 text-blue-800">
                  Your registration details have been verified by your Warden and forwarded for final Central Administration activation.
                </p>
              </div>
            </div>
          )}

          {(user.verificationStatus === "REJECTED_BY_WARDEN" || user.verificationStatus === "REJECTED_BY_ADMIN") && (
            <div className="bg-red-50 border border-red-300 rounded-[6px] p-4 flex items-start space-x-3 text-xs text-red-900 shadow-xs">
              <X className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm text-red-900">Registration Status: Application Rejected</h3>
                <p className="mt-0.5 text-red-800">
                  Reason: <strong>{user.rejectionReason || "Requirements not fulfilled."}</strong> Please contact the Hostel Administration office.
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* 2. Welcome Header */}
      <div className="bg-white border border-stone-300 rounded-[6px] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-[4px] border ${
                user.role === "STAFF"
                  ? "bg-blue-50 text-blue-900 border-blue-200"
                  : "bg-emerald-50 text-emerald-900 border-emerald-300"
              }`}>
                {user.role} Portal
              </span>
              {user.verificationStatus === "ACTIVE" && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded">
                  Verified Active
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-stone-900 mt-2">
              Welcome back, {user.fullName}
            </h1>
            <p className="text-xs text-stone-600 mt-1">
              {user.rollNumber ? `Roll: ${user.rollNumber} • ` : ""}
              {user.hostelBlock ? `Hostel: ${user.hostelBlock} ${user.roomNumber ? `(${user.roomNumber})` : ""} • ` : ""}
              {user.department ? `Department: ${user.department}` : `Branch: ${user.branch || "CSE"} Year ${user.year || 2}`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {user.role === "STUDENT" && (
              <>
                <button
                  onClick={() => setShowTransferModal(true)}
                  className="bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 px-3 py-2 text-xs font-semibold rounded-[4px] inline-flex items-center space-x-1.5 shadow-xs"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-stone-600" />
                  <span>Request Transfer</span>
                </button>
                <Link
                  to="/tickets/new"
                  className="bg-[#0f4c3a] text-white hover:bg-[#0b392b] px-4 py-2 text-xs font-semibold rounded-[4px] inline-flex items-center space-x-1.5 shadow-xs"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>New Complaint</span>
                </Link>
              </>
            )}
            {user.role === "STAFF" && (
              <Link
                to="/tickets"
                className="bg-[#0f4c3a] text-white hover:bg-[#0b392b] px-4 py-2 text-xs font-semibold rounded-[4px] inline-flex items-center space-x-2"
              >
                <Wrench className="w-4 h-4" />
                <span>Work Order Queue</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 3. Student Digital ID Card Widget & Quick Metrics */}
      {user.role === "STUDENT" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Digital ID Card Preview */}
          <div className="bg-gradient-to-br from-[#0f4c3a] to-[#1a6650] text-white rounded-[8px] p-5 shadow-sm border border-[#0f4c3a] lg:col-span-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/20 pb-3 mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded bg-white text-[#0f4c3a] font-black flex items-center justify-center text-xs">
                    CD
                  </div>
                  <div>
                    <h3 className="text-[11px] font-bold uppercase tracking-wider">Campus Student ID</h3>
                    <p className="text-[9px] text-white/70">CampusDesk Digital Identity</p>
                  </div>
                </div>
                <span className="px-2 py-0.2 text-[9px] font-bold bg-white/20 text-white rounded border border-white/30">
                  {user.verificationStatus === "ACTIVE" ? "VERIFIED" : "PENDING"}
                </span>
              </div>

              <div className="flex space-x-3 text-xs">
                <div className="w-14 h-16 bg-white/10 border border-white/20 rounded flex items-center justify-center font-bold text-sm">
                  {user.fullName.split(" ").map(n => n[0]).slice(0, 2).join("")}
                </div>
                <div className="space-y-0.5 flex-1">
                  <p className="font-bold text-sm leading-tight">{user.fullName}</p>
                  <p className="font-mono text-[11px] text-white/90">ID: {user.rollNumber || "2024CS101"}</p>
                  <p className="text-[11px] text-white/80">{user.course || "B.Tech"} - {user.department || user.branch || "CSE"}</p>
                  <p className="text-[11px] font-medium text-emerald-200">
                    {user.hostelBlock || user.requestedHostel || "Hostel-A"} • Rm {user.roomNumber || "A-204"} ({user.bedNumber || "Bed-1"})
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-[10px]">
              <div>
                <span className="text-white/70 block">Emergency Contact:</span>
                <span className="font-bold">{user.fatherPhone || user.phone}</span>
              </div>
              <div className="w-9 h-9 bg-white rounded p-0.5 flex items-center justify-center">
                <QrCode className="w-full h-full text-[#0f4c3a]" />
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              to="/tickets"
              className="bg-white border border-stone-300 p-4 rounded-[6px] shadow-2xs hover:border-[#0f4c3a] transition-colors flex flex-col justify-between"
            >
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wide">Open Complaints</span>
              <div className="text-2xl font-black text-amber-800 my-1">{studentStats?.openTickets || 0}</div>
              <span className="text-[11px] text-[#0f4c3a] font-semibold flex items-center space-x-1">
                <span>View tickets</span>
                <span>&rarr;</span>
              </span>
            </Link>

            <Link
              to="/gatepass"
              className="bg-white border border-stone-300 p-4 rounded-[6px] shadow-2xs hover:border-[#0f4c3a] transition-colors flex flex-col justify-between"
            >
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wide">Gate Passes</span>
              <div className="text-2xl font-black text-blue-900 my-1">{studentStats?.activePasses || 0}</div>
              <span className="text-[11px] text-[#0f4c3a] font-semibold flex items-center space-x-1">
                <span>View passes</span>
                <span>&rarr;</span>
              </span>
            </Link>

            <Link
              to="/notices"
              className="bg-white border border-stone-300 p-4 rounded-[6px] shadow-2xs hover:border-[#0f4c3a] transition-colors flex flex-col justify-between"
            >
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wide">Official Notices</span>
              <div className="text-2xl font-black text-emerald-800 my-1">{studentStats?.unreadNotices || 0}</div>
              <span className="text-[11px] text-[#0f4c3a] font-semibold flex items-center space-x-1">
                <span>Read circulars</span>
                <span>&rarr;</span>
              </span>
            </Link>
          </div>
        </div>
      )}

      {/* Staff Metrics */}
      {user.role === "STAFF" && staffStats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/tickets"
            className="bg-white border border-stone-300 p-4 rounded-[6px] shadow-2xs hover:border-stone-400 transition-colors"
          >
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wide">Assigned Work Orders</span>
            <div className="text-2xl font-black text-[#0f4c3a] mt-1">{staffStats.assignedCount}</div>
            <span className="text-[11px] text-stone-400 mt-1 block">Active maintenance assignments &rarr;</span>
          </Link>

          <Link
            to="/tickets"
            className="bg-white border border-stone-300 p-4 rounded-[6px] shadow-2xs hover:border-stone-400 transition-colors"
          >
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wide">Pending Resolution</span>
            <div className="text-2xl font-black text-amber-800 mt-1">{staffStats.pendingCount}</div>
            <span className="text-[11px] text-stone-400 mt-1 block">Requires status or photo update &rarr;</span>
          </Link>

          <Link
            to="/notices"
            className="bg-white border border-stone-300 p-4 rounded-[6px] shadow-2xs hover:border-stone-400 transition-colors"
          >
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wide">Published Official Notices</span>
            <div className="text-2xl font-black text-blue-900 mt-1">{staffStats.totalNotices}</div>
            <span className="text-[11px] text-stone-400 mt-1 block">View campus notices &rarr;</span>
          </Link>
        </div>
      )}

      {/* Role-Specific Navigation Hub Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {user.role === "STAFF" ? (
          <>
            <Link
              to="/tickets"
              className="bg-white border border-stone-300 p-4 rounded-[6px] shadow-2xs hover:border-[#0f4c3a] transition-colors group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 font-bold text-stone-900 text-sm">
                  <Wrench className="w-4 h-4 text-[#0f4c3a]" />
                  <span>Work Order Resolution</span>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-800" />
              </div>
              <p className="text-xs text-stone-600">
                Inspect assigned plumbing, electrical, carpentry tickets and upload completion proof photos.
              </p>
            </Link>

            <Link
              to="/notices"
              className="bg-white border border-stone-300 p-4 rounded-[6px] shadow-2xs hover:border-[#0f4c3a] transition-colors group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 font-bold text-stone-900 text-sm">
                  <Megaphone className="w-4 h-4 text-[#0f4c3a]" />
                  <span>Official Notices</span>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-800" />
              </div>
              <p className="text-xs text-stone-600">
                View verified campus announcements, maintenance notices, and emergency alerts.
              </p>
            </Link>

            <Link
              to="/gate-log"
              className="bg-white border border-stone-300 p-4 rounded-[6px] shadow-2xs hover:border-[#0f4c3a] transition-colors group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 font-bold text-stone-900 text-sm">
                  <Shield className="w-4 h-4 text-[#0f4c3a]" />
                  <span>Gate Security Scanner</span>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-800" />
              </div>
              <p className="text-xs text-stone-600">
                Verify student QR gate passes and log exits/entries in real time.
              </p>
            </Link>
          </>
        ) : (
          <>
            <Link
              to="/tickets"
              className="bg-white border border-stone-300 p-4 rounded-[6px] shadow-2xs hover:border-[#0f4c3a] transition-colors group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 font-bold text-stone-900 text-sm">
                  <Wrench className="w-4 h-4 text-[#0f4c3a]" />
                  <span>Complaints & Maintenance</span>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-800" />
              </div>
              <p className="text-xs text-stone-600">
                Submit hostel repair requests with photo attachments and track immutable status changes.
              </p>
            </Link>

            <Link
              to="/gatepass"
              className="bg-white border border-stone-300 p-4 rounded-[6px] shadow-2xs hover:border-[#0f4c3a] transition-colors group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 font-bold text-stone-900 text-sm">
                  <QrCode className="w-4 h-4 text-[#0f4c3a]" />
                  <span>Gate Pass & Leave</span>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-800" />
              </div>
              <p className="text-xs text-stone-600">
                Digital leave applications, warden approval workflow, and gate verification QR codes.
              </p>
            </Link>

            <Link
              to="/notices"
              className="bg-white border border-stone-300 p-4 rounded-[6px] shadow-2xs hover:border-[#0f4c3a] transition-colors group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 font-bold text-stone-900 text-sm">
                  <Megaphone className="w-4 h-4 text-[#0f4c3a]" />
                  <span>Official Notices</span>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-800" />
              </div>
              <p className="text-xs text-stone-600">
                Official announcements, holiday notices, and action deadline compliance tracking.
              </p>
            </Link>

            <Link
              to="/academics"
              className="bg-white border border-stone-300 p-4 rounded-[6px] shadow-2xs hover:border-[#0f4c3a] transition-colors group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 font-bold text-stone-900 text-sm">
                  <Calendar className="w-4 h-4 text-[#0f4c3a]" />
                  <span>Timetable & Classes</span>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-800" />
              </div>
              <p className="text-xs text-stone-600">
                Weekly subject schedule and real-time class cancellation alerts.
              </p>
            </Link>

            <Link
              to="/mess"
              className="bg-white border border-stone-300 p-4 rounded-[6px] shadow-2xs hover:border-[#0f4c3a] transition-colors group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 font-bold text-stone-900 text-sm">
                  <Utensils className="w-4 h-4 text-[#0f4c3a]" />
                  <span>Mess Menu & Rating</span>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-800" />
              </div>
              <p className="text-xs text-stone-600">
                Weekly dining menu for your hostel block and daily satisfaction rating submissions.
              </p>
            </Link>

            <Link
              to="/documents"
              className="bg-white border border-stone-300 p-4 rounded-[6px] shadow-2xs hover:border-[#0f4c3a] transition-colors group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 font-bold text-stone-900 text-sm">
                  <FileText className="w-4 h-4 text-[#0f4c3a]" />
                  <span>Certificates & Letters</span>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-800" />
              </div>
              <p className="text-xs text-stone-600">
                Instant digital Bonafide certificates with verification QR codes and download links.
              </p>
            </Link>
          </>
        )}
      </div>

      {/* Hostel Transfer Request Modal for Students */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[6px] border border-stone-300 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <h3 className="text-sm font-bold text-stone-900">Request Hostel / Room Transfer</h3>
              <button onClick={() => setShowTransferModal(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            {transferSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-[4px] text-xs font-medium text-emerald-900">
                {transferSuccess}
              </div>
            )}

            {transferError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-[4px] text-xs font-medium text-red-900">
                {transferError}
              </div>
            )}

            <form onSubmit={handleTransferSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-800 mb-1">Target Hostel Block *</label>
                <select
                  required
                  value={transferForm.toHostel}
                  onChange={(e) => setTransferForm({ ...transferForm, toHostel: e.target.value })}
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-[4px] bg-white focus:outline-none"
                >
                  <option value="Hostel-A">Hostel-A (Boys Senior)</option>
                  <option value="Hostel-B">Hostel-B (Boys Junior)</option>
                  <option value="Hostel-C">Hostel-C (Girls Campus)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-800 mb-1">Target Room Preference (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. B-102"
                  value={transferForm.toRoom}
                  onChange={(e) => setTransferForm({ ...transferForm, toRoom: e.target.value })}
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-[4px] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-800 mb-1">Reason for Transfer *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain why you are requesting a hostel/room relocation..."
                  value={transferForm.reason}
                  onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-[4px] focus:outline-none"
                />
              </div>

              <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-[4px] text-[11px] text-stone-600">
                <strong>Workflow Note:</strong> Transfer requests are reviewed by your current Hostel Warden and forwarded to Administration for reallocation.
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#0f4c3a] hover:bg-[#1a6650] text-white rounded font-bold"
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
