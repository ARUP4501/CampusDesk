import React, { useState, useEffect, useMemo } from "react";
import {
  Package,
  CheckCircle2,
  Clock,
  Search,
  Plus,
  QrCode,
  KeyRound,
  ShieldCheck,
  Truck,
  Building,
  User,
  X,
  AlertCircle
} from "lucide-react";
import { apiRequest, UserProfile } from "../api/client.js";

interface Parcel {
  id: string;
  trackingNumber: string;
  carrier: string;
  senderInfo?: string;
  pickupOtp: string;
  status: "ARRIVED" | "COLLECTED" | "RETURNED";
  receivedAt: string;
  collectedAt?: string;
  student?: {
    id: string;
    fullName: string;
    rollNumber: string;
    hostelBlock?: string;
    roomNumber?: string;
    phone?: string;
  };
}

export const ParcelsPage: React.FC<{ user: UserProfile | null }> = ({ user }) => {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ARRIVED" | "COLLECTED">("ALL");
  const [showInwardModal, setShowInwardModal] = useState<boolean>(false);
  const [showVerifyModal, setShowVerifyModal] = useState<boolean>(false);
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [otpInput, setOtpInput] = useState<string>("");

  // Inward Form
  const [inwardForm, setInwardForm] = useState({
    studentRollNumber: "",
    carrier: "Amazon Logistics",
    trackingNumber: "",
    senderInfo: "Amazon Hub",
    notes: "Main Security Desk"
  });

  const [statusMsg, setStatusMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const isStaffOrAdmin = user?.role === "STAFF" || user?.role === "WARDEN" || user?.role === "ADMIN";

  const fetchParcels = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<{ parcels: Parcel[] }>("/api/parcels");
      setParcels(res.parcels || []);
    } catch (err: any) {
      console.error("Failed to load parcels:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParcels();
  }, []);

  const handleInwardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest("/api/parcels", {
        method: "POST",
        body: JSON.stringify(inwardForm)
      });
      setShowInwardModal(false);
      setStatusMsg({ text: "Parcel inward entry created and OTP sent to student!", type: "success" });
      setInwardForm({
        studentRollNumber: "",
        carrier: "Amazon Logistics",
        trackingNumber: "",
        senderInfo: "Amazon Hub",
        notes: "Main Security Desk"
      });
      fetchParcels();
    } catch (err: any) {
      setStatusMsg({ text: err.message || "Failed to log parcel", type: "error" });
    }
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParcel) return;
    try {
      await apiRequest(`/api/parcels/${selectedParcel.id}/collect`, {
        method: "POST",
        body: JSON.stringify({ otp: otpInput })
      });
      setShowVerifyModal(false);
      setOtpInput("");
      setSelectedParcel(null);
      setStatusMsg({ text: "Parcel handed over and marked as collected!", type: "success" });
      fetchParcels();
    } catch (err: any) {
      setStatusMsg({ text: err.message || "Invalid OTP code", type: "error" });
    }
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const filteredParcels = useMemo(() => {
    return parcels.filter((p) => {
      if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.trackingNumber.toLowerCase().includes(q) ||
        p.carrier.toLowerCase().includes(q) ||
        p.student?.fullName.toLowerCase().includes(q) ||
        p.student?.rollNumber.toLowerCase().includes(q)
      );
    });
  }, [parcels, statusFilter, searchQuery]);

  const awaitingCount = useMemo(() => parcels.filter((p) => p.status === "ARRIVED").length, [parcels]);
  const collectedCount = useMemo(() => parcels.filter((p) => p.status === "COLLECTED").length, [parcels]);

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header Banner */}
      <div className="campus-panel rounded-2xl p-6 sm:p-8 border border-[var(--border-subtle)]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="editorial-eyebrow">08 // COURIER LOGISTICS & INWARD DESK</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                SECURITY VERIFIED
              </span>
            </div>
            <h1 className="editorial-title text-2xl sm:text-3xl text-[var(--text-primary)]">
              Parcel Inward & Pickup Terminal
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-xl leading-relaxed">
              Track courier arrivals, generate secure 4-digit pickup OTP codes, and collect deliveries safely from the central campus gate or hostel desk.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isStaffOrAdmin && (
              <button
                onClick={() => setShowInwardModal(true)}
                className="btn-primary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Log Inward Parcel</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Operational Metrics strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-4 campus-block rounded-xl border border-[var(--border-subtle)]">
          <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest block">AWAITING PICKUP</span>
          <div className="text-3xl font-black text-[#FF6D1F] font-mono mt-1">{awaitingCount}</div>
          <span className="text-[10px] text-[var(--text-subtle)] font-mono">Pending student OTP collection</span>
        </div>

        <div className="p-4 campus-block rounded-xl border border-[var(--border-subtle)]">
          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block">COLLECTED DELIVERIES</span>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">{collectedCount}</div>
          <span className="text-[10px] text-[var(--text-subtle)] font-mono">Dispatched & verified</span>
        </div>

        <div className="p-4 campus-block rounded-xl border border-[var(--border-subtle)] col-span-2 sm:col-span-1">
          <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest block">TOTAL INWARD LOG</span>
          <div className="text-3xl font-black text-[var(--text-primary)] font-mono mt-1">{parcels.length}</div>
          <span className="text-[10px] text-[var(--text-subtle)] font-mono">All-time packages logged</span>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
            statusMsg.type === "success"
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
              : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
          }`}
        >
          {statusMsg.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* 3. Search & Tabs Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              statusFilter === "ALL"
                ? "bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
            }`}
          >
            ALL ({parcels.length})
          </button>
          <button
            onClick={() => setStatusFilter("ARRIVED")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              statusFilter === "ARRIVED"
                ? "bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
            }`}
          >
            AWAITING OTP ({awaitingCount})
          </button>
          <button
            onClick={() => setStatusFilter("COLLECTED")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              statusFilter === "COLLECTED"
                ? "bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
            }`}
          >
            COLLECTED ({collectedCount})
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tracking #, carrier, student..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-input)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF6D1F]"
          />
        </div>
      </div>

      {/* 4. Section 29: Status-First Parcel Cards */}
      {loading ? (
        <div className="py-20 text-center text-xs text-[var(--text-muted)] font-mono">Loading parcel records...</div>
      ) : filteredParcels.length === 0 ? (
        <div className="p-16 text-center text-xs text-[var(--text-muted)] campus-panel rounded-2xl border border-[var(--border-subtle)] font-mono space-y-2">
          <Package className="w-8 h-8 text-[var(--text-muted)]/40 mx-auto" />
          <p>No parcels matching current filter or search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredParcels.map((parcel) => {
            const isArrived = parcel.status === "ARRIVED";

            return (
              <div
                key={parcel.id}
                className="p-5 rounded-2xl campus-block flex flex-col justify-between space-y-4 border border-[var(--border-subtle)] hover:border-[#FF6D1F]/40 transition-all"
              >
                <div className="space-y-3">
                  {/* Status-First Header (Section 29) */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold ${
                        isArrived
                          ? "bg-[#FF6D1F]/15 text-[#FF6D1F] border border-[#FF6D1F]/30"
                          : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                      }`}
                    >
                      {isArrived ? "RECEIVED // AWAITING OTP" : "COLLECTED"}
                    </span>

                    <span className="px-2 py-0.5 rounded text-[10px] font-mono text-[var(--text-secondary)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                      {parcel.carrier}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">PARCEL AWB:</span>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <Package className="w-4 h-4 text-[#FF6D1F]" />
                      <span className="font-mono text-sm font-bold text-[var(--text-primary)]">{parcel.trackingNumber}</span>
                    </div>
                    {parcel.senderInfo && (
                      <p className="text-xs text-[var(--text-secondary)] mt-1">From: {parcel.senderInfo}</p>
                    )}
                  </div>

                  {/* Recipient Details */}
                  <div className="p-3 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-subtle)] text-xs space-y-1 font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--text-muted)] text-[10px]">RECIPIENT:</span>
                      <strong className="text-[var(--text-primary)] font-sans font-medium">{parcel.student?.fullName || "Student"}</strong>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
                      <span>ROLL / BLOCK:</span>
                      <span>{parcel.student?.rollNumber} • {parcel.student?.hostelBlock || "Day Scholar"}</span>
                    </div>
                  </div>

                  {/* Secure OTP Display for Student (Section 29) */}
                  {user?.role === "STUDENT" && isArrived && (
                    <div className="p-3 bg-[var(--bg-elevated)] border border-[#FF6D1F]/30 rounded-xl text-center space-y-1">
                      <span className="text-[9px] font-mono uppercase font-bold text-[#FF6D1F] tracking-wider block">
                        PICKUP SECURITY OTP
                      </span>
                      <div className="text-2xl font-mono font-black text-[var(--text-primary)] tracking-widest">
                        {parcel.pickupOtp}
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] block font-mono">
                        Show this 4-digit code to the gate officer
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
                    <span>Arrived:</span>
                    <span>{new Date(parcel.receivedAt).toLocaleDateString()}</span>
                  </div>

                  {isStaffOrAdmin && isArrived && (
                    <button
                      onClick={() => {
                        setSelectedParcel(parcel);
                        setShowVerifyModal(true);
                      }}
                      className="w-full py-2 rounded-xl text-xs font-bold btn-primary flex items-center justify-center space-x-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Verify Student OTP & Handover</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inward Modal */}
      {showInwardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="campus-block rounded-2xl max-w-md w-full p-6 space-y-4 border border-[var(--border-subtle)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] font-mono uppercase tracking-wider">Log Inward Parcel Delivery</h3>
                <p className="text-xs text-[var(--text-secondary)]">Generate 4-digit OTP for student gate verification.</p>
              </div>
              <button onClick={() => setShowInwardModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInwardSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[var(--text-secondary)] mb-1 font-mono uppercase text-[10px]">Student Roll Number *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. 2024CS101"
                  value={inwardForm.studentRollNumber}
                  onChange={(e) => setInwardForm({ ...inwardForm, studentRollNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-input)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF6D1F] font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] mb-1 font-mono uppercase text-[10px]">Carrier / Courier Service *</label>
                <select
                  value={inwardForm.carrier}
                  onChange={(e) => setInwardForm({ ...inwardForm, carrier: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-[#FF6D1F] font-mono"
                >
                  <option value="Amazon Logistics">Amazon Logistics</option>
                  <option value="Flipkart / Ekart">Flipkart / Ekart</option>
                  <option value="BlueDart">BlueDart Express</option>
                  <option value="DTDC">DTDC Courier</option>
                  <option value="India Post">India Post / Speed Post</option>
                  <option value="Delhivery">Delhivery</option>
                  <option value="Other">Other / Local Delivery</option>
                </select>
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] mb-1 font-mono uppercase text-[10px]">Tracking Number / AWB *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. AMZ984129841"
                  value={inwardForm.trackingNumber}
                  onChange={(e) => setInwardForm({ ...inwardForm, trackingNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-input)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF6D1F] font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] mb-1 font-mono uppercase text-[10px]">Sender Details</label>
                <input
                  type="text"
                  placeholder="e.g. Amazon Hub, Parents, Book Publisher"
                  value={inwardForm.senderInfo}
                  onChange={(e) => setInwardForm({ ...inwardForm, senderInfo: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-input)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF6D1F]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setShowInwardModal(false)}
                  className="btn-secondary px-4 py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary px-5 py-2 rounded-xl font-bold">
                  Log Parcel & Issue OTP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verify OTP Modal */}
      {showVerifyModal && selectedParcel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="campus-block rounded-2xl max-w-sm w-full p-6 space-y-4 border border-[var(--border-subtle)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h3 className="text-sm font-bold text-[var(--text-primary)] font-mono uppercase tracking-wider">Verify Student Pickup OTP</h3>
              <button onClick={() => setShowVerifyModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-subtle)] text-xs space-y-1 font-mono">
              <p className="text-[var(--text-muted)] text-[10px]">AWB: {selectedParcel.trackingNumber}</p>
              <p className="text-[var(--text-primary)] font-bold font-sans">{selectedParcel.student?.fullName}</p>
              <p className="text-[var(--text-muted)] text-[11px]">{selectedParcel.student?.rollNumber}</p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs">
              <div>
                <label className="block text-[var(--text-secondary)] mb-1 font-mono uppercase text-[10px]">Enter 4-Digit Student OTP *</label>
                <input
                  required
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 8492"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-[#FF6D1F] font-mono text-center text-xl font-bold tracking-widest"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVerifyModal(false)}
                  className="btn-secondary px-4 py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary px-5 py-2 rounded-xl font-bold">
                  Confirm Handover
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParcelsPage;
