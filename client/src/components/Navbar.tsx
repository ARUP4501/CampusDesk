import React, { useState, useEffect, useRef } from "react";
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
  BadgeCheck,
  Database,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  Bus,
  Package,
  LifeBuoy
} from "lucide-react";
import { UserProfile } from "../api/client.js";
import { NotificationInbox } from "./NotificationInbox.js";

interface NavbarProps {
  user: UserProfile | null;
  onLogout: () => void;
  onOpenDigitalId?: () => void;
}

export interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface RoleNavConfig {
  main: NavItem[];
  more: NavItem[];
}

/**
 * Role-based navigation matrix strictly segregated by role permissions:
 * - STUDENT: Academics/attendance, complaints, gate pass, notices, mess, clubs, transport, parcels, documents, fees, help, FAQ, offline console.
 * - STAFF: Dashboard, assigned complaints/tickets, attendance cancellations/schedules, gate log, official notices, document approvals, courier parcels, fleet transport, help directory, FAQ, console.
 * - WARDEN: Hostel operations, gate pass reviews/approvals, complaints, mess ops, hostel notices, security gate log, resident parcel deliveries, help directory, FAQ, console.
 * - ADMIN: Central governance, complaints oversight, official notices, data ingestion, gate pass reviews, gate log, mess management, document issuance, fleet transport, courier logistics, help directory, FAQ, console.
 */
