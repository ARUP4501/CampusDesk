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
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate("/tickets")}
          className="p-2.5 glass-panel rounded-xl text-[#4D2A00]/70 hover:text-[#4D2A00] border border-[rgba(77,42,0,0.1)] transition-colors"
          aria-label="Back to tickets list"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#4D2A00]">
            {t("tickets.newTicket", "Report Maintenance Complaint")}
          </h1>
          <p className="text-xs text-[#4D2A00]/70 mt-0.5">
            Submit hostel repair requests with automatic department dispatch
          </p>
        </div>
      </div>

      {resultMessage && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl text-xs text-emerald-950 font-medium flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
          <span>{resultMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-500/20 border border-rose-500/30 rounded-2xl text-xs text-rose-900 font-medium flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-panel rounded-3xl p-6 sm:p-8 space-y-5 border border-[rgba(77,42,0,0.1)] shadow-glass">
        <div>
          <label className="block text-xs font-semibold text-[#4D2A00] mb-1.5">
            Complaint Summary / Title *
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Bathroom tap leaking heavily in 2nd floor washroom"
            className="w-full px-3.5 py-2.5 bg-white/60 border border-[rgba(77,42,0,0.12)] rounded-xl text-[#4D2A00] text-xs placeholder-[#4D2A00]/40 focus:outline-none focus:border-[#CC6F00]"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-[#4D2A00]">
              Detailed Description *
            </label>
            <span className="text-[10px] text-[#CC6F00] flex items-center space-x-1 font-semibold">
              <Sparkles className="w-3 h-3" />
              <span>Auto-categorizes with NLP</span>
            </span>
          </div>
          <textarea
            required
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe the issue, exact defect location, and when it started..."
            className="w-full px-3.5 py-2.5 bg-white/60 border border-[rgba(77,42,0,0.12)] rounded-xl text-[#4D2A00] text-xs placeholder-[#4D2A00]/40 focus:outline-none focus:border-[#CC6F00] resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#4D2A00] mb-1.5">
              Hostel Block *
            </label>
            <select
              value={formData.hostelBlock}
              onChange={(e) => setFormData({ ...formData, hostelBlock: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-white/60 border border-[rgba(77,42,0,0.12)] rounded-xl text-[#4D2A00] text-xs focus:outline-none focus:border-[#CC6F00]"
            >
              <option value="Hostel-A">Hostel-A (Boys Senior)</option>
              <option value="Hostel-B">Hostel-B (Boys Junior)</option>
              <option value="Hostel-C">Hostel-C (Girls Campus)</option>
              <option value="Academic-Block">Academic Complex</option>
              <option value="Mess-Dining">Mess & Dining Hall</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4D2A00] mb-1.5">
              Room / Location Identifier *
            </label>
            <input
              type="text"
              required
              value={formData.roomNumber}
              onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
              placeholder="e.g. Rm 204 or 2nd Floor Corridor"
              className="w-full px-3.5 py-2.5 bg-white/60 border border-[rgba(77,42,0,0.12)] rounded-xl text-[#4D2A00] text-xs placeholder-[#4D2A00]/40 focus:outline-none focus:border-[#CC6F00]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#4D2A00] mb-1.5">
              Manual Category Override (Optional)
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-white/60 border border-[rgba(77,42,0,0.12)] rounded-xl text-[#4D2A00] text-xs focus:outline-none focus:border-[#CC6F00]"
            >
              <option value="">Auto-Detect via ML Classifier</option>
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
            <label className="block text-xs font-semibold text-[#4D2A00] mb-1.5">
              Reported Urgency
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-white/60 border border-[rgba(77,42,0,0.12)] rounded-xl text-[#4D2A00] text-xs focus:outline-none focus:border-[#CC6F00]"
            >
              <option value="LOW">Low (Routine Check)</option>
              <option value="MEDIUM">Medium (Standard 24h SLA)</option>
              <option value="HIGH">High (Urgent Attention)</option>
            </select>
          </div>
        </div>

        {/* Photo Attachment */}
        <div>
          <label className="block text-xs font-semibold text-[#4D2A00] mb-1.5">
            Attach Photo Evidence (Optional)
          </label>
          <div className="border border-dashed border-[#CC6F00]/30 hover:border-[#CC6F00] rounded-2xl p-4 text-center bg-white/40 transition-colors cursor-pointer relative">
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            {photoPreview ? (
              <div className="space-y-2">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="max-h-44 mx-auto rounded-xl object-contain border border-[rgba(77,42,0,0.1)]"
                />
                <p className="text-[11px] text-[#CC6F00] font-bold">Click to replace photo</p>
              </div>
            ) : (
              <div className="py-3 flex flex-col items-center justify-center space-y-1.5 text-xs text-[#4D2A00]/70">
                <Upload className="w-5 h-5 text-[#CC6F00]" />
                <span className="text-[#4D2A00] font-semibold">Drop an image here or browse</span>
                <span className="text-[10px] text-[#4D2A00]/50">Max 5MB compressed directly</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[rgba(77,42,0,0.1)]">
          <button
            type="button"
            onClick={() => navigate("/tickets")}
            className="btn-secondary px-4 py-2.5 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary px-6 py-2.5 text-xs font-bold disabled:opacity-50 flex items-center space-x-1.5 shadow-sm"
          >
            <span>{loading ? "Submitting..." : "Submit Complaint"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewTicketPage;
