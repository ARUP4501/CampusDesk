import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Wrench,
  DoorOpen,
  Megaphone,
  CalendarDays,
  Utensils,
  ArrowRight,
  Wifi,
  QrCode,
  Sparkles,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
  Clock,
  Layers,
  Building,
  GraduationCap,
  Bus,
  ShieldAlert
} from "lucide-react";
import { UserProfile, apiRequest } from "../api/client.js";

interface LandingPageProps {
  user: UserProfile | null;
  onLoginSuccess: (user: UserProfile) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ user, onLoginSuccess }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedRoleTab, setSelectedRoleTab] = useState<"student" | "faculty" | "warden" | "staff" | "security" | "admin">("student");
  const [loggingInRole, setLoggingInRole] = useState<string | null>(null);

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 100);
      }
    }
  }, [location]);

  const handleInstantDemoLogin = async (email: string, roleName: string) => {
    try {
      setLoggingInRole(roleName);
      const data = await apiRequest<{ user: UserProfile }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password: "Password@123" })
      });
      onLoginSuccess(data.user);
      if (data.user.role === "STUDENT") navigate("/dashboard");
      else if (data.user.role === "FACULTY") navigate("/faculty");
      else if (data.user.role === "STAFF" && (data.user.email.includes("security") || roleName === "Security")) navigate("/security/gate");
      else navigate("/admin");
    } catch (err: any) {
      console.error(err);
      navigate("/login");
    } finally {
      setLoggingInRole(null);
    }
  };

  const roleDetails = {
    student: {
      title: "Student Daily Operations",
      desc: "Live lecture timetable, academic attendance telemetry, digital QR gate pass lifecycle, hostel curfew return status, and 4-meal daily mess menus.",
      features: [
        "Curfew Return Verification & Leave Tracking",
        "Subject-Wise Academic Attendance Ratio",
        "Cryptographic QR Gate Passes for Campus Outings",
        "Hostel Maintenance Work Orders with Photo Logs"
      ],
      email: "student@campusdesk.edu",
      roleLabel: "Student",
      dest: "/dashboard"
    },
    faculty: {
      title: "Multi-Branch Faculty Command",
      desc: "Instant teaching assignments across MCA, B.Tech CSE, and BCA. Fast roster attendance logging with real-time submit workflows.",
      features: [
        "Cross-Department Branch & Semester Switcher",
        "One-Click Class Session Roll Call Engine",
        "Immediate Attendance Percentage Computation",
        "Official Exam & Cancellation Circular Broadcasts"
      ],
      email: "anita.sharma@campusdesk.edu",
      roleLabel: "Faculty",
      dest: "/faculty"
    },
    warden: {
      title: "Hostel Warden & Curfew Registry",
      desc: "Building-scoped occupancy directories, evening curfew roll calls with instant Mark Returned, and leave pass review queues.",
      features: [
        "Hostel Block Evening Return Reconciliation",
        "Gate Pass Approval with Parent Contact Audit",
        "Room & Bed Allocation Matrix Oversight",
        "Emergency SOS Incident Alert Reception"
      ],
      email: "warden.brahmagupta@campusdesk.edu",
      roleLabel: "Warden",
      dest: "/admin"
    },
    staff: {
      title: "Campus Dispatch & Facility Crews",
      desc: "Operational repair queues, plumbing and electrical work orders, courier parcel inward logging with student pickup OTP issuance.",
      features: [
        "SLA Escalation Queue with 24-Hour Timers",
        "Central Parcel Inward Desk with Verification",
        "Housekeeping & Electrical Job Assignments",
        "Resolution Notes & Proof of Completion"
      ],
      email: "staff@campusdesk.edu",
      roleLabel: "Staff",
      dest: "/tickets"
    },
    security: {
      title: "Gate Security & Checkpoint Terminal",
      desc: "Live student departure logs, outside campus headcount telemetry, cryptographic QR pass scanner, and curfew re-entry logging.",
      features: [
        "Instant Gate Departure / Arrival QR Scanner",
        "Active Passes Outside Campus Directory",
        "Student Identity Dossier Verification",
        "Zero-Friction Touch-Optimized Gate Interface"
      ],
      email: "security@campusdesk.edu",
      roleLabel: "Security",
      dest: "/security/gate"
    },
    admin: {
      title: "Central Institutional Command",
      desc: "Comprehensive college oversight, multi-hostel allocation matrix, academic attendance heatmaps, transport fleet dispatch, and audit records.",
      features: [
        "Architectural Room & Bed Floor Visualizer",
        "Curfew Roll Call Master Command Console",
        "Transport Fleet & Transit Corridor Manager",
        "Student Enrollment Verification Dossiers"
      ],
      email: "admin@campusdesk.edu",
      roleLabel: "Admin",
      dest: "/admin"
    }
  };

  return (
    <div className="space-y-20 py-8 sm:py-16 text-[var(--text-primary)]">
      {/* 1. EDITORIAL HERO SECTION — Campus OS Dark */}
      <section className="relative text-center space-y-7 pt-4 pb-12 max-w-4xl mx-auto px-4">
        {/* Subtle Ambient Tangerine Accent Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 sm:w-[500px] h-96 sm:h-[500px] bg-[#FF6D1F]/08 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Brand Eyebrow */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-mono font-medium shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF6D1F] animate-pulse"></span>
          <span className="tracking-widest uppercase text-[11px] text-[var(--text-secondary)] font-bold">CAMPUS OPERATING SYSTEM</span>
        </div>

        {/* Large Editorial Title */}
        <div className="space-y-3">
          <h1 className="editorial-title text-4xl sm:text-6xl lg:text-7xl font-extrabold text-[var(--text-primary)] tracking-tight leading-[1.05]">
            Digital Infrastructure <br />
            <span className="font-serif italic font-normal text-[var(--text-secondary)]">for Modern Campus Life.</span>
          </h1>
          <p className="text-sm sm:text-base font-mono text-[var(--text-muted)] tracking-tight pt-1">
            CAMPUSDESK // OPERATIONAL MATRIX & TELEMETRY
          </p>
        </div>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
          Unifying academic attendance, evening hostel return curfews, cryptographic QR gate passes, multi-branch faculty teaching, and operational facility maintenance.
        </p>

        {/* Primary CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
          {user ? (
            <Link
              to="/dashboard"
              className="btn-primary px-7 py-3 text-xs font-bold rounded-xl inline-flex items-center space-x-2 group font-mono"
            >
              <span>ENTER WORKSPACE</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="btn-primary px-7 py-3 text-xs font-bold rounded-xl inline-flex items-center space-x-2 group font-mono"
              >
                <span>SIGN IN TO CONSOLE</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a
                href="#roles"
                className="btn-secondary px-6 py-3 text-xs font-mono font-semibold rounded-xl"
              >
                ONE-CLICK DEMO ROLES
              </a>
            </>
          )}
        </div>

        {/* Architectural Live Metrics Row (Section 2: Realistic Demo Environment) */}
        <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto text-left font-mono">
          <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest block">Active Roster</span>
            <div className="text-2xl font-bold text-[var(--text-primary)] mt-1">383</div>
            <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Seeded Students</div>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest block">Accommodation</span>
            <div className="text-2xl font-bold text-[var(--text-primary)] mt-1">5 Hostels</div>
            <div className="text-[10px] text-[var(--text-muted)] mt-0.5">125 Rooms • 250 Beds</div>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest block">Curfew Engine</span>
            <div className="text-2xl font-bold text-[#FF6D1F] mt-1">08:00 PM</div>
            <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Live Return Tracking</div>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest block">Faculty Grid</span>
            <div className="text-2xl font-bold text-[var(--text-primary)] mt-1">Multi-Branch</div>
            <div className="text-[10px] text-[var(--text-muted)] mt-0.5">MCA • CSE • BCA</div>
          </div>
        </div>
      </section>

      {/* 2. CORE ARCHITECTURE PILLARS */}
      <section id="benefits" className="max-w-6xl mx-auto space-y-8 scroll-mt-24 px-4">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <span className="editorial-eyebrow">01 // PLATFORM CAPABILITIES</span>
          <h2 className="editorial-title text-2xl sm:text-3xl text-[var(--text-primary)] mt-1">
            Engineered for High-Consequence Operations
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            Replacing physical paperwork and scattered messaging with deterministic digital state engines.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 rounded-2xl campus-panel border border-[var(--border-subtle)] space-y-4 hover:border-[var(--text-muted)] transition-all">
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] flex items-center justify-center text-[#FF6D1F]">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)] mb-1.5 font-mono">Evening Return & Curfew</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
                Real-time hostel curfew reconciliation: instantly separates returned students from curfew violations and approved gate passes.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl campus-panel border border-[#FF6D1F]/30 space-y-4 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] flex items-center justify-center text-[#FF6D1F]">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-1.5">
                <h3 className="text-base font-bold text-[var(--text-primary)] font-mono">Cryptographic QR Passes</h3>
                <span className="px-2 py-0.5 text-[9px] font-mono uppercase font-bold bg-[#FF6D1F]/15 text-[#FF6D1F] rounded border border-[#FF6D1F]/30">
                  LIVE
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
                Student leaves follow a verified 5-stage timeline: requested, reviewed by warden, approved with dynamic QR token, and scanned at security gate.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl campus-panel border border-[var(--border-subtle)] space-y-4 hover:border-[var(--text-muted)] transition-all">
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] flex items-center justify-center text-[#FF6D1F]">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)] mb-1.5 font-mono">24-Hour SLA Maintenance</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
                Plumbing, electrical, and facility repair requests feature automatic priority tiering, recurring defect pattern tracking, and technician dispatch.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. ONE-CLICK HACKATHON JURY DEMO ROLES (Section 50) */}
      <section id="roles" className="max-w-5xl mx-auto space-y-6 scroll-mt-24 px-4">
        <div className="text-center space-y-2">
          <span className="editorial-eyebrow">02 // ROLE-BASED ACCESS CONTROL</span>
          <h2 className="editorial-title text-2xl sm:text-3xl text-[var(--text-primary)] mt-1">
            Built for Every Member of Campus
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-lg mx-auto">
            Strict role-segregated workspaces. Click any persona below to launch a live authenticated session with realistic seed data.
          </p>
        </div>

        {/* Role Switcher Rail */}
        <div className="flex flex-wrap justify-center gap-1.5 p-1.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl max-w-2xl mx-auto font-mono text-xs">
          {(["student", "faculty", "warden", "staff", "security", "admin"] as const).map((roleKey) => (
            <button
              key={roleKey}
              onClick={() => setSelectedRoleTab(roleKey)}
              className={`py-2 px-3.5 rounded-lg capitalize font-bold transition-all ${
                selectedRoleTab === roleKey
                  ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
              }`}
            >
              {roleKey}
            </button>
          ))}
        </div>

        {/* Selected Role Showcase Card */}
        <div className="p-6 sm:p-8 rounded-2xl campus-panel border border-[var(--border-subtle)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-4 max-w-xl">
              <div>
                <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded bg-[var(--bg-input)] text-[#FF6D1F] font-bold border border-[var(--border-subtle)]">
                  {roleDetails[selectedRoleTab].roleLabel} Workspace Console
                </span>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mt-2.5 font-display">
                  {roleDetails[selectedRoleTab].title}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed mt-1">
                  {roleDetails[selectedRoleTab].desc}
                </p>
              </div>

              <div className="space-y-2 font-mono text-xs">
                {roleDetails[selectedRoleTab].features.map((feat, idx) => (
                  <div key={idx} className="flex items-center space-x-2 text-[var(--text-primary)]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#FF6D1F] shrink-0" />
                    <span className="text-[var(--text-secondary)]">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] space-y-3 shrink-0 md:w-64 text-center">
              <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] text-[#FF6D1F] border border-[var(--border-subtle)] flex items-center justify-center mx-auto font-mono font-bold text-sm">
                {roleDetails[selectedRoleTab].roleLabel[0]}
              </div>
              <div>
                <p className="font-bold text-xs text-[var(--text-primary)] font-mono">1-Click Hackathon Persona</p>
                <p className="text-[10px] font-mono text-[var(--text-muted)] truncate mt-0.5">
                  {roleDetails[selectedRoleTab].email}
                </p>
              </div>
              <button
                onClick={() =>
                  handleInstantDemoLogin(
                    roleDetails[selectedRoleTab].email,
                    roleDetails[selectedRoleTab].roleLabel
                  )
                }
                disabled={loggingInRole !== null}
                className="w-full btn-primary font-bold py-2.5 px-3 text-xs rounded-xl flex items-center justify-center space-x-1.5 font-mono"
              >
                <span>
                  {loggingInRole === roleDetails[selectedRoleTab].roleLabel
                    ? "Authenticating..."
                    : `Launch as ${roleDetails[selectedRoleTab].roleLabel}`}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FINAL CALL TO ACTION */}
      <section className="text-center space-y-4 py-8 max-w-2xl mx-auto p-8 rounded-2xl campus-panel border border-[var(--border-subtle)]">
        <h2 className="editorial-title text-2xl sm:text-3xl text-[var(--text-primary)]">
          CAMPUSDESK
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed font-mono">
          Unified campus operating system for student living, teaching, residency safety, and administrative coordination.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2 font-mono">
          <Link
            to="/login"
            className="btn-primary px-6 py-2.5 text-xs font-bold rounded-xl"
          >
            Sign In Now
          </Link>
          <Link
            to="/register"
            className="btn-secondary px-5 py-2.5 text-xs font-semibold rounded-xl"
          >
            Student Registration
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
