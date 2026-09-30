import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { QrCode, Plus, CheckCircle, XCircle, Clock, Shield, ArrowRight, User, X } from "lucide-react";
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
        return <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-[3px]">Approved</span>;
      case "PENDING":
        return <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-[3px]">Pending Review</span>;
      case "EXITED":
        return <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/30 rounded-[3px]">Outside Campus</span>;
      case "RETURNED":
        return <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-[#181D22] text-[#A7ADB5] border border-[#252B31] rounded-[3px]">Returned</span>;
      case "REJECTED":
        return <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-red-500/10 text-red-300 border border-red-500/30 rounded-[3px]">Rejected</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-[#181D22] text-[#F3F4F6] rounded-[3px] border border-[#252B31]">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#14181C] border border-[#252B31] p-5 rounded-[6px] shadow-subtle">
        <div>
          <div className="flex items-center space-x-2 text-[#D6A84F] text-[11px] font-mono uppercase mb-1">
            <QrCode className="w-3.5 h-3.5" />
            <span>Digital Gate Passes</span>
          </div>
          <h1 className="text-xl font-bold text-[#F3F4F6]">
            {t("gatepass.title", "Gate Pass & Leave Management")}
          </h1>
          <p className="text-xs text-[#A7ADB5] mt-0.5">
            Digital gate pass authorization, cryptographic QR verification for campus security and departure logging
          </p>
        </div>

        {user?.role === "STUDENT" && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center space-x-2 bg-[#D6A84F] hover:bg-[#F0C86A] text-[#090B0D] text-xs font-bold px-4 py-2.5 rounded-[4px] shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{t("gatepass.newPass", "Apply for Gate Pass")}</span>
          </button>
        )}
      </div>

      {/* Gate Pass Table */}
      <div className="bg-[#14181C] border border-[#252B31] rounded-[6px] overflow-hidden shadow-subtle">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#A7ADB5] flex flex-col items-center justify-center space-y-2">
            <div className="w-6 h-6 border-2 border-[#D6A84F] border-t-transparent rounded-full animate-spin"></div>
            <span className="font-mono">Loading gate pass records...</span>
          </div>
        ) : passes.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#6F7781]">
            No gate pass requests found on file.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#101316] border-b border-[#252B31] text-[#A7ADB5] font-mono uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Pass ID</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Destination & Purpose</th>
                  <th className="py-3 px-4">Departure</th>
                  <th className="py-3 px-4">Expected Return</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#252B31]">
                {passes.map((p) => (
                  <tr key={p.id} className="hover:bg-[#181D22] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#D6A84F]">
                      #{p.passNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#F3F4F6]">{p.student.fullName}</div>
                      <div className="text-[11px] text-[#6F7781] font-mono">{p.student.rollNumber}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-[#A7ADB5]">{p.type}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-[#F3F4F6]">{p.destination}</div>
                      <div className="text-[11px] text-[#6F7781] truncate max-w-xs mt-0.5">{p.reason}</div>
                    </td>
                    <td className="py-3 px-4 text-[#A7ADB5] font-mono">
                      {new Date(p.departureDate).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="py-3 px-4 text-[#A7ADB5] font-mono">
                      {new Date(p.expectedReturnDate).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(p.status)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {(p.status === "APPROVED" || p.status === "EXITED") && (
                          <button
                            onClick={() => handleViewQr(p.id)}
                            className="inline-flex items-center space-x-1.5 px-3 py-1 text-xs font-bold text-[#D6A84F] hover:text-[#090B0D] bg-[#181D22] hover:bg-[#D6A84F] border border-[#D6A84F]/30 rounded-[4px] transition-all shadow-xs"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>View QR</span>
                          </button>
                        )}

                        {isWardenOrAdmin && p.status === "PENDING" && (
                          <div className="flex items-center space-x-1.5">
                            <button
                              onClick={() => handleReview(p.id, "APPROVED")}
                              className="px-2.5 py-1 bg-[#10B981] hover:bg-emerald-400 text-[#090B0D] font-bold rounded-[3px] text-[11px] transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReview(p.id, "REJECTED")}
                              className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-300 border border-red-500/30 font-bold rounded-[3px] text-[11px] transition-colors"
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

      {/* QR Code Modal for Gate Pass */}
      {activeQrPass && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#14181C] border border-[#252B31] rounded-[6px] max-w-sm w-full p-6 text-center space-y-4 shadow-elevated">
            <div className="flex items-center justify-between border-b border-[#252B31] pb-2">
              <span className="font-mono font-bold text-sm text-[#D6A84F]">
                Gate Pass #{activeQrPass.pass.passNumber}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-300 font-bold border border-emerald-500/30 rounded-[3px]">
                {activeQrPass.pass.status}
              </span>
            </div>

            <div className="p-4 bg-white rounded-[6px] inline-block shadow-subtle">
              <img
                src={activeQrPass.qrUrl}
                alt="Gate Pass QR Code"
                className="w-48 h-48 mx-auto"
              />
            </div>

            <div className="text-xs text-left space-y-1.5 bg-[#101316] p-3.5 rounded-[4px] border border-[#252B31]">
              <div><strong className="text-[#A7ADB5]">Student:</strong> <span className="text-[#F3F4F6] font-medium">{activeQrPass.pass.student.fullName} ({activeQrPass.pass.student.rollNumber})</span></div>
              <div><strong className="text-[#A7ADB5]">Destination:</strong> <span className="text-[#F3F4F6]">{activeQrPass.pass.destination}</span></div>
              <div><strong className="text-[#A7ADB5]">Valid Return:</strong> <span className="text-[#F3F4F6] font-mono">{new Date(activeQrPass.pass.expectedReturnDate).toLocaleString()}</span></div>
              {activeQrPass.pass.wardenComment && (
                <div><strong className="text-[#A7ADB5]">Warden Remark:</strong> <span className="text-[#F3F4F6]">{activeQrPass.pass.wardenComment}</span></div>
              )}
            </div>

            <p className="text-[11px] text-[#6F7781] leading-relaxed">
              Present this encrypted QR code to the main gate scanner upon physical exit and entry.
            </p>

            <button
              onClick={() => setActiveQrPass(null)}
              className="w-full py-2 bg-[#181D22] hover:bg-[#252B31] text-[#F3F4F6] text-xs font-semibold rounded-[4px] border border-[#252B31] transition-colors"
            >
              Close QR Pass
            </button>
          </div>
        </div>
      )}

      {/* New Gate Pass Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#14181C] border border-[#252B31] rounded-[6px] max-w-lg w-full p-6 space-y-4 shadow-elevated">
            <div className="flex items-center justify-between border-b border-[#252B31] pb-2">
              <h2 className="text-base font-bold text-[#F3F4F6]">New Gate Pass / Leave Application</h2>
              <button onClick={() => setShowModal(false)} className="text-[#6F7781] hover:text-[#F3F4F6]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-2.5 text-xs text-red-200 bg-red-500/10 border border-red-500/30 rounded-[4px]">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#A7ADB5] mb-1">Pass Classification *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-[#252B31] rounded-[4px] bg-[#101316] text-[#F3F4F6] focus:outline-none focus:border-[#D6A84F]"
                >
                  <option value="OUTING">Daytime Outing (Return before curfew)</option>
                  <option value="HOME_LEAVE">Home Leave / Vacation</option>
                  <option value="EMERGENCY">Emergency Leave</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#A7ADB5] mb-1">Destination Address *</label>
                <input
                  type="text"
                  required
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  placeholder="e.g. Bhubaneswar City Center"
                  className="w-full px-3 py-2 border border-[#252B31] rounded-[4px] bg-[#101316] text-[#F3F4F6] focus:outline-none focus:border-[#D6A84F]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#A7ADB5] mb-1">Detailed Reason for Leave *</label>
                <textarea
                  required
                  rows={2}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Specify purpose of visit..."
                  className="w-full px-3 py-2 border border-[#252B31] rounded-[4px] bg-[#101316] text-[#F3F4F6] focus:outline-none focus:border-[#D6A84F]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#A7ADB5] mb-1">Departure Schedule *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.departureDate}
                    onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                    className="w-full px-3 py-2 border border-[#252B31] rounded-[4px] bg-[#101316] text-[#F3F4F6] focus:outline-none focus:border-[#D6A84F]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#A7ADB5] mb-1">Expected Return Schedule *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.expectedReturnDate}
                    onChange={(e) => setFormData({ ...formData, expectedReturnDate: e.target.value })}
                    className="w-full px-3 py-2 border border-[#252B31] rounded-[4px] bg-[#101316] text-[#F3F4F6] focus:outline-none focus:border-[#D6A84F]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#A7ADB5] mb-1">Parent / Guardian Verification Phone *</label>
                <input
                  type="tel"
                  required
                  value={formData.parentContact}
                  onChange={(e) => setFormData({ ...formData, parentContact: e.target.value })}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3 py-2 border border-[#252B31] rounded-[4px] bg-[#101316] text-[#F3F4F6] focus:outline-none focus:border-[#D6A84F]"
                />
              </div>

              <div className="pt-3 border-t border-[#252B31] flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-1.5 border border-[#252B31] rounded-[4px] text-[#A7ADB5] hover:text-[#F3F4F6] hover:bg-[#181D22] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-[#D6A84F] hover:bg-[#F0C86A] text-[#090B0D] font-bold rounded-[4px] disabled:opacity-50 transition-colors shadow-xs"
                >
                  {submitting ? "Submitting Application..." : "Submit Pass Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
