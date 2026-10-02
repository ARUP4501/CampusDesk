import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
  ArrowRight
} from "lucide-react";
import { apiRequest, UserProfile } from "../api/client.js";

interface ScheduleItem {
  id: string;
  subjectCode: string;
  subjectName: string;
  facultyName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string;
  section?: string;
  course?: string;
  branch?: string;
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
  const [activeTab, setActiveTab] = useState<"timetable" | "attendance">("timetable");
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [cancellations, setCancellations] = useState<ClassCancellationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay() || 1); // 1 = Mon

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

  const isStaffOrAdmin = user && (user.role === "STAFF" || user.role === "ADMIN" || user.role === "FACULTY");
  const isFaculty = user?.role === "FACULTY";

  const fetchData = async () => {
    try {
      setLoading(true);
      const [schedRes, cancelRes] = await Promise.all([
        apiRequest<{ schedule: ScheduleItem[] }>("/api/academic/timetable"),
        apiRequest<{ cancellations: ClassCancellationItem[] }>("/api/academic/cancellations")
      ]);

      setSchedule(schedRes.schedule || []);
      setCancellations(cancelRes.cancellations || []);

      // If student, also fetch attendance
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
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 glass-panel p-6 rounded-3xl border border-[rgba(77,42,0,0.1)] shadow-glass">
        <div>
          <div className="flex items-center space-x-2 text-[#CC6F00] text-[11px] font-bold uppercase mb-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Academic Schedule & Attendance</span>
          </div>
          <h1 className="text-2xl font-bold text-[#4D2A00]">Lecture Timetable & Attendance</h1>
          <p className="text-xs text-[#4D2A00]/70 mt-1">
            Weekly class schedule, subject-wise attendance tracking, and real-time class cancellations
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {isFaculty && (
            <Link
              to="/faculty"
              className="btn-primary inline-flex items-center space-x-2 text-xs font-bold px-4 py-2.5 shadow-sm"
            >
              <span>Faculty Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}

          {isStaffOrAdmin && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="btn-secondary inline-flex items-center space-x-2 text-xs font-bold px-4 py-2.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Post Cancellation</span>
            </button>
          )}
        </div>
      </div>

      {/* Faculty Quick Portal Notice */}
      {isFaculty && (
        <div className="p-4 rounded-2xl bg-[#CC6F00]/10 border border-[#CC6F00]/30 flex items-center justify-between text-xs text-[#4D2A00]">
          <div className="flex items-center space-x-2.5">
            <UserCheck className="w-4 h-4 text-[#CC6F00]" />
            <span>
              You are logged in as a <strong>Faculty Member</strong>. You can mark student attendance and enter semester marks directly in your portal.
            </span>
          </div>
          <Link to="/faculty" className="font-bold text-[#CC6F00] hover:underline flex items-center space-x-1">
            <span>Mark Attendance</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex border-b border-[rgba(77,42,0,0.1)] gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveTab("timetable")}
          className={`py-2 px-4 rounded-xl font-bold flex items-center space-x-2 transition-all whitespace-nowrap ${
            activeTab === "timetable"
              ? "bg-[#CC6F00] text-white shadow-sm"
              : "bg-white/40 text-[#4D2A00]/70 hover:bg-white/70 hover:text-[#4D2A00]"
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          <span>Weekly Lecture Schedule</span>
        </button>

        <button
          onClick={() => setActiveTab("attendance")}
          className={`py-2 px-4 rounded-xl font-bold flex items-center space-x-2 transition-all whitespace-nowrap ${
            activeTab === "attendance"
              ? "bg-[#CC6F00] text-white shadow-sm"
              : "bg-white/40 text-[#4D2A00]/70 hover:bg-white/70 hover:text-[#4D2A00]"
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Attendance Records & Percentage</span>
        </button>
      </div>

      {/* TAB 1: TIMETABLE & CANCELLATIONS */}
      {activeTab === "timetable" && (
        <div className="space-y-6">
          {/* Real-time Class Cancellation Alerts */}
          {cancellations.length > 0 && (
            <div className="space-y-2.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#CC6F00] flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-[#CC6F00]" />
                <span>Live Class Cancellation Notices ({cancellations.length})</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {cancellations.map((c) => (
                  <div key={c.id} className="p-4 bg-[#FDB773]/20 border border-[#CC6F00]/30 rounded-2xl space-y-1 text-xs text-[#4D2A00]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#4D2A00]">{c.subjectName}</span>
                      <span className="font-mono text-[11px] text-[#4D2A00]/60">{new Date(c.date).toLocaleDateString()}</span>
                    </div>
                    <p className="text-[#4D2A00]/80">Faculty: <strong className="text-[#4D2A00]">{c.facultyName}</strong> • {c.branch} Year {c.year}</p>
                    <p className="text-[11px] text-[#4D2A00]/70 italic mt-1 bg-white/40 p-2 rounded-xl border border-[rgba(77,42,0,0.06)]">
                      &quot;{c.reason}&quot;
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Days Selector */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1">
            {days.map((d) => (
              <button
                key={d.num}
                onClick={() => setSelectedDay(d.num)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                  selectedDay === d.num
                    ? "bg-[#CC6F00] text-white shadow-sm"
                    : "bg-white/60 border border-[rgba(77,42,0,0.1)] text-[#4D2A00]/70 hover:bg-white"
                }`}
              >
                {d.name}
              </button>
            ))}
          </div>

          {/* Current Day Schedule List */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#4D2A00]/70">
              {days.find((d) => d.num === selectedDay)?.name}&apos;s Lectures ({currentDayClasses.length})
            </h2>

            {currentDayClasses.length === 0 ? (
              <div className="glass-panel p-8 text-center rounded-3xl border border-[rgba(77,42,0,0.1)] text-xs text-[#4D2A00]/60">
                No lectures scheduled for {days.find((d) => d.num === selectedDay)?.name}.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {currentDayClasses.map((item) => (
                  <div
                    key={item.id}
                    className="glass-card p-4 rounded-2xl border border-[rgba(77,42,0,0.1)] space-y-2 text-xs hover:border-[#CC6F00]/30 transition-all shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-[#CC6F00]">{item.subjectCode}</span>
                      <div className="flex items-center space-x-1 font-mono font-bold text-[11px] text-[#4D2A00] bg-white/70 px-2.5 py-0.5 rounded-full border border-[rgba(77,42,0,0.08)]">
                        <Clock className="w-3 h-3 text-[#CC6F00]" />
                        <span>{item.startTime} – {item.endTime}</span>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-[#4D2A00]">{item.subjectName}</h3>

                    <div className="pt-2 border-t border-[rgba(77,42,0,0.06)] flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <div className="flex items-center space-x-1.5 text-[#4D2A00]/80">
                        <MapPin className="w-3.5 h-3.5 text-[#CC6F00]" />
                        <span>Room / Lab: <strong className="text-[#4D2A00] font-mono">{item.room}</strong></span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-[#4D2A00]/80">
                        <UserCheck className="w-3.5 h-3.5 text-[#CC6F00]" />
                        <span>Faculty: <strong className="text-[#4D2A00]">{item.facultyName}</strong></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ATTENDANCE SUMMARY & HISTORY */}
      {activeTab === "attendance" && (
        <div className="space-y-6">
          {attendanceData ? (
            <>
              {/* Overall Summary Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="glass-card p-5 rounded-3xl border border-[rgba(77,42,0,0.1)] space-y-1 bg-gradient-to-br from-white/70 to-[#FDB773]/20 shadow-glass">
                  <span className="text-[10px] font-mono text-[#4D2A00]/60 uppercase block">Overall Attendance</span>
                  <div className="flex items-baseline space-x-2">
                    <span className={`text-3xl font-black ${attendanceData.overall.isShortage ? "text-rose-600" : "text-[#CC6F00]"}`}>
                      {attendanceData.overall.percentage}%
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold ${attendanceData.overall.isShortage ? "text-rose-700" : "text-emerald-800"}`}>
                    {attendanceData.overall.isShortage ? "Shortage Warning (< 75% Criteria)" : "Compliant with 75% University Requirement"}
                  </span>
                </div>

                <div className="glass-card p-5 rounded-3xl border border-[rgba(77,42,0,0.1)] space-y-1 shadow-glass">
                  <span className="text-[10px] font-mono text-[#4D2A00]/60 uppercase block">Total Lectures Conducted</span>
                  <div className="text-3xl font-black text-[#4D2A00]">{attendanceData.overall.totalClasses}</div>
                  <span className="text-[10px] text-[#4D2A00]/60">Across all registered subjects</span>
                </div>

                <div className="glass-card p-5 rounded-3xl border border-[rgba(77,42,0,0.1)] space-y-1 shadow-glass">
                  <span className="text-[10px] font-mono text-[#4D2A00]/60 uppercase block">Lectures Attended</span>
                  <div className="text-3xl font-black text-emerald-800">{attendanceData.overall.attendedClasses}</div>
                  <span className="text-[10px] text-[#4D2A00]/60">Physical & lab lecture presence</span>
                </div>
              </div>

              {/* Subject-Wise Attendance Breakdown */}
              <div className="glass-card rounded-3xl p-5 border border-[rgba(77,42,0,0.1)] space-y-4 shadow-glass">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-[#4D2A00]">Subject-Wise Attendance Breakdown</h2>
                  <span className="text-xs text-[#4D2A00]/60 font-mono">Min Requirement: 75%</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[rgba(77,42,0,0.1)] text-[#4D2A00]/60 font-mono text-[11px] uppercase">
                        <th className="py-3 px-3">Subject</th>
                        <th className="py-3 px-3 text-center">Total Held</th>
                        <th className="py-3 px-3 text-center">Attended</th>
                        <th className="py-3 px-3 text-center">Absent</th>
                        <th className="py-3 px-3 text-center">Percentage</th>
                        <th className="py-3 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(77,42,0,0.06)] text-[#4D2A00]">
                      {attendanceData.subjectWise.map((sub: any) => (
                        <tr key={sub.id || sub.subjectCode} className="hover:bg-white/40 transition-colors">
                          <td className="py-3.5 px-3">
                            <div className="font-bold text-[#4D2A00]">{sub.subjectName}</div>
                            <div className="text-[11px] text-[#CC6F00] font-mono">{sub.subjectCode}</div>
                          </td>
                          <td className="py-3.5 px-3 text-center font-mono">{sub.totalClasses}</td>
                          <td className="py-3.5 px-3 text-center font-mono font-bold text-emerald-700">{sub.attendedClasses}</td>
                          <td className="py-3.5 px-3 text-center font-mono text-rose-700">{sub.totalClasses - sub.attendedClasses}</td>
                          <td className="py-3.5 px-3 text-center font-mono font-bold">
                            <span className={sub.isShortage ? "text-rose-600" : "text-[#4D2A00]"}>
                              {sub.percentage}%
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            {sub.isShortage ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-700 border border-rose-500/30">
                                Shortage
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/30">
                                Eligible
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
                <div className="glass-card rounded-3xl p-5 border border-[rgba(77,42,0,0.1)] space-y-4 shadow-glass">
                  <h2 className="text-sm font-bold text-[#4D2A00]">Recent Lecture Roll Call History</h2>
                  <div className="space-y-2">
                    {attendanceData.history.map((h: any) => (
                      <div
                        key={h.id}
                        className="p-3 bg-white/60 border border-[rgba(77,42,0,0.08)] rounded-2xl flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-[#4D2A00]">{h.subjectName}</div>
                          <div className="text-[11px] text-[#4D2A00]/60">
                            {new Date(h.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} • Faculty: {h.facultyName}
                          </div>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-xl text-[11px] font-bold border ${
                            h.status === "PRESENT"
                              ? "bg-emerald-500/10 text-emerald-800 border-emerald-500/30"
                              : h.status === "LATE"
                              ? "bg-amber-500/15 text-amber-900 border-amber-500/30"
                              : "bg-rose-500/15 text-rose-800 border-rose-500/30"
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
            <div className="glass-panel p-12 text-center rounded-3xl border border-[rgba(77,42,0,0.1)] text-xs text-[#4D2A00]/60">
              No attendance records available for your profile.
            </div>
          )}
        </div>
      )}

      {/* Post Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-fadeIn">
          <div className="glass-modal max-w-md w-full p-6 space-y-4 text-xs rounded-3xl border border-[rgba(77,42,0,0.15)] shadow-glass">
            <div className="flex items-center justify-between border-b border-[rgba(77,42,0,0.1)] pb-3">
              <h3 className="text-base font-bold text-[#4D2A00]">Post Class Cancellation Notice</h3>
              <button onClick={() => setShowCancelModal(false)} className="text-[#4D2A00]/60 hover:text-[#4D2A00]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePostCancellation} className="space-y-4">
              <div>
                <label className="block font-semibold text-[#4D2A00] mb-1">Subject Name *</label>
                <input
                  type="text"
                  required
                  value={cancelForm.subjectName}
                  onChange={(e) => setCancelForm({ ...cancelForm, subjectName: e.target.value })}
                  placeholder="e.g. Design & Analysis of Algorithms"
                  className="w-full px-3.5 py-2.5 bg-white/60 border border-[rgba(77,42,0,0.12)] rounded-xl text-[#4D2A00] placeholder-[#4D2A00]/40 focus:outline-none focus:border-[#CC6F00]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#4D2A00] mb-1">Target Branch *</label>
                  <input
                    type="text"
                    required
                    value={cancelForm.branch}
                    onChange={(e) => setCancelForm({ ...cancelForm, branch: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white/60 border border-[rgba(77,42,0,0.12)] rounded-xl text-[#4D2A00] focus:outline-none focus:border-[#CC6F00]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#4D2A00] mb-1">Target Year *</label>
                  <input
                    type="number"
                    min={1}
                    max={4}
                    required
                    value={cancelForm.year}
                    onChange={(e) => setCancelForm({ ...cancelForm, year: parseInt(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2.5 bg-white/60 border border-[rgba(77,42,0,0.12)] rounded-xl text-[#4D2A00] focus:outline-none focus:border-[#CC6F00]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#4D2A00] mb-1">Cancellation Reason *</label>
                <textarea
                  required
                  rows={3}
                  value={cancelForm.reason}
                  onChange={(e) => setCancelForm({ ...cancelForm, reason: e.target.value })}
                  placeholder="e.g. Faculty attending university curriculum council meeting"
                  className="w-full px-3.5 py-2.5 bg-white/60 border border-[rgba(77,42,0,0.12)] rounded-xl text-[#4D2A00] placeholder-[#4D2A00]/40 focus:outline-none focus:border-[#CC6F00] resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-[rgba(77,42,0,0.1)]">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="btn-secondary px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-6 py-2 text-xs font-bold shadow-sm"
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
