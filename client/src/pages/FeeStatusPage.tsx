import React, { useState, useEffect } from "react";
import { CreditCard, AlertCircle, CheckCircle, Clock, Search, Building, DollarSign } from "lucide-react";
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
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 text-[11px] font-mono font-medium bg-campus-success/10 text-campus-success border border-campus-success/30 rounded">
            <CheckCircle className="w-3 h-3" />
            <span>Paid in Full</span>
          </span>
        );
      case "PARTIAL":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 text-[11px] font-mono font-medium bg-campus-warning/10 text-campus-warning border border-campus-warning/30 rounded">
            <Clock className="w-3 h-3" />
            <span>Partial Payment</span>
          </span>
        );
      case "OVERDUE":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 text-[11px] font-mono font-medium bg-campus-error/10 text-campus-error border border-campus-error/30 rounded">
            <AlertCircle className="w-3 h-3" />
            <span>Overdue</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 text-[11px] font-mono bg-campus-elevated text-campus-secondary border border-campus-border rounded">
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
      <div className="bg-campus-card border border-campus-border p-5 rounded-lg">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded bg-campus-elevated border border-campus-border flex items-center justify-center text-campus-gold">
            <CreditCard className="w-4 h-4" />
          </div>
          <h1 className="text-lg font-semibold text-campus-text">Academic & Hostel Fee Status</h1>
        </div>
        <p className="text-xs text-campus-muted mt-1.5 ml-10">
          Read-only fee records imported from official accounts CSV registers
        </p>
      </div>

      {isStudent ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            {loading ? (
              <div className="p-12 text-center text-xs text-campus-muted bg-campus-card border border-campus-border rounded-lg">
                <div className="w-6 h-6 border-2 border-campus-gold border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading fee records...
              </div>
            ) : !myFee ? (
              <div className="p-8 bg-campus-card border border-campus-border rounded-lg text-xs text-campus-secondary">
                No fee record is currently imported for your roll number ({user?.rollNumber || "N/A"}). Please contact the Accounts Desk if you recently enrolled.
              </div>
            ) : (
              <div className="bg-campus-card border border-campus-border rounded-lg p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-campus-border pb-4">
                  <div>
                    <h2 className="text-sm font-semibold text-campus-text">
                      Semester {myFee.semester} Fee Statement ({myFee.academicYear})
                    </h2>
                    <span className="text-xs text-campus-gold font-mono">Roll: {myFee.rollNumber}</span>
                  </div>
                  <div>{getStatusBadge(myFee.status)}</div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 bg-campus-elevated/40 border border-campus-border rounded-lg">
                    <span className="text-campus-muted block mb-1">Total Tuition & Hostel</span>
                    <span className="text-xl font-bold font-mono text-campus-text">₹{myFee.totalFee.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="p-4 bg-campus-success/5 border border-campus-success/20 rounded-lg">
                    <span className="text-campus-success block font-medium mb-1">Total Paid</span>
                    <span className="text-xl font-bold font-mono text-campus-success">₹{myFee.paidFee.toLocaleString("en-IN")}</span>
                  </div>
                  <div className={`p-4 border rounded-lg ${myFee.dueFee > 0 ? "bg-campus-error/5 border-campus-error/30" : "bg-campus-elevated/40 border-campus-border"}`}>
                    <span className={`block font-medium mb-1 ${myFee.dueFee > 0 ? "text-campus-error" : "text-campus-muted"}`}>Outstanding Dues</span>
                    <span className={`text-xl font-bold font-mono ${myFee.dueFee > 0 ? "text-campus-error" : "text-campus-text"}`}>
                      ₹{myFee.dueFee.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-campus-secondary bg-campus-elevated/60 p-3.5 border border-campus-border rounded flex items-center justify-between font-mono">
                  <span className="text-campus-muted">Due Date for Clearance:</span>
                  <span className="font-semibold text-campus-text">{new Date(myFee.dueDate).toLocaleDateString()}</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-campus-card border border-campus-border rounded-lg p-5 space-y-4 text-xs">
            <h3 className="font-semibold text-campus-text uppercase tracking-wider border-b border-campus-border pb-2.5 flex items-center space-x-2">
              <Building className="w-4 h-4 text-campus-gold" />
              <span>Payment & Accounts Help</span>
            </h3>
            <p className="text-campus-secondary leading-relaxed">
              Payments can be made at the college bank branch or via institutional NEFT/RTGS transfer. Submit the physical bank deposit receipt at the Accounts Section (Admin Block Room 104) to update your digital clearance status.
            </p>
            <div className="pt-3 border-t border-campus-border text-campus-muted space-y-2">
              <div className="flex justify-between"><span className="text-campus-secondary">Accounts Desk:</span> <span className="font-mono text-campus-text">accounts@campusdesk.edu</span></div>
              <div className="flex justify-between"><span className="text-campus-secondary">Contact:</span> <span className="font-mono text-campus-text">+91-9876543204</span></div>
              <div className="flex justify-between"><span className="text-campus-secondary">Hours:</span> <span className="text-campus-text">Mon - Sat, 09:30 - 16:30</span></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Admin Summary Cards */}
          {summary && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-campus-card border border-campus-border p-5 rounded-lg">
                <span className="text-xs text-campus-muted font-mono uppercase tracking-wider block mb-1">Total Students Recorded</span>
                <span className="text-2xl font-bold font-mono text-campus-text">{summary.totalStudents}</span>
              </div>
              <div className="bg-campus-card border border-campus-border p-5 rounded-lg">
                <span className="text-xs text-campus-success/80 font-mono uppercase tracking-wider block mb-1">Total Fees Collected</span>
                <span className="text-2xl font-bold font-mono text-campus-success">
                  ₹{summary.totalCollected.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="bg-campus-card border border-campus-border p-5 rounded-lg">
                <span className="text-xs text-campus-error/80 font-mono uppercase tracking-wider block mb-1">Total Outstanding Dues</span>
                <span className="text-2xl font-bold font-mono text-campus-error">
                  ₹{summary.totalPending.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          )}

          {/* Search bar */}
          <div className="bg-campus-card border border-campus-border p-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center space-x-2.5 w-full sm:max-w-md">
              <Search className="w-4 h-4 text-campus-muted" />
              <input
                type="text"
                placeholder="Search by student name or roll number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs px-3 py-1.5 bg-campus-bg border border-campus-border rounded text-campus-text placeholder-campus-muted focus:outline-none focus:border-campus-gold"
              />
            </div>
          </div>

          {/* All Fees Table */}
          <div className="bg-campus-card border border-campus-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-campus-elevated/60 border-b border-campus-border text-campus-muted font-mono uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Roll Number</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Semester</th>
                    <th className="py-3 px-4">Total Fee</th>
                    <th className="py-3 px-4">Paid Fee</th>
                    <th className="py-3 px-4">Due Amount</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-campus-border/60">
                  {filteredFees.map((f) => (
                    <tr key={f.id} className="hover:bg-campus-elevated/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-campus-gold">{f.rollNumber}</td>
                      <td className="py-3 px-4 font-medium text-campus-text">{f.studentName}</td>
                      <td className="py-3 px-4 text-campus-secondary">Sem {f.semester} ({f.academicYear})</td>
                      <td className="py-3 px-4 text-campus-secondary font-mono">₹{f.totalFee.toLocaleString("en-IN")}</td>
                      <td className="py-3 px-4 text-campus-success font-mono font-medium">₹{f.paidFee.toLocaleString("en-IN")}</td>
                      <td className="py-3 px-4 text-campus-error font-mono font-bold">₹{f.dueFee.toLocaleString("en-IN")}</td>
                      <td className="py-3 px-4 text-campus-muted font-mono">{new Date(f.dueDate).toLocaleDateString()}</td>
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
