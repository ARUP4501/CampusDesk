import React, { useState, useEffect } from "react";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  BookOpen,
  MapPin,
  GraduationCap,
  Save,
  Send,
  UserCheck,
  ChevronRight,
  RefreshCw,
  X,
  FileSpreadsheet,
  Award
} from "lucide-react";
import { apiRequest, UserProfile } from "../api/client.js";

interface FacultyDashboardPageProps {
  user: UserProfile | null;
}

export const FacultyDashboardPage: React.FC<FacultyDashboardPageProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<"today" | "timetable" | "subjects" | "marks">("today");
  const [loading, setLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Data states
  const [todayClasses, setTodayClasses] = useState<any[]>([]);
  const [fullTimetable, setFullTimetable] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);

  // Attendance Marking Modal State
  const [markingClass, setMarkingClass] = useState<any | null>(null);
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, "PRESENT" | "ABSENT" | "LATE">>({});
  const [attendanceTopic, setAttendanceTopic] = useState<string>("");
  const [markingLoading, setMarkingLoading] = useState<boolean>(false);

  // Marks Entry State
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [marksRoster, setMarksRoster] = useState<any[]>([]);
  const [marksLoading, setMarksLoading] = useState<boolean>(false);
  const [savingMarks, setSavingMarks] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchFacultyData = async () => {
    setLoading(true);
    try {
      const [todayRes, timeRes, assignRes] = await Promise.all([
        apiRequest<{ todayClasses: any[] }>("/api/academic/timetable/today"),
        apiRequest<{ schedule: any[] }>("/api/academic/timetable"),
        apiRequest<{ assignments: any[] }>("/api/academic/assignments")
      ]);

      setTodayClasses(todayRes.todayClasses || []);
      setFullTimetable(timeRes.schedule || []);
      setAssignments(assignRes.assignments || []);

      if (assignRes.assignments?.length > 0 && !selectedAssignment) {
        setSelectedAssignment(assignRes.assignments[0]);
      }
    } catch (err: any) {
      console.error("Failed to load faculty portal data:", err);
      showToast(err.message || "Failed to load faculty data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacultyData();
  }, []);

  // Open Attendance Modal for a class
  const handleOpenAttendance = async (cls: any) => {
    setMarkingClass(cls);
    setMarkingLoading(true);
    setAttendanceTopic(cls.topic || "");

    try {
      const query = new URLSearchParams({
        subjectId: cls.subjectId,
        course: cls.course,
        branch: cls.branch,
        year: String(cls.year),
        semester: String(cls.semester),
        section: cls.section
      });

      const res = await apiRequest<{ students: any[] }>(`/api/academic/attendance/class-students?${query.toString()}`);
      setClassStudents(res.students || []);

      // Default all students to PRESENT
      const initial: Record<string, "PRESENT" | "ABSENT" | "LATE"> = {};
      (res.students || []).forEach((s) => {
        initial[s.id] = "PRESENT";
      });
      setAttendanceRecords(initial);
    } catch (err: any) {
      showToast(err.message || "Failed to load class roster.");
    } finally {
      setMarkingLoading(false);
    }
  };

  // Submit Attendance Session
  const handleSubmitAttendance = async () => {
    if (!markingClass) return;
    setMarkingLoading(true);

    try {
      const payload = {
        timetableEntryId: markingClass.id,
        subjectId: markingClass.subjectId,
        course: markingClass.course,
        branch: markingClass.branch,
        year: markingClass.year,
        semester: markingClass.semester,
        section: markingClass.section,
        date: new Date().toISOString().slice(0, 10),
        startTime: markingClass.startTime,
        endTime: markingClass.endTime,
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

      showToast("Attendance marked and student records updated successfully!");
      setMarkingClass(null);
      fetchFacultyData();
    } catch (err: any) {
      showToast(err.message || "Failed to submit attendance.");
    } finally {
      setMarkingLoading(false);
    }
  };

  // Fetch Marks Roster when selected assignment changes
  const fetchMarksRoster = async (assignment: any) => {
    if (!assignment) return;
    setMarksLoading(true);

    try {
      const query = new URLSearchParams({
        subjectId: assignment.subjectId,
        course: assignment.course,
        branch: assignment.branch,
        semester: String(assignment.semester),
        section: assignment.section
      });

      const res = await apiRequest<{ roster: any[] }>(`/api/academic/results/class-marks?${query.toString()}`);
      setMarksRoster(res.roster || []);
    } catch (err: any) {
      showToast(err.message || "Failed to load marks roster.");
    } finally {
      setMarksLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAssignment && activeTab === "marks") {
      fetchMarksRoster(selectedAssignment);
    }
  }, [selectedAssignment, activeTab]);

  // Update local mark row
  const handleMarkChange = (studentId: string, field: string, value: any) => {
    setMarksRoster((prev) =>
      prev.map((row) => {
        if (row.studentId !== studentId) return row;
        const updated = { ...row, [field]: value === "" ? null : Number(value) };
        const total =
          (updated.internalMarks || 0) +
          (updated.assignmentMarks || 0) +
          (updated.practicalMarks || 0) +
          (updated.endSemMarks || 0);

        let grade = "F";
        if (total >= 90) grade = "O";
        else if (total >= 80) grade = "E";
        else if (total >= 70) grade = "A";
        else if (total >= 60) grade = "B";
        else if (total >= 50) grade = "C";
        else if (total >= 40) grade = "D";

        return { ...updated, totalMarks: total, grade };
      })
    );
  };

  // Save or Publish Marks
  const handleSaveMarks = async (status: "DRAFT" | "PUBLISHED") => {
    if (!selectedAssignment || marksRoster.length === 0) return;

    if (status === "PUBLISHED") {
      const confirmed = window.confirm(
        "Are you sure you want to PUBLISH these marks? Published results are immediately visible to students and calculate their semester SGPA."
      );
      if (!confirmed) return;
    }

    setSavingMarks(true);
    try {
      const payload = {
        subjectId: selectedAssignment.subjectId,
        course: selectedAssignment.course,
        branch: selectedAssignment.branch,
        year: selectedAssignment.year,
        semester: selectedAssignment.semester,
        section: selectedAssignment.section,
        status,
        records: marksRoster.map((r) => ({
          studentId: r.studentId,
          internalMarks: r.internalMarks,
          assignmentMarks: r.assignmentMarks,
          practicalMarks: r.practicalMarks,
          endSemMarks: r.endSemMarks,
          totalMarks: r.totalMarks,
          grade: r.grade,
          credits: r.credits || 3,
          status
        }))
      };

      await apiRequest("/api/academic/results/batch-save", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      showToast(status === "PUBLISHED" ? "Marks successfully published to students!" : "Marks saved as Draft.");
      fetchMarksRoster(selectedAssignment);
    } catch (err: any) {
      showToast(err.message || "Failed to save marks.");
    } finally {
      setSavingMarks(false);
    }
  };

  const dayNames = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const pendingCount = todayClasses.filter((c) => !c.isAttendanceMarked).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#4D2A00] text-[#FFF6ED] px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-2 text-xs font-semibold animate-slideUp">
          <CheckCircle2 className="w-4 h-4 text-[#FDB773]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Faculty Profile Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-[rgba(77,42,0,0.1)] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-glass">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-[#CC6F00] text-white flex items-center justify-center font-bold text-xl shadow-md">
            {user?.fullName?.charAt(0) || "F"}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-extrabold text-[#4D2A00]">{user?.fullName}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#CC6F00]/15 text-[#CC6F00] border border-[#CC6F00]/30 uppercase">
                Faculty Member
              </span>
            </div>
            <p className="text-xs text-[#4D2A00]/70 mt-0.5">
              {user?.department} • Employee ID: <span className="font-mono font-semibold">{user?.employeeId || "FAC-EMP"}</span>
            </p>
            <p className="text-[11px] text-[#4D2A00]/50 font-mono mt-0.5">{user?.email}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchFacultyData}
            disabled={loading}
            className="btn-secondary px-4 py-2.5 text-xs flex items-center space-x-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Portal</span>
          </button>
        </div>
      </div>

      {/* Quick Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-card p-4 rounded-3xl border border-[rgba(77,42,0,0.1)] space-y-1">
          <span className="text-[10px] font-mono text-[#4D2A00]/60 uppercase block">Today&apos;s Lectures</span>
          <p className="text-2xl font-black text-[#4D2A00]">{todayClasses.length}</p>
          <span className="text-[10px] text-[#4D2A00]/70">Scheduled today</span>
        </div>

        <div className="glass-card p-4 rounded-3xl border border-[rgba(77,42,0,0.1)] space-y-1">
          <span className="text-[10px] font-mono text-[#4D2A00]/60 uppercase block">Pending Attendance</span>
          <p className={`text-2xl font-black ${pendingCount > 0 ? "text-amber-600" : "text-emerald-700"}`}>
            {pendingCount}
          </p>
          <span className="text-[10px] text-[#4D2A00]/70">Requires marking</span>
        </div>

        <div className="glass-card p-4 rounded-3xl border border-[rgba(77,42,0,0.1)] space-y-1">
          <span className="text-[10px] font-mono text-[#4D2A00]/60 uppercase block">Assigned Classes</span>
          <p className="text-2xl font-black text-[#4D2A00]">{assignments.length}</p>
          <span className="text-[10px] text-[#4D2A00]/70">Subjects & sections</span>
        </div>

        <div className="glass-card p-4 rounded-3xl border border-[rgba(77,42,0,0.1)] space-y-1">
          <span className="text-[10px] font-mono text-[#4D2A00]/60 uppercase block">Weekly Lectures</span>
          <p className="text-2xl font-black text-[#4D2A00]">{fullTimetable.length}</p>
          <span className="text-[10px] text-[#4D2A00]/70">Total weekly slots</span>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-[rgba(77,42,0,0.1)] gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveTab("today")}
          className={`py-2 px-4 rounded-xl font-bold flex items-center space-x-2 transition-all whitespace-nowrap ${
            activeTab === "today"
              ? "bg-[#CC6F00] text-white shadow-sm"
              : "bg-white/40 text-[#4D2A00]/70 hover:bg-white/70 hover:text-[#4D2A00]"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Today&apos;s Lectures & Attendance ({todayClasses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("timetable")}
          className={`py-2 px-4 rounded-xl font-bold flex items-center space-x-2 transition-all whitespace-nowrap ${
            activeTab === "timetable"
              ? "bg-[#CC6F00] text-white shadow-sm"
              : "bg-white/40 text-[#4D2A00]/70 hover:bg-white/70 hover:text-[#4D2A00]"
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          <span>Weekly Timetable ({fullTimetable.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("subjects")}
          className={`py-2 px-4 rounded-xl font-bold flex items-center space-x-2 transition-all whitespace-nowrap ${
            activeTab === "subjects"
              ? "bg-[#CC6F00] text-white shadow-sm"
              : "bg-white/40 text-[#4D2A00]/70 hover:bg-white/70 hover:text-[#4D2A00]"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Assigned Subjects ({assignments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("marks")}
          className={`py-2 px-4 rounded-xl font-bold flex items-center space-x-2 transition-all whitespace-nowrap ${
            activeTab === "marks"
              ? "bg-[#CC6F00] text-white shadow-sm"
              : "bg-white/40 text-[#4D2A00]/70 hover:bg-white/70 hover:text-[#4D2A00]"
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Enter / Publish Marks</span>
        </button>
      </div>

      {/* TAB 1: TODAY'S CLASSES */}
      {activeTab === "today" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#4D2A00] flex items-center space-x-2">
              <Clock className="w-4 h-4 text-[#CC6F00]" />
              <span>Today&apos;s Class Schedule & Attendance Actions</span>
            </h2>
            <span className="text-xs text-[#4D2A00]/60">
              {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
            </span>
          </div>

          {todayClasses.length === 0 ? (
            <div className="glass-panel p-8 text-center rounded-3xl border border-[rgba(77,42,0,0.1)] text-[#4D2A00]/70 text-xs">
              <p className="font-semibold text-sm text-[#4D2A00]">No lectures scheduled for you today.</p>
              <p className="mt-1">Check your weekly timetable tab for your upcoming days.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {todayClasses.map((cls) => (
                <div
                  key={cls.id}
                  className="glass-card p-5 rounded-3xl border border-[rgba(77,42,0,0.1)] flex flex-col justify-between space-y-4 hover:border-[#CC6F00]/40 transition-all shadow-glass"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-[#CC6F00]/10 text-[#CC6F00] border border-[#CC6F00]/20">
                        {cls.startTime} – {cls.endTime}
                      </span>
                      {cls.isAttendanceMarked ? (
                        <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-800 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Attendance Marked</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-900 border border-amber-500/30">
                          <AlertCircle className="w-3 h-3 text-amber-700" />
                          <span>Pending Attendance</span>
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-[#4D2A00]">{cls.subjectName}</h3>
                      <p className="text-xs text-[#CC6F00] font-mono font-bold mt-0.5">{cls.subjectCode}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-[#4D2A00]/80">
                      <div className="flex items-center space-x-1">
                        <GraduationCap className="w-3.5 h-3.5 text-[#CC6F00]" />
                        <span>{cls.course} • {cls.branch}</span>
                      </div>
                      <div>•</div>
                      <div>Sem {cls.semester} • <strong>Section {cls.section}</strong></div>
                      <div>•</div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-[#CC6F00]" />
                        <span className="font-mono font-semibold">{cls.room}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[rgba(77,42,0,0.08)] flex items-center justify-between">
                    <span className="text-[11px] text-[#4D2A00]/60">
                      {cls.isAttendanceMarked ? "Re-take or update session" : "Ready for attendance roll call"}
                    </span>
                    <button
                      onClick={() => handleOpenAttendance(cls)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                        cls.isAttendanceMarked
                          ? "btn-secondary text-[11px]"
                          : "btn-primary"
                      }`}
                    >
                      {cls.isAttendanceMarked ? "Update Attendance" : "Mark Attendance"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: WEEKLY TIMETABLE */}
      {activeTab === "timetable" && (
        <div className="glass-card rounded-3xl p-5 border border-[rgba(77,42,0,0.1)] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#4D2A00]">
              Personal Weekly Timetable ({fullTimetable.length} Slots)
            </h2>
            <span className="text-xs text-[#4D2A00]/60">Filtered strictly to your assigned classes</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[rgba(77,42,0,0.1)] text-[#4D2A00]/60 font-mono text-[11px] uppercase">
                  <th className="py-3 px-3">Day</th>
                  <th className="py-3 px-3">Time</th>
                  <th className="py-3 px-3">Subject</th>
                  <th className="py-3 px-3">Class / Section</th>
                  <th className="py-3 px-3">Room / Lab</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(77,42,0,0.06)] text-[#4D2A00]">
                {fullTimetable.map((item) => (
                  <tr key={item.id} className="hover:bg-white/40 transition-colors">
                    <td className="py-3.5 px-3 font-bold text-[#4D2A00]">
                      {dayNames[item.dayOfWeek] || `Day ${item.dayOfWeek}`}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-[#CC6F00] font-semibold">
                      {item.startTime} – {item.endTime}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-[#4D2A00]">{item.subjectName}</div>
                      <div className="text-[11px] text-[#4D2A00]/60 font-mono">{item.subjectCode}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div>{item.course} • {item.branch}</div>
                      <div className="text-[11px] text-[#4D2A00]/60">Year {item.year} • Sem {item.semester} • Section {item.section}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="px-2.5 py-0.5 rounded-lg bg-stone-100 border border-stone-200 font-mono font-bold text-[#4D2A00]">
                        {item.room}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ASSIGNED SUBJECTS */}
      {activeTab === "subjects" && (
        <div className="glass-card rounded-3xl p-5 border border-[rgba(77,42,0,0.1)] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#4D2A00]">
              Authorized Course & Subject Assignments ({assignments.length})
            </h2>
            <span className="text-xs text-[#4D2A00]/60">Assigned by Central Academic Administration</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignments.map((asg) => (
              <div
                key={asg.id}
                className="p-5 rounded-2xl bg-white/60 border border-[rgba(77,42,0,0.1)] space-y-3 shadow-sm hover:border-[#CC6F00]/40 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#CC6F00]">{asg.subject?.code}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FDB773]/20 border border-[#CC6F00]/20">
                    {asg.subject?.type || "THEORY"}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#4D2A00]">{asg.subject?.name}</h3>
                  <p className="text-xs text-[#4D2A00]/70 mt-1">
                    {asg.course} • {asg.branch}
                  </p>
                </div>

                <div className="pt-2 border-t border-[rgba(77,42,0,0.06)] flex items-center justify-between text-xs text-[#4D2A00]/80">
                  <span>Semester {asg.semester} • <strong>Section {asg.section}</strong></span>
                  <span className="font-mono font-bold">{asg.subject?.credits || 3} Credits</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: MARKS & RESULTS ENTRY */}
      {activeTab === "marks" && (
        <div className="glass-card rounded-3xl p-5 border border-[rgba(77,42,0,0.1)] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[rgba(77,42,0,0.1)] pb-4">
            <div>
              <h2 className="text-sm font-bold text-[#4D2A00] flex items-center space-x-2">
                <FileSpreadsheet className="w-4 h-4 text-[#CC6F00]" />
                <span>Internal & Semester Marks Evaluation</span>
              </h2>
              <p className="text-xs text-[#4D2A00]/70 mt-0.5">
                Enter midterm, internal, assignment and practical marks. Save as Draft or Publish to students.
              </p>
            </div>

            {/* Select Subject Dropdown */}
            <div className="flex items-center space-x-2">
              <label className="text-xs text-[#4D2A00]/70 font-semibold whitespace-nowrap">Class:</label>
              <select
                value={selectedAssignment?.id || ""}
                onChange={(e) => {
                  const asg = assignments.find((a) => a.id === e.target.value);
                  setSelectedAssignment(asg);
                }}
                className="px-3 py-2 bg-white/70 border border-[rgba(77,42,0,0.12)] rounded-xl text-xs text-[#4D2A00] font-semibold focus:outline-none focus:border-[#CC6F00]"
              >
                {assignments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.subject?.code} - Section {a.section} (Sem {a.semester})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {marksLoading ? (
            <div className="py-12 text-center text-xs text-[#4D2A00]/60">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#CC6F00]" />
              <span>Loading class student roster and assessment records...</span>
            </div>
          ) : marksRoster.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#4D2A00]/60">
              No students enrolled in this course, branch, and section yet.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[rgba(77,42,0,0.1)] text-[#4D2A00]/60 font-mono text-[11px] uppercase">
                      <th className="py-2.5 px-3">Roll No</th>
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-2">Internal (30)</th>
                      <th className="py-2.5 px-2">Assignment (20)</th>
                      <th className="py-2.5 px-2">Practical (30)</th>
                      <th className="py-2.5 px-2">End Sem (100)</th>
                      <th className="py-2.5 px-2 font-bold">Total</th>
                      <th className="py-2.5 px-2 font-bold">Grade</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(77,42,0,0.06)] text-[#4D2A00]">
                    {marksRoster.map((row) => (
                      <tr key={row.studentId} className="hover:bg-white/40 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-[#CC6F00]">{row.rollNumber || "—"}</td>
                        <td className="py-3 px-3 font-bold text-[#4D2A00]">{row.fullName}</td>

                        <td className="py-3 px-2">
                          <input
                            type="number"
                            min={0}
                            max={30}
                            value={row.internalMarks ?? ""}
                            onChange={(e) => handleMarkChange(row.studentId, "internalMarks", e.target.value)}
                            placeholder="-"
                            className="w-16 px-2 py-1 bg-white/80 border border-[rgba(77,42,0,0.12)] rounded-lg text-center font-mono font-semibold"
                          />
                        </td>

                        <td className="py-3 px-2">
                          <input
                            type="number"
                            min={0}
                            max={20}
                            value={row.assignmentMarks ?? ""}
                            onChange={(e) => handleMarkChange(row.studentId, "assignmentMarks", e.target.value)}
                            placeholder="-"
                            className="w-16 px-2 py-1 bg-white/80 border border-[rgba(77,42,0,0.12)] rounded-lg text-center font-mono font-semibold"
                          />
                        </td>

                        <td className="py-3 px-2">
                          <input
                            type="number"
                            min={0}
                            max={30}
                            value={row.practicalMarks ?? ""}
                            onChange={(e) => handleMarkChange(row.studentId, "practicalMarks", e.target.value)}
                            placeholder="-"
                            className="w-16 px-2 py-1 bg-white/80 border border-[rgba(77,42,0,0.12)] rounded-lg text-center font-mono font-semibold"
                          />
                        </td>

                        <td className="py-3 px-2">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={row.endSemMarks ?? ""}
                            onChange={(e) => handleMarkChange(row.studentId, "endSemMarks", e.target.value)}
                            placeholder="-"
                            className="w-16 px-2 py-1 bg-white/80 border border-[rgba(77,42,0,0.12)] rounded-lg text-center font-mono font-semibold"
                          />
                        </td>

                        <td className="py-3 px-2 font-mono font-bold text-[#4D2A00]">
                          {row.totalMarks ?? "—"}
                        </td>

                        <td className="py-3 px-2">
                          <span className="px-2 py-0.5 rounded-md font-mono font-bold text-[11px] bg-[#CC6F00]/10 text-[#CC6F00] border border-[#CC6F00]/20">
                            {row.grade || "—"}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              row.status === "PUBLISHED"
                                ? "bg-emerald-500/10 text-emerald-800 border-emerald-500/30"
                                : "bg-stone-500/10 text-stone-600 border-stone-300"
                            }`}
                          >
                            {row.status || "DRAFT"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[rgba(77,42,0,0.1)]">
                <span className="text-xs text-[#4D2A00]/70">
                  Total Students: <strong>{marksRoster.length}</strong>
                </span>

                <div className="flex items-center space-x-2.5">
                  <button
                    onClick={() => handleSaveMarks("DRAFT")}
                    disabled={savingMarks}
                    className="btn-secondary px-4 py-2 text-xs font-bold flex items-center space-x-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Draft</span>
                  </button>

                  <button
                    onClick={() => handleSaveMarks("PUBLISHED")}
                    disabled={savingMarks}
                    className="btn-primary px-5 py-2 text-xs font-bold flex items-center space-x-1.5 shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                    <span>Publish Results to Students</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: MARK ATTENDANCE */}
      {markingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-fadeIn">
          <div className="glass-modal max-w-2xl w-full p-6 space-y-4 rounded-3xl border border-[rgba(77,42,0,0.15)] shadow-glass max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[rgba(77,42,0,0.1)] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#4D2A00]">
                  Mark Attendance • {markingClass.subjectName}
                </h3>
                <p className="text-xs text-[#4D2A00]/70">
                  {markingClass.course} {markingClass.branch} • Sem {markingClass.semester} • Section {markingClass.section} • Room {markingClass.room}
                </p>
              </div>
              <button onClick={() => setMarkingClass(null)} className="text-[#4D2A00]/60 hover:text-[#4D2A00]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-semibold text-[#4D2A00] mb-1">Lesson Topic (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Relational Calculus & Query Optimization"
                  value={attendanceTopic}
                  onChange={(e) => setAttendanceTopic(e.target.value)}
                  className="w-full px-3 py-2 bg-white/70 border border-[rgba(77,42,0,0.12)] rounded-xl text-xs text-[#4D2A00] focus:outline-none focus:border-[#CC6F00]"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-bold text-[#4D2A00]">
                  Students Enrolled ({classStudents.length})
                </span>
                <div className="space-x-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const allPres: Record<string, "PRESENT" | "ABSENT" | "LATE"> = {};
                      classStudents.forEach((s) => { allPres[s.id] = "PRESENT"; });
                      setAttendanceRecords(allPres);
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-500/10 text-emerald-800 border border-emerald-500/30 hover:bg-emerald-500/20"
                  >
                    All Present
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const allAbs: Record<string, "PRESENT" | "ABSENT" | "LATE"> = {};
                      classStudents.forEach((s) => { allAbs[s.id] = "ABSENT"; });
                      setAttendanceRecords(allAbs);
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-500/10 text-rose-800 border border-rose-500/30 hover:bg-rose-500/20"
                  >
                    All Absent
                  </button>
                </div>
              </div>

              {markingLoading ? (
                <div className="py-8 text-center text-xs text-[#4D2A00]/60">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#CC6F00]" />
                  Loading students roster...
                </div>
              ) : classStudents.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#4D2A00]/60">
                  No students found in this section ({markingClass.section}).
                </div>
              ) : (
                <div className="space-y-2">
                  {classStudents.map((student) => {
                    const currentStatus = attendanceRecords[student.id] || "PRESENT";
                    return (
                      <div
                        key={student.id}
                        className="p-3 bg-white/60 border border-[rgba(77,42,0,0.1)] rounded-2xl flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-[#4D2A00]">{student.fullName}</div>
                          <div className="text-[11px] text-[#4D2A00]/60 font-mono">{student.rollNumber || student.email}</div>
                        </div>

                        {/* Status Toggle Buttons */}
                        <div className="flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => setAttendanceRecords((prev) => ({ ...prev, [student.id]: "PRESENT" }))}
                            className={`px-3 py-1 rounded-xl text-[11px] font-bold border transition-all ${
                              currentStatus === "PRESENT"
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                : "bg-white/80 text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                            }`}
                          >
                            P
                          </button>
                          <button
                            type="button"
                            onClick={() => setAttendanceRecords((prev) => ({ ...prev, [student.id]: "LATE" }))}
                            className={`px-3 py-1 rounded-xl text-[11px] font-bold border transition-all ${
                              currentStatus === "LATE"
                                ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                                : "bg-white/80 text-amber-800 border-amber-300 hover:bg-amber-50"
                            }`}
                          >
                            L
                          </button>
                          <button
                            type="button"
                            onClick={() => setAttendanceRecords((prev) => ({ ...prev, [student.id]: "ABSENT" }))}
                            className={`px-3 py-1 rounded-xl text-[11px] font-bold border transition-all ${
                              currentStatus === "ABSENT"
                                ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                                : "bg-white/80 text-rose-800 border-rose-300 hover:bg-rose-50"
                            }`}
                          >
                            A
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[rgba(77,42,0,0.1)] flex items-center justify-between">
              <span className="text-xs text-[#4D2A00]/70">
                Present: {Object.values(attendanceRecords).filter((s) => s === "PRESENT").length} •
                Late: {Object.values(attendanceRecords).filter((s) => s === "LATE").length} •
                Absent: {Object.values(attendanceRecords).filter((s) => s === "ABSENT").length}
              </span>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setMarkingClass(null)}
                  className="btn-secondary px-4 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitAttendance}
                  disabled={markingLoading || classStudents.length === 0}
                  className="btn-primary px-6 py-2 text-xs font-bold shadow-sm"
                >
                  Submit Attendance
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyDashboardPage;
