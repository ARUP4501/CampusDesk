import React from "react";
import { useLocation } from "react-router-dom";
import { Menu, Bell, Shield, Clock, QrCode, Sparkles } from "lucide-react";
import { UserProfile } from "../api/client.js";
import { NotificationInbox } from "./NotificationInbox.js";
import { ThemeSwitcher } from "./ThemeSwitcher.js";

interface TopbarProps {
  user: UserProfile | null;
  onToggleMobileDrawer: () => void;
  onOpenDigitalId?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  user,
  onToggleMobileDrawer,
  onOpenDigitalId
}) => {
  const location = useLocation();

  if (!user) return null;

  // Resolve human-readable page context
  const getPageTitle = (): { section: string; title: string } => {
    const path = location.pathname;
    if (path === "/" || path === "/dashboard") return { section: "OPERATIONS", title: "CAMPUS OVERVIEW" };
    if (path.startsWith("/faculty")) return { section: "ACADEMICS", title: "FACULTY COMMAND PORTAL" };
    if (path.startsWith("/admin")) return { section: "GOVERNANCE", title: "CAMPUS COMMAND CENTER" };
    if (path.startsWith("/academics")) return { section: "SCHEDULE", title: "ACADEMIC ATTENDANCE & SYNC" };
    if (path.startsWith("/results")) return { section: "EXAMINATIONS", title: "RESULTS & SGPA DOSSIER" };
    if (path.startsWith("/gatepass")) return { section: "SAFETY", title: "GATE PASSES & LEAVE WORKFLOW" };
    if (path.startsWith("/gate-log")) return { section: "SECURITY", title: "CAMPUS GATE ENTRY / EXIT LOG" };
    if (path.startsWith("/tickets")) return { section: "SERVICES", title: "STUDENT COMPLAINTS & REPAIR" };
    if (path.startsWith("/mess")) return { section: "DINING", title: "HOSTEL MESS & MEAL OPERATIONS" };
    if (path.startsWith("/transport")) return { section: "LOGISTICS", title: "CAMPUS BUS FLEET & ROUTES" };
    if (path.startsWith("/notices")) return { section: "DISPATCH", title: "OFFICIAL GAZETTE & NOTICES" };
    if (path.startsWith("/parcels")) return { section: "LOGISTICS", title: "COURIER & PARCEL DESK" };
    if (path.startsWith("/clubs")) return { section: "ENGAGEMENT", title: "STUDENT SOCIETIES & CLUBS" };
    if (path.startsWith("/documents")) return { section: "ADMIN", title: "CERTIFICATES & LETTERS" };
    if (path.startsWith("/fees")) return { section: "FINANCE", title: "STUDENT FEE STATEMENT" };
    if (path.startsWith("/import")) return { section: "SYSTEM", title: "BATCH DATA INGESTION" };
    if (path.startsWith("/help")) return { section: "SAFETY", title: "EMERGENCY & CAMPUS DIRECTORY" };
    if (path.startsWith("/faq")) return { section: "KNOWLEDGE", title: "CAMPUS AI FAQ ASSISTANT" };
    return { section: "CAMPUS OS", title: "CAMPUSDESK PORTAL" };
  };

  const context = getPageTitle();

  return (
    <header className="sticky top-0 z-30 h-14 bg-[var(--bg-elevated)]/90 backdrop-blur-md border-b border-[var(--border-subtle)] flex items-center justify-between px-4 sm:px-6">
      {/* Left: Mobile Toggle & Page Context */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleMobileDrawer}
          className="lg:hidden p-1.5 rounded-lg bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-[#FF6D1F]/50 transition-colors"
          aria-label="Toggle Navigation Rail"
        >
          <Menu className="w-4 h-4 text-[var(--text-primary)]" />
        </button>

        <div className="flex items-baseline space-x-2">
          <span className="editorial-eyebrow text-[#FF6D1F] hidden sm:inline">
            // {context.section}
          </span>
          <span className="text-xs font-mono font-bold tracking-wider text-[var(--text-primary)] uppercase">
            {context.title}
          </span>
        </div>
      </div>

      {/* Right: Curfew Stamp, Theme Switcher, Digital ID, Notifications */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Curfew / Campus Live Stamp */}
        <div className="hidden lg:flex items-center space-x-2 px-3 py-1 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-secondary)]">
          <Clock className="w-3 h-3 text-[#FF6D1F]" />
          <span>EVENING CURFEW: <strong className="text-[var(--text-primary)]">08:30 PM</strong></span>
        </div>

        {/* Theme Mode Switcher */}
        <ThemeSwitcher />

        {/* Digital ID Dossier Shortcut */}
        {onOpenDigitalId && (
          <button
            onClick={onOpenDigitalId}
            className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)] text-xs font-mono font-medium transition-colors"
            title="View Student Identity Dossier"
          >
            <QrCode className="w-3.5 h-3.5 text-[#FF6D1F]" />
            <span className="text-[11px]">DOSSIER</span>
          </button>
        )}

        {/* In-App Notifications Inbox */}
        <NotificationInbox />
      </div>
    </header>
  );
};
