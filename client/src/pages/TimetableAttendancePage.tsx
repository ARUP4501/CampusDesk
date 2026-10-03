import React, { useState, useEffect, useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  Calendar,
  AlertTriangle,
  Clock,
  MapPin,
  Plus,
  X,
  BookOpen,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  BarChart3,
  CalendarDays,
  ArrowRight,
  Users,
  Save,
  RefreshCw,
  Check,
  XCircle,
  ChevronRight,
  Info,
  Building,
  GraduationCap
} from "lucide-react";
import { apiRequest, UserProfile } from "../api/client.js";

interface ScheduleItem {
  id: string;
  subjectCode: string;
  subjectName: string;
  facultyName: string;
  facultyId?: string | null;
  subjectId?: string | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string;
  section?: string;
  course?: string;
  branch?: string;
  year?: number;
  semester?: number;
  isAttendanceMarked?: boolean;
}

interface ClassCancellationItem {
  id: string;
  subjectName: string;
  facultyName: string;
  date: string;
  branch: string;
  year: number;
  reason: string;
  postedBy: { fullName: string; department?: string };
}

export const TimetableAttendancePage: React.FC<{ user: UserProfile | null }> = ({ user }) => {
  // Role / Permission Protection: Only Student, Faculty, and Admin may view academic attendance
  if (user && user.role !== "STUDENT" && user.role !== "FACULTY" && user.role !== "ADMIN") {
    return <Navigate to={user.role === "WARDEN" ? "/admin" : (user.role === "SECURITY" || user.department?.toLowerCase().includes("security") ? "/gate-log" : "/dashboard")} replace />;
  }

  const isFaculty = user?.role === "FACULTY";
  const isStaffOrAdmin = user && (user.role === "STAFF" || user.role === "ADMIN" || user.role === "FACULTY");

  const [activeTab, setActiveTab] = useState<"timetable" | "attendance">("timetable");
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [cancellations, setCancellations] = useState<ClassCancellationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay() || 1); // 1 = Mon

  // Faculty Attendance Marking State
  const [selectedClass, setSelectedClass] = useState<ScheduleItem | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [sessionTopic, setSessionTopic] = useState<string>("");
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, "PRESENT" | "ABSENT">>({});
  const [markingLoading, setMarkingLoading] = useState<boolean>(false);
  const [markingError, setMarkingError] = useState<string | null>(null);
  const [markingSuccessMsg, setMarkingSuccessMsg] = useState<string | null>(null);
  const [isPreviouslySaved, setIsPreviouslySaved] = useState<boolean>(false);
  const [savedSessionMeta, setSavedSessionMeta] = useState<any | null>(null);

  // Attendance state for students
  const [attendanceData, setAttendanceData] = useState<{
    subjectWise: any[];
    overall: {
      totalClasses: number;
      attendedClasses: number;
      percentage: number;
      isShortage: boolean;
    };
    history: any[];
  } | null>(null);

  // Cancellation post modal (Faculty/Staff/Admin)
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [cancelForm, setCancelForm] = useState({
    subjectName: "",
    facultyName: user?.fullName || "",
    date: new Date().toISOString().slice(0, 10),
    branch: user?.branch || "CSE",
    year: user?.year || 2,
    reason: ""
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [schedRes, cancelRes] = await Promise.all([
        apiRequest<{ schedule: ScheduleItem[] }>("/api/academic/timetable"),
        apiRequest<{ cancellations: ClassCancellationItem[] }>("/api/academic/cancellations")
      ]);

      const loadedSchedule = schedRes.schedule || [];
      setSchedule(loadedSchedule);
      setCancellations(cancelRes.cancellations || []);

      // If student or admin, also fetch personal attendance summary
      if (user?.role === "STUDENT" || user?.role === "ADMIN") {
        try {
          const attRes = await apiRequest<any>("/api/academic/attendance/student");
          setAttendanceData(attRes);
        } catch (e) {
          console.error("Failed to load student attendance:", e);
        }
      }
    } catch (err) {
      console.error("Failed to load academic schedule data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Deduplicate assigned classes for Faculty attendance selector
  const assignedClasses = useMemo(() => {
    if (!isFaculty) return [];
    const map = new Map<string, ScheduleItem>();
    schedule.forEach((item) => {
      const key = `${item.course || "B.Tech"}_${item.branch || "CSE"}_${item.semester || 1}_${item.section || "A"}_${item.subjectCode}`;
      if (!map.has(key)) {
        map.set(key, item);
      }
    });
    return Array.from(map.values());
  }, [schedule, isFaculty]);

  // Load student roster for a class and target date
  const loadRosterForClass = async (cls: ScheduleItem, targetDate?: string) => {
    setSelectedClass(cls);
    setMarkingLoading(true);
    setMarkingError(null);
    setMarkingSuccessMsg(null);
    const dateToUse = targetDate || selectedDate;

    try {
      const query = new URLSearchParams({
        course: cls.course || "B.Tech",
        branch: cls.branch || "CSE",
        semester: String(cls.semester || 1),
        section: cls.section || "A",
        date: dateToUse
      });
      if (cls.subjectId) query.set("subjectId", cls.subjectId);
      if (cls.subjectCode) query.set("subjectCode", cls.subjectCode);
      if (cls.id) query.set("timetableEntryId", cls.id);
      if (cls.year) query.set("year", String(cls.year));

      const res = await apiRequest<{
        students: any[];
        subjectId?: string;
        session?: any;
      }>(`/api/academic/attendance/class-students?${query.toString()}`);

      setClassStudents(res.students || []);

      if (res.subjectId && !cls.subjectId) {
        setSelectedClass({ ...cls, subjectId: res.subjectId });
      }

      // Populate attendance records: if student has savedStatus from database, use it! Otherwise default to PRESENT
      const initial: Record<string, "PRESENT" | "ABSENT"> = {};
      (res.students || []).forEach((s: any) => {
        initial[s.id] = s.savedStatus === "ABSENT" ? "ABSENT" : "PRESENT";
      });
      setAttendanceRecords(initial);

      if (res.session?.isAttendanceMarked) {
        setIsPreviouslySaved(true);
        setSavedSessionMeta(res.session);
        setSessionTopic(res.session.topic || "");
      } else {
        setIsPreviouslySaved(false);
        setSavedSessionMeta(null);
        setSessionTopic("");
      }
    } catch (err: any) {
      setMarkingError(err.message || "Failed to load student roster for this class.");
    } finally {
      setMarkingLoading(false);
    }
  };

  // Handle class selection directly from timetable card or selector
  const handleSelectClass = (cls: ScheduleItem) => {
    setActiveTab("attendance");
    loadRosterForClass(cls, selectedDate);
  };

  // Handle date change in marking panel
  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    if (selectedClass) {
      loadRosterForClass(selectedClass, newDate);
    }
  };

  // Toggle present / absent for a student
  const handleToggleStatus = (studentId: string, status: "PRESENT" | "ABSENT") => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: status
    }));
  };

  // Batch mark all students
  const handleMarkAll = (status: "PRESENT" | "ABSENT") => {
    const updated: Record<string, "PRESENT" | "ABSENT"> = {};
    classStudents.forEach((s) => {
      updated[s.id] = status;
    });
    setAttendanceRecords(updated);
  };

  // Save / Submit Attendance Roster
  const handleSaveAttendance = async () => {
    if (!selectedClass) return;
    if (classStudents.length === 0) {
      setMarkingError("No students enrolled in this class to record attendance.");
      return;
    }

    setMarkingLoading(true);
    setMarkingError(null);
    setMarkingSuccessMsg(null);

    try {
      const payload = {
        timetableEntryId: selectedClass.id,
        subjectId: selectedClass.subjectId,
        course: selectedClass.course || "B.Tech",
        branch: selectedClass.branch || "CSE",
        year: selectedClass.year || 1,
        semester: selectedClass.semester || 1,
        section: selectedClass.section || "A",
        date: selectedDate,
        topic: sessionTopic.trim() || null,
        startTime: selectedClass.startTime,
        endTime: selectedClass.endTime,
        records: classStudents.map((s) => ({
          studentId: s.id,
          status: attendanceRecords[s.id] || "PRESENT",
          remarks: null
        }))
      };

      await apiRequest("/api/academic/attendance/sessions", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      setIsPreviouslySaved(true);
      setMarkingSuccessMsg(`Attendance saved and synced to database successfully for ${selectedDate}.`);

      // Re-load roster from server to lock in confirmed persisted status
      await loadRosterForClass(selectedClass, selectedDate);
      fetchData();
    } catch (err: any) {
      setMarkingError(err.message || "Failed to submit attendance.");
    } finally {
      setMarkingLoading(false);
    }
  };

  // Metrics for active roster
  const presentCount = useMemo(() => {
    return classStudents.filter((s) => attendanceRecords[s.id] === "PRESENT").length;
  }, [classStudents, attendanceRecords]);

  const absentCount = classStudents.length - presentCount;
  const attendanceRate = classStudents.length > 0 ? Math.round((presentCount / classStudents.length) * 100) : 0;

  const handlePostCancellation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest("/api/academic/cancellations", {
        method: "POST",
        body: JSON.stringify(cancelForm)
      });
      setShowCancelModal(false);
      setCancelForm({
        subjectName: "",
        facultyName: user?.fullName || "",
        date: new Date().toISOString().slice(0, 10),
        branch: user?.branch || "CSE",
        year: user?.year || 2,
        reason: ""
      });
      fetchData();
    } catch (err: any) {
      alert("Failed to post cancellation: " + err.message);
    }
  };

  const days = [
    { num: 1, name: "Monday" },
    { num: 2, name: "Tuesday" },
    { num: 3, name: "Wednesday" },
    { num: 4, name: "Thursday" },
    { num: 5, name: "Friday" },
    { num: 6, name: "Saturday" }
  ];

  const currentDayClasses = schedule.filter((s) => s.dayOfWeek === selectedDay);

  return (
    <div className="space-y-6 pb-16 animate-fadeIn">
      {/* Top Header */}
      <div className="campus-panel border border-[var(--border-subtle)] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="editorial-eyebrow">02 // ACADEMIC SCHEDULE</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-1">
              <Calendar className="w-3 h-3 text-emerald-400" />
              {isFaculty ? "FACULTY ATTENDANCE & SCHEDULE" : "SEMESTER TIMETABLE"}
            </span>
          </div>
          <h1 className="editorial-title text-2xl sm:text-3xl text-[var(--text-primary)] mt-1">
            {isFaculty ? "Faculty Attendance & Timetable" : "Lecture Timetable & Attendance"}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
            {isFaculty
              ? "Mark daily class attendance, record student rosters with instant PostgreSQL sync, and review weekly schedule."
              : "Weekly class schedule, subject-wise attendance tracking, and real-time class cancellations."}
          </p>
        </div>

        <div className="flex items-center space-x-2.5 font-mono text-xs">
          {isFaculty && (
            <Link
              to="/faculty"
              className="btn-primary inline-flex items-center space-x-2 px-4 py-2 rounded-xl font-bold"
            >
              <span>Faculty Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}

          {isStaffOrAdmin && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="btn-secondary inline-flex items-center space-x-2 px-3.5 py-2 font-semibold rounded-xl"
            >
              <Plus className="w-3.5 h-3.5 text-[#FF6D1F]" />
              <span>Post Cancellation</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-[var(--border-subtle)] gap-2 overflow-x-auto pb-1 text-xs font-mono">
        <button
          onClick={() => setActiveTab("timetable")}
          className={`py-2 px-4 rounded-xl font-bold flex items-center space-x-2 transition-all whitespace-nowrap ${
            activeTab === "timetable"
              ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)]"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
          }`}
        >
          <CalendarDays className={`w-3.5 h-3.5 ${activeTab === "timetable" ? "text-[#FF6D1F]" : ""}`} />
          <span>01 {isFaculty ? "ASSIGNED TIMETABLE" : "LECTURE TIMETABLE"}</span>
        </button>

        <button
          onClick={() => setActiveTab("attendance")}
          className={`py-2 px-4 rounded-xl font-bold flex items-center space-x-2 transition-all whitespace-nowrap ${
            activeTab === "attendance"
              ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)]"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
          }`}
        >
          {isFaculty ? (
            <UserCheck className={`w-3.5 h-3.5 ${activeTab === "attendance" ? "text-[#FF6D1F]" : ""}`} />
          ) : (
            <BarChart3 className={`w-3.5 h-3.5 ${activeTab === "attendance" ? "text-[#FF6D1F]" : ""}`} />
          )}
          <span>02 {isFaculty ? "RECORD ATTENDANCE" : "ATTENDANCE TELEMETRY"}</span>
        </button>
      </div>

      {/* TAB 1: TIMETABLE & CANCELLATIONS */}
      {activeTab === "timetable" && (
        <div className="space-y-6">
          {/* Real-time Class Cancellation Alerts */}
          {cancellations.length > 0 && (
            <div className="space-y-2.5">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF6D1F] flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-[#FF6D1F]" />
                <span>Live Class Cancellation Notices ({cancellations.length})</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {cancellations.map((c) => (
                  <div key={c.id} className="p-4 bg-[var(--bg-elevated)] border border-[#FF6D1F]/30 rounded-xl space-y-1 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[var(--text-primary)] font-sans">{c.subjectName}</span>
                      <span className="text-[10px] text-[var(--text-muted)]">{new Date(c.date).toLocaleDateString()}</span>
                    </div>
                    <p className="text-[var(--text-secondary)]">Faculty: <strong className="text-[var(--text-primary)]">{c.facultyName}</strong> • {c.branch} Year {c.year}</p>
                    <p className="text-[11px] text-[var(--text-secondary)] italic mt-1 bg-[var(--bg-input)] p-2 rounded-lg border border-[var(--border-subtle)] font-sans">
                      &quot;{c.reason}&quot;
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Days Selector */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 font-mono text-xs">
            {days.map((d) => (
              <button
                key={d.num}
                onClick={() => setSelectedDay(d.num)}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                  selectedDay === d.num
                    ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                }`}
              >
                {d.name}
              </button>
            ))}
          </div>

          {/* Current Day Schedule List */}
          <div className="space-y-3">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
              {days.find((d) => d.num === selectedDay)?.name}&apos;s Lectures ({currentDayClasses.length})
            </h2>

            {currentDayClasses.length === 0 ? (
              <div className="campus-panel p-8 text-center rounded-2xl border border-[var(--border-subtle)] text-xs text-[var(--text-muted)] font-mono">
                No lectures scheduled for {days.find((d) => d.num === selectedDay)?.name}.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {currentDayClasses.map((item) => (
                  <div
                    key={item.id}
                    className="campus-block p-4 rounded-xl border border-[var(--border-subtle)] space-y-2 text-xs hover:border-[#FF6D1F]/40 transition-all font-mono"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-[#FF6D1F]">{item.subjectCode}</span>
                        {item.course && item.branch && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--bg-input)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                            {item.course} {item.branch} · S{item.semester || 1} {item.section ? `Sec ${item.section}` : ""}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1 font-bold text-[10px] text-[var(--text-primary)] bg-[var(--bg-input)] px-2 py-0.5 rounded border border-[var(--border-subtle)]">
                        <Clock className="w-3 h-3 text-[#FF6D1F]" />
                        <span>{item.startTime} – {item.endTime}</span>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-[var(--text-primary)] font-sans">{item.subjectName}</h3>

                    <div className="pt-2 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <div className="flex items-center space-x-1.5 text-[var(--text-secondary)]">
                        <MapPin className="w-3 h-3 text-[var(--text-muted)]" />
                        <span>Room: <strong className="text-[var(--text-primary)]">{item.room}</strong></span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-[var(--text-secondary)]">
                        <UserCheck className="w-3 h-3 text-[var(--text-muted)]" />
                        <span>Faculty: <strong className="text-[var(--text-primary)]">{item.facultyName}</strong></span>
                      </div>
                    </div>

                    {/* Faculty Action: Directly Mark Attendance */}
                    {isFaculty && (
                      <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-end">
                        <button
                          onClick={() => handleSelectClass(item)}
                          className="px-3 py-1.5 rounded-lg bg-[#FF6D1F]/20 hover:bg-[#FF6D1F]/30 text-[#FF6D1F] border border-[#FF6D1F]/40 text-xs font-mono font-bold flex items-center space-x-1.5 transition-colors"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Mark Attendance</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ATTENDANCE */}
      {activeTab === "attendance" && (
        <div className="space-y-6">
          {/* FACULTY ATTENDANCE MARKING INTERFACE */}
          {isFaculty ? (
            <div className="space-y-6">
              {/* Top Banner & Active Class Context */}
              <div className="campus-panel p-5 sm:p-6 rounded-2xl border border-[var(--border-subtle)] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="editorial-eyebrow text-[#FF6D1F]">FACULTY ATTENDANCE COMMAND</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                      ASSIGNED CLASSES ONLY
                    </span>
                  </div>
                  <h2 className="editorial-title text-xl text-[var(--text-primary)] mt-1">
                    {selectedClass
                      ? `${selectedClass.subjectName} (${selectedClass.subjectCode})`
                      : "Select Assigned Class Session"}
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-mono">
                    {selectedClass
                      ? `${selectedClass.course} ${selectedClass.branch} · Year ${selectedClass.year || 1} · Semester ${selectedClass.semester || 1} · Section ${selectedClass.section || "A"} · Room ${selectedClass.room}`
                      : "Choose an assigned lecture session from your roster below to record attendance."}
                  </p>
                </div>

                {/* Date Selector & Class Switcher */}
                <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                  <div className="flex items-center space-x-2 bg-[var(--bg-input)] px-3 py-1.5 rounded-xl border border-[var(--border-subtle)]">
                    <Calendar className="w-3.5 h-3.5 text-[#FF6D1F]" />
                    <label className="text-[10px] text-[var(--text-muted)] uppercase">Date:</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="bg-transparent text-[var(--text-primary)] text-xs font-bold font-mono focus:outline-none cursor-pointer"
                    />
                  </div>

                  {selectedClass && (
                    <button
                      onClick={() => {
                        setSelectedClass(null);
                        setClassStudents([]);
                        setMarkingSuccessMsg(null);
                        setMarkingError(null);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] text-xs font-mono transition-colors"
                    >
                      Change Class
                    </button>
                  )}
                </div>
              </div>

              {/* Class Selector Grid when no class is currently open */}
              {!selectedClass && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-primary)]">
                      Your Assigned Classes ({assignedClasses.length})
                    </h3>
                    <span className="text-[11px] font-mono text-[var(--text-muted)]">
                      Select any class to load the student roster
                    </span>
                  </div>

                  {assignedClasses.length === 0 ? (
                    <div className="campus-panel p-12 text-center rounded-2xl border border-[var(--border-subtle)] text-xs text-[var(--text-muted)] font-mono">
                      No teaching assignments found for your faculty account.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {assignedClasses.map((cls) => (
                        <div
                          key={cls.id}
                          onClick={() => handleSelectClass(cls)}
                          className="campus-block p-5 rounded-2xl border border-[var(--border-subtle)] hover:border-[#FF6D1F]/50 transition-all cursor-pointer space-y-3 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs font-mono text-[#FF6D1F]">{cls.subjectCode}</span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-input)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                                {cls.course} {cls.branch} · S{cls.semester || 1} Sec {cls.section || "A"}
                              </span>
                            </div>

                            <h4 className="text-sm font-bold text-[var(--text-primary)] font-sans mt-2">{cls.subjectName}</h4>

                            <p className="text-[11px] font-mono text-[var(--text-secondary)] mt-1 flex items-center space-x-1.5">
                              <Clock className="w-3.5 h-3.5 text-[#FF6D1F]" />
                              <span>{cls.startTime} – {cls.endTime} · Rm {cls.room}</span>
                            </p>
                          </div>

                          <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                            <span className="text-[10px] font-mono text-[var(--text-muted)]">Assigned Faculty Class</span>
                            <span className="text-xs font-mono font-bold text-[#FF6D1F] flex items-center space-x-1">
                              <span>Open Roster</span>
                              <ChevronRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ACTIVE STUDENT ATTENDANCE ROSTER PANEL */}
              {selectedClass && (
                <div className="space-y-4">
                  {/* Feedback Messages */}
                  {markingSuccessMsg && (
                    <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center space-x-2 text-xs font-mono text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{markingSuccessMsg}</span>
                    </div>
                  )}

                  {markingError && (
                    <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-center space-x-2 text-xs font-mono text-rose-300">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{markingError}</span>
                    </div>
                  )}

                  {/* Session Topic & Summary Bar */}
                  <div className="campus-panel p-5 rounded-2xl border border-[var(--border-subtle)] space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                      <div className="sm:col-span-8">
                        <label className="block text-[10px] font-mono uppercase text-[var(--text-secondary)] mb-1">
                          Lecture Topic / Curricular Notes (Optional)
                        </label>
                        <input
                          type="text"
                          value={sessionTopic}
                          onChange={(e) => setSessionTopic(e.target.value)}
                          placeholder="e.g. Unit 3: Dynamic Memory Allocation, Malloc and Calloc"
                          className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-xs font-mono placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF6D1F]"
                        />
                      </div>

                      <div className="sm:col-span-4 flex items-end justify-start sm:justify-end">
                        {isPreviouslySaved ? (
                          <div className="px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 dark:text-emerald-300 font-mono text-xs flex items-center space-x-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>SAVED IN DATABASE</span>
                          </div>
                        ) : (
                          <div className="px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 dark:text-amber-300 font-mono text-xs flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-amber-400" />
                            <span>NOT SAVED YET FOR TODAY</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Metrics Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[var(--border-subtle)] font-mono">
                      <div className="p-3 bg-[var(--bg-input)] rounded-xl border border-[var(--border-subtle)]">
                        <span className="text-[10px] text-[var(--text-muted)] block uppercase">Total Enrolled</span>
                        <span className="text-xl font-black text-[var(--text-primary)]">{classStudents.length}</span>
                      </div>

                      <div className="p-3 bg-[var(--bg-input)] rounded-xl border border-[var(--border-subtle)]">
                        <span className="text-[10px] text-[var(--text-muted)] block uppercase">Present</span>
                        <span className="text-xl font-black text-emerald-400">{presentCount}</span>
                      </div>

                      <div className="p-3 bg-[var(--bg-input)] rounded-xl border border-[var(--border-subtle)]">
                        <span className="text-[10px] text-[var(--text-muted)] block uppercase">Absent</span>
                        <span className="text-xl font-black text-rose-400">{absentCount}</span>
                      </div>

                      <div className="p-3 bg-[var(--bg-input)] rounded-xl border border-[var(--border-subtle)]">
                        <span className="text-[10px] text-[var(--text-muted)] block uppercase">Attendance Rate</span>
                        <span className={`text-xl font-black ${attendanceRate >= 75 ? "text-emerald-400" : "text-rose-400"}`}>
                          {attendanceRate}%
                        </span>
                      </div>
                    </div>

                    {/* Quick Batch Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div className="flex items-center space-x-2 font-mono text-xs">
                        <span className="text-[var(--text-muted)] text-[11px]">Quick Batch:</span>
                        <button
                          type="button"
                          onClick={() => handleMarkAll("PRESENT")}
                          className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 dark:text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-colors"
                        >
                          Mark All Present
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMarkAll("ABSENT")}
                          className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-500 dark:text-rose-300 border border-rose-500/40 text-xs font-bold transition-colors"
                        >
                          Mark All Absent
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleSaveAttendance}
                        disabled={markingLoading || classStudents.length === 0}
                        className="btn-primary px-5 py-2 text-xs font-mono font-bold rounded-xl flex items-center space-x-2 transition-all shadow-md disabled:opacity-50"
                      >
                        {markingLoading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        <span>{isPreviouslySaved ? "UPDATE ATTENDANCE" : "SAVE ATTENDANCE ROSTER"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Student Roster Table */}
                  <div className="campus-panel rounded-2xl border border-[var(--border-subtle)] overflow-hidden">
                    <div className="p-4 bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] flex items-center justify-between">
                      <div className="flex items-center space-x-2 font-mono text-xs text-[var(--text-primary)]">
                        <Users className="w-4 h-4 text-[#FF6D1F]" />
                        <span className="font-bold uppercase tracking-wider">
                          Student Attendance Roster ({classStudents.length} Students)
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-[var(--text-muted)]">
                        Date: <strong className="text-[var(--text-primary)]">{selectedDate}</strong>
                      </span>
                    </div>

                    {markingLoading && classStudents.length === 0 ? (
                      <div className="p-12 text-center text-xs font-mono text-[var(--text-muted)]">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#FF6D1F]" />
                        <span>Loading verified student roster...</span>
                      </div>
                    ) : classStudents.length === 0 ? (
                      <div className="p-12 text-center text-xs font-mono text-[var(--text-muted)]">
                        No active students found in this course/branch/section.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-[var(--bg-input)] border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-mono text-[10px] uppercase">
                              <th className="py-3 px-4 w-12 text-center">#</th>
                              <th className="py-3 px-4 w-36">Roll Number</th>
                              <th className="py-3 px-4">Student Name & Email</th>
                              <th className="py-3 px-4 w-24 text-center">Section</th>
                              <th className="py-3 px-4 w-64 text-center">Attendance Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--border-subtle)] font-mono text-xs">
                            {classStudents.map((student, idx) => {
                              const currentStatus = attendanceRecords[student.id] || "PRESENT";
                              const isPresent = currentStatus === "PRESENT";
                              const isAbsent = currentStatus === "ABSENT";

                              return (
                                <tr
                                  key={student.id}
                                  className="hover:bg-[var(--bg-elevated)] transition-colors"
                                >
                                  <td className="py-3 px-4 text-center text-[var(--text-muted)]">{idx + 1}</td>
                                  <td className="py-3 px-4 font-bold text-[#FF6D1F]">{student.rollNumber || "N/A"}</td>
                                  <td className="py-3 px-4">
                                    <div className="font-bold text-[var(--text-primary)] font-sans">{student.fullName}</div>
                                    <div className="text-[10px] text-[var(--text-muted)]">{student.email}</div>
                                  </td>
                                  <td className="py-3 px-4 text-center text-[var(--text-secondary)]">{student.section || "A"}</td>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center justify-center space-x-2">
                                      {/* PRESENT BUTTON */}
                                      <button
                                        type="button"
                                        onClick={() => handleToggleStatus(student.id, "PRESENT")}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono flex items-center space-x-1.5 transition-all ${
                                          isPresent
                                            ? "bg-emerald-500 text-black border-2 border-emerald-400 shadow-md font-extrabold"
                                            : "bg-[var(--bg-input)] text-emerald-500 dark:text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/50 hover:text-emerald-400"
                                        }`}
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                        <span>PRESENT</span>
                                      </button>

                                      {/* ABSENT BUTTON */}
                                      <button
                                        type="button"
                                        onClick={() => handleToggleStatus(student.id, "ABSENT")}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono flex items-center space-x-1.5 transition-all ${
                                          isAbsent
                                            ? "bg-rose-600 text-white border-2 border-rose-500 shadow-md font-extrabold"
                                            : "bg-[var(--bg-input)] text-rose-500 dark:text-rose-400 border border-rose-500/20 hover:border-rose-500/50 hover:text-rose-400"
                                        }`}
                                      >
                                        <X className="w-3.5 h-3.5" />
                                        <span>ABSENT</span>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Bottom Save Action Bar */}
                    {classStudents.length > 0 && (
                      <div className="p-4 bg-[var(--bg-elevated)] border-t border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 font-mono text-xs">
                        <div className="text-[var(--text-secondary)] text-[11px]">
                          Changes are verified and persisted to PostgreSQL upon clicking Save.
                        </div>

                        <button
                          type="button"
                          onClick={handleSaveAttendance}
                          disabled={markingLoading}
                          className="btn-primary px-6 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center space-x-2 transition-all shadow-md disabled:opacity-50"
                        >
                          {markingLoading ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          <span>{isPreviouslySaved ? "UPDATE ATTENDANCE ROSTER" : "SAVE & PERSIST ATTENDANCE"}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* STUDENT & ADMIN ATTENDANCE SUMMARY & HISTORY */
            <>
              {attendanceData ? (
                <>
                  {/* Overall Summary Card */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
                    <div className="campus-block p-5 rounded-2xl border border-[var(--border-subtle)] space-y-1">
                      <span className="text-[10px] text-[var(--text-muted)] uppercase block">OVERALL ATTENDANCE</span>
                      <div className="flex items-baseline space-x-2">
                        <span className={`text-3xl font-black ${attendanceData.overall.isShortage ? "text-rose-400" : "text-[#FF6D1F]"}`}>
                          {attendanceData.overall.percentage}%
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold block pt-0.5 ${attendanceData.overall.isShortage ? "text-rose-400" : "text-emerald-400"}`}>
                        {attendanceData.overall.isShortage ? "Shortage Warning (< 75% Criteria)" : "Compliant with 75% Criteria"}
                      </span>
                    </div>

                    <div className="campus-block p-5 rounded-2xl border border-[var(--border-subtle)] space-y-1">
                      <span className="text-[10px] text-[var(--text-muted)] uppercase block">TOTAL LECTURES HELD</span>
                      <div className="text-3xl font-black text-[var(--text-primary)]">{attendanceData.overall.totalClasses}</div>
                      <span className="text-[10px] text-[var(--text-muted)] block pt-0.5">Across all registered subjects</span>
                    </div>

                    <div className="campus-block p-5 rounded-2xl border border-[var(--border-subtle)] space-y-1">
                      <span className="text-[10px] text-[var(--text-muted)] uppercase block">LECTURES ATTENDED</span>
                      <div className="text-3xl font-black text-emerald-400">{attendanceData.overall.attendedClasses}</div>
                      <span className="text-[10px] text-[var(--text-muted)] block pt-0.5">Physical lecture attendance</span>
                    </div>
                  </div>

                  {/* Subject-Wise Attendance Breakdown */}
                  <div className="campus-panel rounded-2xl p-5 sm:p-6 border border-[var(--border-subtle)] space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-primary)]">Course-Wise Attendance Telemetry</h2>
                      <span className="text-xs text-[var(--text-muted)] font-mono">Min Requirement: 75%</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-[var(--bg-input)] border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-mono text-[10px] uppercase">
                            <th className="py-3 px-3">Subject</th>
                            <th className="py-3 px-3 text-center">Total Held</th>
                            <th className="py-3 px-3 text-center">Attended</th>
                            <th className="py-3 px-3 text-center">Absent</th>
                            <th className="py-3 px-3 text-center">Percentage</th>
                            <th className="py-3 px-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-subtle)] font-mono text-xs">
                          {attendanceData.subjectWise.map((sub: any) => (
                            <tr key={sub.id || sub.subjectCode} className="hover:bg-[var(--bg-elevated)] transition-colors">
                              <td className="py-3.5 px-3">
                                <div className="font-bold text-[var(--text-primary)] font-sans">{sub.subjectName}</div>
                                <div className="text-[10px] text-[#FF6D1F] font-mono">{sub.subjectCode}</div>
                              </td>
                              <td className="py-3.5 px-3 text-center text-[var(--text-secondary)]">{sub.totalClasses}</td>
                              <td className="py-3.5 px-3 text-center font-bold text-emerald-400">{sub.attendedClasses}</td>
                              <td className="py-3.5 px-3 text-center text-rose-400">{sub.totalClasses - sub.attendedClasses}</td>
                              <td className="py-3.5 px-3 text-center font-bold">
                                <span className={sub.isShortage ? "text-rose-400" : "text-[var(--text-primary)]"}>
                                  {sub.percentage}%
                                </span>
                              </td>
                              <td className="py-3.5 px-3 text-right">
                                {sub.isShortage ? (
                                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                                    SHORTAGE
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                    ELIGIBLE
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Recent Date-wise History */}
                  {attendanceData.history?.length > 0 && (
                    <div className="campus-panel rounded-2xl p-5 sm:p-6 border border-[var(--border-subtle)] space-y-4">
                      <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-primary)]">Recent Roll Call Log</h2>
                      <div className="space-y-2">
                        {attendanceData.history.map((h: any) => (
                          <div
                            key={h.id}
                            className="p-3 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl flex items-center justify-between text-xs font-mono"
                          >
                            <div>
                              <div className="font-bold text-[var(--text-primary)] font-sans">{h.subjectName}</div>
                              <div className="text-[11px] text-[var(--text-muted)]">
                                {new Date(h.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} • Faculty: {h.facultyName}
                              </div>
                            </div>

                            <span
                              className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                                h.status === "PRESENT"
                                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                  : h.status === "LATE"
                                  ? "bg-amber-500/15 text-amber-500 dark:text-amber-300 border-amber-500/30"
                                  : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                              }`}
                            >
                              {h.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="campus-panel p-12 text-center rounded-2xl border border-[var(--border-subtle)] text-xs text-[var(--text-muted)] font-mono">
                  No attendance records available for your profile.
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Post Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="campus-panel max-w-md w-full p-6 space-y-4 text-xs rounded-2xl border border-[var(--border-subtle)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h3 className="text-sm font-bold text-[var(--text-primary)] font-mono uppercase tracking-wider">Post Class Cancellation Notice</h3>
              <button onClick={() => setShowCancelModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePostCancellation} className="space-y-3.5">
              <div>
                <label className="block text-[var(--text-secondary)] mb-1 font-mono uppercase text-[10px]">Subject Name *</label>
                <input
                  type="text"
                  required
                  value={cancelForm.subjectName}
                  onChange={(e) => setCancelForm({ ...cancelForm, subjectName: e.target.value })}
                  placeholder="e.g. Design & Analysis of Algorithms"
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF6D1F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-mono uppercase text-[10px]">Target Branch *</label>
                  <input
                    type="text"
                    required
                    value={cancelForm.branch}
                    onChange={(e) => setCancelForm({ ...cancelForm, branch: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[#FF6D1F]"
                  />
                </div>
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-mono uppercase text-[10px]">Target Year *</label>
                  <input
                    type="number"
                    min={1}
                    max={4}
                    required
                    value={cancelForm.year}
                    onChange={(e) => setCancelForm({ ...cancelForm, year: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[#FF6D1F]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] mb-1 font-mono uppercase text-[10px]">Cancellation Reason *</label>
                <textarea
                  required
                  rows={3}
                  value={cancelForm.reason}
                  onChange={(e) => setCancelForm({ ...cancelForm, reason: e.target.value })}
                  placeholder="e.g. Faculty attending university curriculum council meeting"
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF6D1F] resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="btn-secondary px-4 py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-5 py-2 text-xs font-bold rounded-xl"
                >
                  Broadcast Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetableAttendancePage;
