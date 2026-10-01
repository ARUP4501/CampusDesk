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
  Layers
} from "lucide-react";
import { UserProfile, apiRequest } from "../api/client.js";

interface LandingPageProps {
  user: UserProfile | null;
  onLoginSuccess: (user: UserProfile) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ user, onLoginSuccess }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedRoleTab, setSelectedRoleTab] = useState<"student" | "warden" | "staff" | "admin">("student");
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
      navigate(data.user.role === "STUDENT" ? "/dashboard" : "/admin");
    } catch (err: any) {
      console.error(err);
      navigate("/login");
    } finally {
      setLoggingInRole(null);
    }
  };

  const roleDetails = {
    student: {
      title: "Student Experience",
      desc: "Instant digital gate passes with QR verification, hostel maintenance with photo tracking, mess ratings, and timetable alerts.",
      features: [
        "1-Click Hostel Maintenance & Plumber Requests",
        "Outing & Weekend Gate Passes with Parent Contacts",
        "Targeted Exam Circulars & Class Cancellation Alerts",
        "Digital PDF Bonafide & Fee Certificates"
      ],
      email: "student@campusdesk.edu",
      roleLabel: "Student"
    },
    warden: {
      title: "Hostel Warden Hub",
      desc: "Fast review queue for student room allocations, gate pass approvals, room transfer requests, and SLA escalated repairs.",
      features: [
        "Gate Pass Approval with Parent Contact Verification",
        "Hostel Block Bed Allocation & Room Transfers",
        "24-Hour SLA Escalated Ticket Monitoring",
        "Block-Specific Circulars & Announcements"
      ],
      email: "warden@campusdesk.edu",
      roleLabel: "Warden"
    },
    staff: {
      title: "Department Maintenance Staff",
      desc: "Dedicated work order queue for electrical, plumbing, carpentry, and housekeeping with photo resolution records.",
      features: [
        "Real-Time Maintenance Work Order Feed",
        "Resolution Notes & Proof of Work Logging",
        "Class Schedule & Academic Room Management",
        "Gate Security Log for Guard Entry Verification"
      ],
      email: "staff@campusdesk.edu",
      roleLabel: "Staff"
    },
    admin: {
      title: "Central Administration",
      desc: "Comprehensive college oversight, student registry verification, automated SLA alerts, CSV data migration, and audit trails.",
      features: [
        "Student Digital Dossier & Account Activations",
        "CSV Student & Fee Database Ingestion",
        "Institutional Notice Publishing & Read Rates",
        "Immutable Audit Logs for Compliance"
      ],
      email: "admin@campusdesk.edu",
      roleLabel: "Admin"
    }
  };

  return (
    <div className="space-y-24 py-6 sm:py-12">
      {/* 1. EDITORIAL HERO SECTION */}
      <section className="relative text-center space-y-7 pt-6 pb-12 max-w-4xl mx-auto px-4">
        {/* Subtle Ambient Warm Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 sm:w-[500px] h-96 sm:h-[500px] bg-[#FDB773]/20 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Small Eyebrow */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/45 border border-campus-border text-campus-accent text-xs font-mono font-medium shadow-subtle animate-fadeIn">
          <Sparkles className="w-3.5 h-3.5 text-campus-accent" />
          <span className="tracking-wide">SMART CAMPUS PLATFORM</span>
        </div>

        {/* Editorial Headline with Elegant Serif/Cursive Highlight */}
        <div className="space-y-2">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-campus-text leading-[1.08] animate-hero">
            Campus life, <br />
            <span className="font-serif italic font-normal text-campus-accent underline decoration-[#FDB773]/40 underline-offset-8">
              simplified.
            </span>
          </h1>
          <p className="text-sm sm:text-base font-medium text-campus-secondary tracking-tight pt-1">
            One place for everything that matters.
          </p>
        </div>

        {/* Supporting text */}
        <p className="text-sm sm:text-base text-campus-secondary max-w-2xl mx-auto leading-relaxed font-normal">
          Unifying hostel maintenance, instant QR gate passes, circulars, academics, and digital certificates into a refined, high-performance experience.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
          {user ? (
            <Link
              to="/dashboard"
              className="btn-primary px-7 py-3 text-xs font-bold rounded-2xl inline-flex items-center space-x-2 group"
            >
              <span>Go to Your Workspace</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="btn-primary px-7 py-3 text-xs font-bold rounded-2xl inline-flex items-center space-x-2 group"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a
                href="#features"
                className="btn-secondary px-6 py-3 text-xs font-semibold rounded-2xl"
              >
                Explore CampusDesk
              </a>
            </>
          )}
        </div>

        {/* Live Metrics Bar with Card Hierarchy */}
        <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-3.5 max-w-3xl mx-auto text-left">
          <div className="p-4 rounded-2xl card-stat">
            <div className="flex items-center justify-between text-campus-accent">
              <Clock className="w-4 h-4" />
              <span className="text-[10px] font-mono uppercase text-campus-muted font-bold">Escalation</span>
            </div>
            <div className="text-2xl font-bold text-campus-accent font-mono mt-2">&lt; 24h</div>
            <div className="text-[11px] text-campus-muted font-medium mt-0.5">SLA Guaranteed</div>
          </div>

          <div className="p-4 rounded-2xl card-stat">
            <div className="flex items-center justify-between text-campus-text">
              <QrCode className="w-4 h-4 text-campus-accent" />
              <span className="text-[10px] font-mono uppercase text-campus-muted font-bold">Paperless</span>
            </div>
            <div className="text-2xl font-bold text-campus-text font-mono mt-2">100%</div>
            <div className="text-[11px] text-campus-muted font-medium mt-0.5">QR Gate Passes</div>
          </div>

          <div className="p-4 rounded-2xl card-stat">
            <div className="flex items-center justify-between text-campus-accent">
              <Wifi className="w-4 h-4" />
              <span className="text-[10px] font-mono uppercase text-campus-muted font-bold">Offline</span>
            </div>
            <div className="text-2xl font-bold text-campus-accent font-mono mt-2">Local-First</div>
            <div className="text-[11px] text-campus-muted font-medium mt-0.5">IndexedDB PWA</div>
          </div>

          <div className="p-4 rounded-2xl card-stat">
            <div className="flex items-center justify-between text-campus-text">
              <ShieldCheck className="w-4 h-4 text-campus-accent" />
              <span className="text-[10px] font-mono uppercase text-campus-muted font-bold">Security</span>
            </div>
            <div className="text-2xl font-bold text-campus-text font-mono mt-2">RBAC</div>
            <div className="text-[11px] text-campus-muted font-medium mt-0.5">Role Protected</div>
          </div>
        </div>
      </section>

      {/* 2. KEY BENEFITS */}
      <section id="benefits" className="max-w-6xl mx-auto space-y-8 scroll-mt-24 px-4">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h2 className="text-xs font-mono uppercase tracking-widest text-campus-accent font-semibold">
            Key Architecture
          </h2>
          <p className="text-2xl sm:text-3xl font-bold text-campus-text tracking-tight leading-tight">
            Designed for Reliability and Speed
          </p>
          <p className="text-xs sm:text-sm text-campus-muted leading-relaxed">
            Replacing physical registers and delayed paperwork with transparent digital workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 sm:p-6 md:p-6.5 rounded-2xl glass-card flex flex-col justify-between group">
            <div className="space-y-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/60 border border-campus-border flex items-center justify-center text-campus-accent shadow-sm group-hover:scale-105 transition-transform">
                <Wrench className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-[17px] font-bold text-campus-text leading-snug mb-2">Smart Issue Resolution</h3>
                <p className="text-xs sm:text-[13px] text-campus-secondary leading-[1.65] font-normal break-words">
                  Complaints are categorized automatically with 24-hour SLA timers and escalation tracking to guarantee prompt hostel and campus repairs.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6 md:p-6.5 rounded-2xl card-featured flex flex-col justify-between group">
            <div className="space-y-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/70 border border-campus-accent/30 flex items-center justify-center text-campus-accent shadow-sm group-hover:scale-105 transition-transform">
                <QrCode className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-base sm:text-[17px] font-bold text-campus-text leading-snug">Secure Digital Gate Passes</h3>
                  <span className="px-2 py-0.5 text-[9px] font-mono uppercase font-bold bg-campus-btnPrimary/40 text-campus-text rounded-full border border-campus-border">Live</span>
                </div>
                <p className="text-xs sm:text-[13px] text-campus-secondary leading-[1.65] font-normal break-words">
                  Students request leaves online, wardens verify parent contacts, and gate security scans cryptographic QR codes for paperless entry.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6 md:p-6.5 rounded-2xl glass-card flex flex-col justify-between group">
            <div className="space-y-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/60 border border-campus-border flex items-center justify-center text-campus-accent shadow-sm group-hover:scale-105 transition-transform">
                <Wifi className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-[17px] font-bold text-campus-text leading-snug mb-2">Resilient Offline Mode</h3>
                <p className="text-xs sm:text-[13px] text-campus-secondary leading-[1.65] font-normal break-words">
                  IndexedDB local storage lets students view timetable, mess menus, and draft passes even during campus Wi-Fi outages.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CORE FEATURES */}
      <section id="features" className="max-w-6xl mx-auto space-y-8 scroll-mt-24 px-4">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h2 className="text-xs font-mono uppercase tracking-widest text-campus-accent font-semibold">
            Core Modules
          </h2>
          <p className="text-2xl sm:text-3xl font-bold text-campus-text tracking-tight leading-tight">
            Everything in One Unified Platform
          </p>
          <p className="text-xs sm:text-sm text-campus-muted leading-relaxed">
            Intuitive navigation and clean layouts so students, faculty, and administrators find what they need instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4.5 sm:gap-5">
          <div className="p-5 sm:p-6 rounded-2xl glass-card flex flex-col min-w-0 overflow-hidden text-left transition-all duration-200">
            <div className="mb-3.5">
              <div className="inline-flex p-2.5 rounded-xl bg-white/60 text-campus-accent border border-campus-border/60 shadow-xs">
                <Wrench className="w-5 h-5" />
              </div>
            </div>
            <div className="min-w-0 max-w-full flex-1 flex flex-col justify-start">
              <h4 className="font-bold text-sm sm:text-base text-campus-text leading-[1.25] mb-2 min-w-0 max-w-full break-words [overflow-wrap:anywhere]">
                Hostel Maintenance
              </h4>
              <p className="text-xs sm:text-[13px] text-campus-secondary leading-[1.55] font-normal min-w-0 max-w-full break-words [overflow-wrap:anywhere]">
                Photo uploads, room number tags, recurring defect detection, and direct technician assignment.
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl glass-card flex flex-col min-w-0 overflow-hidden text-left transition-all duration-200">
            <div className="mb-3.5">
              <div className="inline-flex p-2.5 rounded-xl bg-white/60 text-campus-accent border border-campus-border/60 shadow-xs">
                <DoorOpen className="w-5 h-5" />
              </div>
            </div>
            <div className="min-w-0 max-w-full flex-1 flex flex-col justify-start">
              <h4 className="font-bold text-sm sm:text-base text-campus-text leading-[1.25] mb-2 min-w-0 max-w-full break-words [overflow-wrap:anywhere]">
                Gate Passes & Outings
              </h4>
              <p className="text-xs sm:text-[13px] text-campus-secondary leading-[1.55] font-normal min-w-0 max-w-full break-words [overflow-wrap:anywhere]">
                Warden approval workflows, dynamic QR codes, gate entry timestamps, and overdue return alerts.
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl glass-card flex flex-col min-w-0 overflow-hidden text-left transition-all duration-200">
            <div className="mb-3.5">
              <div className="inline-flex p-2.5 rounded-xl bg-white/60 text-campus-accent border border-campus-border/60 shadow-xs">
                <Megaphone className="w-5 h-5" />
              </div>
            </div>
            <div className="min-w-0 max-w-full flex-1 flex flex-col justify-start">
              <h4 className="font-bold text-sm sm:text-base text-campus-text leading-[1.25] mb-2 min-w-0 max-w-full break-words [overflow-wrap:anywhere]">
                Targeted Notices
              </h4>
              <p className="text-xs sm:text-[13px] text-campus-secondary leading-[1.55] font-normal min-w-0 max-w-full break-words [overflow-wrap:anywhere]">
                Broadcast announcements targeted by Branch, Batch, Year, or Hostel with recipient read-tracking.
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl glass-card flex flex-col min-w-0 overflow-hidden text-left transition-all duration-200">
            <div className="mb-3.5">
              <div className="inline-flex p-2.5 rounded-xl bg-white/60 text-campus-accent border border-campus-border/60 shadow-xs">
                <CalendarDays className="w-5 h-5" />
              </div>
            </div>
            <div className="min-w-0 max-w-full flex-1 flex flex-col justify-start">
              <h4 className="font-bold text-sm sm:text-base text-campus-text leading-[1.25] mb-2 min-w-0 max-w-full break-words [overflow-wrap:anywhere]">
                Academic Timetable
              </h4>
              <p className="text-xs sm:text-[13px] text-campus-secondary leading-[1.55] font-normal min-w-0 max-w-full break-words [overflow-wrap:anywhere]">
                Live weekly schedules, classroom room numbers, and instant faculty class cancellation notifications.
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl glass-card flex flex-col min-w-0 overflow-hidden text-left transition-all duration-200">
            <div className="mb-3.5">
              <div className="inline-flex p-2.5 rounded-xl bg-white/60 text-campus-accent border border-campus-border/60 shadow-xs">
                <Utensils className="w-5 h-5" />
              </div>
            </div>
            <div className="min-w-0 max-w-full flex-1 flex flex-col justify-start">
              <h4 className="font-bold text-sm sm:text-base text-campus-text leading-[1.25] mb-2 min-w-0 max-w-full break-words [overflow-wrap:anywhere]">
                Mess Dining & Ratings
              </h4>
              <p className="text-xs sm:text-[13px] text-campus-secondary leading-[1.55] font-normal min-w-0 max-w-full break-words [overflow-wrap:anywhere]">
                Weekly 4-meal daily menu schedule with student star ratings and feedback for caterer accountability.
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl glass-card flex flex-col min-w-0 overflow-hidden text-left transition-all duration-200">
            <div className="mb-3.5">
              <div className="inline-flex p-2.5 rounded-xl bg-white/60 text-campus-accent border border-campus-border/60 shadow-xs">
                <FileCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="min-w-0 max-w-full flex-1 flex flex-col justify-start">
              <h4 className="font-bold text-sm sm:text-base text-campus-text leading-[1.25] mb-2 min-w-0 max-w-full break-words [overflow-wrap:anywhere]">
                Digital Certificates
              </h4>
              <p className="text-xs sm:text-[13px] text-campus-secondary leading-[1.55] font-normal min-w-0 max-w-full break-words [overflow-wrap:anywhere]">
                Automated PDF generation for Bonafide certificates, NOCs, and fee estimates with admin approval.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS */}
      <section className="max-w-5xl mx-auto space-y-8 scroll-mt-24 px-4">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h2 className="text-xs font-mono uppercase tracking-widest text-campus-accent font-semibold">
            Operational Flow
          </h2>
          <p className="text-2xl sm:text-3xl font-bold text-campus-text tracking-tight leading-tight">
            Simple 3-Step Operations
          </p>
          <p className="text-xs sm:text-sm text-campus-muted leading-relaxed">
            From initial submission to verified resolution in minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 sm:p-6 rounded-2xl glass-card flex flex-col justify-between space-y-3.5 relative">
            <div className="w-8.5 h-8.5 rounded-full bg-campus-btnPrimary text-campus-text font-mono font-bold text-xs flex items-center justify-center shadow-sm border border-campus-accent/20">
              01
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-campus-text leading-snug mb-1.5">Submit Request</h3>
              <p className="text-xs sm:text-[13px] text-campus-secondary leading-[1.65] font-normal break-words">
                Students raise complaints, request gate passes, or order documents in seconds from their phone or laptop.
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl glass-card flex flex-col justify-between space-y-3.5 relative">
            <div className="w-8.5 h-8.5 rounded-full bg-campus-btnPrimary text-campus-text font-mono font-bold text-xs flex items-center justify-center shadow-sm border border-campus-accent/20">
              02
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-campus-text leading-snug mb-1.5">Role-Based Review</h3>
              <p className="text-xs sm:text-[13px] text-campus-secondary leading-[1.65] font-normal break-words">
                Wardens, staff, or admins receive instant notifications and can approve or assign tasks with 1-click.
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl glass-card flex flex-col justify-between space-y-3.5 relative">
            <div className="w-8.5 h-8.5 rounded-full bg-campus-btnPrimary text-campus-text font-mono font-bold text-xs flex items-center justify-center shadow-sm border border-campus-accent/20">
              03
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-campus-text leading-snug mb-1.5">Verified Resolution</h3>
              <p className="text-xs sm:text-[13px] text-campus-secondary leading-[1.65] font-normal break-words">
                Staff upload photo proof upon completion, gates scan QR passes, and audit trails update automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. ROLE-BASED EXPERIENCE */}
      <section id="roles" className="max-w-5xl mx-auto space-y-6 scroll-mt-24 px-4">
        <div className="text-center space-y-1.5">
          <h2 className="text-xs font-mono uppercase tracking-widest text-campus-accent font-semibold">
            Role Architecture
          </h2>
          <p className="text-2xl sm:text-3xl font-bold text-campus-text tracking-tight">
            Built for Every Campus Member
          </p>
          <p className="text-xs sm:text-sm text-campus-muted max-w-lg mx-auto">
            Clean and role-focused. Each user only sees the features and data relevant to their role.
          </p>
        </div>

        {/* Role Selection Tabs */}
        <div className="flex flex-wrap justify-center gap-1.5 p-1.5 glass-panel rounded-2xl max-w-lg mx-auto">
          {(["student", "warden", "staff", "admin"] as const).map((roleKey) => (
            <button
              key={roleKey}
              onClick={() => setSelectedRoleTab(roleKey)}
              className={`flex-1 py-2 px-3.5 text-xs font-semibold rounded-xl capitalize transition-all duration-200 ${
                selectedRoleTab === roleKey
                  ? "bg-campus-btnPrimary text-campus-text font-bold shadow-sm"
                  : "text-campus-secondary hover:text-campus-text hover:bg-white/40"
              }`}
            >
              {roleKey}
            </button>
          ))}
        </div>

        {/* Role Content Card */}
        <div className="p-6 sm:p-8 rounded-3xl glass-panel">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-4 max-w-xl">
              <div>
                <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded-full bg-white/60 text-campus-accent font-bold border border-campus-border">
                  {roleDetails[selectedRoleTab].roleLabel} Workspace
                </span>
                <h3 className="text-xl font-bold text-campus-text mt-2.5">
                  {roleDetails[selectedRoleTab].title}
                </h3>
                <p className="text-xs text-campus-secondary leading-relaxed mt-1">
                  {roleDetails[selectedRoleTab].desc}
                </p>
              </div>

              <div className="space-y-2">
                {roleDetails[selectedRoleTab].features.map((feat, idx) => (
                  <div key={idx} className="flex items-center space-x-2 text-xs text-campus-text">
                    <CheckCircle2 className="w-4 h-4 text-campus-accent shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-2xl glass-card space-y-3 shrink-0 md:w-64 text-center">
              <div className="w-12 h-12 rounded-full bg-campus-btnPrimary text-campus-text border border-campus-accent/20 flex items-center justify-center mx-auto font-mono font-bold text-sm shadow-sm">
                {roleDetails[selectedRoleTab].roleLabel[0]}
              </div>
              <div>
                <p className="font-bold text-xs text-campus-text">Instant Demo Account</p>
                <p className="text-[11px] font-mono text-campus-muted truncate">
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
                className="w-full btn-primary font-bold py-2.5 px-3 text-xs rounded-xl transition-all duration-200 flex items-center justify-center space-x-1.5 shadow-sm group"
              >
                <span>
                  {loggingInRole === roleDetails[selectedRoleTab].roleLabel
                    ? "Launching..."
                    : `Test as ${roleDetails[selectedRoleTab].roleLabel}`}
                </span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FINAL CALL TO ACTION */}
      <section className="text-center space-y-4 py-10 max-w-2xl mx-auto p-8 rounded-3xl glass-panel">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-campus-text">
          Ready to Modernize Your Campus?
        </h2>
        <p className="text-xs sm:text-sm text-campus-secondary leading-relaxed">
          Sign in immediately with your campus credentials or launch any role test account in one click.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            to="/login"
            className="btn-primary px-6 py-2.5 text-xs font-bold rounded-2xl"
          >
            Sign In Now
          </Link>
          <Link
            to="/register"
            className="btn-secondary px-5 py-2.5 text-xs font-semibold rounded-2xl"
          >
            Student Registration
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;

