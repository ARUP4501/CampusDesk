import React, { useState, useEffect } from "react";
import {
  Users,
  BookOpen,
  Calendar,
  Layers,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  Search,
  Check,
  Building,
  GraduationCap,
  Clock,
  MapPin,
  RefreshCw,
  UserCheck
} from "lucide-react";
import { apiRequest } from "../api/client.js";

export const AdminAcademicManagement: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<"faculty" | "subjects" | "assignments" | "timetable">("faculty");
  const [loading, setLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Data states
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [subjectList, setSubjectList] = useState<any[]>([]);
  const [assignmentList, setAssignmentList] = useState<any[]>([]);
  const [timetableList, setTimetableList] = useState<any[]>([]);
  const [courseList, setCourseList] = useState<any[]>([]);

  // Modals
  const [showFacultyModal, setShowFacultyModal] = useState<boolean>(false);
  const [showSubjectModal, setShowSubjectModal] = useState<boolean>(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState<boolean>(false);
  const [showTimetableModal, setShowTimetableModal] = useState<boolean>(false);

  // Forms
  const [facultyForm, setFacultyForm] = useState({
    fullName: "",
    email: "",
    password: "Password@123",
    department: "Computer Science & Engineering",
    phone: "9876543200",
    employeeId: ""
  });

  const [subjectForm, setSubjectForm] = useState({
    name: "",
    code: "",
    course: "B.Tech",
    branch: "CSE",
    year: 2,
    semester: 4,
    type: "THEORY" as "THEORY" | "PRACTICAL" | "LAB",
    credits: 3
  });

  const [assignmentForm, setAssignmentForm] = useState({
    facultyId: "",
    subjectId: "",
    course: "B.Tech",
    branch: "CSE",
    year: 2,
    semester: 4,
    section: "A",
    academicYear: "2026-2027"
  });

  const [timetableForm, setTimetableForm] = useState({
    dayOfWeek: 1,
    startTime: "09:00",
    endTime: "10:30",
    subjectId: "",
    facultyId: "",
    course: "B.Tech",
    branch: "CSE",
    year: 2,
    semester: 4,
    section: "A",
    room: "LH-301"
  });

  // Search & filter
  const [searchQuery, setSearchQuery] = useState<string>("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [facRes, subRes, assignRes, timeRes, crsRes] = await Promise.all([
        apiRequest<{ faculty: any[] }>("/api/academic/faculty"),
        apiRequest<{ subjects: any[] }>("/api/academic/subjects"),
        apiRequest<{ assignments: any[] }>("/api/academic/assignments"),
        apiRequest<{ schedule: any[] }>("/api/academic/timetable"),
        apiRequest<{ courses: any[] }>("/api/academic/courses")
      ]);

      setFacultyList(facRes.faculty || []);
      setSubjectList(subRes.subjects || []);
      setAssignmentList(assignRes.assignments || []);
      setTimetableList(timeRes.schedule || []);
      setCourseList(crsRes.courses || []);

      if (facRes.faculty?.length && !assignmentForm.facultyId) {
        setAssignmentForm((prev) => ({ ...prev, facultyId: facRes.faculty[0].id }));
        setTimetableForm((prev) => ({ ...prev, facultyId: facRes.faculty[0].id }));
      }
      if (subRes.subjects?.length && !assignmentForm.subjectId) {
        setAssignmentForm((prev) => ({ ...prev, subjectId: subRes.subjects[0].id }));
        setTimetableForm((prev) => ({ ...prev, subjectId: subRes.subjects[0].id }));
      }
    } catch (err: any) {
      console.error("Failed to load academic data:", err);
      showToast(err.message || "Failed to load academic data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handlers
  const handleCreateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest("/api/academic/faculty", {
        method: "POST",
        body: JSON.stringify(facultyForm)
      });
      showToast("Faculty member created successfully!");
      setShowFacultyModal(false);
      setFacultyForm({
        fullName: "",
        email: "",
        password: "Password@123",
        department: "Computer Science & Engineering",
        phone: "9876543200",
        employeeId: ""
      });
      fetchData();
    } catch (err: any) {
      showToast(err.message || "Failed to create faculty.");
    }
  };

  const handleToggleFacultyStatus = async (id: string, current: boolean) => {
    try {
      await apiRequest(`/api/academic/faculty/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !current })
      });
      showToast(`Faculty member ${!current ? "activated" : "deactivated"}.`);
      fetchData();
    } catch (err: any) {
      showToast(err.message || "Failed to toggle status.");
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest("/api/academic/subjects", {
        method: "POST",
        body: JSON.stringify(subjectForm)
      });
      showToast("Subject added successfully!");
      setShowSubjectModal(false);
      setSubjectForm({
        name: "",
        code: "",
        course: "B.Tech",
        branch: "CSE",
        year: 2,
        semester: 4,
        type: "THEORY",
        credits: 3
      });
      fetchData();
    } catch (err: any) {
      showToast(err.message || "Failed to create subject.");
    }
  };

  const handleToggleSubjectStatus = async (id: string, current: boolean) => {
    try {
      await apiRequest(`/api/academic/subjects/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !current })
      });
      showToast(`Subject ${!current ? "activated" : "deactivated"}.`);
      fetchData();
    } catch (err: any) {
      showToast(err.message || "Failed to toggle subject status.");
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest("/api/academic/assignments", {
        method: "POST",
        body: JSON.stringify(assignmentForm)
      });
      showToast("Faculty assigned to subject successfully!");
      setShowAssignmentModal(false);
      fetchData();
    } catch (err: any) {
      showToast(err.message || "Failed to assign faculty.");
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this faculty assignment?")) return;
    try {
      await apiRequest(`/api/academic/assignments/${id}`, { method: "DELETE" });
      showToast("Assignment removed.");
      fetchData();
    } catch (err: any) {
      showToast(err.message || "Failed to delete assignment.");
    }
  };

  const handleCreateTimetable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest("/api/academic/timetable", {
        method: "POST",
        body: JSON.stringify(timetableForm)
      });
      showToast("Timetable entry added successfully!");
      setShowTimetableModal(false);
      fetchData();
    } catch (err: any) {
      showToast(err.message || "Failed to add timetable entry.");
    }
  };

  const handleDeleteTimetable = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this timetable entry?")) return;
    try {
      await apiRequest(`/api/academic/timetable/${id}`, { method: "DELETE" });
      showToast("Timetable entry deleted.");
      fetchData();
    } catch (err: any) {
      showToast(err.message || "Failed to delete timetable entry.");
    }
  };

  const dayNames = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)] px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-2 text-xs font-semibold animate-slideUp">
          <CheckCircle2 className="w-4 h-4 text-[#FF6D1F]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header and Controls */}
      <div className="glass-panel p-6 rounded-3xl border border-[var(--border-subtle)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[#FF6D1F] text-xs font-bold uppercase mb-1">
            <GraduationCap className="w-4 h-4" />
            <span>Academic Management Center</span>
          </div>
          <h2 className="text-xl font-extrabold text-[var(--text-primary)]">Faculty, Subjects, Assignments & Timetables</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Configure subjects, link professors to sections, and manage lecture timetables.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={fetchData}
            disabled={loading}
            className="btn-secondary px-3.5 py-2 text-xs flex items-center space-x-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          {activeSubTab === "faculty" && (
            <button
              onClick={() => setShowFacultyModal(true)}
              className="btn-primary px-4 py-2 text-xs flex items-center space-x-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Faculty</span>
            </button>
          )}

          {activeSubTab === "subjects" && (
            <button
              onClick={() => setShowSubjectModal(true)}
              className="btn-primary px-4 py-2 text-xs flex items-center space-x-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Subject</span>
            </button>
          )}

          {activeSubTab === "assignments" && (
            <button
              onClick={() => setShowAssignmentModal(true)}
              className="btn-primary px-4 py-2 text-xs flex items-center space-x-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Assign Faculty</span>
            </button>
          )}

          {activeSubTab === "timetable" && (
            <button
              onClick={() => setShowTimetableModal(true)}
              className="btn-primary px-4 py-2 text-xs flex items-center space-x-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Timetable Slot</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex border-b border-[var(--border-subtle)] gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveSubTab("faculty")}
          className={`py-2 px-4 rounded-xl font-bold flex items-center space-x-2 transition-all whitespace-nowrap ${
            activeSubTab === "faculty"
              ? "bg-[#FF6D1F] text-[#141414] font-bold shadow-sm"
              : "bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]/70 hover:text-[var(--text-primary)]"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Faculty Directory ({facultyList.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab("subjects")}
          className={`py-2 px-4 rounded-xl font-bold flex items-center space-x-2 transition-all whitespace-nowrap ${
            activeSubTab === "subjects"
              ? "bg-[#FF6D1F] text-[#141414] font-bold shadow-sm"
              : "bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]/70 hover:text-[var(--text-primary)]"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Subjects & Credits ({subjectList.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab("assignments")}
          className={`py-2 px-4 rounded-xl font-bold flex items-center space-x-2 transition-all whitespace-nowrap ${
            activeSubTab === "assignments"
              ? "bg-[#FF6D1F] text-[#141414] font-bold shadow-sm"
              : "bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]/70 hover:text-[var(--text-primary)]"
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Faculty Assignments ({assignmentList.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab("timetable")}
          className={`py-2 px-4 rounded-xl font-bold flex items-center space-x-2 transition-all whitespace-nowrap ${
            activeSubTab === "timetable"
              ? "bg-[#FF6D1F] text-[#141414] font-bold shadow-sm"
              : "bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]/70 hover:text-[var(--text-primary)]"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Timetable Schedules ({timetableList.length})</span>
        </button>
      </div>

      {/* 1. FACULTY DIRECTORY TAB */}
      {activeSubTab === "faculty" && (
        <div className="glass-card rounded-3xl p-5 border border-[var(--border-subtle)] space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-[var(--text-subtle)] absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search faculty by name, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-[#FF6D1F]"
              />
            </div>
            <span className="text-xs text-[var(--text-muted)]">
              Showing {facultyList.filter((f) => f.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || f.email.toLowerCase().includes(searchQuery.toLowerCase())).length} of {facultyList.length} faculty members
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-mono text-[11px] uppercase">
                  <th className="py-3 px-3">Faculty Member</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3">Employee ID</th>
                  <th className="py-3 px-3">Contact</th>
                  <th className="py-3 px-3">Assigned Classes</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-primary)]">
                {facultyList
                  .filter((f) => f.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || f.email.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((fac) => (
                    <tr key={fac.id} className="hover:bg-[var(--bg-hover)]/40 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-[var(--text-primary)]">{fac.fullName}</div>
                        <div className="text-[11px] text-[var(--text-muted)] font-mono">{fac.email}</div>
                      </td>
                      <td className="py-3.5 px-3">{fac.department}</td>
                      <td className="py-3.5 px-3 font-mono">{fac.employeeId || "—"}</td>
                      <td className="py-3.5 px-3">{fac.phone || "—"}</td>
                      <td className="py-3.5 px-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#FF6D1F]/15 text-[#FF6D1F] border border-[#FF6D1F]/20">
                          {fac.facultyAssignments?.length || 0} Subjects
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            fac.isActive
                              ? "bg-emerald-500/10 text-emerald-800 border-emerald-500/30"
                              : "bg-stone-500/10 text-stone-600 border-stone-400"
                          }`}
                        >
                          {fac.isActive ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => handleToggleFacultyStatus(fac.id, fac.isActive)}
                          className={`px-3 py-1 rounded-xl text-[11px] font-bold border transition-all ${
                            fac.isActive
                              ? "border-rose-300 text-rose-700 hover:bg-rose-50"
                              : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                          }`}
                        >
                          {fac.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. SUBJECTS TAB */}
      {activeSubTab === "subjects" && (
        <div className="glass-card rounded-3xl p-5 border border-[var(--border-subtle)] space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-[var(--text-subtle)] absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search subject code, name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-[#FF6D1F]"
              />
            </div>
            <span className="text-xs text-[var(--text-muted)]">
              Total Subjects: {subjectList.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-mono text-[11px] uppercase">
                  <th className="py-3 px-3">Code</th>
                  <th className="py-3 px-3">Subject Name</th>
                  <th className="py-3 px-3">Program / Branch</th>
                  <th className="py-3 px-3">Semester</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Credits</th>
                  <th className="py-3 px-3">Assigned Faculty</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-primary)]">
                {subjectList
                  .filter((s) => s.code.toLowerCase().includes(searchQuery.toLowerCase()) || s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((sub) => (
                    <tr key={sub.id} className="hover:bg-[var(--bg-hover)]/40 transition-colors">
                      <td className="py-3.5 px-3 font-mono font-bold text-[#FF6D1F]">{sub.code}</td>
                      <td className="py-3.5 px-3 font-bold text-[var(--text-primary)]">{sub.name}</td>
                      <td className="py-3.5 px-3">{sub.course} - {sub.branch}</td>
                      <td className="py-3.5 px-3 font-mono">Sem {sub.semester}</td>
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF6D1F]/20 border border-[#FF6D1F]/20">
                          {sub.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold">{sub.credits}</td>
                      <td className="py-3.5 px-3">
                        {sub.facultyAssignments?.length > 0 ? (
                          <div className="text-[11px]">
                            {sub.facultyAssignments.map((a: any) => a.faculty.fullName).join(", ")}
                          </div>
                        ) : (
                          <span className="text-[11px] text-[var(--text-subtle)] italic">Not Assigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            sub.isActive
                              ? "bg-emerald-500/10 text-emerald-800 border-emerald-500/30"
                              : "bg-stone-500/10 text-stone-600 border-stone-400"
                          }`}
                        >
                          {sub.isActive ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => handleToggleSubjectStatus(sub.id, sub.isActive)}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all ${
                            sub.isActive
                              ? "border-rose-300 text-rose-700 hover:bg-rose-50"
                              : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                          }`}
                        >
                          {sub.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. FACULTY ASSIGNMENTS TAB */}
      {activeSubTab === "assignments" && (
        <div className="glass-card rounded-3xl p-5 border border-[var(--border-subtle)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Active Faculty Class & Subject Assignments ({assignmentList.length})
            </h3>
            <span className="text-xs text-[var(--text-muted)]">
              Determines attendance marking and marks entry authorization
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-mono text-[11px] uppercase">
                  <th className="py-3 px-3">Faculty Member</th>
                  <th className="py-3 px-3">Subject</th>
                  <th className="py-3 px-3">Program & Branch</th>
                  <th className="py-3 px-3">Year & Semester</th>
                  <th className="py-3 px-3">Section</th>
                  <th className="py-3 px-3">Academic Year</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-primary)]">
                {assignmentList.map((a) => (
                  <tr key={a.id} className="hover:bg-[var(--bg-hover)]/40 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-[var(--text-primary)]">{a.faculty?.fullName}</div>
                      <div className="text-[11px] text-[var(--text-muted)]">{a.faculty?.department}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-[var(--text-primary)]">{a.subject?.name}</div>
                      <div className="text-[11px] text-[#FF6D1F] font-mono">{a.subject?.code}</div>
                    </td>
                    <td className="py-3.5 px-3">{a.course} - {a.branch}</td>
                    <td className="py-3.5 px-3">Year {a.year} • Sem {a.semester}</td>
                    <td className="py-3.5 px-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FF6D1F] text-[#141414] font-bold">
                        Section {a.section}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-mono">{a.academicYear || "2026-2027"}</td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => handleDeleteAssignment(a.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Remove Assignment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. TIMETABLE SCHEDULES TAB */}
      {activeSubTab === "timetable" && (
        <div className="glass-card rounded-3xl p-5 border border-[var(--border-subtle)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Institutional Timetable Master ({timetableList.length} Class Slots)
            </h3>
            <span className="text-xs text-[var(--text-muted)]">
              Synchronized with Student and Faculty portal calendars
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-mono text-[11px] uppercase">
                  <th className="py-3 px-3">Day & Time</th>
                  <th className="py-3 px-3">Subject</th>
                  <th className="py-3 px-3">Faculty</th>
                  <th className="py-3 px-3">Class</th>
                  <th className="py-3 px-3">Room / Lab</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-primary)]">
                {timetableList.map((slot) => (
                  <tr key={slot.id} className="hover:bg-[var(--bg-hover)]/40 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-[var(--text-primary)]">{dayNames[slot.dayOfWeek] || `Day ${slot.dayOfWeek}`}</div>
                      <div className="text-[11px] text-[var(--text-muted)] font-mono">{slot.startTime} – {slot.endTime}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-[var(--text-primary)]">{slot.subjectName}</div>
                      <div className="text-[11px] text-[#FF6D1F] font-mono">{slot.subjectCode}</div>
                    </td>
                    <td className="py-3.5 px-3 font-medium text-[var(--text-primary)]">{slot.facultyName}</td>
                    <td className="py-3.5 px-3">
                      <div>{slot.course} • {slot.branch}</div>
                      <div className="text-[11px] text-[var(--text-muted)]">Year {slot.year} • Sem {slot.semester} • Sec {slot.section}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded-lg bg-stone-100 border border-stone-200 font-mono font-bold text-[var(--text-primary)]">
                        {slot.room}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => handleDeleteTimetable(slot.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Schedule Entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD FACULTY */}
      {showFacultyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-fadeIn">
          <div className="glass-modal max-w-lg w-full p-6 space-y-4 rounded-3xl border border-[var(--border-subtle)] shadow-glass">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h3 className="text-base font-bold text-[var(--text-primary)]">Create New Faculty Account</h3>
              <button onClick={() => setShowFacultyModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFaculty} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[var(--text-primary)] mb-1">Full Name & Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prof. Rajesh Sharma"
                  value={facultyForm.fullName}
                  onChange={(e) => setFacultyForm({ ...facultyForm, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[#FF6D1F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--text-primary)] mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="prof.sharma@campusdesk.edu"
                    value={facultyForm.email}
                    onChange={(e) => setFacultyForm({ ...facultyForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[#FF6D1F]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-primary)] mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    value={facultyForm.password}
                    onChange={(e) => setFacultyForm({ ...facultyForm, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[#FF6D1F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--text-primary)] mb-1">Department *</label>
                  <input
                    type="text"
                    required
                    placeholder="Computer Science & Eng"
                    value={facultyForm.department}
                    onChange={(e) => setFacultyForm({ ...facultyForm, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[#FF6D1F]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-primary)] mb-1">Employee ID</label>
                  <input
                    type="text"
                    placeholder="e.g. FAC-CSE-001"
                    value={facultyForm.employeeId}
                    onChange={(e) => setFacultyForm({ ...facultyForm, employeeId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[#FF6D1F]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[var(--text-primary)] mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="9876543200"
                  value={facultyForm.phone}
                  onChange={(e) => setFacultyForm({ ...facultyForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[#FF6D1F]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setShowFacultyModal(false)}
                  className="btn-secondary px-4 py-2"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary px-6 py-2 font-bold shadow-sm">
                  Create Faculty Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD SUBJECT */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-fadeIn">
          <div className="glass-modal max-w-lg w-full p-6 space-y-4 rounded-3xl border border-[var(--border-subtle)] shadow-glass">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h3 className="text-base font-bold text-[var(--text-primary)]">Add Academic Subject</h3>
              <button onClick={() => setShowSubjectModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubject} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--text-primary)] mb-1">Subject Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS403"
                    value={subjectForm.code}
                    onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] font-mono focus:outline-none focus:border-[#FF6D1F]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-primary)] mb-1">Subject Type</label>
                  <select
                    value={subjectForm.type}
                    onChange={(e: any) => setSubjectForm({ ...subjectForm, type: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[#FF6D1F]"
                  >
                    <option value="THEORY">THEORY</option>
                    <option value="PRACTICAL">PRACTICAL</option>
                    <option value="LAB">LAB</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[var(--text-primary)] mb-1">Subject Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Database Management Systems"
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[#FF6D1F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--text-primary)] mb-1">Course *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. B.Tech or MCA"
                    value={subjectForm.course}
                    onChange={(e) => setSubjectForm({ ...subjectForm, course: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[#FF6D1F]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-primary)] mb-1">Branch *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CSE or CA"
                    value={subjectForm.branch}
                    onChange={(e) => setSubjectForm({ ...subjectForm, branch: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[#FF6D1F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--text-primary)] mb-1">Year *</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    required
                    value={subjectForm.year}
                    onChange={(e) => setSubjectForm({ ...subjectForm, year: parseInt(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[#FF6D1F]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-primary)] mb-1">Semester *</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    required
                    value={subjectForm.semester}
                    onChange={(e) => setSubjectForm({ ...subjectForm, semester: parseInt(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[#FF6D1F]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-primary)] mb-1">Credits *</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    required
                    value={subjectForm.credits}
                    onChange={(e) => setSubjectForm({ ...subjectForm, credits: parseInt(e.target.value) || 3 })}
                    className="w-full px-3.5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[#FF6D1F]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setShowSubjectModal(false)}
                  className="btn-secondary px-4 py-2"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary px-6 py-2 font-bold shadow-sm">
                  Create Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ASSIGN FACULTY */}
      {showAssignmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-fadeIn">
          <div className="glass-modal max-w-lg w-full p-6 space-y-4 rounded-3xl border border-[var(--border-subtle)] shadow-glass">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h3 className="text-base font-bold text-[var(--text-primary)]">Assign Faculty to Subject & Class</h3>
              <button onClick={() => setShowAssignmentModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[var(--text-primary)] mb-1">Select Faculty Member *</label>
                <select
                  required
                  value={assignmentForm.facultyId}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, facultyId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[#FF6D1F]"
                >
                  {facultyList.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.fullName} ({f.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[var(--text-primary)] mb-1">Select Subject *</label>
                <select
                  required
                  value={assignmentForm.subjectId}
                  onChange={(e) => {
                    const sub = subjectList.find((s) => s.id === e.target.value);
                    setAssignmentForm({
                      ...assignmentForm,
                      subjectId: e.target.value,
                      course: sub ? sub.course : assignmentForm.course,
                      branch: sub ? sub.branch : assignmentForm.branch,
                      year: sub ? sub.year : assignmentForm.year,
                      semester: sub ? sub.semester : assignmentForm.semester
                    });
                  }}
                  className="w-full px-3.5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[#FF6D1F]"
                >
                  {subjectList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name} ({s.course} {s.branch} Sem {s.semester})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--text-primary)] mb-1">Course</label>
                  <input
                    type="text"
                    value={assignmentForm.course}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, course: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-primary)] mb-1">Branch</label>
                  <input
                    type="text"
                    value={assignmentForm.branch}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, branch: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--text-primary)] mb-1">Year</label>
                  <input
                    type="number"
                    value={assignmentForm.year}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, year: parseInt(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-primary)] mb-1">Semester</label>
                  <input
                    type="number"
                    value={assignmentForm.semester}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, semester: parseInt(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-primary)] mb-1">Section *</label>
                  <input
                    type="text"
                    required
                    value={assignmentForm.section}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, section: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setShowAssignmentModal(false)}
                  className="btn-secondary px-4 py-2"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary px-6 py-2 font-bold shadow-sm">
                  Save Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ADD TIMETABLE ENTRY */}
      {showTimetableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-fadeIn">
          <div className="glass-modal max-w-lg w-full p-6 space-y-4 rounded-3xl border border-[var(--border-subtle)] shadow-glass">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h3 className="text-base font-bold text-[var(--text-primary)]">Add Timetable Schedule Slot</h3>
              <button onClick={() => setShowTimetableModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTimetable} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--text-primary)] mb-1">Day of Week *</label>
                  <select
                    value={timetableForm.dayOfWeek}
                    onChange={(e) => setTimetableForm({ ...timetableForm, dayOfWeek: parseInt(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] font-bold"
                  >
                    <option value={1}>Monday</option>
                    <option value={2}>Tuesday</option>
                    <option value={3}>Wednesday</option>
                    <option value={4}>Thursday</option>
                    <option value={5}>Friday</option>
                    <option value={6}>Saturday</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-primary)] mb-1">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={timetableForm.startTime}
                    onChange={(e) => setTimetableForm({ ...timetableForm, startTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-primary)] mb-1">End Time *</label>
                  <input
                    type="time"
                    required
                    value={timetableForm.endTime}
                    onChange={(e) => setTimetableForm({ ...timetableForm, endTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[var(--text-primary)] mb-1">Subject *</label>
                <select
                  required
                  value={timetableForm.subjectId}
                  onChange={(e) => {
                    const sub = subjectList.find((s) => s.id === e.target.value);
                    setTimetableForm({
                      ...timetableForm,
                      subjectId: e.target.value,
                      course: sub ? sub.course : timetableForm.course,
                      branch: sub ? sub.branch : timetableForm.branch,
                      year: sub ? sub.year : timetableForm.year,
                      semester: sub ? sub.semester : timetableForm.semester
                    });
                  }}
                  className="w-full px-3.5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)]"
                >
                  {subjectList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name} ({s.course} {s.branch})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[var(--text-primary)] mb-1">Faculty *</label>
                <select
                  required
                  value={timetableForm.facultyId}
                  onChange={(e) => setTimetableForm({ ...timetableForm, facultyId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)]"
                >
                  {facultyList.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.fullName} ({f.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--text-primary)] mb-1">Section *</label>
                  <input
                    type="text"
                    required
                    value={timetableForm.section}
                    onChange={(e) => setTimetableForm({ ...timetableForm, section: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold text-[var(--text-primary)] mb-1">Room / Lab *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LH-301 or Lab 2"
                    value={timetableForm.room}
                    onChange={(e) => setTimetableForm({ ...timetableForm, room: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setShowTimetableModal(false)}
                  className="btn-secondary px-4 py-2"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary px-6 py-2 font-bold shadow-sm">
                  Create Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAcademicManagement;
