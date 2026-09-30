import React, { useState, useEffect } from "react";
import { Calendar, AlertTriangle, Clock, MapPin, Plus, X, Save, BookOpen, UserCheck } from "lucide-react";
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
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [cancellations, setCancellations] = useState<ClassCancellationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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

  const isStaffOrAdmin = user && (user.role === "STAFF" || user.role === "ADMIN");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [schedRes, cancelRes] = await Promise.all([
        apiRequest<{ schedule: ScheduleItem[] }>("/api/academic/timetable"),
        apiRequest<{ cancellations: ClassCancellationItem[] }>("/api/academic/cancellations")
      ]);

      setSchedule(schedRes.schedule || []);
      setCancellations(cancelRes.cancellations || []);
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

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-campus-card border border-campus-border p-5 rounded-lg">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded bg-campus-elevated border border-campus-border flex items-center justify-center text-campus-gold">
              <Calendar className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-semibold text-campus-text">Academic Timetable & Schedule</h1>
          </div>
          <p className="text-xs text-campus-muted mt-1.5 ml-10">
            Weekly subject schedule, lecture timings, classroom allocations and real-time class cancellations
          </p>
        </div>

        {isStaffOrAdmin && (
          <button
            onClick={() => setShowCancelModal(true)}
            className="inline-flex items-center space-x-2 bg-campus-gold hover:bg-campus-gold-light text-campus-bg text-xs font-semibold px-4 py-2 rounded transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Post Class Cancellation</span>
          </button>
        )}
      </div>

      {/* Class Cancellations Alert Board */}
      {cancellations.length > 0 && (
        <div className="bg-campus-warning/5 border border-campus-warning/30 rounded-lg p-5">
          <div className="flex items-center space-x-2 text-campus-warning font-mono text-xs uppercase tracking-wider mb-3">
            <AlertTriangle className="w-4 h-4 text-campus-warning" />
            <span>Active Class Cancellations & Makeup Announcements</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {cancellations.map((c) => (
              <div key={c.id} className="bg-campus-card border border-campus-warning/20 p-3.5 rounded text-xs space-y-2">
                <div className="flex items-center justify-between font-semibold text-campus-text">
                  <span>{c.subjectName} ({c.branch} Y{c.year})</span>
                  <span className="text-[11px] text-campus-warning font-mono">
                    {new Date(c.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-campus-muted text-[11px] flex items-center space-x-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-campus-secondary" />
                  <span>Faculty: {c.facultyName}</span>
                </div>
                <div className="text-campus-text/90 bg-campus-elevated border border-campus-border/60 p-2 rounded text-[11px]">
                  <span className="text-campus-warning font-medium">Reason: </span>
                  {c.reason}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timetable Grid */}
      <div className="bg-campus-card border border-campus-border rounded-lg p-5">
        <div className="flex items-center justify-between border-b border-campus-border pb-3 mb-5">
          <h2 className="text-xs font-mono font-semibold text-campus-muted uppercase tracking-wider flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-campus-gold" />
            <span>Weekly Lecture Schedule ({user?.branch || "CSE"} Year {user?.year || 2})</span>
          </h2>
          <span className="text-[11px] text-campus-secondary">Updated for Current Semester</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-campus-muted">
            <div className="w-6 h-6 border-2 border-campus-gold border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading academic schedule...
          </div>
        ) : schedule.length === 0 ? (
          <div className="p-12 text-center text-xs text-campus-muted bg-campus-elevated/40 rounded border border-campus-border">
            No schedule loaded for this branch and year. Use Data Migration to import timetable CSV.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {days.map((dayName, idx) => {
              const dayNum = idx + 1;
              const dayClasses = schedule.filter((s) => s.dayOfWeek === dayNum);

              return (
                <div key={dayName} className="bg-campus-elevated/40 border border-campus-border rounded-lg p-4 text-xs">
                  <div className="flex items-center justify-between border-b border-campus-border pb-2 mb-3">
                    <span className="font-semibold text-campus-text tracking-wide">{dayName}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-campus-card border border-campus-border text-campus-secondary">
                      {dayClasses.length} {dayClasses.length === 1 ? 'session' : 'sessions'}
                    </span>
                  </div>

                  {dayClasses.length === 0 ? (
                    <div className="text-campus-muted italic py-6 text-center text-[11px]">No scheduled lectures</div>
                  ) : (
                    <div className="space-y-2.5">
                      {dayClasses.map((cls) => (
                        <div key={cls.id} className="bg-campus-card p-3 border border-campus-border hover:border-campus-gold/40 transition-colors rounded">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-campus-text">{cls.subjectName}</span>
                            <span className="text-[10px] font-mono text-campus-gold">{cls.subjectCode}</span>
                          </div>
                          <div className="text-[11px] text-campus-muted flex items-center space-x-3 mt-2 font-mono">
                            <span className="flex items-center space-x-1 text-campus-secondary">
                              <Clock className="w-3 h-3 text-campus-gold" />
                              <span>{cls.startTime} - {cls.endTime}</span>
                            </span>
                            <span className="flex items-center space-x-1 text-campus-secondary">
                              <MapPin className="w-3 h-3 text-campus-gold" />
                              <span>{cls.room}</span>
                            </span>
                          </div>
                          <div className="text-[11px] text-campus-muted mt-1.5 pt-1.5 border-t border-campus-border/50 flex items-center justify-between">
                            <span>Faculty:</span>
                            <span className="text-campus-secondary font-medium">{cls.facultyName}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Post Class Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-campus-card border border-campus-border rounded-lg max-w-md w-full p-5 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-campus-border pb-3">
              <h3 className="font-semibold text-campus-text text-sm flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-campus-warning" />
                <span>Post Class Cancellation Alert</span>
              </h3>
              <button onClick={() => setShowCancelModal(false)} className="text-campus-muted hover:text-campus-text transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePostCancellation} className="space-y-3.5">
              <div>
                <label className="block font-medium text-campus-secondary mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  value={cancelForm.subjectName}
                  onChange={(e) => setCancelForm({ ...cancelForm, subjectName: e.target.value })}
                  placeholder="e.g. Data Structures & Algorithms"
                  className="w-full p-2.5 bg-campus-bg border border-campus-border rounded text-campus-text placeholder-campus-muted focus:outline-none focus:border-campus-gold"
                />
              </div>

              <div>
                <label className="block font-medium text-campus-secondary mb-1">Faculty Name</label>
                <input
                  type="text"
                  required
                  value={cancelForm.facultyName}
                  onChange={(e) => setCancelForm({ ...cancelForm, facultyName: e.target.value })}
                  className="w-full p-2.5 bg-campus-bg border border-campus-border rounded text-campus-text placeholder-campus-muted focus:outline-none focus:border-campus-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-campus-secondary mb-1">Branch</label>
                  <input
                    type="text"
                    required
                    value={cancelForm.branch}
                    onChange={(e) => setCancelForm({ ...cancelForm, branch: e.target.value })}
                    className="w-full p-2.5 bg-campus-bg border border-campus-border rounded text-campus-text placeholder-campus-muted focus:outline-none focus:border-campus-gold"
                  />
                </div>
                <div>
                  <label className="block font-medium text-campus-secondary mb-1">Year</label>
                  <input
                    type="number"
                    min={1}
                    max={4}
                    required
                    value={cancelForm.year}
                    onChange={(e) => setCancelForm({ ...cancelForm, year: parseInt(e.target.value, 10) })}
                    className="w-full p-2.5 bg-campus-bg border border-campus-border rounded text-campus-text placeholder-campus-muted focus:outline-none focus:border-campus-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-campus-secondary mb-1">Date of Cancelled Class</label>
                <input
                  type="date"
                  required
                  value={cancelForm.date}
                  onChange={(e) => setCancelForm({ ...cancelForm, date: e.target.value })}
                  className="w-full p-2.5 bg-campus-bg border border-campus-border rounded text-campus-text focus:outline-none focus:border-campus-gold"
                />
              </div>

              <div>
                <label className="block font-medium text-campus-secondary mb-1">Reason for Cancellation</label>
                <textarea
                  rows={3}
                  required
                  value={cancelForm.reason}
                  onChange={(e) => setCancelForm({ ...cancelForm, reason: e.target.value })}
                  placeholder="e.g. Faculty participating in University Evaluation Committee"
                  className="w-full p-2.5 bg-campus-bg border border-campus-border rounded text-campus-text placeholder-campus-muted focus:outline-none focus:border-campus-gold resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-campus-border">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-3.5 py-2 border border-campus-border rounded text-campus-secondary hover:text-campus-text hover:bg-campus-elevated transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-campus-gold text-campus-bg font-semibold rounded hover:bg-campus-gold-light flex items-center space-x-1.5 transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Publish Alert</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
