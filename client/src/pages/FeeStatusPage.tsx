import React, { useState, useEffect } from "react";
import { CreditCard, AlertCircle, CheckCircle2, Clock, Search, Building, IndianRupee } from "lucide-react";
import { apiRequest, UserProfile } from "../api/client.js";

interface FeeRecordItem {
  id: string;
  rollNumber: string;
  studentName: string;
  totalFee: number;
  paidFee: number;
  dueFee: number;
  dueDate: string;
  semester: number;
  academicYear: string;
  status: string;
  importedAt: string;
}

interface FeeSummary {
  totalStudents: number;
  totalCollected: number;
  totalPending: number;
}

export const FeeStatusPage: React.FC<{ user: UserProfile | null }> = ({ user }) => {
  const [myFee, setMyFee] = useState<FeeRecordItem | null>(null);
  const [allFees, setAllFees] = useState<FeeRecordItem[]>([]);
  const [summary, setSummary] = useState<FeeSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");

  const isStudent = user?.role === "STUDENT";

  const fetchFeeData = async () => {
    try {
      setLoading(true);
      if (isStudent) {
        const data = await apiRequest<{ feeRecord: FeeRecordItem | null }>("/api/fees/my-status");
        setMyFee(data.feeRecord);
      } else {
        const data = await apiRequest<{ fees: FeeRecordItem[]; summary: FeeSummary }>("/api/fees/all");
        setAllFees(data.fees || []);
        setSummary(data.summary || null);
      }
    } catch (err) {
      console.error("Failed to load fees:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeData();
  }, [isStudent]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 rounded-md">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Paid in Full</span>
          </span>
        );
      case "PARTIAL":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 text-[10px] font-mono font-bold bg-[#FF6D1F]/20 text-[#FF6D1F] border border-[#FF6D1F]/25 rounded-md">
            <Clock className="w-3.5 h-3.5 text-[#FF6D1F]" />
            <span>Partial Payment</span>
          </span>
        );
      case "OVERDUE":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 text-[10px] font-mono font-bold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 rounded-md">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>Overdue</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-[10px] font-mono bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)] rounded-md">
            Payment Due
          </span>
        );
    }
  };

  const filteredFees = allFees.filter(
    (f) =>
      f.rollNumber.toLowerCase().includes(search.toLowerCase()) ||
      f.studentName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 glass-panel p-6 rounded-3xl border border-[var(--border-subtle)] shadow-glass">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-[#FF6D1F]/20 border border-[#FF6D1F]/30 flex items-center justify-center text-[#FF6D1F]">
            <IndianRupee className="w-5 h-5 text-[#FF6D1F]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Institutional Fee Status</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Semester tuition fees, hostel room charges, payment ledger, and receipts
            </p>
          </div>
        </div>
      </div>

      {isStudent ? (
        myFee ? (
          <div className="max-w-2xl mx-auto glass-panel rounded-3xl p-6 sm:p-8 space-y-6 border border-[var(--border-subtle)] shadow-glass">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase text-[var(--text-muted)]">Fee Assessment Token</span>
                <h2 className="text-lg font-bold text-[var(--text-primary)] mt-0.5">{myFee.studentName}</h2>
                <p className="text-xs font-mono font-bold text-[#FF6D1F]">Roll Number: {myFee.rollNumber}</p>
              </div>
              <div>{getStatusBadge(myFee.status)}</div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-4 campus-block rounded-2xl border border-[var(--border-subtle)]">
                <span className="text-[10px] font-mono uppercase text-[var(--text-muted)]">Total Dues</span>
                <span className="text-lg sm:text-xl font-bold text-[var(--text-primary)] font-mono block mt-1">
                  ₹{myFee.totalFee.toLocaleString()}
                </span>
              </div>
              <div className="p-4 campus-block rounded-2xl border border-[var(--border-subtle)]">
                <span className="text-[10px] font-mono uppercase text-[var(--text-muted)]">Amount Paid</span>
                <span className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono block mt-1">
                  ₹{myFee.paidFee.toLocaleString()}
                </span>
              </div>
              <div className="p-4 campus-block rounded-2xl border border-[var(--border-subtle)]">
                <span className="text-[10px] font-mono uppercase text-[var(--text-muted)]">Pending Balance</span>
                <span className="text-lg sm:text-xl font-bold text-[#FF6D1F] font-mono block mt-1">
                  ₹{myFee.dueFee.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="text-xs text-[var(--text-primary)] space-y-1.5 pt-2 border-t border-[var(--border-subtle)]">
              <p>Academic Year: <strong>{myFee.academicYear}</strong> • Semester: <strong>{myFee.semester}</strong></p>
              <p className="font-mono text-[var(--text-muted)]">Payment Due Date: {new Date(myFee.dueDate).toLocaleDateString()}</p>
            </div>
          </div>
        ) : (
          <div className="p-14 text-center text-xs text-[var(--text-muted)] glass-panel rounded-3xl border border-[var(--border-subtle)]">
            No fee records currently imported for your account. Please visit the accounts desk.
          </div>
        )
      ) : (
        /* Admin Fee Overview */
        <div className="space-y-6">
          {summary && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-3xl glass-card border border-[var(--border-subtle)]">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Total Enrolled Students</span>
                <span className="text-3xl font-extrabold text-[var(--text-primary)] font-mono block mt-2">{summary.totalStudents}</span>
              </div>
              <div className="p-5 rounded-3xl glass-card border border-[var(--border-subtle)]">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Total Collections Received</span>
                <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono block mt-2">₹{summary.totalCollected.toLocaleString()}</span>
              </div>
              <div className="p-5 rounded-3xl glass-card border border-[var(--border-subtle)]">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Outstanding Pending Dues</span>
                <span className="text-3xl font-extrabold text-[#FF6D1F] font-mono block mt-2">₹{summary.totalPending.toLocaleString()}</span>
              </div>
            </div>
          )}

          <div className="glass-panel rounded-3xl overflow-hidden border border-[var(--border-subtle)] shadow-glass">
            <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <div className="relative w-full max-w-sm flex items-center">
                <Search className="w-4 h-4 text-[var(--text-subtle)] absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search student or roll number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-1.5 text-xs bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-[#FF6D1F]"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] text-[var(--text-secondary)] font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Roll Number</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Total Fee</th>
                    <th className="py-3 px-4">Paid Fee</th>
                    <th className="py-3 px-4">Due Balance</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {filteredFees.map((f) => (
                    <tr key={f.id} className="hover:bg-[var(--bg-hover)]/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#FF6D1F]">{f.rollNumber}</td>
                      <td className="py-3 px-4 font-semibold text-[var(--text-primary)]">{f.studentName}</td>
                      <td className="py-3 px-4 font-mono text-[var(--text-primary)]">₹{f.totalFee.toLocaleString()}</td>
                      <td className="py-3 px-4 font-mono text-emerald-600 dark:text-emerald-400">₹{f.paidFee.toLocaleString()}</td>
                      <td className="py-3 px-4 font-mono text-[#FF6D1F] font-bold">₹{f.dueFee.toLocaleString()}</td>
                      <td className="py-3 px-4">{getStatusBadge(f.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeStatusPage;
