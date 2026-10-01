import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { QrCode, Plus, CheckCircle, XCircle, Clock, Shield, ArrowRight, User, X, ChevronRight, AlertTriangle } from "lucide-react";
import { apiRequest, UserProfile } from "../api/client.js";

interface GatePassItem {
  id: string;
  passNumber: string;
  type: string;
  destination: string;
  reason: string;
  departureDate: string;
  expectedReturnDate: string;
  actualExitTime?: string;
  actualEntryTime?: string;
  status: string;
  wardenComment?: string;
  createdAt: string;
  student: {
    fullName: string;
    rollNumber: string;
    phone: string;
    hostelBlock: string;
    roomNumber: string;
  };
  approvedBy?: { fullName: string };
}

export const GatePassPage: React.FC<{ user: UserProfile | null }> = ({ user }) => {
  const { t } = useTranslation();
  const [passes, setPasses] = useState<GatePassItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [activeQrPass, setActiveQrPass] = useState<{ pass: GatePassItem; qrUrl: string } | null>(null);

  // New Pass Form
  const [formData, setFormData] = useState({
    type: "OUTING",
    destination: "",
    reason: "",
    departureDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
    expectedReturnDate: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 16),
    parentContact: user?.phone || ""
  });
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Review states for Warden
  const [reviewComment, setReviewComment] = useState<string>("");
  const isWardenOrAdmin = user && (user.role === "WARDEN" || user.role === "ADMIN");

  const fetchPasses = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<{ passes: GatePassItem[] }>("/api/gatepass");
      setPasses(data.passes || []);
    } catch (err: any) {
      console.error("Failed to load gate passes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPasses();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await apiRequest(
        "/api/gatepass",
        {
          method: "POST",
          body: JSON.stringify({
            ...formData,
            departureDate: new Date(formData.departureDate).toISOString(),
            expectedReturnDate: new Date(formData.expectedReturnDate).toISOString()
          })
        },
        {
          label: `Gate Pass: ${formData.destination}`,
          data: formData
        }
      );
      setShowModal(false);
      fetchPasses();
    } catch (err: any) {
      setError(err.message || "Failed to create gate pass.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewQr = async (passId: string) => {
    try {
      const data = await apiRequest<{ gatePass: GatePassItem; qrDataUrl: string }>(`/api/gatepass/${passId}`);
      setActiveQrPass({ pass: data.gatePass, qrUrl: data.qrDataUrl });
    } catch (err: any) {
      alert("Failed to load QR code: " + err.message);
    }
  };

  const handleReview = async (passId: string, status: "APPROVED" | "REJECTED") => {
    try {
      await apiRequest(`/api/gatepass/${passId}/review`, {
        method: "PATCH",
        body: JSON.stringify({
          status,
          wardenComment: reviewComment || undefined
        })
      });
      setReviewComment("");
      fetchPasses();
    } catch (err: any) {
      alert("Review failed: " + err.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <span className="px-2.5 py-1 text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-950 border border-emerald-500/30 rounded-md">Approved</span>;
      case "PENDING":
        return <span className="px-2.5 py-1 text-[10px] font-mono font-bold bg-[#FDB773]/30 text-[#4D2A00] border border-[#CC6F00]/25 rounded-md">Pending Review</span>;
      case "EXITED":
        return <span className="px-2.5 py-1 text-[10px] font-mono font-bold bg-[#CC6F00]/15 text-[#CC6F00] border border-[#CC6F00]/30 rounded-md">Outside Campus</span>;
      case "RETURNED":
        return <span className="px-2.5 py-1 text-[10px] font-mono font-bold bg-white/60 text-[#4D2A00]/60 border border-[rgba(77,42,0,0.1)] rounded-md">Returned</span>;
      case "REJECTED":
        return <span className="px-2.5 py-1 text-[10px] font-mono font-bold bg-rose-500/20 text-rose-900 border border-rose-500/30 rounded-md">Rejected</span>;
      default:
        return <span className="px-2.5 py-1 text-[10px] font-mono font-bold bg-white/60 text-[#4D2A00] rounded-md border border-[rgba(77,42,0,0.1)]">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 glass-panel p-6 rounded-3xl border border-[rgba(77,42,0,0.1)] shadow-glass">
        <div>
          <div className="flex items-center space-x-2 text-[#CC6F00] text-[11px] font-bold uppercase mb-1">
            <QrCode className="w-3.5 h-3.5" />
            <span>Campus Security & Access</span>
          </div>
          <h1 className="text-2xl font-bold text-[#4D2A00]">
            {t("gatepass.title", "Gate Pass & Leave Management")}
          </h1>
          <p className="text-xs text-[#4D2A00]/70 mt-1">
            Digital gate pass authorization, cryptographic QR verification for campus security and departure logging
          </p>
        </div>

        {user?.role === "STUDENT" && (
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary inline-flex items-center space-x-2 text-xs font-bold px-5 py-2.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{t("gatepass.newPass", "Apply for Gate Pass")}</span>
          </button>
        )}
      </div>

      {/* Gate Pass Table */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-[rgba(77,42,0,0.1)] shadow-glass">
        {loading ? (
          <div className="p-14 text-center text-xs text-[#4D2A00]/70 flex flex-col items-center justify-center space-y-2">
            <div className="w-7 h-7 border-2 border-[#CC6F00] border-t-transparent rounded-full animate-spin"></div>
            <span className="font-medium text-[#4D2A00]/70">Loading gate pass records...</span>
          </div>
        ) : passes.length === 0 ? (
          <div className="p-14 text-center text-xs text-[#4D2A00]/60">
            No gate pass requests found on file.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FDB773]/30 border-b border-[rgba(77,42,0,0.1)] text-[#4D2A00] font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 font-bold">Pass ID</th>
                  <th className="py-3.5 px-4 font-bold">Student</th>
                  <th className="py-3.5 px-4 font-bold">Type</th>
                  <th className="py-3.5 px-4 font-bold">Destination & Purpose</th>
                  <th className="py-3.5 px-4 font-bold">Departure</th>
                  <th className="py-3.5 px-4 font-bold">Expected Return</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(77,42,0,0.06)]">
                {passes.map((p) => (
                  <tr key={p.id} className="hover:bg-white/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#CC6F00]">
                      #{p.passNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#4D2A00]">{p.student.fullName}</div>
                      <div className="text-[11px] text-[#4D2A00]/60 font-mono">{p.student.rollNumber}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#4D2A00]/80">{p.type}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#4D2A00]">{p.destination}</div>
                      <div className="text-[11px] text-[#4D2A00]/60 truncate max-w-xs mt-0.5">{p.reason}</div>
                    </td>
                    <td className="py-3.5 px-4 text-[#4D2A00]/70 font-mono">
                      {new Date(p.departureDate).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="py-3.5 px-4 text-[#4D2A00]/70 font-mono">
                      {new Date(p.expectedReturnDate).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(p.status)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {(p.status === "APPROVED" || p.status === "EXITED") && (
                          <button
                            onClick={() => handleViewQr(p.id)}
                            className="btn-primary inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold shadow-sm"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>View QR</span>
                          </button>
                        )}

                        {isWardenOrAdmin && p.status === "PENDING" && (
                          <div className="flex items-center space-x-1.5">
                            <button
                              onClick={() => handleReview(p.id, "APPROVED")}
                              className="btn-primary px-3 py-1 text-xs font-bold"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReview(p.id, "REJECTED")}
                              className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-900 border border-rose-500/30 font-bold rounded-xl text-xs transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Apply Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-fadeIn">
          <div className="glass-modal max-w-lg w-full p-6 sm:p-8 space-y-5 text-xs rounded-3xl border border-[rgba(77,42,0,0.15)] shadow-glass">
            <div className="flex items-center justify-between border-b border-[rgba(77,42,0,0.1)] pb-3">
              <h2 className="text-base font-bold text-[#4D2A00]">Apply for Student Gate Pass</h2>
              <button onClick={() => setShowModal(false)} className="text-[#4D2A00]/60 hover:text-[#4D2A00]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-900 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block font-semibold text-[#4D2A00] mb-1">Pass Category *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white/60 border border-[rgba(77,42,0,0.12)] rounded-xl text-[#4D2A00] focus:outline-none focus:border-[#CC6F00]"
                >
                  <option value="OUTING">Local City Outing (Return by curfew)</option>
                  <option value="HOME_LEAVE">Home Leave / Weekend Vacation</option>
                  <option value="EMERGENCY">Medical / Emergency Outing</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#4D2A00] mb-1">Destination Address *</label>
                <input
                  type="text"
                  required
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  placeholder="e.g. Cuttack Main City / Home Residence"
                  className="w-full px-3.5 py-2.5 bg-white/60 border border-[rgba(77,42,0,0.12)] rounded-xl text-[#4D2A00] placeholder-[#4D2A00]/40 focus:outline-none focus:border-[#CC6F00]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#4D2A00] mb-1">Departure Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.departureDate}
                    onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white/60 border border-[rgba(77,42,0,0.12)] rounded-xl text-[#4D2A00] focus:outline-none focus:border-[#CC6F00]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#4D2A00] mb-1">Expected Return Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.expectedReturnDate}
                    onChange={(e) => setFormData({ ...formData, expectedReturnDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white/60 border border-[rgba(77,42,0,0.12)] rounded-xl text-[#4D2A00] focus:outline-none focus:border-[#CC6F00]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#4D2A00] mb-1">Emergency Parent / Guardian Contact *</label>
                <input
                  type="tel"
                  required
                  value={formData.parentContact}
                  onChange={(e) => setFormData({ ...formData, parentContact: e.target.value })}
                  placeholder="Parent phone number for warden verification"
                  className="w-full px-3.5 py-2.5 bg-white/60 border border-[rgba(77,42,0,0.12)] rounded-xl text-[#4D2A00] placeholder-[#4D2A00]/40 focus:outline-none focus:border-[#CC6F00] font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#4D2A00] mb-1">Purpose / Justification *</label>
                <textarea
                  required
                  rows={3}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="State the reason for campus leave..."
                  className="w-full px-3.5 py-2.5 bg-white/60 border border-[rgba(77,42,0,0.12)] rounded-xl text-[#4D2A00] placeholder-[#4D2A00]/40 focus:outline-none focus:border-[#CC6F00] resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-[rgba(77,42,0,0.1)]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary px-6 py-2 text-xs font-bold disabled:opacity-50 shadow-sm"
                >
                  {submitting ? "Submitting..." : "Submit Pass Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeQrPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-fadeIn">
          <div className="glass-modal max-w-sm w-full p-6 text-center space-y-4 rounded-3xl border border-[rgba(77,42,0,0.15)] shadow-glass">
            <div className="flex items-center justify-between border-b border-[rgba(77,42,0,0.1)] pb-3">
              <span className="font-bold text-sm text-[#4D2A00]">Gate Security Pass Token</span>
              <button onClick={() => setActiveQrPass(null)} className="text-[#4D2A00]/60 hover:text-[#4D2A00]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <p className="font-mono text-base font-bold text-[#CC6F00]">#{activeQrPass.pass.passNumber}</p>
              <p className="font-bold text-sm text-[#4D2A00]">{activeQrPass.pass.student.fullName}</p>
              <p className="text-xs text-[#4D2A00]/70">{activeQrPass.pass.student.rollNumber} • {activeQrPass.pass.student.hostelBlock}</p>
            </div>

            <div className="p-4 bg-white rounded-2xl flex items-center justify-center max-w-[220px] mx-auto shadow-sm border border-[rgba(77,42,0,0.1)]">
              <img src={activeQrPass.qrUrl} alt="Gate Pass QR" className="w-48 h-48" />
            </div>

            <div className="text-xs text-[#4D2A00]/80 bg-white/50 p-3.5 rounded-2xl border border-[rgba(77,42,0,0.08)] space-y-1 text-left">
              <p><strong>Destination:</strong> {activeQrPass.pass.destination}</p>
              <p><strong>Valid Return:</strong> {new Date(activeQrPass.pass.expectedReturnDate).toLocaleString()}</p>
              <p className="text-[#CC6F00] font-bold text-[11px] pt-0.5">✓ Cryptographically Signed Token</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GatePassPage;
