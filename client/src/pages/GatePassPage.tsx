import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { QrCode, Plus, CheckCircle, XCircle, Clock, Shield, ArrowRight, User } from "lucide-react";
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
        return <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-[4px]">Approved</span>;
      case "PENDING":
        return <span className="px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300 rounded-[4px]">Pending Review</span>;
      case "EXITED":
        return <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-900 border border-blue-300 rounded-[4px]">Outside Campus</span>;
      case "RETURNED":
        return <span className="px-2 py-0.5 text-xs font-semibold bg-stone-200 text-stone-800 border border-stone-300 rounded-[4px]">Returned</span>;
      case "REJECTED":
        return <span className="px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-900 border border-red-300 rounded-[4px]">Rejected</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold bg-stone-100 text-stone-800 rounded-[4px]">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-stone-300 p-4 rounded-[6px]">
        <div>
          <h1 className="text-xl font-bold text-stone-900">
            {t("gatepass.title", "Gate Pass & Leave Requests")}
          </h1>
          <p className="text-xs text-stone-600 mt-0.5">
            Digital gate pass authorization, QR verification for security guards and exit/entry logging
          </p>
        </div>

        {user?.role === "STUDENT" && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center space-x-2 bg-[#0f4c3a] text-white hover:bg-[#0b392b] text-xs font-semibold px-4 py-2 rounded-[4px]"
          >
            <Plus className="w-4 h-4" />
            <span>{t("gatepass.newPass", "New Gate Pass Request")}</span>
          </button>
        )}
      </div>

      {/* Gate Pass Table */}
      <div className="bg-white border border-stone-300 rounded-[6px] overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-xs text-stone-500">Loading gate pass records...</div>
        ) : passes.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-500">
            No gate pass requests found on file.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-100 border-b border-stone-300 text-stone-700 font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Pass #</th>
                  <th className="py-2.5 px-3">Student</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Destination & Reason</th>
                  <th className="py-2.5 px-3">Departure</th>
                  <th className="py-2.5 px-3">Expected Return</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {passes.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-950">
                      #{p.passNumber}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-stone-900">{p.student.fullName}</div>
                      <div className="text-[11px] text-stone-500 font-mono">{p.student.rollNumber}</div>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-stone-800">{p.type}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-stone-900">{p.destination}</div>
                      <div className="text-[11px] text-stone-600 truncate max-w-xs">{p.reason}</div>
                    </td>
                    <td className="py-2.5 px-3 text-stone-700">
                      {new Date(p.departureDate).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="py-2.5 px-3 text-stone-700">
                      {new Date(p.expectedReturnDate).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="py-2.5 px-3">{getStatusBadge(p.status)}</td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {(p.status === "APPROVED" || p.status === "EXITED") && (
                          <button
                            onClick={() => handleViewQr(p.id)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-bold text-[#0f4c3a] bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-[4px]"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>View QR</span>
                          </button>
                        )}

                        {isWardenOrAdmin && p.status === "PENDING" && (
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleReview(p.id, "APPROVED")}
                              className="px-2 py-1 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-[4px] text-[11px]"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReview(p.id, "REJECTED")}
                              className="px-2 py-1 bg-red-800 hover:bg-red-900 text-white font-semibold rounded-[4px] text-[11px]"
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
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-stone-300 rounded-[6px] max-w-sm w-full p-6 text-center space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <span className="font-mono font-bold text-sm text-stone-900">
                Gate Pass #{activeQrPass.pass.passNumber}
              </span>
              <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-900 font-bold border border-emerald-300 rounded-[4px]">
                {activeQrPass.pass.status}
              </span>
            </div>

            <div className="p-3 bg-stone-50 border border-stone-200 rounded-[4px] inline-block">
              <img
                src={activeQrPass.qrUrl}
                alt="Gate Pass QR Code"
                className="w-48 h-48 mx-auto"
              />
            </div>

            <div className="text-xs text-left space-y-1 bg-stone-50 p-3 rounded-[4px] border border-stone-200">
              <div><strong>Student:</strong> {activeQrPass.pass.student.fullName} ({activeQrPass.pass.student.rollNumber})</div>
              <div><strong>Destination:</strong> {activeQrPass.pass.destination}</div>
              <div><strong>Valid Until:</strong> {new Date(activeQrPass.pass.expectedReturnDate).toLocaleString()}</div>
              {activeQrPass.pass.wardenComment && (
                <div><strong>Warden Note:</strong> {activeQrPass.pass.wardenComment}</div>
              )}
            </div>

            <p className="text-[11px] text-stone-500">
              Present this QR code to campus security at the main turnstile upon exit and return.
            </p>

            <button
              onClick={() => setActiveQrPass(null)}
              className="w-full py-2 bg-stone-800 text-white text-xs font-semibold rounded-[4px] hover:bg-stone-900"
            >
              Close QR Pass
            </button>
          </div>
        </div>
      )}

      {/* New Gate Pass Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-stone-300 rounded-[6px] max-w-lg w-full p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <h2 className="text-base font-bold text-stone-900">New Gate Pass / Leave Request</h2>
              <button onClick={() => setShowModal(false)} className="text-stone-500 hover:text-stone-800 font-bold text-sm">
                &times;
              </button>
            </div>

            {error && (
              <div className="p-2 text-xs text-red-900 bg-red-50 border border-red-200 rounded-[4px]">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-800 mb-1">Pass Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-stone-300 rounded-[4px] bg-white text-stone-800"
                >
                  <option value="OUTING">Daytime Outing (Return by evening)</option>
                  <option value="HOME_LEAVE">Home Leave / Vacation</option>
                  <option value="EMERGENCY">Emergency Leave</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-800 mb-1">Destination *</label>
                <input
                  type="text"
                  required
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  placeholder="e.g. Bhubaneswar City Center"
                  className="w-full px-2.5 py-1.5 border border-stone-300 rounded-[4px]"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-800 mb-1">Reason for Leave *</label>
                <textarea
                  required
                  rows={2}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Specify purpose of visit..."
                  className="w-full px-2.5 py-1.5 border border-stone-300 rounded-[4px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Departure Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.departureDate}
                    onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-stone-300 rounded-[4px]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Expected Return Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.expectedReturnDate}
                    onChange={(e) => setFormData({ ...formData, expectedReturnDate: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-stone-300 rounded-[4px]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-800 mb-1">Parent Contact Number *</label>
                <input
                  type="tel"
                  required
                  value={formData.parentContact}
                  onChange={(e) => setFormData({ ...formData, parentContact: e.target.value })}
                  placeholder="e.g. 9876543210"
                  className="w-full px-2.5 py-1.5 border border-stone-300 rounded-[4px]"
                />
              </div>

              <div className="pt-2 border-t border-stone-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 border border-stone-300 rounded-[4px] text-stone-700 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-[#0f4c3a] text-white font-semibold rounded-[4px] hover:bg-[#0b392b] disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Pass Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
