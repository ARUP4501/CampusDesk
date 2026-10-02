import React, { useState, useEffect } from "react";
import { Shield, Search, ArrowRight, ArrowLeft, Clock, AlertTriangle, CheckCircle2, RefreshCw, QrCode, User, Check, X } from "lucide-react";
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
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="glass-panel p-6 rounded-3xl border border-[rgba(77,42,0,0.1)] shadow-glass flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-[#FDB773]/40 border border-[#CC6F00]/25 flex items-center justify-center text-[#4D2A00]">
            <Shield className="w-5 h-5 text-[#4D2A00]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#4D2A00]">Main Gate Security Terminal</h1>
            <p className="text-xs text-[#4D2A00]/70 mt-0.5">
              Cryptographic QR verification and physical campus departure/arrival audit logger
            </p>
          </div>
        </div>

        <button
          onClick={fetchActiveOutside}
          className="btn-secondary inline-flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-xl"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Live Queue</span>
        </button>
      </div>

      {/* Security Check-in / Check-out Box */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-5 border border-[rgba(77,42,0,0.1)] shadow-glass">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#CC6F00]">
            Scanner & Gate Access Logger
          </h2>
          <span className="text-[11px] font-mono text-campus-secondary">Backend Cryptographic Verification Active</span>
        </div>

        {resultMsg && (
          <div className={`p-4 rounded-2xl text-xs font-medium flex items-center space-x-2 animate-fadeIn ${
            resultMsg.success ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-950" : "bg-rose-500/20 border border-rose-500/30 text-rose-900"
          }`}>
            {resultMsg.success ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" /> : <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />}
            <span>{resultMsg.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#4D2A00] mb-1.5">
              Pass Number or Scanned QR String *
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                required
                value={passIdentifier}
                onChange={(e) => setPassIdentifier(e.target.value)}
                placeholder="e.g. GP-2024-101 or paste signed QR payload..."
                className="w-full px-3.5 py-2.5 bg-white/60 border border-[rgba(77,42,0,0.12)] rounded-xl text-[#4D2A00] text-xs font-mono placeholder-[#4D2A00]/40 focus:outline-none focus:border-[#CC6F00]"
              />
              <button
                type="button"
                onClick={handleVerifyQr}
                disabled={verifying}
                className="btn-secondary px-4 py-2 text-xs font-bold shrink-0 flex items-center space-x-1.5 rounded-xl shadow-xs"
              >
                <QrCode className="w-4 h-4 text-campus-accent" />
                <span>{verifying ? "Verifying..." : "Verify Pass"}</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4D2A00] mb-1.5">
              Logging Guard / Officer
            </label>
            <input
              type="text"
              value={guardName}
              onChange={(e) => setGuardName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white/60 border border-[rgba(77,42,0,0.12)] rounded-xl text-[#4D2A00] text-xs focus:outline-none focus:border-[#CC6F00]"
            />
          </div>
        </div>

        {/* Verified Pass Preview Panel */}
        {verifiedPass && verifiedPass.gatePass && (
          <div className="p-4 rounded-2xl bg-white/80 border-2 border-campus-accent/30 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-campus-border pb-2">
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-xs text-campus-accent">
                  #{verifiedPass.gatePass.passNumber}
                </span>
                <span className="text-xs font-bold text-campus-text">
                  {verifiedPass.gatePass.student?.fullName} ({verifiedPass.gatePass.student?.rollNumber})
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                STATUS: {verifiedPass.gatePass.status}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-campus-secondary font-mono">
              <div>Hostel: <strong>{verifiedPass.gatePass.student?.hostelBlock} (Rm {verifiedPass.gatePass.student?.roomNumber})</strong></div>
              <div>Destination: <strong>{verifiedPass.gatePass.destination}</strong></div>
              <div>Return Deadline: <strong>{new Date(verifiedPass.gatePass.expectedReturnDate).toLocaleString()}</strong></div>
            </div>

            {verifiedPass.warning && (
              <div className="p-2 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 text-xs font-medium flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{verifiedPass.warning}</span>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-[#4D2A00] mb-1.5">
            Optional Security Observation Notes
          </label>
          <input
            type="text"
            value={securityNotes}
            onChange={(e) => setSecurityNotes(e.target.value)}
            placeholder="Vehicle number, accompaniment, or condition on exit/entry..."
            className="w-full px-3.5 py-2.5 bg-white/60 border border-[rgba(77,42,0,0.12)] rounded-xl text-[#4D2A00] text-xs placeholder-[#4D2A00]/40 focus:outline-none focus:border-[#CC6F00]"
          />
        </div>

        <div className="flex items-center space-x-3 pt-2">
          <button
            type="button"
            onClick={() => handleRecordAction("EXIT")}
            disabled={actionLoading}
            className="btn-primary flex-1 sm:flex-none px-6 py-3 text-xs font-bold flex items-center justify-center space-x-2 disabled:opacity-50 shadow-sm rounded-xl"
          >
            <ArrowRight className="w-4 h-4" />
            <span>Record Physical Exit</span>
          </button>

          <button
            type="button"
            onClick={() => handleRecordAction("ENTRY")}
            disabled={actionLoading}
            className="btn-secondary flex-1 sm:flex-none px-6 py-3 text-xs font-bold flex items-center justify-center space-x-2 disabled:opacity-50 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4 text-[#CC6F00]" />
            <span>Record Return / Re-entry</span>
          </button>
        </div>
      </div>

      {/* Currently Outside Students Stream */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-[rgba(77,42,0,0.1)] shadow-glass">
        <div className="p-4 border-b border-[rgba(77,42,0,0.1)] bg-[#FDB773]/30 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase text-[#4D2A00]">
            <Clock className="w-4 h-4 text-[#CC6F00]" />
            <span>Students Currently Outside Campus ({activeOutside.length})</span>
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-xs text-[#4D2A00]/60">Loading live exits...</div>
        ) : activeOutside.length === 0 ? (
          <div className="p-10 text-center text-xs text-[#4D2A00]/60">
            All students are currently recorded inside the campus perimeter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FDB773]/20 border-b border-[rgba(77,42,0,0.08)] text-[#4D2A00] font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Pass #</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4">Exit Time</th>
                  <th className="py-3 px-4">Expected Return</th>
                  <th className="py-3 px-4">Emergency Phone</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(77,42,0,0.06)]">
                {activeOutside.map((s) => (
                  <tr key={s.id} className="hover:bg-white/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#CC6F00]">#{s.passNumber}</td>
                    <td className="py-3 px-4 font-semibold text-[#4D2A00]">
                      {s.student.fullName} ({s.student.rollNumber})
                    </td>
                    <td className="py-3 px-4 text-[#4D2A00]/80">{s.destination}</td>
                    <td className="py-3 px-4 text-[#4D2A00]/70 font-mono">
                      {new Date(s.actualExitTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className={s.isOverdue ? "text-rose-600 font-bold" : "text-[#4D2A00]/70"}>
                        {new Date(s.expectedReturnDate).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                        {s.isOverdue && " [OVERDUE]"}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[#4D2A00]/70">{s.student.phone}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setPassIdentifier(s.passNumber);
                        }}
                        className="btn-primary px-3 py-1 text-xs font-bold shadow-sm rounded-xl"
                      >
                        Quick Return
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
