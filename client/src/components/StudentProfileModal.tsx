import React, { useState, useEffect } from "react";
import { apiRequest } from "../api/client.js";
import { X, User, QrCode, FileText, History } from "lucide-react";

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
        return <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-full bg-emerald-500/15 text-emerald-800 border border-emerald-500/30">Active Verified</span>;
      case "PENDING_WARDEN_VERIFICATION":
        return <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-full bg-amber-500/15 text-amber-800 border border-amber-500/30">Pending Warden Review</span>;
      case "PENDING_ADMIN_APPROVAL":
        return <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-full bg-campus-btnPrimary/25 text-campus-accent border border-campus-border">Pending Admin Approval</span>;
      case "REJECTED_BY_WARDEN":
      case "REJECTED_BY_ADMIN":
        return <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-full bg-rose-500/15 text-rose-800 border border-rose-500/30">Rejected</span>;
      default:
        return <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-full bg-white/50 text-campus-muted border border-campus-border">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
        <div className="glass-modal rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-8 h-8 border-2 border-campus-accent border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-mono text-campus-muted">Loading student digital dossier...</p>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
        <div className="glass-modal rounded-3xl p-6 max-w-md w-full shadow-2xl">
          <h3 className="text-sm font-bold text-rose-600 mb-2">Error Loading Profile</h3>
          <p className="text-xs text-campus-muted mb-4">{error || "Student record not found."}</p>
          <button
            onClick={onClose}
            className="btn-secondary px-4 py-2 text-xs font-semibold rounded-xl"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      <div className="glass-modal rounded-3xl shadow-2xl max-w-3xl w-full my-auto overflow-hidden border border-campus-border">
        {/* Header */}
        <div className="border-b border-campus-border px-6 py-4.5 flex items-center justify-between bg-white/40">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-campus-btnPrimary text-campus-text border border-campus-accent/20 flex items-center justify-center text-sm font-mono font-bold shadow-sm shrink-0">
              {student.fullName
                .split(" ")
                .map((n: string) => n[0])
                .slice(0, 2)
                .join("")}
            </div>
            <div>
              <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                <h2 className="text-base sm:text-lg font-bold text-campus-text">{student.fullName}</h2>
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-white/80 text-campus-accent border border-campus-border">
                  {student.rollNumber || "Pending Roll"}
                </span>
              </div>
              <p className="text-xs text-campus-secondary mt-0.5">
                {student.course} • {student.department} | Year {student.year || 1}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-campus-muted hover:text-campus-text p-2 rounded-xl hover:bg-white/60 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Bar */}
        <div className="bg-campus-btnPrimary/10 border-b border-campus-border px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-campus-muted font-mono text-[11px] uppercase tracking-wider font-semibold">Status:</span>
            {getStatusBadge(student.verificationStatus)}
          </div>
          <div className="flex items-center space-x-3 text-campus-secondary text-xs font-mono">
            <span>Hostel: <strong className="text-campus-text">{student.hostelBlock || student.requestedHostel || "Unassigned"}</strong></span>
            <span>•</span>
            <span>Room: <strong className="text-campus-text">{student.roomNumber || "None"}</strong></span>
            <span>•</span>
            <span>Bed: <strong className="text-campus-text">{student.bedNumber || "None"}</strong></span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-campus-border px-6 bg-white/30 flex space-x-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("profile")}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === "profile" ? "border-campus-accent text-campus-accent bg-white/40" : "border-transparent text-campus-muted hover:text-campus-text"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Complete Profile</span>
          </button>
          <button
            onClick={() => setActiveTab("idcard")}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === "idcard" ? "border-campus-accent text-campus-accent bg-white/40" : "border-transparent text-campus-muted hover:text-campus-text"
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Digital ID</span>
          </button>
          <button
            onClick={() => setActiveTab("documents")}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === "documents" ? "border-campus-accent text-campus-accent bg-white/40" : "border-transparent text-campus-muted hover:text-campus-text"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Documents ({student.documents?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === "history" ? "border-campus-accent text-campus-accent bg-white/40" : "border-transparent text-campus-muted hover:text-campus-text"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Trail</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[68vh] overflow-y-auto space-y-5">
          {activeTab === "profile" && (
            <div className="space-y-5">
              {student.rejectionReason && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-800 font-medium">
                  <span className="font-bold">Rejection Reason: </span>
                  {student.rejectionReason}
                </div>
              )}

              {/* 1. Basic & Academic Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="glass-card rounded-2xl p-5 border border-campus-border/70 space-y-3 shadow-xs">
                  <h3 className="text-xs font-mono font-bold text-campus-accent border-b border-campus-border/60 pb-2 uppercase tracking-wider">
                    Personal Information
                  </h3>
                  <div className="space-y-0.5 text-xs">
                    <div className="flex items-center justify-between py-2 border-b border-campus-border/30">
                      <span className="text-campus-muted text-[11px] font-medium">Full Name</span>
                      <span className="font-semibold text-campus-text">{student.fullName}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-campus-border/30">
                      <span className="text-campus-muted text-[11px] font-medium">Date of Birth</span>
                      <span className="text-campus-secondary">{student.dob ? new Date(student.dob).toLocaleDateString() : "Not Provided"}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-campus-border/30">
                      <span className="text-campus-muted text-[11px] font-medium">Gender</span>
                      <span className="text-campus-secondary">{student.gender || "Not Specified"}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-campus-border/30">
                      <span className="text-campus-muted text-[11px] font-medium">Blood Group</span>
                      <span className="font-mono font-bold text-rose-700">{student.bloodGroup || "Not Specified"}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-campus-border/30">
                      <span className="text-campus-muted text-[11px] font-medium">Student Email</span>
                      <span className="text-campus-secondary font-mono text-[11px]">{student.email}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-campus-muted text-[11px] font-medium">Student Phone</span>
                      <span className="font-mono text-campus-text font-semibold">{student.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="glass-card rounded-2xl p-5 border border-campus-border/70 space-y-3 shadow-xs">
                  <h3 className="text-xs font-mono font-bold text-campus-accent border-b border-campus-border/60 pb-2 uppercase tracking-wider">
                    Academic Classification
                  </h3>
                  <div className="space-y-0.5 text-xs">
                    <div className="flex items-center justify-between py-2 border-b border-campus-border/30">
                      <span className="text-campus-muted text-[11px] font-medium">Roll / Reg. No.</span>
                      <span className="font-mono font-bold text-campus-accent">{student.rollNumber || "Pending"}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-campus-border/30">
                      <span className="text-campus-muted text-[11px] font-medium">Course</span>
                      <span className="text-campus-text font-semibold">{student.course}</span>
                    </div>
                    <div className="flex items-start justify-between py-2 border-b border-campus-border/30 gap-2">
                      <span className="text-campus-muted text-[11px] font-medium shrink-0">Department</span>
                      <span className="text-campus-text font-semibold text-right">{student.department}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-campus-border/30">
                      <span className="text-campus-muted text-[11px] font-medium">Academic Year</span>
                      <span className="text-campus-secondary">Year {student.year || 1} (Sem {student.semester || 1})</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-campus-border/30">
                      <span className="text-campus-muted text-[11px] font-medium">Batch</span>
                      <span className="text-campus-secondary">{student.batch || "2024-2028"}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-campus-muted text-[11px] font-medium">Enrollment Date</span>
                      <span className="text-campus-secondary font-mono">{new Date(student.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Parent & Local Guardian Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="glass-card rounded-2xl p-5 border border-campus-border/70 space-y-3 shadow-xs">
                  <h3 className="text-xs font-mono font-bold text-campus-accent border-b border-campus-border/60 pb-2 uppercase tracking-wider">
                    Parent Details
                  </h3>
                  <div className="space-y-0.5 text-xs">
                    <div className="flex items-center justify-between py-2 border-b border-campus-border/30">
                      <span className="text-campus-muted text-[11px] font-medium">Father's Name</span>
                      <span className="font-semibold text-campus-text">{student.fatherName || "Not Provided"}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-campus-border/30">
                      <span className="text-campus-muted text-[11px] font-medium">Father's Phone</span>
                      <span className="font-mono text-campus-accent font-semibold">{student.fatherPhone || "Not Provided"}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-campus-border/30">
                      <span className="text-campus-muted text-[11px] font-medium">Mother's Name</span>
                      <span className="text-campus-secondary">{student.motherName || "Not Provided"}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-campus-muted text-[11px] font-medium">Mother's Phone</span>
                      <span className="font-mono text-campus-secondary">{student.motherPhone || "Not Provided"}</span>
                    </div>
                  </div>
                </div>

                <div className="glass-card rounded-2xl p-5 border border-campus-border/70 space-y-3 shadow-xs">
                  <h3 className="text-xs font-mono font-bold text-campus-accent border-b border-campus-border/60 pb-2 uppercase tracking-wider">
                    Local Guardian Details
                  </h3>
                  <div className="space-y-0.5 text-xs">
                    <div className="flex items-center justify-between py-2 border-b border-campus-border/30">
                      <span className="text-campus-muted text-[11px] font-medium">Guardian Name</span>
                      <span className="font-semibold text-campus-text">{student.guardianName || "Not Provided"}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-campus-border/30">
                      <span className="text-campus-muted text-[11px] font-medium">Relationship</span>
                      <span className="text-campus-secondary">{student.guardianRelation || "Not Specified"}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-campus-border/30">
                      <span className="text-campus-muted text-[11px] font-medium">Guardian Phone</span>
                      <span className="font-mono text-campus-accent font-semibold">{student.guardianPhone || "Not Provided"}</span>
                    </div>
                    <div className="flex items-start justify-between py-2 gap-2">
                      <span className="text-campus-muted text-[11px] font-medium shrink-0">Address</span>
                      <span className="text-campus-secondary text-right">{student.guardianAddress || "Not Provided"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Hostel & Room Allocation */}
              <div className="glass-card rounded-2xl p-5 border border-campus-border/70 space-y-3.5 shadow-xs">
                <div className="flex items-center justify-between border-b border-campus-border/60 pb-2">
                  <h3 className="text-xs font-mono font-bold text-campus-accent uppercase tracking-wider">
                    {student.livingType === "DAY_SCHOLAR" ? "Transit & Commute Allocation" : "Hostel & Room Assignment"}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/70 text-campus-secondary border border-campus-border">
                    {student.livingType || "HOSTELLER"}
                  </span>
                </div>

                {student.livingType === "DAY_SCHOLAR" ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 bg-white/70 rounded-xl border border-campus-border/60">
                      <span className="text-[10px] font-mono uppercase text-campus-muted block">Bus Route</span>
                      <span className="text-xs font-bold text-campus-text mt-1 block">{student.busRoute || "Route 1"}</span>
                    </div>
                    <div className="p-3.5 bg-white/70 rounded-xl border border-campus-border/60">
                      <span className="text-[10px] font-mono uppercase text-campus-muted block">Pickup Point</span>
                      <span className="text-xs font-bold text-campus-text mt-1 block truncate">{student.pickupPoint || "Main Gate"}</span>
                    </div>
                    <div className="p-3.5 bg-white/70 rounded-xl border border-campus-border/60">
                      <span className="text-[10px] font-mono uppercase text-campus-muted block">Vehicle Number</span>
                      <span className="text-xs font-bold text-campus-text font-mono mt-1 block">{student.vehicleNumber || "None (Bus)"}</span>
                    </div>
                    <div className="p-3.5 bg-white/70 rounded-xl border border-campus-border/60">
                      <span className="text-[10px] font-mono uppercase text-campus-muted block">Parking Zone</span>
                      <span className="text-xs font-semibold text-campus-secondary mt-1 block truncate">{student.parkingZone || "Zone A"}</span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 bg-white/70 rounded-xl border border-campus-border/60">
                      <span className="text-[10px] font-mono uppercase text-campus-muted block">Hostel Block</span>
                      <span className="text-xs font-bold text-campus-text mt-1 block">{student.hostelBlock || "Not Assigned"}</span>
                    </div>
                    <div className="p-3.5 bg-white/70 rounded-xl border border-campus-border/60">
                      <span className="text-[10px] font-mono uppercase text-campus-muted block">Room Number</span>
                      <span className="text-xs font-bold text-campus-text font-mono mt-1 block">{student.roomNumber || "Not Assigned"}</span>
                    </div>
                    <div className="p-3.5 bg-white/70 rounded-xl border border-campus-border/60">
                      <span className="text-[10px] font-mono uppercase text-campus-muted block">Bed Identifier</span>
                      <span className="text-xs font-bold text-campus-text font-mono mt-1 block">{student.bedNumber || "Not Assigned"}</span>
                    </div>
                    <div className="p-3.5 bg-white/70 rounded-xl border border-campus-border/60">
                      <span className="text-[10px] font-mono uppercase text-campus-muted block">Preference</span>
                      <span className="text-xs font-semibold text-campus-secondary mt-1 block truncate">{student.requestedHostel} ({student.roomPreference || "Standard"})</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "idcard" && (
            <div className="max-w-md mx-auto">
              <div className="glass-card rounded-3xl p-6 shadow-2xl border border-campus-border relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-campus-border pb-3.5 mb-4">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-campus-btnPrimary text-campus-text font-black flex items-center justify-center text-xs shadow-sm">
                      CD
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-campus-text">CampusDesk Digital ID</h4>
                      <p className="text-[10px] text-campus-muted font-mono">Institutional Identity Token</p>
                    </div>
                  </div>
                  <div className="px-2.5 py-1 bg-campus-btnPrimary/25 text-campus-accent text-[10px] font-mono font-bold rounded-full border border-campus-border">
                    {student.verificationStatus === "ACTIVE" ? "VERIFIED ACTIVE" : "PENDING"}
                  </div>
                </div>

                <div className="flex space-x-4">
                  <div className="w-20 h-24 bg-white/60 border border-campus-border rounded-2xl flex flex-col items-center justify-center text-center p-1 shadow-inner">
                    <div className="w-12 h-12 rounded-full bg-campus-btnPrimary text-campus-text flex items-center justify-center font-bold text-sm mb-1 shadow-sm">
                      {student.fullName
                        .split(" ")
                        .map((n: string) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <span className="text-[8px] text-campus-muted uppercase font-mono">Photo ID</span>
                  </div>

                  <div className="flex-1 text-xs space-y-1">
                    <h3 className="font-bold text-sm text-campus-text">{student.fullName}</h3>
                    <p className="text-campus-accent font-mono text-[11px] font-bold">Roll: {student.rollNumber || "PENDING"}</p>
                    <p className="text-campus-secondary">{student.course} • {student.department}</p>
                    <p className="text-campus-muted">Year {student.year || 1} | Batch {student.batch || "2024"}</p>
                    <p className="text-campus-text font-semibold text-[11px] pt-1">
                      Hostel: {student.hostelBlock || student.requestedHostel || "N/A"} • Rm {student.roomNumber || "N/A"} ({student.bedNumber || "N/A"})
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3.5 border-t border-campus-border flex items-center justify-between">
                  <div className="text-[10px] text-campus-muted space-y-0.5">
                    <span className="font-bold text-campus-text block">Emergency Contacts:</span>
                    <p>Parent: {student.fatherPhone || student.phone}</p>
                    {student.guardianPhone && <p>Guardian: {student.guardianPhone}</p>}
                  </div>
                  <div className="w-12 h-12 bg-white rounded-xl p-1 flex items-center justify-center shadow border border-campus-border">
                    <svg className="w-full h-full text-[#4D2A00]" viewBox="0 0 24 24" fill="currentColor">
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
                  <div key={doc.id} className="flex items-center justify-between p-3.5 border border-campus-border rounded-2xl bg-white/40 text-xs">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-campus-btnPrimary text-campus-text border border-campus-accent/20 rounded-xl flex items-center justify-center font-mono text-xs font-bold shadow-sm">
                        PDF
                      </div>
                      <div>
                        <p className="font-bold text-campus-text">{doc.docName}</p>
                        <p className="text-[11px] text-campus-muted font-mono">{doc.docType.replace(/_/g, " ")}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full ${
                      doc.status === "VERIFIED" ? "bg-emerald-500/15 text-emerald-800 border border-emerald-500/30" : "bg-amber-500/15 text-amber-800 border border-amber-500/30"
                    }`}>
                      {doc.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-campus-muted text-xs">
                  No verified document attachments recorded for this student account.
                </div>
              )}
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-2.5">
              {student.activityLogs && student.activityLogs.length > 0 ? (
                student.activityLogs.map((log: any) => (
                  <div key={log.id} className="p-3.5 border border-campus-border rounded-2xl bg-white/40 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-campus-text">{log.action.replace(/_/g, " ")}</span>
                      <span className="text-campus-muted text-[10px] font-mono">{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-campus-secondary leading-relaxed">{log.details}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-campus-muted text-xs">
                  No security audit history entries recorded for this student.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-campus-border px-6 py-3.5 flex justify-end bg-white/30">
          <button
            onClick={onClose}
            className="btn-secondary px-5 py-2 text-xs font-semibold rounded-xl"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};


