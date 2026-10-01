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
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-950 border border-emerald-500/30 rounded-md">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>Approved</span>
          </span>
        );
      case "SUBMITTED":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 text-[10px] font-mono font-bold bg-[#FDB773]/30 text-[#4D2A00] border border-[#CC6F00]/25 rounded-md">
            <Clock className="w-3.5 h-3.5 text-[#CC6F00]" />
            <span>Submitted</span>
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 text-[10px] font-mono font-bold bg-rose-500/20 text-rose-900 border border-rose-500/30 rounded-md">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Rejected</span>
          </span>
        );
      default:
        return <span className="px-2.5 py-1 text-[10px] font-mono bg-white/60 text-[#4D2A00] border border-[rgba(77,42,0,0.1)] rounded-md">{status}</span>;
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
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 glass-panel p-6 rounded-3xl border border-[rgba(77,42,0,0.1)] shadow-glass">
        <div>
          <div className="flex items-center space-x-2 text-[#CC6F00] text-[11px] font-bold uppercase mb-1">
            <Files className="w-3.5 h-3.5" />
            <span>Digital Certificates & Endorsements</span>
          </div>
          <h1 className="text-2xl font-bold text-[#4D2A00]">Official Document Requests</h1>
          <p className="text-xs text-[#4D2A00]/70 mt-1">
            Request official Bonafide certificates, Fee Structures, and NOCs with cryptographic validation and PDF download
          </p>
        </div>

        {user?.role === "STUDENT" && (
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary inline-flex items-center space-x-2 text-xs font-bold px-5 py-2.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Request Certificate</span>
          </button>
        )}
      </div>

      {/* Requests Table */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-[rgba(77,42,0,0.1)] shadow-glass">
        {loading ? (
          <div className="p-14 text-center text-xs text-[#4D2A00]/60">
            Loading document requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="p-14 text-center text-xs text-[#4D2A00]/60">
            No official document requests on file.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FDB773]/30 border-b border-[rgba(77,42,0,0.1)] text-[#4D2A00] font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 font-bold">Request #</th>
                  <th className="py-3.5 px-4 font-bold">Student</th>
                  <th className="py-3.5 px-4 font-bold">Document Type</th>
                  <th className="py-3.5 px-4 font-bold">Stated Purpose</th>
                  <th className="py-3.5 px-4 font-bold">Submitted</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(77,42,0,0.06)]">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-white/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#CC6F00]">
                      #{r.requestNumber}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#4D2A00]">
                      {r.student?.fullName}
                      <span className="text-[11px] font-mono text-[#4D2A00]/60 block">
                        {r.student?.rollNumber}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#4D2A00]">
                      {getDocTypeName(r.docType)}
                    </td>
                    <td className="py-3.5 px-4 text-[#4D2A00]/80 truncate max-w-xs">{r.purpose}</td>
                    <td className="py-3.5 px-4 text-[#4D2A00]/70 font-mono">
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
                            className="btn-primary inline-flex items-center space-x-1.5 px-3 py-1.5 font-bold shadow-sm text-xs"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download PDF</span>
                          </a>
                        )}

                        {isAdminOrStaff && r.status === "SUBMITTED" && (
                          <div className="flex items-center space-x-1.5">
                            <button
                              onClick={() => handleUpdateStatus(r.id, "APPROVED")}
                              className="btn-primary px-3 py-1 text-xs font-bold"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(r.id, "REJECTED")}
                              className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-900 border border-rose-500/30 font-bold rounded-xl text-xs"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-fadeIn">
          <div className="glass-modal max-w-md w-full p-6 space-y-4 text-xs rounded-3xl border border-[rgba(77,42,0,0.15)] shadow-glass">
            <div className="flex items-center justify-between border-b border-[rgba(77,42,0,0.1)] pb-3">
              <h2 className="text-base font-bold text-[#4D2A00]">Request Official Certificate</h2>
              <button onClick={() => setShowModal(false)} className="text-[#4D2A00]/60 hover:text-[#4D2A00]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-900 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-semibold text-[#4D2A00] mb-1">Document Type *</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/60 border border-[rgba(77,42,0,0.12)] rounded-xl text-[#4D2A00] focus:outline-none focus:border-[#CC6F00]"
                >
                  <option value="BONAFIDE_CERTIFICATE">Bonafide Student Certificate</option>
                  <option value="FEE_STRUCTURE">Official Fee Structure Estimate</option>
                  <option value="HOSTEL_RESIDENCE">Hostel Residence Proof Letter</option>
                  <option value="NOC_INTERNSHIP">No Objection Certificate (Internship / Project)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#4D2A00] mb-1">Purpose / Submission Authority *</label>
                <textarea
                  required
                  rows={3}
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. Bank education loan verification or state scholarship application..."
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

export default DocumentRequestsPage;
