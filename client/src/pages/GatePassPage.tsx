import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  QrCode,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  ArrowRight,
  User,
  X,
  ChevronRight,
  AlertTriangle,
  FileText,
  Calendar,
  Phone,
  Building,
  CheckCircle2
} from "lucide-react";
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
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedPass, setSelectedPass] = useState<GatePassItem | null>(null);

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
      const list = data.passes || [];
      setPasses(list);
      if (list.length > 0 && !selectedPass) {
        setSelectedPass(list[0]);
      }
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
        return <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded">APPROVED</span>;
      case "PENDING":
        return <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 rounded">WARDEN REVIEW</span>;
      case "EXITED":
        return <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#FF6D1F]/15 text-[#FF6D1F] border border-[#FF6D1F]/30 rounded">EXITED GATE</span>;
      case "RETURNED":
        return <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)] rounded">RETURNED</span>;
      case "REJECTED":
        return <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded">REJECTED</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[var(--bg-elevated)] text-[var(--text-secondary)] rounded border border-[var(--border-subtle)]">{status}</span>;
    }
  };

  // Section 30: 5-Stage Gate Pass Workflow Timeline Calculator
  const getTimelineStep = (status: string) => {
    switch (status) {
      case "PENDING": return 2; // Step 2: Warden Review
      case "APPROVED": return 3; // Step 3: Approved
      case "EXITED": return 4; // Step 4: Exited
      case "RETURNED": return 5; // Step 5: Returned
      case "REJECTED": return 0; // Rejected
      default: return 1; // Step 1: Requested
    }
  };

  const filteredPasses = passes.filter((p) => {
    if (statusFilter === "ALL") return true;
    return p.status === statusFilter;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header — Campus OS Editorial */}
      <div className="campus-panel rounded-2xl p-6 sm:p-8 border border-[var(--border-subtle)]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="editorial-eyebrow">06 // RESIDENCY & PERMITS</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                SECURITY VERIFIED
              </span>
            </div>
            <h1 className="editorial-title text-2xl sm:text-3xl text-[var(--text-primary)]">
              {t("gatepass.title", "Digital Gate Pass & Clearance Timeline")}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-2xl leading-relaxed">
              Cryptographic pass authorization, sequential warden clearance, QR security checkpoint verification, and curfew departure logging.
            </p>
          </div>

          {user?.role === "STUDENT" && (
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary inline-flex items-center space-x-2 text-xs font-bold px-5 py-2.5 rounded-xl shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{t("gatepass.newPass", "Apply for Gate Pass")}</span>
            </button>
          )}
        </div>
      </div>

      {/* Section 30: Dedicated Timeline-like Workflow Strip */}
      <div className="campus-block border border-[var(--border-subtle)] rounded-xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3 text-xs font-mono">
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
            GATE PASS PROTOCOL TIMELINE
          </span>
          <span className="text-[10px] text-[var(--text-subtle)]">5-Stage Sequential State Engine</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs font-mono">
          <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex flex-col items-center justify-center space-y-1">
            <span className="text-[9px] text-[#FF6D1F] font-bold">01 STAGE</span>
            <span className="font-bold text-[var(--text-primary)] text-xs">REQUESTED</span>
            <span className="text-[10px] text-[var(--text-muted)]">Student Submission</span>
          </div>

          <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex flex-col items-center justify-center space-y-1">
            <span className="text-[9px] text-amber-600 dark:text-amber-300 font-bold">02 STAGE</span>
            <span className="font-bold text-[var(--text-primary)] text-xs">WARDEN REVIEW</span>
            <span className="text-[10px] text-[var(--text-muted)]">Approval & Contact</span>
          </div>

          <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex flex-col items-center justify-center space-y-1">
            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">03 STAGE</span>
            <span className="font-bold text-[var(--text-primary)] text-xs">APPROVED</span>
            <span className="text-[10px] text-[var(--text-muted)]">QR Token Generated</span>
          </div>

          <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex flex-col items-center justify-center space-y-1">
            <span className="text-[9px] text-[#FF6D1F] font-bold">04 STAGE</span>
            <span className="font-bold text-[var(--text-primary)] text-xs">EXITED GATE</span>
            <span className="text-[10px] text-[var(--text-muted)]">Scanned Departure</span>
          </div>

          <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex flex-col items-center justify-center space-y-1 col-span-2 sm:col-span-1">
            <span className="text-[9px] text-[var(--text-secondary)] font-bold">05 STAGE</span>
            <span className="font-bold text-[var(--text-primary)] text-xs">RETURNED</span>
            <span className="text-[10px] text-[var(--text-muted)]">Curfew Re-entry Check</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {["ALL", "PENDING", "APPROVED", "EXITED", "RETURNED", "REJECTED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                statusFilter === st
                  ? "bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
              }`}
            >
              {st} {st === "ALL" ? `(${passes.length})` : `(${passes.filter((p) => p.status === st).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Gate Pass Table & Layout */}
      <div className="campus-panel rounded-2xl overflow-hidden border border-[var(--border-subtle)]">
        {loading ? (
          <div className="p-16 text-center text-xs text-[var(--text-muted)] flex flex-col items-center justify-center space-y-2 font-mono">
            <div className="w-7 h-7 border-2 border-[#FF6D1F] border-t-transparent rounded-full animate-spin"></div>
            <span>Loading gate pass records...</span>
          </div>
        ) : filteredPasses.length === 0 ? (
          <div className="p-16 text-center text-xs text-[var(--text-muted)] font-mono space-y-2">
            <FileText className="w-8 h-8 text-[var(--text-muted)]/40 mx-auto" />
            <p>No gate pass records found matching selected filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] text-[var(--text-secondary)] font-mono uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Pass ID</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Destination & Reason</th>
                  <th className="py-3 px-4">Departure</th>
                  <th className="py-3 px-4">Expected Return</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] font-mono text-xs">
                {filteredPasses.map((p) => {
                  const step = getTimelineStep(p.status);
                  return (
                    <tr key={p.id} className="hover:bg-[var(--bg-hover)]/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#FF6D1F]">
                        #{p.passNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[var(--text-primary)] font-sans">{p.student.fullName}</div>
                        <div className="text-[11px] text-[var(--text-muted)] font-mono">{p.student.rollNumber} • {p.student.hostelBlock}</div>
                      </td>
                      <td className="py-3.5 px-4 text-[var(--text-secondary)] font-mono text-[11px]">
                        <span className="px-2 py-0.5 bg-[var(--bg-elevated)] rounded border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                          {p.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-medium text-[var(--text-primary)] truncate">{p.destination}</div>
                        <div className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">{p.reason}</div>
                      </td>
                      <td className="py-3.5 px-4 text-[var(--text-secondary)]">
                        {new Date(p.departureDate).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                      </td>
                      <td className="py-3.5 px-4 text-[var(--text-secondary)]">
                        {new Date(p.expectedReturnDate).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                      </td>
                      <td className="py-3.5 px-4">{getStatusBadge(p.status)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {(p.status === "APPROVED" || p.status === "EXITED") && (
                            <button
                              onClick={() => handleViewQr(p.id)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-[var(--bg-elevated)] text-[#FF6D1F] border border-[var(--border-subtle)] hover:border-[#FF6D1F] inline-flex items-center space-x-1.5"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                              <span>QR Pass</span>
                            </button>
                          )}

                          {isWardenOrAdmin && p.status === "PENDING" && (
                            <div className="flex items-center space-x-1.5">
                              <button
                                onClick={() => handleReview(p.id, "APPROVED")}
                                className="btn-primary px-3 py-1 text-xs font-bold rounded-lg"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReview(p.id, "REJECTED")}
                                className="px-3 py-1 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 font-bold rounded-lg text-xs transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Apply Modal — Campus OS */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="campus-block max-w-lg w-full p-6 sm:p-7 space-y-4 text-xs rounded-2xl border border-[var(--border-subtle)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div>
                <h2 className="text-sm font-bold text-[var(--text-primary)] font-mono uppercase tracking-wider">Apply for Student Gate Pass</h2>
                <p className="text-xs text-[var(--text-secondary)]">Outing & leave approval with automated warden workflow.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-600 dark:text-rose-400 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div>
                <label className="block font-mono uppercase text-[10px] text-[var(--text-secondary)] mb-1">Pass Category *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[#FF6D1F] font-mono"
                >
                  <option value="OUTING">Local City Outing (Return by curfew)</option>
                  <option value="HOME_LEAVE">Home Leave / Weekend Vacation</option>
                  <option value="EMERGENCY">Medical / Emergency Outing</option>
                </select>
              </div>

              <div>
                <label className="block font-mono uppercase text-[10px] text-[var(--text-secondary)] mb-1">Destination Address *</label>
                <input
                  type="text"
                  required
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  placeholder="e.g. Cuttack Main City / Home Residence"
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF6D1F]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono uppercase text-[10px] text-[var(--text-secondary)] mb-1">Departure Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.departureDate}
                    onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[#FF6D1F] font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block font-mono uppercase text-[10px] text-[var(--text-secondary)] mb-1">Expected Return Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.expectedReturnDate}
                    onChange={(e) => setFormData({ ...formData, expectedReturnDate: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[#FF6D1F] font-mono text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono uppercase text-[10px] text-[var(--text-secondary)] mb-1">Emergency Parent / Guardian Contact *</label>
                <input
                  type="tel"
                  required
                  value={formData.parentContact}
                  onChange={(e) => setFormData({ ...formData, parentContact: e.target.value })}
                  placeholder="Parent phone number for warden verification"
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF6D1F] font-mono"
                />
              </div>

              <div>
                <label className="block font-mono uppercase text-[10px] text-[var(--text-secondary)] mb-1">Purpose / Justification *</label>
                <textarea
                  required
                  rows={2}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="State the reason for campus leave..."
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF6D1F] resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary px-4 py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary px-5 py-2 text-xs font-bold rounded-xl disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Pass Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Modal — Cryptographic Token */}
      {activeQrPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="campus-block max-w-sm w-full p-6 text-center space-y-4 rounded-2xl border border-[var(--border-subtle)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <span className="font-mono text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Gate Security Token</span>
              <button onClick={() => setActiveQrPass(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <p className="font-mono text-base font-bold text-[#FF6D1F]">#{activeQrPass.pass.passNumber}</p>
              <p className="font-bold text-sm text-[var(--text-primary)]">{activeQrPass.pass.student.fullName}</p>
              <p className="text-xs text-[var(--text-muted)] font-mono">{activeQrPass.pass.student.rollNumber} • {activeQrPass.pass.student.hostelBlock}</p>
            </div>

            <div className="p-3 bg-white rounded-xl flex items-center justify-center max-w-[200px] mx-auto shadow-sm">
              <img src={activeQrPass.qrUrl} alt="Gate Pass QR" className="w-44 h-44" />
            </div>

            <div className="text-xs text-[var(--text-secondary)] bg-[var(--bg-elevated)] p-3 rounded-xl border border-[var(--border-subtle)] space-y-1 text-left font-mono">
              <p><strong className="text-[var(--text-muted)]">DESTINATION:</strong> {activeQrPass.pass.destination}</p>
              <p><strong className="text-[var(--text-muted)]">VALID UNTIL:</strong> {new Date(activeQrPass.pass.expectedReturnDate).toLocaleString()}</p>
              <p className="text-[#FF6D1F] font-bold text-[10px] pt-1">✓ Cryptographically Signed Security Token</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GatePassPage;
