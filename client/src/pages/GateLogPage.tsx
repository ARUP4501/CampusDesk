import React, { useState, useEffect } from "react";
import { Shield, Search, ArrowRight, ArrowLeft, Clock, AlertTriangle, CheckCircle } from "lucide-react";
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
  const [guardName, setGuardName] = useState<string>(user?.fullName || "Main Gate Security Guard");
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
      <div className="bg-white border border-stone-300 p-4 rounded-[6px]">
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-[#0f4c3a]" />
          <h1 className="text-xl font-bold text-stone-900">Main Gate Security Terminal</h1>
        </div>
        <p className="text-xs text-stone-600 mt-0.5">
          Scan student QR pass or enter reference code to log physical exit and campus re-entry
        </p>
      </div>

      {/* Security Check-in / Check-out Box */}
      <div className="bg-white border border-stone-300 rounded-[6px] p-6 shadow-sm">
        <h2 className="text-xs font-bold text-stone-700 uppercase tracking-wider border-b border-stone-200 pb-2 mb-4">
          Gate Scanner & Entry Logger
        </h2>

        {resultMsg && (
          <div
            className={`p-3 mb-4 rounded-[4px] text-xs font-medium ${
              resultMsg.success
                ? "bg-emerald-50 text-emerald-900 border border-emerald-300"
                : "bg-red-50 text-red-900 border border-red-200"
            }`}
          >
            {resultMsg.text}
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="passIdentifier" className="block text-xs font-semibold text-stone-800 mb-1">
                Pass Number or Scanned QR Content *
              </label>
              <div className="relative">
                <input
                  id="passIdentifier"
                  type="text"
                  value={passIdentifier}
                  onChange={(e) => setPassIdentifier(e.target.value)}
                  placeholder="e.g. GP-5001 or paste QR string"
                  className="w-full text-sm font-mono px-3 py-2 border border-stone-300 rounded-[4px] focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label htmlFor="guardName" className="block text-xs font-semibold text-stone-800 mb-1">
                Duty Security Guard Name *
              </label>
              <input
                id="guardName"
                type="text"
                value={guardName}
                onChange={(e) => setGuardName(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-stone-300 rounded-[4px] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="securityNotes" className="block text-xs font-semibold text-stone-800 mb-1">
              Security Remarks (Optional)
            </label>
            <input
              id="securityNotes"
              type="text"
              value={securityNotes}
              onChange={(e) => setSecurityNotes(e.target.value)}
              placeholder="e.g. Identity checked, accompanied by guardian, baggage inspected"
              className="w-full text-xs px-3 py-2 border border-stone-300 rounded-[4px] focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <button
              onClick={() => handleRecordAction("EXIT")}
              disabled={actionLoading}
              className="px-5 py-2.5 bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs rounded-[4px] flex items-center space-x-2 disabled:opacity-50"
            >
              <ArrowRight className="w-4 h-4" />
              <span>Record Campus Exit</span>
            </button>

            <button
              onClick={() => handleRecordAction("ENTRY")}
              disabled={actionLoading}
              className="px-5 py-2.5 bg-[#0f4c3a] hover:bg-[#0b392b] text-white font-bold text-xs rounded-[4px] flex items-center space-x-2 disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Record Campus Entry</span>
            </button>
          </div>
        </div>
      </div>

      {/* Currently Outside Students Live Register */}
      <div className="bg-white border border-stone-300 rounded-[6px] overflow-hidden shadow-sm">
        <div className="p-4 bg-stone-100 border-b border-stone-300 flex items-center justify-between">
          <div className="font-bold text-xs text-stone-800 uppercase tracking-wider flex items-center space-x-2">
            <span>Students Currently Outside Campus</span>
            <span className="bg-blue-800 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
              {activeOutside.length} Outside
            </span>
          </div>
          <button
            onClick={fetchActiveOutside}
            className="text-xs text-emerald-800 hover:underline font-medium"
          >
            Refresh List
          </button>
        </div>

        {loading ? (
          <div className="p-6 text-center text-xs text-stone-500">Loading active exits...</div>
        ) : activeOutside.length === 0 ? (
          <div className="p-6 text-center text-xs text-stone-500">
            No students are currently recorded as outside campus on active gate passes.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-stone-700 font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Pass #</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Hostel & Room</th>
                  <th className="py-2.5 px-3">Destination</th>
                  <th className="py-2.5 px-3">Exit Recorded At</th>
                  <th className="py-2.5 px-3">Expected Return</th>
                  <th className="py-2.5 px-3">Return Status</th>
                  <th className="py-2.5 px-3 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {activeOutside.map((p) => (
                  <tr
                    key={p.id}
                    className={`hover:bg-stone-50 transition-colors ${
                      p.isOverdue ? "bg-red-50" : ""
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-950">
                      #{p.passNumber}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-stone-900">{p.student.fullName}</div>
                      <div className="text-[11px] text-stone-500 font-mono">
                        {p.student.rollNumber} &bull; Ph: {p.student.phone}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-stone-700">
                      {p.student.hostelBlock} {p.student.roomNumber}
                    </td>
                    <td className="py-2.5 px-3 text-stone-700 font-medium">{p.destination}</td>
                    <td className="py-2.5 px-3 text-stone-700">
                      {new Date(p.actualExitTime).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="py-2.5 px-3 text-stone-700">
                      {new Date(p.expectedReturnDate).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="py-2.5 px-3">
                      {p.isOverdue ? (
                        <span className="px-2 py-0.5 text-[11px] font-bold bg-red-100 text-red-900 border border-red-300 rounded-[4px] flex items-center space-x-1 w-max">
                          <AlertTriangle className="w-3 h-3 text-red-700" />
                          <span>OVERDUE RETURN</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-[4px]">
                          On Time
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => {
                          setPassIdentifier(p.passNumber);
                          handleRecordAction("ENTRY");
                        }}
                        className="px-3 py-1 bg-stone-800 hover:bg-stone-900 text-white font-semibold text-xs rounded-[4px]"
                      >
                        Log Entry
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
