import React, { useState, useEffect } from "react";
import { CreditCard, AlertCircle, CheckCircle, Clock, Search, Building } from "lucide-react";
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
        return <span className="px-2 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-[4px]">Paid in Full</span>;
      case "PARTIAL":
        return <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 rounded-[4px]">Partial Payment</span>;
      case "OVERDUE":
        return <span className="px-2 py-0.5 text-xs font-bold bg-red-100 text-red-900 border border-red-300 rounded-[4px]">Overdue</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-bold bg-stone-100 text-stone-800 border border-stone-300 rounded-[4px]">Payment Due</span>;
    }
  };

  const filteredFees = allFees.filter(
    (f) =>
      f.rollNumber.toLowerCase().includes(search.toLowerCase()) ||
      f.studentName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white border border-stone-300 p-4 rounded-[6px]">
        <h1 className="text-xl font-bold text-stone-900">Academic & Hostel Fee Status</h1>
        <p className="text-xs text-stone-600 mt-0.5">
          Read-only fee records imported from official accounts CSV registers
        </p>
      </div>

      {isStudent ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            {loading ? (
              <div className="p-8 text-center text-xs text-stone-500 bg-white border border-stone-300 rounded-[4px]">
                Loading fee records...
              </div>
            ) : !myFee ? (
              <div className="p-6 bg-white border border-stone-300 rounded-[6px] text-xs text-stone-600 shadow-sm">
                No fee record is currently imported for your roll number ({user?.rollNumber || "N/A"}). Please contact the Accounts Desk if you recently enrolled.
              </div>
            ) : (
              <div className="bg-white border border-stone-300 rounded-[6px] p-6 space-y-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-stone-900">
                      Semester {myFee.semester} Fee Statement ({myFee.academicYear})
                    </h2>
                    <span className="text-xs text-stone-500 font-mono">Roll: {myFee.rollNumber}</span>
                  </div>
                  <div>{getStatusBadge(myFee.status)}</div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-stone-50 border border-stone-200 rounded-[4px]">
                    <span className="text-stone-500 block">Total Tuition & Hostel</span>
                    <span className="text-lg font-bold text-stone-900">Rs. {myFee.totalFee.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-[4px]">
                    <span className="text-emerald-800 block font-medium">Total Paid</span>
                    <span className="text-lg font-bold text-emerald-900">Rs. {myFee.paidFee.toLocaleString("en-IN")}</span>
                  </div>
                  <div className={`p-3 border rounded-[4px] ${myFee.dueFee > 0 ? "bg-red-50 border-red-200" : "bg-stone-50 border-stone-200"}`}>
                    <span className={`block font-medium ${myFee.dueFee > 0 ? "text-red-800" : "text-stone-500"}`}>Outstanding Dues</span>
                    <span className={`text-lg font-bold ${myFee.dueFee > 0 ? "text-red-900" : "text-stone-900"}`}>
                      Rs. {myFee.dueFee.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-stone-600 bg-stone-50 p-3 border border-stone-200 rounded-[4px] flex items-center justify-between">
                  <span>Due Date for Clearance:</span>
                  <span className="font-bold text-stone-900">{new Date(myFee.dueDate).toLocaleDateString()}</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white border border-stone-300 rounded-[6px] p-5 space-y-3 shadow-sm text-xs">
            <h3 className="font-bold text-stone-900 uppercase tracking-wider border-b border-stone-200 pb-2 flex items-center space-x-1.5">
              <Building className="w-4 h-4 text-stone-700" />
              <span>Payment & Accounts Help</span>
            </h3>
            <p className="text-stone-600 leading-relaxed">
              Payments can be made at the college bank branch or via institutional NEFT/RTGS transfer. Submit the physical bank deposit receipt at the Accounts Section (Admin Block Room 104) to update your digital clearance status.
            </p>
            <div className="pt-2 border-t border-stone-200 text-stone-600 space-y-1">
              <div><strong>Accounts Desk:</strong> accounts@campusdesk.edu</div>
              <div><strong>Contact:</strong> +91-9876543204</div>
              <div><strong>Hours:</strong> Mon - Sat, 09:30 to 16:30</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Admin Summary Cards */}
          {summary && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-stone-300 p-4 rounded-[6px]">
                <span className="text-xs text-stone-500 font-semibold block">Total Students Recorded</span>
                <span className="text-2xl font-bold text-stone-900">{summary.totalStudents}</span>
              </div>
              <div className="bg-white border border-stone-300 p-4 rounded-[6px]">
                <span className="text-xs text-stone-500 font-semibold block">Total Fees Collected</span>
                <span className="text-2xl font-bold text-emerald-800">
                  Rs. {summary.totalCollected.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="bg-white border border-stone-300 p-4 rounded-[6px]">
                <span className="text-xs text-stone-500 font-semibold block">Total Outstanding Dues</span>
                <span className="text-2xl font-bold text-red-800">
                  Rs. {summary.totalPending.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          )}

          {/* Search bar */}
          <div className="bg-white border border-stone-300 p-3 rounded-[4px] flex items-center justify-between">
            <div className="flex items-center space-x-2 w-full sm:max-w-md">
              <Search className="w-4 h-4 text-stone-400" />
              <input
                type="text"
                placeholder="Search by student name or roll number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs px-2 py-1 border border-stone-300 rounded-[4px] focus:outline-none"
              />
            </div>
          </div>

          {/* All Fees Table */}
          <div className="bg-white border border-stone-300 rounded-[6px] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-100 border-b border-stone-300 text-stone-700 font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Roll Number</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Semester</th>
                    <th className="py-2.5 px-3">Total Fee</th>
                    <th className="py-2.5 px-3">Paid Fee</th>
                    <th className="py-2.5 px-3">Due Amount</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {filteredFees.map((f) => (
                    <tr key={f.id} className="hover:bg-stone-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-stone-900">{f.rollNumber}</td>
                      <td className="py-2.5 px-3 font-semibold text-stone-900">{f.studentName}</td>
                      <td className="py-2.5 px-3 text-stone-700">Sem {f.semester} ({f.academicYear})</td>
                      <td className="py-2.5 px-3 text-stone-800 font-medium">Rs. {f.totalFee.toLocaleString("en-IN")}</td>
                      <td className="py-2.5 px-3 text-emerald-800 font-medium">Rs. {f.paidFee.toLocaleString("en-IN")}</td>
                      <td className="py-2.5 px-3 text-red-800 font-bold">Rs. {f.dueFee.toLocaleString("en-IN")}</td>
                      <td className="py-2.5 px-3 text-stone-600">{new Date(f.dueDate).toLocaleDateString()}</td>
                      <td className="py-2.5 px-3">{getStatusBadge(f.status)}</td>
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
