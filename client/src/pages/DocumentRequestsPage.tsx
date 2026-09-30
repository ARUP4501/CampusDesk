import React, { useState, useEffect } from "react";
import { FileText, Download, Plus, CheckCircle, Clock, XCircle, AlertCircle, X, ShieldCheck } from "lucide-react";
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
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 text-[11px] font-mono font-medium bg-campus-success/10 text-campus-success border border-campus-success/30 rounded">
            <CheckCircle className="w-3 h-3" />
            <span>Approved</span>
          </span>
        );
      case "SUBMITTED":
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 text-[11px] font-mono font-medium bg-campus-warning/10 text-campus-warning border border-campus-warning/30 rounded">
            <Clock className="w-3 h-3" />
            <span>Submitted</span>
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 text-[11px] font-mono font-medium bg-campus-info/10 text-campus-info border border-campus-info/30 rounded">
            <Clock className="w-3 h-3" />
            <span>Processing</span>
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 text-[11px] font-mono font-medium bg-campus-error/10 text-campus-error border border-campus-error/30 rounded">
            <XCircle className="w-3 h-3" />
            <span>Rejected</span>
          </span>
        );
      default:
        return <span className="px-2 py-0.5 text-[11px] font-mono bg-campus-elevated text-campus-secondary rounded border border-campus-border">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-campus-card border border-campus-border p-5 rounded-lg">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded bg-campus-elevated border border-campus-border flex items-center justify-center text-campus-gold">
              <FileText className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-semibold text-campus-text">Document & Certificate Requests</h1>
          </div>
          <p className="text-xs text-campus-muted mt-1.5 ml-10">
            Request official Bonafide certificates, fee estimates, and transcripts with downloadable PDF generation
          </p>
        </div>

        {user?.role === "STUDENT" && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center space-x-2 bg-campus-gold hover:bg-campus-gold-light text-campus-bg text-xs font-semibold px-4 py-2 rounded transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Request New Document</span>
          </button>
        )}
      </div>

      {/* Requests Table */}
      <div className="bg-campus-card border border-campus-border rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-campus-muted">
            <div className="w-6 h-6 border-2 border-campus-gold border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading document requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-xs text-campus-muted">
            <FileText className="w-8 h-8 text-campus-muted/40 mx-auto mb-2" />
            No document requests recorded on file.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-campus-elevated/60 border-b border-campus-border text-campus-muted font-mono uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Req #</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Document Type</th>
                  <th className="py-3 px-4">Purpose</th>
                  <th className="py-3 px-4">Date Requested</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-campus-border/60">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-campus-elevated/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-campus-gold">
                      #{r.requestNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-campus-text">{r.student.fullName}</div>
                      <div className="text-[11px] text-campus-muted font-mono">{r.student.rollNumber}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-campus-secondary">
                      {r.docType.replace(/_/g, " ")}
                    </td>
                    <td className="py-3 px-4 text-campus-muted max-w-xs truncate">
                      <span>{r.purpose}</span>
                      {r.remarks && (
                        <span className="block text-[10px] text-campus-warning/90 italic mt-0.5">
                          Note: {r.remarks}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-campus-muted font-mono">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(r.status)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {r.status === "APPROVED" && (
                          <a
                            href={`/api/documents/${r.id}/download`}
                            download
                            className="inline-flex items-center space-x-1 px-3 py-1 bg-campus-gold hover:bg-campus-gold-light text-campus-bg font-semibold text-xs rounded transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download PDF</span>
                          </a>
                        )}

                        {isAdminOrStaff && r.status === "SUBMITTED" && (
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleUpdateStatus(r.id, "APPROVED")}
                              className="px-2.5 py-1 bg-campus-success/20 hover:bg-campus-success/30 text-campus-success border border-campus-success/40 font-medium rounded text-[11px] transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(r.id, "REJECTED")}
                              className="px-2.5 py-1 bg-campus-error/20 hover:bg-campus-error/30 text-campus-error border border-campus-error/40 font-medium rounded text-[11px] transition-colors"
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-campus-card border border-campus-border rounded-lg max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-campus-border pb-3">
              <h2 className="text-sm font-semibold text-campus-text flex items-center space-x-2">
                <FileText className="w-4 h-4 text-campus-gold" />
                <span>Request Official Document</span>
              </h2>
              <button onClick={() => setShowModal(false)} className="text-campus-muted hover:text-campus-text transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-2.5 text-xs text-campus-error bg-campus-error/10 border border-campus-error/30 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-campus-secondary mb-1">Document Type *</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-3 py-2 border border-campus-border rounded bg-campus-bg text-campus-text focus:outline-none focus:border-campus-gold"
                >
                  <option value="BONAFIDE_CERTIFICATE">Bonafide Certificate (Scholarships & Bank)</option>
                  <option value="FEE_ESTIMATE">Fee Estimate Certificate (Education Loan)</option>
                  <option value="CHARACTER_CERTIFICATE">Character / Conduct Certificate</option>
                  <option value="HOSTEL_STAY_CERTIFICATE">Hostel Residence Certificate</option>
                  <option value="TRANSCRIPT">Grade Transcript Endorsement</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-campus-secondary mb-1">Purpose of Certificate *</label>
                <textarea
                  required
                  rows={3}
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. State post-matric scholarship application, bank education loan renewal, passport application..."
                  className="w-full p-2.5 bg-campus-bg border border-campus-border rounded text-campus-text placeholder-campus-muted focus:outline-none focus:border-campus-gold resize-none"
                />
              </div>

              <div className="pt-3 border-t border-campus-border flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-2 border border-campus-border rounded text-campus-secondary hover:text-campus-text hover:bg-campus-elevated transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-campus-gold text-campus-bg font-semibold rounded hover:bg-campus-gold-light disabled:opacity-50 transition-colors"
                >
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
