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
        return <span className="badge-success">Active Verified</span>;
      case "PENDING_WARDEN_VERIFICATION":
        return <span className="badge-warning">Pending Warden Review</span>;
      case "PENDING_ADMIN_APPROVAL":
        return <span className="badge-accent">Pending Admin Approval</span>;
      case "REJECTED_BY_WARDEN":
      case "REJECTED_BY_ADMIN":
        return <span className="badge-alert">Rejected</span>;
      default:
        return <span className="badge-neutral">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 sm:p-8 py-8 sm:py-12">
        <div className="glass-panel rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-8 h-8 border-2 border-[#FF6D1F] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-mono text-[var(--text-muted)]">Loading student digital dossier...</p>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 sm:p-8 py-8 sm:py-12">
        <div className="glass-panel rounded-3xl p-6 max-w-md w-full shadow-2xl">
          <h3 className="text-sm font-bold text-rose-500 mb-2">Error Loading Profile</h3>
          <p className="text-xs text-[var(--text-muted)] mb-4">{error || "Student record not found."}</p>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 sm:p-8 py-8 sm:py-12 overflow-y-auto">
      <div className="glass-panel rounded-3xl shadow-2xl max-w-3xl w-full my-auto max-h-[85vh] flex flex-col overflow-hidden border border-[var(--border-medium)]">
        {/* Header */}
        <div className="border-b border-[var(--border-subtle)] px-6 py-4 flex items-center justify-between bg-[var(--bg-surface)] shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#FF6D1F] text-[#141414] border border-[#FF6D1F]/30 flex items-center justify-center text-sm font-mono font-bold shadow-sm shrink-0">
              {student.fullName
                .split(" ")
                .map((n: string) => n[0])
                .slice(0, 2)
                .join("")}
            </div>
            <div>
              <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">{student.fullName}</h2>
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-[#FF6D1F]/15 text-[#FF6D1F] border border-[#FF6D1F]/30">
                  {student.rollNumber || "Pending Roll"}
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                {student.course} • {student.department} | Year {student.year || 1}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-2 rounded-xl hover:bg-[var(--border-subtle)] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Bar */}
        <div className="bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center space-x-2">
            <span className="text-[var(--text-muted)] font-mono text-[11px] uppercase tracking-wider font-semibold">Status:</span>
            {getStatusBadge(student.verificationStatus)}
          </div>
          <div className="flex items-center space-x-3 text-[var(--text-secondary)] text-xs font-mono">
            <span>Hostel: <strong className="text-[var(--text-primary)]">{student.hostelBlock || student.requestedHostel || "Unassigned"}</strong></span>
            <span>•</span>
            <span>Room: <strong className="text-[var(--text-primary)]">{student.roomNumber || "None"}</strong></span>
            <span>•</span>
            <span>Bed: <strong className="text-[var(--text-primary)]">{student.bedNumber || "None"}</strong></span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-[var(--border-subtle)] px-6 bg-[var(--bg-surface)] flex space-x-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab("profile")}
            className={`py-2.5 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === "profile"
                ? "border-[#FF6D1F] text-[#FF6D1F] bg-[var(--bg-elevated)]"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Complete Profile</span>
          </button>
          <button
            onClick={() => setActiveTab("idcard")}
            className={`py-2.5 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === "idcard"
                ? "border-[#FF6D1F] text-[#FF6D1F] bg-[var(--bg-elevated)]"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Digital ID</span>
          </button>
          <button
            onClick={() => setActiveTab("documents")}
            className={`py-2.5 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === "documents"
                ? "border-[#FF6D1F] text-[#FF6D1F] bg-[var(--bg-elevated)]"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Documents ({student.documents?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`py-2.5 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === "history"
                ? "border-[#FF6D1F] text-[#FF6D1F] bg-[var(--bg-elevated)]"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Trail</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {activeTab === "profile" && (
            <div className="space-y-5">
              {student.rejectionReason && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-400 font-medium">
                  <span className="font-bold">Rejection Reason: </span>
                  {student.rejectionReason}
                </div>
              )}

              {/* 1. Basic & Academic Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="campus-panel p-5 border border-[var(--border-subtle)] space-y-3 shadow-xs">
                  <h3 className="text-xs font-mono font-bold text-[#FF6D1F] border-b border-[var(--border-subtle)] pb-2 uppercase tracking-wider">
                    Personal Information
                  </h3>
                  <div className="space-y-0.5 text-xs">
                    <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)]">
                      <span className="text-[var(--text-muted)] text-[11px] font-medium">Full Name</span>
                      <span className="font-semibold text-[var(--text-primary)]">{student.fullName}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)]">
                      <span className="text-[var(--text-muted)] text-[11px] font-medium">Date of Birth</span>
                      <span className="text-[var(--text-secondary)]">{student.dob ? new Date(student.dob).toLocaleDateString() : "Not Provided"}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)]">
                      <span className="text-[var(--text-muted)] text-[11px] font-medium">Gender</span>
                      <span className="text-[var(--text-secondary)]">{student.gender || "Not Specified"}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)]">
                      <span className="text-[var(--text-muted)] text-[11px] font-medium">Blood Group</span>
                      <span className="font-mono font-bold text-rose-500">{student.bloodGroup || "Not Specified"}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)]">
                      <span className="text-[var(--text-muted)] text-[11px] font-medium">Student Email</span>
                      <span className="text-[var(--text-secondary)] font-mono text-[11px]">{student.email}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-[var(--text-muted)] text-[11px] font-medium">Student Phone</span>
                      <span className="font-mono text-[var(--text-primary)] font-semibold">{student.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="campus-panel p-5 border border-[var(--border-subtle)] space-y-3 shadow-xs">
                  <h3 className="text-xs font-mono font-bold text-[#FF6D1F] border-b border-[var(--border-subtle)] pb-2 uppercase tracking-wider">
                    Academic Classification
                  </h3>
                  <div className="space-y-0.5 text-xs">
                    <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)]">
                      <span className="text-[var(--text-muted)] text-[11px] font-medium">Roll / Reg. No.</span>
                      <span className="font-mono font-bold text-[#FF6D1F]">{student.rollNumber || "Pending"}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)]">
                      <span className="text-[var(--text-muted)] text-[11px] font-medium">Course</span>
                      <span className="text-[var(--text-primary)] font-semibold">{student.course}</span>
                    </div>
                    <div className="flex items-start justify-between py-2 border-b border-[var(--border-subtle)] gap-2">
                      <span className="text-[var(--text-muted)] text-[11px] font-medium shrink-0">Department</span>
                      <span className="text-[var(--text-primary)] font-semibold text-right">{student.department}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)]">
                      <span className="text-[var(--text-muted)] text-[11px] font-medium">Academic Year</span>
                      <span className="text-[var(--text-secondary)]">Year {student.year || 1} (Sem {student.semester || 1})</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)]">
                      <span className="text-[var(--text-muted)] text-[11px] font-medium">Batch</span>
                      <span className="text-[var(--text-secondary)]">{student.batch || "2024-2028"}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-[var(--text-muted)] text-[11px] font-medium">Enrollment Date</span>
                      <span className="text-[var(--text-secondary)] font-mono">{new Date(student.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Parent & Local Guardian Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="campus-panel p-5 border border-[var(--border-subtle)] space-y-3 shadow-xs">
                  <h3 className="text-xs font-mono font-bold text-[#FF6D1F] border-b border-[var(--border-subtle)] pb-2 uppercase tracking-wider">
                    Parent Details
                  </h3>
                  <div className="space-y-0.5 text-xs">
                    <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)]">
                      <span className="text-[var(--text-muted)] text-[11px] font-medium">Father's Name</span>
                      <span className="font-semibold text-[var(--text-primary)]">{student.fatherName || "Not Provided"}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)]">
                      <span className="text-[var(--text-muted)] text-[11px] font-medium">Father's Phone</span>
                      <span className="font-mono text-[#FF6D1F] font-semibold">{student.fatherPhone || "Not Provided"}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)]">
                      <span className="text-[var(--text-muted)] text-[11px] font-medium">Mother's Name</span>
                      <span className="text-[var(--text-secondary)]">{student.motherName || "Not Provided"}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-[var(--text-muted)] text-[11px] font-medium">Mother's Phone</span>
                      <span className="font-mono text-[var(--text-secondary)]">{student.motherPhone || "Not Provided"}</span>
                    </div>
                  </div>
                </div>

                <div className="campus-panel p-5 border border-[var(--border-subtle)] space-y-3 shadow-xs">
                  <h3 className="text-xs font-mono font-bold text-[#FF6D1F] border-b border-[var(--border-subtle)] pb-2 uppercase tracking-wider">
                    Local Guardian Details
                  </h3>
                  <div className="space-y-0.5 text-xs">
                    <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)]">
                      <span className="text-[var(--text-muted)] text-[11px] font-medium">Guardian Name</span>
                      <span className="font-semibold text-[var(--text-primary)]">{student.guardianName || "Not Provided"}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)]">
                      <span className="text-[var(--text-muted)] text-[11px] font-medium">Relationship</span>
                      <span className="text-[var(--text-secondary)]">{student.guardianRelation || "Not Specified"}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)]">
                      <span className="text-[var(--text-muted)] text-[11px] font-medium">Guardian Phone</span>
                      <span className="font-mono text-[#FF6D1F] font-semibold">{student.guardianPhone || "Not Provided"}</span>
                    </div>
                    <div className="flex items-start justify-between py-2 gap-2">
                      <span className="text-[var(--text-muted)] text-[11px] font-medium shrink-0">Address</span>
                      <span className="text-[var(--text-secondary)] text-right">{student.guardianAddress || "Not Provided"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Hostel & Room Allocation */}
              <div className="campus-panel p-5 border border-[var(--border-subtle)] space-y-3.5 shadow-xs">
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
                  <h3 className="text-xs font-mono font-bold text-[#FF6D1F] uppercase tracking-wider">
                    {student.livingType === "DAY_SCHOLAR" ? "Transit & Commute Allocation" : "Hostel & Room Assignment"}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                    {student.livingType || "HOSTELLER"}
                  </span>
                </div>

                {student.livingType === "DAY_SCHOLAR" ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)]">
                      <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block">Bus Route</span>
                      <span className="text-xs font-bold text-[var(--text-primary)] mt-1 block">{student.busRoute || "Route 1"}</span>
                    </div>
                    <div className="p-3.5 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)]">
                      <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block">Pickup Point</span>
                      <span className="text-xs font-bold text-[var(--text-primary)] mt-1 block truncate">{student.pickupPoint || "Main Gate"}</span>
                    </div>
                    <div className="p-3.5 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)]">
                      <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block">Vehicle Number</span>
                      <span className="text-xs font-bold text-[var(--text-primary)] font-mono mt-1 block">{student.vehicleNumber || "None (Bus)"}</span>
                    </div>
                    <div className="p-3.5 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)]">
                      <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block">Parking Zone</span>
                      <span className="text-xs font-semibold text-[var(--text-secondary)] mt-1 block truncate">{student.parkingZone || "Zone A"}</span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)]">
                      <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block">Hostel Block</span>
                      <span className="text-xs font-bold text-[var(--text-primary)] mt-1 block">{student.hostelBlock || "Not Assigned"}</span>
                    </div>
                    <div className="p-3.5 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)]">
                      <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block">Room Number</span>
                      <span className="text-xs font-bold text-[var(--text-primary)] font-mono mt-1 block">{student.roomNumber || "Not Assigned"}</span>
                    </div>
                    <div className="p-3.5 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)]">
                      <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block">Bed Identifier</span>
                      <span className="text-xs font-bold text-[var(--text-primary)] font-mono mt-1 block">{student.bedNumber || "Not Assigned"}</span>
                    </div>
                    <div className="p-3.5 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)]">
                      <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block">Preference</span>
                      <span className="text-xs font-semibold text-[var(--text-secondary)] mt-1 block truncate">{student.requestedHostel} ({student.roomPreference || "Standard"})</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "idcard" && (
            <div className="max-w-md mx-auto">
              <div className="campus-panel rounded-3xl p-6 shadow-2xl border border-[var(--border-medium)] relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3.5 mb-4">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#FF6D1F] text-[#141414] font-black flex items-center justify-center text-xs shadow-sm">
                      CD
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">CampusDesk Digital ID</h4>
                      <p className="text-[10px] text-[var(--text-muted)] font-mono">Institutional Identity Token</p>
                    </div>
                  </div>
                  <div className="px-2.5 py-1 bg-[#FF6D1F]/15 text-[#FF6D1F] text-[10px] font-mono font-bold rounded-full border border-[#FF6D1F]/30">
                    {student.verificationStatus === "ACTIVE" ? "VERIFIED ACTIVE" : "PENDING"}
                  </div>
                </div>

                <div className="flex space-x-4">
                  <div className="w-20 h-24 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl flex flex-col items-center justify-center text-center p-1 shadow-inner">
                    <div className="w-12 h-12 rounded-full bg-[#FF6D1F] text-[#141414] flex items-center justify-center font-bold text-sm mb-1 shadow-sm">
                      {student.fullName
                        .split(" ")
                        .map((n: string) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <span className="text-[8px] text-[var(--text-muted)] uppercase font-mono">Photo ID</span>
                  </div>

                  <div className="flex-1 text-xs space-y-1">
                    <h3 className="font-bold text-sm text-[var(--text-primary)]">{student.fullName}</h3>
                    <p className="text-[#FF6D1F] font-mono text-[11px] font-bold">Roll: {student.rollNumber || "PENDING"}</p>
                    <p className="text-[var(--text-secondary)]">{student.course} • {student.department}</p>
                    <p className="text-[var(--text-muted)]">Year {student.year || 1} | Batch {student.batch || "2024"}</p>
                    <p className="text-[var(--text-primary)] font-semibold text-[11px] pt-1">
                      Hostel: {student.hostelBlock || student.requestedHostel || "N/A"} • Rm {student.roomNumber || "N/A"} ({student.bedNumber || "N/A"})
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3.5 border-t border-[var(--border-subtle)] flex items-center justify-between">
                  <div className="text-[10px] text-[var(--text-muted)] space-y-0.5">
                    <span className="font-bold text-[var(--text-primary)] block">Emergency Contacts:</span>
                    <p>Parent: {student.fatherPhone || student.phone}</p>
                    {student.guardianPhone && <p>Guardian: {student.guardianPhone}</p>}
                  </div>
                  <div className="w-12 h-12 bg-white rounded-xl p-1 flex items-center justify-center shadow border border-gray-300">
                    <svg className="w-full h-full text-[#141414]" viewBox="0 0 24 24" fill="currentColor">
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
                  <div key={doc.id} className="flex items-center justify-between p-3.5 border border-[var(--border-subtle)] rounded-2xl bg-[var(--bg-surface)] text-xs">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-[#FF6D1F] text-[#141414] border border-[#FF6D1F]/30 rounded-xl flex items-center justify-center font-mono text-xs font-bold shadow-sm">
                        PDF
                      </div>
                      <div>
                        <p className="font-bold text-[var(--text-primary)]">{doc.docName}</p>
                        <p className="text-[11px] text-[var(--text-muted)] font-mono">{doc.docType.replace(/_/g, " ")}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full ${
                      doc.status === "VERIFIED" ? "badge-success" : "badge-warning"
                    }`}>
                      {doc.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-[var(--text-muted)] text-xs font-mono">
                  No verified document attachments recorded for this student account.
                </div>
              )}
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-2.5">
              {student.activityLogs && student.activityLogs.length > 0 ? (
                student.activityLogs.map((log: any) => (
                  <div key={log.id} className="p-3.5 border border-[var(--border-subtle)] rounded-2xl bg-[var(--bg-surface)] text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[var(--text-primary)]">{log.action.replace(/_/g, " ")}</span>
                      <span className="text-[var(--text-muted)] text-[10px] font-mono">{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-[var(--text-secondary)] leading-relaxed">{log.details}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-[var(--text-muted)] text-xs font-mono">
                  No security audit history entries recorded for this student.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--border-subtle)] px-6 py-3 flex justify-end bg-[var(--bg-surface)] shrink-0">
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
