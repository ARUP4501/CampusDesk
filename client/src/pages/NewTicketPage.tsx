import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Sparkles, Upload, Wrench, AlertCircle, CheckCircle2 } from "lucide-react";
import { apiRequest, UserProfile } from "../api/client.js";

export const NewTicketPage: React.FC<{ user: UserProfile | null }> = ({ user }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    hostelBlock: user?.hostelBlock || "Hostel-A",
    roomNumber: user?.roomNumber || "",
    priority: "MEDIUM"
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith("image/")) {
        setError("Only image files (JPEG, PNG, WebP) are allowed.");
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResultMessage(null);
    setLoading(true);

    try {
      const dataPayload = new FormData();
      dataPayload.append("title", formData.title);
      dataPayload.append("description", formData.description);
      if (formData.category) dataPayload.append("category", formData.category);
      dataPayload.append("hostelBlock", formData.hostelBlock);
      dataPayload.append("roomNumber", formData.roomNumber);
      dataPayload.append("priority", formData.priority);

      if (photoFile) {
        dataPayload.append("photo", photoFile);
      }

      const response = await apiRequest<{
        ticket?: { id: string; ticketNumber: string; category: string };
        predictedCategory?: string;
        _offlineQueued?: boolean;
        message?: string;
      }>(
        "/api/tickets",
        {
          method: "POST",
          body: dataPayload
        },
        {
          label: `Complaint: ${formData.title}`,
          data: formData
        }
      );

      if (response._offlineQueued) {
        setResultMessage(response.message || "Complaint saved offline in local queue.");
        setTimeout(() => navigate("/tickets"), 2000);
        return;
      }

      if (response.ticket) {
        navigate(`/tickets/${response.ticket.id}`);
      } else {
        navigate("/tickets");
      }
    } catch (err: any) {
      setError(err.message || "Failed to submit ticket.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate("/tickets")}
          className="p-2 bg-[var(--bg-elevated)] rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors"
          aria-label="Back to tickets list"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <span className="editorial-eyebrow">07 // LOG DEFECT</span>
          <h1 className="editorial-title text-xl sm:text-2xl font-bold text-[var(--text-primary)] mt-0.5">
            {t("tickets.newTicket", "Report Maintenance Complaint")}
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Submit hostel repair requests with automated triage & SLA timer dispatch.
          </p>
        </div>
      </div>

      {resultMessage && (
        <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 font-mono flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{resultMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-400 font-mono flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="campus-panel rounded-2xl p-6 sm:p-8 space-y-4 border border-[var(--border-subtle)]">
        <div>
          <label className="block text-[10px] font-mono uppercase text-[var(--text-secondary)] mb-1">
            Complaint Summary / Title *
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Bathroom tap leaking heavily in 2nd floor washroom"
            className="w-full px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-xs placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF6D1F]"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[10px] font-mono uppercase text-[var(--text-secondary)]">
              Detailed Description *
            </label>
            <span className="text-[10px] text-[#FF6D1F] flex items-center space-x-1 font-mono">
              <Sparkles className="w-3 h-3" />
              <span>Auto-triage with NLP</span>
            </span>
          </div>
          <textarea
            required
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe the defect, exact location, and when it started..."
            className="w-full px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-xs placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF6D1F] resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-[10px] font-mono uppercase text-[var(--text-secondary)] mb-1">
              Hostel Block *
            </label>
            <select
              value={formData.hostelBlock}
              onChange={(e) => setFormData({ ...formData, hostelBlock: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-xs focus:outline-none focus:border-[#FF6D1F] font-mono"
            >
              <option value="Hostel-A">Hostel-A (Boys Senior)</option>
              <option value="Hostel-B">Hostel-B (Boys Junior)</option>
              <option value="Hostel-C">Hostel-C (Girls Campus)</option>
              <option value="Academic-Block">Academic Complex</option>
              <option value="Mess-Dining">Mess & Dining Hall</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase text-[var(--text-secondary)] mb-1">
              Room / Location Identifier *
            </label>
            <input
              type="text"
              required
              value={formData.roomNumber}
              onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
              placeholder="e.g. Rm 204 or 2nd Floor Corridor"
              className="w-full px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-xs placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF6D1F]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-[10px] font-mono uppercase text-[var(--text-secondary)] mb-1">
              Manual Category Override (Optional)
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-xs focus:outline-none focus:border-[#FF6D1F] font-mono"
            >
              <option value="">Auto-Detect via Classifier</option>
              <option value="PLUMBING">Plumbing</option>
              <option value="ELECTRICAL">Electrical</option>
              <option value="CARPENTRY">Carpentry</option>
              <option value="MASONRY">Masonry</option>
              <option value="NETWORK_WIFI">Network/Wi-Fi</option>
              <option value="HOUSEKEEPING">Housekeeping</option>
              <option value="SECURITY">Security</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase text-[var(--text-secondary)] mb-1">
              Reported Urgency
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-xs focus:outline-none focus:border-[#FF6D1F] font-mono"
            >
              <option value="LOW">LOW (Cosmetic / 48h SLA)</option>
              <option value="MEDIUM">MEDIUM (Standard Queue / 24h SLA)</option>
              <option value="HIGH">HIGH (Urgent / 12h SLA)</option>
              <option value="CRITICAL">CRITICAL (Immediate Risk / 4h SLA)</option>
            </select>
          </div>
        </div>

        {/* Photo Evidence */}
        <div>
          <label className="block text-[10px] font-mono uppercase text-[var(--text-secondary)] mb-1">
            Photo Evidence (Optional)
          </label>
          <div className="flex items-center space-x-3">
            <label className="cursor-pointer px-4 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[#FF6D1F] flex items-center space-x-2 text-xs transition-colors font-mono">
              <Upload className="w-3.5 h-3.5 text-[#FF6D1F]" />
              <span>{photoFile ? photoFile.name : "Choose Image File"}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </label>
            {photoPreview && (
              <div className="w-10 h-10 rounded-lg overflow-hidden border border-[var(--border-subtle)] shrink-0">
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={() => navigate("/tickets")}
            className="btn-secondary px-4 py-2 text-xs rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary px-6 py-2 text-xs font-bold rounded-xl disabled:opacity-50"
          >
            {loading ? "Registering Defect..." : "Submit Complaint"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewTicketPage;
