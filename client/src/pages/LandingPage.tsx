import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Wrench,
  DoorOpen,
  Megaphone,
  CalendarDays,
  Utensils,
  ArrowRight,
  Wifi,
  Shield,
  Clock,
  QrCode
} from "lucide-react";
import { UserProfile } from "../api/client.js";

interface LandingPageProps {
  user: UserProfile | null;
  onLoginSuccess: (user: UserProfile) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ user }) => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 100);
      }
    }
  }, [location]);

  return (
    <div className="max-w-4xl mx-auto space-y-16 py-8">
      {/* 1. HERO */}
      <section id="hero" className="text-center space-y-4 pt-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/5 border border-white/[0.08] text-campus-gold text-xs font-mono">
          <span>CAMPUS OPERATIONS PORTAL</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-campus-text">
          Campus operations, <br />
          <span className="text-campus-gold">made simple.</span>
        </h1>

        <p className="text-sm sm:text-base text-campus-secondary max-w-xl mx-auto leading-relaxed">
          One unified portal for students, staff, and wardens — submit maintenance complaints, request gate passes, read circulars, and check mess menus.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
          {user ? (
            <Link
              to="/"
              className="bg-campus-gold hover:bg-campus-goldLight text-campus-bg px-6 py-2.5 text-xs font-bold rounded inline-flex items-center space-x-2 shadow-subtle transition-all"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="bg-campus-gold hover:bg-campus-goldLight text-campus-bg px-6 py-2.5 text-xs font-bold rounded inline-flex items-center space-x-2 shadow-subtle transition-all"
              >
                <span>Sign In to Portal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/register"
                className="px-5 py-2.5 text-xs font-medium rounded border border-white/[0.08] bg-campus-surface hover:bg-white/5 text-campus-text transition-all"
              >
                <span>Student Registration</span>
              </Link>
            </>
          )}
        </div>
      </section>

      {/* 2. THREE KEY BENEFITS & OFFLINE RESILIENCE */}
      <section id="resilience" className="grid grid-cols-1 md:grid-cols-3 gap-4 scroll-mt-20">
        <div className="p-5 rounded bg-campus-card border border-white/[0.08] space-y-2">
          <div className="w-8 h-8 rounded bg-campus-surface border border-white/[0.08] flex items-center justify-center text-campus-gold">
            <Clock className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-campus-text">Fast Resolution</h3>
          <p className="text-xs text-campus-muted leading-relaxed">
            Report room electrical or plumbing defects with photos. Track assigned staff and SLA resolution times directly.
          </p>
        </div>

        <div className="p-5 rounded bg-campus-card border border-white/[0.08] space-y-2">
          <div className="w-8 h-8 rounded bg-campus-surface border border-white/[0.08] flex items-center justify-center text-campus-gold">
            <QrCode className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-campus-text">Digital Gate Pass</h3>
          <p className="text-xs text-campus-muted leading-relaxed">
            Apply for hostel outing or weekend leave online. Wardens verify and security scans QR codes at the main gate.
          </p>
        </div>

        <div className="p-5 rounded bg-campus-card border border-white/[0.08] space-y-2">
          <div className="w-8 h-8 rounded bg-campus-surface border border-white/[0.08] flex items-center justify-center text-campus-gold">
            <Wifi className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-campus-text">Works Offline</h3>
          <p className="text-xs text-campus-muted leading-relaxed">
            Weak hostel Wi-Fi? CampusDesk queues your requests locally and automatically syncs when connection returns.
          </p>
        </div>
      </section>

      {/* 3. SIMPLE CORE FEATURES / OVERVIEW */}
      <section id="features" className="space-y-4 scroll-mt-20">
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold text-campus-text">Core Campus Services</h2>
          <p className="text-xs text-campus-muted">Everything students and faculty need in one straightforward place</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div className="p-4 rounded bg-campus-surface border border-white/[0.08] space-y-1.5">
            <div className="flex items-center space-x-2 font-semibold text-campus-text">
              <Wrench className="w-4 h-4 text-campus-gold" />
              <span>Hostel Maintenance</span>
            </div>
            <p className="text-campus-muted leading-relaxed">Submit complaints with photo evidence and view repair status updates.</p>
          </div>

          <div className="p-4 rounded bg-campus-surface border border-white/[0.08] space-y-1.5">
            <div className="flex items-center space-x-2 font-semibold text-campus-text">
              <DoorOpen className="w-4 h-4 text-campus-gold" />
              <span>Gate Passes</span>
            </div>
            <p className="text-campus-muted leading-relaxed">Warden approval workflow with dynamic QR passes for gate security.</p>
          </div>

          <div className="p-4 rounded bg-campus-surface border border-white/[0.08] space-y-1.5">
            <div className="flex items-center space-x-2 font-semibold text-campus-text">
              <Megaphone className="w-4 h-4 text-campus-gold" />
              <span>Official Notices</span>
            </div>
            <p className="text-campus-muted leading-relaxed">Targeted college announcements and exam registration notices.</p>
          </div>

          <div className="p-4 rounded bg-campus-surface border border-white/[0.08] space-y-1.5">
            <div className="flex items-center space-x-2 font-semibold text-campus-text">
              <Utensils className="w-4 h-4 text-campus-gold" />
              <span>Mess Dining</span>
            </div>
            <p className="text-campus-muted leading-relaxed">Weekly mess menu schedule with daily student meal feedback ratings.</p>
          </div>

          <div className="p-4 rounded bg-campus-surface border border-white/[0.08] space-y-1.5">
            <div className="flex items-center space-x-2 font-semibold text-campus-text">
              <CalendarDays className="w-4 h-4 text-campus-gold" />
              <span>Academic Timetable</span>
            </div>
            <p className="text-campus-muted leading-relaxed">Weekly lecture schedules and real-time class cancellation alerts.</p>
          </div>

          <div className="p-4 rounded bg-campus-surface border border-white/[0.08] space-y-1.5">
            <div className="flex items-center space-x-2 font-semibold text-campus-text">
              <Shield className="w-4 h-4 text-campus-gold" />
              <span>Digital Certificates</span>
            </div>
            <p className="text-campus-muted leading-relaxed">Request Bonafide certificates and fee estimates with direct PDF downloads.</p>
          </div>
        </div>
      </section>

      {/* 4. ROLES OVERVIEW */}
      <section id="roles" className="p-6 rounded-lg bg-campus-card border border-white/[0.08] space-y-4 scroll-mt-20">
        <div className="text-center space-y-1">
          <h2 className="text-base font-bold text-campus-text">Built for Every Campus Role</h2>
          <p className="text-xs text-campus-muted">Access only the tools and data relevant to you</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
          <div className="p-3 bg-campus-surface border border-white/[0.08] rounded space-y-1">
            <span className="font-semibold text-campus-text block">Student</span>
            <span className="text-[11px] text-campus-muted block">Services & Passes</span>
          </div>
          <div className="p-3 bg-campus-surface border border-white/[0.08] rounded space-y-1">
            <span className="font-semibold text-campus-text block">Staff</span>
            <span className="text-[11px] text-campus-muted block">Work Order Queue</span>
          </div>
          <div className="p-3 bg-campus-surface border border-white/[0.08] rounded space-y-1">
            <span className="font-semibold text-campus-text block">Warden</span>
            <span className="text-[11px] text-campus-muted block">Hostels & Approvals</span>
          </div>
          <div className="p-3 bg-campus-surface border border-white/[0.08] rounded space-y-1">
            <span className="font-semibold text-campus-text block">Admin</span>
            <span className="text-[11px] text-campus-muted block">Central Oversight</span>
          </div>
        </div>
      </section>

      {/* 5. GET STARTED CTA */}
      <section className="text-center space-y-3 py-4">
        <h2 className="text-xl font-bold text-campus-text">Ready to get started?</h2>
        <div className="flex items-center justify-center space-x-3">
          <Link
            to="/login"
            className="bg-campus-gold hover:bg-campus-goldLight text-campus-bg px-6 py-2.5 text-xs font-bold rounded shadow-subtle transition-all"
          >
            Sign In Now
          </Link>
          <Link
            to="/register"
            className="px-5 py-2.5 text-xs font-medium rounded border border-white/[0.08] bg-campus-surface hover:bg-white/5 text-campus-text transition-all"
          >
            Register as Student
          </Link>
        </div>
      </section>
    </div>
  );
};