const ROLE_NAV_CONFIG: Record<string, RoleNavConfig> = {
  STUDENT: {
    main: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/academics", label: "Attendance", icon: CalendarDays },
      { to: "/tickets", label: "Complaints", icon: Wrench },
      { to: "/gatepass", label: "Gate Pass", icon: DoorOpen }
    ],
    more: [
      { to: "/notices", label: "Official Notices", icon: Megaphone },
      { to: "/mess", label: "Mess Dining", icon: Utensils },
      { to: "/clubs", label: "Campus Clubs", icon: Sparkles },
      { to: "/transport", label: "Transport & Bus", icon: Bus },
      { to: "/parcels", label: "Courier Parcels", icon: Package },
      { to: "/documents", label: "Certificates & Letters", icon: Files },
      { to: "/fees", label: "Fee Statement", icon: IndianRupee },
      { to: "/help", label: "Help & Directory", icon: LifeBuoy },
      { to: "/faq", label: "Campus FAQ", icon: CircleHelp },
      { to: "/console", label: "Offline Console", icon: Terminal }
    ]
  },
  STAFF: {
    main: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/tickets", label: "Complaints", icon: Wrench },
      { to: "/academics", label: "Attendance", icon: CalendarDays },
      { to: "/gate-log", label: "Gate Log", icon: BadgeCheck }
    ],
    more: [
      { to: "/notices", label: "Official Circulars", icon: Megaphone },
      { to: "/documents", label: "Document Approvals", icon: Files },
      { to: "/parcels", label: "Courier Parcels", icon: Package },
      { to: "/transport", label: "Transport & Fleet", icon: Bus },
      { to: "/help", label: "Emergency Directory", icon: LifeBuoy },
      { to: "/faq", label: "Campus FAQ", icon: CircleHelp },
      { to: "/console", label: "Offline Console", icon: Terminal }
    ]
  },
  WARDEN: {
    main: [
      { to: "/admin", label: "Hostel Ops", icon: LayoutDashboard },
      { to: "/gatepass", label: "Gate Passes", icon: DoorOpen },
      { to: "/tickets", label: "Complaints", icon: Wrench },
      { to: "/mess", label: "Mess Ops", icon: Utensils }
    ],
    more: [
      { to: "/notices", label: "Hostel Notices", icon: Megaphone },
      { to: "/gate-log", label: "Security Gate Log", icon: BadgeCheck },
      { to: "/parcels", label: "Courier Deliveries", icon: Package },
      { to: "/help", label: "Emergency Directory", icon: LifeBuoy },
      { to: "/faq", label: "Campus FAQ", icon: CircleHelp },
      { to: "/console", label: "Offline Console", icon: Terminal }
    ]
  },
  ADMIN: {
    main: [
      { to: "/admin", label: "Governance", icon: LayoutDashboard },
      { to: "/tickets", label: "Complaints", icon: Wrench },
      { to: "/notices", label: "Notices", icon: Megaphone },
      { to: "/import", label: "Data Ingestion", icon: Database }
    ],
    more: [
      { to: "/gatepass", label: "Gate Passes", icon: DoorOpen },
      { to: "/gate-log", label: "Security Gate Log", icon: BadgeCheck },
      { to: "/mess", label: "Mess Dining", icon: Utensils },
      { to: "/documents", label: "Document Issuance", icon: Files },
      { to: "/transport", label: "Fleet & Transport", icon: Bus },
      { to: "/parcels", label: "Courier Logistics", icon: Package },
      { to: "/help", label: "Emergency Directory", icon: LifeBuoy },
      { to: "/faq", label: "Campus FAQ", icon: CircleHelp },
      { to: "/console", label: "Offline Console", icon: Terminal }
    ]
  }
};

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout, onOpenDigitalId }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState<boolean>(false);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== "undefined" ? window.innerWidth : 1440
  );
  const moreDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Close More dropdown when clicking outside
  useEffect(() => {
    const handlePointerDownOutside = (event: MouseEvent) => {
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(event.target as Node)) {
        setMoreDropdownOpen(false);
      }
    };
    if (moreDropdownOpen) {
      document.addEventListener("mousedown", handlePointerDownOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handlePointerDownOutside);
    };
  }, [moreDropdownOpen]);

  // Close mobile and dropdown menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setMoreDropdownOpen(false);
  }, [location.pathname]);

  const userRole = user?.role || "STUDENT";
  const isDayScholar =
    userRole === "STUDENT" &&
    (user?.livingType === "DAY_SCHOLAR" || (user as any)?.studentType === "DAY_SCHOLAR");

  const baseNavConfig = ROLE_NAV_CONFIG[userRole] || ROLE_NAV_CONFIG.STUDENT;
  const navConfig: RoleNavConfig = isDayScholar
    ? {
        main: [
          { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { to: "/academics", label: "Attendance", icon: CalendarDays },
          { to: "/tickets", label: "Complaints", icon: Wrench },
          { to: "/transport", label: "Transport & Bus", icon: Bus }
        ],
        more: [
          { to: "/notices", label: "Official Notices", icon: Megaphone },
          { to: "/parcels", label: "Courier Parcels", icon: Package },
          { to: "/clubs", label: "Campus Clubs", icon: Sparkles },
          { to: "/documents", label: "Certificates & Letters", icon: Files },
          { to: "/fees", label: "Fee Statement", icon: IndianRupee },
          { to: "/help", label: "Help & Directory", icon: LifeBuoy },
          { to: "/faq", label: "Campus FAQ", icon: CircleHelp },
          { to: "/console", label: "Offline Console", icon: Terminal }
        ]
      }
    : baseNavConfig;

  const navLinks = navConfig.main;
  const moreLinks = navConfig.more;

  // Space-adaptive responsive navigation:
  // When space is constrained on desktop (1024px <= windowWidth < 1280px),
  // collapse the 4th main item into the More dropdown to prevent horizontal overflow.
  const isCompactDesktop = windowWidth >= 1024 && windowWidth < 1280;
  const visibleNavLinks = isCompactDesktop ? navLinks.slice(0, 3) : navLinks;
  const collapsedNavLinks = isCompactDesktop ? navLinks.slice(3) : [];

  // Dropdown items: On compact desktop, prepends any collapsed main links while preserving the shared role config
  const desktopMoreLinks = isCompactDesktop ? [...collapsedNavLinks, ...moreLinks] : moreLinks;

  const isActive = (path: string) => {
    if (path === "/" || path === "/dashboard") {
      return location.pathname === "/" || location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(path);
  };

  const isMoreActive = desktopMoreLinks.some((item) => isActive(item.to));

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
    <header className="sticky top-0 z-50 px-2 sm:px-4 lg:px-6 pt-2.5 pb-2 transition-all duration-300 w-full">
      {/* Floating Translucent iOS Glass Navbar Container */}
      <nav
        className={`rounded-2xl max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 h-16 sm:h-17 flex items-center justify-between gap-2 lg:gap-3 w-full transition-all duration-300 ${
          isScrolled ? "glass-navbar-scrolled" : "glass-navbar"
        }`}
      >
        {/* LEFT: Logo Brand & Role Tag */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0 min-w-0">
          <Link to="/" className="flex items-center space-x-2 sm:space-x-2.5 group shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-campus-btnPrimary text-campus-text border border-campus-accent/25 group-hover:border-campus-accent group-hover:scale-105 flex items-center justify-center transition-all duration-200 shadow-sm shrink-0">
              <Sparkles className="w-4.5 h-4.5 text-campus-text group-hover:rotate-12 transition-transform duration-300" />
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-extrabold tracking-tight text-campus-text flex items-center gap-0.5 leading-none sm:leading-tight">
                Campus<span className="text-campus-accent">Desk</span>
              </span>
              <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-campus-muted leading-none hidden xs:inline-block">
                Smart Campus OS
              </span>
            </div>
          </Link>

          {user && (
            <span className="hidden 2xl:inline-flex items-center px-2 py-0.5 text-[10px] font-mono uppercase font-semibold rounded-full bg-white/40 border border-campus-border text-campus-secondary shrink-0">
              {user.role}
            </span>
          )}
        </div>

        {/* CENTER: Main Navigation Links + Role-based More Dropdown */}
        {user ? (
          <div className="hidden lg:flex items-center space-x-1 p-1 rounded-2xl bg-black/[0.02] border border-black/[0.04] min-w-0 shrink">
            {visibleNavLinks.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to + item.label}
                  to={item.to}
                  className={`px-2.5 xl:px-3 py-1.5 text-xs sm:text-[13px] font-medium rounded-xl flex items-center space-x-1.5 group transition-all duration-200 whitespace-nowrap shrink-0 ${
                    active ? "nav-pill-active font-semibold" : "nav-pill-idle"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5 ${
                      active ? "text-campus-text font-bold" : "text-campus-accent/80 group-hover:text-campus-accent"
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* Role-based More Dropdown */}
            <div className="relative shrink-0" ref={moreDropdownRef}>
              <button
                type="button"
                onClick={() => setMoreDropdownOpen((prev) => !prev)}
                className={`px-2.5 xl:px-3 py-1.5 text-xs sm:text-[13px] font-medium rounded-xl flex items-center space-x-1 transition-all duration-200 whitespace-nowrap ${
                  moreDropdownOpen || isMoreActive
                    ? "bg-white/60 text-campus-accent shadow-sm font-semibold"
                    : "text-campus-secondary hover:text-campus-accent hover:bg-white/40"
                }`}
                aria-expanded={moreDropdownOpen}
                aria-haspopup="true"
                id="more-nav-dropdown-btn"
              >
                <span>More</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 opacity-70 transition-transform duration-200 ${
                    moreDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {moreDropdownOpen && (
                <div
                  className="absolute right-0 mt-2.5 w-64 max-h-[75vh] overflow-y-auto glass-dropdown rounded-2xl p-2 shadow-elevated z-50 space-y-1 animate-fadeIn border border-white/60"
                  role="menu"
                  aria-orientation="vertical"
                >
                  <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-campus-muted border-b border-campus-border/40 mb-1 flex items-center justify-between">
                    <span>{userRole} Modules</span>
                    <span className="text-[9px] font-semibold">{desktopMoreLinks.length} items</span>
                  </div>
                  {desktopMoreLinks.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.to);
                    return (
                      <Link
                        key={item.to + item.label}
                        to={item.to}
                        onClick={() => setMoreDropdownOpen(false)}
                        className={`flex items-center space-x-3 px-3 py-2 text-xs sm:text-[13px] transition-all rounded-xl group ${
                          active
                            ? "bg-campus-btnPrimary text-campus-text font-semibold shadow-sm"
                            : "text-campus-text hover:text-campus-accent hover:bg-white/60"
                        }`}
                        role="menuitem"
                      >
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-transform ${
                            active
                              ? "text-campus-text"
                              : "text-campus-accent/80 group-hover:text-campus-accent group-hover:translate-x-0.5"
                          }`}
                        />
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
          <div className="hidden md:flex items-center space-x-4 lg:space-x-6 text-xs sm:text-sm text-campus-secondary font-medium shrink-0">
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

        {/* RIGHT: Notifications + Profile + Guaranteed Viewport Visible Logout */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0 ml-auto">
          {user ? (
            <>
              <NotificationInbox user={user} />

              <button
                type="button"
                onClick={onOpenDigitalId}
                className={`hidden sm:flex items-center space-x-2 pl-2 border-l border-campus-border text-left rounded-xl p-1 transition-all shrink min-w-0 ${
                  onOpenDigitalId ? "hover:bg-white/50 cursor-pointer" : ""
                }`}
                title={onOpenDigitalId ? "View Digital ID Dossier" : undefined}
                aria-label="View Profile Dossier"
              >
                <div className="w-8 h-8 rounded-full bg-white/50 border border-campus-border flex items-center justify-center text-campus-accent shadow-inner shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex flex-col text-right text-xs min-w-0 max-w-[80px] sm:max-w-[95px] xl:max-w-[125px]">
                  <span className="font-semibold text-campus-text leading-tight truncate">
                    {user.fullName.split(" ")[0]}
                  </span>
                  <span className="text-campus-muted text-[10px] font-mono truncate hidden md:block">
                    {user.rollNumber || user.department || user.role}
                  </span>
                </div>
              </button>

              <button
                onClick={onLogout}
                className="p-2 sm:p-2.5 text-campus-secondary hover:text-campus-danger rounded-xl border border-campus-border bg-white/40 hover:bg-white/70 transition-colors shrink-0 active:scale-95"
                title="Sign out of CampusDesk"
                aria-label="Sign out"
                id="navbar-logout-btn"
              >
                <LogOut className="w-4 h-4 shrink-0" />
              </button>
            </>
          ) : (
            <div className="flex items-center space-x-2 shrink-0">
              <Link
                to="/login"
                className="btn-secondary px-3 sm:px-3.5 py-1.5 text-xs sm:text-[13px] rounded-xl transition-all whitespace-nowrap"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="btn-primary px-3 sm:px-3.5 py-1.5 text-xs sm:text-[13px] rounded-xl transition-all whitespace-nowrap"
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 sm:p-2.5 rounded-xl border border-campus-border bg-white/40 text-campus-secondary hover:text-campus-text active:scale-95 transition-all shrink-0"
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
                <div className="max-w-[200px] truncate">
                  <p className="font-bold text-campus-text truncate">{user.fullName}</p>
                  <p className="text-campus-muted font-mono text-[11px] truncate">{user.rollNumber || user.department}</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-campus-btnPrimary text-campus-text font-semibold shadow-sm shrink-0">
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
                <p className="px-3.5 pb-1 text-[10px] font-mono uppercase text-campus-muted font-semibold">
                  {user.role} Services
                </p>
                <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                  {moreLinks.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.to);
                    return (
                      <Link
                        key={item.to + item.label}
                        to={item.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center space-x-3 px-3.5 py-2 rounded-xl text-xs sm:text-[13px] transition-all ${
                          active
                            ? "bg-campus-btnPrimary text-campus-text font-semibold"
                            : "text-campus-secondary hover:text-campus-accent hover:bg-white/40"
                        }`}
                      >
                        <Icon className="w-4 h-4 text-campus-accent shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Mobile Explicit Sign Out Button */}
              <div className="pt-2 border-t border-campus-border">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-[13px] font-semibold text-campus-danger bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all active:scale-[0.99]"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
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
