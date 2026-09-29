import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Wrench,
  QrCode,
  Bell,
  Calendar,
  Utensils,
  FileText,
  CreditCard,
  HelpCircle,
  Terminal,
  BarChart2,
  Shield,
  Upload,
  LogOut,
  Menu,
  X,
  Megaphone
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const role = user?.role;
  const isAdmin = role === "ADMIN";
  const isWarden = role === "WARDEN";
  const isStaff = role === "STAFF";
  const isStudent = role === "STUDENT";

  // Build role-tailored primary navigation links
  const getNavLinks = () => {
    if (isAdmin) {
      return [
        { to: "/admin", label: "Admin Oversight", icon: BarChart2 },
        { to: "/notices", label: "Official Notices", icon: Megaphone },
        { to: "/tickets", label: "Complaints", icon: Wrench },
        { to: "/gatepass", label: "Gate Passes", icon: QrCode },
        { to: "/mess", label: "Mess Menu", icon: Utensils },
        { to: "/gate-log", label: "Security Log", icon: Shield },
        { to: "/import", label: "Data Migration", icon: Upload }
      ];
    }

    if (isWarden) {
      return [
        { to: "/admin", label: "Warden Dashboard", icon: BarChart2 },
        { to: "/notices", label: "Official Notices", icon: Megaphone },
        { to: "/gatepass", label: "Gate Pass Reviews", icon: QrCode },
        { to: "/tickets", label: "Hostel Complaints", icon: Wrench },
        { to: "/mess", label: "Mess Menu", icon: Utensils },
        { to: "/gate-log", label: "Security Log", icon: Shield }
      ];
    }

    if (isStaff) {
      return [
        { to: "/tickets", label: "Assigned Work Orders", icon: Wrench },
        { to: "/notices", label: "Official Notices", icon: Megaphone },
        { to: "/academics", label: "Class Schedules", icon: Calendar },
        { to: "/gate-log", label: "Gate Security Log", icon: Shield },
        { to: "/mess", label: "Mess Menu", icon: Utensils },
        { to: "/console", label: "Command Console", icon: Terminal }
      ];
    }

    // Student Links
    return [
      { to: "/tickets", label: t("nav.complaints", "Complaints"), icon: Wrench },
      { to: "/gatepass", label: t("nav.gatepass", "Gate Pass"), icon: QrCode },
      { to: "/notices", label: "Official Notices", icon: Megaphone },
      { to: "/academics", label: "Timetable & Classes", icon: Calendar },
      { to: "/mess", label: t("nav.mess", "Mess Menu"), icon: Utensils },
      { to: "/documents", label: t("nav.documents", "Documents"), icon: FileText },
      { to: "/fees", label: t("nav.fees", "Fees"), icon: CreditCard },
      { to: "/faq", label: t("nav.faq", "FAQ"), icon: HelpCircle },
      { to: "/console", label: t("nav.console", "Console"), icon: Terminal }
    ];
  };

  const navLinks = getNavLinks();
  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-white border-b border-stone-300 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2 font-bold text-stone-900 tracking-tight text-lg">
              <div className="w-8 h-8 bg-[#0f4c3a] text-white flex items-center justify-center font-bold text-sm rounded-[4px]">
                CD
              </div>
              <span>CampusDesk</span>
            </Link>

            {user && (
              <span className={`hidden md:inline-block px-2 py-0.5 text-xs font-semibold rounded-[4px] border ${
                isAdmin
                  ? "bg-purple-50 text-purple-900 border-purple-200"
                  : isWarden
                  ? "bg-amber-50 text-amber-900 border-amber-200"
                  : isStaff
                  ? "bg-blue-50 text-blue-900 border-blue-200"
                  : "bg-stone-100 text-stone-700 border-stone-300"
              }`}>
                {user.role}
              </span>
            )}
          </div>

          {/* Desktop Navigation Links */}
          {user && (
            <nav className="hidden lg:flex items-center space-x-1" aria-label="Main Navigation">
              {navLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-[4px] flex items-center space-x-1.5 transition-colors ${
                      isActive(item.to)
                        ? "bg-[#0f4c3a] text-white"
                        : "text-stone-700 hover:bg-stone-100"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right Tools: Language, Inbox, Profile/Logout */}
          <div className="flex items-center space-x-2">
            <LanguageSwitcher />

            {user ? (
              <>
                <NotificationInbox />
                <div className="hidden sm:flex flex-col text-right text-xs">
                  <span className="font-semibold text-stone-900 leading-tight">{user.fullName}</span>
                  <span className="text-stone-500 text-[10px]">{user.rollNumber || user.department || user.email}</span>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1.5 text-stone-700 hover:text-stone-900 border border-stone-300 rounded-[4px] bg-white hover:bg-stone-100 focus:outline-none"
                  aria-label="Log out"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="text-xs font-medium text-stone-700 hover:text-stone-900 px-3 py-1.5 border border-stone-300 rounded-[4px]"
                >
                  {t("nav.login", "Sign In")}
                </Link>
                <Link
                  to="/register"
                  className="text-xs font-semibold text-white bg-[#0f4c3a] hover:bg-[#0b392b] px-3 py-1.5 rounded-[4px]"
                >
                  {t("nav.register", "Register")}
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            {user && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-1.5 border border-stone-300 rounded-[4px] text-stone-700"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && user && (
        <div className="lg:hidden border-t border-stone-200 bg-stone-50 px-4 pt-2 pb-4 space-y-1">
          <div className="py-2 border-b border-stone-200 text-xs font-semibold text-stone-800">
            {user.fullName} ({user.role})
          </div>
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-[4px] ${
                  isActive(item.to) ? "bg-[#0f4c3a] text-white" : "text-stone-700 hover:bg-stone-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
};
