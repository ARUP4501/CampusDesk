import React, { useState, useEffect } from "react";
import {
  Shield,
  Search,
  ArrowRight,
  ArrowLeft,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  QrCode,
  Check,
  X,
  Radio
} from "lucide-react";
import { apiRequest, UserProfile } from "../api/client.js";

interface OutsideStudent {
  id: string;
  passNumber: string;
  type: string;
  destination: string;
  departureDate: string;
  expectedReturnDate: string;
  actualExitTime: string;
  isOverdue: boolean;
  student: {
    fullName: string;
    rollNumber: string;
    phone: string;
    hostelBlock: string;
    roomNumber: string;
  };
}

export const GateLogPage: React.FC<{ user: UserProfile | null }> = ({ user }) => {
  const [passIdentifier, setPassIdentifier] = useState<string>("");
  const [guardName, setGuardName] = useState<string>(user?.fullName || "Main Gate Security Officer");
  const [securityNotes, setSecurityNotes] = useState<string>("");
  const [activeOutside, setActiveOutside] = useState<OutsideStudent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [resultMsg, setResultMsg] = useState<{ success: boolean; text: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [verifiedPass, setVerifiedPass] = useState<any | null>(null);
  const [verifying, setVerifying] = useState<boolean>(false);

  const fetchActiveOutside = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<{ activeOutside: OutsideStudent[] }>("/api/gatepass/gate-log/active-outside");
      setActiveOutside(data.activeOutside || []);
    } catch (err) {
      console.error("Failed to load active exits:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveOutside();
    const interval = setInterval(fetchActiveOutside, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleVerifyQr = async () => {
    if (!passIdentifier.trim()) {
      alert("Please scan QR code or enter a Pass Number.");
      return;
    }
    setVerifying(true);
    setResultMsg(null);
    try {
      const data = await apiRequest<{ success: boolean; gatePass: any; nextAction: string; warning?: string }>("/api/gatepass/verify-qr", {
        method: "POST",
        body: JSON.stringify({ qrData: passIdentifier.trim() })
      });
      setVerifiedPass(data);
    } catch (err: any) {
      setVerifiedPass(null);
      setResultMsg({ success: false, text: err.message || "Invalid or unverified QR token." });
    } finally {
      setVerifying(false);
    }
  };

  const handleRecordAction = async (action: "EXIT" | "ENTRY") => {
    if (!passIdentifier.trim()) {
      alert("Please scan QR code or enter a Pass Number.");
      return;
    }

    setActionLoading(true);
    setResultMsg(null);
    try {
      const data = await apiRequest<{ message: string; isLate?: boolean }>("/api/gatepass/gate-log/record", {
        method: "POST",
        body: JSON.stringify({
          action,
          passIdentifier: passIdentifier.trim(),
          guardName,
          securityNotes: securityNotes || undefined
        })
      });
      setResultMsg({ success: true, text: data.message });
      setPassIdentifier("");
      setSecurityNotes("");
      setVerifiedPass(null);
      fetchActiveOutside();
    } catch (err: any) {
      setResultMsg({ success: false, text: err.message || "Failed to log event." });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 font-mono">
      {/* Header Banner */}
      <section className="border-b border-[var(--border-subtle)] pb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <span className="editorial-eyebrow text-[#FF6D1F] block mb-2">
            SECURITY COMMAND // PERIMETER ACCESS
          </span>
          <h1 className="editorial-title text-xl sm:text-2xl text-[var(--text-primary)]">
            CAMPUS GATE AUDIT TERMINAL
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Cryptographic token verification, live departures registry, and curfew boundary tracking.
          </p>
        </div>

        <button
          onClick={fetchActiveOutside}
          className="btn-secondary px-4 py-2 text-xs flex items-center space-x-2 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>REFRESH QUEUE</span>
        </button>
      </section>

      {/* Security Check-in / Check-out Box (Section 24: Practical, large targets) */}
      <div className="campus-block p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
          <span className="editorial-eyebrow text-[#FF6D1F]">
            01 // TURNSTILE SCANNER & LOGGER
          </span>
          <span className="text-[10px] text-[var(--text-muted)] uppercase">
            Cryptographic QR Backend Active
          </span>
        </div>

        {resultMsg && (
          <div
            className={`p-3.5 rounded-lg text-xs font-bold flex items-center space-x-2 animate-fadeIn ${
              resultMsg.success
                ? "bg-emerald-950/40 border border-emerald-500/40 text-emerald-300"
                : "bg-rose-950/40 border border-rose-500/50 text-rose-300"
            }`}
          >
            {resultMsg.success ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />}
            <span>{resultMsg.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-1.5">
            <label className="block text-[10px] text-[var(--text-muted)] uppercase">
              Pass Number or Scanned QR String *
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                required
                value={passIdentifier}
                onChange={(e) => setPassIdentifier(e.target.value)}
                placeholder="Scan QR or enter GP-5101..."
                className="w-full px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--bg-input-border)] rounded-lg text-[var(--text-primary)] text-xs focus:border-[#FF6D1F] outline-none"
              />
              <button
                type="button"
                onClick={handleVerifyQr}
                disabled={verifying}
                className="btn-secondary px-4 py-2.5 text-xs font-bold shrink-0 flex items-center space-x-1.5"
              >
                <QrCode className="w-4 h-4 text-[#FF6D1F]" />
                <span>{verifying ? "VERIFYING..." : "VERIFY"}</span>
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] text-[var(--text-muted)] uppercase">
              Logging Guard / Officer
            </label>
            <input
              type="text"
              value={guardName}
              onChange={(e) => setGuardName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--bg-input-border)] rounded-lg text-[var(--text-primary)] text-xs focus:border-[#FF6D1F] outline-none"
            />
          </div>
        </div>

        {/* Verified Pass Preview Panel */}
        {verifiedPass && verifiedPass.gatePass && (
          <div className="p-4 rounded-lg bg-[var(--bg-elevated)] border border-[#FF6D1F]/40 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-xs text-[#FF6D1F]">
                  #{verifiedPass.gatePass.passNumber}
                </span>
                <span className="text-xs font-bold text-[var(--text-primary)]">
                  {verifiedPass.gatePass.student?.fullName} ({verifiedPass.gatePass.student?.rollNumber})
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/40 text-emerald-300 border border-emerald-500/40">
                STATUS: {verifiedPass.gatePass.status}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-[var(--text-secondary)]">
              <div>Hostel: <strong className="text-[var(--text-primary)]">{verifiedPass.gatePass.student?.hostelBlock} (Rm {verifiedPass.gatePass.student?.roomNumber})</strong></div>
              <div>Destination: <strong className="text-[var(--text-primary)]">{verifiedPass.gatePass.destination}</strong></div>
              <div>Deadline: <strong className="text-[var(--text-primary)]">{new Date(verifiedPass.gatePass.expectedReturnDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</strong></div>
            </div>

            {verifiedPass.warning && (
              <div className="p-2 rounded bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{verifiedPass.warning}</span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-[10px] text-[var(--text-muted)] uppercase">
            Security Observation Notes (Optional)
          </label>
          <input
            type="text"
            value={securityNotes}
            onChange={(e) => setSecurityNotes(e.target.value)}
            placeholder="Vehicle plate number, accompaniment, or physical condition..."
            className="w-full px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--bg-input-border)] rounded-lg text-[var(--text-primary)] text-xs focus:border-[#FF6D1F] outline-none"
          />
        </div>

        {/* Large Action Buttons (Section 24) */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
          <button
            type="button"
            onClick={() => handleRecordAction("EXIT")}
            disabled={actionLoading}
            className="w-full sm:flex-1 py-3 px-6 rounded-lg bg-[#FF6D1F] hover:bg-[#FF6D1F]/90 text-[#222222] font-black text-xs flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
          >
            <ArrowRight className="w-4 h-4" />
            <span>RECORD PHYSICAL EXIT</span>
          </button>

          <button
            type="button"
            onClick={() => handleRecordAction("ENTRY")}
            disabled={actionLoading}
            className="w-full sm:flex-1 py-3 px-6 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] font-black text-xs flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4 text-[#FF6D1F]" />
            <span>RECORD CAMPUS RE-ENTRY</span>
          </button>
        </div>
      </div>

      {/* Currently Outside Students Stream */}
      <div className="campus-block p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase text-[var(--text-primary)]">
            <Clock className="w-4 h-4 text-[#FF6D1F]" />
            <span>STUDENTS CURRENTLY OUTSIDE PERIMETER ({activeOutside.length})</span>
          </div>
          <span className="text-[10px] text-[var(--text-muted)] uppercase">
            Auto-Sync 10s
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-[var(--text-muted)]">
            Synchronizing gate queue...
          </div>
        ) : activeOutside.length === 0 ? (
          <div className="py-12 text-center text-xs text-[var(--text-muted)]">
            All registered hostel residents are currently within campus perimeter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[var(--border-subtle)] text-[var(--text-muted)]">
                <tr>
                  <th className="py-2.5 px-3">PASS #</th>
                  <th className="py-2.5 px-3">STUDENT</th>
                  <th className="py-2.5 px-3">DESTINATION</th>
                  <th className="py-2.5 px-3">EXIT TIME</th>
                  <th className="py-2.5 px-3">RETURN DEADLINE</th>
                  <th className="py-2.5 px-3">PHONE</th>
                  <th className="py-2.5 px-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-primary)]">
                {activeOutside.map((s) => (
                  <tr key={s.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="py-3 px-3 font-bold text-[#FF6D1F]">#{s.passNumber}</td>
                    <td className="py-3 px-3">
                      <span className="font-bold block">{s.student.fullName}</span>
                      <span className="text-[10px] text-[var(--text-muted)]">{s.student.rollNumber}</span>
                    </td>
                    <td className="py-3 px-3 text-[var(--text-secondary)]">{s.destination}</td>
                    <td className="py-3 px-3">
                      {new Date(s.actualExitTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-3 px-3">
                      <span className={s.isOverdue ? "text-rose-400 font-bold" : "text-[var(--text-secondary)]"}>
                        {new Date(s.expectedReturnDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {s.isOverdue && " [OVERDUE]"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[var(--text-muted)]">{s.student.phone}</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setPassIdentifier(s.passNumber)}
                        className="px-2.5 py-1 rounded bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[#FF6D1F] border border-[#FF6D1F]/40 text-xs font-bold transition-colors"
                      >
                        LOG RETURN
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default GateLogPage;
