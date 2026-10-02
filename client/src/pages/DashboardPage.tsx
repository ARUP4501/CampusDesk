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
  Bell,
  Bus,
  Car,
  Users,
  Package,
  LifeBuoy,
  PhoneCall,
  Siren,
  ShieldAlert,
  Flame,
  Zap,
  Building,
  Radio,
  MapPin
} from "lucide-react";
import { apiRequest, UserProfile } from "../api/client.js";

export const DashboardPage: React.FC<{ user: UserProfile | null }> = ({ user }) => {
  const [studentStats, setStudentStats] = useState<any>(null);
  const [staffStats, setStaffStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [recentNotices, setRecentNotices] = useState<any[]>([]);
  const [recentTickets, setRecentTickets] = useState<any[]>([]);
  const [activeMaintenance, setActiveMaintenance] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [activeParcelsCount, setActiveParcelsCount] = useState<number>(0);

  // Modals
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);
  const [showIdModal, setShowIdModal] = useState<boolean>(false);
  const [showSosModal, setShowSosModal] = useState<boolean>(false);

  // SOS Emergency state
  const [sosCategory, setSosCategory] = useState<string>("MEDICAL");
  const [sosLocation, setSosLocation] = useState<string>("");
  const [sosDescription, setSosDescription] = useState<string>("");
  const [sosCountdown, setSosCountdown] = useState<number | null>(null);
  const [sosActiveEmergency, setSosActiveEmergency] = useState<any | null>(null);
  const [sosSending, setSosSending] = useState<boolean>(false);
  const [sosError, setSosError] = useState<string | null>(null);

  // Transfer Form
  const [transferForm, setTransferForm] = useState({
    toHostel: "Hostel-B",
    toRoom: "",
    reason: ""
  });
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);
  const [transferError, setTransferError] = useState<string | null>(null);

  const isHosteller = user?.livingType === "HOSTELLER" || !user?.livingType;

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        if (user?.role === "STUDENT") {
          const [tickets, passes, notices, maintenanceRes, eventsRes, parcelsRes] = await Promise.all([
            apiRequest<{ tickets: any[] }>("/api/tickets"),
            apiRequest<{ passes: any[] }>("/api/gatepass"),
            apiRequest<{ notices: any[] }>("/api/notices"),
            apiRequest<{ maintenance: any[] }>("/api/maintenance").catch(() => ({ maintenance: [] })),
            apiRequest<{ events: any[] }>("/api/clubs/events").catch(() => ({ events: [] })),
            apiRequest<{ parcels: any[] }>("/api/parcels").catch(() => ({ parcels: [] }))
          ]);

          setStudentStats({
            openTickets: tickets.tickets.filter((t) => t.status !== "CLOSED" && t.status !== "RESOLVED").length,
            activePasses: passes.passes.filter((p) => p.status === "APPROVED" || p.status === "PENDING" || p.status === "EXITED").length,
            unreadNotices: notices.notices.filter((n) => !n.isRead).length,
            latestPass: passes.passes[0] || null
          });
          setRecentNotices(notices.notices.slice(0, 3));
          setRecentTickets(tickets.tickets.slice(0, 3));
          setActiveMaintenance(maintenanceRes.maintenance?.slice(0, 2) || []);
          setUpcomingEvents(eventsRes.events?.slice(0, 2) || []);
          setActiveParcelsCount(parcelsRes.parcels?.filter((p: any) => p.status === "ARRIVED").length || 0);

          // Prepopulate SOS location
          if (isHosteller) {
            setSosLocation(`${user?.hostelBlock || "Hostel"} Room ${user?.roomNumber || "N/A"}`);
          } else {
            setSosLocation(user?.currentAddress || `Day Scholar Transit / Academic Area`);
          }

          // Check if there is an active SOS beacon for this student
          apiRequest<{ emergency: any }>("/api/emergencies/my-active")
            .then((res) => {
              if (res.emergency) {
                setSosActiveEmergency(res.emergency);
              }
            })
            .catch(() => {});
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
        } else {
          // ADMIN and WARDEN overview
          const [tickets, passes, notices] = await Promise.all([
            apiRequest<{ tickets: any[] }>("/api/tickets").catch(() => ({ tickets: [] })),
            apiRequest<{ passes: any[] }>("/api/gatepass").catch(() => ({ passes: [] })),
            apiRequest<{ notices: any[] }>("/api/notices").catch(() => ({ notices: [] }))
          ]);

          setStudentStats({
            openTickets: (tickets.tickets || []).filter((t: any) => t.status !== "CLOSED" && t.status !== "RESOLVED").length,
            activePasses: (passes.passes || []).filter((p: any) => p.status === "APPROVED" || p.status === "PENDING" || p.status === "EXITED").length,
            unreadNotices: (notices.notices || []).filter((n: any) => !n.isRead).length,
            latestPass: (passes.passes || [])[0] || null
          });
          setRecentNotices((notices.notices || []).slice(0, 3));
          setRecentTickets((tickets.tickets || []).slice(0, 3));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [user]);

  // Polling active SOS emergency status in real-time
  useEffect(() => {
    if (user?.role !== "STUDENT" || !sosActiveEmergency) return;
    if (!["ACTIVE", "NEW", "ACKNOWLEDGED", "RESPONDING"].includes(sosActiveEmergency.status)) return;

    const interval = setInterval(async () => {
      try {
        const res = await apiRequest<{ emergency: any }>("/api/emergencies/my-active");
        if (res.emergency) {
          setSosActiveEmergency(res.emergency);
        } else {
          // Alert has been resolved by responder
          setSosActiveEmergency((prev: any) => (prev ? { ...prev, status: "RESOLVED" } : null));
        }
      } catch (e) {
        console.error("SOS polling error:", e);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [user, sosActiveEmergency?.status]);

  // Countdown timer effect for SOS
  useEffect(() => {
    let interval: any = null;
    if (sosCountdown !== null && sosCountdown > 0) {
      interval = setInterval(() => {
        setSosCountdown((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (sosCountdown === 0) {
      dispatchSos();
      setSosCountdown(null);
    }
    return () => clearInterval(interval);
  }, [sosCountdown]);

  const startSosCountdown = (category: string) => {
    setSosCategory(category);
    setSosError(null);
    setSosCountdown(3); // 3-second safety grace period
  };

  const cancelSosCountdown = () => {
    setSosCountdown(null);
  };

  const dispatchSos = async () => {
    setSosSending(true);
    try {
      setSosError(null);
      const fallbackLoc = isHosteller
        ? `${user?.hostelBlock || "Hostel"} Rm ${user?.roomNumber || "N/A"}`
        : user?.currentAddress || (user?.busRoute ? `Route: ${user.busRoute} - Main Campus` : "Central Campus");

      const res = await apiRequest<{ emergency: any }>("/api/emergencies", {
        method: "POST",
        body: JSON.stringify({
          category: sosCategory,
          location: sosLocation || fallbackLoc,
          description: sosDescription || `Emergency trigger: ${sosCategory}`
        })
      });
      setSosActiveEmergency(res.emergency);
    } catch (err: any) {
      setSosError(err.message || "Failed to transmit emergency beacon. Please contact campus security directly at 1800-CAMPUS.");
    } finally {
      setSosSending(false);
    }
  };

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
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Admin / Warden Governance Banner */}
      {(user.role === "ADMIN" || user.role === "WARDEN") && (
        <div className="glass-card rounded-2xl p-4 border border-campus-border flex items-center justify-between flex-wrap gap-3 bg-white/70 shadow-sm animate-fadeIn">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-campus-accent/10 border border-campus-accent/30 text-campus-accent flex items-center justify-center font-bold">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-campus-text">
                {user.role === "ADMIN" ? "Central Admin Oversight Active" : `Hostel Warden Portal (${user.hostelBlock || "Assigned Block"})`}
              </p>
              <p className="text-[11px] text-campus-muted">
                Student directory, 2-step verification queue, hostel allocation, and system audit logs.
              </p>
            </div>
          </div>
          <Link
            to="/admin"
            className="btn-primary text-xs font-bold py-2 px-3.5 rounded-xl flex items-center space-x-1.5 shadow-sm"
          >
            <span>Open Governance Console</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

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

      {/* 2. Planned Maintenance Outage Alert Banner */}
      {activeMaintenance.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 space-y-2 animate-fadeIn">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-amber-700 animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase text-amber-800">
              Active Planned Maintenance
            </span>
          </div>
          <div className="space-y-1 text-xs text-campus-text">
            {activeMaintenance.map((m) => (
              <div key={m.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <div>
                  <strong className="font-semibold">{m.title}</strong> — {m.location} ({m.affectedAudience})
                </div>
                <span className="text-[11px] font-mono text-campus-secondary">
                  {new Date(m.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to {new Date(m.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Real-time SOS Active Emergency Beacon Banner */}
      {user.role === "STUDENT" && sosActiveEmergency && (
        <div
          className={`p-4 rounded-3xl border-2 transition-all duration-300 shadow-md ${
            sosActiveEmergency.status === "RESOLVED"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950"
              : "bg-rose-500/10 border-rose-500/50 text-rose-950 animate-pulse"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start space-x-3.5">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                  sosActiveEmergency.status === "RESOLVED"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-rose-600 text-white animate-bounce"
                }`}
              >
                <Siren className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-900">
                    {sosActiveEmergency.status === "RESOLVED"
                      ? "Emergency Beacon Resolved"
                      : "🚨 Emergency SOS Beacon Active"}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      sosActiveEmergency.status === "RESOLVED"
                        ? "bg-emerald-200 text-emerald-900"
                        : sosActiveEmergency.status === "ACKNOWLEDGED"
                        ? "bg-amber-200 text-amber-900"
                        : sosActiveEmergency.status === "RESPONDING"
                        ? "bg-blue-200 text-blue-900"
                        : "bg-rose-600 text-white"
                    }`}
                  >
                    {sosActiveEmergency.status === "NEW" ? "ACTIVE" : sosActiveEmergency.status}
                  </span>
                  <span className="text-[11px] font-mono text-campus-muted">
                    #{sosActiveEmergency.alertNumber || (sosActiveEmergency.id ? sosActiveEmergency.id.slice(0, 8) : "SOS")}
                  </span>
                </div>

                <p className="text-xs font-medium text-campus-text">
                  Category: <strong className="text-rose-800">{sosActiveEmergency.category}</strong> • Location:{" "}
                  <strong>{sosActiveEmergency.location}</strong>
                </p>

                {sosActiveEmergency.responderNotes && (
                  <div className="text-xs bg-white/80 p-2.5 rounded-xl border border-campus-border text-campus-text font-sans">
                    <span className="font-bold text-rose-700">Responder Note: </span>
                    {sosActiveEmergency.responderNotes}
                  </div>
                )}

                <p className="text-[11px] text-campus-secondary">
                  {isHosteller
                    ? "Targeted responders: Hostel Warden & Security Control Room"
                    : "Targeted responders: Campus Security & Central Administration"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <a
                href="tel:1800CAMPUS"
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center space-x-1.5 shadow-sm"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call Helpline</span>
              </a>
              {sosActiveEmergency.status === "RESOLVED" && (
                <button
                  onClick={() => setSosActiveEmergency(null)}
                  className="p-2 rounded-xl text-campus-muted hover:text-campus-text bg-white/60 hover:bg-white"
                  title="Dismiss banner"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Top Greeting & Context Header with Living Type Badge & SOS Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-campus-border">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-campus-text">
              Welcome back, {user.fullName.split(" ")[0]}
            </h1>
            {user.role === "STUDENT" && (
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                isHosteller
                  ? "bg-amber-100 text-amber-900 border-amber-300"
                  : "bg-blue-100 text-blue-900 border-blue-300"
              }`}>
                {isHosteller ? "Hosteller" : "Day Scholar"}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-campus-secondary mt-1">
            {user.role === "STUDENT" ? (
              <span>
                Roll: <strong className="text-campus-accent font-mono font-semibold">{user.rollNumber || "2024CS101"}</strong> • {isHosteller ? `${user.hostelBlock || "Hostel"} (Room ${user.roomNumber || "N/A"})` : `Transit: ${user.busRoute || "Route 1"}`} • {user.course || "B.Tech"} {user.branch || "CSE"}
              </span>
            ) : (
              <span>{user.role} Workspace • {user.department || "Campus Operations"}</span>
            )}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {user.role === "STUDENT" && (
            <>
              {/* Emergency SOS Button */}
              <button
                onClick={() => setShowSosModal(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center space-x-1.5 shadow-sm hover:shadow-md transition-all animate-pulse"
              >
                <Siren className="w-3.5 h-3.5" />
                <span>Emergency SOS</span>
              </button>

              <button
                onClick={() => setShowIdModal(true)}
                className="btn-secondary px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center space-x-1.5 shadow-sm group"
              >
                <QrCode className="w-3.5 h-3.5 text-campus-accent group-hover:scale-105 transition-transform" />
                <span>Digital ID</span>
              </button>

              {isHosteller && (
                <button
                  onClick={() => setShowTransferModal(true)}
                  className="btn-secondary px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center space-x-1.5 shadow-sm group"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-campus-accent group-hover:rotate-180 transition-transform duration-300" />
                  <span>Hostel Transfer</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* 4. Primary Metrics Hierarchy (Living-Type Context Aware) */}
      {user.role === "STUDENT" ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          <Link
            to="/tickets"
            className="p-5 rounded-2xl card-stat flex flex-col justify-between group hover:border-campus-accent/30 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-campus-muted">Complaints / Issues</span>
              <div className="p-2 rounded-xl bg-white/60 text-campus-accent border border-campus-border shadow-xs group-hover:scale-105 transition-transform">
                <Wrench className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold text-campus-accent font-mono block">
                {studentStats?.openTickets ?? 0}
              </span>
              <span className="text-[11px] text-campus-muted group-hover:text-campus-accent transition-colors flex items-center space-x-1 mt-1 font-medium">
                <span>{isHosteller ? "Hostel & room repairs" : "Campus & lab issues"}</span>
                <ChevronRight className="w-3.5 h-3.5 text-campus-accent group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </Link>

          {/* Context-aware second metric: Gate Pass for Hosteller, Transport for Day Scholar */}
          {isHosteller ? (
            <Link
              to="/gatepass"
              className="p-5 rounded-2xl card-stat flex flex-col justify-between group hover:border-campus-accent/30 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-campus-muted">Gate Passes</span>
                <div className="p-2 rounded-xl bg-white/60 text-campus-accent border border-campus-border shadow-xs group-hover:scale-105 transition-transform">
                  <DoorOpen className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-bold text-campus-text font-mono block">
                  {studentStats?.activePasses ?? 0}
                </span>
                <span className="text-[11px] text-campus-muted group-hover:text-campus-accent transition-colors flex items-center space-x-1 mt-1 font-medium">
                  <span>Digital QR gate pass</span>
                  <ChevronRight className="w-3.5 h-3.5 text-campus-accent group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </Link>
          ) : (
            <Link
              to="/transport"
              className="p-5 rounded-2xl card-stat flex flex-col justify-between group hover:border-campus-accent/30 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-campus-muted">Transit & Parking</span>
                <div className="p-2 rounded-xl bg-white/60 text-campus-accent border border-campus-border shadow-xs group-hover:scale-105 transition-transform">
                  <Bus className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-bold text-campus-text font-mono block">
                  {user.busRoute || "Route 1"}
                </span>
                <span className="text-[11px] text-campus-muted group-hover:text-campus-accent transition-colors flex items-center space-x-1 mt-1 font-medium">
                  <span>Live bus timings & parking</span>
                  <ChevronRight className="w-3.5 h-3.5 text-campus-accent group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </Link>
          )}

          <Link
            to="/clubs"
            className="p-5 rounded-2xl card-stat flex flex-col justify-between group hover:border-campus-accent/30 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-campus-muted">Clubs & Events</span>
              <div className="p-2 rounded-xl bg-white/60 text-campus-accent border border-campus-border shadow-xs group-hover:scale-105 transition-transform">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold text-campus-accent font-mono block">
                {upcomingEvents.length}
              </span>
              <span className="text-[11px] text-campus-muted group-hover:text-campus-accent transition-colors flex items-center space-x-1 mt-1 font-medium">
                <span>Join societies & events</span>
                <ChevronRight className="w-3.5 h-3.5 text-campus-accent group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </Link>

          <Link
            to="/parcels"
            className="p-5 rounded-2xl card-featured flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-campus-text">Courier Deliveries</span>
              <div className="p-2 rounded-xl bg-white/70 text-campus-accent border border-campus-accent/20 shadow-xs group-hover:scale-105 transition-transform">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-bold text-campus-text font-mono block">
                {activeParcelsCount > 0 ? `${activeParcelsCount} Ready` : "No Parcels"}
              </span>
              <span className="text-[11px] text-campus-secondary group-hover:text-campus-accent transition-colors flex items-center space-x-1 mt-1 font-semibold">
                <span>View pickup OTP</span>
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

      {/* 5. Context-Aware Quick Actions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono uppercase tracking-widest text-campus-accent font-bold">
            {isHosteller ? "Hostel & Campus Services" : "Day Scholar & Campus Services"}
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

          {isHosteller ? (
            <>
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
                <span>Hostel Mess Menu</span>
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/transport"
                className="p-4 rounded-2xl card-action flex items-center space-x-3 text-xs font-semibold text-campus-text group"
              >
                <div className="w-8 h-8 rounded-xl bg-white/60 flex items-center justify-center text-campus-accent shrink-0 border border-campus-border group-hover:scale-110 transition-transform">
                  <Bus className="w-4 h-4" />
                </div>
                <span>Bus Schedules</span>
              </Link>

              <Link
                to="/transport"
                className="p-4 rounded-2xl card-action flex items-center space-x-3 text-xs font-semibold text-campus-text group"
              >
                <div className="w-8 h-8 rounded-xl bg-white/60 flex items-center justify-center text-campus-accent shrink-0 border border-campus-border group-hover:scale-110 transition-transform">
                  <Car className="w-4 h-4" />
                </div>
                <span>Parking Status</span>
              </Link>
            </>
          )}

          <Link
            to="/help"
            className="p-4 rounded-2xl card-action flex items-center space-x-3 text-xs font-semibold text-campus-text group"
          >
            <div className="w-8 h-8 rounded-xl bg-white/60 flex items-center justify-center text-campus-accent shrink-0 border border-campus-border group-hover:scale-110 transition-transform">
              <LifeBuoy className="w-4 h-4" />
            </div>
            <span>Help Directory</span>
          </Link>
        </div>
      </div>

      {/* 6. Main Activity Grid: Recent Notices & Active Complaints */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Official Notices */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono uppercase tracking-widest text-campus-accent font-bold">
              Official Campus Circulars
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

        {/* Right Column: Recent Complaints/Tickets with Priority & SLA badge */}
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
                    <div className="flex items-center space-x-2 min-w-0 flex-wrap">
                      <span className="font-bold font-mono text-xs text-campus-accent shrink-0">
                        #{t.ticketNumber}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                        t.priority === "CRITICAL" ? "bg-rose-100 text-rose-800 border border-rose-300" :
                        t.priority === "HIGH" ? "bg-amber-100 text-amber-800 border border-amber-300" :
                        "bg-white/80 text-campus-secondary border border-campus-border"
                      }`}>
                        {t.priority || "MEDIUM"}
                      </span>
                      <h3 className="font-semibold text-xs sm:text-[13px] text-campus-text group-hover:text-campus-accent transition-colors truncate min-w-0">
                        {t.title}
                      </h3>
                    </div>
                    <p className="text-xs text-campus-muted leading-normal truncate">
                      {t.category} • {t.hostelBlock ? `${t.hostelBlock} (Rm ${t.roomNumber})` : (t.location || "Campus")}
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

      {/* EMERGENCY SOS MODAL */}
      {showSosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fadeIn">
          <div className="glass-modal rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border-2 border-rose-500/40">
            <div className="flex items-center justify-between border-b border-campus-border pb-3">
              <div className="flex items-center space-x-2 text-rose-600">
                <Siren className="w-5 h-5 animate-bounce" />
                <h3 className="text-base font-bold text-campus-text">Emergency SOS Response</h3>
              </div>
              <button
                onClick={() => {
                  setShowSosModal(false);
                  cancelSosCountdown();
                }}
                className="text-campus-muted hover:text-campus-text p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {sosError && (
              <div className="status-badge-error p-3 rounded-2xl text-xs flex items-center space-x-2 font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{sosError}</span>
              </div>
            )}

            {sosActiveEmergency && ["ACTIVE", "NEW", "ACKNOWLEDGED", "RESPONDING"].includes(sosActiveEmergency.status) ? (
              /* Success / Live Active Beacon State */
              <div className="space-y-4 text-center animate-fadeIn">
                <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 border border-rose-300 mx-auto flex items-center justify-center animate-pulse">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-campus-text">SOS Beacon Active & Dispatched</h4>
                  <p className="text-xs text-campus-secondary mt-1">
                    Emergency ID: <strong className="font-mono text-campus-accent">{sosActiveEmergency.alertNumber || sosActiveEmergency.id}</strong>
                  </p>
                  <p className="text-xs text-campus-muted mt-0.5">
                    {isHosteller
                      ? "Your assigned Hostel Warden and Campus Command have been dispatched."
                      : "Campus Security Command and Central Admin have received your alert."}
                  </p>
                </div>

                <div className="p-3 bg-white/80 rounded-2xl border border-campus-border text-xs text-left space-y-1.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-campus-muted">Status:</span>
                    <strong className="text-rose-600 font-bold">{sosActiveEmergency.status === "NEW" ? "ACTIVE" : sosActiveEmergency.status}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-campus-muted">Category:</span>
                    <strong>{sosActiveEmergency.category}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-campus-muted">Location:</span>
                    <strong>{sosActiveEmergency.location}</strong>
                  </div>
                  {sosActiveEmergency.responderNotes && (
                    <div className="pt-1.5 border-t border-campus-border font-sans text-campus-text">
                      <span className="font-bold text-campus-accent">Responder Note: </span>
                      {sosActiveEmergency.responderNotes}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-campus-border space-y-2">
                  <a
                    href="tel:1800CAMPUS"
                    className="w-full py-2.5 rounded-xl text-xs font-bold bg-rose-600 text-white flex items-center justify-center space-x-2 shadow-md hover:bg-rose-700"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Call Campus Security Dispatch (1800-CAMPUS)</span>
                  </a>
                  <button
                    onClick={() => setShowSosModal(false)}
                    className="w-full py-2 text-xs font-semibold text-campus-secondary hover:text-campus-text"
                  >
                    Keep Beacon Active & Close Dialog
                  </button>
                </div>
              </div>
            ) : sosCountdown !== null ? (
              /* 3-Second Confirmation Window */
              <div className="text-center space-y-4 py-4 animate-fadeIn">
                <div className="w-20 h-20 rounded-full bg-rose-600 text-white font-mono text-4xl font-extrabold mx-auto flex items-center justify-center animate-ping">
                  {sosCountdown}
                </div>
                <div>
                  <h4 className="font-bold text-lg text-campus-text">Confirming SOS Transmission...</h4>
                  <p className="text-xs text-campus-secondary mt-1">
                    Category: <strong>{sosCategory}</strong> • Location: <strong>{sosLocation}</strong>
                  </p>
                  <p className="text-[11px] text-rose-600 font-mono mt-1">
                    Press Cancel below if this was pressed accidentally.
                  </p>
                </div>
                <button
                  onClick={cancelSosCountdown}
                  className="w-full py-3 rounded-2xl text-xs font-bold bg-white text-rose-700 border-2 border-rose-300 hover:bg-rose-50 shadow-sm transition-all"
                >
                  Cancel SOS (False Alarm)
                </button>
              </div>
            ) : (
              /* Emergency Configuration & Confirmation */
              <div className="space-y-4">
                {/* Student Context Summary */}
                <div className="p-3 bg-rose-50/70 border border-rose-200/80 rounded-2xl text-xs space-y-1">
                  <div className="flex justify-between items-center text-campus-text font-medium">
                    <span>Student: <strong>{user.fullName}</strong></span>
                    <span className="font-mono text-[11px] text-campus-muted">{user.rollNumber}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-campus-secondary">
                    <span>
                      Type: <strong>{isHosteller ? "Hosteller" : "Day Scholar"}</strong>
                      {isHosteller
                        ? ` (${user.hostelBlock || "Block"} Rm ${user.roomNumber || "N/A"})`
                        : user.busRoute ? ` (Bus: ${user.busRoute})` : ""}
                    </span>
                    <span>Contact: <strong>{user.guardianPhone || user.phone}</strong></span>
                  </div>
                  <div className="text-[10px] text-rose-700 font-medium pt-0.5">
                    Target: {isHosteller ? "Assigned Warden + Security Command" : "Campus Security + Central Admin"}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-mono font-semibold text-campus-secondary">
                    Select Emergency Category:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSosCategory("MEDICAL")}
                      className={`p-2.5 rounded-2xl text-left space-y-0.5 border transition-all ${
                        sosCategory === "MEDICAL"
                          ? "bg-rose-100 border-rose-500 shadow-sm"
                          : "bg-rose-50/50 border-rose-200 hover:bg-rose-100/50"
                      }`}
                    >
                      <div className="flex items-center space-x-1.5 text-rose-700 font-bold text-xs">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Medical Issue</span>
                      </div>
                      <p className="text-[10px] text-campus-muted">Acute illness, injury, pain</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSosCategory("FIRE_SMOKE")}
                      className={`p-2.5 rounded-2xl text-left space-y-0.5 border transition-all ${
                        sosCategory === "FIRE_SMOKE"
                          ? "bg-orange-100 border-orange-500 shadow-sm"
                          : "bg-orange-50/50 border-orange-200 hover:bg-orange-100/50"
                      }`}
                    >
                      <div className="flex items-center space-x-1.5 text-orange-700 font-bold text-xs">
                        <Flame className="w-3.5 h-3.5" />
                        <span>Fire / Smoke</span>
                      </div>
                      <p className="text-[10px] text-campus-muted">Smoke detected, flame</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSosCategory("LIFT_STUCK")}
                      className={`p-2.5 rounded-2xl text-left space-y-0.5 border transition-all ${
                        sosCategory === "LIFT_STUCK"
                          ? "bg-amber-100 border-amber-500 shadow-sm"
                          : "bg-amber-50/50 border-amber-200 hover:bg-amber-100/50"
                      }`}
                    >
                      <div className="flex items-center space-x-1.5 text-amber-700 font-bold text-xs">
                        <Building className="w-3.5 h-3.5" />
                        <span>Lift Stuck</span>
                      </div>
                      <p className="text-[10px] text-campus-muted">Elevator malfunction</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSosCategory("SECURITY")}
                      className={`p-2.5 rounded-2xl text-left space-y-0.5 border transition-all ${
                        sosCategory === "SECURITY"
                          ? "bg-purple-100 border-purple-500 shadow-sm"
                          : "bg-purple-50/50 border-purple-200 hover:bg-purple-100/50"
                      }`}
                    >
                      <div className="flex items-center space-x-1.5 text-purple-700 font-bold text-xs">
                        <Radio className="w-3.5 h-3.5" />
                        <span>Security Threat</span>
                      </div>
                      <p className="text-[10px] text-campus-muted">Harassment, intrusion</p>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-campus-secondary mb-1">
                    Location / Landmark:
                  </label>
                  <div className="relative flex items-center">
                    <MapPin className="w-4 h-4 text-campus-muted absolute left-3.5 pointer-events-none" />
                    <input
                      type="text"
                      value={sosLocation}
                      onChange={(e) => setSosLocation(e.target.value)}
                      placeholder="Room number, floor, or landmark..."
                      className="w-full pl-10 pr-3 py-2 text-xs border border-campus-border rounded-xl bg-white/80 text-campus-text focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-campus-secondary mb-1">
                    Details (Optional):
                  </label>
                  <input
                    type="text"
                    value={sosDescription}
                    onChange={(e) => setSosDescription(e.target.value)}
                    placeholder="Brief description of the emergency..."
                    className="w-full px-3 py-2 text-xs border border-campus-border rounded-xl bg-white/80 text-campus-text focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div className="text-[10px] text-campus-muted font-mono bg-white/50 p-2 rounded-xl border border-campus-border">
                  ℹ️ Anti-spam policy: Dispatches are tracked with high priority. A 30s cooldown applies between transmissions.
                </div>

                <button
                  type="button"
                  onClick={() => startSosCountdown(sosCategory)}
                  disabled={sosSending}
                  className="w-full py-3 rounded-2xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transition-all animate-pulse"
                >
                  <Siren className="w-4 h-4" />
                  <span>{sosSending ? "Transmitting Beacon..." : "Confirm & Transmit SOS Beacon"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
                  {isHosteller ? `${user.hostelBlock || "Hostel"} • Room ${user.roomNumber || "N/A"}` : `Day Scholar • ${user.busRoute || "Transit"}`}
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
