import React, { useState, useEffect } from "react";
import { FileText, Download, Plus, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";
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
        return <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-[4px]">Approved</span>;
      case "SUBMITTED":
        return <span className="px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300 rounded-[4px]">Submitted</span>;
      case "PROCESSING":
        return <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-900 border border-blue-300 rounded-[4px]">Processing</span>;
      case "REJECTED":
        return <span className="px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-900 border border-red-300 rounded-[4px]">Rejected</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold bg-stone-100 text-stone-800 rounded-[4px]">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-stone-300 p-4 rounded-[6px]">
        <div>
          <h1 className="text-xl font-bold text-stone-900">Document & Certificate Requests</h1>
          <p className="text-xs text-stone-600 mt-0.5">
            Request official Bonafide certificates, fee estimates, and transcripts with downloadable PDF generation
          </p>
        </div>

        {user?.role === "STUDENT" && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center space-x-2 bg-[#0f4c3a] text-white hover:bg-[#0b392b] text-xs font-semibold px-4 py-2 rounded-[4px]"
          >
            <Plus className="w-4 h-4" />
            <span>Request New Document</span>
          </button>
        )}
      </div>

      {/* Requests Table */}
      <div className="bg-white border border-stone-300 rounded-[6px] overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-xs text-stone-500">Loading document requests...</div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-500">
            No document requests recorded on file.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-100 border-b border-stone-300 text-stone-700 font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Req #</th>
                  <th className="py-2.5 px-3">Student</th>
                  <th className="py-2.5 px-3">Document Type</th>
                  <th className="py-2.5 px-3">Purpose</th>
                  <th className="py-2.5 px-3">Date Requested</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-950">
                      #{r.requestNumber}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-stone-900">{r.student.fullName}</div>
                      <div className="text-[11px] text-stone-500 font-mono">{r.student.rollNumber}</div>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-stone-800">
                      {r.docType.replace(/_/g, " ")}
                    </td>
                    <td className="py-2.5 px-3 text-stone-600 max-w-xs truncate">
                      {r.purpose}
                      {r.remarks && (
                        <span className="block text-[11px] text-stone-500 italic">
                          Note: {r.remarks}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-stone-700">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3">{getStatusBadge(r.status)}</td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {r.status === "APPROVED" && (
                          <a
                            href={`/api/documents/${r.id}/download`}
                            download
                            className="inline-flex items-center space-x-1 px-3 py-1 bg-[#0f4c3a] text-white hover:bg-[#0b392b] font-semibold text-xs rounded-[4px]"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download PDF</span>
                          </a>
                        )}

                        {isAdminOrStaff && r.status === "SUBMITTED" && (
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleUpdateStatus(r.id, "APPROVED")}
                              className="px-2 py-1 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-[4px] text-[11px]"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(r.id, "REJECTED")}
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

      {/* Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-stone-300 rounded-[6px] max-w-md w-full p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <h2 className="text-base font-bold text-stone-900">Request Official Document</h2>
              <button onClick={() => setShowModal(false)} className="text-stone-500 hover:text-stone-800 font-bold text-sm">
                &times;
              </button>
            </div>

            {error && (
              <div className="p-2 text-xs text-red-900 bg-red-50 border border-red-200 rounded-[4px]">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-800 mb-1">Document Type *</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-stone-300 rounded-[4px] bg-white text-stone-800"
                >
                  <option value="BONAFIDE_CERTIFICATE">Bonafide Certificate (Scholarships & Bank)</option>
                  <option value="FEE_ESTIMATE">Fee Estimate Certificate (Education Loan)</option>
                  <option value="CHARACTER_CERTIFICATE">Character / Conduct Certificate</option>
                  <option value="HOSTEL_STAY_CERTIFICATE">Hostel Residence Certificate</option>
                  <option value="TRANSCRIPT">Grade Transcript Endorsement</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-800 mb-1">Purpose of Certificate *</label>
                <textarea
                  required
                  rows={3}
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. State post-matric scholarship application, bank education loan renewal, passport application..."
                  className="w-full p-2 border border-stone-300 rounded-[4px]"
                />
              </div>

              <div className="pt-2 border-t border-stone-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 border border-stone-300 rounded-[4px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-[#0f4c3a] text-white font-semibold rounded-[4px] hover:bg-[#0b392b] disabled:opacity-50"
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
