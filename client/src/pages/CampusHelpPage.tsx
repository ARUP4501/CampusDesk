import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LifeBuoy,
  Phone,
  Mail,
  MapPin,
  Clock,
  Search,
  Building,
  HeartPulse,
  Laptop,
  Shield,
  CreditCard,
  FileText,
  Bus,
  Wrench,
  ChevronRight,
  ShieldAlert,
  PhoneCall,
  Copy,
  Check,
  Flame,
  Radio,
  Sparkles,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Users,
  Compass
} from "lucide-react";
import { apiRequest, UserProfile } from "../api/client.js";

interface WardenContact {
  name: string;
  block: string;
  phone: string;
  email: string;
}

interface DirectoryEntry {
  id: string;
  department: string;
  title?: string;
  category: string;
  officeLocation: string;
  workingHours: string;
  contactPerson: string;
  contactPhone: string;
  phone?: string;
  contactEmail: string;
  email?: string;
  description: string;
  actionType?: string;
  actionLabel?: string;
  actionUrl?: string;
  actionLink?: string;
  icon?: string;
  isEmergency?: boolean;
  priority?: number;
  wardens?: WardenContact[];
}

interface Hotline {
  id: string;
  name: string;
  role: string;
  phone: string;
  directDial: string;
  altPhone?: string;
  badge: string;
  type: string;
}

