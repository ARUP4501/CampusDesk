import React, { useState, useEffect } from "react";
import {
  Moon,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Users,
  Search,
  Filter,
  ShieldAlert,
  Building2,
  FileText,
  Phone,
  DoorOpen
} from "lucide-react";
import { apiRequest, UserProfile } from "../api/client.js";

interface HostelEveningReturnSectionProps {
  user: UserProfile | null;
}

interface ReturnResident {
  studentId: string;
  fullName: string;
  rollNumber: string;
  roomNumber: string;
  bedNumber: string;
  phone: string;
  course: string;
  branch: string;
  status: "RETURNED" | "NOT_RETURNED" | "ON_LEAVE";
  returnTime: string | null;
  recordedBy: string | null;
  remarks: string | null;
  hasApprovedGatePass: boolean;
  gatePass?: {
    passNumber: string;
    type: string;
  } | null;
}

interface HostelSummary {
  id: string;
  hostelBlock: string;
  type: string;
  wardenName: string;
  totalResidents: number;
  returnedCount: number;
  notReturnedCount: number;
  onLeaveCount: number;
  returnRate: number;
  unreturnedResidents: any[];
}

export const HostelEveningReturnSection: React.FC<HostelEveningReturnSectionProps> = ({ user }) => {
  const isWarden = user?.role === "WARDEN";
  const isAdmin = user?.role === "ADMIN";

  const defaultHostel = isWarden && user?.hostelBlock ? user.hostelBlock : "Hostel-A";
  const [selectedHostel, setSelectedHostel] = useState<string>(defaultHostel);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [summaries, setSummaries] = useState<HostelSummary[]>([]);
  const [roster, setRoster] = useState<ReturnResident[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load summaries across all hostels
  const fetchSummaries = async () => {
    try {
      const data = await apiRequest<{ summaries: HostelSummary[] }>(
        `/api/hostels/evening-return/summary?date=${selectedDate}`
      );
      setSummaries(data.summaries || []);
    } catch (err) {
      console.error("Failed to load evening return summary:", err);
    }
  };

  // Load roster for selected hostel
  const fetchRoster = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<{
        roster: ReturnResident[];
        stats: { totalResidents: number; returnedCount: number; notReturnedCount: number; onLeaveCount: number };
      }>(`/api/hostels/${selectedHostel}/evening-return?date=${selectedDate}`);
      setRoster(data.roster || []);
    } catch (err) {
      console.error("Failed to load hostel evening return roster:", err);
      setRoster([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummaries();
  }, [selectedDate]);

  useEffect(() => {
    if (selectedHostel) {
      fetchRoster();
    }
  }, [selectedHostel, selectedDate]);

  // Mark student returned manually (e.g. at gate or hostel register)
  const handleMarkReturned = async (studentId: string) => {
    try {
      setActionLoadingId(studentId);
      await apiRequest(`/api/hostels/${selectedHostel}/evening-return`, {
        method: "POST",
        body: JSON.stringify({
          date: selectedDate,
          records: [
            {
              studentId,
              status: "RETURNED",
              returnTime: new Date().toISOString()
            }
          ]
        })
      });
      setSuccessMsg("Resident successfully marked RETURNED.");
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchRoster();
      fetchSummaries();
    } catch (err: any) {
      alert(err.message || "Failed to mark resident returned.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter roster
  const filteredRoster = roster.filter((r) => {
    const matchesFilter =
      statusFilter === "ALL" ||
      (statusFilter === "CURFEW_ALERT" && r.status === "NOT_RETURNED") ||
      r.status === statusFilter;

    const s = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !s ||
      r.fullName.toLowerCase().includes(s) ||
      (r.rollNumber && r.rollNumber.toLowerCase().includes(s)) ||
      (r.roomNumber && r.roomNumber.toLowerCase().includes(s));

    return matchesFilter && matchesSearch;
  });

  const activeSummary = summaries.find((s) => s.hostelBlock === selectedHostel);
  const totalResidents = activeSummary?.totalResidents ?? roster.length;
  const returnedCount = activeSummary?.returnedCount ?? roster.filter((r) => r.status === "RETURNED").length;
  const notReturnedCount = activeSummary?.notReturnedCount ?? roster.filter((r) => r.status === "NOT_RETURNED").length;
  const onLeaveCount = activeSummary?.onLeaveCount ?? roster.filter((r) => r.status === "ON_LEAVE").length;

  return (
    <div className="space-y-6 animate-fadeIn font-mono">
      {/* Header and Controls */}
      <div className="campus-block p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="editorial-eyebrow text-[#FF6D1F] block mb-1">
              CURFEW & RESIDENCY DIRECTORY
            </span>
            <h3 className="editorial-title text-xl text-[var(--text-primary)]">
              EVENING RETURN & CURFEW ROLL CALL
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Dedicated safety roll-call for hosteler residents. Strict curfew boundary: 08:30 PM.
            </p>
          </div>

          {/* Hostel Switcher & Date Picker */}
          <div className="flex flex-wrap items-center gap-3">
            {isAdmin && (
              <div className="flex items-center space-x-2">
                <label className="text-xs text-[var(--text-secondary)]">HOSTEL:</label>
                <select
                  value={selectedHostel}
                  onChange={(e) => setSelectedHostel(e.target.value)}
                  className="px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs rounded-lg focus:border-[#FF6D1F] outline-none"
                >
                  <option value="Hostel-A">Hostel-A (Boys Senior)</option>
                  <option value="Hostel-B">Hostel-B (Boys Junior)</option>
                  <option value="Hostel-C">Hostel-C (Girls Main)</option>
                  <option value="Hostel-D">Hostel-D (Girls Senior)</option>
                  <option value="Hostel-E">Hostel-E (Boys PG)</option>
                </select>
              </div>
            )}

            {isWarden && (
              <div className="px-3 py-1.5 bg-[var(--bg-elevated)] border border-[#FF6D1F]/40 rounded-lg text-xs font-bold text-[#FF6D1F]">
                {selectedHostel} (ASSIGNED)
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs rounded-lg focus:border-[#FF6D1F] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Multi-Hostel Overview Cards for Admin / Assigned Warden */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] block">
              Hostel Residents
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-black text-[var(--text-primary)]">{totalResidents}</span>
              <span className="text-[10px] text-[var(--text-muted)]">(Day Scholars Excluded)</span>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] block">
              Returned & Verified
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-black text-emerald-400">{returnedCount}</span>
              <span className="text-[10px] text-emerald-400/70">
                {totalResidents > 0 ? `${Math.round((returnedCount / totalResidents) * 100)}%` : "0%"}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] block">
              Curfew Alerts (Pending)
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className={`text-2xl font-black ${notReturnedCount > 0 ? "text-[#FF6D1F] animate-pulse" : "text-[var(--text-primary)]"}`}>
                {notReturnedCount}
              </span>
              {notReturnedCount > 0 && (
                <span className="text-[10px] text-[#FF6D1F] font-bold">ATTENTION</span>
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] block">
              On Approved Leave
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-black text-blue-400">{onLeaveCount}</span>
              <span className="text-[10px] text-blue-400/70">Valid Gate Passes</span>
            </div>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Roster & Curfew Controls */}
      <div className="campus-block p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-[var(--text-muted)] uppercase text-[10px]">Filter Status:</span>
            {["ALL", "NOT_RETURNED", "RETURNED", "ON_LEAVE"].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1 rounded-lg text-xs transition-colors border ${
                  statusFilter === tab
                    ? "bg-[#FF6D1F] text-[#222222] font-bold border-[#FF6D1F]"
                    : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[#FF6D1F]/30"
                }`}
              >
                {tab === "NOT_RETURNED" ? "CURFEW ALERTS" : tab}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student, roll, or room..."
              className="w-full pl-9 pr-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs rounded-lg focus:border-[#FF6D1F] outline-none"
            />
          </div>
        </div>

        {/* Resident Roster Table (Section 33: Readable, compact, high-contrast) */}
        {loading ? (
          <div className="py-12 text-center text-xs text-[var(--text-muted)]">
            Synchronizing evening roll call records...
          </div>
        ) : filteredRoster.length === 0 ? (
          <div className="py-12 text-center text-xs text-[var(--text-muted)]">
            No residents matching current filters in {selectedHostel}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[var(--border-subtle)] text-[var(--text-muted)]">
                <tr>
                  <th className="py-2.5 px-3">STUDENT</th>
                  <th className="py-2.5 px-3">ROLL NO</th>
                  <th className="py-2.5 px-3">ALLOCATION</th>
                  <th className="py-2.5 px-3">EVENING STATUS</th>
                  <th className="py-2.5 px-3">CURFEW / PASS TIME</th>
                  <th className="py-2.5 px-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-primary)]">
                {filteredRoster.map((r) => {
                  const isReturned = r.status === "RETURNED";
                  const isOnLeave = r.status === "ON_LEAVE" || r.hasApprovedGatePass;
                  const isCurfewAlert = r.status === "NOT_RETURNED" && !isOnLeave;

                  return (
                    <tr key={r.studentId} className="hover:bg-[var(--bg-elevated)] transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-bold text-[var(--text-primary)] block">{r.fullName}</span>
                        <span className="text-[10px] text-[var(--text-muted)]">{r.phone || "No phone"}</span>
                      </td>

                      <td className="py-3 px-3 text-[#FF6D1F] font-bold">
                        {r.rollNumber}
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-bold block">RM {r.roomNumber || "N/A"}</span>
                        <span className="text-[10px] text-[var(--text-muted)]">BED {r.bedNumber || "01"}</span>
                      </td>

                      <td className="py-3 px-3">
                        {isReturned ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 inline-flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>RETURNED</span>
                          </span>
                        ) : isOnLeave ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950/40 text-blue-300 border border-blue-500/30 inline-flex items-center space-x-1">
                            <FileText className="w-3 h-3 text-blue-400" />
                            <span>ON APPROVED LEAVE</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FF6D1F]/15 text-[#FF6D1F] border border-[#FF6D1F]/40 inline-flex items-center space-x-1 animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-[#FF6D1F]" />
                            <span>CURFEW ALERT</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-[var(--text-secondary)] text-[11px]">
                        {isReturned && r.returnTime
                          ? new Date(r.returnTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : isOnLeave && r.gatePass
                          ? `Pass #${r.gatePass.passNumber}`
                          : "Curfew: 08:30 PM"}
                      </td>

                      <td className="py-3 px-3 text-right">
                        {!isReturned ? (
                          <button
                            onClick={() => handleMarkReturned(r.studentId)}
                            disabled={actionLoadingId === r.studentId}
                            className="px-3 py-1 rounded bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface)] text-[#FF6D1F] border border-[#FF6D1F]/40 text-xs font-bold transition-colors"
                          >
                            {actionLoadingId === r.studentId ? "SAVING..." : "MARK RETURNED"}
                          </button>
                        ) : (
                          <span className="text-[11px] text-[var(--text-muted)]">VERIFIED</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HostelEveningReturnSection;
