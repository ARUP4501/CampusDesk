import React, { useState, useEffect } from "react";
import { apiRequest } from "../api/client.js";

interface StudentProfileModalProps {
  studentId: string;
  onClose: () => void;
  onUpdate?: () => void;
  currentUserRole?: string;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  studentId,
  onClose,
  onUpdate,
  currentUserRole = "ADMIN"
}) => {
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "idcard" | "documents" | "history">("profile");

  useEffect(() => {
    fetchStudentProfile();
  }, [studentId]);

  const fetchStudentProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<{ student: any }>(`/api/admin/students/${studentId}`);
      setStudent(data.student);
    } catch (err: any) {
      setError(err.message || "Failed to load student profile.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-[4px] bg-emerald-100 text-emerald-800 border border-emerald-300">Active Student</span>;
      case "PENDING_WARDEN_VERIFICATION":
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-[4px] bg-amber-100 text-amber-800 border border-amber-300">Pending Warden Review</span>;
      case "PENDING_ADMIN_APPROVAL":
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-[4px] bg-blue-100 text-blue-800 border border-blue-300">Pending Admin Approval</span>;
      case "REJECTED_BY_WARDEN":
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-[4px] bg-red-100 text-red-800 border border-red-300">Rejected by Warden</span>;
      case "REJECTED_BY_ADMIN":
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-[4px] bg-red-100 text-red-800 border border-red-300">Rejected by Admin</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-[4px] bg-stone-100 text-stone-700 border border-stone-300">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-[6px] border border-stone-300 p-8 max-w-md w-full text-center">
          <div className="w-8 h-8 border-2 border-[#0f4c3a] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-medium text-stone-600">Loading student record...</p>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-[6px] border border-stone-300 p-6 max-w-md w-full">
          <h3 className="text-sm font-bold text-red-700 mb-2">Error Loading Profile</h3>
          <p className="text-xs text-stone-600 mb-4">{error || "Student record not found."}</p>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium rounded-[4px]"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-[6px] border border-stone-300 shadow-xl max-w-3xl w-full my-auto overflow-hidden">
        {/* Header */}
        <div className="bg-[#0f4c3a] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-sm font-bold">
              {student.fullName
                .split(" ")
                .map((n: string) => n[0])
                .slice(0, 2)
                .join("")}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold">{student.fullName}</h2>
                <span className="text-xs font-normal text-white/80">({student.rollNumber || "No Roll"})</span>
              </div>
              <p className="text-xs text-white/70">
                {student.course} - {student.department} | Year {student.year || 1}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-1 rounded-[4px] hover:bg-white/10"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Status Bar */}
        <div className="bg-stone-50 border-b border-stone-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-stone-500 font-medium">Status:</span>
            {getStatusBadge(student.verificationStatus)}
          </div>
          <div className="flex items-center space-x-4 text-stone-600">
            <span>Hostel: <strong className="text-stone-800">{student.hostelBlock || student.requestedHostel || "Unassigned"}</strong></span>
            <span>Room: <strong className="text-stone-800">{student.roomNumber || "None"}</strong></span>
            <span>Bed: <strong className="text-stone-800">{student.bedNumber || "None"}</strong></span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-stone-200 px-6 bg-white flex space-x-4">
          <button
            onClick={() => setActiveTab("profile")}
            className={`py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === "profile" ? "border-[#0f4c3a] text-[#0f4c3a]" : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            Complete Profile
          </button>
          <button
            onClick={() => setActiveTab("idcard")}
            className={`py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === "idcard" ? "border-[#0f4c3a] text-[#0f4c3a]" : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            Digital Student ID
          </button>
          <button
            onClick={() => setActiveTab("documents")}
            className={`py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === "documents" ? "border-[#0f4c3a] text-[#0f4c3a]" : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            Documents ({student.documents?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === "history" ? "border-[#0f4c3a] text-[#0f4c3a]" : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            Audit History
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[65vh] overflow-y-auto">
          {activeTab === "profile" && (
            <div className="space-y-6">
              {student.rejectionReason && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-[4px] text-xs text-red-900">
                  <span className="font-bold">Rejection Reason: </span>
                  {student.rejectionReason}
                </div>
              )}

              {/* 1. Basic & Academic Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-stone-200 rounded-[4px] p-4 bg-stone-50/50">
                  <h3 className="text-xs font-bold text-stone-900 border-b border-stone-200 pb-1.5 mb-3 uppercase tracking-wider">
                    Personal Details
                  </h3>
                  <dl className="grid grid-cols-2 gap-y-2 text-xs">
                    <dt className="text-stone-500 font-medium">Full Name</dt>
                    <dd className="font-semibold text-stone-800">{student.fullName}</dd>
                    <dt className="text-stone-500 font-medium">Date of Birth</dt>
                    <dd className="text-stone-800">{student.dob ? new Date(student.dob).toLocaleDateString() : "Not Provided"}</dd>
                    <dt className="text-stone-500 font-medium">Gender</dt>
                    <dd className="text-stone-800">{student.gender || "Not Specified"}</dd>
                    <dt className="text-stone-500 font-medium">Blood Group</dt>
                    <dd className="font-semibold text-red-700">{student.bloodGroup || "Not Specified"}</dd>
                    <dt className="text-stone-500 font-medium">Student Email</dt>
                    <dd className="text-stone-800 break-all">{student.email}</dd>
                    <dt className="text-stone-500 font-medium">Student Phone</dt>
                    <dd className="font-semibold text-stone-800">{student.phone}</dd>
                  </dl>
                </div>

                <div className="border border-stone-200 rounded-[4px] p-4 bg-stone-50/50">
                  <h3 className="text-xs font-bold text-stone-900 border-b border-stone-200 pb-1.5 mb-3 uppercase tracking-wider">
                    Academic Details
                  </h3>
                  <dl className="grid grid-cols-2 gap-y-2 text-xs">
                    <dt className="text-stone-500 font-medium">Roll / Reg. No.</dt>
                    <dd className="font-semibold text-stone-800">{student.rollNumber || "Pending"}</dd>
                    <dt className="text-stone-500 font-medium">Course</dt>
                    <dd className="text-stone-800">{student.course}</dd>
                    <dt className="text-stone-500 font-medium">Department</dt>
                    <dd className="text-stone-800">{student.department}</dd>
                    <dt className="text-stone-500 font-medium">Academic Year</dt>
                    <dd className="text-stone-800">Year {student.year || 1} (Sem {student.semester || 1})</dd>
                    <dt className="text-stone-500 font-medium">Batch</dt>
                    <dd className="text-stone-800">{student.batch || "2024-2028"}</dd>
                    <dt className="text-stone-500 font-medium">Registration Date</dt>
                    <dd className="text-stone-800">{new Date(student.createdAt).toLocaleDateString()}</dd>
                  </dl>
                </div>
              </div>

              {/* 2. Parent & Local Guardian Details (Sensitive / Privacy Protected) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-stone-200 rounded-[4px] p-4 bg-stone-50/50">
                  <h3 className="text-xs font-bold text-stone-900 border-b border-stone-200 pb-1.5 mb-3 uppercase tracking-wider">
                    Parent Details
                  </h3>
                  <dl className="grid grid-cols-2 gap-y-2 text-xs">
                    <dt className="text-stone-500 font-medium">Father's Name</dt>
                    <dd className="font-semibold text-stone-800">{student.fatherName || "Not Provided"}</dd>
                    <dt className="text-stone-500 font-medium">Father's Phone</dt>
                    <dd className="font-semibold text-emerald-800">{student.fatherPhone || "Not Provided"}</dd>
                    <dt className="text-stone-500 font-medium">Mother's Name</dt>
                    <dd className="text-stone-800">{student.motherName || "Not Provided"}</dd>
                    <dt className="text-stone-500 font-medium">Mother's Phone</dt>
                    <dd className="text-stone-800">{student.motherPhone || "Not Provided"}</dd>
                  </dl>
                </div>

                <div className="border border-stone-200 rounded-[4px] p-4 bg-stone-50/50">
                  <h3 className="text-xs font-bold text-stone-900 border-b border-stone-200 pb-1.5 mb-3 uppercase tracking-wider">
                    Local Guardian Details
                  </h3>
                  <dl className="grid grid-cols-2 gap-y-2 text-xs">
                    <dt className="text-stone-500 font-medium">Guardian Name</dt>
                    <dd className="font-semibold text-stone-800">{student.guardianName || "Not Provided"}</dd>
                    <dt className="text-stone-500 font-medium">Relationship</dt>
                    <dd className="text-stone-800">{student.guardianRelation || "Not Specified"}</dd>
                    <dt className="text-stone-500 font-medium">Guardian Phone</dt>
                    <dd className="font-semibold text-emerald-800">{student.guardianPhone || "Not Provided"}</dd>
                    <dt className="text-stone-500 font-medium">Guardian Address</dt>
                    <dd className="text-stone-800">{student.guardianAddress || "Not Provided"}</dd>
                  </dl>
                </div>
              </div>

              {/* 3. Addresses & Hostel Allocation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-stone-200 rounded-[4px] p-4 bg-stone-50/50">
                  <h3 className="text-xs font-bold text-stone-900 border-b border-stone-200 pb-1.5 mb-3 uppercase tracking-wider">
                    Residential Addresses
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-stone-500 font-medium block">Permanent Address:</span>
                      <p className="text-stone-800 font-medium">{student.permanentAddress || "Not Provided"}</p>
                    </div>
                    {student.currentAddress && (
                      <div>
                        <span className="text-stone-500 font-medium block">Current Campus Address:</span>
                        <p className="text-stone-800">{student.currentAddress}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border border-stone-200 rounded-[4px] p-4 bg-stone-50/50">
                  <h3 className="text-xs font-bold text-stone-900 border-b border-stone-200 pb-1.5 mb-3 uppercase tracking-wider">
                    Hostel & Room Allocation
                  </h3>
                  <dl className="grid grid-cols-2 gap-y-2 text-xs">
                    <dt className="text-stone-500 font-medium">Hostel Block</dt>
                    <dd className="font-semibold text-stone-800">{student.hostelBlock || "Not Assigned"}</dd>
                    <dt className="text-stone-500 font-medium">Room Number</dt>
                    <dd className="font-semibold text-stone-800">{student.roomNumber || "Not Assigned"}</dd>
                    <dt className="text-stone-500 font-medium">Bed Identifier</dt>
                    <dd className="font-semibold text-stone-800">{student.bedNumber || "Not Assigned"}</dd>
                    <dt className="text-stone-500 font-medium">Requested Preference</dt>
                    <dd className="text-stone-800">{student.requestedHostel} ({student.roomPreference || "Standard"})</dd>
                  </dl>
                </div>
              </div>
            </div>
          )}

          {activeTab === "idcard" && (
            <div className="max-w-md mx-auto">
              <div className="bg-gradient-to-br from-[#0f4c3a] to-[#1a6650] text-white rounded-[8px] p-5 shadow-lg border border-[#0f4c3a]/50">
                <div className="flex items-center justify-between border-b border-white/20 pb-3 mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-[4px] bg-white text-[#0f4c3a] font-black flex items-center justify-center text-xs">
                      CD
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider">CampusDesk ID Card</h4>
                      <p className="text-[10px] text-white/70">Verified Student Identity</p>
                    </div>
                  </div>
                  <div className="px-2 py-0.5 bg-emerald-400/20 text-emerald-300 text-[10px] font-bold rounded border border-emerald-400/30">
                    {student.verificationStatus === "ACTIVE" ? "ACTIVE" : "PENDING"}
                  </div>
                </div>

                <div className="flex space-x-4">
                  <div className="w-20 h-24 bg-white/10 border border-white/20 rounded-[4px] flex flex-col items-center justify-center text-center p-1">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm mb-1">
                      {student.fullName
                        .split(" ")
                        .map((n: string) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <span className="text-[9px] text-white/70 uppercase">Photo ID</span>
                  </div>

                  <div className="flex-1 text-xs space-y-1">
                    <h3 className="font-bold text-sm text-white">{student.fullName}</h3>
                    <p className="text-white/80 font-mono text-[11px]">Roll: {student.rollNumber || "PENDING"}</p>
                    <p className="text-white/80">{student.course} - {student.department}</p>
                    <p className="text-white/80">Year {student.year || 1} | Batch {student.batch || "2024"}</p>
                    <p className="text-white/90 font-medium">
                      Hostel: {student.hostelBlock || student.requestedHostel || "N/A"} | Rm {student.roomNumber || "N/A"} ({student.bedNumber || "N/A"})
                    </p>
                  </div>
                </div>

                {/* Emergency Contact & QR Footer */}
                <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between">
                  <div className="text-[10px] text-white/80 space-y-0.5">
                    <span className="font-bold text-white block">Emergency Contacts:</span>
                    <p>Parent: {student.fatherPhone || student.phone}</p>
                    {student.guardianPhone && <p>Guardian: {student.guardianPhone}</p>}
                  </div>
                  <div className="w-12 h-12 bg-white rounded p-1 flex items-center justify-center">
                    {/* Simulated Clean QR matrix for verification ID */}
                    <svg className="w-full h-full text-[#0f4c3a]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm14 0h4v4h-4v-4zm-4 0h2v2h-2v-2zm2 2h2v2h-2v-2zm-2 2h2v2h-2v-2zm4 0h2v2h-2v-2zm2-2h2v2h-2v-2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "documents" && (
            <div className="space-y-3">
              {student.documents && student.documents.length > 0 ? (
                student.documents.map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border border-stone-200 rounded-[4px] bg-stone-50 text-xs">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-stone-200 rounded flex items-center justify-center text-stone-600 font-bold">
                        PDF
                      </div>
                      <div>
                        <p className="font-semibold text-stone-800">{doc.docName}</p>
                        <p className="text-stone-500">{doc.docType.replace(/_/g, " ")}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                      doc.status === "VERIFIED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    }`}>
                      {doc.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-stone-500 text-xs">
                  No verified document attachments uploaded yet for this student.
                </div>
              )}
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-3">
              {student.activityLogs && student.activityLogs.length > 0 ? (
                student.activityLogs.map((log: any) => (
                  <div key={log.id} className="p-3 border border-stone-200 rounded-[4px] bg-stone-50 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-stone-800">{log.action.replace(/_/g, " ")}</span>
                      <span className="text-stone-500 text-[10px]">{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-stone-600">{log.details}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-stone-500 text-xs">
                  No audit logs recorded for this student account.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-stone-50 border-t border-stone-200 px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-medium rounded-[4px]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
