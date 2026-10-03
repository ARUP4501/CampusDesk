import React, { useState, useEffect, useMemo } from "react";
import {
  Moon,
  Users,
  DoorOpen,
  Wrench,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Calendar,
  Clock,
  RefreshCw,
  Check,
  X,
  FileText,
  BarChart2,
  Eye,
  Download,
  Phone,
  Building,
  GraduationCap,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { apiRequest, UserProfile } from "../api/client.js";
import { StudentProfileModal } from "./StudentProfileModal.js";

interface WardenOperationsDashboardProps {
  user: UserProfile;
}

interface HostelStudent {
  id: string;
  fullName: string;
  rollNumber: string;
  email: string;
  phone?: string;
  course: string;
  department?: string;
  branch?: string;
  year?: number;
  semester?: number;
  hostelBlock?: string;
  roomNumber?: string;
  bedNumber?: string;
  verificationStatus: string;
  isActive: boolean;
  fatherPhone?: string;
  guardianPhone?: string;
}

interface EveningRosterItem {
  studentId: string;
  fullName: string;
  rollNumber: string;
  roomNumber: string;
  bedNumber: string;
  phone: string;
  course: string;
  branch: string;
  year?: number;
  semester?: number;
  status: "RETURNED" | "NOT_RETURNED" | "ON_LEAVE";
  returnTime: string | null;
  recordedBy: string | null;
  remarks: string | null;
  hasApprovedGatePass: boolean;
  gatePass?: {
    passNumber: string;
    type: string;
  } | null;
  recordId?: string | null;
}

interface RoomBedInfo {
  id: string;
  roomNumber: string;
  floor: number;
  capacity: number;
  beds: Array<{
    id: string;
    bedNumber: string;
    status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";
    student?: {
      id: string;
      fullName: string;
      rollNumber: string;
      phone?: string;
      branch?: string;
    } | null;
  }>;
}

interface GatePassItem {
  id: string;
  passNumber: string;
  type: string;
  departureDate: string;
  expectedReturnDate: string;
  destination: string;
  reason: string;
  status: string;
  createdAt: string;
  student: {
    id: string;
    fullName: string;
    rollNumber: string;
    phone?: string;
    roomNumber?: string;
    hostelBlock?: string;
  };
}

interface ComplaintItem {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  roomNumber?: string;
  createdAt: string;
  student?: {
    id: string;
    fullName: string;
    rollNumber: string;
    phone?: string;
  };
  assignedStaff?: {
    id: string;
    fullName: string;
    department?: string;
  } | null;
}

export const WardenOperationsDashboard: React.FC<WardenOperationsDashboardProps> = ({ user }) => {
  const assignedHostel = user.hostelBlock || "Hostel-A";

  // Navigation Views
  type ActiveView = "overview" | "eveningReturn" | "students" | "rooms" | "leaves" | "complaints" | "verifications";
  const [activeView, setActiveView] = useState<ActiveView>("overview");

  // Global Loading & Toast States
  const [loading, setLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Data States (All strictly scoped to assignedHostel)
  const [students, setStudents] = useState<HostelStudent[]>([]);
  const [rooms, setRooms] = useState<RoomBedInfo[]>([]);
  const [gatePasses, setGatePasses] = useState<GatePassItem[]>([]);
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);

  // Evening Roll Call States
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [eveningRoster, setEveningRoster] = useState<EveningRosterItem[]>([]);
  const [eveningStats, setEveningStats] = useState({
    totalResidents: 0,
    returnedCount: 0,
    notReturnedCount: 0,
    onLeaveCount: 0
  });
  const [eveningLoading, setEveningLoading] = useState<boolean>(false);
  const [savingAttendance, setSavingAttendance] = useState<boolean>(false);
  const [attendanceSearch, setAttendanceSearch] = useState<string>("");
  const [attendanceFilter, setAttendanceFilter] = useState<string>("ALL");
  const [pendingChanges, setPendingChanges] = useState<{ [studentId: string]: "RETURNED" | "NOT_RETURNED" | "ON_LEAVE" }>({});

  // Pagination for Evening Roll Call
  const [eveningPage, setEveningPage] = useState<number>(1);
  const eveningPageSize = 10;

  // Student Directory States
  const [studentSearch, setStudentSearch] = useState<string>("");
  const [studentStreamFilter, setStudentStreamFilter] = useState<string>("ALL");
  const [studentYearFilter, setStudentYearFilter] = useState<string>("ALL");
  const [selectedStudentForDossier, setSelectedStudentForDossier] = useState<string | null>(null);

  // Leave Review Modal State
  const [reviewingPass, setReviewingPass] = useState<GatePassItem | null>(null);
  const [reviewAction, setReviewAction] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [wardenComment, setWardenComment] = useState<string>("");
  const [reviewLoading, setReviewLoading] = useState<boolean>(false);

  // Room Allocation Modal State
  const [showAllocateModal, setShowAllocateModal] = useState<boolean>(false);
  const [selectedBedToAllocate, setSelectedBedToAllocate] = useState<{ bedId: string; roomNumber: string; bedNumber: string } | null>(null);
  const [selectedStudentToAllocate, setSelectedStudentToAllocate] = useState<string>("");

  // Room Add Modal State
  const [showAddRoomModal, setShowAddRoomModal] = useState<boolean>(false);
  const [newRoomForm, setNewRoomForm] = useState({ roomNumber: "", floor: 1, capacity: 2 });
  const [addRoomLoading, setAddRoomLoading] = useState<boolean>(false);

  // ---------------------------------------------------------------------------
  // 1. Data Fetchers (All derived from real DB records)
  // ---------------------------------------------------------------------------
  const fetchAllDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStudentsList(),
        fetchRoomsAndBeds(),
        fetchGatePasses(),
        fetchComplaints(),
        fetchVerifications(),
        fetchEveningRoster(selectedDate)
      ]);
    } catch (err: any) {
      console.error("Dashboard data load error:", err);
      showToast("Unable to load some hostel metrics.", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsList = async () => {
    try {
      const data = await apiRequest<{ students: HostelStudent[] }>("/api/admin/students");
      setStudents(data.students || []);
    } catch (err) {
      console.error("Failed to load students:", err);
    }
  };

  const fetchRoomsAndBeds = async () => {
    try {
      const data = await apiRequest<{ hostels: any[] }>("/api/hostels?scoped=true");
      const currentHostel = (data.hostels || []).find((h: any) => h.name === assignedHostel);
      if (currentHostel && currentHostel.rooms) {
        setRooms(currentHostel.rooms);
      }
    } catch (err) {
      console.error("Failed to load rooms:", err);
    }
  };

  const fetchGatePasses = async () => {
    try {
      const data = await apiRequest<{ passes: GatePassItem[] }>("/api/gatepass");
      setGatePasses(data.passes || []);
    } catch (err) {
      console.error("Failed to load gate passes:", err);
    }
  };

  const fetchComplaints = async () => {
    try {
      const data = await apiRequest<{ tickets: ComplaintItem[] }>("/api/tickets");
      setComplaints(data.tickets || []);
    } catch (err) {
      console.error("Failed to load complaints:", err);
    }
  };

  const fetchVerifications = async () => {
    try {
      const data = await apiRequest<{ verifications: any[] }>("/api/admin/verifications");
      setVerifications(data.verifications || []);
    } catch (err) {
      console.error("Failed to load verifications:", err);
    }
  };

  const fetchEveningRoster = async (dateStr: string) => {
    setEveningLoading(true);
    try {
      const data = await apiRequest<{
        roster: EveningRosterItem[];
        stats: { totalResidents: number; returnedCount: number; notReturnedCount: number; onLeaveCount: number };
      }>(`/api/hostels/${assignedHostel}/evening-return?date=${dateStr}`);

      setEveningRoster(data.roster || []);
      setEveningStats(data.stats || {
        totalResidents: data.roster?.length || 0,
        returnedCount: 0,
        notReturnedCount: 0,
        onLeaveCount: 0
      });
      setPendingChanges({});
      setEveningPage(1);
    } catch (err) {
      console.error("Failed to load evening roster:", err);
      showToast("Failed to load evening roll call for selected date.", "error");
    } finally {
      setEveningLoading(false);
    }
  };

  useEffect(() => {
    fetchAllDashboardData();
  }, [assignedHostel]);

  // Refetch roll call when selected date changes
  useEffect(() => {
    fetchEveningRoster(selectedDate);
  }, [selectedDate]);

  // ---------------------------------------------------------------------------
  // 2. Computed Metrics & Real Stream Distribution Chart
  // ---------------------------------------------------------------------------
  const totalBeds = useMemo(() => {
    return rooms.reduce((acc, r) => acc + (r.beds?.length || 0), 0);
  }, [rooms]);

  const occupiedBeds = useMemo(() => {
    return rooms.reduce((acc, r) => acc + (r.beds?.filter((b) => b.status === "OCCUPIED").length || 0), 0);
  }, [rooms]);

  const availableBeds = useMemo(() => {
    return rooms.reduce((acc, r) => acc + (r.beds?.filter((b) => b.status === "AVAILABLE").length || 0), 0);
  }, [rooms]);

  const vacantRoomsCount = useMemo(() => {
    return rooms.filter((r) => !r.beds?.some((b) => b.status === "OCCUPIED")).length;
  }, [rooms]);

  const pendingLeavesCount = useMemo(() => {
    return gatePasses.filter((g) => g.status === "PENDING").length;
  }, [gatePasses]);

  const openComplaintsCount = useMemo(() => {
    return complaints.filter((c) => c.status === "SUBMITTED" || c.status === "ASSIGNED" || c.status === "IN_PROGRESS").length;
  }, [complaints]);

  // Real Stream / Branch Distribution from assigned hostel students
  const streamDistribution = useMemo(() => {
    const counts: { [branch: string]: number } = {};
    students.forEach((s) => {
      const stream = (s.branch || s.course || "GENERAL").toUpperCase().trim();
      counts[stream] = (counts[stream] || 0) + 1;
    });

    const total = students.length || 1;
    return Object.entries(counts)
      .map(([branch, count]) => ({
        branch,
        count,
        percentage: Math.round((count / total) * 100)
      }))
      .sort((a, b) => b.count - a.count);
  }, [students]);

  // Distinct streams for student directory filter
  const distinctStreams = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.branch) set.add(s.branch);
      else if (s.course) set.add(s.course);
    });
    return Array.from(set).sort();
  }, [students]);

  // ---------------------------------------------------------------------------
  // 3. Evening Roll Call Actions
  // ---------------------------------------------------------------------------
  const handleToggleStatus = (studentId: string, newStatus: "RETURNED" | "NOT_RETURNED" | "ON_LEAVE") => {
    setPendingChanges((prev) => ({
      ...prev,
      [studentId]: newStatus
    }));
  };

  const handleMarkAll = (statusToSet: "RETURNED" | "NOT_RETURNED") => {
    const newChanges: { [studentId: string]: "RETURNED" | "NOT_RETURNED" | "ON_LEAVE" } = { ...pendingChanges };
    eveningRoster.forEach((r) => {
      // Don't overwrite if student is on approved leave
      if (!r.hasApprovedGatePass && r.status !== "ON_LEAVE") {
        newChanges[r.studentId] = statusToSet;
      }
    });
    setPendingChanges(newChanges);
    showToast(`Marked eligible residents as ${statusToSet}. Click "Save Roll Call" to persist.`, "info");
  };

  const handleSaveAttendance = async () => {
    const studentIds = Object.keys(pendingChanges);
    if (studentIds.length === 0) {
      showToast("No status changes to save.", "info");
      return;
    }

    setSavingAttendance(true);
    try {
      const recordsToPost = studentIds.map((id) => ({
        studentId: id,
        status: pendingChanges[id],
        returnTime: pendingChanges[id] === "RETURNED" ? new Date().toISOString() : null
      }));

      await apiRequest(`/api/hostels/${assignedHostel}/evening-return`, {
        method: "POST",
        body: JSON.stringify({
          date: selectedDate,
          records: recordsToPost
        })
      });

      showToast(`Successfully saved roll call for ${recordsToPost.length} resident(s).`, "success");
      setPendingChanges({});
      await fetchEveningRoster(selectedDate);
    } catch (err: any) {
      console.error("Save attendance error:", err);
      showToast(err.message || "Failed to save evening attendance.", "error");
    } finally {
      setSavingAttendance(false);
    }
  };

  // Filtered and Paginated Roster
  const filteredEveningRoster = useMemo(() => {
    return eveningRoster.filter((r) => {
      const currentStatus = pendingChanges[r.studentId] || r.status;
      const matchesFilter =
        attendanceFilter === "ALL"
          ? true
          : attendanceFilter === "NOT_RETURNED"
          ? currentStatus === "NOT_RETURNED"
          : attendanceFilter === "RETURNED"
          ? currentStatus === "RETURNED"
          : currentStatus === "ON_LEAVE";

      const query = attendanceSearch.toLowerCase().trim();
      const matchesSearch =
        !query ||
        r.fullName.toLowerCase().includes(query) ||
        r.rollNumber.toLowerCase().includes(query) ||
        (r.roomNumber && r.roomNumber.toLowerCase().includes(query)) ||
        (r.branch && r.branch.toLowerCase().includes(query));

      return matchesFilter && matchesSearch;
    });
  }, [eveningRoster, pendingChanges, attendanceFilter, attendanceSearch]);

  const totalEveningPages = Math.ceil(filteredEveningRoster.length / eveningPageSize) || 1;
  const paginatedEveningRoster = useMemo(() => {
    const start = (eveningPage - 1) * eveningPageSize;
    return filteredEveningRoster.slice(start, start + eveningPageSize);
  }, [filteredEveningRoster, eveningPage]);

  // ---------------------------------------------------------------------------
  // 4. Leave / Gate Pass Review Action
  // ---------------------------------------------------------------------------
  const handleReviewGatePass = async () => {
    if (!reviewingPass) return;
    setReviewLoading(true);
    try {
      await apiRequest(`/api/gatepass/${reviewingPass.id}/review`, {
        method: "PATCH",
        body: JSON.stringify({
          status: reviewAction,
          wardenComment: wardenComment.trim() || undefined
        })
      });
      showToast(`Gate pass #${reviewingPass.passNumber} was ${reviewAction.toLowerCase()}ed.`, "success");
      setReviewingPass(null);
      setWardenComment("");
      await fetchGatePasses();
    } catch (err: any) {
      showToast(err.message || "Failed to update gate pass status.", "error");
    } finally {
      setReviewLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 5. Room & Bed Management Actions
  // ---------------------------------------------------------------------------
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomForm.roomNumber.trim()) {
      showToast("Room number is required.", "error");
      return;
    }
    setAddRoomLoading(true);
    try {
      await apiRequest("/api/hostels/rooms", {
        method: "POST",
        body: JSON.stringify({
          hostelBlock: assignedHostel,
          roomNumber: newRoomForm.roomNumber.trim(),
          floor: Number(newRoomForm.floor),
          capacity: Number(newRoomForm.capacity)
        })
      });
      showToast(`Room ${newRoomForm.roomNumber} created successfully.`, "success");
      setShowAddRoomModal(false);
      setNewRoomForm({ roomNumber: "", floor: 1, capacity: 2 });
      await fetchRoomsAndBeds();
    } catch (err: any) {
      showToast(err.message || "Failed to create room.", "error");
    } finally {
      setAddRoomLoading(false);
    }
  };

  const handleAllocateBed = async () => {
    if (!selectedBedToAllocate || !selectedStudentToAllocate) {
      showToast("Please choose a student to assign.", "error");
      return;
    }
    try {
      await apiRequest("/api/hostels/beds/allocate", {
        method: "POST",
        body: JSON.stringify({
          bedId: selectedBedToAllocate.bedId,
          hostelBlock: assignedHostel,
          roomNumber: selectedBedToAllocate.roomNumber,
          bedNumber: selectedBedToAllocate.bedNumber,
          studentId: selectedStudentToAllocate
        })
      });
      showToast(`Bed successfully assigned to student.`, "success");
      setShowAllocateModal(false);
      setSelectedBedToAllocate(null);
      setSelectedStudentToAllocate("");
      await Promise.all([fetchRoomsAndBeds(), fetchStudentsList()]);
    } catch (err: any) {
      showToast(err.message || "Failed to allocate bed.", "error");
    }
  };

  const handleVacateBed = async (bedId: string, studentName: string) => {
    if (!window.confirm(`Are you sure you want to vacate the bed occupied by ${studentName}?`)) return;
    try {
      await apiRequest("/api/hostels/beds/vacate", {
        method: "POST",
        body: JSON.stringify({ bedId })
      });
      showToast("Bed vacated successfully.", "success");
      await Promise.all([fetchRoomsAndBeds(), fetchStudentsList()]);
    } catch (err: any) {
      showToast(err.message || "Failed to vacate bed.", "error");
    }
  };

  // Filtered Students Directory
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesStream =
        studentStreamFilter === "ALL"
          ? true
          : (s.branch || s.course || "").toUpperCase() === studentStreamFilter.toUpperCase();

      const matchesYear =
        studentYearFilter === "ALL" ? true : s.year === Number(studentYearFilter);

      const q = studentSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.fullName.toLowerCase().includes(q) ||
        s.rollNumber.toLowerCase().includes(q) ||
        (s.roomNumber && s.roomNumber.toLowerCase().includes(q)) ||
        (s.phone && s.phone.includes(q));

      return matchesStream && matchesYear && matchesSearch;
    });
  }, [students, studentStreamFilter, studentYearFilter, studentSearch]);

  // ---------------------------------------------------------------------------
  // RENDER UI
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Toast Feedback */}
      {toast && (
        <div
          role="status"
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-elevated text-xs font-semibold flex items-center space-x-2 transition-all ${
            toast.type === "success"
              ? "bg-emerald-500 text-black font-bold"
              : toast.type === "error"
              ? "bg-rose-600 text-white font-bold"
              : "bg-[#FF6D1F] text-black font-bold"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-black" />
          ) : toast.type === "error" ? (
            <XCircle className="w-4 h-4 shrink-0 text-white" />
          ) : (
            <Clock className="w-4 h-4 shrink-0 text-black" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. WARDEN HEADER BANNER (Friendly, Non-Technical, Contextual) */}
      <div className="glass-panel p-6 border border-[var(--border-subtle)] rounded-3xl shadow-glass flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 text-[11px] font-mono font-bold uppercase rounded-md bg-[#FF6D1F]/15 text-[#FF6D1F] border border-[#FF6D1F]/30">
              Hostel Warden Desk
            </span>
            <span className="px-2.5 py-0.5 text-[11px] font-mono font-bold rounded-md bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
              Assigned: <strong className="text-[var(--text-primary)]">{assignedHostel}</strong>
            </span>
            <span className="px-2.5 py-0.5 text-[11px] font-mono font-bold rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center space-x-1">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>Evening Curfew: 08:30 PM</span>
            </span>
          </div>

          <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
            {assignedHostel} Operations & Resident Safety
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Warden: <strong className="text-[var(--text-primary)]">{user.fullName}</strong> • Employee ID: <span className="font-mono">{user.employeeId || "EMP-WRD-001"}</span>
          </p>
        </div>

        {/* Global Refresh & Export Actions */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={fetchAllDashboardData}
            disabled={loading}
            className="px-3.5 py-2 bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] text-xs font-semibold rounded-xl transition-colors flex items-center space-x-1.5 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#FF6D1F]" : ""}`} />
            <span>Refresh Data</span>
          </button>

          <a
            href="/api/admin/export/tickets"
            download
            className="px-3.5 py-2 bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] text-xs font-semibold rounded-xl transition-colors flex items-center space-x-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-[#FF6D1F]" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* 2. EVERYDAY ACTIONS NAVIGATION BAR (Large, Clear, One-Click Access) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <button
          onClick={() => setActiveView("overview")}
          className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
            activeView === "overview"
              ? "bg-[#FF6D1F] text-[#141414] border-[#FF6D1F] shadow-md transform -translate-y-0.5"
              : "glass-card hover:bg-[var(--bg-hover)] border-[var(--border-subtle)] text-[var(--text-primary)]"
          }`}
        >
          <div className="flex items-center justify-between">
            <Building className="w-5 h-5 mb-2" />
            <span className="text-[10px] font-mono font-bold uppercase opacity-80">01</span>
          </div>
          <div>
            <p className="font-bold text-xs leading-tight">Dashboard Overview</p>
            <span className="text-[10px] opacity-75">Status & stream chart</span>
          </div>
        </button>

        <button
          onClick={() => setActiveView("eveningReturn")}
          className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between relative ${
            activeView === "eveningReturn"
              ? "bg-[#FF6D1F] text-[#141414] border-[#FF6D1F] shadow-md transform -translate-y-0.5"
              : "glass-card hover:bg-[var(--bg-hover)] border-[var(--border-subtle)] text-[var(--text-primary)]"
          }`}
        >
          <div className="flex items-center justify-between">
            <Moon className="w-5 h-5 mb-2" />
            {eveningStats.notReturnedCount > 0 && (
              <span className={`px-1.5 py-0.2 text-[9px] font-mono font-black rounded-full ${
                activeView === "eveningReturn" ? "bg-black text-[#FF6D1F]" : "bg-[#FF6D1F] text-black"
              }`}>
                {eveningStats.notReturnedCount}
              </span>
            )}
          </div>
          <div>
            <p className="font-bold text-xs leading-tight">Mark Evening Return</p>
            <span className="text-[10px] opacity-75">Today's roll call</span>
          </div>
        </button>

        <button
          onClick={() => setActiveView("students")}
          className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
            activeView === "students"
              ? "bg-[#FF6D1F] text-[#141414] border-[#FF6D1F] shadow-md transform -translate-y-0.5"
              : "glass-card hover:bg-[var(--bg-hover)] border-[var(--border-subtle)] text-[var(--text-primary)]"
          }`}
        >
          <div className="flex items-center justify-between">
            <Users className="w-5 h-5 mb-2" />
            <span className="text-[10px] font-mono font-bold opacity-80">{students.length}</span>
          </div>
          <div>
            <p className="font-bold text-xs leading-tight">Hostel Residents</p>
            <span className="text-[10px] opacity-75">Student roster & directory</span>
          </div>
        </button>

        <button
          onClick={() => setActiveView("rooms")}
          className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
            activeView === "rooms"
              ? "bg-[#FF6D1F] text-[#141414] border-[#FF6D1F] shadow-md transform -translate-y-0.5"
              : "glass-card hover:bg-[var(--bg-hover)] border-[var(--border-subtle)] text-[var(--text-primary)]"
          }`}
        >
          <div className="flex items-center justify-between">
            <DoorOpen className="w-5 h-5 mb-2" />
            <span className="text-[10px] font-mono font-bold opacity-80">{availableBeds} Free</span>
          </div>
          <div>
            <p className="font-bold text-xs leading-tight">Rooms & Beds</p>
            <span className="text-[10px] opacity-75">Beds map & occupancy</span>
          </div>
        </button>

        <button
          onClick={() => setActiveView("leaves")}
          className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between relative ${
            activeView === "leaves"
              ? "bg-[#FF6D1F] text-[#141414] border-[#FF6D1F] shadow-md transform -translate-y-0.5"
              : "glass-card hover:bg-[var(--bg-hover)] border-[var(--border-subtle)] text-[var(--text-primary)]"
          }`}
        >
          <div className="flex items-center justify-between">
            <FileText className="w-5 h-5 mb-2" />
            {pendingLeavesCount > 0 && (
              <span className={`px-1.5 py-0.2 text-[9px] font-mono font-black rounded-full ${
                activeView === "leaves" ? "bg-black text-[#FF6D1F]" : "bg-amber-500 text-black font-bold"
              }`}>
                {pendingLeavesCount}
              </span>
            )}
          </div>
          <div>
            <p className="font-bold text-xs leading-tight">Pending Leaves</p>
            <span className="text-[10px] opacity-75">Review gate passes</span>
          </div>
        </button>

        <button
          onClick={() => setActiveView("complaints")}
          className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
            activeView === "complaints"
              ? "bg-[#FF6D1F] text-[#141414] border-[#FF6D1F] shadow-md transform -translate-y-0.5"
              : "glass-card hover:bg-[var(--bg-hover)] border-[var(--border-subtle)] text-[var(--text-primary)]"
          }`}
        >
          <div className="flex items-center justify-between">
            <Wrench className="w-5 h-5 mb-2" />
            {openComplaintsCount > 0 && (
              <span className={`px-1.5 py-0.2 text-[9px] font-mono font-black rounded-full ${
                activeView === "complaints" ? "bg-black text-[#FF6D1F]" : "bg-rose-500 text-white"
              }`}>
                {openComplaintsCount}
              </span>
            )}
          </div>
          <div>
            <p className="font-bold text-xs leading-tight">Hostel Complaints</p>
            <span className="text-[10px] opacity-75">Maintenance repairs</span>
          </div>
        </button>
      </div>

      {/* =======================================================================
          VIEW 1: OVERVIEW DASHBOARD & STREAM DISTRIBUTION CHART
      ======================================================================== */}
      {activeView === "overview" && (
        <div className="space-y-6">
          {/* Summary Metric Cards (8 Core Indicators) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3.5">
            {/* Total Students */}
            <div className="glass-panel p-4 rounded-2xl border border-[var(--border-subtle)] shadow-sm">
              <span className="text-[10px] font-mono uppercase font-bold text-[var(--text-muted)] block">
                Total Hostel Students
              </span>
              <p className="text-2xl font-black text-[var(--text-primary)] font-mono mt-1">
                {students.length}
              </p>
              <span className="text-[11px] text-emerald-400 font-semibold block mt-0.5">
                Active in {assignedHostel}
              </span>
            </div>

            {/* Occupied & Available Beds */}
            <div className="glass-panel p-4 rounded-2xl border border-[var(--border-subtle)] shadow-sm">
              <span className="text-[10px] font-mono uppercase font-bold text-[var(--text-muted)] block">
                Bed Capacity & Vacancy
              </span>
              <div className="flex items-baseline space-x-1.5 mt-1 font-mono">
                <span className="text-2xl font-black text-[#FF6D1F]">{occupiedBeds}</span>
                <span className="text-xs text-[var(--text-muted)]">/ {totalBeds} Occupied</span>
              </div>
              <span className="text-[11px] text-emerald-400 font-semibold block mt-0.5">
                {availableBeds} beds available
              </span>
            </div>

            {/* Rooms Status */}
            <div className="glass-panel p-4 rounded-2xl border border-[var(--border-subtle)] shadow-sm">
              <span className="text-[10px] font-mono uppercase font-bold text-[var(--text-muted)] block">
                Total & Vacant Rooms
              </span>
              <div className="flex items-baseline space-x-1.5 mt-1 font-mono">
                <span className="text-2xl font-black text-[var(--text-primary)]">{rooms.length}</span>
                <span className="text-xs text-[var(--text-muted)]">Total Rooms</span>
              </div>
              <span className="text-[11px] text-blue-400 font-semibold block mt-0.5">
                {vacantRoomsCount} completely vacant
              </span>
            </div>

            {/* Evening Return Today */}
            <div className="glass-panel p-4 rounded-2xl border border-[var(--border-subtle)] shadow-sm">
              <span className="text-[10px] font-mono uppercase font-bold text-[var(--text-muted)] block">
                Evening Roll Call Today
              </span>
              <div className="flex items-baseline space-x-1.5 mt-1 font-mono">
                <span className="text-2xl font-black text-emerald-400">{eveningStats.returnedCount}</span>
                <span className="text-xs text-[var(--text-muted)]">/ {eveningStats.totalResidents} Returned</span>
              </div>
              <span className={`text-[11px] font-semibold block mt-0.5 ${eveningStats.notReturnedCount > 0 ? "text-[#FF6D1F]" : "text-emerald-400"}`}>
                {eveningStats.notReturnedCount} pending roll call
              </span>
            </div>

            {/* Students Not Yet Returned / Alert */}
            <div className="glass-panel p-4 rounded-2xl border border-[var(--border-subtle)] shadow-sm">
              <span className="text-[10px] font-mono uppercase font-bold text-[var(--text-muted)] block">
                Awaiting Return (Curfew)
              </span>
              <p className="text-2xl font-black text-[#FF6D1F] font-mono mt-1">
                {eveningStats.notReturnedCount}
              </p>
              <span className="text-[11px] text-[var(--text-secondary)] font-medium block mt-0.5">
                Curfew boundary: 08:30 PM
              </span>
            </div>

            {/* On Approved Leave */}
            <div className="glass-panel p-4 rounded-2xl border border-[var(--border-subtle)] shadow-sm">
              <span className="text-[10px] font-mono uppercase font-bold text-[var(--text-muted)] block">
                On Approved Leave
              </span>
              <p className="text-2xl font-black text-blue-400 font-mono mt-1">
                {eveningStats.onLeaveCount}
              </p>
              <span className="text-[11px] text-blue-400/80 font-medium block mt-0.5">
                Valid active gate passes
              </span>
            </div>

            {/* Pending Leave Requests */}
            <div className="glass-panel p-4 rounded-2xl border border-[var(--border-subtle)] shadow-sm">
              <span className="text-[10px] font-mono uppercase font-bold text-[var(--text-muted)] block">
                Pending Leave Approvals
              </span>
              <p className="text-2xl font-black text-amber-300 font-mono mt-1">
                {pendingLeavesCount}
              </p>
              <span className="text-[11px] text-amber-400 font-medium block mt-0.5">
                Awaiting warden decision
              </span>
            </div>

            {/* Open Complaints */}
            <div className="glass-panel p-4 rounded-2xl border border-[var(--border-subtle)] shadow-sm">
              <span className="text-[10px] font-mono uppercase font-bold text-[var(--text-muted)] block">
                Open Hostel Complaints
              </span>
              <p className="text-2xl font-black text-rose-400 font-mono mt-1">
                {openComplaintsCount}
              </p>
              <span className="text-[11px] text-rose-400/80 font-medium block mt-0.5">
                Maintenance & repairs
              </span>
            </div>
          </div>

          {/* Real Stream-Wise Student Distribution Chart & Quick Actions Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stream Distribution Chart (2 Cols) */}
            <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-[var(--border-subtle)] shadow-glass space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--border-subtle)]">
                <div>
                  <h3 className="font-extrabold text-base text-[var(--text-primary)] flex items-center space-x-2">
                    <BarChart2 className="w-4 h-4 text-[#FF6D1F]" />
                    <span>Resident Stream / Branch Distribution</span>
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Live breakdown of {students.length} students assigned to {assignedHostel} across academic streams.
                  </p>
                </div>
                <span className="text-xs font-mono text-[var(--text-muted)]">
                  {streamDistribution.length} Distinct Streams
                </span>
              </div>

              {streamDistribution.length === 0 ? (
                <div className="py-12 text-center text-xs text-[var(--text-muted)]">
                  No resident stream data found for {assignedHostel}.
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  {streamDistribution.map((item) => (
                    <div key={item.branch} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center space-x-2">
                          <strong className="text-[var(--text-primary)] w-16">{item.branch}</strong>
                          <span className="text-[var(--text-muted)] text-[11px]">
                            {item.count} student{item.count !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <span className="text-[var(--text-secondary)] font-bold">{item.percentage}%</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-[var(--bg-surface)] overflow-hidden border border-[var(--border-subtle)]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#FF6D1F] to-[#FF8540] transition-all duration-500"
                          style={{ width: `${Math.max(item.percentage, 4)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Action Cards (1 Col) */}
            <div className="glass-panel p-6 rounded-3xl border border-[var(--border-subtle)] shadow-glass space-y-4">
              <h3 className="font-extrabold text-base text-[var(--text-primary)] pb-3 border-b border-[var(--border-subtle)]">
                Warden Daily Actions
              </h3>

              <div className="space-y-2.5 text-xs">
                <button
                  onClick={() => setActiveView("eveningReturn")}
                  className="w-full p-3 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-left flex items-center justify-between transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-[#FF6D1F]/15 text-[#FF6D1F]">
                      <Moon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-[var(--text-primary)] group-hover:text-[#FF6D1F] transition-colors">
                        Take Evening Roll Call
                      </p>
                      <span className="text-[11px] text-[var(--text-muted)]">Check in returned residents</span>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[#FF6D1F]" />
                </button>

                <button
                  onClick={() => setActiveView("leaves")}
                  className="w-full p-3 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-left flex items-center justify-between transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-[var(--text-primary)] group-hover:text-[#FF6D1F] transition-colors">
                        Review Gate Passes ({pendingLeavesCount})
                      </p>
                      <span className="text-[11px] text-[var(--text-muted)]">Approve student leaves</span>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[#FF6D1F]" />
                </button>

                <button
                  onClick={() => setActiveView("rooms")}
                  className="w-full p-3 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-left flex items-center justify-between transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400">
                      <DoorOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-[var(--text-primary)] group-hover:text-[#FF6D1F] transition-colors">
                        Manage Rooms & Beds
                      </p>
                      <span className="text-[11px] text-[var(--text-muted)]">{availableBeds} beds available for allocation</span>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[#FF6D1F]" />
                </button>

                <button
                  onClick={() => setActiveView("complaints")}
                  className="w-full p-3 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-left flex items-center justify-between transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-[var(--text-primary)] group-hover:text-[#FF6D1F] transition-colors">
                        Hostel Maintenance ({openComplaintsCount})
                      </p>
                      <span className="text-[11px] text-[var(--text-muted)]">Track repairs in {assignedHostel}</span>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[#FF6D1F]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          VIEW 2: PROMINENT EVENING-RETURN ROLL CALL MODULE
      ======================================================================== */}
      {activeView === "eveningReturn" && (
        <div className="space-y-6">
          {/* Header Controls Banner */}
          <div className="glass-panel p-6 border border-[var(--border-subtle)] rounded-3xl shadow-glass space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-[#FF6D1F]/20 text-[#FF6D1F] border border-[#FF6D1F]/30">
                    Hostel Evening Attendance
                  </span>
                  <span className="text-xs text-[var(--text-muted)] font-mono">
                    Boundary: 08:30 PM Curfew
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-[var(--text-primary)]">
                  Evening Roll Call — {assignedHostel}
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Verify student returns for date: <strong className="text-[var(--text-primary)] font-mono">{selectedDate}</strong>.
                  Mark each resident as Returned, Not Returned, or On Approved Leave.
                </p>
              </div>

              {/* Date Selector & Save Action */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center space-x-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] px-3 py-1.5 rounded-xl text-xs">
                  <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-transparent text-[var(--text-primary)] text-xs font-mono outline-none cursor-pointer"
                  />
                </div>

                <button
                  onClick={handleSaveAttendance}
                  disabled={savingAttendance || Object.keys(pendingChanges).length === 0}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center space-x-2 ${
                    Object.keys(pendingChanges).length > 0
                      ? "bg-[#FF6D1F] hover:bg-[#FF8540] text-black font-extrabold animate-pulse"
                      : "bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-subtle)] opacity-60 cursor-not-allowed"
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {savingAttendance
                      ? "Saving..."
                      : Object.keys(pendingChanges).length > 0
                      ? `Save Changes (${Object.keys(pendingChanges).length})`
                      : "All Saved"}
                  </span>
                </button>
              </div>
            </div>

            {/* Quick Status KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[var(--border-subtle)]">
              <div className="p-3 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)]">
                <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">Total Residents</span>
                <span className="text-xl font-bold font-mono text-[var(--text-primary)]">{eveningStats.totalResidents}</span>
              </div>

              <div className="p-3 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)]">
                <span className="text-[10px] font-mono text-emerald-400 uppercase block">Returned</span>
                <span className="text-xl font-bold font-mono text-emerald-400">{eveningStats.returnedCount}</span>
              </div>

              <div className="p-3 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)]">
                <span className="text-[10px] font-mono text-[#FF6D1F] uppercase block">Not Returned (Awaiting)</span>
                <span className="text-xl font-bold font-mono text-[#FF6D1F]">{eveningStats.notReturnedCount}</span>
              </div>

              <div className="p-3 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)]">
                <span className="text-[10px] font-mono text-blue-400 uppercase block">On Approved Leave</span>
                <span className="text-xl font-bold font-mono text-blue-400">{eveningStats.onLeaveCount}</span>
              </div>
            </div>
          </div>

          {/* Roster Controls & Search */}
          <div className="glass-panel p-4 border border-[var(--border-subtle)] rounded-3xl shadow-glass flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
              <button
                onClick={() => { setAttendanceFilter("ALL"); setEveningPage(1); }}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-colors ${
                  attendanceFilter === "ALL"
                    ? "bg-[#FF6D1F] text-black font-bold"
                    : "bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]"
                }`}
              >
                All Residents ({eveningStats.totalResidents})
              </button>

              <button
                onClick={() => { setAttendanceFilter("NOT_RETURNED"); setEveningPage(1); }}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-colors ${
                  attendanceFilter === "NOT_RETURNED"
                    ? "bg-[#FF6D1F] text-black font-bold"
                    : "bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]"
                }`}
              >
                Curfew Watch ({eveningStats.notReturnedCount})
              </button>

              <button
                onClick={() => { setAttendanceFilter("RETURNED"); setEveningPage(1); }}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-colors ${
                  attendanceFilter === "RETURNED"
                    ? "bg-emerald-500 text-black font-bold"
                    : "bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]"
                }`}
              >
                Returned ({eveningStats.returnedCount})
              </button>

              <button
                onClick={() => { setAttendanceFilter("ON_LEAVE"); setEveningPage(1); }}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-colors ${
                  attendanceFilter === "ON_LEAVE"
                    ? "bg-blue-500 text-black font-bold"
                    : "bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]"
                }`}
              >
                On Leave ({eveningStats.onLeaveCount})
              </button>
            </div>

            {/* Quick Actions & Search */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search name, roll, room..."
                  value={attendanceSearch}
                  onChange={(e) => { setAttendanceSearch(e.target.value); setEveningPage(1); }}
                  className="pl-8 pr-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs rounded-xl w-48 sm:w-60 focus:border-[#FF6D1F] outline-none"
                />
              </div>

              <button
                onClick={() => handleMarkAll("RETURNED")}
                className="px-3 py-1.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-emerald-400 border border-emerald-500/30 text-xs font-semibold rounded-xl transition-colors"
                title="Mark all eligible residents as returned"
              >
                Mark All Returned
              </button>
            </div>
          </div>

          {/* Roster Table */}
          <div className="glass-panel border border-[var(--border-subtle)] rounded-3xl overflow-hidden shadow-glass">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-mono uppercase tracking-wider text-[11px]">
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Roll / Course</th>
                    <th className="px-4 py-3">Room & Bed</th>
                    <th className="px-4 py-3">Leave / Gate Pass Status</th>
                    <th className="px-4 py-3 text-center">Status Action</th>
                    <th className="px-4 py-3 text-right">Dossier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {eveningLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-[var(--text-muted)] font-mono">
                        Querying roll call roster for {selectedDate}...
                      </td>
                    </tr>
                  ) : paginatedEveningRoster.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-[var(--text-muted)] font-mono">
                        No residents found matching the current search/filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedEveningRoster.map((resident) => {
                      const effectiveStatus = pendingChanges[resident.studentId] || resident.status;
                      const isUnsaved = !!pendingChanges[resident.studentId];

                      return (
                        <tr key={resident.studentId} className="hover:bg-[var(--bg-hover)] transition-colors">
                          {/* Student Name */}
                          <td className="px-4 py-3">
                            <span className="font-bold text-[var(--text-primary)] block">
                              {resident.fullName}
                            </span>
                            <span className="text-[11px] text-[var(--text-muted)] font-mono">
                              {resident.phone || "No phone registered"}
                            </span>
                          </td>

                          {/* Roll / Course */}
                          <td className="px-4 py-3">
                            <span className="font-bold font-mono text-[#FF6D1F] block">
                              {resident.rollNumber}
                            </span>
                            <span className="text-[11px] text-[var(--text-secondary)]">
                              {resident.course} ({resident.branch})
                            </span>
                          </td>

                          {/* Room & Bed */}
                          <td className="px-4 py-3 font-mono">
                            <span className="font-bold text-[var(--text-primary)] block">
                              Room {resident.roomNumber || "Unassigned"}
                            </span>
                            <span className="text-[11px] text-[var(--text-muted)]">
                              Bed {resident.bedNumber || "01"}
                            </span>
                          </td>

                          {/* Gate Pass Status */}
                          <td className="px-4 py-3">
                            {resident.hasApprovedGatePass ? (
                              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30 rounded inline-flex items-center space-x-1">
                                <FileText className="w-3 h-3 text-blue-400" />
                                <span>{resident.remarks || "Approved Gate Pass"}</span>
                              </span>
                            ) : (
                              <span className="text-[11px] text-[var(--text-muted)] font-mono">
                                Standard Curfew (08:30 PM)
                              </span>
                            )}
                          </td>

                          {/* Status Toggle Controls (Clear, 3 options) */}
                          <td className="px-4 py-3 text-center">
                            <div className="inline-flex p-1 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-x-1">
                              <button
                                onClick={() => handleToggleStatus(resident.studentId, "RETURNED")}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono transition-all ${
                                  effectiveStatus === "RETURNED"
                                    ? "bg-emerald-500 text-black shadow-sm"
                                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                }`}
                              >
                                RETURNED
                              </button>

                              <button
                                onClick={() => handleToggleStatus(resident.studentId, "NOT_RETURNED")}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono transition-all ${
                                  effectiveStatus === "NOT_RETURNED"
                                    ? "bg-[#FF6D1F] text-black shadow-sm"
                                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                }`}
                              >
                                NOT RETURNED
                              </button>

                              <button
                                onClick={() => handleToggleStatus(resident.studentId, "ON_LEAVE")}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono transition-all ${
                                  effectiveStatus === "ON_LEAVE"
                                    ? "bg-blue-500 text-black shadow-sm"
                                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                }`}
                              >
                                ON LEAVE
                              </button>
                            </div>
                            {isUnsaved && (
                              <span className="block text-[9px] font-mono text-[#FF6D1F] mt-0.5">
                                • Unsaved change
                              </span>
                            )}
                          </td>

                          {/* Dossier Link */}
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => setSelectedStudentForDossier(resident.studentId)}
                              className="px-2.5 py-1 bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-lg font-medium text-xs inline-flex items-center space-x-1 transition-colors"
                            >
                              <Eye className="w-3 h-3 text-[#FF6D1F]" />
                              <span>Dossier</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalEveningPages > 1 && (
              <div className="p-4 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs font-mono">
                <span className="text-[var(--text-muted)]">
                  Showing {(eveningPage - 1) * eveningPageSize + 1} to{" "}
                  {Math.min(eveningPage * eveningPageSize, filteredEveningRoster.length)} of{" "}
                  {filteredEveningRoster.length} residents
                </span>
                <div className="flex items-center space-x-1.5">
                  <button
                    disabled={eveningPage === 1}
                    onClick={() => setEveningPage((p) => p - 1)}
                    className="p-1.5 rounded-lg border border-[var(--border-subtle)] disabled:opacity-30 hover:bg-[var(--bg-hover)] text-[var(--text-primary)]"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-2 font-bold text-[var(--text-primary)]">
                    {eveningPage} / {totalEveningPages}
                  </span>
                  <button
                    disabled={eveningPage === totalEveningPages}
                    onClick={() => setEveningPage((p) => p + 1)}
                    className="p-1.5 rounded-lg border border-[var(--border-subtle)] disabled:opacity-30 hover:bg-[var(--bg-hover)] text-[var(--text-primary)]"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =======================================================================
          VIEW 3: RESIDENTS DIRECTORY (Strictly Scoped to Assigned Hostel)
      ======================================================================== */}
      {activeView === "students" && (
        <div className="space-y-4">
          <div className="glass-panel p-4 border border-[var(--border-subtle)] rounded-3xl shadow-glass flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search resident or roll..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs rounded-xl w-48 sm:w-60 focus:border-[#FF6D1F] outline-none"
                />
              </div>

              {/* Stream Filter */}
              <select
                value={studentStreamFilter}
                onChange={(e) => setStudentStreamFilter(e.target.value)}
                className="px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs rounded-xl focus:border-[#FF6D1F] outline-none"
              >
                <option value="ALL">All Streams / Branches</option>
                {distinctStreams.map((stream) => (
                  <option key={stream} value={stream}>{stream}</option>
                ))}
              </select>

              {/* Year Filter */}
              <select
                value={studentYearFilter}
                onChange={(e) => setStudentYearFilter(e.target.value)}
                className="px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs rounded-xl focus:border-[#FF6D1F] outline-none"
              >
                <option value="ALL">All Academic Years</option>
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
              </select>
            </div>

            <span className="text-xs font-mono text-[var(--text-muted)]">
              Showing {filteredStudents.length} of {students.length} residents in {assignedHostel}
            </span>
          </div>

          <div className="glass-panel border border-[var(--border-subtle)] rounded-3xl overflow-hidden shadow-glass">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-mono uppercase tracking-wider text-[11px]">
                    <th className="px-4 py-3">Resident Name</th>
                    <th className="px-4 py-3">Roll Number</th>
                    <th className="px-4 py-3">Stream & Year</th>
                    <th className="px-4 py-3">Room & Bed</th>
                    <th className="px-4 py-3">Guardian Contact</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-[var(--text-muted)] font-mono">
                        No residents matching filters in {assignedHostel}.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setSelectedStudentForDossier(s.id)}
                            className="font-bold text-[var(--text-primary)] hover:text-[#FF6D1F] hover:underline text-left block"
                          >
                            {s.fullName}
                          </button>
                          <span className="text-[11px] text-[var(--text-muted)] font-mono">{s.email}</span>
                        </td>

                        <td className="px-4 py-3 font-mono font-bold text-[#FF6D1F]">
                          {s.rollNumber}
                        </td>

                        <td className="px-4 py-3">
                          <span className="font-semibold text-[var(--text-primary)] block">
                            {s.course} ({s.branch || "General"})
                          </span>
                          <span className="text-[11px] text-[var(--text-muted)] font-mono">
                            Year {s.year || 1} • Sem {s.semester || 1}
                          </span>
                        </td>

                        <td className="px-4 py-3 font-mono">
                          <span className="font-bold text-[var(--text-primary)] block">
                            Room {s.roomNumber || "Unassigned"}
                          </span>
                          <span className="text-[11px] text-[var(--text-muted)]">
                            Bed {s.bedNumber || "01"}
                          </span>
                        </td>

                        <td className="px-4 py-3 font-mono text-[11px]">
                          <span className="text-[var(--text-primary)] block">
                            Father: {s.fatherPhone || s.phone || "N/A"}
                          </span>
                          <span className="text-[var(--text-muted)]">
                            Guardian: {s.guardianPhone || "N/A"}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setSelectedStudentForDossier(s.id)}
                            className="px-2.5 py-1 bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-lg font-medium text-xs inline-flex items-center space-x-1 transition-colors"
                          >
                            <Eye className="w-3 h-3 text-[#FF6D1F]" />
                            <span>Dossier</span>
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

      {/* =======================================================================
          VIEW 4: ROOMS & BEDS OCCUPANCY MAP
      ======================================================================== */}
      {activeView === "rooms" && (
        <div className="space-y-6">
          <div className="glass-panel p-4 border border-[var(--border-subtle)] rounded-3xl shadow-glass flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-[var(--text-primary)]">
                {assignedHostel} Room & Bed Matrix
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Total Rooms: <strong className="text-[var(--text-primary)]">{rooms.length}</strong> •{" "}
                Occupied: <strong className="text-emerald-400">{occupiedBeds}</strong> / {totalBeds} Beds •{" "}
                Available: <strong className="text-[#FF6D1F]">{availableBeds} Beds</strong>
              </p>
            </div>

            <button
              onClick={() => setShowAddRoomModal(true)}
              className="px-3.5 py-2 bg-[#FF6D1F] hover:bg-[#FF8540] text-black text-xs font-bold rounded-xl transition-colors flex items-center space-x-1.5 shadow-sm"
            >
              <DoorOpen className="w-3.5 h-3.5" />
              <span>Add Room</span>
            </button>
          </div>

          {/* Rooms Grid */}
          {rooms.length === 0 ? (
            <div className="glass-panel p-12 text-center text-xs text-[var(--text-muted)] font-mono rounded-3xl">
              No rooms configured for {assignedHostel}. Click "Add Room" to create one.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {rooms.map((room) => {
                const totalInRoom = room.beds?.length || 0;
                const occInRoom = room.beds?.filter((b) => b.status === "OCCUPIED").length || 0;
                const isFull = occInRoom >= totalInRoom && totalInRoom > 0;
                const isVacant = occInRoom === 0;

                return (
                  <div
                    key={room.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isFull
                        ? "bg-[var(--bg-surface)] border-[var(--border-subtle)]"
                        : isVacant
                        ? "bg-blue-500/05 border-blue-500/20"
                        : "bg-[var(--bg-surface)] border-[#FF6D1F]/30"
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                      <div>
                        <strong className="text-sm font-bold text-[var(--text-primary)] font-mono block">
                          Room {room.roomNumber}
                        </strong>
                        <span className="text-[10px] text-[var(--text-muted)] font-mono">
                          Floor {room.floor}
                        </span>
                      </div>

                      <span
                        className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
                          isFull
                            ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                            : isVacant
                            ? "bg-blue-500/15 text-blue-300 border border-blue-500/30"
                            : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                        }`}
                      >
                        {isFull ? "FULL" : isVacant ? "VACANT" : `${occInRoom}/${totalInRoom}`}
                      </span>
                    </div>

                    {/* Beds in Room */}
                    <div className="space-y-2 pt-2.5">
                      {room.beds?.map((bed) => {
                        const isBedOccupied = bed.status === "OCCUPIED" && bed.student;
                        return (
                          <div
                            key={bed.id}
                            className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs flex items-center justify-between"
                          >
                            <div>
                              <span className="font-mono font-bold text-[var(--text-primary)] block">
                                {bed.bedNumber}
                              </span>
                              {isBedOccupied ? (
                                <p className="text-[11px] text-[var(--text-secondary)] truncate max-w-[120px]">
                                  {bed.student?.fullName}
                                </p>
                              ) : (
                                <span className="text-[10px] text-emerald-400 font-mono">Available</span>
                              )}
                            </div>

                            {isBedOccupied ? (
                              <button
                                onClick={() => handleVacateBed(bed.id, bed.student?.fullName || "Student")}
                                className="px-2 py-0.5 text-[10px] font-mono font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 rounded"
                              >
                                Vacate
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedBedToAllocate({
                                    bedId: bed.id,
                                    roomNumber: room.roomNumber,
                                    bedNumber: bed.bedNumber
                                  });
                                  setShowAllocateModal(true);
                                }}
                                className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#FF6D1F]/15 hover:bg-[#FF6D1F]/25 text-[#FF6D1F] border border-[#FF6D1F]/30 rounded"
                              >
                                Assign
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =======================================================================
          VIEW 5: PENDING LEAVE REQUESTS
      ======================================================================== */}
      {activeView === "leaves" && (
        <div className="space-y-4">
          <div className="glass-panel p-4 border border-[var(--border-subtle)] rounded-3xl shadow-glass flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-[var(--text-primary)]">
                {assignedHostel} Gate Pass & Leave Requests
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Review departures, weekend leaves, and day passes submitted by residents.
              </p>
            </div>
            <span className="text-xs font-mono text-amber-400 font-bold bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-xl">
              {pendingLeavesCount} Pending Review
            </span>
          </div>

          <div className="glass-panel border border-[var(--border-subtle)] rounded-3xl overflow-hidden shadow-glass">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-mono uppercase tracking-wider text-[11px]">
                    <th className="px-4 py-3">Pass #</th>
                    <th className="px-4 py-3">Resident</th>
                    <th className="px-4 py-3">Type & Destination</th>
                    <th className="px-4 py-3">Departure - Return</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {gatePasses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-[var(--text-muted)] font-mono">
                        No gate passes or leaves recorded for {assignedHostel}.
                      </td>
                    </tr>
                  ) : (
                    gatePasses.map((p) => {
                      const isPending = p.status === "PENDING";
                      return (
                        <tr key={p.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-[#FF6D1F]">
                            {p.passNumber}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-bold text-[var(--text-primary)] block">
                              {p.student?.fullName}
                            </span>
                            <span className="text-[11px] text-[var(--text-muted)] font-mono">
                              Rm {p.student?.roomNumber || "N/A"} • {p.student?.rollNumber}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-semibold text-[var(--text-primary)] block">{p.type}</span>
                            <span className="text-[11px] text-[var(--text-secondary)]">{p.destination}</span>
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px]">
                            <span className="text-[var(--text-primary)] block">
                              Dep: {new Date(p.departureDate).toLocaleDateString()}
                            </span>
                            <span className="text-[var(--text-muted)]">
                              Ret: {new Date(p.expectedReturnDate).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[var(--text-secondary)] max-w-xs truncate">
                            {p.reason}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
                                p.status === "APPROVED"
                                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                                  : p.status === "PENDING"
                                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse"
                                  : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right space-x-1.5">
                            {isPending ? (
                              <>
                                <button
                                  onClick={() => {
                                    setReviewingPass(p);
                                    setReviewAction("APPROVE");
                                    setWardenComment("");
                                  }}
                                  className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => {
                                    setReviewingPass(p);
                                    setReviewAction("REJECT");
                                    setWardenComment("");
                                  }}
                                  className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold text-xs rounded transition-colors"
                                >
                                  Reject
                                </button>
                              </>
                            ) : (
                              <span className="text-[11px] text-[var(--text-muted)] font-mono">Completed</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          VIEW 6: HOSTEL COMPLAINTS
      ======================================================================== */}
      {activeView === "complaints" && (
        <div className="space-y-4">
          <div className="glass-panel p-4 border border-[var(--border-subtle)] rounded-3xl shadow-glass flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-[var(--text-primary)]">
                {assignedHostel} Maintenance & Repair Requests
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Plumbing, electrical, sanitation, and carpentry issues reported by residents.
              </p>
            </div>
            <span className="text-xs font-mono text-rose-400 font-bold bg-rose-500/10 border border-rose-500/30 px-3 py-1 rounded-xl">
              {openComplaintsCount} Active Issues
            </span>
          </div>

          <div className="glass-panel border border-[var(--border-subtle)] rounded-3xl overflow-hidden shadow-glass">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-mono uppercase tracking-wider text-[11px]">
                    <th className="px-4 py-3">Ticket #</th>
                    <th className="px-4 py-3">Resident & Room</th>
                    <th className="px-4 py-3">Issue Title</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Assigned Staff</th>
                    <th className="px-4 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {complaints.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-[var(--text-muted)] font-mono">
                        No maintenance tickets logged for {assignedHostel}.
                      </td>
                    </tr>
                  ) : (
                    complaints.map((c) => (
                      <tr key={c.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-[#FF6D1F]">
                          {c.ticketNumber}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-[var(--text-primary)] block">
                            {c.student?.fullName || "Resident"}
                          </span>
                          <span className="text-[11px] text-[var(--text-muted)] font-mono">
                            Rm {c.roomNumber || "N/A"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-[var(--text-primary)] block">{c.title}</span>
                          <span className="text-[11px] text-[var(--text-secondary)] max-w-xs truncate block">
                            {c.description}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-[var(--text-secondary)]">
                          {c.category}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
                              c.priority === "HIGH" || c.priority === "URGENT"
                                ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                                : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                            }`}
                          >
                            {c.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[11px] text-[var(--text-secondary)]">
                          {c.assignedStaff ? (
                            <>
                              <span className="font-semibold block">{c.assignedStaff.fullName}</span>
                              <span className="text-[10px] text-[var(--text-muted)] font-mono">
                                {c.assignedStaff.department}
                              </span>
                            </>
                          ) : (
                            <span className="text-[var(--text-muted)] italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
                              c.status === "RESOLVED" || c.status === "CLOSED"
                                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                                : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                            }`}
                          >
                            {c.status}
                          </span>
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

      {/* =======================================================================
          MODALS
      ======================================================================== */}
      {/* 1. Student Dossier Modal */}
      {selectedStudentForDossier && (
        <StudentProfileModal
          studentId={selectedStudentForDossier}
          onClose={() => setSelectedStudentForDossier(null)}
          currentUserRole="WARDEN"
        />
      )}

      {/* 2. Gate Pass Review Modal */}
      {reviewingPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="glass-panel rounded-3xl border border-[var(--border-subtle)] max-w-md w-full p-6 shadow-elevated space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <div>
                <h3 className="font-bold text-sm text-[var(--text-primary)]">
                  {reviewAction === "APPROVE" ? "Approve Leave Request" : "Reject Leave Request"}
                </h3>
                <span className="text-[11px] text-[var(--text-muted)] font-mono">
                  Pass #{reviewingPass.passNumber} • {reviewingPass.student?.fullName}
                </span>
              </div>
              <button onClick={() => setReviewingPass(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1 font-mono">
                <p>Destination: <strong className="text-[var(--text-primary)]">{reviewingPass.destination}</strong></p>
                <p>Type: <strong className="text-[var(--text-primary)]">{reviewingPass.type}</strong></p>
                <p>Reason: <span className="text-[var(--text-secondary)]">{reviewingPass.reason}</span></p>
              </div>

              <div>
                <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                  Warden Remark / Instruction (Optional)
                </label>
                <textarea
                  rows={3}
                  value={wardenComment}
                  onChange={(e) => setWardenComment(e.target.value)}
                  placeholder="e.g. Return before 08:30 PM curfew without fail."
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl focus:border-[#FF6D1F] outline-none text-xs resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewingPass(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReviewGatePass}
                  disabled={reviewLoading}
                  className={`px-4 py-1.5 rounded-xl font-bold text-xs ${
                    reviewAction === "APPROVE"
                      ? "bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold"
                      : "bg-rose-600 hover:bg-rose-500 text-white font-extrabold"
                  }`}
                >
                  {reviewLoading ? "Saving..." : `Confirm ${reviewAction === "APPROVE" ? "Approval" : "Rejection"}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Add Room Modal */}
      {showAddRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="glass-panel rounded-3xl border border-[var(--border-subtle)] max-w-md w-full p-6 shadow-elevated space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <h3 className="font-bold text-sm text-[var(--text-primary)]">
                Add Room to {assignedHostel}
              </h3>
              <button onClick={() => setShowAddRoomModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[var(--text-secondary)] mb-1">Room Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 101, 102, 201"
                  value={newRoomForm.roomNumber}
                  onChange={(e) => setNewRoomForm({ ...newRoomForm, roomNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl focus:border-[#FF6D1F] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">Floor</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={newRoomForm.floor}
                    onChange={(e) => setNewRoomForm({ ...newRoomForm, floor: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl focus:border-[#FF6D1F] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">Capacity (Beds)</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={newRoomForm.capacity}
                    onChange={(e) => setNewRoomForm({ ...newRoomForm, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl focus:border-[#FF6D1F] outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddRoomModal(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addRoomLoading}
                  className="px-4 py-1.5 rounded-xl bg-[#FF6D1F] hover:bg-[#FF8540] text-black font-extrabold"
                >
                  {addRoomLoading ? "Creating..." : "Create Room"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Bed Allocation Modal */}
      {showAllocateModal && selectedBedToAllocate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="glass-panel rounded-3xl border border-[var(--border-subtle)] max-w-md w-full p-6 shadow-elevated space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <div>
                <h3 className="font-bold text-sm text-[var(--text-primary)]">
                  Assign Bed in {assignedHostel}
                </h3>
                <span className="text-[11px] text-[var(--text-muted)] font-mono">
                  Room {selectedBedToAllocate.roomNumber} • {selectedBedToAllocate.bedNumber}
                </span>
              </div>
              <button onClick={() => setShowAllocateModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                  Choose Resident to Assign *
                </label>
                <select
                  value={selectedStudentToAllocate}
                  onChange={(e) => setSelectedStudentToAllocate(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl focus:border-[#FF6D1F] outline-none"
                >
                  <option value="">-- Select Resident --</option>
                  {students
                    .filter((s) => !s.roomNumber || s.roomNumber === "Unassigned")
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.rollNumber} - {s.branch || s.course})
                      </option>
                    ))}
                </select>
                {students.filter((s) => !s.roomNumber || s.roomNumber === "Unassigned").length === 0 && (
                  <p className="text-[10px] text-[var(--text-muted)] mt-1 italic">
                    All residents in {assignedHostel} currently have assigned beds.
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAllocateModal(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAllocateBed}
                  disabled={!selectedStudentToAllocate}
                  className="px-4 py-1.5 rounded-xl bg-[#FF6D1F] hover:bg-[#FF8540] text-black font-extrabold disabled:opacity-50"
                >
                  Confirm Allocation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WardenOperationsDashboard;
