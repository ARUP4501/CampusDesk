import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
  CheckCircle2,
  Bus,
  Package,
  PhoneCall,
  Siren,
  ShieldAlert,
  Flame,
  Building,
  Radio,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Compass,
  LifeBuoy,
  Phone
} from "lucide-react";
import { apiRequest, UserProfile } from "../api/client.js";
import { StaffOperationsDesk } from "../components/StaffOperationsDesk.js";

export const DashboardPage: React.FC<{ user: UserProfile | null }> = ({ user }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [studentStats, setStudentStats] = useState<any>(null);
  const [staffStats, setStaffStats] = useState<any>(null);
  const [recentNotices, setRecentNotices] = useState<any[]>([]);
  const [recentTickets, setRecentTickets] = useState<any[]>([]);
  const [activeMaintenance, setActiveMaintenance] = useState<any[]>([]);
  const [activeParcelsCount, setActiveParcelsCount] = useState<number>(0);

  // Academic & Schedule data
  const [academicAttendance, setAcademicAttendance] = useState<any>(null);
  const [todayClasses, setTodayClasses] = useState<any[]>([]);

  // Hostel Evening Return & Directory
  const [hostelDossier, setHostelDossier] = useState<any>(null);

  // Mess Menu
  const [todayMess, setTodayMess] = useState<any>(null);

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

  // Determine current day of week (1=Mon, 2=Tue ... 7=Sun)
  const currentDayNumber = new Date().getDay() === 0 ? 7 : new Date().getDay();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        if (user?.role === "STUDENT") {
          const [
            tickets,
            passes,
            notices,
            maintenanceRes,
            parcelsRes,
            attRes,
            todaySchedRes,
            hostelRes,
            messRes
          ] = await Promise.all([
            apiRequest<{ tickets: any[] }>("/api/tickets").catch(() => ({ tickets: [] })),
            apiRequest<{ passes: any[] }>("/api/gatepass").catch(() => ({ passes: [] })),
            apiRequest<{ notices: any[] }>("/api/notices").catch(() => ({ notices: [] })),
            apiRequest<{ maintenance: any[] }>("/api/maintenance").catch(() => ({ maintenance: [] })),
            apiRequest<{ parcels: any[] }>("/api/parcels").catch(() => ({ parcels: [] })),
            apiRequest<any>("/api/academic/attendance/student").catch(() => null),
            apiRequest<{ todayClasses: any[] }>("/api/academic/timetable/today").catch(() => ({ todayClasses: [] })),
            apiRequest<any>("/api/hostels/evening-return/my-status").catch(() => null),
            apiRequest<{ menu: any[] }>("/api/mess/menu").catch(() => ({ menu: [] }))
          ]);

          setStudentStats({
            openTickets: (tickets.tickets || []).filter((t: any) => t.status !== "CLOSED" && t.status !== "RESOLVED").length,
            activePasses: (passes.passes || []).filter((p: any) => p.status === "APPROVED" || p.status === "PENDING" || p.status === "EXITED").length,
            unreadNotices: (notices.notices || []).filter((n: any) => !n.isRead).length,
            latestPass: (passes.passes || [])[0] || null
          });

          setRecentNotices((notices.notices || []).slice(0, 3));
          setRecentTickets((tickets.tickets || []).slice(0, 3));
          setActiveMaintenance(maintenanceRes.maintenance?.slice(0, 2) || []);
          setActiveParcelsCount((parcelsRes.parcels || []).filter((p: any) => p.status === "ARRIVED").length);

          setAcademicAttendance(attRes);
          setTodayClasses(todaySchedRes.todayClasses || []);
          setHostelDossier(hostelRes);

          // Find today's mess menu
          if (messRes.menu && messRes.menu.length > 0) {
            const match = messRes.menu.find((m: any) => m.dayOfWeek === currentDayNumber) || messRes.menu[0];
            setTodayMess(match);
          }

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
            apiRequest<{ tickets: any[] }>("/api/tickets").catch(() => ({ tickets: [] })),
            apiRequest<{ notices: any[] }>("/api/notices").catch(() => ({ notices: [] }))
          ]);
          const myAssigned = (tickets.tickets || []).filter((t: any) => t.assignedStaff?.id === user.id || t.assignedStaffId === user.id);
          const activePending = myAssigned.filter((t: any) => t.status !== "RESOLVED" && t.status !== "CLOSED");
          setStaffStats({
            assignedCount: myAssigned.length,
            pendingCount: activePending.length,
            totalNotices: (notices.notices || []).length
          });
          setRecentNotices((notices.notices || []).slice(0, 4));
          setRecentTickets(myAssigned.slice(0, 4));
        }
      } catch (err) {
        console.error("Dashboard data load error:", err);
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
    setSosCountdown(3);
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

  if (user.role === "STAFF") {
    return <StaffOperationsDesk user={user} />;
  }

  // Resolve dynamic greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "GOOD MORNING";
    if (hour < 17) return "GOOD AFTERNOON";
    return "GOOD EVENING";
  };

  // Determine return curfew semantic state
  const getCurfewStatus = () => {
    if (!hostelDossier) {
      return {
        label: "NOT CHECKED",
        subtext: "Roll-call begins 07:30 PM",
        pill: "bg-[var(--bg-elevated)] text-[var(--text-muted)] border-[var(--border-subtle)]"
      };
    }
    if (hostelDossier.hasApprovedPass) {
      return {
        label: "ON APPROVED LEAVE",
        subtext: `Gate Pass #${hostelDossier.activePassNumber || "GP-ACTIVE"} · Curfew exempt`,
        pill: "bg-blue-900/30 text-blue-300 border-blue-500/40"
      };
    }
    if (hostelDossier.record?.status === "RETURNED") {
      const timeStr = hostelDossier.record.returnTime
        ? new Date(hostelDossier.record.returnTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "Verified";
      return {
        label: "RETURNED",
        subtext: `${timeStr} · Warden check confirmed`,
        pill: "bg-emerald-950/40 text-emerald-300 border-emerald-500/40"
      };
    }
    if (hostelDossier.record?.status === "ON_LEAVE") {
      return {
        label: "ON APPROVED LEAVE",
        subtext: "Sanctioned leave on record · No penalty",
        pill: "bg-blue-900/30 text-blue-300 border-blue-500/40"
      };
    }
    return {
      label: "NOT RETURNED",
      subtext: "Curfew check pending · Turnstile alert",
      pill: "bg-[#FF6D1F]/15 text-[#FF6D1F] border-[#FF6D1F]/40"
    };
  };

  const curfew = getCurfewStatus();

  return (
    <div className="space-y-8 pb-16 font-mono">
      {/* 1. Planned Maintenance Alert (if active) */}
      {activeMaintenance.length > 0 && (
        <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-amber-500/30 text-xs text-[var(--text-primary)] flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center space-x-3">
            <Radio className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <div>
              <span className="font-mono uppercase text-[10px] text-amber-400 font-bold tracking-wider block">
                Active Campus Outage
              </span>
              <span className="text-xs text-[var(--text-primary)]">
                {activeMaintenance[0].title} — {activeMaintenance[0].location} ({activeMaintenance[0].affectedAudience})
              </span>
            </div>
          </div>
          <span className="text-[11px] font-mono text-[var(--text-muted)] shrink-0">
            {new Date(activeMaintenance[0].startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      )}

      {/* 2. Active SOS Emergency Beacon (Student) */}
      {user.role === "STUDENT" && sosActiveEmergency && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-4 animate-pulse ${
            sosActiveEmergency.status === "RESOLVED"
              ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-200"
              : "bg-rose-950/40 border-rose-500/50 text-rose-200"
          }`}
        >
          <div className="flex items-center space-x-3">
            <Siren className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-black uppercase tracking-wider text-rose-300">
                  {sosActiveEmergency.status === "RESOLVED" ? "EMERGENCY RESOLVED" : "EMERGENCY SOS BEACON ACTIVE"}
                </span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
                  #{sosActiveEmergency.alertNumber || sosActiveEmergency.id.slice(0, 8)}
                </span>
              </div>
              <p className="text-xs text-rose-100 mt-0.5">
                {sosActiveEmergency.category} · Location: {sosActiveEmergency.location}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <a
              href="tel:1800CAMPUS"
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-mono font-bold flex items-center space-x-1.5 transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>1800-CAMPUS</span>
            </a>
            {sosActiveEmergency.status === "RESOLVED" && (
              <button
                onClick={() => setSosActiveEmergency(null)}
                className="p-1.5 rounded-lg bg-white/10 text-rose-100 hover:text-white hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. HERO AREA (Section 13) */}
      <section className="border-b border-[var(--border-subtle)] pb-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <span className="editorial-eyebrow text-[#FF6D1F] block mb-2">
              01 // CAMPUS OPERATING SYSTEM
            </span>
            <h1 className="editorial-title text-xl sm:text-2xl text-[var(--text-primary)]">
              {getGreeting()}, {user.fullName.split(" ")[0].toUpperCase()}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-2 font-mono tracking-tight flex items-center space-x-2 flex-wrap">
              <span>{user.role} WORKSPACE</span>
              <span>·</span>
              <span>{user.course || "B.TECH"} {user.branch || "CSE"}</span>
              <span>·</span>
              <span>YEAR {user.year || 2} SEM {user.semester || 4}</span>
              <span>·</span>
              <span className="text-[#FF6D1F] font-bold">
                {isHosteller ? `${user.hostelBlock || "HOSTEL"} RESIDENT` : `TRANSIT: ${user.busRoute || "ROUTE 01"}`}
              </span>
            </p>
          </div>

          {/* Quick Shortcuts */}
          <div className="flex items-center space-x-3 shrink-0">
            {user.role === "STUDENT" && (
              <>
                <button
                  onClick={() => setShowSosModal(true)}
                  className="px-3.5 py-2 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 text-xs font-mono font-bold flex items-center space-x-2 transition-colors shadow-sm"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  <span>EMERGENCY SOS</span>
                </button>

                <button
                  onClick={() => setShowIdModal(true)}
                  className="px-3.5 py-2 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] text-xs font-mono font-medium flex items-center space-x-1.5 transition-colors"
                >
                  <QrCode className="w-3.5 h-3.5 text-[#FF6D1F]" />
                  <span>DIGITAL ID</span>
                </button>

                <Link
                  to="/help"
                  className="hidden sm:flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] text-xs font-mono font-medium transition-colors"
                  title="Campus Emergency & Department Directory"
                >
                  <LifeBuoy className="w-3.5 h-3.5 text-[#FF6D1F]" />
                  <span>EMERGENCY DIRECTORY</span>
                </Link>

                {isHosteller && (
                  <button
                    onClick={() => setShowTransferModal(true)}
                    className="hidden sm:flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] text-xs font-mono font-medium transition-colors"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 text-[#FF6D1F]" />
                    <span>TRANSFER</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* 4. ASYMMETRIC SPLIT: ATTENDANCE METRIC + TODAY'S SCHEDULE (Section 13) */}
      {user.role === "STUDENT" && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: Massive Attendance Metric (5 cols) */}
          <div className="lg:col-span-5 campus-block p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="editorial-eyebrow text-[#F5E7C6]/60">
                  02 // ACADEMIC COMPLIANCE
                </span>
                <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                  (academicAttendance?.overall?.percentage ?? 87.4) >= 75
                    ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/30"
                    : "bg-rose-950/40 text-rose-300 border-rose-500/30"
                }`}>
                  {(academicAttendance?.overall?.percentage ?? 87.4) >= 75 ? "COMPLIANT" : "SHORTAGE"}
                </span>
              </div>

              <div className="flex items-baseline space-x-2 mt-2">
                <span className="editorial-numeral text-6xl sm:text-7xl font-black text-[var(--text-primary)]">
                  {academicAttendance?.overall?.percentage ?? 87.4}%
                </span>
              </div>

              <p className="text-xs font-mono text-[var(--text-secondary)] mt-3 leading-relaxed">
                Attended <strong className="text-[var(--text-primary)]">{academicAttendance?.overall?.attendedClasses ?? 42}</strong> out of{" "}
                <strong className="text-[var(--text-primary)]">{academicAttendance?.overall?.totalClasses ?? 48}</strong> scheduled sessions across current semester.
              </p>
            </div>

            <div className="pt-6 mt-6 border-t border-[var(--border-subtle)] flex items-center justify-between">
              <span className="text-[11px] font-mono text-[var(--text-muted)]">
                Min 75% university rule
              </span>
              <Link
                to="/academics"
                className="text-xs font-mono font-bold text-[#FF6D1F] hover:underline flex items-center space-x-1"
              >
                <span>SUBJECT BREAKDOWN</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Right Column: Today's Schedule Timeline (7 cols) */}
          <div className="lg:col-span-7 campus-block p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="editorial-eyebrow text-[var(--text-muted)]">
                  03 // TODAY'S LECTURE TIMELINE
                </span>
                <span className="text-[11px] font-mono text-[var(--text-muted)]">
                  {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
                </span>
              </div>

              {todayClasses.length === 0 ? (
                <div className="py-8 text-center">
                  <CalendarDays className="w-8 h-8 text-[var(--text-muted)] opacity-30 mx-auto mb-2" />
                  <p className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider">
                    No scheduled lectures today — studio & lab hours
                  </p>
                </div>
              ) : (
                <div className="space-y-3 mt-4">
                  {todayClasses.slice(0, 3).map((cls, idx) => (
                    <div
                      key={cls.id || idx}
                      className="p-3.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-between hover:border-[var(--border-medium)] transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-16 shrink-0 text-left font-mono">
                          <span className="text-xs font-bold text-[var(--text-primary)] block">
                            {cls.startTime || "10:30"}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)] block">
                            {cls.endTime || "11:30"}
                          </span>
                        </div>

                        <div className="border-l border-[var(--border-subtle)] pl-4">
                          <h4 className="text-xs font-bold text-[var(--text-primary)] tracking-tight">
                            {cls.subject?.name || cls.subjectName || "Core Lecture"}
                          </h4>
                          <p className="text-[11px] font-mono text-[var(--text-muted)] mt-0.5">
                            {cls.roomNumber ? `Rm ${cls.roomNumber}` : "Main Block"} · {cls.faculty?.fullName || cls.facultyName || "Department Faculty"}
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
                        {cls.subject?.code || cls.subjectCode || "L-01"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 mt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
              <span className="text-[11px] font-mono text-[var(--text-muted)]">
                {todayClasses.length} sessions listed today
              </span>
              <Link
                to="/academics"
                className="text-xs font-mono font-bold text-[#FF6D1F] hover:underline flex items-center space-x-1"
              >
                <span>FULL TIMETABLE</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 5. RESIDENCY / CURFEW DIRECTORY vs TRANSIT HUB (Sections 15 & 16) */}
      <section className="campus-block p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border-subtle)]">
          <div>
            <span className="editorial-eyebrow text-[#FF6D1F]">
              04 // {isHosteller ? "DIGITAL BUILDING DIRECTORY" : "TRANSIT & PARKING NETWORK"}
            </span>
            <h2 className="editorial-title text-xl text-[var(--text-primary)] mt-1">
              {isHosteller ? `${user.hostelBlock || "HOSTEL-A"} RESIDENT DOSSIER` : "DAY SCHOLAR COMMUTE HUB"}
            </h2>
          </div>

          <span className="text-xs font-mono px-2.5 py-1 rounded bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
            {isHosteller ? "ON-CAMPUS LIVING" : "OFF-CAMPUS COMMUTER"}
          </span>
        </div>

        {isHosteller ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Room & Bed */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)]">
                Assigned Allocation
              </span>
              <div className="text-xl font-mono font-bold text-[var(--text-primary)]">
                ROOM {user.roomNumber || hostelDossier?.roomNumber || "101"}
              </div>
              <div className="text-xs font-mono text-[var(--text-secondary)]">
                BED {user.bedNumber || hostelDossier?.bedNumber || "01"} // FLOOR 1
              </div>
            </div>

            {/* Assigned Warden */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)]">
                Hostel Warden
              </span>
              <div className="text-sm font-bold text-[var(--text-primary)] truncate">
                {hostelDossier?.warden || "Assigned Warden"}
              </div>
              <div className="text-xs font-mono text-[var(--text-muted)]">
                {hostelDossier?.wardenPhone ? `Ph: ${hostelDossier.wardenPhone}` : "Warden Command Desk"}
              </div>
            </div>

            {/* Curfew Roll-Call Return Status */}
            <div className="space-y-1 md:col-span-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)]">
                Tonight's Return & Curfew Status
              </span>
              <div className="flex items-center space-x-3 mt-1">
                <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold border ${curfew.pill}`}>
                  {curfew.label}
                </span>
                <span className="text-xs font-mono text-[var(--text-secondary)]">
                  {curfew.subtext}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)]">
                Designated Fleet Route
              </span>
              <div className="text-lg font-mono font-bold text-[var(--text-primary)]">
                {user.busRoute || "ROUTE 01 — URBAN EXPRESS"}
              </div>
              <div className="text-xs font-mono text-[var(--text-muted)]">
                Pickup: Master Canteen Gate // 07:45 AM
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)]">
                Return Departure
              </span>
              <div className="text-lg font-mono font-bold text-[var(--text-primary)]">
                05:30 PM
              </div>
              <div className="text-xs font-mono text-[var(--text-muted)]">
                Bay 2 · Academic Block North
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Link
                to="/transport"
                className="btn-secondary px-4 py-2 rounded-lg text-xs font-mono font-bold flex items-center space-x-1.5"
              >
                <Bus className="w-3.5 h-3.5 text-[#FF6D1F]" />
                <span>VIEW BUS STOPS</span>
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* 6. MESS MENU & COURIER PARCELS (Section 25 & 29) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Mess Menu: Editorial Bistro Format (8 cols) */}
        <div className="lg:col-span-8 campus-block p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="editorial-eyebrow text-[var(--text-muted)]">
                05 // HOSTEL DINING
              </span>
              <Link to="/mess" className="text-xs font-mono text-[#FF6D1F] hover:underline">
                WEEKLY MENU →
              </Link>
            </div>

            <h3 className="editorial-title text-xl text-[var(--text-primary)] mb-4">
              TODAY'S DINING DISPATCH
            </h3>

            {todayMess ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
                <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#FF6D1F] block mb-1">
                    BREAKFAST
                  </span>
                  <p className="text-xs text-[var(--text-primary)] leading-relaxed">
                    {todayMess.breakfast || "Poha · Boiled Egg / Banana · Chai"}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#FF6D1F] block mb-1">
                    LUNCH
                  </span>
                  <p className="text-xs text-[var(--text-primary)] leading-relaxed">
                    {todayMess.lunch || "Steamed Rice · Dal Tadka · Paneer"}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#FF6D1F] block mb-1">
                    SNACKS
                  </span>
                  <p className="text-xs text-[var(--text-primary)] leading-relaxed">
                    {todayMess.snacks || "Ginger Tea · Masala Biscuits"}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#FF6D1F] block mb-1">
                    DINNER
                  </span>
                  <p className="text-xs text-[var(--text-primary)] leading-relaxed">
                    {todayMess.dinner || "Phulka Roti · Mixed Veg · Dal Fry"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs font-mono text-[var(--text-muted)]">
                Menu synchronized daily by Mess Committee.
              </p>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
            <span>Dining Hall A · 07:30 PM — 09:30 PM</span>
            <span>Hostel Food Committee Inspected</span>
          </div>
        </div>

        {/* Courier Parcels & Quick Pass (4 cols) */}
        <div className="lg:col-span-4 campus-block p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <span className="editorial-eyebrow text-[var(--text-muted)] block mb-2">
              06 // LOGISTICS
            </span>
            <h3 className="editorial-title text-xl text-[var(--text-primary)]">
              COURIER DESK
            </h3>

            <div className="mt-4 p-4 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[var(--text-primary)]">Ready for Pickup:</span>
                <span className="text-lg font-mono font-bold text-[#FF6D1F]">
                  {activeParcelsCount}
                </span>
              </div>
              <p className="text-[11px] font-mono text-[var(--text-muted)] leading-normal">
                {activeParcelsCount > 0
                  ? "Arrived at Central Security Gate. Present OTP to claim."
                  : "No pending parcel packages at security."}
              </p>
            </div>
          </div>

          <Link
            to="/parcels"
            className="w-full mt-4 btn-secondary py-2.5 rounded-lg text-xs font-mono font-bold flex items-center justify-center space-x-2 text-center"
          >
            <Package className="w-4 h-4 text-[#FF6D1F]" />
            <span>OPEN PARCEL DESK</span>
          </Link>
        </div>
      </section>

      {/* 7. GAZETTE CIRCULARS & COMPLAINTS WORKFLOW (Section 27 & 28) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Official Campus Circulars (6 cols) */}
        <div className="lg:col-span-6 campus-block p-6 sm:p-8">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border-subtle)]">
            <span className="editorial-eyebrow text-[var(--text-muted)]">
              07 // OFFICIAL GAZETTE
            </span>
            <Link to="/notices" className="text-xs font-mono text-[#FF6D1F] hover:underline">
              ALL NOTICES →
            </Link>
          </div>

          {recentNotices.length === 0 ? (
            <p className="text-xs font-mono text-[var(--text-muted)] py-6 text-center">
              No recent official notices published.
            </p>
          ) : (
            <div className="divide-y divide-[var(--border-subtle)]">
              {recentNotices.map((n) => (
                <Link
                  key={n.id}
                  to={`/notices/${n.id}`}
                  className="py-3.5 block group first:pt-0 last:pb-0"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#FF6D1F]">
                      [{n.category || "NOTICE"}]
                    </span>
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">
                      {new Date(n.publishedAt || n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[#FF6D1F] transition-colors mt-1">
                    {n.title}
                  </h4>
                  <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 mt-1 leading-normal">
                    {n.content}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Maintenance Tickets & SLAs (6 cols) */}
        <div className="lg:col-span-6 campus-block p-6 sm:p-8">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border-subtle)]">
            <span className="editorial-eyebrow text-[var(--text-muted)]">
              08 // MAINTENANCE QUEUE
            </span>
            <Link to="/tickets" className="text-xs font-mono text-[#FF6D1F] hover:underline">
              MY TICKETS →
            </Link>
          </div>

          {recentTickets.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-xs font-mono text-[var(--text-muted)]">
                No active complaints or repair work orders.
              </p>
              <Link
                to="/tickets/new"
                className="inline-block mt-3 px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] text-xs font-mono text-[#FF6D1F] border border-[var(--border-subtle)] hover:border-[#FF6D1F]/50 transition-colors"
              >
                + LODGE A COMPLAINT
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-subtle)]">
              {recentTickets.map((t) => (
                <Link
                  key={t.id}
                  to={`/tickets/${t.id}`}
                  className="py-3.5 block group first:pt-0 last:pb-0"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-mono font-bold text-[var(--text-primary)] group-hover:text-[#FF6D1F] transition-colors truncate">
                      #{t.ticketNumber} · {t.title}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)] shrink-0">
                      {t.status}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-[11px] font-mono text-[var(--text-muted)] mt-1">
                    <span>{t.category}</span>
                    <span>·</span>
                    <span>{t.hostelBlock ? `${t.hostelBlock} Rm ${t.roomNumber}` : "Campus"}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 8. CAMPUS EMERGENCY & SAFETY DIRECTORY */}
      {user.role === "STUDENT" && (
        <section className="campus-block p-6 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
            <div>
              <span className="editorial-eyebrow text-[#FF6D1F] block mb-1">
                08 // 24/7 CAMPUS RESILIENCE & SAFETY
              </span>
              <h3 className="editorial-title text-xl text-[var(--text-primary)]">
                EMERGENCY & DEPARTMENT DIRECTORY
              </h3>
            </div>
            <Link
              to="/help"
              className="text-xs font-mono text-[#FF6D1F] hover:underline flex items-center space-x-1 self-start sm:self-auto font-bold"
            >
              <span>FULL EMERGENCY DIRECTORY</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Immediate speed-dial hotlines for campus security, health emergencies, warden escalation, and utility breakdowns. Accessible 24/7 with zero network latency.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
            <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex flex-col justify-between space-y-2.5 hover:border-[#FF6D1F]/40 transition-colors">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                    Perimeter & Gates
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                    24/7 DESK
                  </span>
                </div>
                <h4 className="text-xs font-bold text-[var(--text-primary)] mt-1">
                  Campus Security Command
                </h4>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                  Main Gate & Perimeter Control
                </p>
              </div>
              <a
                href="tel:1800CAMPUS"
                className="w-full py-1.5 px-3 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-main)] text-[#FF6D1F] border border-[#FF6D1F]/30 text-xs font-mono font-bold flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Phone className="w-3 h-3" />
                <span>1800-CAMPUS</span>
              </a>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex flex-col justify-between space-y-2.5 hover:border-[#FF6D1F]/40 transition-colors">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                    Medical Dispatch
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                    HEALTH
                  </span>
                </div>
                <h4 className="text-xs font-bold text-[var(--text-primary)] mt-1">
                  Health Center & Ambulance
                </h4>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                  Emergency Doctor on Duty
                </p>
              </div>
              <a
                href="tel:+919861100099"
                className="w-full py-1.5 px-3 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-main)] text-[#FF6D1F] border border-[#FF6D1F]/30 text-xs font-mono font-bold flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Phone className="w-3 h-3" />
                <span>Ext. 108 / Call</span>
              </a>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex flex-col justify-between space-y-2.5 hover:border-[#FF6D1F]/40 transition-colors">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                    Confidential Cell
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                    SAFETY
                  </span>
                </div>
                <h4 className="text-xs font-bold text-[var(--text-primary)] mt-1">
                  Women's Safety Hotline
                </h4>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                  Internal Complaints & Anti-Ragging
                </p>
              </div>
              <a
                href="tel:+919861003001"
                className="w-full py-1.5 px-3 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-main)] text-[#FF6D1F] border border-[#FF6D1F]/30 text-xs font-mono font-bold flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Phone className="w-3 h-3" />
                <span>+91 98610 03001</span>
              </a>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex flex-col justify-between space-y-2.5 hover:border-[#FF6D1F]/40 transition-colors">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                    Residence Warden
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    HOSTEL
                  </span>
                </div>
                <h4 className="text-xs font-bold text-[var(--text-primary)] mt-1">
                  Chief Warden Operations
                </h4>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                  Curfew & Residency Office
                </p>
              </div>
              <a
                href="tel:+919861001001"
                className="w-full py-1.5 px-3 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-main)] text-[#FF6D1F] border border-[#FF6D1F]/30 text-xs font-mono font-bold flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Phone className="w-3 h-3" />
                <span>+91 98610 01001</span>
              </a>
            </div>
          </div>
        </section>
      )}

      {/* EMERGENCY SOS MODAL (Campus OS Standard) */}
      {showSosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="campus-panel max-w-md w-full p-6 space-y-5 border border-rose-500/40 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center space-x-2 text-rose-400">
                <Siren className="w-5 h-5 animate-pulse" />
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[var(--text-primary)]">
                  EMERGENCY SOS DISPATCH
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowSosModal(false);
                  cancelSosCountdown();
                }}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {sosError && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/50 text-rose-200 text-xs font-mono">
                {sosError}
              </div>
            )}

            {sosActiveEmergency && ["ACTIVE", "NEW", "ACKNOWLEDGED", "RESPONDING"].includes(sosActiveEmergency.status) ? (
              <div className="space-y-4 text-center">
                <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/50 mx-auto flex items-center justify-center animate-pulse">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-mono font-bold text-sm text-[var(--text-primary)] uppercase">
                    SOS Beacon Dispatched
                  </h4>
                  <p className="text-xs font-mono text-[#FF6D1F] mt-1">
                    BEACON #{sosActiveEmergency.alertNumber || sosActiveEmergency.id.slice(0, 8)}
                  </p>
                  <p className="text-[11px] font-mono text-[var(--text-muted)] mt-1">
                    {isHosteller
                      ? "Assigned Warden and Security Control have been notified."
                      : "Campus Command Security has been notified."}
                  </p>
                </div>

                <div className="p-3 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-subtle)] text-xs font-mono text-left space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Status:</span>
                    <strong className="text-rose-400">{sosActiveEmergency.status}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Category:</span>
                    <span className="text-[var(--text-primary)]">{sosActiveEmergency.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Location:</span>
                    <span className="text-[var(--text-primary)]">{sosActiveEmergency.location}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2">
                  <a
                    href="tel:1800CAMPUS"
                    className="w-full py-2.5 rounded-lg text-xs font-mono font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center space-x-2 transition-colors"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>CALL SECURITY DISPATCH (1800-CAMPUS)</span>
                  </a>
                  <button
                    onClick={() => setShowSosModal(false)}
                    className="w-full py-2 text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    Close Modal & Maintain Active Beacon
                  </button>
                </div>
              </div>
            ) : sosCountdown !== null ? (
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 rounded-full bg-rose-600 text-white font-mono text-3xl font-black mx-auto flex items-center justify-center animate-ping">
                  {sosCountdown}
                </div>
                <div>
                  <h4 className="font-mono font-bold text-sm text-[var(--text-primary)]">
                    Transmitting SOS in {sosCountdown} seconds...
                  </h4>
                  <p className="text-[11px] font-mono text-[var(--text-muted)] mt-1">
                    Category: {sosCategory} · Location: {sosLocation}
                  </p>
                </div>
                <button
                  onClick={cancelSosCountdown}
                  className="w-full py-2.5 rounded-lg text-xs font-mono font-bold bg-[var(--bg-elevated)] text-rose-300 border border-rose-500/50 hover:bg-[var(--bg-hover)]"
                >
                  Cancel SOS (False Alarm)
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-subtle)] text-xs font-mono space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Student:</span>
                    <strong className="text-[var(--text-primary)]">{user.fullName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Roll / Transit:</span>
                    <span className="text-[#FF6D1F]">{user.rollNumber || "2024CS101"}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-mono text-[var(--text-secondary)] uppercase">
                    Select Emergency Category:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: "MEDICAL", label: "Medical Crisis", icon: ShieldAlert },
                      { key: "FIRE_SMOKE", label: "Fire / Smoke", icon: Flame },
                      { key: "LIFT_STUCK", label: "Elevator Malfunction", icon: Building },
                      { key: "SECURITY", label: "Security Concern", icon: Radio }
                    ].map((cat) => (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => setSosCategory(cat.key)}
                        className={`p-2.5 rounded-lg text-left border font-mono text-xs transition-colors ${
                          sosCategory === cat.key
                            ? "bg-rose-950/50 border-rose-500/80 text-rose-200"
                            : "bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--border-medium)]"
                        }`}
                      >
                        <div className="flex items-center space-x-1.5 mb-0.5">
                          <cat.icon className="w-3.5 h-3.5" />
                          <span className="font-bold">{cat.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-mono text-[var(--text-secondary)] uppercase">
                    Location / Landmark:
                  </label>
                  <input
                    type="text"
                    value={sosLocation}
                    onChange={(e) => setSosLocation(e.target.value)}
                    placeholder="Hostel, room, or building floor..."
                    className="w-full px-3 py-2 text-xs rounded-lg bg-[var(--bg-input)] border border-[var(--bg-input-border)] text-[var(--text-primary)] font-mono focus:border-[#FF6D1F] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-mono text-[var(--text-secondary)] uppercase">
                    Description (Optional):
                  </label>
                  <input
                    type="text"
                    value={sosDescription}
                    onChange={(e) => setSosDescription(e.target.value)}
                    placeholder="Brief detail of incident..."
                    className="w-full px-3 py-2 text-xs rounded-lg bg-[var(--bg-input)] border border-[var(--bg-input-border)] text-[var(--text-primary)] font-mono focus:border-[#FF6D1F] outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => startSosCountdown(sosCategory)}
                  disabled={sosSending}
                  className="w-full py-2.5 rounded-lg text-xs font-mono font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center space-x-2 transition-colors shadow-md"
                >
                  <Siren className="w-4 h-4" />
                  <span>CONFIRM & TRANSMIT SOS BEACON</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STUDENT DIGITAL ID MODAL */}
      {showIdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="campus-panel max-w-sm w-full p-6 space-y-5 border border-[var(--border-medium)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded bg-[var(--bg-elevated)] text-[#FF6D1F] border border-[var(--border-subtle)] font-mono font-black text-xs flex items-center justify-center">
                  CD
                </span>
                <span className="text-xs font-mono font-bold text-[var(--text-primary)] uppercase">
                  Digital Campus ID
                </span>
              </div>
              <button onClick={() => setShowIdModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)] mx-auto flex items-center justify-center text-lg font-mono font-black">
                {user.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
              </div>
              <div>
                <p className="font-bold text-sm text-[var(--text-primary)]">{user.fullName}</p>
                <p className="text-xs font-mono text-[#FF6D1F] font-bold">ROLL: {user.rollNumber || "2024CS101"}</p>
                <p className="text-xs font-mono text-[var(--text-secondary)] mt-0.5">{user.course || "B.Tech"} {user.branch || "CSE"}</p>
                <p className="text-[11px] font-mono text-[var(--text-muted)] mt-1">
                  {isHosteller ? `${user.hostelBlock || "HOSTEL"} · RM ${user.roomNumber || "N/A"}` : `DAY SCHOLAR · ${user.busRoute || "TRANSIT"}`}
                </p>
              </div>
            </div>

            <div className="p-4 bg-white rounded-xl flex items-center justify-center">
              <QrCode className="w-36 h-36 text-black" />
            </div>

            <p className="text-[10px] text-center font-mono text-[var(--text-muted)] uppercase">
              Emergency Contact: {user.phone || user.guardianPhone || "1800-CAMPUS"}
            </p>
          </div>
        </div>
      )}

      {/* HOSTEL TRANSFER MODAL */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="campus-panel max-w-md w-full p-6 space-y-4 text-xs font-mono border border-[var(--border-medium)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h3 className="text-xs font-mono font-bold text-[var(--text-primary)] uppercase">
                Request Hostel Transfer
              </h3>
              <button onClick={() => setShowTransferModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {transferSuccess && (
              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300">
                {transferSuccess}
              </div>
            )}

            {transferError && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300">
                {transferError}
              </div>
            )}

            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div>
                <label className="block text-[var(--text-primary)] mb-1.5 uppercase tracking-wider text-[10px]">
                  Target Hostel Block *
                </label>
                <select
                  required
                  value={transferForm.toHostel}
                  onChange={(e) => setTransferForm({ ...transferForm, toHostel: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--bg-input-border)] text-[var(--text-primary)] font-mono focus:border-[#FF6D1F] outline-none"
                >
                  <option value="Hostel-A">Hostel-A (Boys Senior)</option>
                  <option value="Hostel-B">Hostel-B (Boys Junior)</option>
                  <option value="Hostel-C">Hostel-C (Girls Campus)</option>
                  <option value="Hostel-D">Hostel-D (PG & Research)</option>
                  <option value="Hostel-E">Hostel-E (International)</option>
                </select>
              </div>

              <div>
                <label className="block text-[var(--text-primary)] mb-1.5 uppercase tracking-wider text-[10px]">
                  Reason for Transfer *
                </label>
                <textarea
                  required
                  rows={4}
                  value={transferForm.reason}
                  onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
                  placeholder="State academic, medical, or administrative reason..."
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--bg-input-border)] text-[var(--text-primary)] font-mono focus:border-[#FF6D1F] outline-none resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="btn-secondary px-4 py-2 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-4 py-2 rounded-lg text-xs"
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
