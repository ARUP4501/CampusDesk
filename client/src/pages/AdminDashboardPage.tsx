import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  BarChart2,
  Clock,
  AlertTriangle,
  Download,
  Users,
  CheckCircle2,
  Filter,
  FileSpreadsheet,
  Building,
  UserPlus,
  Edit2,
  UserCheck,
  ShieldCheck,
  Megaphone,
  Utensils,
  QrCode,
  Wrench,
  X,
  Save,
  Search,
  Check,
  Eye,
  ArrowRightLeft,
  ScrollText,
  BedDouble,
  DoorOpen,
  UserX
} from "lucide-react";
import { apiRequest, UserProfile } from "../api/client.js";
import { SampleDataBanner } from "../components/SampleDataBanner.js";
import { StudentProfileModal } from "../components/StudentProfileModal.js";

interface AdminDashboardPageProps {
  user: UserProfile | null;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ user }) => {
  const isAdmin = user?.role === "ADMIN";
  const isWarden = user?.role === "WARDEN";

  const [activeTab, setActiveTab] = useState<
    "overview" | "verifications" | "wardens" | "staff" | "students" | "hostels" | "transfers" | "audit"
  >("overview");

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
  const [selectedHostelForBed, setSelectedHostelForBed] = useState<string>("Hostel-A");
  const [showRoomModal, setShowRoomModal] = useState<boolean>(false);
  const [roomForm, setRoomForm] = useState({
    hostelBlock: isWarden ? (user?.hostelBlock || "Hostel-A") : "Hostel-A",
    roomNumber: "",
    floor: 1,
    capacity: 2
  });
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

  // Initial Fetch on mount or tab change
  useEffect(() => {
    fetchStats();
  }, [hostelFilter]);

  useEffect(() => {
    if (activeTab === "verifications") fetchVerifications();
    if (activeTab === "students") fetchStudents();
    if (activeTab === "wardens" && isAdmin) fetchWardens();
    if (activeTab === "staff" && isAdmin) fetchStaff();
    if (activeTab === "hostels") fetchHostels();
    if (activeTab === "transfers") fetchTransfers();
    if (activeTab === "audit" && isAdmin) fetchAuditLogs();
  }, [activeTab]);

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

  // Warden Verification Review
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

  // Admin Final Approval
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

  // Warden Create / Update Handler
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

  // Staff Create / Update Handler
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

  // Add Room Handler
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

  // Allocate Bed Handler
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

  // Deallocate Bed Handler
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

  // Toggle Student Status Handler
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

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notificationMsg && (
        <div
          role="status"
          className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-[4px] shadow-lg text-xs font-semibold text-white transition-all ${
            notificationMsg.type === "success" ? "bg-[#0f4c3a]" : "bg-red-700"
          }`}
        >
          {notificationMsg.text}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border border-stone-300 rounded-[6px] p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span
              className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded ${
                isAdmin ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
              }`}
            >
              {isAdmin ? "Central Admin Portal" : `Warden Portal (${user?.hostelBlock || "Assigned Hostel"})`}
            </span>
          </div>
          <h1 className="text-xl font-bold text-stone-900 mt-1">
            {isAdmin ? "Campus Administration & Hostel Control" : `Hostel Management - ${user?.hostelBlock || "My Hostel"}`}
          </h1>
          <p className="text-xs text-stone-600">
            {isAdmin
              ? "Oversee campus-wide student registration, 2-step verification, hostels, wardens, staff, and system audit logs."
              : "Verify student admissions, manage hostel residents, assign rooms & beds, and inspect transfer requests."}
          </p>
        </div>

        {/* Global Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
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
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#0f4c3a] hover:bg-[#1a6650] text-white text-xs font-bold rounded-[4px] shadow-sm transition-colors"
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
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold rounded-[4px] shadow-sm transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Staff</span>
              </button>
            </>
          )}

          <a
            href="/api/admin/export/tickets"
            download
            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-medium rounded-[4px] shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Role-Based Tab Navigation */}
      <div className="border-b border-stone-300 bg-white rounded-[6px] px-4 flex overflow-x-auto space-x-2">
        <button
          onClick={() => setActiveTab("overview")}
          className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
            activeTab === "overview" ? "border-[#0f4c3a] text-[#0f4c3a]" : "border-transparent text-stone-600 hover:text-stone-900"
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>Dashboard Overview</span>
        </button>

        <button
          onClick={() => setActiveTab("verifications")}
          className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
            activeTab === "verifications" ? "border-[#0f4c3a] text-[#0f4c3a]" : "border-transparent text-stone-600 hover:text-stone-900"
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Student Verifications</span>
          {statsData?.pending?.verifications > 0 && (
            <span className="px-1.5 py-0.2 text-[10px] bg-amber-500 text-white rounded-full font-bold">
              {statsData.pending.verifications}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("students")}
          className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
            activeTab === "students" ? "border-[#0f4c3a] text-[#0f4c3a]" : "border-transparent text-stone-600 hover:text-stone-900"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>{isAdmin ? "Student Management" : "My Hostel Residents"}</span>
        </button>

        <button
          onClick={() => setActiveTab("hostels")}
          className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
            activeTab === "hostels" ? "border-[#0f4c3a] text-[#0f4c3a]" : "border-transparent text-stone-600 hover:text-stone-900"
          }`}
        >
          <BedDouble className="w-3.5 h-3.5" />
          <span>Rooms & Beds</span>
        </button>

        <button
          onClick={() => setActiveTab("transfers")}
          className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
            activeTab === "transfers" ? "border-[#0f4c3a] text-[#0f4c3a]" : "border-transparent text-stone-600 hover:text-stone-900"
          }`}
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span>Hostel Transfers</span>
        </button>

        {isAdmin && (
          <>
            <button
              onClick={() => setActiveTab("wardens")}
              className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
                activeTab === "wardens" ? "border-[#0f4c3a] text-[#0f4c3a]" : "border-transparent text-stone-600 hover:text-stone-900"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Warden Management</span>
            </button>

            <button
              onClick={() => setActiveTab("staff")}
              className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
                activeTab === "staff" ? "border-[#0f4c3a] text-[#0f4c3a]" : "border-transparent text-stone-600 hover:text-stone-900"
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Staff Management</span>
            </button>

            <button
              onClick={() => setActiveTab("audit")}
              className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
                activeTab === "audit" ? "border-[#0f4c3a] text-[#0f4c3a]" : "border-transparent text-stone-600 hover:text-stone-900"
              }`}
            >
              <ScrollText className="w-3.5 h-3.5" />
              <span>System Audit Logs</span>
            </button>
          </>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DASHBOARD OVERVIEW */}
      {/* ========================================================================= */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white border border-stone-200 rounded-[6px] p-4">
              <span className="text-[10px] font-bold text-stone-500 uppercase">Total Students</span>
              <p className="text-xl font-bold text-stone-900 mt-1">{statsData?.stats?.totalStudents || 0}</p>
              <span className="text-[10px] text-emerald-700 font-semibold">{statsData?.stats?.activeStudents || 0} Active</span>
            </div>

            <div className="bg-white border border-amber-200 bg-amber-50/30 rounded-[6px] p-4">
              <span className="text-[10px] font-bold text-amber-800 uppercase">Pending Verification</span>
              <p className="text-xl font-bold text-amber-900 mt-1">
                {isWarden ? statsData?.stats?.pendingWardenVerifications || 0 : statsData?.stats?.pendingAdminApprovals || 0}
              </p>
              <span className="text-[10px] text-amber-700 font-medium">Awaiting Review</span>
            </div>

            <div className="bg-white border border-stone-200 rounded-[6px] p-4">
              <span className="text-[10px] font-bold text-stone-500 uppercase">Total Beds</span>
              <p className="text-xl font-bold text-stone-900 mt-1">{statsData?.stats?.totalBeds || 0}</p>
              <span className="text-[10px] text-stone-600">{statsData?.stats?.availableBeds || 0} Available</span>
            </div>

            <div className="bg-white border border-stone-200 rounded-[6px] p-4">
              <span className="text-[10px] font-bold text-stone-500 uppercase">Bed Occupancy</span>
              <p className="text-xl font-bold text-emerald-800 mt-1">{statsData?.stats?.occupancyRate || 0}%</p>
              <span className="text-[10px] text-stone-600">{statsData?.stats?.occupiedBeds || 0} Occupied</span>
            </div>

            <div className="bg-white border border-stone-200 rounded-[6px] p-4">
              <span className="text-[10px] font-bold text-stone-500 uppercase">{isAdmin ? "Total Wardens" : "Hostel Block"}</span>
              <p className="text-xl font-bold text-stone-900 mt-1">
                {isAdmin ? statsData?.stats?.totalWardens || 0 : user?.hostelBlock || "Hostel-A"}
              </p>
              <span className="text-[10px] text-stone-600">{isAdmin ? "Administered" : "Assigned"}</span>
            </div>

            <div className="bg-white border border-stone-200 rounded-[6px] p-4">
              <span className="text-[10px] font-bold text-stone-500 uppercase">Pending Requests</span>
              <p className="text-xl font-bold text-stone-900 mt-1">{statsData?.pending?.total || 0}</p>
              <span className="text-[10px] text-stone-600">Complaints & Passes</span>
            </div>
          </div>

          {/* Pending Action Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Recent Audit Activity */}
            <div className="bg-white border border-stone-300 rounded-[6px] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-[#0f4c3a]" />
                  <span>Recent Hostel & System Activity</span>
                </h3>
                {isAdmin && (
                  <button onClick={() => setActiveTab("audit")} className="text-xs font-semibold text-[#0f4c3a] hover:underline">
                    View All Logs →
                  </button>
                )}
              </div>

              <div className="space-y-2.5">
                {statsData?.recentLogs && statsData.recentLogs.length > 0 ? (
                  statsData.recentLogs.map((log: any) => (
                    <div key={log.id} className="p-2.5 bg-stone-50 border border-stone-200 rounded-[4px] text-xs">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-bold text-stone-800">{log.action.replace(/_/g, " ")}</span>
                        <span className="text-[10px] text-stone-500">{new Date(log.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-stone-600">{log.details}</p>
                      <span className="text-[10px] text-stone-400 mt-0.5 block">By: {log.actor?.fullName} ({log.actor?.role})</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-stone-500 py-4 text-center">No recent activity logs recorded.</p>
                )}
              </div>
            </div>

            {/* Staff Workload */}
            <div className="bg-white border border-stone-300 rounded-[6px] p-5">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-4 flex items-center space-x-1.5">
                <Wrench className="w-4 h-4 text-[#0f4c3a]" />
                <span>Maintenance Staff Status</span>
              </h3>

              <div className="space-y-3">
                {statsData?.staffWorkload && statsData.staffWorkload.length > 0 ? (
                  statsData.staffWorkload.map((staff: any) => (
                    <div key={staff.id} className="p-3 bg-stone-50 border border-stone-200 rounded-[4px] text-xs flex items-center justify-between">
                      <div>
                        <p className="font-bold text-stone-900">{staff.name}</p>
                        <p className="text-[11px] text-stone-500">{staff.department}</p>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded">
                          {staff.resolved} Resolved
                        </span>
                        <p className="text-[10px] text-stone-500 mt-0.5">{staff.pending} In Progress</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-stone-500 py-4 text-center">No staff workload data available.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: 2-STEP STUDENT VERIFICATION QUEUE */}
      {/* ========================================================================= */}
      {activeTab === "verifications" && (
        <div className="space-y-4">
          <div className="bg-white border border-stone-300 rounded-[6px] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search student or roll..."
                  value={verificationSearch}
                  onChange={(e) => setVerificationSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchVerifications()}
                  className="pl-8 pr-3 py-1.5 border border-stone-300 rounded-[4px] text-xs w-48 sm:w-64 focus:outline-none"
                />
              </div>

              <select
                value={verificationStatusFilter}
                onChange={(e) => {
                  setVerificationStatusFilter(e.target.value);
                  setTimeout(fetchVerifications, 50);
                }}
                className="px-3 py-1.5 border border-stone-300 rounded-[4px] text-xs bg-white focus:outline-none"
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
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-[4px]"
            >
              Refresh Queue
            </button>
          </div>

          {/* Verifications Table */}
          <div className="bg-white border border-stone-300 rounded-[6px] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-300 text-stone-700 font-bold uppercase tracking-wider text-[11px]">
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Roll / Course</th>
                    <th className="px-4 py-3">Requested Hostel</th>
                    <th className="px-4 py-3">Parent / Guardian Contact</th>
                    <th className="px-4 py-3">Verification Stage</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {verificationsLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-stone-500">
                        Loading verification queue...
                      </td>
                    </tr>
                  ) : verifications.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-stone-500">
                        No pending student verifications found.
                      </td>
                    </tr>
                  ) : (
                    verifications.map((v) => (
                      <tr key={v.id} className="hover:bg-stone-50/80">
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setSelectedStudentForModal(v.id)}
                            className="font-bold text-stone-900 hover:text-[#0f4c3a] hover:underline text-left block"
                          >
                            {v.fullName}
                          </button>
                          <span className="text-[11px] text-stone-500">{v.email}</span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-stone-800">{v.rollNumber || "Pending Roll"}</p>
                          <p className="text-[11px] text-stone-500">{v.course} - {v.department}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-stone-800">{v.requestedHostel}</span>
                          <p className="text-[11px] text-stone-500">{v.roomPreference || "Standard"}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-stone-800 font-medium">Father: {v.fatherPhone || "N/A"}</p>
                          <p className="text-[11px] text-stone-500">Guardian: {v.guardianPhone || "N/A"}</p>
                        </td>
                        <td className="px-4 py-3">
                          {v.verificationStatus === "PENDING_WARDEN_VERIFICATION" && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 rounded">
                              Pending Warden Review
                            </span>
                          )}
                          {v.verificationStatus === "PENDING_ADMIN_APPROVAL" && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300 rounded">
                              Pending Admin Final Approval
                            </span>
                          )}
                          {v.verificationStatus === "REJECTED_BY_WARDEN" && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-900 border border-red-300 rounded">
                              Rejected by Warden
                            </span>
                          )}
                          {v.verificationStatus === "REJECTED_BY_ADMIN" && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-900 border border-red-300 rounded">
                              Rejected by Admin
                            </span>
                          )}
                          {v.verificationStatus === "ACTIVE" && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 rounded">
                              Active Student
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right space-x-1">
                          <button
                            onClick={() => setSelectedStudentForModal(v.id)}
                            className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded font-medium text-xs inline-flex items-center space-x-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View</span>
                          </button>

                          {/* Warden Action */}
                          {(isWarden || isAdmin) && v.verificationStatus === "PENDING_WARDEN_VERIFICATION" && (
                            <>
                              <button
                                onClick={() => handleWardenReview(v.id, "APPROVE")}
                                className="px-2.5 py-1 bg-[#0f4c3a] hover:bg-[#1a6650] text-white rounded font-bold text-xs"
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
                                className="px-2.5 py-1 bg-red-700 hover:bg-red-800 text-white rounded font-bold text-xs"
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
                                className="px-2.5 py-1 bg-[#0f4c3a] hover:bg-[#1a6650] text-white rounded font-bold text-xs"
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
                                className="px-2.5 py-1 bg-red-700 hover:bg-red-800 text-white rounded font-bold text-xs"
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

      {/* ========================================================================= */}
      {/* TAB 3: STUDENT MANAGEMENT & RESIDENTS */}
      {/* ========================================================================= */}
      {activeTab === "students" && (
        <div className="space-y-4">
          <div className="bg-white border border-stone-300 rounded-[6px] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search name, roll, room..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchStudents()}
                  className="pl-8 pr-3 py-1.5 border border-stone-300 rounded-[4px] text-xs w-48 sm:w-64 focus:outline-none"
                />
              </div>

              {isAdmin && (
                <select
                  value={studentHostelFilter}
                  onChange={(e) => {
                    setStudentHostelFilter(e.target.value);
                    setTimeout(fetchStudents, 50);
                  }}
                  className="px-3 py-1.5 border border-stone-300 rounded-[4px] text-xs bg-white focus:outline-none"
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
                className="px-3 py-1.5 border border-stone-300 rounded-[4px] text-xs bg-white focus:outline-none"
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
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-[4px]"
            >
              Refresh
            </button>
          </div>

          {/* Student Directory Table */}
          <div className="bg-white border border-stone-300 rounded-[6px] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-300 text-stone-700 font-bold uppercase tracking-wider text-[11px]">
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Roll Number</th>
                    <th className="px-4 py-3">Hostel / Room / Bed</th>
                    <th className="px-4 py-3">Course & Year</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {studentsLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-stone-500">
                        Loading student records...
                      </td>
                    </tr>
                  ) : students.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-stone-500">
                        No students found matching filters.
                      </td>
                    </tr>
                  ) : (
                    students.map((s) => (
                      <tr key={s.id} className="hover:bg-stone-50/80">
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setSelectedStudentForModal(s.id)}
                            className="font-bold text-stone-900 hover:text-[#0f4c3a] hover:underline block text-left"
                          >
                            {s.fullName}
                          </button>
                          <span className="text-[11px] text-stone-500">{s.email}</span>
                        </td>
                        <td className="px-4 py-3 font-mono font-medium text-stone-800">
                          {s.rollNumber || "N/A"}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-stone-800">
                            {s.hostelBlock || s.requestedHostel || "Unassigned"}
                          </p>
                          <p className="text-[11px] text-stone-500">
                            Rm {s.roomNumber || "N/A"} - {s.bedNumber || "N/A"}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-stone-800">
                          {s.course} ({s.branch || s.department}) - Yr {s.year || 1}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                              s.verificationStatus === "ACTIVE"
                                ? "bg-emerald-100 text-emerald-800"
                                : s.verificationStatus.includes("PENDING")
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {s.verificationStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-1">
                          <button
                            onClick={() => setSelectedStudentForModal(s.id)}
                            className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded text-xs font-medium inline-flex items-center space-x-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Profile</span>
                          </button>

                          {isAdmin && (
                            <button
                              onClick={() => handleToggleStudentStatus(s.id)}
                              className={`px-2 py-1 rounded text-xs font-semibold ${
                                s.isActive ? "bg-red-50 text-red-700 hover:bg-red-100" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
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

      {/* ========================================================================= */}
      {/* TAB 4: ROOM & BED MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === "hostels" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-stone-900">Hostel Room & Bed Allocation Matrix</h2>
              <p className="text-xs text-stone-600">Inspect room occupancy, manage capacities, and assign student beds.</p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowRoomModal(true)}
                className="px-3 py-1.5 bg-[#0f4c3a] hover:bg-[#1a6650] text-white text-xs font-bold rounded-[4px] shadow-sm flex items-center space-x-1"
              >
                <DoorOpen className="w-3.5 h-3.5" />
                <span>Add Room</span>
              </button>
            </div>
          </div>

          {/* Hostels List & Bed Status Grid */}
          <div className="space-y-6">
            {hostelsLoading ? (
              <div className="bg-white border border-stone-300 rounded-[6px] p-8 text-center text-xs text-stone-500">
                Loading hostel room breakdown...
              </div>
            ) : (
              hostels
                .filter((h) => (isWarden ? h.name === user?.hostelBlock : true))
                .map((hostel) => (
                  <div key={hostel.id} className="bg-white border border-stone-300 rounded-[6px] p-5 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-stone-200 pb-3 gap-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-base font-bold text-stone-900">{hostel.name}</h3>
                          <span className="px-2 py-0.2 text-[10px] font-bold bg-stone-100 text-stone-700 rounded border border-stone-300">
                            {hostel.type}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500">{hostel.description || "Campus Student Residence"}</p>
                      </div>

                      <div className="flex items-center space-x-4 text-xs font-medium">
                        <span>Total Rooms: <strong className="text-stone-900">{hostel.totalRooms}</strong></span>
                        <span>Occupied: <strong className="text-emerald-800">{hostel.occupiedBeds}</strong> / {hostel.totalBeds} Beds</span>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-bold">
                          {hostel.occupancyRate}% Full
                        </span>
                      </div>
                    </div>

                    {/* Room Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {hostel.rooms && hostel.rooms.length > 0 ? (
                        hostel.rooms.map((room: any) => (
                          <div key={room.id} className="border border-stone-200 rounded-[4px] p-3 bg-stone-50">
                            <div className="flex items-center justify-between border-b border-stone-200 pb-1.5 mb-2">
                              <span className="font-bold text-xs text-stone-900">Room {room.roomNumber}</span>
                              <span className="text-[10px] text-stone-500">Floor {room.floor} (Cap: {room.capacity})</span>
                            </div>

                            <div className="space-y-1.5">
                              {room.beds?.map((bed: any) => (
                                <div
                                  key={bed.id}
                                  className="flex items-center justify-between p-1.5 bg-white border border-stone-200 rounded text-xs"
                                >
                                  <div className="flex items-center space-x-2">
                                    <BedDouble className="w-3.5 h-3.5 text-stone-400" />
                                    <span className="font-medium text-stone-800">{bed.bedNumber}</span>
                                  </div>

                                  <div className="flex items-center space-x-2">
                                    {bed.status === "OCCUPIED" && bed.student ? (
                                      <div className="flex items-center space-x-1.5">
                                        <button
                                          onClick={() => setSelectedStudentForModal(bed.student.id)}
                                          className="text-[11px] font-bold text-emerald-800 hover:underline truncate max-w-[110px]"
                                        >
                                          {bed.student.fullName}
                                        </button>
                                        <button
                                          onClick={() => handleDeallocateBed(bed.id)}
                                          title="Vacate Bed"
                                          className="text-stone-400 hover:text-red-700 p-0.5"
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
                                        className="px-2 py-0.5 text-[10px] font-bold bg-[#0f4c3a] text-white rounded hover:bg-[#1a6650]"
                                      >
                                        Assign
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-stone-500 col-span-3 text-center py-4">
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

      {/* ========================================================================= */}
      {/* TAB 5: HOSTEL TRANSFERS */}
      {/* ========================================================================= */}
      {activeTab === "transfers" && (
        <div className="space-y-4">
          <div className="bg-white border border-stone-300 rounded-[6px] p-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-stone-900">Hostel & Room Transfer Requests</h2>
              <p className="text-xs text-stone-600">Review transfer submissions forwarded from students.</p>
            </div>
            <button
              onClick={fetchTransfers}
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-[4px]"
            >
              Refresh
            </button>
          </div>

          <div className="bg-white border border-stone-300 rounded-[6px] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-300 text-stone-700 font-bold uppercase tracking-wider text-[11px]">
                    <th className="px-4 py-3">Req Number</th>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">From Hostel / Room</th>
                    <th className="px-4 py-3">Target Hostel</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {transfersLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-stone-500">
                        Loading transfer requests...
                      </td>
                    </tr>
                  ) : transfers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-stone-500">
                        No hostel transfer requests submitted.
                      </td>
                    </tr>
                  ) : (
                    transfers.map((t) => (
                      <tr key={t.id} className="hover:bg-stone-50/80">
                        <td className="px-4 py-3 font-mono font-bold text-stone-800">{t.requestNumber}</td>
                        <td className="px-4 py-3 font-semibold text-stone-900">{t.student?.fullName}</td>
                        <td className="px-4 py-3">{t.fromHostel} (Rm {t.fromRoom || "N/A"})</td>
                        <td className="px-4 py-3 font-semibold text-[#0f4c3a]">{t.toHostel}</td>
                        <td className="px-4 py-3 text-stone-600 max-w-xs truncate">{t.reason}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-stone-100 text-stone-800 border border-stone-200">
                            {t.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-1">
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
                                className="px-2 py-0.5 bg-[#0f4c3a] hover:bg-[#1a6650] text-white text-xs font-bold rounded"
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
                                className="px-2 py-0.5 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded"
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
                                className="px-2 py-0.5 bg-[#0f4c3a] hover:bg-[#1a6650] text-white text-xs font-bold rounded"
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
                                className="px-2 py-0.5 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded"
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

      {/* ========================================================================= */}
      {/* TAB 6: WARDEN MANAGEMENT (ADMIN ONLY) */}
      {/* ========================================================================= */}
      {isAdmin && activeTab === "wardens" && (
        <div className="space-y-4">
          <div className="bg-white border border-stone-300 rounded-[6px] p-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-stone-900">Warden Management</h2>
              <p className="text-xs text-stone-600">Create, assign and manage hostel warden accounts.</p>
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
              className="px-3 py-1.5 bg-[#0f4c3a] hover:bg-[#1a6650] text-white text-xs font-bold rounded-[4px] shadow-sm flex items-center space-x-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Warden</span>
            </button>
          </div>

          <div className="bg-white border border-stone-300 rounded-[6px] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-300 text-stone-700 font-bold uppercase tracking-wider text-[11px]">
                    <th className="px-4 py-3">Warden Name</th>
                    <th className="px-4 py-3">Employee ID</th>
                    <th className="px-4 py-3">Email & Phone</th>
                    <th className="px-4 py-3">Assigned Hostel</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {wardensLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-stone-500">
                        Loading wardens...
                      </td>
                    </tr>
                  ) : wardens.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-stone-500">
                        No wardens registered.
                      </td>
                    </tr>
                  ) : (
                    wardens.map((w) => (
                      <tr key={w.id} className="hover:bg-stone-50/80">
                        <td className="px-4 py-3 font-bold text-stone-900">{w.fullName}</td>
                        <td className="px-4 py-3 font-mono font-medium">{w.employeeId || "N/A"}</td>
                        <td className="px-4 py-3">
                          <p>{w.email}</p>
                          <p className="text-stone-500 text-[11px]">{w.phone}</p>
                        </td>
                        <td className="px-4 py-3 font-bold text-[#0f4c3a]">{w.hostelBlock || "Unassigned"}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                              w.isActive ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
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
                            className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded text-xs font-medium"
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

      {/* ========================================================================= */}
      {/* TAB 7: STAFF MANAGEMENT (ADMIN ONLY) */}
      {/* ========================================================================= */}
      {isAdmin && activeTab === "staff" && (
        <div className="space-y-4">
          <div className="bg-white border border-stone-300 rounded-[6px] p-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-stone-900">Staff Management</h2>
              <p className="text-xs text-stone-600">Assign maintenance responsibilities and create staff credentials.</p>
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
              className="px-3 py-1.5 bg-[#0f4c3a] hover:bg-[#1a6650] text-white text-xs font-bold rounded-[4px] shadow-sm flex items-center space-x-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Staff</span>
            </button>
          </div>

          <div className="bg-white border border-stone-300 rounded-[6px] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-300 text-stone-700 font-bold uppercase tracking-wider text-[11px]">
                    <th className="px-4 py-3">Staff Name</th>
                    <th className="px-4 py-3">Employee ID</th>
                    <th className="px-4 py-3">Email & Phone</th>
                    <th className="px-4 py-3">Work Type / Department</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {staffLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-stone-500">
                        Loading staff list...
                      </td>
                    </tr>
                  ) : staffList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-stone-500">
                        No staff members found.
                      </td>
                    </tr>
                  ) : (
                    staffList.map((s) => (
                      <tr key={s.id} className="hover:bg-stone-50/80">
                        <td className="px-4 py-3 font-bold text-stone-900">{s.fullName}</td>
                        <td className="px-4 py-3 font-mono font-medium">{s.employeeId || "N/A"}</td>
                        <td className="px-4 py-3">
                          <p>{s.email}</p>
                          <p className="text-stone-500 text-[11px]">{s.phone}</p>
                        </td>
                        <td className="px-4 py-3 font-semibold text-stone-800">{s.department || "General Maintenance"}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                              s.isActive ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
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
                            className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded text-xs font-medium"
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

      {/* ========================================================================= */}
      {/* TAB 8: SYSTEM AUDIT LOGS (ADMIN ONLY) */}
      {/* ========================================================================= */}
      {isAdmin && activeTab === "audit" && (
        <div className="space-y-4">
          <div className="bg-white border border-stone-300 rounded-[6px] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search audit records..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchAuditLogs()}
                  className="pl-8 pr-3 py-1.5 border border-stone-300 rounded-[4px] text-xs w-48 sm:w-64 focus:outline-none"
                />
              </div>

              <select
                value={auditActionFilter}
                onChange={(e) => {
                  setAuditActionFilter(e.target.value);
                  setTimeout(fetchAuditLogs, 50);
                }}
                className="px-3 py-1.5 border border-stone-300 rounded-[4px] text-xs bg-white focus:outline-none"
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
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-[4px]"
            >
              Refresh Logs
            </button>
          </div>

          <div className="bg-white border border-stone-300 rounded-[6px] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-300 text-stone-700 font-bold uppercase tracking-wider text-[11px]">
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Actor / Role</th>
                    <th className="px-4 py-3">Target / Hostel</th>
                    <th className="px-4 py-3">Audit Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {auditLoading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-stone-500">
                        Loading audit trails...
                      </td>
                    </tr>
                  ) : auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-stone-500">
                        No audit events recorded matching criteria.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-stone-50/80">
                        <td className="px-4 py-3 font-mono text-[11px] text-stone-500 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded">
                            {log.action.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-stone-900">{log.actor?.fullName || "System"}</p>
                          <span className="text-[10px] text-stone-500 uppercase">{log.actorRole}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-stone-800">{log.targetType}</span>
                          {log.hostelBlock && <p className="text-[10px] text-[#0f4c3a] font-bold">{log.hostelBlock}</p>}
                        </td>
                        <td className="px-4 py-3 text-stone-700 max-w-md">{log.details}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: REJECTION REASON MODAL */}
      {/* ========================================================================= */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[6px] border border-stone-300 max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-red-700">Reject Student Registration</h3>
            <p className="text-xs text-stone-600">
              Please specify the reason for rejection. This reason will be recorded in the official audit trail and communicated to the student.
            </p>

            <div>
              <label htmlFor="rejectReason" className="block text-xs font-semibold text-stone-800 mb-1">
                Rejection Reason *
              </label>
              <textarea
                id="rejectReason"
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Incomplete parent/guardian address proof attached."
                className="w-full px-3 py-2 border border-stone-300 rounded-[4px] text-xs focus:outline-none"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium rounded-[4px]"
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
                className="px-4 py-1.5 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded-[4px] disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: WARDEN CREATE / EDIT (ADMIN ONLY) */}
      {/* ========================================================================= */}
      {showWardenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[6px] border border-stone-300 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <h3 className="text-sm font-bold text-stone-900">{editingWardenId ? "Edit Warden" : "Add New Warden"}</h3>
              <button onClick={() => setShowWardenModal(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWarden} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-800 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={wardenForm.fullName}
                  onChange={(e) => setWardenForm({ ...wardenForm, fullName: e.target.value })}
                  placeholder="Dr. S. K. Mahapatra"
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-[4px] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Employee ID *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingWardenId}
                    value={wardenForm.employeeId}
                    onChange={(e) => setWardenForm({ ...wardenForm, employeeId: e.target.value })}
                    className="w-full px-3 py-1.5 border border-stone-300 rounded-[4px] focus:outline-none disabled:bg-stone-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Assigned Hostel *</label>
                  <select
                    value={wardenForm.hostelBlock}
                    onChange={(e) => setWardenForm({ ...wardenForm, hostelBlock: e.target.value })}
                    className="w-full px-3 py-1.5 border border-stone-300 rounded-[4px] bg-white focus:outline-none"
                  >
                    <option value="Hostel-A">Hostel-A</option>
                    <option value="Hostel-B">Hostel-B</option>
                    <option value="Hostel-C">Hostel-C</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-800 mb-1">Official Email *</label>
                <input
                  type="email"
                  required
                  disabled={!!editingWardenId}
                  value={wardenForm.email}
                  onChange={(e) => setWardenForm({ ...wardenForm, email: e.target.value })}
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-[4px] focus:outline-none disabled:bg-stone-100"
                />
              </div>

              {!editingWardenId && (
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Temporary Password *</label>
                  <input
                    type="password"
                    required
                    value={wardenForm.password}
                    onChange={(e) => setWardenForm({ ...wardenForm, password: e.target.value })}
                    className="w-full px-3 py-1.5 border border-stone-300 rounded-[4px] focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-stone-800 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={wardenForm.phone}
                  onChange={(e) => setWardenForm({ ...wardenForm, phone: e.target.value })}
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-[4px] focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowWardenModal(false)}
                  className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded font-medium"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-[#0f4c3a] hover:bg-[#1a6650] text-white rounded font-bold">
                  {editingWardenId ? "Update Warden" : "Create Warden Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: STAFF CREATE / EDIT (ADMIN ONLY) */}
      {/* ========================================================================= */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[6px] border border-stone-300 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <h3 className="text-sm font-bold text-stone-900">{editingStaffId ? "Edit Staff" : "Add New Staff"}</h3>
              <button onClick={() => setShowStaffModal(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-800 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={staffForm.fullName}
                  onChange={(e) => setStaffForm({ ...staffForm, fullName: e.target.value })}
                  placeholder="Manoj Kumar"
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-[4px] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Employee ID *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingStaffId}
                    value={staffForm.employeeId}
                    onChange={(e) => setStaffForm({ ...staffForm, employeeId: e.target.value })}
                    className="w-full px-3 py-1.5 border border-stone-300 rounded-[4px] focus:outline-none disabled:bg-stone-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Department / Work Type *</label>
                  <select
                    value={staffForm.department}
                    onChange={(e) => setStaffForm({ ...staffForm, department: e.target.value })}
                    className="w-full px-3 py-1.5 border border-stone-300 rounded-[4px] bg-white focus:outline-none"
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
                <label className="block font-semibold text-stone-800 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  disabled={!!editingStaffId}
                  value={staffForm.email}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-[4px] focus:outline-none disabled:bg-stone-100"
                />
              </div>

              {!editingStaffId && (
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Temporary Password *</label>
                  <input
                    type="password"
                    required
                    value={staffForm.password}
                    onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                    className="w-full px-3 py-1.5 border border-stone-300 rounded-[4px] focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-stone-800 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={staffForm.phone}
                  onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-[4px] focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowStaffModal(false)}
                  className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded font-medium"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-stone-800 hover:bg-stone-900 text-white rounded font-bold">
                  {editingStaffId ? "Update Staff" : "Create Staff Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ADD ROOM */}
      {/* ========================================================================= */}
      {showRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[6px] border border-stone-300 max-w-sm w-full p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-stone-900">Add Hostel Room</h3>
            <form onSubmit={handleCreateRoom} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-800 mb-1">Hostel Block *</label>
                <select
                  disabled={isWarden}
                  value={roomForm.hostelBlock}
                  onChange={(e) => setRoomForm({ ...roomForm, hostelBlock: e.target.value })}
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-[4px] bg-white focus:outline-none disabled:bg-stone-100"
                >
                  <option value="Hostel-A">Hostel-A</option>
                  <option value="Hostel-B">Hostel-B</option>
                  <option value="Hostel-C">Hostel-C</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Room Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 104"
                    value={roomForm.roomNumber}
                    onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                    className="w-full px-3 py-1.5 border border-stone-300 rounded-[4px] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Floor</label>
                  <input
                    type="number"
                    min={0}
                    value={roomForm.floor}
                    onChange={(e) => setRoomForm({ ...roomForm, floor: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-1.5 border border-stone-300 rounded-[4px] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-800 mb-1">Bed Capacity *</label>
                <select
                  value={roomForm.capacity}
                  onChange={(e) => setRoomForm({ ...roomForm, capacity: parseInt(e.target.value, 10) || 2 })}
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-[4px] bg-white focus:outline-none"
                >
                  <option value={1}>1 (Single Bed)</option>
                  <option value={2}>2 (Double Sharing)</option>
                  <option value={3}>3 (Triple Sharing)</option>
                  <option value={4}>4 (Four Bed)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRoomModal(false)}
                  className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded font-medium"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-[#0f4c3a] hover:bg-[#1a6650] text-white rounded font-bold">
                  Create Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: ALLOCATE BED */}
      {/* ========================================================================= */}
      {showAllocateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[6px] border border-stone-300 max-w-sm w-full p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-stone-900">
              Allocate {allocateForm.bedNumber} in Rm {allocateForm.roomNumber} ({allocateForm.hostelBlock})
            </h3>

            <form onSubmit={handleAllocateBed} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-800 mb-1">Select Student *</label>
                <select
                  required
                  value={allocateForm.studentId}
                  onChange={(e) => setAllocateForm({ ...allocateForm, studentId: e.target.value })}
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-[4px] bg-white focus:outline-none"
                >
                  <option value="">-- Choose Student --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.rollNumber || "No Roll"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAllocateModal(false)}
                  className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!allocateForm.studentId}
                  className="px-4 py-1.5 bg-[#0f4c3a] hover:bg-[#1a6650] text-white rounded font-bold disabled:opacity-50"
                >
                  Confirm Bed Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: COMPLETE STUDENT PROFILE MODAL */}
      {/* ========================================================================= */}
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
    </div>
  );
};
