import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  Award,
  BookOpen,
  Calendar,
  AlertCircle,
  Clock,
  RefreshCw,
  FileCheck2,
  CheckCircle2
} from "lucide-react";
import { apiRequest, UserProfile } from "../api/client.js";

interface StudentResultsPageProps {
  user: UserProfile | null;
}

export const StudentResultsPage: React.FC<StudentResultsPageProps> = ({ user }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<{
    isPublished: boolean;
    sgpa: number | null;
    totalCredits: number;
    results: any[];
    message?: string;
  }>({
    isPublished: false,
    sgpa: null,
    totalCredits: 0,
    results: []
  });

  const fetchResults = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{
        isPublished: boolean;
        sgpa: number | null;
        totalCredits: number;
        results: any[];
        message?: string;
      }>("/api/academic/results/my-results");

      setData(res);
    } catch (err: any) {
      console.error("Failed to load results:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const getGradeBadge = (grade: string | null) => {
    if (!grade) return <span className="text-[var(--text-muted)] font-mono">—</span>;
    const g = grade.toUpperCase();
    if (g === "O" || g === "E" || g === "A") {
      return (
        <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
          {g}
        </span>
      );
    }
    if (g === "B" || g === "C") {
      return (
        <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
          {g}
        </span>
      );
    }
    if (g === "D") {
      return (
        <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30">
          {g}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
        {g}
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-16 animate-fadeIn">
      {/* Header */}
      <div className="campus-panel p-6 sm:p-8 rounded-2xl border border-[var(--border-subtle)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="editorial-eyebrow">09 // ACADEMIC TRANSCRIPT</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-1">
              <Award className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              AUTHENTICATED RECORD
            </span>
          </div>
          <h1 className="editorial-title text-2xl sm:text-3xl text-[var(--text-primary)] mt-1">Semester Examination Results</h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
            Published course marks, assessment components, grades and cumulative SGPA
          </p>
        </div>

        <button
          onClick={fetchResults}
          disabled={loading}
          className="btn-secondary px-3.5 py-2 text-xs font-mono font-semibold flex items-center space-x-2 self-start md:self-auto rounded-xl"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Student Academic Info Card */}
      <div className="campus-block p-4 sm:p-5 rounded-xl border border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
        <div>
          <span className="text-[10px] text-[var(--text-muted)] uppercase block">STUDENT</span>
          <strong className="text-sm font-bold text-[var(--text-primary)] font-sans">{user?.fullName}</strong>
        </div>
        <div>
          <span className="text-[10px] text-[var(--text-muted)] uppercase block">ROLL NUMBER</span>
          <strong className="text-[#FF6D1F] font-bold">{user?.rollNumber || "2024CS101"}</strong>
        </div>
        <div>
          <span className="text-[10px] text-[var(--text-muted)] uppercase block">PROGRAM & BRANCH</span>
          <strong className="text-[var(--text-primary)]">{user?.course || "B.Tech"} • {user?.branch || "CSE"}</strong>
        </div>
        <div>
          <span className="text-[10px] text-[var(--text-muted)] uppercase block">COHORT</span>
          <strong className="text-[var(--text-primary)]">Year {user?.year || 2} • Semester {user?.semester || 4} • Section {user?.section || "A"}</strong>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-[var(--text-muted)] campus-panel rounded-2xl border border-[var(--border-subtle)] font-mono space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#FF6D1F]" />
          <span>Retrieving published examination scores...</span>
        </div>
      ) : !data.isPublished || data.results.length === 0 ? (
        /* Results Not Published State */
        <div className="campus-panel p-12 text-center rounded-2xl border border-[var(--border-subtle)] space-y-3 font-mono">
          <div className="w-12 h-12 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)] flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6 text-[#FF6D1F]" />
          </div>
          <h2 className="text-base font-bold text-[var(--text-primary)]">Results Not Published Yet</h2>
          <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
            Your semester examination marks have not been released by the academic examination cell.
            Once faculty submit evaluations and controller certifies, your SGPA and mark sheets will appear here.
          </p>
        </div>
      ) : (
        /* Published Results View */
        <div className="space-y-6">
          {/* Summary Badges: SGPA & Credits */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-5 rounded-2xl campus-block border border-[var(--border-subtle)] space-y-1 font-mono">
              <span className="text-[10px] text-[var(--text-muted)] uppercase block">SEMESTER GRADE POINT AVERAGE</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black text-[#FF6D1F]">{data.sgpa?.toFixed(2)}</span>
                <span className="text-xs text-[var(--text-muted)]">/ 10.0</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block pt-1">
                {data.sgpa && data.sgpa >= 8.5 ? "First Class with Distinction" : data.sgpa && data.sgpa >= 7.0 ? "First Class" : "Satisfactory"}
              </span>
            </div>

            <div className="p-5 rounded-2xl campus-block border border-[var(--border-subtle)] space-y-1 font-mono">
              <span className="text-[10px] text-[var(--text-muted)] uppercase block">TOTAL CREDITS EARNED</span>
              <div className="text-3xl font-black text-[var(--text-primary)]">{data.totalCredits}</div>
              <span className="text-[11px] text-[var(--text-muted)] block pt-1">Across {data.results.length} evaluated courses</span>
            </div>

            <div className="p-5 rounded-2xl campus-block border border-[var(--border-subtle)] space-y-1 font-mono">
              <span className="text-[10px] text-[var(--text-muted)] uppercase block">TRANSCRIPT AUTHENTICATION</span>
              <div className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-lg pt-1">
                <FileCheck2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Certified Published</span>
              </div>
              <span className="text-[11px] text-[var(--text-muted)] block pt-1">Verified institutional evaluation</span>
            </div>
          </div>

          {/* Results Breakdown Table */}
          <div className="campus-panel rounded-2xl p-5 sm:p-6 border border-[var(--border-subtle)] space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-primary)]">Course-Wise Assessment Breakdown</h2>
              <span className="text-xs text-[var(--text-muted)] font-mono">{data.results.length} Courses Evaluated</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] text-[var(--text-secondary)] font-mono text-[10px] uppercase">
                    <th className="py-3 px-3">Course</th>
                    <th className="py-3 px-2">Type</th>
                    <th className="py-3 px-2">Credits</th>
                    <th className="py-3 px-2 text-center">Internal (30)</th>
                    <th className="py-3 px-2 text-center">Assignment (20)</th>
                    <th className="py-3 px-2 text-center">Practical (30)</th>
                    <th className="py-3 px-2 text-center">End Sem (100)</th>
                    <th className="py-3 px-2 font-bold text-center">Total</th>
                    <th className="py-3 px-3 text-center">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)] font-mono text-xs">
                  {data.results.map((res) => (
                    <tr key={res.id} className="hover:bg-[var(--bg-hover)]/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-[var(--text-primary)] font-sans">{res.subjectName}</div>
                        <div className="text-[10px] text-[#FF6D1F] font-mono">{res.subjectCode}</div>
                      </td>
                      <td className="py-3 px-2">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                          {res.subjectType || "THEORY"}
                        </span>
                      </td>
                      <td className="py-3 px-2 font-mono font-bold text-[var(--text-primary)]">{res.credits}</td>
                      <td className="py-3 px-2 text-center text-[var(--text-secondary)]">
                        {res.internalMarks ?? "—"}
                      </td>
                      <td className="py-3 px-2 text-center text-[var(--text-secondary)]">
                        {res.assignmentMarks ?? "—"}
                      </td>
                      <td className="py-3 px-2 text-center text-[var(--text-secondary)]">
                        {res.practicalMarks ?? "—"}
                      </td>
                      <td className="py-3 px-2 text-center text-[var(--text-secondary)]">
                        {res.endSemMarks ?? "—"}
                      </td>
                      <td className="py-3 px-2 font-bold text-center text-[var(--text-primary)]">
                        {res.totalMarks ?? "—"}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {getGradeBadge(res.grade)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[var(--text-muted)] gap-2 font-mono">
              <span>Grading Scale: O (10) • E (9) • A (8) • B (7) • C (6) • D (5) • F (0)</span>
              <span>Evaluated by Assigned Faculty Members</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentResultsPage;
