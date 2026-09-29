import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Wrench, ArrowLeft, Upload, Sparkles, AlertTriangle } from "lucide-react";
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
        setResultMessage(response.message || "Complaint saved offline in queue.");
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
          className="p-1.5 bg-white border border-stone-300 rounded-[4px] text-stone-700 hover:bg-stone-100"
          aria-label="Back to tickets list"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-stone-900">
            {t("tickets.newTicket", "Register Maintenance Complaint")}
          </h1>
          <p className="text-xs text-stone-600">
            Auto-classified into the correct departmental queue using text pattern analysis
          </p>
        </div>
      </div>

      {error && (
        <div role="alert" className="p-3 text-xs font-medium text-red-900 bg-red-50 border border-red-200 rounded-[4px]">
          {error}
        </div>
      )}

      {resultMessage && (
        <div role="status" className="p-3 text-xs font-medium text-emerald-900 bg-emerald-50 border border-emerald-300 rounded-[4px]">
          {resultMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-stone-300 rounded-[6px] p-6 space-y-4 shadow-sm">
        <div>
          <label htmlFor="title" className="block text-xs font-semibold text-stone-800 mb-1">
            Complaint Summary / Title *
          </label>
          <input
            id="title"
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Tap leaking continuously in bathroom"
            className="w-full text-sm px-3 py-2 border border-stone-300 rounded-[4px] focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-xs font-semibold text-stone-800 mb-1">
            Detailed Problem Description *
          </label>
          <textarea
            id="description"
            required
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe the exact location, symptoms, and urgency..."
            className="w-full text-sm px-3 py-2 border border-stone-300 rounded-[4px] focus:outline-none"
          />
          <div className="flex items-center space-x-1 text-[11px] text-stone-500 mt-1">
            <Sparkles className="w-3 h-3 text-emerald-700" />
            <span>The system automatically identifies the department based on your description keywords.</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="category" className="block text-xs font-semibold text-stone-800 mb-1">
              Category (or Auto-Detect)
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full text-xs px-2.5 py-2 border border-stone-300 rounded-[4px] bg-white text-stone-800"
            >
              <option value="">Auto-Detect via ML Classifier</option>
              <option value="PLUMBING">Plumbing</option>
              <option value="ELECTRICAL">Electrical</option>
              <option value="CARPENTRY">Carpentry</option>
              <option value="MASONRY">Masonry</option>
              <option value="NETWORK_WIFI">Network / Wi-Fi</option>
              <option value="HOUSEKEEPING">Housekeeping</option>
              <option value="SECURITY">Security</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="hostelBlock" className="block text-xs font-semibold text-stone-800 mb-1">
              Hostel Block *
            </label>
            <select
              id="hostelBlock"
              required
              value={formData.hostelBlock}
              onChange={(e) => setFormData({ ...formData, hostelBlock: e.target.value })}
              className="w-full text-xs px-2.5 py-2 border border-stone-300 rounded-[4px] bg-white text-stone-800"
            >
              <option value="Hostel-A">Hostel-A</option>
              <option value="Hostel-B">Hostel-B</option>
              <option value="Hostel-C">Hostel-C</option>
              <option value="Main Academic Block">Main Academic Block</option>
              <option value="Library">Library</option>
            </select>
          </div>

          <div>
            <label htmlFor="roomNumber" className="block text-xs font-semibold text-stone-800 mb-1">
              Room / Wing Number *
            </label>
            <input
              id="roomNumber"
              type="text"
              required
              value={formData.roomNumber}
              onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
              placeholder="e.g. A-204 or Lab-3"
              className="w-full text-xs px-3 py-2 border border-stone-300 rounded-[4px] focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label htmlFor="priority" className="block text-xs font-semibold text-stone-800 mb-1">
            Priority Level
          </label>
          <select
            id="priority"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            className="w-full text-xs px-2.5 py-2 border border-stone-300 rounded-[4px] bg-white text-stone-800"
          >
            <option value="LOW">Low (Routine maintenance)</option>
            <option value="MEDIUM">Medium (Standard 24h queue)</option>
            <option value="HIGH">High (Impacts daily study or room access)</option>
            <option value="EMERGENCY">Emergency (Water flooding, electrical hazard)</option>
          </select>
        </div>

        {/* Photo Upload with Sharp server-side compression */}
        <div>
          <label className="block text-xs font-semibold text-stone-800 mb-1">
            Upload Photo (Optional, Compressed to &lt;250KB before storage)
          </label>
          <div className="flex items-center space-x-3">
            <input
              id="photo"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="text-xs text-stone-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-[4px] file:border file:border-stone-300 file:text-xs file:font-semibold file:bg-stone-50 hover:file:bg-stone-100"
            />
          </div>

          {photoPreview && (
            <div className="mt-3 p-2 bg-stone-50 border border-stone-200 rounded-[4px] inline-block">
              <div className="text-[11px] font-semibold text-stone-700 mb-1">Preview:</div>
              <img
                src={photoPreview}
                alt="Selected issue preview"
                className="max-h-48 max-w-full rounded-[2px] border border-stone-300 object-contain"
              />
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-stone-200 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate("/tickets")}
            className="px-4 py-2 border border-stone-300 text-xs font-medium rounded-[4px] text-stone-700 hover:bg-stone-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-[#0f4c3a] text-white text-xs font-semibold rounded-[4px] hover:bg-[#0b392b] disabled:opacity-50"
          >
            {loading ? "Submitting Complaint..." : "Submit Complaint"}
          </button>
        </div>
      </form>
    </div>
  );
};
