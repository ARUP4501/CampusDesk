import React, { useState, useEffect } from "react";
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
  X
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

  const filteredParcels = parcels.filter((p) =>
    p.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.carrier.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.student?.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.student?.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-campus-border">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-white/80 text-campus-accent border border-campus-border">
                Campus Logistics & Inward Desk
              </span>
              <span className="text-xs font-mono text-campus-secondary">Security Verified</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-campus-text">
              Parcel & Courier Management
            </h1>
            <p className="text-xs sm:text-sm text-campus-secondary max-w-xl leading-relaxed">
              Track courier arrivals, generate secure 4-digit pickup OTP codes, and collect deliveries safely from the central campus gate or hostel desk.
            </p>
          </div>

          {isStaffOrAdmin && (
            <button
              onClick={() => setShowInwardModal(true)}
              className="btn-primary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Log Inward Parcel</span>
            </button>
          )}
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center space-x-2 animate-fadeIn ${
            statusMsg.type === "success" ? "status-badge-success" : "status-badge-error"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-campus-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by tracking number, courier, student name, or roll number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-campus-border rounded-xl bg-white/70 text-xs text-campus-text placeholder:text-campus-muted focus:outline-none focus:border-campus-accent"
        />
      </div>

      {/* Parcel List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-campus-muted">Loading parcel records...</div>
      ) : filteredParcels.length === 0 ? (
        <div className="p-12 text-center text-xs text-campus-muted glass-card rounded-2xl">
          No parcels found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredParcels.map((parcel) => (
            <div
              key={parcel.id}
              className="p-5 rounded-3xl glass-card flex flex-col justify-between space-y-4 border border-campus-border hover:border-campus-accent/30 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/80 text-campus-accent border border-campus-border">
                    {parcel.carrier}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
                      parcel.status === "ARRIVED"
                        ? "status-badge-warning"
                        : parcel.status === "COLLECTED"
                        ? "status-badge-success"
                        : "status-badge-neutral"
                    }`}
                  >
                    {parcel.status === "ARRIVED" ? "READY FOR PICKUP" : parcel.status}
                  </span>
                </div>

                <div>
                  <div className="flex items-center space-x-2">
                    <Package className="w-4 h-4 text-campus-accent" />
                    <span className="font-mono text-xs font-bold text-campus-text">{parcel.trackingNumber}</span>
                  </div>
                  {parcel.senderInfo && (
                    <p className="text-xs text-campus-secondary mt-1">From: {parcel.senderInfo}</p>
                  )}
                </div>

                {/* Recipient details */}
                <div className="p-3 bg-white/70 rounded-2xl border border-campus-border text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-campus-muted font-mono">Recipient:</span>
                    <strong className="text-campus-text">{parcel.student?.fullName || "Student"}</strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-campus-secondary">
                    <span>Roll / Block:</span>
                    <span>{parcel.student?.rollNumber} • {parcel.student?.hostelBlock || "Day Scholar"}</span>
                  </div>
                </div>

                {/* Secure OTP Display for Student */}
                {user?.role === "STUDENT" && parcel.status === "ARRIVED" && (
                  <div className="p-3 bg-campus-btnPrimary/40 border border-campus-accent/30 rounded-2xl text-center space-y-1">
                    <span className="text-[10px] font-mono uppercase font-bold text-campus-accent">
                      Your Pickup OTP
                    </span>
                    <div className="text-2xl font-mono font-extrabold text-campus-text tracking-widest">
                      {parcel.pickupOtp}
                    </div>
                    <span className="text-[10px] text-campus-secondary block">
                      Show this 4-digit code to the gate guard to collect your package
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-campus-border space-y-2 text-xs text-campus-secondary">
                <div className="flex items-center justify-between text-[11px] font-mono text-campus-muted">
                  <span>Arrived:</span>
                  <span>{new Date(parcel.receivedAt).toLocaleDateString()}</span>
                </div>

                {isStaffOrAdmin && parcel.status === "ARRIVED" && (
                  <button
                    onClick={() => {
                      setSelectedParcel(parcel);
                      setShowVerifyModal(true);
                    }}
                    className="w-full py-2 rounded-xl text-xs font-bold btn-primary flex items-center justify-center space-x-1.5"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify Student OTP & Handover</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inward Modal */}
      {showInwardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-fadeIn">
          <div className="glass-modal rounded-3xl max-w-md w-full p-6 space-y-4 shadow-elevated">
            <div className="flex items-center justify-between border-b border-campus-border pb-3">
              <h3 className="text-base font-bold text-campus-text">Log Inward Parcel Delivery</h3>
              <button onClick={() => setShowInwardModal(false)} className="text-campus-muted hover:text-campus-text p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInwardSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-campus-text mb-1 font-semibold">Student Roll Number *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. 2024CS101"
                  value={inwardForm.studentRollNumber}
                  onChange={(e) => setInwardForm({ ...inwardForm, studentRollNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-campus-border rounded-xl bg-white/70 text-campus-text focus:outline-none focus:border-campus-accent uppercase"
                />
              </div>

              <div>
                <label className="block text-campus-text mb-1 font-semibold">Carrier / Courier Service *</label>
                <select
                  value={inwardForm.carrier}
                  onChange={(e) => setInwardForm({ ...inwardForm, carrier: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-campus-border rounded-xl bg-white/70 text-campus-text focus:outline-none focus:border-campus-accent"
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
                <label className="block text-campus-text mb-1 font-semibold">Tracking Number / AWB *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. AMZ984129841"
                  value={inwardForm.trackingNumber}
                  onChange={(e) => setInwardForm({ ...inwardForm, trackingNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-campus-border rounded-xl bg-white/70 text-campus-text focus:outline-none focus:border-campus-accent font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-campus-text mb-1 font-semibold">Sender Details</label>
                <input
                  type="text"
                  placeholder="e.g. Amazon Hub, Parents, Book Publisher"
                  value={inwardForm.senderInfo}
                  onChange={(e) => setInwardForm({ ...inwardForm, senderInfo: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-campus-border rounded-xl bg-white/70 text-campus-text focus:outline-none focus:border-campus-accent"
                />
              </div>

              <div className="flex justify-end space-x-2.5 pt-3 border-t border-campus-border">
                <button
                  type="button"
                  onClick={() => setShowInwardModal(false)}
                  className="btn-secondary px-4 py-2 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary px-5 py-2 rounded-xl font-bold">
                  Log Parcel & Send OTP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verify OTP Modal */}
      {showVerifyModal && selectedParcel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-fadeIn">
          <div className="glass-modal rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-elevated">
            <div className="flex items-center justify-between border-b border-campus-border pb-3">
              <h3 className="text-base font-bold text-campus-text">Verify Student Pickup</h3>
              <button onClick={() => setShowVerifyModal(false)} className="text-campus-muted hover:text-campus-text p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-2">
              <p className="text-campus-secondary">
                Enter the 4-digit OTP shown on the student's CampusDesk mobile app:
              </p>
              <div className="p-3 bg-white/70 rounded-xl border border-campus-border font-mono">
                <div>Parcel: <strong>{selectedParcel.trackingNumber}</strong></div>
                <div>Recipient: <strong>{selectedParcel.student?.fullName}</strong></div>
              </div>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <input
                  required
                  maxLength={4}
                  type="text"
                  autoFocus
                  placeholder="0000"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-campus-accent/50 rounded-2xl bg-white text-center text-3xl font-mono font-bold tracking-widest text-campus-text focus:outline-none focus:border-campus-accent"
                />
              </div>

              <div className="flex justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setShowVerifyModal(false)}
                  className="btn-secondary px-4 py-2 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary px-5 py-2 rounded-xl text-xs font-bold">
                  Verify & Release
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
