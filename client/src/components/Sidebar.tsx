import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  GraduationCap,
  Wrench,
  DoorOpen,
  Megaphone,
  Utensils,
  Sparkles,
  Bus,
  Package,
  Files,
  IndianRupee,
  LifeBuoy,
  CircleHelp,
  Terminal,
  BadgeCheck,
  Database,
  LogOut,
  ShieldAlert,
  User,
  Radio,
  Building
} from "lucide-react";
import { UserProfile } from "../api/client.js";
import { ThemeSwitcher } from "./ThemeSwitcher.js";

interface SidebarProps {
  user: UserProfile | null;
  onLogout: () => void;
  onOpenDigitalId?: () => void;
  onCloseMobileDrawer?: () => void;
  onOpenSos?: () => void;
}

interface NavEntry {
  to: string;
  label: string;
  num: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  onLogout,
  onOpenDigitalId,
  onCloseMobileDrawer,
  onOpenSos
}) => {
  const location = useLocation();

  if (!user) return null;

  const role = user.role;
  const isSecurity =
    role === "SECURITY" ||
    (role === "STAFF" && Boolean(user.department?.toLowerCase().includes("security")));

  // Role-Segregated Numbered Navigation Matrix
  const getNavItems = (): NavEntry[] => {
    if (isSecurity) {
      return [
        { to: "/gate-log", label: "Security Gate Log", num: "01", icon: BadgeCheck },
        { to: "/gatepass", label: "Active Gate Passes", num: "02", icon: DoorOpen },
        { to: "/notices", label: "Campus Circulars", num: "03", icon: Megaphone },
        { to: "/help", label: "Emergency Directory", num: "04", icon: LifeBuoy }
      ];
    }

    switch (role) {
      case "FACULTY":
        return [
          { to: "/faculty", label: "Faculty Portal", num: "01", icon: LayoutDashboard },
          { to: "/academics", label: "Schedule & Attendance", num: "02", icon: CalendarDays },
          { to: "/notices", label: "Campus Circulars", num: "03", icon: Megaphone },
          { to: "/help", label: "Emergency Directory", num: "04", icon: LifeBuoy },
          { to: "/faq", label: "Campus FAQ", num: "05", icon: CircleHelp },
          { to: "/console", label: "Offline Console", num: "06", icon: Terminal }
        ];

      case "WARDEN":
        return [
          { to: "/admin", label: "Hostel Operations", num: "01", icon: Building },
          { to: "/gatepass", label: "Gate Passes & Leaves", num: "02", icon: DoorOpen },
          { to: "/tickets", label: "Hostel Complaints", num: "03", icon: Wrench },
          { to: "/mess", label: "Mess Dining Ops", num: "04", icon: Utensils },
          { to: "/gate-log", label: "Security Gate Log", num: "05", icon: BadgeCheck },
          { to: "/notices", label: "Hostel Notices", num: "06", icon: Megaphone },
          { to: "/parcels", label: "Resident Parcels", num: "07", icon: Package },
          { to: "/help", label: "Emergency Directory", num: "08", icon: LifeBuoy }
        ];

      case "STAFF":
        return [
          { to: "/dashboard", label: "Operations Desk", num: "01", icon: LayoutDashboard },
          { to: "/tickets", label: "Work Orders & SLAs", num: "02", icon: Wrench },
          { to: "/parcels", label: "Courier Desk", num: "03", icon: Package },
          { to: "/transport", label: "Fleet & Transport", num: "04", icon: Bus },
          { to: "/notices", label: "Official Circulars", num: "05", icon: Megaphone },
          { to: "/documents", label: "Document Requests", num: "06", icon: Files },
          { to: "/help", label: "Emergency Directory", num: "07", icon: LifeBuoy }
        ];

      case "ADMIN":
        return [
          { to: "/admin", label: "Command Center", num: "01", icon: LayoutDashboard },
          { to: "/academics", label: "Academic Attendance", num: "02", icon: CalendarDays },
          { to: "/gatepass", label: "Gate Passes & Leaves", num: "03", icon: DoorOpen },
          { to: "/gate-log", label: "Security Gate Log", num: "04", icon: BadgeCheck },
          { to: "/tickets", label: "Complaints & SLAs", num: "05", icon: Wrench },
          { to: "/notices", label: "Official Notices", num: "06", icon: Megaphone },
          { to: "/transport", label: "Fleet & Transport", num: "07", icon: Bus },
          { to: "/mess", label: "Mess Operations", num: "08", icon: Utensils },
          { to: "/parcels", label: "Courier Logistics", num: "09", icon: Package },
          { to: "/import", label: "Data Ingestion", num: "10", icon: Database },
          { to: "/documents", label: "Document Issuance", num: "11", icon: Files },
          { to: "/help", label: "Emergency Directory", num: "12", icon: LifeBuoy }
        ];

      case "STUDENT":
      default:
        return [
          { to: "/dashboard", label: "Campus Overview", num: "01", icon: LayoutDashboard },
          { to: "/academics", label: "Academic Attendance", num: "02", icon: CalendarDays },
          { to: "/results", label: "Results & SGPA", num: "03", icon: GraduationCap },
          { to: "/gatepass", label: "Gate Passes & Leaves", num: "04", icon: DoorOpen },
          { to: "/tickets", label: "Complaints & Repair", num: "05", icon: Wrench },
          { to: "/notices", label: "Official Notices", num: "06", icon: Megaphone },
          { to: "/mess", label: "Mess Dining", num: "07", icon: Utensils },
          { to: "/transport", label: "Transport & Bus", num: "08", icon: Bus },
          { to: "/parcels", label: "Courier Parcels", num: "09", icon: Package },
          { to: "/clubs", label: "Clubs & Activities", num: "10", icon: Sparkles },
          { to: "/help", label: "Emergency Directory", num: "11", icon: LifeBuoy }
        ];
    }
  };

  const navItems = getNavItems();

  const getRoleBadge = () => {
    if (isSecurity) {
      return { label: "CAMPUS SECURITY", scope: "MAIN GATE", dot: "bg-emerald-400" };
    }
    switch (role) {
      case "ADMIN":
        return { label: "CENTRAL ADMIN", scope: "FULL CAMPUS", dot: "bg-emerald-400" };
      case "WARDEN":
        return { label: "HOSTEL WARDEN", scope: user.hostelBlock || "ASSIGNED", dot: "bg-[#FF6D1F]" };
      case "FACULTY":
        return { label: "FACULTY", scope: user.department || "ACADEMICS", dot: "bg-blue-400" };
      case "STAFF":
        return { label: "CAMPUS STAFF", scope: user.department || "OPERATIONS", dot: "bg-amber-400" };
      case "STUDENT":
      default:
        return {
          label: "STUDENT",
          scope: user.livingType === "HOSTELLER" ? `${user.hostelBlock || "HOSTEL"} // RESIDENT` : "DAY SCHOLAR",
          dot: user.livingType === "HOSTELLER" ? "bg-[#FF6D1F]" : "bg-emerald-400"
        };
    }
  };

  const roleMeta = getRoleBadge();

  return (
    <aside className="w-64 h-screen bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] flex flex-col justify-between select-none">
      {/* Top Brand & Identity */}
      <div className="p-5 border-b border-[var(--border-subtle)]">
        <Link
          to="/"
          onClick={onCloseMobileDrawer}
          className="flex items-center space-x-2.5 group"
        >
          <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-[#FF6D1F] font-mono font-black text-sm tracking-tighter shadow-sm group-hover:border-[#FF6D1F]/50 transition-colors">
            CD
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight text-[var(--text-primary)] block leading-none font-sans">
              CAMPUS<span className="text-[#FF6D1F]">DESK</span>
            </span>
            <span className="text-[10px] font-mono tracking-widest text-[var(--text-muted)] block mt-1 uppercase">
              CAMPUS OS // v2.6
            </span>
          </div>
        </Link>

        {/* Role Pill */}
        <div className="mt-4 p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${roleMeta.dot} animate-pulse`} />
            <span className="text-[10px] font-mono font-bold tracking-wider text-[var(--text-primary)] uppercase">
              {roleMeta.label}
            </span>
          </div>
          <span className="text-[9px] font-mono text-[var(--text-secondary)] truncate max-w-[90px]" title={roleMeta.scope}>
            {roleMeta.scope}
          </span>
        </div>
      </div>

      {/* Main Numbered Navigation Items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-2 mb-2">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--text-muted)] font-bold">
            Navigation Rail
          </span>
        </div>

        {navItems.map((item) => {
          const isActive = location.pathname === item.to || (item.to !== "/dashboard" && location.pathname.startsWith(item.to));
          const Icon = item.icon;

          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onCloseMobileDrawer}
              className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all relative ${
                isActive
                  ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] font-semibold border-l-2 border-[#FF6D1F]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <span className={`font-mono text-[10px] ${isActive ? "text-[#FF6D1F] font-bold" : "text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]"}`}>
                  {item.num}
                </span>
                <Icon className={`w-4 h-4 ${isActive ? "text-[#FF6D1F]" : "text-[var(--text-muted)] group-hover:text-[var(--text-primary)]"}`} />
                <span className="truncate">{item.label}</span>
              </div>

              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF6D1F]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Emergency SOS & User Footer */}
      <div className="p-3 border-t border-[var(--border-subtle)] space-y-2 bg-[var(--bg-surface)]">
        {/* Emergency SOS Trigger */}
        {role === "STUDENT" && (
          <button
            onClick={() => {
              if (onOpenSos) onOpenSos();
              else {
                window.location.href = "/dashboard?sos=true";
              }
            }}
            className="w-full px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-mono font-bold flex items-center justify-between transition-colors shadow-sm"
          >
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>EMERGENCY SOS</span>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-200">24/7</span>
          </button>
        )}

        {/* Theme Mode Toggle Pill */}
        <div className="flex items-center justify-between px-1 py-1">
          <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest font-semibold">
            THEME
          </span>
          <ThemeSwitcher />
        </div>

        {/* User Dossier Pill */}
        <div className="p-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-between">
          <button
            onClick={onOpenDigitalId}
            className="flex items-center space-x-2.5 text-left group min-w-0"
            title="Open Student Identity Dossier"
          >
            <div className="w-7 h-7 rounded-lg bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)] flex items-center justify-center font-mono font-bold text-xs shrink-0 group-hover:border-[#FF6D1F]/50 transition-colors">
              {user.fullName.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[var(--text-primary)] truncate group-hover:text-[#FF6D1F] transition-colors">
                {user.fullName}
              </p>
              <p className="text-[10px] font-mono text-[var(--text-muted)] truncate">
                {user.rollNumber || user.employeeId || user.email}
              </p>
            </div>
          </button>

          <button
            onClick={onLogout}
            className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-rose-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0"
            title="Log Out of Campus OS"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
