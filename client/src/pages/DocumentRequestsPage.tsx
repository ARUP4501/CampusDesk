import React, { useState, useEffect } from "react";
import { FileText, Download, Plus, CheckCircle2, Clock, XCircle, AlertCircle, X, ShieldCheck, Files } from "lucide-react";
import { apiRequest, UserProfile } from "../api/client.js";

interface DocumentRequestItem {
  id: string;
  requestNumber: string;
  docType: string;
  purpose: string;
  status: string;
  remarks?: string;
  createdAt: string;
  student: {
    fullName: string;
    rollNumber: string;
    branch?: string;
    year?: number;
    batch?: string;
  };
  approvedBy?: { fullName: string };
}

export const DocumentRequestsPage: React.FC<{ user: UserProfile | null }> = ({ user }) => {
  const [requests, setRequests] = useState<DocumentRequestItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);

  // Form states
  const [docType, setDocType] = useState<string>("BONAFIDE_CERTIFICATE");
  const [purpose, setPurpose] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Admin status update states
  const [reviewRemarks, setReviewRemarks] = useState<string>("");
  const isAdminOrStaff = user && (user.role === "ADMIN" || user.role === "STAFF");

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<{ requests: DocumentRequestItem[] }>("/api/documents");
      setRequests(data.requests || []);
    } catch (err) {
      console.error("Failed to load document requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await apiRequest("/api/documents", {
        method: "POST",
        body: JSON.stringify({ docType, purpose })
      });
      setShowModal(false);
      setPurpose("");
      fetchRequests();
    } catch (err: any) {
      setError(err.message || "Failed to submit document request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await apiRequest(`/api/documents/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, remarks: reviewRemarks || undefined })
      });
      setReviewRemarks("");
      fetchRequests();
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>APPROVED</span>
          </span>
        );
      case "SUBMITTED":
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>SUBMITTED</span>
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 text-[10px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 rounded">
            <XCircle className="w-3 h-3 text-rose-400" />
            <span>REJECTED</span>
          </span>
        );
      default:
        return <span className="px-2 py-0.5 text-[10px] font-mono bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)] rounded">{status}</span>;
    }
  };

  const getDocTypeName = (type: string) => {
    switch (type) {
      case "BONAFIDE_CERTIFICATE":
        return "Bonafide Student Certificate";
      case "FEE_STRUCTURE":
        return "Official Fee Structure Estimate";
      case "HOSTEL_RESIDENCE":
        return "Hostel Residence Proof Letter";
      case "NOC_INTERNSHIP":
        return "No Objection Certificate (Internship)";
      default:
        return type.replace(/_/g, " ");
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="campus-panel rounded-2xl p-6 sm:p-8 border border-[var(--border-subtle)]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="editorial-eyebrow">10 // CERTIFICATES & ENDORSEMENTS</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                OFFICIAL VERIFICATION
              </span>
            </div>
            <h1 className="editorial-title text-2xl sm:text-3xl text-[var(--text-primary)]">Institutional Document Issuance</h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-2xl leading-relaxed">
              Request official Bonafide certificates, Fee Structures, and NOCs with cryptographic authorization and PDF download.
            </p>
          </div>

          {user?.role === "STUDENT" && (
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary inline-flex items-center space-x-2 text-xs font-bold px-5 py-2.5 rounded-xl shrink-0 font-mono"
            >
              <Plus className="w-4 h-4" />
              <span>Request Certificate</span>
            </button>
          )}
        </div>
      </div>

      {/* Requests Table */}
      <div className="campus-panel rounded-2xl overflow-hidden border border-[var(--border-subtle)]">
        {loading ? (
          <div className="p-16 text-center text-xs text-[var(--text-muted)] font-mono">
            Loading document requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="p-16 text-center text-xs text-[var(--text-muted)] font-mono space-y-2">
            <Files className="w-8 h-8 text-[var(--text-muted)]/40 mx-auto" />
            <p>No official document requests on file.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] text-[var(--text-secondary)] font-mono uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Request #</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Document Type</th>
                  <th className="py-3 px-4">Stated Purpose</th>
                  <th className="py-3 px-4">Submitted</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] font-mono text-xs">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-[var(--bg-hover)]/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#FF6D1F]">
                      #{r.requestNumber}
                    </td>
                    <td className="py-3.5 px-4 font-sans font-medium text-[var(--text-primary)]">
                      {r.student?.fullName}
                      <span className="text-[11px] font-mono text-[var(--text-muted)] block">
                        {r.student?.rollNumber}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[var(--text-primary)]">
                      {getDocTypeName(r.docType)}
                    </td>
                    <td className="py-3.5 px-4 text-[var(--text-secondary)] truncate max-w-xs">{r.purpose}</td>
                    <td className="py-3.5 px-4 text-[var(--text-muted)]">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(r.status)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {r.status === "APPROVED" && (
                          <a
                            href={`/api/documents/${r.id}/download`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-primary inline-flex items-center space-x-1.5 px-3 py-1.5 font-bold text-xs rounded-lg"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download PDF</span>
                          </a>
                        )}

                        {isAdminOrStaff && r.status === "SUBMITTED" && (
                          <div className="flex items-center space-x-1.5">
                            <button
                              onClick={() => handleUpdateStatus(r.id, "APPROVED")}
                              className="btn-primary px-3 py-1 text-xs font-bold rounded-lg"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(r.id, "REJECTED")}
                              className="px-3 py-1 bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded-lg text-xs font-bold hover:bg-rose-500/25"
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

      {/* Request Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="campus-block max-w-md w-full p-6 space-y-4 rounded-2xl border border-[var(--border-subtle)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] font-mono uppercase tracking-wider">Request Institutional Certificate</h3>
                <p className="text-xs text-[var(--text-secondary)]">Generate signed PDF endorsed by registrar.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-mono">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[var(--text-secondary)] mb-1 font-mono uppercase text-[10px]">Certificate Category *</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[#FF6D1F] font-mono"
                >
                  <option value="BONAFIDE_CERTIFICATE">Bonafide Student Certificate</option>
                  <option value="FEE_STRUCTURE">Fee Structure Estimate (Bank Loan / Scholarship)</option>
                  <option value="HOSTEL_RESIDENCE">Hostel Residence Proof Letter</option>
                  <option value="NOC_INTERNSHIP">No Objection Certificate (Internship / Training)</option>
                </select>
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] mb-1 font-mono uppercase text-[10px]">Purpose / Reason for Issuance *</label>
                <textarea
                  required
                  rows={3}
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. Required for government scholarship application / passport verification / summer internship..."
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF6D1F] resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[var(--border-subtle)]">
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
                  className="btn-primary px-5 py-2 font-bold rounded-xl disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentRequestsPage;
