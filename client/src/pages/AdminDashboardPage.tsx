import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  BarChart2,
  Clock,
  AlertTriangle,
  Download,
  Users,
  CheckCircle2,
  Building,
  UserPlus,
  UserCheck,
  ShieldCheck,
  Megaphone,
  Wrench,
  X,
  Save,
  Search,
  Eye,
  ArrowRightLeft,
  ScrollText,
  BedDouble,
  DoorOpen,
  Activity,
  Siren,
  Flame,
  ShieldAlert,
  Sparkles,
  MapPin,
  Radio,
  Plus,
  PhoneCall,
  Repeat,
  GraduationCap,
  Volume2,
  VolumeX,
  Filter,
  CheckCircle,
  BookOpen,
  Moon
} from "lucide-react";
import { apiRequest, UserProfile } from "../api/client.js";
import { StudentProfileModal } from "../components/StudentProfileModal.js";
import { AdminAcademicManagement } from "../components/AdminAcademicManagement.js";
import { HostelEveningReturnSection } from "../components/HostelEveningReturnSection.js";
import { WardenOperationsDashboard } from "../components/WardenOperationsDashboard.js";

interface AdminDashboardPageProps {
  user: UserProfile | null;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ user }) => {
  const isAdmin = user?.role === "ADMIN";
  const isWarden = user?.role === "WARDEN";

  const [wardenViewMode, setWardenViewMode] = useState<"friendly" | "advanced">(
    isWarden ? "friendly" : "advanced"
  );

  const [activeTab, setActiveTab] = useState<
    "pulse" | "overview" | "emergencies" | "heatmap" | "maintenance" | "verifications" | "wardens" | "staff" | "students" | "hostels" | "transfers" | "audit" | "courses" | "academics"
  >("pulse");

  // Campus Pulse State
  const [pulseData, setPulseData] = useState<any>(null);
  const [pulseLoading, setPulseLoading] = useState<boolean>(false);

  // SOS Emergencies State & Filters
  const [emergencies, setEmergencies] = useState<any[]>([]);
  const [emergenciesLoading, setEmergenciesLoading] = useState<boolean>(false);
  const [emergencyActionLoading, setEmergencyActionLoading] = useState<boolean>(false);
  const [emergencyStatusFilter, setEmergencyStatusFilter] = useState<string>("ALL");
  const [emergencyTypeFilter, setEmergencyTypeFilter] = useState<string>("ALL");
  const [emergencyCategoryFilter, setEmergencyCategoryFilter] = useState<string>("ALL");
  const [emergencyAudioMuted, setEmergencyAudioMuted] = useState<boolean>(false);
  const [activeNoteModalEmergency, setActiveNoteModalEmergency] = useState<any | null>(null);
  const [responderNoteText, setResponderNoteText] = useState<string>("");
  const [targetStatusForNote, setTargetStatusForNote] = useState<string>("");

  // Academic Courses & Branches State
  const [courses, setCourses] = useState<any[]>([]);
  const [coursesLoading, setCoursesLoading] = useState<boolean>(false);
  const [showCourseModal, setShowCourseModal] = useState<boolean>(false);
  const [editingCourse, setEditingCourse] = useState<any | null>(null);
  const [courseForm, setCourseForm] = useState({
    code: "",
    name: "",
    durationYears: 4,
    type: "SEMESTER"
  });
  const [showBranchModal, setShowBranchModal] = useState<boolean>(false);
  const [selectedCourseForBranch, setSelectedCourseForBranch] = useState<any | null>(null);
  const [editingBranch, setEditingBranch] = useState<any | null>(null);
  const [branchForm, setBranchForm] = useState({
    code: "",
    name: "",
    courseId: ""
  });
  const [courseActionLoading, setCourseActionLoading] = useState<boolean>(false);

  // Campus Heatmap State
  const [heatmapData, setHeatmapData] = useState<any>(null);
  const [heatmapLoading, setHeatmapLoading] = useState<boolean>(false);

  // Planned Maintenance State
  const [maintenanceList, setMaintenanceList] = useState<any[]>([]);
  const [maintenanceLoading, setMaintenanceLoading] = useState<boolean>(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState<boolean>(false);
  const [maintenanceForm, setMaintenanceForm] = useState({
    title: "",
    description: "",
    location: "Hostel Block A",
    affectedAudience: "Hostel-A Residents",
    startTime: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
    endTime: new Date(Date.now() + 10800000).toISOString().slice(0, 16)
  });

  // Dashboard Metrics
  const [statsData, setStatsData] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState<boolean>(true);
  const [hostelFilter, setHostelFilter] = useState<string>("ALL");

  // Student Verification Queue State
  const [verifications, setVerifications] = useState<any[]>([]);
  const [verificationsLoading, setVerificationsLoading] = useState<boolean>(false);
  const [verificationStatusFilter, setVerificationStatusFilter] = useState<string>("ALL");
  const [verificationSearch, setVerificationSearch] = useState<string>("");

  // Rejection Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false);
  const [rejectingStudentId, setRejectingStudentId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [rejectActionType, setRejectActionType] = useState<"warden" | "admin">("warden");

  // Student Directory State
  const [students, setStudents] = useState<any[]>([]);
  const [studentsLoading, setStudentsLoading] = useState<boolean>(false);
  const [studentSearch, setStudentSearch] = useState<string>("");
  const [studentHostelFilter, setStudentHostelFilter] = useState<string>("ALL");
  const [studentStatusFilter, setStudentStatusFilter] = useState<string>("ALL");
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<string | null>(null);

  // Warden Management State (Admin Only)
  const [wardens, setWardens] = useState<any[]>([]);
  const [wardensLoading, setWardensLoading] = useState<boolean>(false);
  const [showWardenModal, setShowWardenModal] = useState<boolean>(false);
  const [editingWardenId, setEditingWardenId] = useState<string | null>(null);
  const [wardenForm, setWardenForm] = useState({
    fullName: "",
    employeeId: "",
    email: "",
    password: "",
    phone: "",
    hostelBlock: "Hostel-A"
  });

  // Staff Management State (Admin Only)
  const [staffList, setStaffList] = useState<any[]>([]);
  const [staffLoading, setStaffLoading] = useState<boolean>(false);
  const [showStaffModal, setShowStaffModal] = useState<boolean>(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [staffForm, setStaffForm] = useState({
    fullName: "",
    employeeId: "",
    email: "",
    password: "",
    phone: "",
    department: "Plumbing & Maintenance"
  });

  // Hostel & Room/Bed State
  const [hostels, setHostels] = useState<any[]>([]);
  const [hostelsLoading, setHostelsLoading] = useState<boolean>(false);
  const [showRoomModal, setShowRoomModal] = useState<boolean>(false);
  const [roomForm, setRoomForm] = useState({
    hostelBlock: isWarden ? (user?.hostelBlock || "Hostel-A") : "Hostel-A",
    roomNumber: "",
    floor: 1,
    capacity: 2
  });
  const [hostelSubTab, setHostelSubTab] = useState<"eveningReturn" | "rooms">("eveningReturn");
  const [showAllocateModal, setShowAllocateModal] = useState<boolean>(false);
  const [allocateForm, setAllocateForm] = useState({
    hostelBlock: "Hostel-A",
    roomNumber: "",
    bedNumber: "Bed-1",
    studentId: ""
  });

  // Hostel Transfers State
  const [transfers, setTransfers] = useState<any[]>([]);
  const [transfersLoading, setTransfersLoading] = useState<boolean>(false);

  // System Audit Logs State (Admin Only)
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState<boolean>(false);
  const [auditActionFilter, setAuditActionFilter] = useState<string>("ALL");
  const [auditSearch, setAuditSearch] = useState<string>("");

  const [notificationMsg, setNotificationMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setNotificationMsg({ text, type });
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  useEffect(() => {
    fetchStats();
    fetchPulse();
  }, [hostelFilter]);

  useEffect(() => {
    if (activeTab === "pulse") fetchPulse();
    if (activeTab === "emergencies") fetchEmergencies();
    if (activeTab === "heatmap") fetchHeatmap();
    if (activeTab === "maintenance") fetchMaintenance();
    if (activeTab === "verifications") fetchVerifications();
    if (activeTab === "students") fetchStudents();
    if (activeTab === "wardens" && isAdmin) fetchWardens();
    if (activeTab === "staff" && isAdmin) fetchStaff();
    if (activeTab === "hostels") fetchHostels();
    if (activeTab === "transfers") fetchTransfers();
    if (activeTab === "audit" && isAdmin) fetchAuditLogs();
    if (activeTab === "courses" && isAdmin) fetchCourses();
  }, [activeTab]);

  // Siren audio chime for incoming emergencies
  const playSirenChime = () => {
    if (emergencyAudioMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {}
  };

  // Auto-refresh emergency feed every 6 seconds when viewing emergencies tab
  useEffect(() => {
    if (activeTab !== "emergencies") return;
    const timer = setInterval(() => {
      fetchEmergencies();
      fetchPulse();
    }, 6000);
    return () => clearInterval(timer);
  }, [activeTab]);

  const fetchPulse = async () => {
    setPulseLoading(true);
    try {
      const data = await apiRequest<any>("/api/admin/pulse");
      setPulseData(data);
    } catch (err: any) {
      console.error("Failed to load pulse:", err);
    } finally {
      setPulseLoading(false);
    }
  };

  const fetchEmergencies = async () => {
    setEmergenciesLoading(true);
    try {
      const data = await apiRequest<{ emergencies: any[] }>("/api/emergencies");
      const list = data.emergencies || [];
      setEmergencies(list);
      // Play audio chime if active unacknowledged beacons exist
      const hasActive = list.some((e) => e.status === "ACTIVE" || e.status === "NEW");
      if (hasActive) {
        playSirenChime();
      }
    } catch (err: any) {
      showToast(err.message || "Failed to load emergencies.", "error");
    } finally {
      setEmergenciesLoading(false);
    }
  };

  const fetchCourses = async () => {
    setCoursesLoading(true);
    try {
      const data = await apiRequest<{ courses: any[] }>("/api/academic/courses?includeInactive=true");
      setCourses(data.courses || []);
    } catch (err: any) {
      showToast(err.message || "Failed to load courses.", "error");
    } finally {
      setCoursesLoading(false);
    }
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setCourseActionLoading(true);
    try {
      if (editingCourse) {
        await apiRequest(`/api/academic/courses/${editingCourse.id}`, {
          method: "PUT",
          body: JSON.stringify(courseForm)
        });
        showToast("Course program updated successfully");
      } else {
        await apiRequest("/api/academic/courses", {
          method: "POST",
          body: JSON.stringify(courseForm)
        });
        showToast("Course program registered successfully");
      }
      setShowCourseModal(false);
      setEditingCourse(null);
      setCourseForm({ code: "", name: "", durationYears: 4, type: "SEMESTER" });
      fetchCourses();
    } catch (err: any) {
      showToast(err.message || "Failed to save course program", "error");
    } finally {
      setCourseActionLoading(false);
    }
  };

  const handleToggleCourseStatus = async (courseId: string, currentStatus: boolean) => {
    try {
      await apiRequest(`/api/academic/courses/${courseId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !currentStatus })
      });
      showToast(`Course program ${!currentStatus ? "activated" : "deactivated"}`);
      fetchCourses();
    } catch (err: any) {
      showToast(err.message || "Failed to update course status", "error");
    }
  };

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setCourseActionLoading(true);
    try {
      if (editingBranch) {
        await apiRequest(`/api/academic/branches/${editingBranch.id}`, {
          method: "PUT",
          body: JSON.stringify({ code: branchForm.code, name: branchForm.name })
        });
        showToast("Academic branch updated successfully");
      } else {
        await apiRequest("/api/academic/branches", {
          method: "POST",
          body: JSON.stringify(branchForm)
        });
        showToast("Academic branch added successfully");
      }
      setShowBranchModal(false);
      setEditingBranch(null);
      setSelectedCourseForBranch(null);
      setBranchForm({ code: "", name: "", courseId: "" });
      fetchCourses();
    } catch (err: any) {
      showToast(err.message || "Failed to save branch", "error");
    } finally {
      setCourseActionLoading(false);
    }
  };

  const handleToggleBranchStatus = async (branchId: string, currentStatus: boolean) => {
    try {
      await apiRequest(`/api/academic/branches/${branchId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !currentStatus })
      });
      showToast(`Academic branch ${!currentStatus ? "activated" : "deactivated"}`);
      fetchCourses();
    } catch (err: any) {
      showToast(err.message || "Failed to update branch status", "error");
    }
  };

  const fetchHeatmap = async () => {
    setHeatmapLoading(true);
    try {
      const data = await apiRequest<any>("/api/admin/heatmap");
      setHeatmapData(data);
    } catch (err: any) {
      showToast(err.message || "Failed to load heatmap.", "error");
    } finally {
      setHeatmapLoading(false);
    }
  };

  const fetchMaintenance = async () => {
    setMaintenanceLoading(true);
    try {
      const data = await apiRequest<{ maintenance: any[] }>("/api/maintenance");
      setMaintenanceList(data.maintenance || []);
    } catch (err: any) {
      showToast(err.message || "Failed to load maintenance schedules.", "error");
    } finally {
      setMaintenanceLoading(false);
    }
  };

  const handleUpdateEmergencyStatus = async (emergencyId: string, status: string, notes?: string) => {
    setEmergencyActionLoading(true);
    try {
      await apiRequest(`/api/emergencies/${emergencyId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, responderNotes: notes || undefined })
      });
      showToast(`Emergency beacon marked as ${status}`);
      setActiveNoteModalEmergency(null);
      setResponderNoteText("");
      fetchEmergencies();
      fetchPulse();
    } catch (err: any) {
      showToast(err.message || "Failed to update emergency beacon", "error");
    } finally {
      setEmergencyActionLoading(false);
    }
  };

  const handleCreateMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest("/api/maintenance", {
        method: "POST",
        body: JSON.stringify(maintenanceForm)
      });
      setShowMaintenanceModal(false);
      showToast("Planned maintenance scheduled and student broadcast dispatched!");
      setMaintenanceForm({
        title: "",
        description: "",
        location: "Hostel Block A",
        affectedAudience: "Hostel-A Residents",
        startTime: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
        endTime: new Date(Date.now() + 10800000).toISOString().slice(0, 16)
      });
      fetchMaintenance();
    } catch (err: any) {
      showToast(err.message || "Failed to schedule maintenance", "error");
    }
  };

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const data = await apiRequest<any>(
        `/api/admin/dashboard-stats?hostelBlock=${isWarden ? user?.hostelBlock || "ALL" : hostelFilter}`
      );
      setStatsData(data);
    } catch (err: any) {
      showToast(err.message || "Failed to load dashboard metrics.", "error");
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchVerifications = async () => {
    setVerificationsLoading(true);
    try {
      const data = await apiRequest<{ verifications: any[] }>(
        `/api/admin/verifications?status=${verificationStatusFilter}&search=${encodeURIComponent(verificationSearch)}`
      );
      setVerifications(data.verifications || []);
    } catch (err: any) {
      showToast(err.message || "Failed to load verification queue.", "error");
    } finally {
      setVerificationsLoading(false);
    }
  };

  const fetchStudents = async () => {
    setStudentsLoading(true);
    try {
      const data = await apiRequest<{ students: any[] }>(
        `/api/admin/students?hostelBlock=${isWarden ? user?.hostelBlock || "ALL" : studentHostelFilter}&verificationStatus=${studentStatusFilter}&search=${encodeURIComponent(studentSearch)}`
      );
      setStudents(data.students || []);
    } catch (err: any) {
      showToast(err.message || "Failed to load student directory.", "error");
    } finally {
      setStudentsLoading(false);
    }
  };

  const fetchWardens = async () => {
    setWardensLoading(true);
    try {
      const data = await apiRequest<{ wardens: any[] }>("/api/admin/wardens");
      setWardens(data.wardens || []);
    } catch (err: any) {
      showToast(err.message || "Failed to load wardens.", "error");
    } finally {
      setWardensLoading(false);
    }
  };

  const fetchStaff = async () => {
    setStaffLoading(true);
    try {
      const data = await apiRequest<{ staff: any[] }>("/api/admin/staff");
      setStaffList(data.staff || []);
    } catch (err: any) {
      showToast(err.message || "Failed to load staff members.", "error");
    } finally {
      setStaffLoading(false);
    }
  };

  const fetchHostels = async () => {
    setHostelsLoading(true);
    try {
      const data = await apiRequest<{ hostels: any[] }>("/api/hostels");
      setHostels(data.hostels || []);
    } catch (err: any) {
      showToast(err.message || "Failed to load hostels.", "error");
    } finally {
      setHostelsLoading(false);
    }
  };

  const fetchTransfers = async () => {
    setTransfersLoading(true);
    try {
      const data = await apiRequest<{ transfers: any[] }>("/api/hostels/transfers");
      setTransfers(data.transfers || []);
    } catch (err: any) {
      showToast(err.message || "Failed to load hostel transfer requests.", "error");
    } finally {
      setTransfersLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const data = await apiRequest<{ logs: any[] }>(
        `/api/admin/audit-logs?action=${auditActionFilter}&search=${encodeURIComponent(auditSearch)}`
      );
      setAuditLogs(data.logs || []);
    } catch (err: any) {
      showToast(err.message || "Failed to load system audit logs.", "error");
    } finally {
      setAuditLoading(false);
    }
  };

  const handleWardenReview = async (studentId: string, action: "APPROVE" | "REJECT", reason?: string) => {
    try {
      await apiRequest(`/api/admin/verifications/${studentId}/warden-review`, {
        method: "PATCH",
        body: JSON.stringify({ action, rejectionReason: reason })
      });
      showToast(`Student registration ${action === "APPROVE" ? "verified and approved" : "rejected"} by Warden.`);
      fetchVerifications();
      fetchStats();
    } catch (err: any) {
      showToast(err.message || "Failed to review student registration.", "error");
    }
  };

  const handleAdminReview = async (studentId: string, action: "APPROVE" | "REJECT", reason?: string) => {
    try {
      await apiRequest(`/api/admin/verifications/${studentId}/admin-review`, {
        method: "PATCH",
        body: JSON.stringify({ action, rejectionReason: reason })
      });
      showToast(`Student registration ${action === "APPROVE" ? "activated successfully" : "rejected"} by Administration.`);
      fetchVerifications();
      fetchStats();
    } catch (err: any) {
      showToast(err.message || "Failed to process admin approval.", "error");
    }
  };

  const handleSaveWarden = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingWardenId) {
        await apiRequest(`/api/admin/wardens/${editingWardenId}`, {
          method: "PUT",
          body: JSON.stringify({
            fullName: wardenForm.fullName,
            phone: wardenForm.phone,
            hostelBlock: wardenForm.hostelBlock
          })
        });
        showToast("Warden details updated successfully.");
      } else {
        await apiRequest("/api/admin/wardens", {
          method: "POST",
          body: JSON.stringify(wardenForm)
        });
        showToast("Warden account created successfully.");
      }
      setShowWardenModal(false);
      setEditingWardenId(null);
      fetchWardens();
      fetchStats();
    } catch (err: any) {
      showToast(err.message || "Failed to save warden account.", "error");
    }
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStaffId) {
        await apiRequest(`/api/admin/staff/${editingStaffId}`, {
          method: "PUT",
          body: JSON.stringify({
            fullName: staffForm.fullName,
            phone: staffForm.phone,
            department: staffForm.department
          })
        });
        showToast("Staff details updated successfully.");
      } else {
        await apiRequest("/api/admin/staff", {
          method: "POST",
          body: JSON.stringify(staffForm)
        });
        showToast("Staff account created successfully.");
      }
      setShowStaffModal(false);
      setEditingStaffId(null);
      fetchStaff();
      fetchStats();
    } catch (err: any) {
      showToast(err.message || "Failed to save staff account.", "error");
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest("/api/hostels/rooms", {
        method: "POST",
        body: JSON.stringify(roomForm)
      });
      showToast(`Room ${roomForm.roomNumber} created in ${roomForm.hostelBlock}.`);
      setShowRoomModal(false);
      fetchHostels();
    } catch (err: any) {
      showToast(err.message || "Failed to create room.", "error");
    }
  };

  const handleAllocateBed = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest("/api/hostels/allocate", {
        method: "POST",
        body: JSON.stringify(allocateForm)
      });
      showToast("Bed successfully allocated to student.");
      setShowAllocateModal(false);
      fetchHostels();
      fetchStudents();
    } catch (err: any) {
      showToast(err.message || "Failed to allocate bed.", "error");
    }
  };

  const handleDeallocateBed = async (bedId: string) => {
    if (!confirm("Are you sure you want to vacate/deallocate this bed?")) return;
    try {
      await apiRequest("/api/hostels/deallocate", {
        method: "POST",
        body: JSON.stringify({ bedId })
      });
      showToast("Bed vacated successfully.");
      fetchHostels();
      fetchStudents();
    } catch (err: any) {
      showToast(err.message || "Failed to deallocate bed.", "error");
    }
  };

  const handleToggleStudentStatus = async (studentId: string) => {
    try {
      const res = await apiRequest<{ message: string }>(`/api/admin/students/${studentId}/toggle-status`, {
        method: "PATCH"
      });
      showToast(res.message || "Student status updated.");
      fetchStudents();
      fetchStats();
    } catch (err: any) {
      showToast(err.message || "Failed to update student status.", "error");
    }
  };

  // If Warden, always render the friendly, dedicated WardenOperationsDashboard
  if (user && isWarden) {
    return <WardenOperationsDashboard user={user} />;
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notificationMsg && (
        <div
          role="status"
          className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl shadow-elevated text-xs font-semibold text-white transition-all ${
            notificationMsg.type === "success" ? "bg-emerald-500 text-black font-bold" : "bg-red-600"
          }`}
        >
          {notificationMsg.text}
        </div>
      )}

      {/* Header */}
      <div className="glass-panel border border-[var(--border-subtle)] rounded-3xl p-6 shadow-glass flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span
              className={`px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded border ${
                isAdmin
                  ? "bg-[#FF6D1F]/15 text-[#FF6D1F] border-[#FF6D1F]/30"
                  : "bg-amber-500/10 text-amber-300 border-amber-500/30"
              }`}
            >
              {isAdmin ? "Central Admin Oversight" : `Warden Operations (${user?.hostelBlock || "Assigned Hostel"})`}
            </span>
          </div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] mt-1.5">
            {isAdmin ? "Campus Administration & College Governance" : `Hostel Management — ${user?.hostelBlock || "My Hostel"}`}
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            {isAdmin
              ? "Oversee campus-wide student admissions, 2-step verification, hostels, wardens, staff, and system audit logs."
              : "Verify student admissions, manage hostel residents, assign rooms & beds, and inspect transfer requests."}
          </p>
        </div>

        {/* Global Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {isAdmin && (
            <>
              <button
                onClick={() => {
                  setWardenForm({
                    fullName: "",
                    employeeId: `EMP-WRD-${Date.now().toString().slice(-3)}`,
                    email: "",
                    password: "Password@123",
                    phone: "",
                    hostelBlock: "Hostel-A"
                  });
                  setEditingWardenId(null);
                  setShowWardenModal(true);
                }}
                className="inline-flex items-center space-x-1.5 px-3 py-2 bg-[#FF6D1F] hover:bg-[#FF8238] text-[#141414] text-xs font-bold rounded-xl shadow-sm transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Warden</span>
              </button>

              <button
                onClick={() => {
                  setStaffForm({
                    fullName: "",
                    employeeId: `EMP-STF-${Date.now().toString().slice(-3)}`,
                    email: "",
                    password: "Password@123",
                    phone: "",
                    department: "Plumbing & Maintenance"
                  });
                  setEditingStaffId(null);
                  setShowStaffModal(true);
                }}
                className="inline-flex items-center space-x-1.5 px-3 py-2 bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-semibold rounded-xl shadow-sm transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Staff</span>
              </button>
            </>
          )}

          <a
            href="/api/admin/export/tickets"
            download
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-medium rounded-xl transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#FF6D1F]" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Role-Based Tab Navigation */}
      <div className="border-b border-[var(--border-subtle)] flex overflow-x-auto gap-2 text-xs font-mono pb-1">
        <button
          onClick={() => setActiveTab("pulse")}
          className={`py-2 px-3 border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
            activeTab === "pulse" ? "border-[#FF6D1F] text-[var(--text-primary)] font-bold" : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Campus Pulse</span>
        </button>

        <button
          onClick={() => setActiveTab("emergencies")}
          className={`py-2 px-3 border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
            activeTab === "emergencies" ? "border-rose-500 text-rose-600 dark:text-rose-300 font-bold" : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          <Siren className="w-3.5 h-3.5 text-rose-400" />
          <span>SOS Emergencies</span>
          {(typeof pulseData?.pulse?.activeEmergencies === "number"
            ? pulseData.pulse.activeEmergencies
            : (Array.isArray(pulseData?.pulse?.activeEmergencies)
                ? pulseData.pulse.activeEmergencies.length
                : (pulseData?.pulse?.activeEmergenciesCount || 0))) > 0 && (
            <span className="px-1.5 py-0.2 text-[9px] font-mono bg-rose-600 text-white rounded-full font-bold animate-pulse">
              {typeof pulseData?.pulse?.activeEmergencies === "number"
                ? pulseData.pulse.activeEmergencies
                : (Array.isArray(pulseData?.pulse?.activeEmergencies)
                    ? pulseData.pulse.activeEmergencies.length
                    : (pulseData?.pulse?.activeEmergenciesCount || 0))}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("heatmap")}
          className={`py-2 px-3 border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
            activeTab === "heatmap" ? "border-[#FF6D1F] text-[var(--text-primary)] font-bold" : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-amber-500" />
          <span>Issue Heatmap</span>
        </button>

        <button
          onClick={() => setActiveTab("maintenance")}
          className={`py-2 px-3 border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
            activeTab === "maintenance" ? "border-[#FF6D1F] text-[var(--text-primary)] font-bold" : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          <Radio className="w-3.5 h-3.5 text-amber-400" />
          <span>Planned Outages</span>
        </button>

        <button
          onClick={() => setActiveTab("overview")}
          className={`py-2 px-3 border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
            activeTab === "overview" ? "border-[#FF6D1F] text-[var(--text-primary)] font-bold" : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>Hostel Stats</span>
        </button>

        <button
          onClick={() => setActiveTab("verifications")}
          className={`py-2 px-3 border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
            activeTab === "verifications" ? "border-[#FF6D1F] text-[var(--text-primary)] font-bold" : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Student Verifications</span>
          {statsData?.pending?.verifications > 0 && (
            <span className="px-1.5 py-0.2 text-[9px] font-mono bg-[#FF6D1F] text-[#222222] rounded-full font-bold">
              {statsData.pending.verifications}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("students")}
          className={`py-2 px-3 border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
            activeTab === "students" ? "border-[#FF6D1F] text-[var(--text-primary)] font-bold" : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>{isAdmin ? "Student Management" : "My Hostel Residents"}</span>
        </button>

        <button
          onClick={() => setActiveTab("hostels")}
          className={`py-2 px-3 border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
            activeTab === "hostels" ? "border-[#FF6D1F] text-[var(--text-primary)] font-bold" : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          <BedDouble className="w-3.5 h-3.5" />
          <span>Rooms & Beds</span>
        </button>

        <button
          onClick={() => setActiveTab("transfers")}
          className={`py-2 px-3 border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
            activeTab === "transfers" ? "border-[#FF6D1F] text-[var(--text-primary)] font-bold" : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span>Hostel Transfers</span>
        </button>

        {isAdmin && (
          <>
            <button
              onClick={() => setActiveTab("wardens")}
              className={`py-2 px-3 border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
                activeTab === "wardens" ? "border-[#FF6D1F] text-[var(--text-primary)] font-bold" : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Warden Management</span>
            </button>

            <button
              onClick={() => setActiveTab("staff")}
              className={`py-2 px-3 border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
                activeTab === "staff" ? "border-[#FF6D1F] text-[var(--text-primary)] font-bold" : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Staff Management</span>
            </button>

            <button
              onClick={() => setActiveTab("audit")}
              className={`py-2 px-3 border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
                activeTab === "audit" ? "border-[#FF6D1F] text-[var(--text-primary)] font-bold" : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              <ScrollText className="w-3.5 h-3.5" />
              <span>System Audit Logs</span>
            </button>

            <button
              onClick={() => setActiveTab("courses")}
              className={`py-2 px-3 border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
                activeTab === "courses" ? "border-[#FF6D1F] text-[var(--text-primary)] font-bold" : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Courses & Branches</span>
            </button>

            <button
              onClick={() => setActiveTab("academics")}
              className={`py-2 px-3 border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
                activeTab === "academics" ? "border-[#FF6D1F] text-[var(--text-primary)] font-bold" : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Academic Management</span>
            </button>
          </>
        )}
      </div>

      {/* TAB: CAMPUS PULSE */}
      {activeTab === "pulse" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <div className="p-4 rounded-3xl glass-card border border-[var(--border-subtle)]">
              <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">Active SOS</span>
              <p className={`text-2xl font-extrabold font-mono mt-1 ${(typeof pulseData?.pulse?.activeEmergencies === "number" ? pulseData.pulse.activeEmergencies : (Array.isArray(pulseData?.pulse?.activeEmergencies) ? pulseData.pulse.activeEmergencies.length : (pulseData?.pulse?.activeEmergenciesCount || 0))) > 0 ? "text-rose-600 animate-pulse" : "text-[var(--text-primary)]"}`}>
                {typeof pulseData?.pulse?.activeEmergencies === "number"
                  ? pulseData.pulse.activeEmergencies
                  : (Array.isArray(pulseData?.pulse?.activeEmergencies)
                      ? pulseData.pulse.activeEmergencies.length
                      : (pulseData?.pulse?.activeEmergenciesCount || 0))}
              </p>
              <span className="text-[10px] text-[var(--text-secondary)]">High Priority</span>
            </div>

            <div className="p-4 rounded-3xl glass-card border border-[var(--border-subtle)]">
              <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">Critical Issues</span>
              <p className="text-2xl font-extrabold font-mono text-rose-600 mt-1">
                {typeof pulseData?.pulse?.criticalTickets === "number"
                  ? pulseData.pulse.criticalTickets
                  : (Array.isArray(pulseData?.pulse?.criticalTickets)
                      ? pulseData.pulse.criticalTickets.length
                      : (pulseData?.pulse?.criticalTicketsCount || 0))}
              </p>
              <span className="text-[10px] text-[var(--text-secondary)]">4h SLA Target</span>
            </div>

            <div className="p-4 rounded-3xl glass-card border border-[var(--border-subtle)]">
              <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">Overdue SLA</span>
              <p className="text-2xl font-extrabold font-mono text-amber-700 mt-1">
                {typeof pulseData?.pulse?.overdueTickets === "number"
                  ? pulseData.pulse.overdueTickets
                  : (Array.isArray(pulseData?.pulse?.overdueTickets)
                      ? pulseData.pulse.overdueTickets.length
                      : (pulseData?.pulse?.overdueTicketsCount || 0))}
              </p>
              <span className="text-[10px] text-[var(--text-secondary)]">Escalated</span>
            </div>

            <div className="p-4 rounded-3xl glass-card border border-[var(--border-subtle)]">
              <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">Recurring Issues</span>
              <p className="text-2xl font-extrabold font-mono text-[#FF6D1F] mt-1">
                {pulseData?.pulse?.recurringCount ?? pulseData?.pulse?.recurringIssuesCount ?? 0}
              </p>
              <span className="text-[10px] text-[var(--text-secondary)]">30-Day Repeats</span>
            </div>

            <div className="p-4 rounded-3xl glass-card border border-[var(--border-subtle)]">
              <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">Pending Tickets</span>
              <p className="text-2xl font-extrabold font-mono text-[var(--text-primary)] mt-1">
                {pulseData?.pulse?.pendingTickets ?? 0}
              </p>
              <span className="text-[10px] text-[var(--text-secondary)]">Active Queue</span>
            </div>

            <div className="p-4 rounded-3xl glass-card border border-[var(--border-subtle)]">
              <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">Resolved Today</span>
              <p className="text-2xl font-extrabold font-mono text-emerald-700 mt-1">
                {pulseData?.pulse?.resolvedToday ?? pulseData?.pulse?.completedTodayCount ?? 0}
              </p>
              <span className="text-[10px] text-emerald-700 font-medium">Completed</span>
            </div>

            <div className="p-4 rounded-3xl glass-card border border-[var(--border-subtle)]">
              <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">Gate Exits</span>
              <p className="text-2xl font-extrabold font-mono text-[var(--text-primary)] mt-1">
                {pulseData?.pulse?.activeGatePasses ?? pulseData?.pulse?.activeExitsCount ?? 0}
              </p>
              <span className="text-[10px] text-[var(--text-secondary)]">Outside Campus</span>
            </div>

            <div className="p-4 rounded-3xl glass-card border border-[var(--border-subtle)]">
              <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">Active Outages</span>
              <p className="text-2xl font-extrabold font-mono text-[#FF6D1F] mt-1">
                {typeof pulseData?.pulse?.activeMaintenance === "number"
                  ? pulseData.pulse.activeMaintenance
                  : (Array.isArray(pulseData?.pulse?.activeMaintenance)
                      ? pulseData.pulse.activeMaintenance.length
                      : (pulseData?.pulse?.activeMaintenanceCount || 0))}
              </p>
              <span className="text-[10px] text-[var(--text-secondary)]">Notified</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Real-time Staff Load */}
            <div className="glass-card rounded-3xl p-5 border border-[var(--border-subtle)] space-y-3">
              <h3 className="text-xs font-mono font-bold text-[#FF6D1F] uppercase tracking-wider flex items-center space-x-1.5">
                <Wrench className="w-4 h-4" />
                <span>Technician Active Workload & Capacity</span>
              </h3>
              <div className="space-y-2.5">
                {pulseData?.staffWorkload && pulseData.staffWorkload.length > 0 ? (
                  pulseData.staffWorkload.map((staff: any) => (
                    <div key={staff.id} className="p-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl flex items-center justify-between text-xs">
                      <div>
                        <strong className="text-[var(--text-primary)]">{staff.name}</strong>
                        <p className="text-[11px] text-[var(--text-secondary)]">{staff.department}</p>
                      </div>
                      <div className="text-right font-mono">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          staff.activeTasks > 5 ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                        }`}>
                          {staff.activeTasks} Active Tasks
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">{staff.resolvedToday} resolved today</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[var(--text-muted)] py-4 text-center">No staff load metrics available.</p>
                )}
              </div>
            </div>

            {/* Hotspots Overview */}
            <div className="glass-card rounded-3xl p-5 border border-[var(--border-subtle)] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold text-[#FF6D1F] uppercase tracking-wider flex items-center space-x-1.5">
                  <Flame className="w-4 h-4 text-amber-700" />
                  <span>Campus Complaint Hotspots</span>
                </h3>
                <button onClick={() => setActiveTab("heatmap")} className="text-xs font-semibold text-[#FF6D1F] hover:underline">
                  Open Heatmap &rarr;
                </button>
              </div>

              <div className="space-y-2.5">
                {pulseData?.hotspots && pulseData.hotspots.length > 0 ? (
                  pulseData.hotspots.map((spot: any, i: number) => (
                    <div key={i} className="p-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 rounded-full bg-campus-btnPrimary text-[var(--text-primary)] font-bold text-[10px] flex items-center justify-center">
                          {i + 1}
                        </span>
                        <div>
                          <strong className="text-[var(--text-primary)]">{spot.location}</strong>
                          <p className="text-[11px] text-[var(--text-secondary)] font-mono">{spot.category}</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        {spot.count} Incidents
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[var(--text-muted)] py-4 text-center">No concentrated hotspots detected.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: SOS EMERGENCIES COMMAND CENTER */}
      {activeTab === "emergencies" && (
        <div className="space-y-4 animate-fadeIn">
          {/* Header & Controls */}
          <div className="glass-panel p-5 rounded-3xl border border-[var(--border-subtle)] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-glass">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center font-bold">
                <Siren className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center space-x-2">
                  <span>Campus Emergency SOS Command</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-600 text-white shadow-sm">
                    {emergencies.filter((e) => e.status === "ACTIVE" || e.status === "NEW").length} Active
                  </span>
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  Real-time beacon feed targeting Wardens for hostel residents and Campus Security for day scholars.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 flex-wrap">
              <button
                onClick={() => setEmergencyAudioMuted(!emergencyAudioMuted)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 border transition-all ${
                  emergencyAudioMuted
                    ? "bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]"
                    : "bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/25"
                }`}
                title={emergencyAudioMuted ? "Audio Siren Muted" : "Audio Siren Enabled"}
              >
                {emergencyAudioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span>{emergencyAudioMuted ? "Siren Muted" : "Siren Alert On"}</span>
              </button>

              <button
                onClick={fetchEmergencies}
                className="btn-secondary px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1"
              >
                <Repeat className="w-3.5 h-3.5" />
                <span>Refresh Feed</span>
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="glass-panel p-3.5 rounded-2xl border border-[var(--border-subtle)] flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center space-x-1.5 text-[var(--text-muted)] font-medium">
              <Filter className="w-3.5 h-3.5" />
              <span>Filters:</span>
            </div>

            <div className="flex items-center space-x-1">
              <label className="text-[var(--text-muted)] font-mono text-[11px]">Status:</label>
              <select
                value={emergencyStatusFilter}
                onChange={(e) => setEmergencyStatusFilter(e.target.value)}
                className="px-2.5 py-1 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] text-xs"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active / Unresolved</option>
                <option value="ACKNOWLEDGED">Acknowledged</option>
                <option value="RESPONDING">Responding</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>

            <div className="flex items-center space-x-1">
              <label className="text-[var(--text-muted)] font-mono text-[11px]">Student Type:</label>
              <select
                value={emergencyTypeFilter}
                onChange={(e) => setEmergencyTypeFilter(e.target.value)}
                className="px-2.5 py-1 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] text-xs"
              >
                <option value="ALL">All Students</option>
                <option value="HOSTELLER">Hostellers Only</option>
                <option value="DAY_SCHOLAR">Day Scholars Only</option>
              </select>
            </div>

            <div className="flex items-center space-x-1">
              <label className="text-[var(--text-muted)] font-mono text-[11px]">Category:</label>
              <select
                value={emergencyCategoryFilter}
                onChange={(e) => setEmergencyCategoryFilter(e.target.value)}
                className="px-2.5 py-1 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] text-xs"
              >
                <option value="ALL">All Categories</option>
                <option value="MEDICAL">Medical</option>
                <option value="FIRE_SMOKE">Fire / Smoke</option>
                <option value="LIFT_STUCK">Lift Stuck</option>
                <option value="SECURITY">Security Threat</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          {/* Emergency Cards Grid */}
          {emergenciesLoading ? (
            <div className="p-12 text-center text-xs text-[var(--text-muted)] glass-card rounded-3xl">Loading emergency beacons...</div>
          ) : (
            (() => {
              const filtered = emergencies.filter((em) => {
                if (emergencyStatusFilter !== "ALL") {
                  if (emergencyStatusFilter === "ACTIVE") {
                    if (em.status !== "ACTIVE" && em.status !== "NEW") return false;
                  } else if (em.status !== emergencyStatusFilter) {
                    return false;
                  }
                }
                if (emergencyTypeFilter !== "ALL") {
                  const sType = em.studentType || em.student?.livingType || "HOSTELLER";
                  if (sType !== emergencyTypeFilter) return false;
                }
                if (emergencyCategoryFilter !== "ALL" && em.category !== emergencyCategoryFilter) {
                  return false;
                }
                return true;
              });

              if (filtered.length === 0) {
                return (
                  <div className="p-12 text-center text-xs text-[var(--text-muted)] glass-card rounded-3xl space-y-1">
                    <p className="font-bold text-[var(--text-primary)] text-sm">✓ Perimeter Clear</p>
                    <p>No emergency beacons matching the selected filters.</p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filtered.map((em) => {
                    const isNewOrActive = em.status === "ACTIVE" || em.status === "NEW";
                    const isHostelStudent = (em.studentType || em.student?.livingType) === "HOSTELLER";
                    const emergencyPhone = em.emergencyContact || em.student?.guardianPhone || em.student?.fatherPhone || em.student?.phone;

                    return (
                      <div
                        key={em.id}
                        className={`p-5 rounded-3xl glass-card border-2 space-y-4 transition-all ${
                          isNewOrActive
                            ? "border-rose-500/70 bg-rose-950/20 shadow-lg ring-1 ring-rose-500/30"
                            : em.status === "ACKNOWLEDGED"
                            ? "border-amber-500/40 bg-amber-950/15"
                            : em.status === "RESPONDING"
                            ? "border-blue-500/40 bg-blue-950/15"
                            : "border-[var(--border-subtle)] bg-[var(--bg-surface)] opacity-85"
                        }`}
                      >
                        {/* Header Badges */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            <span className="px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center space-x-1">
                              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                              <span>{em.category}</span>
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                              isHostelStudent
                                ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                                : "bg-blue-500/15 text-blue-300 border-blue-500/30"
                            }`}>
                              {isHostelStudent ? "Hosteller" : "Day Scholar"}
                            </span>
                          </div>

                          <div className="flex items-center space-x-1.5">
                            <span className="text-[10px] font-mono text-[var(--text-muted)]">
                              #{em.alertNumber || em.id.slice(0, 8)}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                isNewOrActive
                                  ? "status-badge-error animate-pulse"
                                  : em.status === "ACKNOWLEDGED"
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                  : em.status === "RESPONDING"
                                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                                  : "status-badge-success"
                              }`}
                            >
                              {isNewOrActive ? "ACTIVE" : em.status}
                            </span>
                          </div>
                        </div>

                        {/* Location & Description */}
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                            <strong className="text-sm text-[var(--text-primary)]">{em.location}</strong>
                          </div>
                          {em.description && (
                            <p className="text-xs text-[var(--text-secondary)] mt-1 bg-[var(--bg-surface)] p-2.5 rounded-xl border border-[var(--border-subtle)] leading-relaxed">
                              {em.description}
                            </p>
                          )}
                        </div>

                        {/* Student & Guardian Info */}
                        <div className="p-3 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] text-xs space-y-1.5 font-mono">
                          <div className="flex items-center justify-between">
                            <span className="text-[var(--text-muted)]">Student:</span>
                            <strong className="text-[var(--text-primary)]">
                              {em.student?.fullName || "Student"} ({em.student?.rollNumber || "N/A"})
                            </strong>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-[var(--text-muted)]">Profile Context:</span>
                            <span className="text-[var(--text-primary)] font-sans text-[11px]">
                              {isHostelStudent
                                ? `${em.student?.hostelBlock || "Block"} Rm ${em.student?.roomNumber || "N/A"}${em.student?.bedNumber ? ` (${em.student?.bedNumber})` : ""}`
                                : em.student?.currentAddress || (em.student?.busRoute ? `Route: ${em.student?.busRoute}` : "Day Scholar Campus")}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-[var(--text-muted)]">Student Phone:</span>
                            <a
                              href={`tel:${em.student?.phone}`}
                              className="text-[#FF6D1F] font-bold hover:underline flex items-center space-x-1"
                            >
                              <PhoneCall className="w-3 h-3" />
                              <span>{em.student?.phone || "N/A"}</span>
                            </a>
                          </div>

                          {emergencyPhone && (
                            <div className="flex items-center justify-between border-t border-[var(--border-subtle)]/60 pt-1">
                              <span className="text-rose-400 font-bold">Emergency Contact:</span>
                              <a
                                href={`tel:${emergencyPhone}`}
                                className="text-rose-400 font-bold hover:underline flex items-center space-x-1"
                              >
                                <PhoneCall className="w-3 h-3" />
                                <span>{emergencyPhone}</span>
                              </a>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] pt-0.5">
                            <span>Dispatched At:</span>
                            <span>{new Date(em.createdAt).toLocaleTimeString()} ({new Date(em.createdAt).toLocaleDateString()})</span>
                          </div>
                        </div>

                        {/* Responder Notes */}
                        {em.responderNotes && (
                          <div className="p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-sans text-[var(--text-primary)]">
                            <span className="font-bold text-[#FF6D1F]">Responder Log: </span>
                            {em.responderNotes}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center space-x-2 flex-wrap gap-y-2">
                          {isNewOrActive && (
                            <button
                              onClick={() => {
                                setActiveNoteModalEmergency(em);
                                setTargetStatusForNote("ACKNOWLEDGED");
                                setResponderNoteText("Command center acknowledged alert. Security responding.");
                              }}
                              disabled={emergencyActionLoading}
                              className="flex-1 py-2 px-3 rounded-xl text-xs font-bold btn-primary"
                            >
                              Acknowledge
                            </button>
                          )}

                          {(isNewOrActive || em.status === "ACKNOWLEDGED") && (
                            <button
                              onClick={() => {
                                setActiveNoteModalEmergency(em);
                                setTargetStatusForNote("RESPONDING");
                                setResponderNoteText("Security and response team dispatched to scene.");
                              }}
                              disabled={emergencyActionLoading}
                              className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors"
                            >
                              Mark Responding
                            </button>
                          )}

                          {em.status !== "RESOLVED" && (
                            <button
                              onClick={() => {
                                setActiveNoteModalEmergency(em);
                                setTargetStatusForNote("RESOLVED");
                                setResponderNoteText("Incident verified and resolved safely on campus.");
                              }}
                              disabled={emergencyActionLoading}
                              className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                            >
                              Resolve
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setActiveNoteModalEmergency(em);
                              setTargetStatusForNote(em.status);
                              setResponderNoteText(em.responderNotes || "");
                            }}
                            className="p-2 rounded-xl text-xs font-semibold btn-secondary"
                            title="Add or update responder note"
                          >
                            Note
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* TAB: ACADEMIC COURSES & BRANCHES (ADMIN ONLY) */}
      {activeTab === "courses" && isAdmin && (
        <div className="space-y-6 animate-fadeIn">
          <div className="glass-panel p-6 rounded-3xl border border-[var(--border-subtle)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[#FF6D1F] flex items-center justify-center font-bold">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">Academic Courses & Department Branches</h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  Manage college degree programs, year durations, and dependent department specializations for student registration.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setEditingCourse(null);
                setCourseForm({ code: "", name: "", durationYears: 4, type: "SEMESTER" });
                setShowCourseModal(true);
              }}
              className="px-4 py-2.5 bg-[#FF6D1F] hover:bg-[#FF8238] text-[#141414] text-xs font-bold rounded-xl transition-all shadow-sm flex items-center space-x-2 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Degree Program</span>
            </button>
          </div>

          {coursesLoading ? (
            <div className="p-12 text-center text-xs text-[var(--text-muted)] glass-card rounded-3xl">Loading academic programs...</div>
          ) : courses.length === 0 ? (
            <div className="p-12 text-center text-xs text-[var(--text-muted)] glass-card rounded-3xl">
              No academic programs configured yet. Click "Add Degree Program" to configure your first course.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5">
              {courses.map((c) => (
                <div
                  key={c.id}
                  className={`p-6 rounded-3xl glass-card border transition-all ${
                    c.isActive ? "border-[var(--border-subtle)]" : "border-rose-300/60 bg-rose-50/20 opacity-80"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border-subtle)]">
                    <div className="flex items-center space-x-3">
                      <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-[#FF6D1F]/20 text-[#FF6D1F] border border-[#FF6D1F]/30">
                        {c.code}
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center space-x-2">
                          <span>{c.name}</span>
                          {!c.isActive && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-rose-100 text-rose-700 border border-rose-300">
                              INACTIVE
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
                          {c.durationYears} Years ({c.durationYears * 2} Semesters) • {c.branches?.length || 0} Specializations
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => {
                          setSelectedCourseForBranch(c);
                          setEditingBranch(null);
                          setBranchForm({ code: "", name: "", courseId: c.id });
                          setShowBranchModal(true);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-[#FF6D1F] border border-[var(--border-subtle)] rounded-xl flex items-center space-x-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Branch</span>
                      </button>

                      <button
                        onClick={() => {
                          setEditingCourse(c);
                          setCourseForm({
                            code: c.code,
                            name: c.name,
                            durationYears: c.durationYears,
                            type: c.type || "SEMESTER"
                          });
                          setShowCourseModal(true);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold btn-secondary rounded-xl"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleToggleCourseStatus(c.id, c.isActive)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-xl border ${
                          c.isActive
                            ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                        }`}
                      >
                        {c.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </div>

                  {/* Branches List */}
                  <div className="pt-4">
                    <p className="text-[11px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2.5">
                      Offered Branches / Specializations
                    </p>
                    {(!c.branches || c.branches.length === 0) ? (
                      <p className="text-xs text-[var(--text-muted)] py-2 italic">
                        No branches assigned to this program yet.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        {c.branches.map((b: any) => (
                          <div
                            key={b.id}
                            className={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-2 ${
                              b.isActive
                                ? "bg-[var(--bg-surface)] border-[var(--border-subtle)]"
                                : "bg-rose-50/40 border-rose-200 text-[var(--text-muted)]"
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center space-x-1.5">
                                <span className="font-mono font-bold text-[#FF6D1F]">{b.code}</span>
                                {!b.isActive && (
                                  <span className="text-[9px] font-mono text-rose-600 font-bold">(Inactive)</span>
                                )}
                              </div>
                              <p className="text-[11px] text-[var(--text-secondary)] truncate" title={b.name}>
                                {b.name}
                              </p>
                            </div>

                            <div className="flex items-center space-x-1 shrink-0">
                              <button
                                onClick={() => {
                                  setSelectedCourseForBranch(c);
                                  setEditingBranch(b);
                                  setBranchForm({ code: b.code, name: b.name, courseId: c.id });
                                  setShowBranchModal(true);
                                }}
                                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                title="Edit Branch"
                              >
                                <Wrench className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleToggleBranchStatus(b.id, b.isActive)}
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                                  b.isActive
                                    ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                                    : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                }`}
                              >
                                {b.isActive ? "Off" : "On"}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: ACADEMIC MANAGEMENT (FACULTY, SUBJECTS, ASSIGNMENTS, TIMETABLE) */}
      {activeTab === "academics" && isAdmin && (
        <AdminAcademicManagement />
      )}

      {/* TAB: CAMPUS ISSUE HEATMAP */}
      {activeTab === "heatmap" && (
        <div className="space-y-6">
          <div className="glass-card rounded-3xl p-6 border border-[var(--border-subtle)] space-y-4">
            <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center space-x-2">
              <Flame className="w-4 h-4 text-amber-700" />
              <span>Campus Complaint Concentration Heatmap</span>
            </h2>

            {heatmapLoading ? (
              <div className="p-12 text-center text-xs text-[var(--text-muted)]">Analyzing complaint hotspots...</div>
            ) : (
              <div className="space-y-6">
                {/* Block Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {heatmapData?.heatmap && Object.entries(heatmapData.heatmap).map(([block, data]: any) => (
                    <div key={block} className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-3">
                      <div className="flex items-center justify-between">
                        <strong className="text-xs text-[var(--text-primary)]">{block}</strong>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          data.total > 10 ? "bg-rose-100 text-rose-900" : data.total > 5 ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-900"
                        }`}>
                          {data.total} Complaints
                        </span>
                      </div>

                      <div className="space-y-1.5 text-[11px] font-mono text-[var(--text-secondary)]">
                        <div className="flex items-center justify-between">
                          <span>Critical / High:</span>
                          <strong className="text-rose-600">{data.critical || 0}</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Recurring Issues:</span>
                          <strong className="text-amber-700">{data.recurring || 0}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Category Concentration */}
                {heatmapData?.categoryBreakdown && (
                  <div className="p-4 bg-[var(--bg-input)] rounded-2xl border border-[var(--border-subtle)] space-y-3">
                    <h3 className="text-xs font-mono font-bold uppercase text-[#FF6D1F]">
                      Category Distribution Breakdown
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      {heatmapData.categoryBreakdown.map((c: any) => (
                        <div key={c.category} className="p-3 bg-white rounded-xl border border-[var(--border-subtle)]/60">
                          <span className="text-[11px] font-semibold text-[var(--text-primary)] block truncate">{c.category}</span>
                          <span className="text-lg font-bold text-[#FF6D1F] font-mono">{c.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: PLANNED MAINTENANCE SCHEDULER */}
      {activeTab === "maintenance" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center space-x-2">
              <Radio className="w-4 h-4 text-[#FF6D1F]" />
              <span>Scheduled Utility Maintenance & Outages ({maintenanceList.length})</span>
            </h2>
            <button
              onClick={() => setShowMaintenanceModal(true)}
              className="btn-primary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Maintenance Outage</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {maintenanceList.map((m) => (
              <div key={m.id} className="p-5 rounded-3xl glass-card border border-[var(--border-subtle)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    {m.location}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    m.status === "ACTIVE" ? "status-badge-warning" : "status-badge-neutral"
                  }`}>
                    {m.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">{m.title}</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">{m.description}</p>
                </div>

                <div className="pt-2 border-t border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] font-mono space-y-1">
                  <div>Audience: <strong>{m.affectedAudience}</strong></div>
                  <div>Window: <strong>{new Date(m.startTime).toLocaleString([], { dateStyle: "short", timeStyle: "short" })} to {new Date(m.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</strong></div>
                </div>
              </div>
            ))}
          </div>

          {/* Schedule Maintenance Modal */}
          {showMaintenanceModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-fadeIn">
              <div className="glass-modal rounded-3xl max-w-md w-full p-6 space-y-4 shadow-elevated">
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                  <h3 className="text-base font-bold text-[var(--text-primary)]">Schedule Planned Outage</h3>
                  <button onClick={() => setShowMaintenanceModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateMaintenance} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[var(--text-primary)] mb-1 font-semibold">Title *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Block B Water Pipe Replacement"
                      value={maintenanceForm.title}
                      onChange={(e) => setMaintenanceForm({ ...maintenanceForm, title: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-surface)] text-[var(--text-primary)] focus:outline-none focus:border-campus-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-[var(--text-primary)] mb-1 font-semibold">Location *</label>
                    <input
                      required
                      type="text"
                      value={maintenanceForm.location}
                      onChange={(e) => setMaintenanceForm({ ...maintenanceForm, location: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-surface)] text-[var(--text-primary)] focus:outline-none focus:border-campus-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-[var(--text-primary)] mb-1 font-semibold">Affected Audience *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Hostel-B All Floors"
                      value={maintenanceForm.affectedAudience}
                      onChange={(e) => setMaintenanceForm({ ...maintenanceForm, affectedAudience: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-surface)] text-[var(--text-primary)] focus:outline-none focus:border-campus-accent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[var(--text-primary)] mb-1 font-semibold">Start Time *</label>
                      <input
                        required
                        type="datetime-local"
                        value={maintenanceForm.startTime}
                        onChange={(e) => setMaintenanceForm({ ...maintenanceForm, startTime: e.target.value })}
                        className="w-full px-3.5 py-2.5 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-surface)] text-[var(--text-primary)] focus:outline-none focus:border-campus-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-[var(--text-primary)] mb-1 font-semibold">End Time *</label>
                      <input
                        required
                        type="datetime-local"
                        value={maintenanceForm.endTime}
                        onChange={(e) => setMaintenanceForm({ ...maintenanceForm, endTime: e.target.value })}
                        className="w-full px-3.5 py-2.5 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-surface)] text-[var(--text-primary)] focus:outline-none focus:border-campus-accent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[var(--text-primary)] mb-1 font-semibold">Description *</label>
                    <textarea
                      required
                      rows={3}
                      value={maintenanceForm.description}
                      onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                      placeholder="Explain outage details and student instructions..."
                      className="w-full px-3.5 py-2.5 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-surface)] text-[var(--text-primary)] focus:outline-none focus:border-campus-accent resize-none"
                    />
                  </div>

                  <div className="flex justify-end space-x-2.5 pt-3 border-t border-[var(--border-subtle)]">
                    <button
                      type="button"
                      onClick={() => setShowMaintenanceModal(false)}
                      className="btn-secondary px-4 py-2 rounded-xl font-semibold"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary px-5 py-2 rounded-xl font-bold">
                      Publish & Notify Students
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 1: DASHBOARD OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="glass-panel border border-[var(--border-subtle)] rounded-3xl p-4 shadow-glass">
              <span className="text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase">Total Students</span>
              <p className="text-2xl font-extrabold text-[var(--text-primary)] mt-1 font-mono">{statsData?.stats?.totalStudents || 0}</p>
              <span className="text-[10px] text-emerald-400 font-semibold">{statsData?.stats?.activeStudents || 0} Active</span>
            </div>

            <div className="glass-panel border border-amber-500/30 rounded-3xl p-4 shadow-glass">
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">Pending Verification</span>
              <p className="text-2xl font-extrabold text-amber-300 mt-1 font-mono">
                {isWarden ? statsData?.stats?.pendingWardenVerifications || 0 : statsData?.stats?.pendingAdminApprovals || 0}
              </p>
              <span className="text-[10px] text-amber-400 font-medium">Awaiting Review</span>
            </div>

            <div className="glass-panel border border-[var(--border-subtle)] rounded-3xl p-4 shadow-glass">
              <span className="text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase">Total Beds</span>
              <p className="text-2xl font-extrabold text-[var(--text-primary)] mt-1 font-mono">{statsData?.stats?.totalBeds || 0}</p>
              <span className="text-[10px] text-[var(--text-secondary)] font-mono">{statsData?.stats?.availableBeds || 0} Available</span>
            </div>

            <div className="glass-panel border border-[var(--border-subtle)] rounded-3xl p-4 shadow-glass">
              <span className="text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase">Bed Occupancy</span>
              <p className="text-2xl font-extrabold text-[#FF6D1F] mt-1 font-mono">{statsData?.stats?.occupancyRate || 0}%</p>
              <span className="text-[10px] text-[var(--text-secondary)] font-mono">{statsData?.stats?.occupiedBeds || 0} Occupied</span>
            </div>

            <div className="glass-panel border border-[var(--border-subtle)] rounded-3xl p-4 shadow-glass">
              <span className="text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase">{isAdmin ? "Total Wardens" : "Hostel Block"}</span>
              <p className="text-2xl font-extrabold text-[var(--text-primary)] mt-1 font-mono">
                {isAdmin ? statsData?.stats?.totalWardens || 0 : user?.hostelBlock || "Hostel-A"}
              </p>
              <span className="text-[10px] text-[var(--text-muted)] font-mono">{isAdmin ? "Administered" : "Assigned"}</span>
            </div>

            <div className="glass-panel border border-[var(--border-subtle)] rounded-3xl p-4 shadow-glass">
              <span className="text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase">Pending Requests</span>
              <p className="text-2xl font-extrabold text-[#60A5FA] mt-1 font-mono">{statsData?.pending?.total || 0}</p>
              <span className="text-[10px] text-[var(--text-secondary)] font-mono">Complaints & Passes</span>
            </div>
          </div>

          {/* Activity Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Recent Audit Activity */}
            <div className="glass-panel border border-[var(--border-subtle)] rounded-3xl p-5 shadow-glass">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-mono font-bold text-[#FF6D1F] uppercase tracking-wider flex items-center space-x-1.5">
                  <Clock className="w-4 h-4" />
                  <span>Recent Hostel & System Activity</span>
                </h3>
                {isAdmin && (
                  <button onClick={() => setActiveTab("audit")} className="text-xs font-semibold text-[#FF6D1F] hover:text-[var(--text-primary)] transition-colors">
                    View All Logs &rarr;
                  </button>
                )}
              </div>

              <div className="space-y-2.5">
                {statsData?.recentLogs && statsData.recentLogs.length > 0 ? (
                  statsData.recentLogs.map((log: any) => (
                    <div key={log.id} className="p-3 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-[var(--text-primary)]">{log.action.replace(/_/g, " ")}</span>
                        <span className="text-[10px] font-mono text-[var(--text-muted)]">{new Date(log.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-[var(--text-secondary)] leading-relaxed">{log.details}</p>
                      <span className="text-[10px] font-mono text-[var(--text-muted)] mt-1 block">By: {log.actor?.fullName} ({log.actor?.role})</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[var(--text-muted)] py-4 text-center">No recent activity logs recorded.</p>
                )}
              </div>
            </div>

            {/* Staff Workload */}
            <div className="glass-panel border border-[var(--border-subtle)] rounded-3xl p-5 shadow-glass">
              <h3 className="text-xs font-mono font-bold text-[#FF6D1F] uppercase tracking-wider mb-4 flex items-center space-x-1.5">
                <Wrench className="w-4 h-4" />
                <span>Maintenance Staff Status</span>
              </h3>

              <div className="space-y-3">
                {statsData?.staffWorkload && statsData.staffWorkload.length > 0 ? (
                  statsData.staffWorkload.map((staff: any) => (
                    <div key={staff.id} className="p-3 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-xs flex items-center justify-between">
                      <div>
                        <p className="font-bold text-[var(--text-primary)]">{staff.name}</p>
                        <p className="text-[11px] text-[var(--text-secondary)]">{staff.department}</p>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded">
                          {staff.resolved} Resolved
                        </span>
                        <p className="text-[10px] font-mono text-[var(--text-muted)] mt-1">{staff.pending} In Progress</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[var(--text-muted)] py-4 text-center">No staff workload data available.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STUDENT VERIFICATION QUEUE */}
      {activeTab === "verifications" && (
        <div className="space-y-4">
          <div className="glass-panel border border-[var(--border-subtle)] rounded-3xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-glass">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search student or roll..."
                  value={verificationSearch}
                  onChange={(e) => setVerificationSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchVerifications()}
                  className="pl-8 pr-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl text-xs w-48 sm:w-64 focus:outline-none focus:border-[#FF6D1F]"
                />
              </div>

              <select
                value={verificationStatusFilter}
                onChange={(e) => {
                  setVerificationStatusFilter(e.target.value);
                  setTimeout(fetchVerifications, 50);
                }}
                className="px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl text-xs focus:outline-none focus:border-[#FF6D1F]"
              >
                <option value="ALL">All Verification Statuses</option>
                <option value="PENDING_WARDEN_VERIFICATION">Pending Warden Verification</option>
                <option value="PENDING_ADMIN_APPROVAL">Pending Admin Approval</option>
                <option value="REJECTED_BY_WARDEN">Rejected by Warden</option>
                <option value="REJECTED_BY_ADMIN">Rejected by Admin</option>
                <option value="ACTIVE">Active</option>
              </select>
            </div>

            <button
              onClick={fetchVerifications}
              className="px-3 py-1.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] text-xs font-semibold rounded-xl transition-colors"
            >
              Refresh Queue
            </button>
          </div>

          <div className="glass-panel border border-[var(--border-subtle)] rounded-3xl overflow-hidden shadow-glass">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-mono uppercase tracking-wider text-[11px]">
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Roll / Course</th>
                    <th className="px-4 py-3">Requested Hostel</th>
                    <th className="px-4 py-3">Parent / Guardian Contact</th>
                    <th className="px-4 py-3">Verification Stage</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {verificationsLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-[var(--text-muted)] font-mono">
                        Querying verification queue...
                      </td>
                    </tr>
                  ) : verifications.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-[var(--text-muted)]">
                        No pending student verifications found.
                      </td>
                    </tr>
                  ) : (
                    verifications.map((v) => (
                      <tr key={v.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setSelectedStudentForModal(v.id)}
                            className="font-bold text-[var(--text-primary)] hover:text-[#FF6D1F] hover:underline text-left block"
                          >
                            {v.fullName}
                          </button>
                          <span className="text-[11px] text-[var(--text-muted)]">{v.email}</span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold font-mono text-[#FF6D1F]">{v.rollNumber || "Pending Roll"}</p>
                          <p className="text-[11px] text-[var(--text-secondary)]">{v.course} - {v.department}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-[var(--text-primary)]">{v.requestedHostel}</span>
                          <p className="text-[11px] text-[var(--text-muted)]">{v.roomPreference || "Standard"}</p>
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px]">
                          <p className="text-[var(--text-primary)]">Father: {v.fatherPhone || "N/A"}</p>
                          <p className="text-[var(--text-muted)]">Guardian: {v.guardianPhone || "N/A"}</p>
                        </td>
                        <td className="px-4 py-3">
                          {v.verificationStatus === "PENDING_WARDEN_VERIFICATION" && (
                            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded">
                              Pending Warden Review
                            </span>
                          )}
                          {v.verificationStatus === "PENDING_ADMIN_APPROVAL" && (
                            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-blue-500/10 text-blue-300 border border-blue-500/30 rounded">
                              Pending Admin Final Approval
                            </span>
                          )}
                          {v.verificationStatus === "REJECTED_BY_WARDEN" && (
                            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-red-500/10 text-red-300 border border-red-500/30 rounded">
                              Rejected by Warden
                            </span>
                          )}
                          {v.verificationStatus === "REJECTED_BY_ADMIN" && (
                            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-red-500/10 text-red-300 border border-red-500/30 rounded">
                              Rejected by Admin
                            </span>
                          )}
                          {v.verificationStatus === "ACTIVE" && (
                            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded">
                              Active Student
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right space-x-1.5">
                          <button
                            onClick={() => setSelectedStudentForModal(v.id)}
                            className="px-2.5 py-1 bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded font-medium text-xs inline-flex items-center space-x-1 transition-colors"
                          >
                            <Eye className="w-3 h-3 text-[#FF6D1F]" />
                            <span>Dossier</span>
                          </button>

                          {/* Warden Action */}
                          {(isWarden || isAdmin) && v.verificationStatus === "PENDING_WARDEN_VERIFICATION" && (
                            <>
                              <button
                                onClick={() => handleWardenReview(v.id, "APPROVE")}
                                className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded font-bold text-xs transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setRejectingStudentId(v.id);
                                  setRejectActionType("warden");
                                  setRejectReason("");
                                  setRejectModalOpen(true);
                                }}
                                className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded font-bold text-xs transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {/* Admin Action */}
                          {isAdmin && v.verificationStatus === "PENDING_ADMIN_APPROVAL" && (
                            <>
                              <button
                                onClick={() => handleAdminReview(v.id, "APPROVE")}
                                className="px-2.5 py-1 bg-[#FF6D1F] hover:bg-[#FF8238] text-[#141414] rounded font-bold text-xs transition-colors"
                              >
                                Grant Final Approval
                              </button>
                              <button
                                onClick={() => {
                                  setRejectingStudentId(v.id);
                                  setRejectActionType("admin");
                                  setRejectReason("");
                                  setRejectModalOpen(true);
                                }}
                                className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded font-bold text-xs transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: STUDENT MANAGEMENT */}
      {activeTab === "students" && (
        <div className="space-y-4">
          <div className="glass-panel border border-[var(--border-subtle)] rounded-3xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-glass">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search name, roll, room..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchStudents()}
                  className="pl-8 pr-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl text-xs w-48 sm:w-64 focus:outline-none focus:border-[#FF6D1F]"
                />
              </div>

              {isAdmin && (
                <select
                  value={studentHostelFilter}
                  onChange={(e) => {
                    setStudentHostelFilter(e.target.value);
                    setTimeout(fetchStudents, 50);
                  }}
                  className="px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl text-xs focus:outline-none focus:border-[#FF6D1F]"
                >
                  <option value="ALL">All Hostels</option>
                  <option value="Hostel-A">Hostel-A</option>
                  <option value="Hostel-B">Hostel-B</option>
                  <option value="Hostel-C">Hostel-C</option>
                </select>
              )}

              <select
                value={studentStatusFilter}
                onChange={(e) => {
                  setStudentStatusFilter(e.target.value);
                  setTimeout(fetchStudents, 50);
                }}
                className="px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl text-xs focus:outline-none focus:border-[#FF6D1F]"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="PENDING_WARDEN_VERIFICATION">Pending Warden</option>
                <option value="PENDING_ADMIN_APPROVAL">Pending Admin</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <button
              onClick={fetchStudents}
              className="px-3 py-1.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] text-xs font-semibold rounded-xl transition-colors"
            >
              Refresh
            </button>
          </div>

          <div className="glass-panel border border-[var(--border-subtle)] rounded-3xl overflow-hidden shadow-glass">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-mono uppercase tracking-wider text-[11px]">
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Roll Number</th>
                    <th className="px-4 py-3">Hostel / Room / Bed</th>
                    <th className="px-4 py-3">Course & Year</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {studentsLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-[var(--text-muted)] font-mono">
                        Loading student directory...
                      </td>
                    </tr>
                  ) : students.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-[var(--text-muted)]">
                        No students found matching filters.
                      </td>
                    </tr>
                  ) : (
                    students.map((s) => (
                      <tr key={s.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setSelectedStudentForModal(s.id)}
                            className="font-bold text-[var(--text-primary)] hover:text-[#FF6D1F] hover:underline block text-left"
                          >
                            {s.fullName}
                          </button>
                          <span className="text-[11px] text-[var(--text-muted)]">{s.email}</span>
                        </td>
                        <td className="px-4 py-3 font-mono font-medium text-[#FF6D1F]">
                          {s.rollNumber || "N/A"}
                        </td>
                        <td className="px-4 py-3 font-mono">
                          <p className="font-semibold text-[var(--text-primary)]">
                            {s.hostelBlock || s.requestedHostel || "Unassigned"}
                          </p>
                          <p className="text-[11px] text-[var(--text-muted)]">
                            Rm {s.roomNumber || "N/A"} - {s.bedNumber || "N/A"}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-[var(--text-secondary)]">
                          {s.course} ({s.branch || s.department}) - Yr {s.year || 1}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
                              s.verificationStatus === "ACTIVE"
                                ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                                : s.verificationStatus.includes("PENDING")
                                ? "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                                : "bg-red-500/10 text-red-300 border border-red-500/30"
                            }`}
                          >
                            {s.verificationStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-1.5">
                          <button
                            onClick={() => setSelectedStudentForModal(s.id)}
                            className="px-2.5 py-1 bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded text-xs font-medium inline-flex items-center space-x-1 transition-colors"
                          >
                            <Eye className="w-3 h-3 text-[#FF6D1F]" />
                            <span>Profile</span>
                          </button>

                          {isAdmin && (
                            <button
                              onClick={() => handleToggleStudentStatus(s.id)}
                              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                                s.isActive
                                  ? "bg-red-500/10 text-red-300 border border-red-500/30 hover:bg-red-500/20"
                                  : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20"
                              }`}
                            >
                              {s.isActive ? "Deactivate" : "Activate"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ROOM & BED MANAGEMENT AND EVENING RETURN */}
      {activeTab === "hostels" && (
        <div className="space-y-6">
          {/* Sub-tab Navigation (Section 19: Clean underline with orange active marker) */}
          <div className="flex items-center space-x-6 border-b border-[var(--border-subtle)] pb-1 text-xs font-mono font-bold">
            <button
              onClick={() => setHostelSubTab("eveningReturn")}
              className={`pb-2.5 transition-all relative flex items-center space-x-2 ${
                hostelSubTab === "eveningReturn"
                  ? "text-[var(--text-primary)] border-b-2 border-[#FF6D1F]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-[#FF6D1F]" />
              <span>01 // EVENING RETURN & CURFEW ROLL CALL</span>
            </button>
            <button
              onClick={() => setHostelSubTab("rooms")}
              className={`pb-2.5 transition-all relative flex items-center space-x-2 ${
                hostelSubTab === "rooms"
                  ? "text-[var(--text-primary)] border-b-2 border-[#FF6D1F]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              <DoorOpen className="w-3.5 h-3.5 text-[#FF6D1F]" />
              <span>02 // ROOM & BED ALLOCATION MATRIX</span>
            </button>
          </div>

          {hostelSubTab === "eveningReturn" && (
            <HostelEveningReturnSection user={user} />
          )}

          {hostelSubTab === "rooms" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-[var(--border-subtle)]">
                <div>
                  <span className="editorial-eyebrow text-[#FF6D1F] block mb-0.5">
                    ACCOMMODATION ARCHITECTURE
                  </span>
                  <h2 className="editorial-title text-xl text-[var(--text-primary)]">HOSTEL ROOM & BED MATRIX</h2>
                  <p className="text-xs font-mono text-[var(--text-muted)] mt-0.5">Scannable floor-by-floor occupancy map and resident bed allocations.</p>
                </div>

                <button
                  onClick={() => setShowRoomModal(true)}
                  className="btn-primary px-3.5 py-2 text-xs font-mono font-bold rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors"
                >
                  <DoorOpen className="w-3.5 h-3.5" />
                  <span>ADD ROOM</span>
                </button>
              </div>

              {/* Hostels List & Bed Status Grid (Section 20) */}
              <div className="space-y-6">
            {hostelsLoading ? (
              <div className="campus-block p-12 text-center text-xs text-[var(--text-muted)] font-mono">
                Loading hostel room breakdown...
              </div>
            ) : (
              hostels
                .filter((h) => (isWarden ? h.name === user?.hostelBlock : true))
                .map((hostel) => (
                  <div key={hostel.id} className="campus-block p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border-subtle)] pb-3 gap-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-base font-mono font-bold text-[var(--text-primary)]">{hostel.name}</h3>
                          <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[var(--bg-elevated)] text-[#FF6D1F] rounded border border-[var(--border-subtle)]">
                            {hostel.type}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-[var(--text-secondary)] mt-0.5">{hostel.description || "Campus Student Residence"}</p>
                      </div>

                      <div className="flex items-center space-x-4 text-xs font-mono">
                        <span>Total Rooms: <strong className="text-[var(--text-primary)]">{hostel.totalRooms}</strong></span>
                        <span>Occupied: <strong className="text-emerald-500">{hostel.occupiedBeds}</strong> / {hostel.totalBeds} Beds</span>
                        <span className="px-2 py-0.5 bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 rounded font-bold">
                          {hostel.occupancyRate}% Full
                        </span>
                      </div>
                    </div>

                    {/* Room Grid: Section 20 Scannable Accommodation Map */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {hostel.rooms && hostel.rooms.length > 0 ? (
                        hostel.rooms.map((room: any) => (
                          <div key={room.id} className="border border-[var(--border-subtle)] rounded-lg p-3 bg-[var(--bg-elevated)] space-y-2">
                            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-1.5 font-mono">
                              <span className="font-bold text-xs text-[var(--text-primary)]">ROOM {room.roomNumber}</span>
                              <span className="text-[10px] text-[var(--text-muted)]">FLOOR {room.floor} · CAP: {room.capacity}</span>
                            </div>

                            <div className="space-y-1.5">
                              {room.beds?.map((bed: any) => (
                                <div
                                  key={bed.id}
                                  className="flex items-center justify-between p-2 rounded bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs font-mono"
                                >
                                  <div className="flex items-center space-x-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF6D1F]" />
                                    <span className="text-[11px] text-[var(--text-secondary)]">BED {bed.bedNumber}</span>
                                  </div>

                                  <div className="flex items-center space-x-2">
                                    {bed.status === "OCCUPIED" && bed.student ? (
                                      <div className="flex items-center space-x-1.5">
                                        <button
                                          onClick={() => setSelectedStudentForModal(bed.student.id)}
                                          className="text-[11px] font-medium text-emerald-400 hover:underline truncate max-w-[120px]"
                                          title={bed.student.fullName}
                                        >
                                          {bed.student.fullName}
                                        </button>
                                        <button
                                          onClick={() => handleDeallocateBed(bed.id)}
                                          title="Vacate Bed"
                                          className="text-[var(--text-muted)] hover:text-rose-400 p-0.5"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          setAllocateForm({
                                            hostelBlock: hostel.name,
                                            roomNumber: room.roomNumber,
                                            bedNumber: bed.bedNumber,
                                            studentId: ""
                                          });
                                          setShowAllocateModal(true);
                                        }}
                                        className="px-2 py-0.5 text-[10px] font-bold bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[#FF6D1F] border border-[#FF6D1F]/40 rounded transition-colors"
                                      >
                                        + ASSIGN
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs font-mono text-[var(--text-muted)] col-span-3 text-center py-4">
                          No rooms configured for this hostel yet. Click Add Room above.
                        </p>
                      )}
                    </div>
                  </div>
                ))
            )}
          </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: HOSTEL TRANSFERS */}
      {activeTab === "transfers" && (
        <div className="space-y-4">
          <div className="glass-panel border border-[var(--border-subtle)] rounded-3xl p-4 flex items-center justify-between shadow-glass">
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">Hostel & Room Transfer Requests</h2>
              <p className="text-xs text-[var(--text-secondary)]">Review transfer submissions forwarded from students.</p>
            </div>
            <button
              onClick={fetchTransfers}
              className="px-3 py-1.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] text-xs font-semibold rounded-xl transition-colors"
            >
              Refresh
            </button>
          </div>

          <div className="glass-panel border border-[var(--border-subtle)] rounded-3xl overflow-hidden shadow-glass">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-mono uppercase tracking-wider text-[11px]">
                    <th className="px-4 py-3">Req Number</th>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">From Hostel / Room</th>
                    <th className="px-4 py-3">Target Hostel</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {transfersLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-[var(--text-muted)] font-mono">
                        Loading transfer requests...
                      </td>
                    </tr>
                  ) : transfers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-[var(--text-muted)]">
                        No hostel transfer requests submitted.
                      </td>
                    </tr>
                  ) : (
                    transfers.map((t) => (
                      <tr key={t.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-[#FF6D1F]">{t.requestNumber}</td>
                        <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">{t.student?.fullName}</td>
                        <td className="px-4 py-3 text-[var(--text-secondary)]">{t.fromHostel} (Rm {t.fromRoom || "N/A"})</td>
                        <td className="px-4 py-3 font-semibold text-[#FF6D1F]">{t.toHostel}</td>
                        <td className="px-4 py-3 text-[var(--text-muted)] max-w-xs truncate">{t.reason}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                            {t.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-1.5">
                          {/* Warden recommendation action */}
                          {(isWarden || isAdmin) && t.status === "PENDING_WARDEN" && (
                            <>
                              <button
                                onClick={async () => {
                                  try {
                                    await apiRequest(`/api/hostels/transfers/${t.id}/warden-review`, {
                                      method: "PATCH",
                                      body: JSON.stringify({ action: "APPROVE", remark: "Recommended by Warden." })
                                    });
                                    showToast("Transfer request recommended by Warden.");
                                    fetchTransfers();
                                  } catch (err: any) {
                                    showToast(err.message, "error");
                                  }
                                }}
                                className="px-2.5 py-1 bg-[#FF6D1F] hover:bg-[#FF8238] text-[#141414] text-xs font-bold rounded transition-colors"
                              >
                                Recommend
                              </button>
                              <button
                                onClick={async () => {
                                  const reason = prompt("Enter transfer rejection reason:");
                                  if (!reason) return;
                                  try {
                                    await apiRequest(`/api/hostels/transfers/${t.id}/warden-review`, {
                                      method: "PATCH",
                                      body: JSON.stringify({ action: "REJECT", remark: reason })
                                    });
                                    showToast("Transfer rejected.");
                                    fetchTransfers();
                                  } catch (err: any) {
                                    showToast(err.message, "error");
                                  }
                                }}
                                className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-xs font-bold rounded transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {/* Admin Final Approval */}
                          {isAdmin && t.status === "PENDING_ADMIN" && (
                            <>
                              <button
                                onClick={async () => {
                                  try {
                                    await apiRequest(`/api/hostels/transfers/${t.id}/admin-review`, {
                                      method: "PATCH",
                                      body: JSON.stringify({ action: "APPROVE", remark: "Approved by Admin." })
                                    });
                                    showToast("Transfer granted and student allocated to new hostel.");
                                    fetchTransfers();
                                  } catch (err: any) {
                                    showToast(err.message, "error");
                                  }
                                }}
                                className="px-2.5 py-1 bg-[#FF6D1F] hover:bg-[#FF8238] text-[#141414] text-xs font-bold rounded transition-colors"
                              >
                                Grant Transfer
                              </button>
                              <button
                                onClick={async () => {
                                  const reason = prompt("Enter rejection reason:");
                                  if (!reason) return;
                                  try {
                                    await apiRequest(`/api/hostels/transfers/${t.id}/admin-review`, {
                                      method: "PATCH",
                                      body: JSON.stringify({ action: "REJECT", remark: reason })
                                    });
                                    showToast("Transfer rejected.");
                                    fetchTransfers();
                                  } catch (err: any) {
                                    showToast(err.message, "error");
                                  }
                                }}
                                className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-xs font-bold rounded transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: WARDEN MANAGEMENT (ADMIN ONLY) */}
      {isAdmin && activeTab === "wardens" && (
        <div className="space-y-4">
          <div className="glass-panel border border-[var(--border-subtle)] rounded-3xl p-4 flex items-center justify-between shadow-glass">
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">Warden Management</h2>
              <p className="text-xs text-[var(--text-secondary)]">Create, assign and manage hostel warden accounts.</p>
            </div>
            <button
              onClick={() => {
                setWardenForm({
                  fullName: "",
                  employeeId: `EMP-WRD-${Date.now().toString().slice(-3)}`,
                  email: "",
                  password: "Password@123",
                  phone: "",
                  hostelBlock: "Hostel-A"
                });
                setEditingWardenId(null);
                setShowWardenModal(true);
              }}
              className="px-3.5 py-2 bg-[#FF6D1F] hover:bg-[#FF8238] text-[#141414] text-xs font-bold rounded-xl shadow-sm flex items-center space-x-1.5 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Warden</span>
            </button>
          </div>

          <div className="glass-panel border border-[var(--border-subtle)] rounded-3xl overflow-hidden shadow-glass">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-mono uppercase tracking-wider text-[11px]">
                    <th className="px-4 py-3">Warden Name</th>
                    <th className="px-4 py-3">Employee ID</th>
                    <th className="px-4 py-3">Email & Phone</th>
                    <th className="px-4 py-3">Assigned Hostel</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {wardensLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-[var(--text-muted)] font-mono">
                        Loading wardens...
                      </td>
                    </tr>
                  ) : wardens.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-[var(--text-muted)]">
                        No wardens registered.
                      </td>
                    </tr>
                  ) : (
                    wardens.map((w) => (
                      <tr key={w.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                        <td className="px-4 py-3 font-bold text-[var(--text-primary)]">{w.fullName}</td>
                        <td className="px-4 py-3 font-mono font-medium text-[#FF6D1F]">{w.employeeId || "N/A"}</td>
                        <td className="px-4 py-3">
                          <p className="text-[var(--text-primary)]">{w.email}</p>
                          <p className="text-[var(--text-muted)] font-mono text-[11px]">{w.phone}</p>
                        </td>
                        <td className="px-4 py-3 font-bold text-[#FF6D1F]">{w.hostelBlock || "Unassigned"}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
                              w.isActive ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30" : "bg-red-500/10 text-red-300 border border-red-500/30"
                            }`}
                          >
                            {w.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-1">
                          <button
                            onClick={() => {
                              setWardenForm({
                                fullName: w.fullName,
                                employeeId: w.employeeId || "",
                                email: w.email,
                                password: "",
                                phone: w.phone,
                                hostelBlock: w.hostelBlock || "Hostel-A"
                              });
                              setEditingWardenId(w.id);
                              setShowWardenModal(true);
                            }}
                            className="px-2.5 py-1 bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded text-xs font-medium transition-colors"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: STAFF MANAGEMENT (ADMIN ONLY) */}
      {isAdmin && activeTab === "staff" && (
        <div className="space-y-4">
          <div className="glass-panel border border-[var(--border-subtle)] rounded-3xl p-4 flex items-center justify-between shadow-glass">
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">Staff Management</h2>
              <p className="text-xs text-[var(--text-secondary)]">Assign maintenance responsibilities and manage staff credentials.</p>
            </div>
            <button
              onClick={() => {
                setStaffForm({
                  fullName: "",
                  employeeId: `EMP-STF-${Date.now().toString().slice(-3)}`,
                  email: "",
                  password: "Password@123",
                  phone: "",
                  department: "Plumbing & Maintenance"
                });
                setEditingStaffId(null);
                setShowStaffModal(true);
              }}
              className="px-3.5 py-2 bg-[#FF6D1F] hover:bg-[#FF8238] text-[#141414] text-xs font-bold rounded-xl shadow-sm flex items-center space-x-1.5 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Staff</span>
            </button>
          </div>

          <div className="glass-panel border border-[var(--border-subtle)] rounded-3xl overflow-hidden shadow-glass">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-mono uppercase tracking-wider text-[11px]">
                    <th className="px-4 py-3">Staff Name</th>
                    <th className="px-4 py-3">Employee ID</th>
                    <th className="px-4 py-3">Email & Phone</th>
                    <th className="px-4 py-3">Work Type / Department</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {staffLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-[var(--text-muted)] font-mono">
                        Loading staff list...
                      </td>
                    </tr>
                  ) : staffList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-[var(--text-muted)]">
                        No staff members found.
                      </td>
                    </tr>
                  ) : (
                    staffList.map((s) => (
                      <tr key={s.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                        <td className="px-4 py-3 font-bold text-[var(--text-primary)]">{s.fullName}</td>
                        <td className="px-4 py-3 font-mono font-medium text-[#FF6D1F]">{s.employeeId || "N/A"}</td>
                        <td className="px-4 py-3">
                          <p className="text-[var(--text-primary)]">{s.email}</p>
                          <p className="text-[var(--text-muted)] font-mono text-[11px]">{s.phone}</p>
                        </td>
                        <td className="px-4 py-3 font-semibold text-[var(--text-secondary)]">{s.department || "General Maintenance"}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
                              s.isActive ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30" : "bg-red-500/10 text-red-300 border border-red-500/30"
                            }`}
                          >
                            {s.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-1">
                          <button
                            onClick={() => {
                              setStaffForm({
                                fullName: s.fullName,
                                employeeId: s.employeeId || "",
                                email: s.email,
                                password: "",
                                phone: s.phone,
                                department: s.department || "Plumbing & Maintenance"
                              });
                              setEditingStaffId(s.id);
                              setShowStaffModal(true);
                            }}
                            className="px-2.5 py-1 bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded text-xs font-medium transition-colors"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: SYSTEM AUDIT LOGS (ADMIN ONLY) */}
      {isAdmin && activeTab === "audit" && (
        <div className="space-y-4">
          <div className="glass-panel border border-[var(--border-subtle)] rounded-3xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-glass">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search audit records..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchAuditLogs()}
                  className="pl-8 pr-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl text-xs w-48 sm:w-64 focus:outline-none focus:border-[#FF6D1F]"
                />
              </div>

              <select
                value={auditActionFilter}
                onChange={(e) => {
                  setAuditActionFilter(e.target.value);
                  setTimeout(fetchAuditLogs, 50);
                }}
                className="px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl text-xs focus:outline-none focus:border-[#FF6D1F]"
              >
                <option value="ALL">All Actions</option>
                <option value="STUDENT_REGISTERED">Student Registered</option>
                <option value="WARDEN_APPROVED_STUDENT">Warden Approved</option>
                <option value="WARDEN_REJECTED_STUDENT">Warden Rejected</option>
                <option value="ADMIN_APPROVED_STUDENT">Admin Approved</option>
                <option value="BED_ALLOCATED">Bed Allocated</option>
                <option value="BED_DEALLOCATED">Bed Vacated</option>
                <option value="WARDEN_CREATED">Warden Created</option>
                <option value="STAFF_CREATED">Staff Created</option>
              </select>
            </div>

            <button
              onClick={fetchAuditLogs}
              className="px-3 py-1.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] text-xs font-semibold rounded-xl transition-colors"
            >
              Refresh Logs
            </button>
          </div>

          <div className="glass-panel border border-[var(--border-subtle)] rounded-3xl overflow-hidden shadow-glass">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-mono uppercase tracking-wider text-[11px]">
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Actor / Role</th>
                    <th className="px-4 py-3">Target / Hostel</th>
                    <th className="px-4 py-3">Audit Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {auditLoading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-[var(--text-muted)] font-mono">
                        Loading audit trails...
                      </td>
                    </tr>
                  ) : auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-[var(--text-muted)]">
                        No audit events recorded matching criteria.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                        <td className="px-4 py-3 font-mono text-[11px] text-[var(--text-muted)] whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono font-bold text-[#FF6D1F] bg-[var(--bg-input)] border border-[var(--border-subtle)] px-2 py-0.5 rounded text-[10px]">
                            {log.action.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-[var(--text-primary)]">{log.actor?.fullName || "System"}</p>
                          <span className="text-[10px] text-[var(--text-muted)] uppercase font-mono">{log.actorRole}</span>
                        </td>
                        <td className="px-4 py-3 font-mono">
                          <span className="font-semibold text-[var(--text-secondary)]">{log.targetType}</span>
                          {log.hostelBlock && <p className="text-[10px] text-[#FF6D1F] font-bold">{log.hostelBlock}</p>}
                        </td>
                        <td className="px-4 py-3 text-[var(--text-secondary)] max-w-md leading-relaxed">{log.details}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: REJECTION REASON MODAL */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="glass-panel rounded-3xl border border-[var(--border-subtle)] max-w-md w-full p-6 shadow-elevated space-y-4">
            <h3 className="text-sm font-bold text-red-400">Reject Student Registration</h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Please specify the reason for rejection. This reason will be recorded in the official audit trail and communicated to the student.
            </p>

            <div>
              <label htmlFor="rejectReason" className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Rejection Reason *
              </label>
              <textarea
                id="rejectReason"
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Incomplete parent/guardian address proof attached."
                className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#FF6D1F]"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-3.5 py-1.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-medium rounded-xl border border-[var(--border-subtle)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!rejectReason.trim()}
                onClick={() => {
                  if (rejectingStudentId) {
                    if (rejectActionType === "warden") {
                      handleWardenReview(rejectingStudentId, "REJECT", rejectReason);
                    } else {
                      handleAdminReview(rejectingStudentId, "REJECT", rejectReason);
                    }
                    setRejectModalOpen(false);
                  }
                }}
                className="px-4 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-bold rounded-xl disabled:opacity-50 transition-colors"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: WARDEN CREATE / EDIT */}
      {showWardenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="glass-panel rounded-3xl border border-[var(--border-subtle)] max-w-md w-full p-6 shadow-elevated space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">{editingWardenId ? "Edit Warden" : "Add New Warden"}</h3>
              <button onClick={() => setShowWardenModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWarden} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[var(--text-secondary)] mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={wardenForm.fullName}
                  onChange={(e) => setWardenForm({ ...wardenForm, fullName: e.target.value })}
                  placeholder="Dr. S. K. Mahapatra"
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl focus:outline-none focus:border-[#FF6D1F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">Employee ID *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingWardenId}
                    value={wardenForm.employeeId}
                    onChange={(e) => setWardenForm({ ...wardenForm, employeeId: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl focus:outline-none focus:border-[#FF6D1F] disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">Assigned Hostel *</label>
                  <select
                    value={wardenForm.hostelBlock}
                    onChange={(e) => setWardenForm({ ...wardenForm, hostelBlock: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl focus:outline-none focus:border-[#FF6D1F]"
                  >
                    <option value="Hostel-A">Hostel-A</option>
                    <option value="Hostel-B">Hostel-B</option>
                    <option value="Hostel-C">Hostel-C</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[var(--text-secondary)] mb-1">Official Email *</label>
                <input
                  type="email"
                  required
                  disabled={!!editingWardenId}
                  value={wardenForm.email}
                  onChange={(e) => setWardenForm({ ...wardenForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl focus:outline-none focus:border-[#FF6D1F] disabled:opacity-50"
                />
              </div>

              {!editingWardenId && (
                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">Temporary Password *</label>
                  <input
                    type="password"
                    required
                    value={wardenForm.password}
                    onChange={(e) => setWardenForm({ ...wardenForm, password: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl focus:outline-none focus:border-[#FF6D1F]"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-[var(--text-secondary)] mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={wardenForm.phone}
                  onChange={(e) => setWardenForm({ ...wardenForm, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl focus:outline-none focus:border-[#FF6D1F]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setShowWardenModal(false)}
                  className="px-3.5 py-1.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded font-medium border border-[var(--border-subtle)] transition-colors"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-[#FF6D1F] hover:bg-[#FF8238] text-[#141414] rounded font-bold transition-colors shadow-sm">
                  {editingWardenId ? "Update Warden" : "Create Warden Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: STAFF CREATE / EDIT */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="glass-panel rounded-3xl border border-[var(--border-subtle)] max-w-md w-full p-6 shadow-elevated space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">{editingStaffId ? "Edit Staff" : "Add New Staff"}</h3>
              <button onClick={() => setShowStaffModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[var(--text-secondary)] mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={staffForm.fullName}
                  onChange={(e) => setStaffForm({ ...staffForm, fullName: e.target.value })}
                  placeholder="Manoj Kumar"
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl focus:outline-none focus:border-[#FF6D1F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">Employee ID *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingStaffId}
                    value={staffForm.employeeId}
                    onChange={(e) => setStaffForm({ ...staffForm, employeeId: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl focus:outline-none focus:border-[#FF6D1F] disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">Department / Work Type *</label>
                  <select
                    value={staffForm.department}
                    onChange={(e) => setStaffForm({ ...staffForm, department: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl focus:outline-none focus:border-[#FF6D1F]"
                  >
                    <option value="Plumbing & Maintenance">Plumbing & Maintenance</option>
                    <option value="Electrical Maintenance">Electrical Maintenance</option>
                    <option value="Carpentry">Carpentry</option>
                    <option value="Housekeeping & Sanitation">Housekeeping & Sanitation</option>
                    <option value="Gate Security">Gate Security</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[var(--text-secondary)] mb-1">Email *</label>
                <input
                  type="email"
                  required
                  disabled={!!editingStaffId}
                  value={staffForm.email}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl focus:outline-none focus:border-[#FF6D1F] disabled:opacity-50"
                />
              </div>

              {!editingStaffId && (
                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">Temporary Password *</label>
                  <input
                    type="password"
                    required
                    value={staffForm.password}
                    onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl focus:outline-none focus:border-[#FF6D1F]"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-[var(--text-secondary)] mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={staffForm.phone}
                  onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl focus:outline-none focus:border-[#FF6D1F]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setShowStaffModal(false)}
                  className="px-3.5 py-1.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded font-medium border border-[var(--border-subtle)] transition-colors"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-[#FF6D1F] hover:bg-[#FF8238] text-[#141414] rounded font-bold transition-colors shadow-sm">
                  {editingStaffId ? "Update Staff" : "Create Staff Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ADD ROOM */}
      {showRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="glass-panel rounded-3xl border border-[var(--border-subtle)] max-w-sm w-full p-6 shadow-elevated space-y-3.5">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Add Hostel Room</h3>
            <form onSubmit={handleCreateRoom} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[var(--text-secondary)] mb-1">Hostel Block *</label>
                <select
                  disabled={isWarden}
                  value={roomForm.hostelBlock}
                  onChange={(e) => setRoomForm({ ...roomForm, hostelBlock: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl focus:outline-none focus:border-[#FF6D1F] disabled:opacity-50"
                >
                  <option value="Hostel-A">Hostel-A</option>
                  <option value="Hostel-B">Hostel-B</option>
                  <option value="Hostel-C">Hostel-C</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">Room Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 104"
                    value={roomForm.roomNumber}
                    onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl focus:outline-none focus:border-[#FF6D1F]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">Floor</label>
                  <input
                    type="number"
                    min={0}
                    value={roomForm.floor}
                    onChange={(e) => setRoomForm({ ...roomForm, floor: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl focus:outline-none focus:border-[#FF6D1F]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[var(--text-secondary)] mb-1">Bed Capacity *</label>
                <select
                  value={roomForm.capacity}
                  onChange={(e) => setRoomForm({ ...roomForm, capacity: parseInt(e.target.value, 10) || 2 })}
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl focus:outline-none focus:border-[#FF6D1F]"
                >
                  <option value={1}>1 (Single Bed)</option>
                  <option value={2}>2 (Double Sharing)</option>
                  <option value={3}>3 (Triple Sharing)</option>
                  <option value={4}>4 (Four Bed)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setShowRoomModal(false)}
                  className="px-3.5 py-1.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded font-medium border border-[var(--border-subtle)] transition-colors"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-[#FF6D1F] hover:bg-[#FF8238] text-[#141414] rounded font-bold transition-colors shadow-sm">
                  Create Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: ALLOCATE BED */}
      {showAllocateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="glass-panel rounded-3xl border border-[var(--border-subtle)] max-w-sm w-full p-6 shadow-elevated space-y-3.5">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Allocate {allocateForm.bedNumber} in Rm {allocateForm.roomNumber} ({allocateForm.hostelBlock})
            </h3>

            <form onSubmit={handleAllocateBed} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[var(--text-secondary)] mb-1">Select Student *</label>
                <select
                  required
                  value={allocateForm.studentId}
                  onChange={(e) => setAllocateForm({ ...allocateForm, studentId: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl focus:outline-none focus:border-[#FF6D1F]"
                >
                  <option value="">-- Choose Student --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.rollNumber || "No Roll"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setShowAllocateModal(false)}
                  className="px-3.5 py-1.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded font-medium border border-[var(--border-subtle)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!allocateForm.studentId}
                  className="px-4 py-1.5 bg-[#FF6D1F] hover:bg-[#FF8238] text-[#141414] rounded font-bold disabled:opacity-50 transition-colors shadow-sm"
                >
                  Confirm Bed Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: COMPLETE STUDENT PROFILE MODAL */}
      {selectedStudentForModal && (
        <StudentProfileModal
          studentId={selectedStudentForModal}
          currentUserRole={user?.role}
          onClose={() => setSelectedStudentForModal(null)}
          onUpdate={() => {
            fetchStudents();
            fetchVerifications();
          }}
        />
      )}

      {/* MODAL 7: EMERGENCY RESPONDER NOTE & ACTION MODAL */}
      {activeNoteModalEmergency && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fadeIn">
          <div className="glass-panel rounded-3xl border border-rose-300 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center space-x-2 text-rose-600">
                <Siren className="w-5 h-5" />
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Responder Action — Emergency #{activeNoteModalEmergency.alertNumber || activeNoteModalEmergency.id.slice(0, 8)}
                </h3>
              </div>
              <button
                onClick={() => {
                  setActiveNoteModalEmergency(null);
                  setResponderNoteText("");
                }}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] space-y-1 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Category:</span>
                  <strong className="text-rose-400">{activeNoteModalEmergency.category}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Location:</span>
                  <strong>{activeNoteModalEmergency.location}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Student:</span>
                  <strong>{activeNoteModalEmergency.student?.fullName} ({activeNoteModalEmergency.student?.phone})</strong>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[var(--text-primary)] mb-1">
                  Update Target Status:
                </label>
                <select
                  value={targetStatusForNote}
                  onChange={(e) => setTargetStatusForNote(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] font-bold text-xs"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
                  <option value="RESPONDING">RESPONDING</option>
                  <option value="RESOLVED">RESOLVED</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[var(--text-primary)] mb-1">
                  Responder Note / Action Log (Dispatched to Student):
                </label>
                <textarea
                  rows={3}
                  value={responderNoteText}
                  onChange={(e) => setResponderNoteText(e.target.value)}
                  placeholder="e.g. Chief Warden and campus medical staff reached the room. Treatment underway."
                  className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => {
                    setActiveNoteModalEmergency(null);
                    setResponderNoteText("");
                  }}
                  className="px-3.5 py-1.5 bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-xl font-medium border border-[var(--border-subtle)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateEmergencyStatus(activeNoteModalEmergency.id, targetStatusForNote, responderNoteText)}
                  disabled={emergencyActionLoading}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all shadow-sm"
                >
                  {emergencyActionLoading ? "Updating..." : "Commit Status & Notify"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 8: ADD / EDIT COURSE PROGRAM */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="glass-panel rounded-3xl border border-[var(--border-subtle)] max-w-md w-full p-6 shadow-elevated space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                {editingCourse ? "Edit Degree / Course Program" : "Add New Academic Program"}
              </h3>
              <button
                onClick={() => {
                  setShowCourseModal(false);
                  setEditingCourse(null);
                }}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">Course Code *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingCourse}
                    placeholder="e.g. B.Tech, MCA, MBA"
                    value={courseForm.code}
                    onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-mono font-bold rounded-xl focus:outline-none focus:border-[#FF6D1F] disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">Duration (Years) *</label>
                  <select
                    value={courseForm.durationYears}
                    onChange={(e) => setCourseForm({ ...courseForm, durationYears: parseInt(e.target.value, 10) || 4 })}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl focus:outline-none focus:border-[#FF6D1F]"
                  >
                    <option value={1}>1 Year (2 Semesters)</option>
                    <option value={2}>2 Years (4 Semesters)</option>
                    <option value={3}>3 Years (6 Semesters)</option>
                    <option value={4}>4 Years (8 Semesters)</option>
                    <option value={5}>5 Years (10 Semesters)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[var(--text-secondary)] mb-1">Full Program Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bachelor of Technology"
                  value={courseForm.name}
                  onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl focus:outline-none focus:border-[#FF6D1F]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[var(--text-secondary)] mb-1">Academic Calendar Type</label>
                <select
                  value={courseForm.type}
                  onChange={(e) => setCourseForm({ ...courseForm, type: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl focus:outline-none focus:border-[#FF6D1F]"
                >
                  <option value="SEMESTER">Semester Based</option>
                  <option value="ANNUAL">Annual Based</option>
                  <option value="TRIMESTER">Trimester Based</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => {
                    setShowCourseModal(false);
                    setEditingCourse(null);
                  }}
                  className="px-3.5 py-1.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded font-medium border border-[var(--border-subtle)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={courseActionLoading}
                  className="px-4 py-1.5 bg-[#FF6D1F] hover:bg-[#FF8238] text-[#141414] rounded font-bold transition-colors shadow-sm disabled:opacity-50"
                >
                  {courseActionLoading ? "Saving..." : editingCourse ? "Update Program" : "Create Program"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 9: ADD / EDIT BRANCH */}
      {showBranchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="glass-panel rounded-3xl border border-[var(--border-subtle)] max-w-md w-full p-6 shadow-elevated space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                {editingBranch ? "Edit Branch" : `Add Branch to ${selectedCourseForBranch ? selectedCourseForBranch.code : "Course"}`}
              </h3>
              <button
                onClick={() => {
                  setShowBranchModal(false);
                  setEditingBranch(null);
                  setSelectedCourseForBranch(null);
                }}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBranch} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[var(--text-secondary)] mb-1">Parent Degree Program *</label>
                <select
                  required
                  disabled={!!editingBranch || !!selectedCourseForBranch}
                  value={branchForm.courseId}
                  onChange={(e) => setBranchForm({ ...branchForm, courseId: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl focus:outline-none focus:border-[#FF6D1F] disabled:opacity-60"
                >
                  <option value="">-- Choose Degree Program --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[var(--text-secondary)] mb-1">Branch / Specialization Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CSE, ECE, MCA, Data Science"
                  value={branchForm.code}
                  onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-mono font-bold rounded-xl focus:outline-none focus:border-[#FF6D1F]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[var(--text-secondary)] mb-1">Full Branch Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Science & Engineering"
                  value={branchForm.name}
                  onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl focus:outline-none focus:border-[#FF6D1F]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => {
                    setShowBranchModal(false);
                    setEditingBranch(null);
                    setSelectedCourseForBranch(null);
                  }}
                  className="px-3.5 py-1.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded font-medium border border-[var(--border-subtle)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={courseActionLoading || !branchForm.courseId}
                  className="px-4 py-1.5 bg-[#FF6D1F] hover:bg-[#FF8238] text-[#141414] rounded font-bold transition-colors shadow-sm disabled:opacity-50"
                >
                  {courseActionLoading ? "Saving..." : editingBranch ? "Update Branch" : "Add Branch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