export const CampusHelpPage: React.FC<{ user: UserProfile | null }> = ({ user }) => {
  const navigate = useNavigate();
  const [directory, setDirectory] = useState<DirectoryEntry[]>([]);
  const [hotlines, setHotlines] = useState<Hotline[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // SOS Emergency Beacon state (For Students)
  const [showSosModal, setShowSosModal] = useState<boolean>(false);
  const [sosCategory, setSosCategory] = useState<string>("MEDICAL");
  const [sosLocation, setSosLocation] = useState<string>("");
  const [sosDescription, setSosDescription] = useState<string>("");
  const [sosSubmitting, setSosSubmitting] = useState<boolean>(false);
  const [sosSuccess, setSosSuccess] = useState<string | null>(null);
  const [sosError, setSosError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDir = async () => {
      try {
        setLoading(true);
        const res = await apiRequest<{
          directory?: DirectoryEntry[];
          services?: DirectoryEntry[];
          hotlines?: Hotline[];
        }>("/api/directory");

        const list = res.directory || res.services || [];
        setDirectory(list);

        if (res.hotlines && res.hotlines.length > 0) {
          setHotlines(res.hotlines);
        } else {
          // Fallback initial hotlines if not populated
          setHotlines([
            {
              id: "hl_security",
              name: "Campus Security Command",
              role: "24/7 Perimeter & Main Gate",
              phone: "1800-CAMPUS",
              directDial: "tel:1800CAMPUS",
              badge: "24/7 ACTIVE",
              type: "SECURITY"
            },
            {
              id: "hl_medical",
              name: "Health Center & Ambulance",
              role: "Emergency Medical Dispatch",
              phone: "Ext. 108",
              directDial: "tel:+919861100099",
              badge: "EMERGENCY",
              type: "MEDICAL"
            },
            {
              id: "hl_women",
              name: "Women's Safety Hotline",
              role: "Internal Complaints Cell",
              phone: "+91 98610 03001",
              directDial: "tel:+919861003001",
              badge: "CONFIDENTIAL",
              type: "SAFETY"
            },
            {
              id: "hl_warden",
              name: "Chief Warden Operations",
              role: "Hostel Emergency Desk",
              phone: "+91 98610 01001",
              directDial: "tel:+919861001001",
              badge: "RESIDENTIAL",
              type: "HOSTEL"
            }
          ]);
        }
      } catch (err) {
        console.error("Failed to load emergency directory:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDir();
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTriggerSos = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSosSubmitting(true);
      setSosError(null);

      const res = await apiRequest<{ message: string; emergency: any }>("/api/emergencies", {
        method: "POST",
        body: JSON.stringify({
          category: sosCategory,
          location: sosLocation || undefined,
          description: sosDescription || undefined
        })
      });

      setSosSuccess(
        `Emergency Beacon #${res.emergency?.alertNumber || "SOS"} transmitted to Campus Security & Warden Desk!`
      );
      setTimeout(() => {
        setShowSosModal(false);
        setSosSuccess(null);
        navigate("/dashboard");
      }, 2500);
    } catch (err: any) {
      setSosError(err.message || "Failed to transmit emergency beacon. Please call 1800-CAMPUS directly.");
    } finally {
      setSosSubmitting(false);
    }
  };

  const categories = [
    { key: "ALL", label: "All Directory" },
    { key: "EMERGENCY", label: "🚨 Critical Hotlines" },
    { key: "SECURITY", label: "Perimeter & Security" },
    { key: "MEDICAL", label: "Health & Ambulance" },
    { key: "HOSTEL", label: "Hostels & Wardens" },
    { key: "MAINTENANCE", label: "Utilities & Outages" },
    { key: "ACADEMIC", label: "Academics & Exams" },
    { key: "FINANCE", label: "Finance & Accounts" },
    { key: "IT", label: "IT & Wi-Fi NOC" },
    { key: "TRANSPORT", label: "Transit & Buses" }
  ];

  const getCategoryIcon = (category: string, isEmergency?: boolean) => {
    if (isEmergency) return <ShieldAlert className="w-5 h-5 text-rose-500" />;
    switch (category) {
      case "SECURITY":
        return <Shield className="w-5 h-5 text-amber-500" />;
      case "MEDICAL":
        return <HeartPulse className="w-5 h-5 text-rose-500" />;
      case "HOSTEL":
        return <Building className="w-5 h-5 text-[#FF6D1F]" />;
      case "MAINTENANCE":
        return <Wrench className="w-5 h-5 text-amber-600" />;
      case "ACADEMIC":
        return <FileText className="w-5 h-5 text-blue-500" />;
      case "FINANCE":
        return <CreditCard className="w-5 h-5 text-emerald-500" />;
      case "IT":
        return <Laptop className="w-5 h-5 text-[#FF6D1F]" />;
      case "TRANSPORT":
        return <Bus className="w-5 h-5 text-sky-500" />;
      default:
        return <LifeBuoy className="w-5 h-5 text-[#FF6D1F]" />;
    }
  };

  const filteredDirectory = directory.filter((item) => {
    const cat = item.category?.toUpperCase() || "";
    const matchesCat =
      selectedCategory === "ALL"
        ? true
        : selectedCategory === "EMERGENCY"
        ? item.isEmergency || cat.includes("SECURITY") || cat.includes("MEDICAL")
        : cat.includes(selectedCategory);

    const title = (item.department || item.title || "").toLowerCase();
    const desc = (item.description || "").toLowerCase();
    const person = (item.contactPerson || "").toLowerCase();
    const phone = (item.contactPhone || item.phone || "").toLowerCase();
    const email = (item.contactEmail || item.email || "").toLowerCase();
    const loc = (item.officeLocation || "").toLowerCase();
    const q = searchQuery.toLowerCase().trim();

    const matchesSearch =
      !q ||
      title.includes(q) ||
      desc.includes(q) ||
      person.includes(q) ||
      phone.includes(q) ||
      email.includes(q) ||
      loc.includes(q);

    return matchesCat && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* 1. Header Banner & Quick Role Escalation */}
      <div className="campus-block p-6 sm:p-8 relative overflow-hidden border border-[var(--border-subtle)]">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FF6D1F]/15 text-[#FF6D1F] border border-[#FF6D1F]/30 uppercase tracking-wider">
                Emergency & Service Directory
              </span>
              <span className="text-xs font-mono text-[var(--text-muted)] flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>24/7 Response Active</span>
              </span>
            </div>

            <h1 className="editorial-title text-2xl sm:text-3xl text-[var(--text-primary)]">
              Campus Emergency & Department Directory
            </h1>

            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              Direct access lines, emergency speed-dials, working hours, and departmental contacts for campus security, health crises, hostel wardens, power & water works, and academic administration.
            </p>
          </div>

          {/* Role-governed Primary Action */}
          <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-2.5">
            {user?.role === "STUDENT" && (
              <button
                onClick={() => setShowSosModal(true)}
                className="px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-mono font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-rose-600/20 transition-all hover:scale-[1.02]"
              >
                <ShieldAlert className="w-4 h-4 animate-pulse" />
                <span>DISPATCH EMERGENCY SOS BEACON</span>
              </button>
            )}

            {(user?.role === "ADMIN" || user?.role === "WARDEN") && (
              <Link
                to="/admin?tab=emergencies"
                className="px-5 py-3 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 font-mono font-bold text-xs flex items-center justify-center space-x-2 transition-all"
              >
                <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
                <span>LIVE EMERGENCY RESPONDER ROOM</span>
              </Link>
            )}

            <a
              href="tel:1800CAMPUS"
              className="px-5 py-2.5 rounded-2xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] font-mono font-semibold text-xs flex items-center justify-center space-x-2 transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5 text-[#FF6D1F]" />
              <span>MAIN SECURITY DESK: 1800-CAMPUS</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. Emergency Rapid Speed-Dial Strip */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Flame className="w-4 h-4 text-rose-500" />
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Immediate Emergency Speed-Dial Hotlines
            </h2>
          </div>
          <span className="text-[11px] font-mono text-[var(--text-muted)]">Tap to call instantly</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {hotlines.map((hl) => (
            <div
              key={hl.id}
              className="campus-block p-4 border border-[var(--border-subtle)] hover:border-rose-500/40 transition-all flex flex-col justify-between space-y-3 group"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                      hl.type === "SECURITY" || hl.type === "MEDICAL"
                        ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                        : "bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-subtle)]"
                    }`}
                  >
                    {hl.badge}
                  </span>
                  <button
                    onClick={() => copyToClipboard(hl.phone, hl.id)}
                    title="Copy phone number"
                    className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 transition-colors"
                  >
                    {copiedId === hl.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 opacity-60 hover:opacity-100" />
                    )}
                  </button>
                </div>

                <h3 className="font-bold text-xs text-[var(--text-primary)] group-hover:text-[#FF6D1F] transition-colors leading-tight">
                  {hl.name}
                </h3>
                <p className="text-[11px] text-[var(--text-muted)] leading-tight">{hl.role}</p>
              </div>

              <a
                href={hl.directDial}
                className="w-full py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-mono font-bold flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Phone className="w-3 h-3" />
                <span>{hl.phone}</span>
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Search Bar & Category Filter Pills */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search departments, wardens, emergency services, Wi-Fi, fees, medical, bus routes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: "2.75rem" }}
              className="w-full !pl-11 pr-4 py-2.5 border border-[var(--border-subtle)] rounded-2xl bg-[var(--bg-input)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF6D1F] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] font-mono"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap transition-all ${
                selectedCategory === cat.key
                  ? "bg-[#FF6D1F] text-black font-bold shadow-sm"
                  : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] font-medium"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Directory Grid */}
      {loading ? (
        <div className="campus-block p-16 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#FF6D1F]/30 border-t-[#FF6D1F] rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-mono text-[var(--text-muted)]">Querying campus emergency directory...</p>
        </div>
      ) : filteredDirectory.length === 0 ? (
        <div className="campus-block p-12 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-[var(--text-muted)] mx-auto opacity-50" />
          <h3 className="font-mono text-sm font-bold text-[var(--text-primary)]">No directory entries matched</h3>
          <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
            Try searching with broader terms (e.g., "warden", "security", "health", "exam") or reset the filter.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("ALL");
            }}
            className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[#FF6D1F] border border-[var(--border-subtle)]"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDirectory.map((item) => {
            const title = item.department || item.title || "Campus Department";
            const phone = item.contactPhone || item.phone || "N/A";
            const email = item.contactEmail || item.email || "info@campusdesk.edu";
            const actionUrl = item.actionUrl || item.actionLink;
            const actionLabel = item.actionType || item.actionLabel || "Open Department";
            const isCritical = item.isEmergency;

            return (
              <div
                key={item.id}
                className={`campus-block p-5 flex flex-col justify-between space-y-4 border transition-all ${
                  isCritical
                    ? "border-rose-500/40 hover:border-rose-500/70 shadow-sm"
                    : "border-[var(--border-subtle)] hover:border-[#FF6D1F]/40"
                }`}
              >
                <div className="space-y-3">
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2.5">
                      <div
                        className={`p-2 rounded-xl border ${
                          isCritical
                            ? "bg-rose-500/10 border-rose-500/30"
                            : "bg-[var(--bg-elevated)] border-[var(--border-subtle)]"
                        }`}
                      >
                        {getCategoryIcon(item.category, isCritical)}
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          isCritical
                            ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                            : "bg-[var(--bg-surface)] text-[#FF6D1F] border border-[var(--border-subtle)]"
                        }`}
                      >
                        {item.category}
                      </span>
                    </div>

                    {isCritical && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center space-x-1 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                        <span>EMERGENCY</span>
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)] leading-tight">{title}</h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Details Block */}
                  <div className="space-y-2 pt-3 border-t border-[var(--border-subtle)] text-xs font-mono">
                    <div className="flex items-start space-x-2 text-[var(--text-secondary)]">
                      <MapPin className="w-3.5 h-3.5 text-[#FF6D1F] shrink-0 mt-0.5" />
                      <span className="leading-snug">{item.officeLocation}</span>
                    </div>

                    <div className="flex items-start space-x-2 text-[var(--text-secondary)]">
                      <Clock className="w-3.5 h-3.5 text-[#FF6D1F] shrink-0 mt-0.5" />
                      <span className="leading-snug">{item.workingHours}</span>
                    </div>

                    {item.contactPerson && (
                      <div className="flex items-start space-x-2 text-[var(--text-secondary)]">
                        <Users className="w-3.5 h-3.5 text-[#FF6D1F] shrink-0 mt-0.5" />
                        <span className="leading-snug font-semibold">{item.contactPerson}</span>
                      </div>
                    )}

                    {/* Phone line with 1-click call */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center space-x-2 text-[var(--text-secondary)]">
                        <Phone className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span className="font-bold text-[var(--text-primary)]">{phone}</span>
                      </div>
                      <a
                        href={`tel:${phone.split("/")[0].trim().replace(/\s+/g, "")}`}
                        className="px-2 py-0.5 rounded bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[#FF6D1F] border border-[var(--border-subtle)] text-[10px] font-bold transition-colors"
                      >
                        Call
                      </a>
                    </div>

                    {/* Email line */}
                    <div className="flex items-center space-x-2 text-[var(--text-secondary)] truncate">
                      <Mail className="w-3.5 h-3.5 text-[#FF6D1F] shrink-0" />
                      <a
                        href={`mailto:${email}`}
                        className="text-[var(--text-muted)] hover:text-[#FF6D1F] transition-colors truncate"
                      >
                        {email}
                      </a>
                    </div>
                  </div>

                  {/* Dynamic Wardens Roster if available */}
                  {item.wardens && item.wardens.length > 0 && (
                    <div className="p-3 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-subtle)] space-y-2">
                      <span className="text-[10px] font-mono font-bold text-[#FF6D1F] uppercase tracking-wider block">
                        Assigned Hostel Wardens:
                      </span>
                      <div className="space-y-1.5">
                        {item.wardens.map((w, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-[11px] font-mono border-b border-[var(--border-subtle)]/40 last:border-none pb-1 last:pb-0"
                          >
                            <div>
                              <span className="text-[var(--text-primary)] font-semibold block">{w.name}</span>
                              <span className="text-[10px] text-[var(--text-muted)]">{w.block}</span>
                            </div>
                            <a
                              href={`tel:${w.phone}`}
                              className="px-2 py-0.5 rounded bg-[var(--bg-surface)] text-[#FF6D1F] hover:underline"
                            >
                              {w.phone}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Action Link */}
                {actionUrl && (
                  <div className="pt-2 border-t border-[var(--border-subtle)]">
                    <Link
                      to={actionUrl}
                      className="w-full py-2 rounded-xl text-xs font-bold btn-primary flex items-center justify-center space-x-1.5 shadow-sm transition-all"
                    >
                      <span>{actionLabel}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Emergency SOS Trigger Modal (Student Instant Dispatch) */}
      {showSosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="campus-panel max-w-md w-full p-6 space-y-4 border border-rose-500/50 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center space-x-2 text-rose-400">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[var(--text-primary)]">
                  EMERGENCY SOS BEACON DISPATCH
                </h3>
              </div>
              <button
                onClick={() => setShowSosModal(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 text-sm font-mono"
              >
                ✕
              </button>
            </div>

            {sosSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono text-center space-y-2">
                <Check className="w-6 h-6 mx-auto text-emerald-400" />
                <p className="font-bold">{sosSuccess}</p>
                <p className="text-[11px] text-[var(--text-muted)]">Redirecting to Live Student Dashboard...</p>
              </div>
            ) : (
              <form onSubmit={handleTriggerSos} className="space-y-4 text-xs font-mono">
                {sosError && (
                  <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/50 text-rose-200 text-xs">
                    {sosError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-[11px] text-[var(--text-secondary)] uppercase">
                    Select Emergency Category:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: "MEDICAL", label: "Medical Crisis", icon: HeartPulse },
                      { key: "FIRE_SMOKE", label: "Fire / Smoke", icon: Flame },
                      { key: "LIFT_STUCK", label: "Lift Stuck", icon: AlertCircle },
                      { key: "SECURITY", label: "Security Threat", icon: ShieldAlert }
                    ].map((cat) => {
                      const Icon = cat.icon;
                      const isSel = sosCategory === cat.key;
                      return (
                        <button
                          key={cat.key}
                          type="button"
                          onClick={() => setSosCategory(cat.key)}
                          className={`p-2.5 rounded-xl border text-left flex items-center space-x-2 transition-colors ${
                            isSel
                              ? "bg-rose-500/20 border-rose-500 text-rose-300 font-bold"
                              : "bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isSel ? "text-rose-400" : "text-[var(--text-muted)]"}`} />
                          <span className="text-xs">{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] text-[var(--text-secondary)] uppercase">
                    Location Context:
                  </label>
                  <input
                    type="text"
                    value={sosLocation}
                    onChange={(e) => setSosLocation(e.target.value)}
                    placeholder={
                      user?.hostelBlock
                        ? `${user.hostelBlock}, Room ${user.roomNumber || ""}`
                        : "e.g. Main Gate, Academic Block 2nd Floor, Canteen"
                    }
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-rose-500"
                  />
                  <p className="text-[10px] text-[var(--text-muted)]">
                    Defaults to your registered living profile if left empty.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] text-[var(--text-secondary)] uppercase">
                    Description / Extra Notes (Optional):
                  </label>
                  <textarea
                    rows={2}
                    value={sosDescription}
                    onChange={(e) => setSosDescription(e.target.value)}
                    placeholder="Brief description of the critical situation..."
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-rose-500 resize-none"
                  />
                </div>

                <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowSosModal(false)}
                    className="w-1/3 py-2.5 rounded-xl bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sosSubmitting}
                    className="w-2/3 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-rose-600/30"
                  >
                    {sosSubmitting ? (
                      <span>Transmitting Beacon...</span>
                    ) : (
                      <>
                        <ShieldAlert className="w-4 h-4" />
                        <span>DISPATCH SOS BEACON</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
