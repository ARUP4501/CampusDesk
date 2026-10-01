import React, { useState, useEffect } from "react";
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
  ChevronDown,
  Sparkles
} from "lucide-react";
import { UserProfile } from "../api/client.js";
import { NotificationInbox } from "./NotificationInbox.js";

interface NavbarProps {
  user: UserProfile | null;
  onLogout: () => void;
  onOpenDigitalId?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout, onOpenDigitalId }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState<boolean>(false);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 12) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const role = user?.role;
  const isAdmin = role === "ADMIN";
  const isWarden = role === "WARDEN";
  const isStaff = role === "STAFF";

  // Primary navigation links for the floating navbar
  const getNavLinks = () => {
    if (isAdmin) {
      return [
        { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
        { to: "/admin", label: "Students", icon: Users },
        { to: "/admin", label: "Staff & Wardens", icon: Shield },
        { to: "/notices", label: "Notices", icon: Megaphone },
        { to: "/tickets", label: "Complaints", icon: Wrench },
        { to: "/import", label: "Data Ingestion", icon: Database }
      ];
    }

    if (isWarden) {
      return [
        { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
        { to: "/admin", label: "Students", icon: Users },
        { to: "/gatepass", label: "Requests", icon: DoorOpen },
        { to: "/notices", label: "Notices", icon: Megaphone },
        { to: "/mess", label: "Mess", icon: Utensils },
        { to: "/tickets", label: "Complaints", icon: Wrench }
      ];
    }

    if (isStaff) {
      return [
        { to: "/tickets", label: "Complaints", icon: Wrench },
        { to: "/academics", label: "Attendance", icon: CalendarDays },
        { to: "/notices", label: "Notices", icon: Megaphone },
        { to: "/gate-log", label: "Security Log", icon: BadgeCheck },
        { to: "/mess", label: "Mess", icon: Utensils }
      ];
    }

    // Default Student Navigation
    return [
      { to: "/", label: "Dashboard", icon: LayoutDashboard },
      { to: "/academics", label: "Attendance", icon: CalendarDays },
      { to: "/notices", label: "Notices", icon: Megaphone },
      { to: "/gatepass", label: "Requests", icon: DoorOpen },
      { to: "/tickets", label: "Complaints", icon: Wrench },
      { to: "/mess", label: "Mess", icon: Utensils }
    ];
  };

  // Secondary "More" links
  const getMoreLinks = () => {
    if (user?.role === "STUDENT") {
      return [
        { to: "/documents", label: "Certificates & Letters", icon: Files },
        { to: "/fees", label: "Fee Statement", icon: IndianRupee },
        { to: "/faq", label: "Database FAQ Assistant", icon: CircleHelp },
        { to: "/console", label: "Offline CLI Console", icon: Terminal }
      ];
    }
    return [
      { to: "/gate-log", label: "Security Scanner", icon: BadgeCheck },
      { to: "/documents", label: "Document Endorsements", icon: Files },
      { to: "/faq", label: "Database FAQ", icon: CircleHelp },
      { to: "/console", label: "Offline CLI Console", icon: Terminal }
    ];
  };

  const navLinks = getNavLinks();
  const moreLinks = getMoreLinks();

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
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="sticky top-0 z-50 px-3 sm:px-8 pt-3.5 pb-2 transition-all duration-300">
      {/* Floating Translucent iOS Glass Navbar Container */}
      <nav
        className={`rounded-2xl max-w-7xl mx-auto px-5 sm:px-8 h-16 sm:h-17.5 flex items-center justify-between transition-all duration-300 ${
          isScrolled ? "glass-navbar-scrolled" : "glass-navbar"
        }`}
      >
        {/* LEFT: Logo Brand */}
        <div className="flex items-center space-x-3.5 sm:space-x-4">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-campus-btnPrimary text-campus-text border border-campus-accent/25 group-hover:border-campus-accent group-hover:scale-105 flex items-center justify-center transition-all duration-200 shadow-sm">
              <Sparkles className="w-4.5 h-4.5 text-campus-text group-hover:rotate-12 transition-transform duration-300" />
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-extrabold tracking-tight text-campus-text flex items-center gap-0.5">
                Campus<span className="text-campus-accent">Desk</span>
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-campus-muted leading-none">
                Smart Campus OS
              </span>
            </div>
          </Link>

          {user && (
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 text-[11px] font-mono uppercase font-semibold rounded-full bg-white/40 border border-campus-border text-campus-secondary">
              {user.role}
            </span>
          )}
        </div>

        {/* CENTER: Main Navigation Links with iOS Subtle Glass Pill Active State */}
        {user ? (
          <div className="hidden lg:flex items-center space-x-1.5 p-1 rounded-2xl bg-black/[0.02] border border-black/[0.04]">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to + item.label}
                  to={item.to}
                  className={`px-3.5 py-2 text-[13px] sm:text-sm rounded-xl flex items-center space-x-2 group transition-all duration-260 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    active ? "nav-pill-active" : "nav-pill-idle"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 transition-transform duration-200 group-hover:-translate-y-0.5 ${
                      active ? "text-campus-text font-bold" : "text-campus-accent/80 group-hover:text-campus-accent"
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* More Dropdown */}
            <div className="relative">
              <button
                onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                onBlur={() => setTimeout(() => setMoreDropdownOpen(false), 220)}
                className={`px-3.5 py-2 text-[13px] sm:text-sm font-medium rounded-xl flex items-center space-x-1.5 transition-all duration-200 ${
                  moreDropdownOpen
                    ? "bg-white/60 text-campus-accent shadow-sm"
                    : "text-campus-secondary hover:text-campus-accent hover:bg-white/40"
                }`}
                aria-expanded={moreDropdownOpen}
              >
                <span>More</span>
                <ChevronDown className={`w-4 h-4 opacity-70 transition-transform duration-200 ${moreDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {moreDropdownOpen && (
                <div className="absolute right-0 mt-2.5 w-60 glass-dropdown rounded-2xl p-2 shadow-elevated z-50 space-y-1 animate-fadeIn">
                  {moreLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setMoreDropdownOpen(false)}
                        className="flex items-center space-x-3 px-3.5 py-2 text-xs sm:text-[13px] text-campus-text hover:text-campus-accent hover:bg-white/60 transition-all rounded-xl group"
                      >
                        <Icon className="w-4 h-4 text-campus-accent/80 group-hover:text-campus-accent group-hover:translate-x-0.5 transition-transform" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Public Guest Links */
          <div className="hidden md:flex items-center space-x-7 text-xs sm:text-sm text-campus-secondary font-medium">
            <button
              onClick={() => scrollToSection("features")}
              className="hover:text-campus-accent transition-colors cursor-pointer py-1.5 px-2.5 rounded-lg hover:bg-white/30"
            >
              Platform
            </button>
            <button
              onClick={() => scrollToSection("roles")}
              className="hover:text-campus-accent transition-colors cursor-pointer py-1.5 px-2.5 rounded-lg hover:bg-white/30"
            >
              Roles
            </button>
            <button
              onClick={() => scrollToSection("resilience")}
              className="hover:text-campus-accent transition-colors cursor-pointer py-1.5 px-2.5 rounded-lg hover:bg-white/30"
            >
              Offline Ready
            </button>
          </div>
        )}

        {/* RIGHT: Notifications + Profile / CTAs */}
        <div className="flex items-center space-x-2.5">
          {user ? (
            <>
              <NotificationInbox />

              <button
                type="button"
                onClick={onOpenDigitalId}
                className={`hidden sm:flex items-center space-x-2.5 pl-2.5 border-l border-campus-border text-left rounded-xl p-1 transition-all ${
                  onOpenDigitalId ? "hover:bg-white/50 cursor-pointer" : ""
                }`}
                title={onOpenDigitalId ? "View Digital ID Dossier" : undefined}
              >
                <div className="w-8 h-8 rounded-full bg-white/50 border border-campus-border flex items-center justify-center text-campus-accent shadow-inner">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex flex-col text-right text-xs">
                  <span className="font-semibold text-campus-text leading-tight">
                    {user.fullName.split(" ")[0]}
                  </span>
                  <span className="text-campus-muted text-[10px] font-mono">
                    {user.rollNumber || user.department || user.role}
                  </span>
                </div>
              </button>

              <button
                onClick={onLogout}
                className="p-2 sm:p-2.5 text-campus-secondary hover:text-campus-danger rounded-xl border border-campus-border bg-white/40 hover:bg-white/70 transition-colors ml-0.5 active:scale-95"
                title="Sign out of CampusDesk"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center space-x-2.5">
              <Link
                to="/login"
                className="btn-secondary px-4 py-2 text-xs sm:text-[13px] rounded-xl transition-all"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="btn-primary px-4 py-2 text-xs sm:text-[13px] rounded-xl transition-all"
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2.5 rounded-xl border border-campus-border bg-white/40 text-campus-secondary hover:text-campus-text active:scale-95 transition-all"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* MOBILE SLIDE-DOWN GLASS SHEET DRAWER */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-2 max-w-7xl mx-auto glass-dropdown rounded-2xl p-4 shadow-elevated animate-fadeIn space-y-3 border border-white/60">
          {user ? (
            <div className="space-y-1.5">
              <div className="p-3 bg-white/40 rounded-xl mb-2 flex items-center justify-between text-xs border border-white/40">
                <div>
                  <p className="font-bold text-campus-text">{user.fullName}</p>
                  <p className="text-campus-muted font-mono text-[11px]">{user.rollNumber || user.department}</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-campus-btnPrimary text-campus-text font-semibold shadow-sm">
                  {user.role}
                </span>
              </div>

              {navLinks.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.to);
                return (
                  <Link
                    key={item.to + item.label}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-[13px] font-medium transition-all ${
                      active
                        ? "bg-campus-btnPrimary text-campus-text font-bold shadow-sm"
                        : "text-campus-secondary hover:text-campus-text hover:bg-white/40"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? "text-campus-text" : "text-campus-accent"}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              <div className="pt-2 border-t border-campus-border">
                <p className="px-3.5 pb-1 text-[10px] font-mono uppercase text-campus-muted font-semibold">More Options</p>
                {moreLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center space-x-3 px-3.5 py-2 rounded-xl text-xs sm:text-[13px] text-campus-secondary hover:text-campus-accent hover:bg-white/40"
                    >
                      <Icon className="w-4 h-4 text-campus-accent" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-1.5 text-xs sm:text-[13px]">
              <button
                onClick={() => scrollToSection("features")}
                className="w-full text-left px-3.5 py-2.5 rounded-xl text-campus-secondary hover:text-campus-text hover:bg-white/40"
              >
                Platform
              </button>
              <button
                onClick={() => scrollToSection("roles")}
                className="w-full text-left px-3.5 py-2.5 rounded-xl text-campus-secondary hover:text-campus-text hover:bg-white/40"
              >
                Roles
              </button>
              <button
                onClick={() => scrollToSection("resilience")}
                className="w-full text-left px-3.5 py-2.5 rounded-xl text-campus-secondary hover:text-campus-text hover:bg-white/40"
              >
                Offline Ready
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;

