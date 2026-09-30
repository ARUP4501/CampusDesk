import React, { useState, useEffect } from "react";
import { Shield, Search, ArrowRight, ArrowLeft, Clock, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
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
      fetchActiveOutside();
    } catch (err: any) {
      setResultMsg({ success: false, text: err.message || "Failed to log event." });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#14181C] border border-[#252B31] p-5 rounded-[6px] shadow-subtle">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-[4px] bg-[#181D22] border border-[#252B31] flex items-center justify-center text-[#D6A84F]">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#F3F4F6]">Main Gate Security Terminal</h1>
            <p className="text-xs text-[#A7ADB5] mt-0.5">
              Scan student dynamic QR passes or enter reference codes to log physical campus departures and arrivals
            </p>
          </div>
        </div>
      </div>

      {/* Security Check-in / Check-out Box */}
      <div className="bg-[#14181C] border border-[#252B31] rounded-[6px] p-6 shadow-subtle">
        <h2 className="text-xs font-mono font-bold text-[#D6A84F] uppercase tracking-wider border-b border-[#252B31] pb-2 mb-4">
          Gate Scanner & Physical Access Controller
        </h2>

        {resultMsg && (
          <div
            className={`p-3 mb-4 rounded-[4px] text-xs font-medium ${
              resultMsg.success
                ? "bg-emerald-500/10 text-emerald-200 border border-emerald-500/30"
                : "bg-red-500/10 text-red-200 border border-red-500/30"
            }`}
          >
            {resultMsg.text}
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="passIdentifier" className="block text-xs font-semibold text-[#A7ADB5] mb-1">
                Pass Number or Scanned QR Content *
              </label>
              <input
                id="passIdentifier"
                type="text"
                value={passIdentifier}
                onChange={(e) => setPassIdentifier(e.target.value)}
                placeholder="e.g. GP-5001 or scanned token"
                className="w-full text-sm font-mono px-3 py-2 bg-[#101316] border border-[#252B31] text-[#F3F4F6] rounded-[4px] focus:outline-none focus:border-[#D6A84F]"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="guardName" className="block text-xs font-semibold text-[#A7ADB5] mb-1">
                Duty Officer Name *
              </label>
              <input
                id="guardName"
                type="text"
                value={guardName}
                onChange={(e) => setGuardName(e.target.value)}
                className="w-full text-sm px-3 py-2 bg-[#101316] border border-[#252B31] text-[#F3F4F6] rounded-[4px] focus:outline-none focus:border-[#D6A84F]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="securityNotes" className="block text-xs font-semibold text-[#A7ADB5] mb-1">
              Security Remarks & Verification Notes (Optional)
            </label>
            <input
              id="securityNotes"
              type="text"
              value={securityNotes}
              onChange={(e) => setSecurityNotes(e.target.value)}
              placeholder="e.g. Physical ID inspected, baggage cleared, accompanied by guardian"
              className="w-full text-xs px-3 py-2 bg-[#101316] border border-[#252B31] text-[#F3F4F6] rounded-[4px] focus:outline-none focus:border-[#D6A84F]"
            />
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <button
              onClick={() => handleRecordAction("EXIT")}
              disabled={actionLoading}
              className="px-5 py-2.5 bg-[#181D22] hover:bg-[#252B31] border border-[#3B82F6]/50 text-[#60A5FA] font-bold text-xs rounded-[4px] flex items-center space-x-2 disabled:opacity-50 transition-colors shadow-xs"
            >
              <ArrowRight className="w-4 h-4 text-[#3B82F6]" />
              <span>Record Campus Exit</span>
            </button>

            <button
              onClick={() => handleRecordAction("ENTRY")}
              disabled={actionLoading}
              className="px-5 py-2.5 bg-[#D6A84F] hover:bg-[#F0C86A] text-[#090B0D] font-bold text-xs rounded-[4px] flex items-center space-x-2 disabled:opacity-50 transition-colors shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Record Campus Entry</span>
            </button>
          </div>
        </div>
      </div>

      {/* Currently Outside Students Live Register */}
      <div className="bg-[#14181C] border border-[#252B31] rounded-[6px] overflow-hidden shadow-subtle">
        <div className="p-4 bg-[#101316] border-b border-[#252B31] flex items-center justify-between">
          <div className="font-mono font-bold text-xs text-[#F3F4F6] uppercase tracking-wider flex items-center space-x-2">
            <span>Students Currently Outside Campus</span>
            <span className="bg-[#3B82F6]/20 text-[#60A5FA] border border-[#3B82F6]/30 text-[10px] px-2 py-0.5 rounded-full font-bold">
              {activeOutside.length} Active Outside
            </span>
          </div>
          <button
            onClick={fetchActiveOutside}
            className="text-xs text-[#D6A84F] hover:text-[#F0C86A] flex items-center space-x-1 font-mono transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Sync Roster</span>
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-[#A7ADB5] font-mono">Querying security register...</div>
        ) : activeOutside.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#6F7781]">
            No students are currently recorded as outside campus on active passes.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#101316] border-b border-[#252B31] text-[#A7ADB5] font-mono uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Pass ID</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Hostel & Room</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4">Exit Recorded</th>
                  <th className="py-3 px-4">Expected Return</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#252B31]">
                {activeOutside.map((p) => (
                  <tr
                    key={p.id}
                    className={`hover:bg-[#181D22] transition-colors ${
                      p.isOverdue ? "bg-red-500/5" : ""
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-[#D6A84F]">
                      #{p.passNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#F3F4F6]">{p.student.fullName}</div>
                      <div className="text-[11px] text-[#6F7781] font-mono">
                        {p.student.rollNumber} &bull; Ph: {p.student.phone}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#A7ADB5] font-mono">
                      {p.student.hostelBlock} {p.student.roomNumber}
                    </td>
                    <td className="py-3 px-4 text-[#F3F4F6] font-medium">{p.destination}</td>
                    <td className="py-3 px-4 text-[#A7ADB5] font-mono">
                      {new Date(p.actualExitTime).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="py-3 px-4 text-[#A7ADB5] font-mono">
                      {new Date(p.expectedReturnDate).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="py-3 px-4">
                      {p.isOverdue ? (
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-red-500/10 text-red-300 border border-red-500/30 rounded flex items-center space-x-1 w-max">
                          <AlertTriangle className="w-3 h-3 text-red-400" />
                          <span>OVERDUE RETURN</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded">
                          ON TIME
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setPassIdentifier(p.passNumber);
                          handleRecordAction("ENTRY");
                        }}
                        className="px-3 py-1 bg-[#181D22] hover:bg-[#D6A84F] hover:text-[#090B0D] text-[#F3F4F6] border border-[#252B31] font-mono font-bold text-[11px] rounded-[3px] transition-colors"
                      >
                        Log Arrival
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
