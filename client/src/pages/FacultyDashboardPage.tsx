import React, { useState, useEffect } from "react";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  Users,
  BookOpen,
  MapPin,
  GraduationCap,
  Save,
  Send,
  RefreshCw,
  X,
  ChevronRight,
  Layers,
  Award
} from "lucide-react";
import { apiRequest, UserProfile } from "../api/client.js";

interface FacultyDashboardPageProps {
  user: UserProfile | null;
}

export const FacultyDashboardPage: React.FC<FacultyDashboardPageProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<"today" | "timetable" | "assignments" | "marks">("today");
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

      const res = await apiRequest<{ students: any[]; session?: any }>(`/api/academic/attendance/class-students?${query.toString()}`);
      setClassStudents(res.students || []);

      // If student has savedStatus from database, use it! Otherwise default to PRESENT
      const initial: Record<string, "PRESENT" | "ABSENT" | "LATE"> = {};
      (res.students || []).forEach((s) => {
        initial[s.id] = s.savedStatus || "PRESENT";
      });
      setAttendanceRecords(initial);
      if (res.session?.topic) {
        setAttendanceTopic(res.session.topic);
      }
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

  // Save Marks Batch
  const handleSaveMarks = async (status: "DRAFT" | "PUBLISHED") => {
    if (!selectedAssignment) return;
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

  // Distinct branches taught
  const distinctBranches = Array.from(new Set(assignments.map((a) => `${a.course} ${a.branch}`)));

  return (
    <div className="space-y-8 pb-16 animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[#FF6D1F]/50 px-4 py-3 rounded-lg shadow-2xl flex items-center space-x-2 text-xs font-mono">
          <CheckCircle2 className="w-4 h-4 text-[#FF6D1F]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <section className="border-b border-[var(--border-subtle)] pb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <span className="editorial-eyebrow text-[#FF6D1F] block mb-2">
            01 // ACADEMIC INSTRUCTION
          </span>
          <h1 className="editorial-title text-xl sm:text-2xl text-[var(--text-primary)]">
            FACULTY COMMAND PORTAL
          </h1>
          <p className="text-xs font-mono text-[var(--text-secondary)] mt-2">
            {user?.fullName} · {user?.department || "Computer Applications"} · EMP ID: {user?.employeeId || "FAC-CSE01"}
          </p>
        </div>

        <button
          onClick={fetchFacultyData}
          disabled={loading}
          className="btn-secondary px-4 py-2 text-xs font-mono flex items-center space-x-2 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>REFRESH PORTAL</span>
        </button>
      </section>

      {/* Numerical Metrics Bar (Horizontal Data Strip) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
        <div className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)]">
            Today's Lectures
          </span>
          <div className="text-3xl font-mono font-black text-[var(--text-primary)]">
            {todayClasses.length}
          </div>
          <span className="text-[11px] font-mono text-[var(--text-secondary)]">
            Scheduled slots today
          </span>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)]">
            Attendance Status
          </span>
          <div className={`text-3xl font-mono font-black ${pendingCount > 0 ? "text-[#FF6D1F]" : "text-emerald-400"}`}>
            {pendingCount > 0 ? `${pendingCount} PENDING` : "ALL MARKED"}
          </div>
          <span className="text-[11px] font-mono text-[var(--text-secondary)]">
            {pendingCount > 0 ? "Action required" : "Session synchronized"}
          </span>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)]">
            Multi-Branch Teaching
          </span>
          <div className="text-3xl font-mono font-black text-[var(--text-primary)]">
            {distinctBranches.length} PROGRAMS
          </div>
          <span className="text-[11px] font-mono text-[var(--text-secondary)] truncate block" title={distinctBranches.join(", ")}>
            {distinctBranches.join(" · ") || "MCA, B.Tech, BCA"}
          </span>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)]">
            Weekly Schedule
          </span>
          <div className="text-3xl font-mono font-black text-[var(--text-primary)]">
            {fullTimetable.length} SESSIONS
          </div>
          <span className="text-[11px] font-mono text-[var(--text-secondary)]">
            Across campus semesters
          </span>
        </div>
      </section>

      {/* Section 21: MY TEACHING ASSIGNMENTS (Multi-Branch Program Bands) */}
      <section className="campus-block p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border-subtle)]">
          <div>
            <span className="editorial-eyebrow text-[#FF6D1F]">
              02 // CROSS-DISCIPLINARY ROSTER
            </span>
            <h2 className="editorial-title text-xl text-[var(--text-primary)] mt-0.5">
              MY TEACHING ASSIGNMENTS
            </h2>
          </div>
          <span className="text-[11px] font-mono text-[var(--text-muted)]">
            Rosters strictly segregated by program
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {assignments.map((a, i) => (
            <div
              key={a.id || i}
              className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-2 hover:border-[#FF6D1F]/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#FF6D1F]">
                  {a.course} // {a.branch}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                  SEC {a.section}
                </span>
              </div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                {a.subject?.name || a.subjectName || "Assigned Course"}
              </h3>
              <div className="text-xs font-mono text-[var(--text-muted)] flex items-center justify-between pt-1 border-t border-[var(--border-subtle)]">
                <span>Year {a.year} · Sem {a.semester}</span>
                <span>Code: {a.subject?.code || a.subjectCode || "CS-401"}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tabs Navigation Rail */}
      <div className="flex border-b border-[var(--border-subtle)] gap-4 overflow-x-auto pb-1 text-xs font-mono">
        <button
          onClick={() => setActiveTab("today")}
          className={`pb-3 font-bold transition-all relative ${
            activeTab === "today"
              ? "text-[var(--text-primary)] border-b-2 border-[#FF6D1F]"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          01 TODAY'S LECTURES & ATTENDANCE ({todayClasses.length})
        </button>

        <button
          onClick={() => setActiveTab("timetable")}
          className={`pb-3 font-bold transition-all relative ${
            activeTab === "timetable"
              ? "text-[var(--text-primary)] border-b-2 border-[#FF6D1F]"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          02 WEEKLY TIMETABLE ({fullTimetable.length})
        </button>

        <button
          onClick={() => setActiveTab("marks")}
          className={`pb-3 font-bold transition-all relative ${
            activeTab === "marks"
              ? "text-[var(--text-primary)] border-b-2 border-[#FF6D1F]"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          03 SEMESTER MARKS & GRADING
        </button>
      </div>

      {/* TAB 1: TODAY'S LECTURES & ATTENDANCE */}
      {activeTab === "today" && (
        <section className="campus-block p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="editorial-eyebrow text-[var(--text-muted)]">
              LECTURES SCHEDULED FOR TODAY
            </span>
            <span className="text-xs font-mono text-[var(--text-muted)]">
              {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
            </span>
          </div>

          {todayClasses.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-[var(--text-muted)]">
              No lectures scheduled for your faculty profile today.
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-subtle)]">
              {todayClasses.map((cls) => (
                <div
                  key={cls.id}
                  className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-20 font-mono text-left shrink-0">
                      <span className="text-sm font-bold text-[var(--text-primary)] block">
                        {cls.startTime}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] block">
                        {cls.endTime}
                      </span>
                    </div>

                    <div className="border-l border-[var(--border-subtle)] pl-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-bold text-[#FF6D1F]">
                          {cls.course} {cls.branch}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)]">
                          Sem {cls.semester} · Sec {cls.section}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-[var(--text-primary)] mt-0.5">
                        {cls.subject?.name || cls.subjectName}
                      </h4>
                      <p className="text-xs font-mono text-[var(--text-secondary)] mt-0.5">
                        Room {cls.roomNumber || cls.room || "Lab 2"} · Code: {cls.subject?.code || cls.subjectCode}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    {cls.isAttendanceMarked ? (
                      <span className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>ATTENDANCE RECORDED</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleOpenAttendance(cls)}
                        className="btn-primary px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5 shadow-sm"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>RECORD ATTENDANCE</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 2: FULL TIMETABLE */}
      {activeTab === "timetable" && (
        <section className="campus-block p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="border-b border-[var(--border-subtle)] text-[var(--text-muted)]">
                <tr>
                  <th className="py-2.5 px-3">DAY</th>
                  <th className="py-2.5 px-3">TIME</th>
                  <th className="py-2.5 px-3">PROGRAM</th>
                  <th className="py-2.5 px-3">SUBJECT</th>
                  <th className="py-2.5 px-3">LOCATION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-primary)]">
                {fullTimetable.map((slot) => (
                  <tr key={slot.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="py-3 px-3 font-bold text-[#FF6D1F]">
                      {dayNames[slot.dayOfWeek] || "Day"}
                    </td>
                    <td className="py-3 px-3">
                      {slot.startTime} – {slot.endTime}
                    </td>
                    <td className="py-3 px-3">
                      {slot.course} {slot.branch} · Sem {slot.semester} (Sec {slot.section})
                    </td>
                    <td className="py-3 px-3 font-semibold">
                      {slot.subject?.name || slot.subjectName}
                    </td>
                    <td className="py-3 px-3 text-[var(--text-secondary)]">
                      Room {slot.roomNumber || slot.room || "Academic Block"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 3: SEMESTER MARKS & GRADING */}
      {activeTab === "marks" && (
        <section className="campus-block p-6 space-y-6">
          {/* Class Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
            <div>
              <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block">
                Select Teaching Assignment:
              </span>
              <div className="flex gap-2 flex-wrap mt-2">
                {assignments.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setSelectedAssignment(a)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors border ${
                      selectedAssignment?.id === a.id
                        ? "bg-[#FF6D1F] text-[#141414] font-bold border-[#FF6D1F]"
                        : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {a.course} {a.branch} (Sec {a.section}) · {a.subject?.code || a.subjectCode}
                  </button>
                ))}
              </div>
            </div>

            {selectedAssignment && (
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => handleSaveMarks("DRAFT")}
                  disabled={savingMarks}
                  className="btn-secondary px-3.5 py-2 text-xs font-mono font-bold flex items-center space-x-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>SAVE DRAFT</span>
                </button>
                <button
                  onClick={() => handleSaveMarks("PUBLISHED")}
                  disabled={savingMarks}
                  className="btn-primary px-4 py-2 text-xs font-mono font-bold flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>PUBLISH RESULTS</span>
                </button>
              </div>
            )}
          </div>

          {/* Marks Table */}
          {marksLoading ? (
            <div className="py-12 text-center text-xs font-mono text-[var(--text-muted)]">
              Loading student roster & gradebook...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">STUDENT</th>
                    <th className="py-2.5 px-3">ROLL NO</th>
                    <th className="py-2.5 px-2">INTERNAL (30)</th>
                    <th className="py-2.5 px-2">ASSIGN (10)</th>
                    <th className="py-2.5 px-2">LAB (30)</th>
                    <th className="py-2.5 px-2">END SEM (100)</th>
                    <th className="py-2.5 px-2">TOTAL</th>
                    <th className="py-2.5 px-2">GRADE</th>
                    <th className="py-2.5 px-3">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-primary)]">
                  {marksRoster.map((row) => (
                    <tr key={row.studentId} className="hover:bg-[var(--bg-hover)] transition-colors">
                      <td className="py-2.5 px-3 font-bold text-[var(--text-primary)]">
                        {row.fullName || row.studentName || "Student"}
                      </td>
                      <td className="py-2.5 px-3 text-[var(--text-secondary)] font-mono">{row.rollNumber}</td>
                      <td className="py-2.5 px-2">
                        <input
                          type="number"
                          value={row.internalMarks ?? ""}
                          onChange={(e) => handleMarkChange(row.studentId, "internalMarks", e.target.value)}
                          className="w-16 px-2 py-1 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded text-center text-[var(--text-primary)] font-mono outline-none focus:border-[#FF6D1F]"
                        />
                      </td>
                      <td className="py-2.5 px-2">
                        <input
                          type="number"
                          value={row.assignmentMarks ?? ""}
                          onChange={(e) => handleMarkChange(row.studentId, "assignmentMarks", e.target.value)}
                          className="w-16 px-2 py-1 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded text-center text-[var(--text-primary)] font-mono outline-none focus:border-[#FF6D1F]"
                        />
                      </td>
                      <td className="py-2.5 px-2">
                        <input
                          type="number"
                          value={row.practicalMarks ?? ""}
                          onChange={(e) => handleMarkChange(row.studentId, "practicalMarks", e.target.value)}
                          className="w-16 px-2 py-1 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded text-center text-[var(--text-primary)] font-mono outline-none focus:border-[#FF6D1F]"
                        />
                      </td>
                      <td className="py-2.5 px-2">
                        <input
                          type="number"
                          value={row.endSemMarks ?? ""}
                          onChange={(e) => handleMarkChange(row.studentId, "endSemMarks", e.target.value)}
                          className="w-16 px-2 py-1 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded text-center text-[var(--text-primary)] font-mono outline-none focus:border-[#FF6D1F]"
                        />
                      </td>
                      <td className="py-2.5 px-2 font-bold font-mono text-[#FF6D1F]">
                        {row.totalMarks ?? "—"}
                      </td>
                      <td className="py-2.5 px-2 font-bold font-mono">
                        {row.grade || "—"}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          row.status === "PUBLISHED"
                            ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                            : "bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border-subtle)]"
                        }`}>
                          {row.status || "DRAFT"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* FAST ATTENDANCE ROSTER MODAL */}
      {markingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="campus-panel max-w-2xl w-full p-6 space-y-4 border border-[var(--border-medium)] shadow-2xl max-h-[90vh] flex flex-col font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase">
                  RECORD ATTENDANCE · {markingClass.subject?.name || markingClass.subjectName}
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  {markingClass.course} {markingClass.branch} · Sem {markingClass.semester} · Sec {markingClass.section} · Room {markingClass.roomNumber || markingClass.room || "Lab"}
                </p>
              </div>
              <button onClick={() => setMarkingClass(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-3">
              {/* Optional Lesson Topic */}
              <div>
                <label className="block text-[10px] text-[var(--text-muted)] uppercase mb-1">
                  Lesson Topic / Chapter Covered
                </label>
                <input
                  type="text"
                  placeholder="e.g. Relational Calculus & Indexing Operations"
                  value={attendanceTopic}
                  onChange={(e) => setAttendanceTopic(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-[#FF6D1F] outline-none"
                />
              </div>

              {/* Roster Controls */}
              <div className="flex items-center justify-between pt-2">
                <span className="font-bold text-[var(--text-primary)]">
                  ENROLLED STUDENTS ({classStudents.length})
                </span>
                <div className="space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      const allPres: Record<string, "PRESENT" | "ABSENT" | "LATE"> = {};
                      classStudents.forEach((s) => { allPres[s.id] = "PRESENT"; });
                      setAttendanceRecords(allPres);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25"
                  >
                    ALL PRESENT
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const allAbs: Record<string, "PRESENT" | "ABSENT" | "LATE"> = {};
                      classStudents.forEach((s) => { allAbs[s.id] = "ABSENT"; });
                      setAttendanceRecords(allAbs);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25"
                  >
                    ALL ABSENT
                  </button>
                </div>
              </div>

              {/* Table Roster */}
              <div className="divide-y divide-[var(--border-subtle)] border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-input)] overflow-hidden">
                {classStudents.map((student) => {
                  const currentStatus = attendanceRecords[student.id] || "PRESENT";
                  return (
                    <div
                      key={student.id}
                      className="p-3 flex items-center justify-between hover:bg-[var(--bg-hover)] transition-colors"
                    >
                      <div>
                        <span className="font-bold text-[var(--text-primary)] block">{student.fullName}</span>
                        <span className="text-[10px] text-[var(--text-muted)]">{student.rollNumber || student.email}</span>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setAttendanceRecords((prev) => ({ ...prev, [student.id]: "PRESENT" }))}
                          className={`w-8 h-7 rounded text-xs font-bold transition-colors ${
                            currentStatus === "PRESENT"
                              ? "bg-emerald-500 text-[#141414]"
                              : "bg-[var(--bg-elevated)] text-emerald-400 border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)]"
                          }`}
                        >
                          P
                        </button>
                        <button
                          type="button"
                          onClick={() => setAttendanceRecords((prev) => ({ ...prev, [student.id]: "LATE" }))}
                          className={`w-8 h-7 rounded text-xs font-bold transition-colors ${
                            currentStatus === "LATE"
                              ? "bg-amber-500 text-[#141414]"
                              : "bg-[var(--bg-elevated)] text-amber-400 border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)]"
                          }`}
                        >
                          L
                        </button>
                        <button
                          type="button"
                          onClick={() => setAttendanceRecords((prev) => ({ ...prev, [student.id]: "ABSENT" }))}
                          className={`w-8 h-7 rounded text-xs font-bold transition-colors ${
                            currentStatus === "ABSENT"
                              ? "bg-rose-500 text-white"
                              : "bg-[var(--bg-elevated)] text-rose-400 border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)]"
                          }`}
                        >
                          A
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
              <span className="text-[11px] text-[var(--text-secondary)]">
                P: {Object.values(attendanceRecords).filter((s) => s === "PRESENT").length} ·
                L: {Object.values(attendanceRecords).filter((s) => s === "LATE").length} ·
                A: {Object.values(attendanceRecords).filter((s) => s === "ABSENT").length}
              </span>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setMarkingClass(null)}
                  className="btn-secondary px-3.5 py-2 text-xs"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={handleSubmitAttendance}
                  disabled={markingLoading || classStudents.length === 0}
                  className="btn-primary px-5 py-2 text-xs font-bold"
                >
                  SUBMIT ATTENDANCE
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
