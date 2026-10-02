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
    if (!grade) return <span className="text-[#4D2A00]/40 font-mono">—</span>;
    const g = grade.toUpperCase();
    if (g === "O" || g === "E" || g === "A") {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-emerald-500/10 text-emerald-800 border border-emerald-500/30">
          {g}
        </span>
      );
    }
    if (g === "B" || g === "C") {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-blue-500/10 text-blue-800 border border-blue-500/30">
          {g}
        </span>
      );
    }
    if (g === "D") {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-amber-500/15 text-amber-900 border border-amber-500/30">
          {g}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-rose-500/15 text-rose-800 border border-rose-500/30">
        {g}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl border border-[rgba(77,42,0,0.1)] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-glass">
        <div>
          <div className="flex items-center space-x-2 text-[#CC6F00] text-xs font-bold uppercase mb-1">
            <GraduationCap className="w-4 h-4" />
            <span>Academic Performance Record</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#4D2A00]">Semester Examination Results</h1>
          <p className="text-xs text-[#4D2A00]/70 mt-0.5">
            Published course marks, assessment components, grades and cumulative SGPA
          </p>
        </div>

        <button
          onClick={fetchResults}
          disabled={loading}
          className="btn-secondary px-4 py-2 text-xs flex items-center space-x-2 self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Student Academic Info Card */}
      <div className="glass-card p-5 rounded-3xl border border-[rgba(77,42,0,0.1)] flex flex-wrap items-center justify-between gap-4 text-xs text-[#4D2A00]">
        <div>
          <span className="text-[10px] text-[#4D2A00]/60 uppercase font-mono block">Student Name</span>
          <strong className="text-sm font-bold text-[#4D2A00]">{user?.fullName}</strong>
        </div>
        <div>
          <span className="text-[10px] text-[#4D2A00]/60 uppercase font-mono block">Roll Number</span>
          <strong className="font-mono text-[#CC6F00]">{user?.rollNumber || "2024CS101"}</strong>
        </div>
        <div>
          <span className="text-[10px] text-[#4D2A00]/60 uppercase font-mono block">Course & Branch</span>
          <strong>{user?.course || "B.Tech"} • {user?.branch || "CSE"}</strong>
        </div>
        <div>
          <span className="text-[10px] text-[#4D2A00]/60 uppercase font-mono block">Academic Standing</span>
          <strong>Year {user?.year || 2} • Semester {user?.semester || 4} • Section {user?.section || "A"}</strong>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-[#4D2A00]/60 glass-panel rounded-3xl border border-[rgba(77,42,0,0.1)]">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#CC6F00]" />
          <span>Loading published examination results...</span>
        </div>
      ) : !data.isPublished || data.results.length === 0 ? (
        /* Results Not Published State */
        <div className="glass-panel p-12 text-center rounded-3xl border border-[rgba(77,42,0,0.1)] space-y-3 shadow-glass">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 flex items-center justify-center mx-auto">
            <Clock className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-[#4D2A00]">Result not published yet.</h2>
          <p className="text-xs text-[#4D2A00]/70 max-w-md mx-auto">
            Your semester examination results have not been published by the academic department yet.
            Once faculty and administration publish marks, your SGPA and subject scores will be displayed here.
          </p>
        </div>
      ) : (
        /* Published Results View */
        <div className="space-y-6">
          {/* Summary Badges: SGPA & Credits */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card p-5 rounded-3xl border border-[rgba(77,42,0,0.1)] space-y-1 bg-gradient-to-br from-white/70 to-[#FDB773]/20 shadow-glass">
              <span className="text-[10px] font-mono text-[#4D2A00]/60 uppercase block">Semester Grade Point Average</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black text-[#CC6F00]">{data.sgpa?.toFixed(2)}</span>
                <span className="text-xs text-[#4D2A00]/60 font-mono">/ 10.0</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-800">
                {data.sgpa && data.sgpa >= 8.5 ? "First Class with Distinction" : data.sgpa && data.sgpa >= 7.0 ? "First Class" : "Satisfactory"}
              </span>
            </div>

            <div className="glass-card p-5 rounded-3xl border border-[rgba(77,42,0,0.1)] space-y-1 shadow-glass">
              <span className="text-[10px] font-mono text-[#4D2A00]/60 uppercase block">Total Credits Earned</span>
              <div className="text-3xl font-black text-[#4D2A00]">{data.totalCredits}</div>
              <span className="text-[10px] text-[#4D2A00]/60">Across {data.results.length} evaluated subjects</span>
            </div>

            <div className="glass-card p-5 rounded-3xl border border-[rgba(77,42,0,0.1)] space-y-1 shadow-glass">
              <span className="text-[10px] font-mono text-[#4D2A00]/60 uppercase block">Publication Status</span>
              <div className="flex items-center space-x-1.5 text-emerald-800 font-bold text-lg pt-1">
                <FileCheck2 className="w-5 h-5 text-emerald-600" />
                <span>Published</span>
              </div>
              <span className="text-[10px] text-[#4D2A00]/60">Verified institutional evaluation</span>
            </div>
          </div>

          {/* Results Breakdown Table */}
          <div className="glass-card rounded-3xl p-5 border border-[rgba(77,42,0,0.1)] space-y-4 shadow-glass">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#4D2A00]">Subject-Wise Assessment Breakdown</h2>
              <span className="text-xs text-[#4D2A00]/60 font-mono">{data.results.length} Subjects Evaluated</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[rgba(77,42,0,0.1)] text-[#4D2A00]/60 font-mono text-[11px] uppercase">
                    <th className="py-3 px-3">Subject</th>
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
                <tbody className="divide-y divide-[rgba(77,42,0,0.06)] text-[#4D2A00]">
                  {data.results.map((res) => (
                    <tr key={res.id} className="hover:bg-white/40 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-[#4D2A00]">{res.subjectName}</div>
                        <div className="text-[11px] text-[#CC6F00] font-mono">{res.subjectCode}</div>
                      </td>
                      <td className="py-3.5 px-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FDB773]/20 border border-[#CC6F00]/20">
                          {res.subjectType || "THEORY"}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 font-mono font-bold">{res.credits}</td>
                      <td className="py-3.5 px-2 font-mono text-center font-semibold">
                        {res.internalMarks ?? "—"}
                      </td>
                      <td className="py-3.5 px-2 font-mono text-center font-semibold">
                        {res.assignmentMarks ?? "—"}
                      </td>
                      <td className="py-3.5 px-2 font-mono text-center font-semibold">
                        {res.practicalMarks ?? "—"}
                      </td>
                      <td className="py-3.5 px-2 font-mono text-center font-semibold">
                        {res.endSemMarks ?? "—"}
                      </td>
                      <td className="py-3.5 px-2 font-mono font-black text-center text-[#4D2A00]">
                        {res.totalMarks ?? "—"}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        {getGradeBadge(res.grade)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t border-[rgba(77,42,0,0.08)] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#4D2A00]/60 gap-2">
              <span>Grade Scale: O (10) • E (9) • A (8) • B (7) • C (6) • D (5) • F (0)</span>
              <span>Evaluated by Assigned Faculty Members</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentResultsPage;
