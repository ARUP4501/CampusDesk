import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  CalendarDays,
  Megaphone,
  DoorOpen,
  Utensils,
  Wrench,
  User,
  Files,
  IndianRupee,
  CircleHelp,
  Terminal,
  Shield,
  Users,
  BadgeCheck,
  Database,
  LogOut,
  Menu,
  X,
  LayoutGrid
} from "lucide-react";
import { UserProfile } from "../api/client.js";
import { LanguageSwitcher } from "./LanguageSwitcher.js";
import { NotificationInbox } from "./NotificationInbox.js";

interface NavbarProps {
  user: UserProfile | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const role = user?.role;
  const isAdmin = role === "ADMIN";
  const isWarden = role === "WARDEN";
  const isStaff = role === "STAFF";

  // 1. Primary Navigation (Clean 6-7 items per role)
  const getPrimaryNav = () => {
    if (isAdmin) {
      return [
        { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
        { to: "/admin", label: "Students", icon: Users },
        { to: "/admin", label: "Wardens & Staff", icon: Shield },
        { to: "/notices", label: "Notices", icon: Megaphone },
        { to: "/tickets", label: "Complaints", icon: Wrench },
        { to: "/import", label: "Data Ingestion", icon: Database }
      ];
    }

    if (isWarden) {
      return [
        { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
        { to: "/admin", label: "Students", icon: Users },
        { to: "/gatepass", label: "Gate Passes", icon: DoorOpen },
        { to: "/notices", label: "Notices", icon: Megaphone },
        { to: "/mess", label: "Mess Schedule", icon: Utensils },
        { to: "/tickets", label: "Complaints", icon: Wrench }
      ];
    }

    if (isStaff) {
      return [
        { to: "/tickets", label: "Work Orders", icon: Wrench },
        { to: "/academics", label: "Classes", icon: CalendarDays },
        { to: "/notices", label: "Notices", icon: Megaphone },
        { to: "/gate-log", label: "Security Log", icon: BadgeCheck },
        { to: "/mess", label: "Mess Menu", icon: Utensils }
      ];
    }

    // Student Primary Nav
    return [
      { to: "/", label: "Dashboard", icon: LayoutDashboard },
      { to: "/academics", label: "Attendance & Classes", icon: CalendarDays },
      { to: "/notices", label: "Notices", icon: Megaphone },
      { to: "/gatepass", label: "Requests & Passes", icon: DoorOpen },
      { to: "/mess", label: "Mess Menu", icon: Utensils },
      { to: "/tickets", label: "Complaints", icon: Wrench }
    ];
  };

  // 2. Secondary "More" Options
  const getSecondaryNav = () => {
    if (user?.role === "STUDENT") {
      return [
        { to: "/documents", label: "Certificates & Letters", icon: Files },
        { to: "/fees", label: "Fee Status", icon: IndianRupee },
        { to: "/faq", label: "Database FAQ", icon: CircleHelp },
        { to: "/console", label: "Offline CLI Console", icon: Terminal }
      ];
    }
    return [
      { to: "/gate-log", label: "Gate Security Log", icon: BadgeCheck },
      { to: "/documents", label: "Document Endorsements", icon: Files },
      { to: "/faq", label: "Database FAQ", icon: CircleHelp },
      { to: "/console", label: "Offline CLI Console", icon: Terminal }
    ];
  };

  const primaryLinks = getPrimaryNav();
  const secondaryLinks = getSecondaryNav();

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const scrollToSection = (sectionId: string) => {
    setMobileMenuOpen(false);
    if (location.pathname !== "/") {
      navigate(`/#${sectionId}`);
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 150);
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <>
      {/* TOP BAR (Clean & Minimal) */}
      <header className="glass-top-bar sticky top-0 z-40 h-14 flex items-center justify-between px-4 sm:px-6">
        {/* Left: Brand & Mobile Toggle */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 border border-white/[0.08] rounded bg-campus-surface text-campus-secondary hover:text-campus-text"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          <Link to="/" className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded bg-campus-card border border-white/[0.08] flex items-center justify-center text-campus-gold">
              <LayoutGrid className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-campus-text">
              CAMPUS<span className="text-campus-gold">DESK</span>
            </span>
          </Link>

          {user && (
            <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono uppercase font-medium rounded bg-white/5 border border-white/[0.08] text-campus-secondary">
              {user.role}
            </span>
          )}
        </div>

        {/* Center: Unauthenticated Guest Links (Interactive & Working) */}
        {!user && (
          <nav className="hidden md:flex items-center space-x-6 text-xs text-campus-secondary font-medium">
            <button
              onClick={() => scrollToSection("features")}
              className="hover:text-campus-text transition-colors cursor-pointer"
            >
              Overview
            </button>
            <button
              onClick={() => scrollToSection("roles")}
              className="hover:text-campus-text transition-colors cursor-pointer"
            >
              Roles
            </button>
            <button
              onClick={() => scrollToSection("resilience")}
              className="hover:text-campus-text transition-colors cursor-pointer"
            >
              Offline Support
            </button>
          </nav>
        )}

        {/* Right Tools: Language, Inbox, Login / Profile */}
        <div className="flex items-center space-x-2.5">
          <LanguageSwitcher />

          {user ? (
            <>
              <NotificationInbox />
              
              <div className="hidden sm:flex items-center space-x-2 pl-2 border-l border-white/[0.08]">
                <div className="flex flex-col text-right text-xs">
                  <span className="font-medium text-campus-text leading-tight">{user.fullName.split(" ")[0]}</span>
                  <span className="text-campus-muted text-[10px] font-mono">{user.rollNumber || user.department || user.role}</span>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="p-1.5 text-campus-muted hover:text-campus-danger border border-white/[0.08] rounded bg-campus-surface hover:bg-white/5 transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="text-xs font-medium text-campus-secondary hover:text-campus-text px-3 py-1.5 border border-white/[0.08] rounded bg-campus-surface hover:bg-campus-card transition-all"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-xs font-semibold text-campus-bg bg-campus-gold hover:bg-campus-goldLight px-3.5 py-1.5 rounded transition-all"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* SIMPLE FIXED LEFT SIDEBAR (FOR AUTHENTICATED USERS) */}
      {user && (
        <aside className="hidden lg:flex flex-col fixed left-0 top-14 bottom-0 w-60 z-30 glass-nav-rail border-r border-white/[0.08] bg-[#0A0D10]/95">
          {/* Main Primary Navigation Links */}
          <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
            <div className="px-3 pb-2 text-[10px] font-mono text-campus-muted uppercase tracking-wider">
              Menu
            </div>

            {primaryLinks.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to + item.label}
                  to={item.to}
                  className={`flex items-center space-x-3 px-3 py-2 rounded text-xs font-medium transition-colors ${
                    active
                      ? "bg-campus-gold/15 text-campus-goldLight border border-campus-gold/30"
                      : "text-campus-secondary hover:text-campus-text hover:bg-white/5"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? "text-campus-gold" : "text-campus-muted"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* More / Secondary Section */}
            <div className="pt-4 mt-4 border-t border-white/[0.08]">
              <div className="px-3 pb-2 text-[10px] font-mono text-campus-muted uppercase tracking-wider flex items-center justify-between">
                <span>More Services</span>
              </div>

              {secondaryLinks.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.to);
                return (
                  <Link
                    key={item.to + item.label}
                    to={item.to}
                    className={`flex items-center space-x-3 px-3 py-1.5 rounded text-xs transition-colors ${
                      active
                        ? "bg-campus-gold/15 text-campus-goldLight"
                        : "text-campus-muted hover:text-campus-text hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 text-campus-muted" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Sidebar Footer / User Capsule */}
          <div className="p-3 border-t border-white/[0.08] bg-campus-surface/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5 overflow-hidden">
                <div className="w-7 h-7 rounded bg-campus-elevated border border-white/[0.08] flex items-center justify-center text-campus-gold shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="truncate text-xs">
                  <p className="font-medium text-campus-text truncate leading-tight">{user.fullName}</p>
                  <p className="text-[10px] font-mono text-campus-muted truncate">{user.rollNumber || user.role}</p>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="p-1.5 text-campus-muted hover:text-campus-danger rounded hover:bg-white/5 transition-colors shrink-0"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* MOBILE DRAWER (SIMPLE & DIRECT) */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-[#0D1013] border-t border-white/[0.1] rounded-t-xl p-5 max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center space-x-2">
                <LayoutGrid className="w-4 h-4 text-campus-gold" />
                <span className="font-semibold text-sm text-campus-text">CampusDesk Portal</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded text-campus-muted hover:text-campus-text"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {user ? (
              <div className="space-y-1">
                {primaryLinks.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.to);
                  return (
                    <Link
                      key={item.to + item.label}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-3 py-2.5 rounded text-xs font-medium transition-colors ${
                        active
                          ? "bg-campus-gold/15 text-campus-goldLight border border-campus-gold/30"
                          : "text-campus-secondary hover:text-campus-text hover:bg-white/5"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${active ? "text-campus-gold" : "text-campus-muted"}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}

                <div className="pt-3 border-t border-white/[0.08]">
                  <p className="px-3 pb-1 text-[10px] font-mono text-campus-muted uppercase">More Services</p>
                  {secondaryLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.to + item.label}
                        to={item.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center space-x-3 px-3 py-2 rounded text-xs text-campus-muted hover:text-campus-text hover:bg-white/5"
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                <button
                  onClick={() => scrollToSection("features")}
                  className="w-full text-left px-3 py-2 text-campus-secondary hover:text-campus-text rounded cursor-pointer"
                >
                  Overview
                </button>
                <button
                  onClick={() => scrollToSection("roles")}
                  className="w-full text-left px-3 py-2 text-campus-secondary hover:text-campus-text rounded cursor-pointer"
                >
                  Roles
                </button>
                <button
                  onClick={() => scrollToSection("resilience")}
                  className="w-full text-left px-3 py-2 text-campus-secondary hover:text-campus-text rounded cursor-pointer"
                >
                  Offline Support
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
