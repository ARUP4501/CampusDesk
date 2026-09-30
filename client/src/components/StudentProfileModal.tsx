import React, { useState, useEffect } from "react";
import { apiRequest } from "../api/client.js";
import { X, ShieldCheck, User, QrCode, FileText, History } from "lucide-react";

interface StudentProfileModalProps {
  studentId: string;
  onClose: () => void;
  onUpdate?: () => void;
  currentUserRole?: string;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  studentId,
  onClose,
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
        return <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded-[3px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">Active Verified</span>;
      case "PENDING_WARDEN_VERIFICATION":
        return <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded-[3px] bg-amber-500/10 text-amber-300 border border-amber-500/30">Pending Warden Review</span>;
      case "PENDING_ADMIN_APPROVAL":
        return <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded-[3px] bg-blue-500/10 text-blue-300 border border-blue-500/30">Pending Admin Approval</span>;
      case "REJECTED_BY_WARDEN":
        return <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded-[3px] bg-red-500/10 text-red-300 border border-red-500/30">Rejected by Warden</span>;
      case "REJECTED_BY_ADMIN":
        return <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded-[3px] bg-red-500/10 text-red-300 border border-red-500/30">Rejected by Admin</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded-[3px] bg-[#181D22] text-[#A7ADB5] border border-[#252B31]">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <div className="bg-[#14181C] rounded-[6px] border border-[#252B31] p-8 max-w-md w-full text-center shadow-elevated">
          <div className="w-8 h-8 border-2 border-[#D6A84F] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-mono text-[#A7ADB5]">Loading student digital dossier...</p>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <div className="bg-[#14181C] rounded-[6px] border border-[#252B31] p-6 max-w-md w-full shadow-elevated">
          <h3 className="text-sm font-bold text-[#EF4444] mb-2">Error Loading Profile</h3>
          <p className="text-xs text-[#A7ADB5] mb-4">{error || "Student record not found."}</p>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-[#181D22] hover:bg-[#252B31] text-[#F3F4F6] text-xs font-medium rounded-[4px] border border-[#252B31]"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#14181C] rounded-[6px] border border-[#252B31] shadow-elevated max-w-3xl w-full my-auto overflow-hidden">
        {/* Header */}
        <div className="bg-[#101316] border-b border-[#252B31] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-[4px] bg-[#181D22] border border-[#D6A84F]/40 flex items-center justify-center text-sm font-mono font-bold text-[#D6A84F]">
              {student.fullName
                .split(" ")
                .map((n: string) => n[0])
                .slice(0, 2)
                .join("")}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-[#F3F4F6]">{student.fullName}</h2>
                <span className="text-xs font-mono text-[#D6A84F]">({student.rollNumber || "Pending Roll"})</span>
              </div>
              <p className="text-xs text-[#A7ADB5]">
                {student.course} • {student.department} | Year {student.year || 1}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#A7ADB5] hover:text-[#F3F4F6] p-1.5 rounded-[4px] hover:bg-[#181D22] border border-transparent hover:border-[#252B31] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Bar */}
        <div className="bg-[#090B0D] border-b border-[#252B31] px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-[#6F7781] font-mono text-[11px] uppercase">Status:</span>
            {getStatusBadge(student.verificationStatus)}
          </div>
          <div className="flex items-center space-x-4 text-[#A7ADB5] text-xs font-mono">
            <span>Hostel: <strong className="text-[#F3F4F6]">{student.hostelBlock || student.requestedHostel || "Unassigned"}</strong></span>
            <span>Room: <strong className="text-[#F3F4F6]">{student.roomNumber || "None"}</strong></span>
            <span>Bed: <strong className="text-[#F3F4F6]">{student.bedNumber || "None"}</strong></span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-[#252B31] px-6 bg-[#101316] flex space-x-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("profile")}
            className={`py-2.5 px-3 text-xs font-medium border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === "profile" ? "border-[#D6A84F] text-[#D6A84F]" : "border-transparent text-[#A7ADB5] hover:text-[#F3F4F6]"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Complete Profile</span>
          </button>
          <button
            onClick={() => setActiveTab("idcard")}
            className={`py-2.5 px-3 text-xs font-medium border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === "idcard" ? "border-[#D6A84F] text-[#D6A84F]" : "border-transparent text-[#A7ADB5] hover:text-[#F3F4F6]"
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Digital ID</span>
          </button>
          <button
            onClick={() => setActiveTab("documents")}
            className={`py-2.5 px-3 text-xs font-medium border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === "documents" ? "border-[#D6A84F] text-[#D6A84F]" : "border-transparent text-[#A7ADB5] hover:text-[#F3F4F6]"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Documents ({student.documents?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`py-2.5 px-3 text-xs font-medium border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === "history" ? "border-[#D6A84F] text-[#D6A84F]" : "border-transparent text-[#A7ADB5] hover:text-[#F3F4F6]"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Trail</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[65vh] overflow-y-auto">
          {activeTab === "profile" && (
            <div className="space-y-5">
              {student.rejectionReason && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-[4px] text-xs text-red-300">
                  <span className="font-bold text-red-200">Rejection Reason: </span>
                  {student.rejectionReason}
                </div>
              )}

              {/* 1. Basic & Academic Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-[#252B31] rounded-[4px] p-4 bg-[#101316]">
                  <h3 className="text-[11px] font-mono font-bold text-[#D6A84F] border-b border-[#252B31] pb-1.5 mb-3 uppercase tracking-wider">
                    Personal Information
                  </h3>
                  <dl className="grid grid-cols-2 gap-y-2 text-xs">
                    <dt className="text-[#6F7781] font-medium">Full Name</dt>
                    <dd className="font-medium text-[#F3F4F6]">{student.fullName}</dd>
                    <dt className="text-[#6F7781] font-medium">Date of Birth</dt>
                    <dd className="text-[#A7ADB5]">{student.dob ? new Date(student.dob).toLocaleDateString() : "Not Provided"}</dd>
                    <dt className="text-[#6F7781] font-medium">Gender</dt>
                    <dd className="text-[#A7ADB5]">{student.gender || "Not Specified"}</dd>
                    <dt className="text-[#6F7781] font-medium">Blood Group</dt>
                    <dd className="font-mono font-semibold text-red-400">{student.bloodGroup || "Not Specified"}</dd>
                    <dt className="text-[#6F7781] font-medium">Student Email</dt>
                    <dd className="text-[#A7ADB5] break-all">{student.email}</dd>
                    <dt className="text-[#6F7781] font-medium">Student Phone</dt>
                    <dd className="font-mono text-[#F3F4F6]">{student.phone}</dd>
                  </dl>
                </div>

                <div className="border border-[#252B31] rounded-[4px] p-4 bg-[#101316]">
                  <h3 className="text-[11px] font-mono font-bold text-[#D6A84F] border-b border-[#252B31] pb-1.5 mb-3 uppercase tracking-wider">
                    Academic Classification
                  </h3>
                  <dl className="grid grid-cols-2 gap-y-2 text-xs">
                    <dt className="text-[#6F7781] font-medium">Roll / Reg. No.</dt>
                    <dd className="font-mono font-semibold text-[#D6A84F]">{student.rollNumber || "Pending"}</dd>
                    <dt className="text-[#6F7781] font-medium">Course</dt>
                    <dd className="text-[#F3F4F6]">{student.course}</dd>
                    <dt className="text-[#6F7781] font-medium">Department</dt>
                    <dd className="text-[#F3F4F6]">{student.department}</dd>
                    <dt className="text-[#6F7781] font-medium">Academic Year</dt>
                    <dd className="text-[#A7ADB5]">Year {student.year || 1} (Sem {student.semester || 1})</dd>
                    <dt className="text-[#6F7781] font-medium">Batch</dt>
                    <dd className="text-[#A7ADB5]">{student.batch || "2024-2028"}</dd>
                    <dt className="text-[#6F7781] font-medium">Enrollment Date</dt>
                    <dd className="text-[#A7ADB5] font-mono">{new Date(student.createdAt).toLocaleDateString()}</dd>
                  </dl>
                </div>
              </div>

              {/* 2. Parent & Local Guardian Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-[#252B31] rounded-[4px] p-4 bg-[#101316]">
                  <h3 className="text-[11px] font-mono font-bold text-[#D6A84F] border-b border-[#252B31] pb-1.5 mb-3 uppercase tracking-wider">
                    Parent Details
                  </h3>
                  <dl className="grid grid-cols-2 gap-y-2 text-xs">
                    <dt className="text-[#6F7781] font-medium">Father's Name</dt>
                    <dd className="font-medium text-[#F3F4F6]">{student.fatherName || "Not Provided"}</dd>
                    <dt className="text-[#6F7781] font-medium">Father's Phone</dt>
                    <dd className="font-mono text-emerald-400">{student.fatherPhone || "Not Provided"}</dd>
                    <dt className="text-[#6F7781] font-medium">Mother's Name</dt>
                    <dd className="text-[#A7ADB5]">{student.motherName || "Not Provided"}</dd>
                    <dt className="text-[#6F7781] font-medium">Mother's Phone</dt>
                    <dd className="font-mono text-[#A7ADB5]">{student.motherPhone || "Not Provided"}</dd>
                  </dl>
                </div>

                <div className="border border-[#252B31] rounded-[4px] p-4 bg-[#101316]">
                  <h3 className="text-[11px] font-mono font-bold text-[#D6A84F] border-b border-[#252B31] pb-1.5 mb-3 uppercase tracking-wider">
                    Local Guardian Details
                  </h3>
                  <dl className="grid grid-cols-2 gap-y-2 text-xs">
                    <dt className="text-[#6F7781] font-medium">Guardian Name</dt>
                    <dd className="font-medium text-[#F3F4F6]">{student.guardianName || "Not Provided"}</dd>
                    <dt className="text-[#6F7781] font-medium">Relationship</dt>
                    <dd className="text-[#A7ADB5]">{student.guardianRelation || "Not Specified"}</dd>
                    <dt className="text-[#6F7781] font-medium">Guardian Phone</dt>
                    <dd className="font-mono text-emerald-400">{student.guardianPhone || "Not Provided"}</dd>
                    <dt className="text-[#6F7781] font-medium">Address</dt>
                    <dd className="text-[#A7ADB5]">{student.guardianAddress || "Not Provided"}</dd>
                  </dl>
                </div>
              </div>

              {/* 3. Hostel & Room Allocation */}
              <div className="border border-[#252B31] rounded-[4px] p-4 bg-[#101316]">
                <h3 className="text-[11px] font-mono font-bold text-[#D6A84F] border-b border-[#252B31] pb-1.5 mb-3 uppercase tracking-wider">
                  Hostel & Room Assignment
                </h3>
                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <dt className="text-[#6F7781] font-medium">Hostel Block</dt>
                    <dd className="font-semibold text-[#F3F4F6] mt-0.5">{student.hostelBlock || "Not Assigned"}</dd>
                  </div>
                  <div>
                    <dt className="text-[#6F7781] font-medium">Room Number</dt>
                    <dd className="font-semibold text-[#F3F4F6] mt-0.5">{student.roomNumber || "Not Assigned"}</dd>
                  </div>
                  <div>
                    <dt className="text-[#6F7781] font-medium">Bed Identifier</dt>
                    <dd className="font-semibold text-[#F3F4F6] mt-0.5">{student.bedNumber || "Not Assigned"}</dd>
                  </div>
                  <div>
                    <dt className="text-[#6F7781] font-medium">Preference</dt>
                    <dd className="text-[#A7ADB5] mt-0.5">{student.requestedHostel} ({student.roomPreference || "Standard"})</dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {activeTab === "idcard" && (
            <div className="max-w-md mx-auto">
              <div className="bg-[#101316] text-[#F3F4F6] rounded-[6px] p-5 shadow-elevated border border-[#D6A84F]/40 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#D6A84F]/5 rounded-full blur-2xl pointer-events-none"></div>
                <div className="flex items-center justify-between border-b border-[#252B31] pb-3 mb-4">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded-[3px] bg-[#D6A84F] text-[#090B0D] font-black flex items-center justify-center text-xs">
                      CD
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#F3F4F6]">CampusDesk Digital ID</h4>
                      <p className="text-[10px] text-[#6F7781] font-mono">Institutional Identity Token</p>
                    </div>
                  </div>
                  <div className="px-2 py-0.5 bg-[#D6A84F]/10 text-[#F0C86A] text-[10px] font-mono font-bold rounded border border-[#D6A84F]/30">
                    {student.verificationStatus === "ACTIVE" ? "VERIFIED ACTIVE" : "PENDING"}
                  </div>
                </div>

                <div className="flex space-x-4">
                  <div className="w-20 h-24 bg-[#181D22] border border-[#252B31] rounded-[4px] flex flex-col items-center justify-center text-center p-1">
                    <div className="w-12 h-12 rounded-full bg-[#D6A84F]/20 text-[#D6A84F] flex items-center justify-center font-bold text-sm mb-1">
                      {student.fullName
                        .split(" ")
                        .map((n: string) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <span className="text-[8px] text-[#6F7781] uppercase font-mono">Photo ID</span>
                  </div>

                  <div className="flex-1 text-xs space-y-1">
                    <h3 className="font-bold text-sm text-[#F3F4F6]">{student.fullName}</h3>
                    <p className="text-[#D6A84F] font-mono text-[11px]">Roll: {student.rollNumber || "PENDING"}</p>
                    <p className="text-[#A7ADB5]">{student.course} • {student.department}</p>
                    <p className="text-[#6F7781]">Year {student.year || 1} | Batch {student.batch || "2024"}</p>
                    <p className="text-[#F3F4F6] font-medium text-[11px] pt-1">
                      Hostel: {student.hostelBlock || student.requestedHostel || "N/A"} • Rm {student.roomNumber || "N/A"} ({student.bedNumber || "N/A"})
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#252B31] flex items-center justify-between">
                  <div className="text-[10px] text-[#A7ADB5] space-y-0.5">
                    <span className="font-bold text-[#F3F4F6] block">Emergency Contacts:</span>
                    <p>Parent: {student.fatherPhone || student.phone}</p>
                    {student.guardianPhone && <p>Guardian: {student.guardianPhone}</p>}
                  </div>
                  <div className="w-12 h-12 bg-white rounded-[3px] p-1 flex items-center justify-center">
                    <svg className="w-full h-full text-[#090B0D]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm14 0h4v4h-4v-4zm-4 0h2v2h-2v-2zm2 2h2v2h-2v-2zm-2 2h2v2h-2v-2zm4 0h2v2h-2v-2zm2-2h2v2h-2v-2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "documents" && (
            <div className="space-y-2.5">
              {student.documents && student.documents.length > 0 ? (
                student.documents.map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border border-[#252B31] rounded-[4px] bg-[#101316] text-xs">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-[#181D22] border border-[#252B31] rounded flex items-center justify-center text-[#D6A84F] font-mono text-xs font-bold">
                        PDF
                      </div>
                      <div>
                        <p className="font-medium text-[#F3F4F6]">{doc.docName}</p>
                        <p className="text-[11px] text-[#6F7781] font-mono">{doc.docType.replace(/_/g, " ")}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-mono font-semibold rounded ${
                      doc.status === "VERIFIED" ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30" : "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                    }`}>
                      {doc.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-[#6F7781] text-xs">
                  No verified document attachments recorded for this student account.
                </div>
              )}
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-2.5">
              {student.activityLogs && student.activityLogs.length > 0 ? (
                student.activityLogs.map((log: any) => (
                  <div key={log.id} className="p-3 border border-[#252B31] rounded-[4px] bg-[#101316] text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-[#F3F4F6]">{log.action.replace(/_/g, " ")}</span>
                      <span className="text-[#6F7781] text-[10px] font-mono">{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-[#A7ADB5] leading-relaxed">{log.details}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-[#6F7781] text-xs">
                  No security audit history entries recorded for this student.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#101316] border-t border-[#252B31] px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#181D22] hover:bg-[#252B31] text-[#F3F4F6] text-xs font-medium rounded-[4px] border border-[#252B31] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
