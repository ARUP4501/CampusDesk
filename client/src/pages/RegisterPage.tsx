import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest, UserProfile } from "../api/client.js";
import { UserCheck, Shield, ChevronRight, CheckCircle2 } from "lucide-react";

interface RegisterPageProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    dob: "",
    gender: "MALE",
    bloodGroup: "O+",
    rollNumber: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    course: "B.Tech",
    department: "Computer Science & Engineering",
    branch: "CSE",
    year: 1,
    semester: 1,
    batch: "2024-2028",
    permanentAddress: "",
    currentAddress: "",
    fatherName: "",
    fatherPhone: "",
    motherName: "",
    motherPhone: "",
    guardianName: "",
    guardianRelation: "Uncle",
    guardianPhone: "",
    guardianAddress: "",
    requestedHostel: "Hostel-A",
    roomPreference: "Double Sharing",
    consentAgreed: false
  });

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(1);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const { checked } = e.target as HTMLInputElement;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validateStep1 = () => {
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.rollNumber.trim() || !formData.password) {
      setError("Please fill in all required basic personal information.");
      return false;
    }
    if (formData.password.length < 8) {
      setError("Password must have at least 8 characters.");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.fatherName.trim() || !formData.fatherPhone.trim() || !formData.guardianName.trim() || !formData.guardianPhone.trim() || !formData.permanentAddress.trim()) {
      setError("Please provide required Parent, Local Guardian, and Permanent Address details.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.consentAgreed) {
      setError("You must review and accept the official Campus Management terms and data consent agreement.");
      return;
    }

    setLoading(true);
    try {
      const data = await apiRequest<{ user: UserProfile; message: string }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          year: parseInt(String(formData.year), 10),
          semester: parseInt(String(formData.semester), 10),
          role: "STUDENT"
        })
      });

      setSuccessMessage(data.message || "Registration submitted for verification!");
      onLoginSuccess(data.user);
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Registration failed. Please check your information and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto my-8 px-4">
      <div className="bg-campus-card border border-campus-border rounded-lg p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Subtle grid backdrop */}
        <div className="absolute inset-0 bg-grid-technical opacity-10 pointer-events-none" />

        <div className="relative text-center mb-6">
          <div className="w-10 h-10 bg-campus-elevated border border-campus-gold/30 text-campus-gold flex items-center justify-center font-bold text-sm rounded mx-auto mb-3">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-campus-text">Student Campus Enrollment</h1>
          <p className="text-xs text-campus-muted mt-1">
            Complete your profile with academic, guardian and hostel preferences. Registration undergoes 2-step verification by your Warden and Administration.
          </p>
        </div>

        {/* Multi-Step Indicator */}
        <div className="relative flex items-center justify-center mb-6 border-b border-campus-border pb-4">
          <div className="flex items-center space-x-2 sm:space-x-4 text-xs font-mono">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded transition-colors ${
                currentStep === 1
                  ? "bg-campus-gold text-campus-bg font-semibold"
                  : "bg-campus-elevated text-campus-secondary border border-campus-border hover:text-campus-text"
              }`}
            >
              <span>1.</span>
              <span>Personal & Academic</span>
            </button>
            <span className="text-campus-border">/</span>
            <button
              type="button"
              onClick={() => {
                if (validateStep1()) {
                  setError(null);
                  setCurrentStep(2);
                }
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded transition-colors ${
                currentStep === 2
                  ? "bg-campus-gold text-campus-bg font-semibold"
                  : "bg-campus-elevated text-campus-secondary border border-campus-border hover:text-campus-text"
              }`}
            >
              <span>2.</span>
              <span>Parents & Guardian</span>
            </button>
            <span className="text-campus-border">/</span>
            <button
              type="button"
              onClick={() => {
                if (validateStep1() && validateStep2()) {
                  setError(null);
                  setCurrentStep(3);
                }
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded transition-colors ${
                currentStep === 3
                  ? "bg-campus-gold text-campus-bg font-semibold"
                  : "bg-campus-elevated text-campus-secondary border border-campus-border hover:text-campus-text"
              }`}
            >
              <span>3.</span>
              <span>Hostel & Verification</span>
            </button>
          </div>
        </div>

        {error && (
          <div role="alert" className="relative p-3 mb-4 text-xs font-mono text-campus-error bg-campus-error/10 border border-campus-error/30 rounded">
            {error}
          </div>
        )}

        {successMessage && (
          <div role="status" className="relative p-3 mb-4 text-xs font-mono text-campus-success bg-campus-success/10 border border-campus-success/30 rounded">
            {successMessage} Redirecting to your dashboard...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative">
          {/* STEP 1: Personal & Academic Details */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-xs font-mono font-semibold text-campus-muted uppercase tracking-wider border-b border-campus-border pb-1.5">
                1. Personal Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="fullName" className="block text-xs font-medium text-campus-secondary mb-1">
                    Full Legal Name *
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full px-3 py-2 bg-campus-bg border border-campus-border rounded text-campus-text text-xs placeholder-campus-muted focus:outline-none focus:border-campus-gold"
                  />
                </div>

                <div>
                  <label htmlFor="rollNumber" className="block text-xs font-medium text-campus-secondary mb-1">
                    Student Roll / Reg. Number *
                  </label>
                  <input
                    id="rollNumber"
                    name="rollNumber"
                    type="text"
                    required
                    value={formData.rollNumber}
                    onChange={handleChange}
                    placeholder="e.g. 2024CS101"
                    className="w-full px-3 py-2 bg-campus-bg border border-campus-border rounded text-campus-text text-xs placeholder-campus-muted focus:outline-none focus:border-campus-gold font-mono uppercase"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-medium text-campus-secondary mb-1">
                    Official Student Email *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="aarav@campusdesk.edu"
                    className="w-full px-3 py-2 bg-campus-bg border border-campus-border rounded text-campus-text text-xs placeholder-campus-muted focus:outline-none focus:border-campus-gold font-mono"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-xs font-medium text-campus-secondary mb-1">
                    Student Phone Number *
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="9876543210"
                    className="w-full px-3 py-2 bg-campus-bg border border-campus-border rounded text-campus-text text-xs placeholder-campus-muted focus:outline-none focus:border-campus-gold font-mono"
                  />
                </div>

                <div>
                  <label htmlFor="dob" className="block text-xs font-medium text-campus-secondary mb-1">
                    Date of Birth *
                  </label>
                  <input
                    id="dob"
                    name="dob"
                    type="date"
                    required
                    value={formData.dob}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-campus-bg border border-campus-border rounded text-campus-text text-xs focus:outline-none focus:border-campus-gold"
                  />
                </div>

                <div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label htmlFor="gender" className="block text-xs font-medium text-campus-secondary mb-1">
                        Gender *
                      </label>
                      <select
                        id="gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-campus-bg border border-campus-border rounded text-campus-text text-xs focus:outline-none focus:border-campus-gold"
                      >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="bloodGroup" className="block text-xs font-medium text-campus-secondary mb-1">
                        Blood Group
                      </label>
                      <select
                        id="bloodGroup"
                        name="bloodGroup"
                        value={formData.bloodGroup}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-campus-bg border border-campus-border rounded text-campus-text text-xs focus:outline-none focus:border-campus-gold"
                      >
                        <option value="A+">A+</option>
                        <option value="B+">B+</option>
                        <option value="O+">O+</option>
                        <option value="AB+">AB+</option>
                        <option value="A-">A-</option>
                        <option value="B-">B-</option>
                        <option value="O-">O-</option>
                        <option value="AB-">AB-</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs font-medium text-campus-secondary mb-1">
                    Create Password (min 8 chars) *
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-campus-bg border border-campus-border rounded text-campus-text text-xs placeholder-campus-muted focus:outline-none focus:border-campus-gold"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-xs font-medium text-campus-secondary mb-1">
                    Confirm Password *
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-campus-bg border border-campus-border rounded text-campus-text text-xs placeholder-campus-muted focus:outline-none focus:border-campus-gold"
                  />
                </div>
              </div>

              <h2 className="text-xs font-mono font-semibold text-campus-muted uppercase tracking-wider border-b border-campus-border pb-1.5 pt-3">
                2. Academic Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="course" className="block text-xs font-medium text-campus-secondary mb-1">
                    Course / Degree *
                  </label>
                  <select
                    id="course"
                    name="course"
                    value={formData.course}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-campus-bg border border-campus-border rounded text-campus-text text-xs focus:outline-none focus:border-campus-gold"
                  >
                    <option value="B.Tech">B.Tech</option>
                    <option value="M.Tech">M.Tech</option>
                    <option value="MCA">MCA</option>
                    <option value="MBA">MBA</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="branch" className="block text-xs font-medium text-campus-secondary mb-1">
                    Department / Branch *
                  </label>
                  <select
                    id="branch"
                    name="branch"
                    value={formData.branch}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-campus-bg border border-campus-border rounded text-campus-text text-xs focus:outline-none focus:border-campus-gold"
                  >
                    <option value="CSE">CSE (Computer Science)</option>
                    <option value="ECE">ECE (Electronics)</option>
                    <option value="MECH">MECH (Mechanical)</option>
                    <option value="CIVIL">CIVIL (Civil)</option>
                    <option value="EE">EE (Electrical)</option>
                  </select>
                </div>

                <div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label htmlFor="year" className="block text-xs font-medium text-campus-secondary mb-1">
                        Year *
                      </label>
                      <select
                        id="year"
                        name="year"
                        value={formData.year}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-campus-bg border border-campus-border rounded text-campus-text text-xs focus:outline-none focus:border-campus-gold"
                      >
                        <option value={1}>1st Yr</option>
                        <option value={2}>2nd Yr</option>
                        <option value={3}>3rd Yr</option>
                        <option value={4}>4th Yr</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="semester" className="block text-xs font-medium text-campus-secondary mb-1">
                        Semester
                      </label>
                      <select
                        id="semester"
                        name="semester"
                        value={formData.semester}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-campus-bg border border-campus-border rounded text-campus-text text-xs focus:outline-none focus:border-campus-gold"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                          <option key={s} value={s}>
                            Sem {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => {
                    if (validateStep1()) {
                      setError(null);
                      setCurrentStep(2);
                    }
                  }}
                  className="px-5 py-2 bg-campus-gold hover:bg-campus-gold-light text-campus-bg text-xs font-semibold rounded transition-colors"
                >
                  Next: Parents & Guardian →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Parents & Local Guardian */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-xs font-mono font-semibold text-campus-muted uppercase tracking-wider border-b border-campus-border pb-1.5">
                3. Parent Contact Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="fatherName" className="block text-xs font-medium text-campus-secondary mb-1">
                    Father's Full Name *
                  </label>
                  <input
                    id="fatherName"
                    name="fatherName"
                    type="text"
                    required
                    value={formData.fatherName}
                    onChange={handleChange}
                    placeholder="e.g. Rajesh Sharma"
                    className="w-full px-3 py-2 bg-campus-bg border border-campus-border rounded text-campus-text text-xs placeholder-campus-muted focus:outline-none focus:border-campus-gold"
                  />
                </div>

                <div>
                  <label htmlFor="fatherPhone" className="block text-xs font-medium text-campus-secondary mb-1">
                    Father's Phone Number *
                  </label>
                  <input
                    id="fatherPhone"
                    name="fatherPhone"
                    type="tel"
                    required
                    value={formData.fatherPhone}
                    onChange={handleChange}
                    placeholder="9876543288"
                    className="w-full px-3 py-2 bg-campus-bg border border-campus-border rounded text-campus-text text-xs placeholder-campus-muted focus:outline-none focus:border-campus-gold font-mono"
                  />
                </div>

                <div>
                  <label htmlFor="motherName" className="block text-xs font-medium text-campus-secondary mb-1">
                    Mother's Full Name
                  </label>
                  <input
                    id="motherName"
                    name="motherName"
                    type="text"
                    value={formData.motherName}
                    onChange={handleChange}
                    placeholder="e.g. Sunita Sharma"
                    className="w-full px-3 py-2 bg-campus-bg border border-campus-border rounded text-campus-text text-xs placeholder-campus-muted focus:outline-none focus:border-campus-gold"
                  />
                </div>

                <div>
                  <label htmlFor="motherPhone" className="block text-xs font-medium text-campus-secondary mb-1">
                    Mother's Phone Number
                  </label>
                  <input
                    id="motherPhone"
                    name="motherPhone"
                    type="tel"
                    value={formData.motherPhone}
                    onChange={handleChange}
                    placeholder="9876543289"
                    className="w-full px-3 py-2 bg-campus-bg border border-campus-border rounded text-campus-text text-xs placeholder-campus-muted focus:outline-none focus:border-campus-gold font-mono"
                  />
                </div>
              </div>

              <h2 className="text-xs font-mono font-semibold text-campus-muted uppercase tracking-wider border-b border-campus-border pb-1.5 pt-3">
                4. Local Guardian Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="guardianName" className="block text-xs font-medium text-campus-secondary mb-1">
                    Local Guardian Name *
                  </label>
                  <input
                    id="guardianName"
                    name="guardianName"
                    type="text"
                    required
                    value={formData.guardianName}
                    onChange={handleChange}
                    placeholder="e.g. Dr. Alok Mohanty"
                    className="w-full px-3 py-2 bg-campus-bg border border-campus-border rounded text-campus-text text-xs placeholder-campus-muted focus:outline-none focus:border-campus-gold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="guardianRelation" className="block text-xs font-medium text-campus-secondary mb-1">
                      Relationship *
                    </label>
                    <input
                      id="guardianRelation"
                      name="guardianRelation"
                      type="text"
                      required
                      value={formData.guardianRelation}
                      onChange={handleChange}
                      placeholder="e.g. Uncle / Cousin"
                      className="w-full px-3 py-2 bg-campus-bg border border-campus-border rounded text-campus-text text-xs placeholder-campus-muted focus:outline-none focus:border-campus-gold"
                    />
                  </div>

                  <div>
                    <label htmlFor="guardianPhone" className="block text-xs font-medium text-campus-secondary mb-1">
                      Guardian Phone *
                    </label>
                    <input
                      id="guardianPhone"
                      name="guardianPhone"
                      type="tel"
                      required
                      value={formData.guardianPhone}
                      onChange={handleChange}
                      placeholder="9876543290"
                      className="w-full px-3 py-2 bg-campus-bg border border-campus-border rounded text-campus-text text-xs placeholder-campus-muted focus:outline-none focus:border-campus-gold font-mono"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="guardianAddress" className="block text-xs font-medium text-campus-secondary mb-1">
                    Guardian Local Address
                  </label>
                  <input
                    id="guardianAddress"
                    name="guardianAddress"
                    type="text"
                    value={formData.guardianAddress}
                    onChange={handleChange}
                    placeholder="Plot 12, Saheed Nagar, Bhubaneswar"
                    className="w-full px-3 py-2 bg-campus-bg border border-campus-border rounded text-campus-text text-xs placeholder-campus-muted focus:outline-none focus:border-campus-gold"
                  />
                </div>
              </div>

              <h2 className="text-xs font-mono font-semibold text-campus-muted uppercase tracking-wider border-b border-campus-border pb-1.5 pt-3">
                5. Permanent Residential Address
              </h2>
              <div>
                <label htmlFor="permanentAddress" className="block text-xs font-medium text-campus-secondary mb-1">
                  Permanent Address *
                </label>
                <textarea
                  id="permanentAddress"
                  name="permanentAddress"
                  rows={2}
                  required
                  value={formData.permanentAddress}
                  onChange={handleChange}
                  placeholder="Full permanent postal address with PIN code"
                  className="w-full px-3 py-2 bg-campus-bg border border-campus-border rounded text-campus-text text-xs placeholder-campus-muted focus:outline-none focus:border-campus-gold resize-none"
                />
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 bg-campus-elevated border border-campus-border hover:bg-campus-border/60 text-campus-secondary hover:text-campus-text text-xs font-medium rounded transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (validateStep2()) {
                      setError(null);
                      setCurrentStep(3);
                    }
                  }}
                  className="px-5 py-2 bg-campus-gold hover:bg-campus-gold-light text-campus-bg text-xs font-semibold rounded transition-colors"
                >
                  Next: Hostel Preference →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Hostel Preference & Consent */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-xs font-mono font-semibold text-campus-muted uppercase tracking-wider border-b border-campus-border pb-1.5">
                6. Hostel Admission Preference
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="requestedHostel" className="block text-xs font-medium text-campus-secondary mb-1">
                    Requested Hostel Block *
                  </label>
                  <select
                    id="requestedHostel"
                    name="requestedHostel"
                    value={formData.requestedHostel}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-campus-bg border border-campus-border rounded text-campus-text text-xs focus:outline-none focus:border-campus-gold"
                  >
                    <option value="Hostel-A">Hostel-A (Boys Senior Block)</option>
                    <option value="Hostel-B">Hostel-B (Boys Junior Block)</option>
                    <option value="Hostel-C">Hostel-C (Girls Campus Block)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="roomPreference" className="block text-xs font-medium text-campus-secondary mb-1">
                    Room Preference
                  </label>
                  <select
                    id="roomPreference"
                    name="roomPreference"
                    value={formData.roomPreference}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-campus-bg border border-campus-border rounded text-campus-text text-xs focus:outline-none focus:border-campus-gold"
                  >
                    <option value="Double Sharing">Double Sharing (2 Beds)</option>
                    <option value="Single Room">Single Room (Subject to Availability)</option>
                    <option value="Triple Sharing">Triple Sharing (3 Beds)</option>
                  </select>
                </div>
              </div>

              <div className="p-3.5 bg-campus-elevated/60 border border-campus-border rounded text-xs text-campus-muted space-y-1">
                <span className="font-semibold text-campus-gold block font-mono text-[11px] uppercase tracking-wider">Hostel Allocation Notice:</span>
                <p className="leading-relaxed">
                  Rooms and beds are assigned by the designated Hostel Warden and Administration after verifying admission eligibility. Your account will start in <strong className="text-campus-text">Pending Warden Verification</strong> status.
                </p>
              </div>

              {/* Data Privacy and Consent Agreement */}
              <div className="pt-2">
                <div className="p-3.5 bg-campus-elevated/40 border border-campus-border rounded">
                  <label className="flex items-start space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      name="consentAgreed"
                      required
                      checked={formData.consentAgreed}
                      onChange={handleChange}
                      className="mt-0.5 rounded border-campus-border bg-campus-bg text-campus-gold focus:ring-campus-gold"
                    />
                    <span className="text-xs text-campus-secondary leading-relaxed">
                      I declare that the information provided is accurate and authentic. I consent to official campus verification, hostel allocation policies, and data processing in accordance with institutional guidelines. *
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 bg-campus-elevated border border-campus-border hover:bg-campus-border/60 text-campus-secondary hover:text-campus-text text-xs font-medium rounded transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-campus-gold hover:bg-campus-gold-light text-campus-bg text-xs font-semibold rounded disabled:opacity-40 transition-colors"
                >
                  {loading ? "Submitting Registration..." : "Submit Registration for Verification"}
                </button>
              </div>
            </div>
          )}
        </form>

        <div className="relative mt-6 pt-4 border-t border-campus-border text-center text-xs text-campus-muted">
          Already registered?{" "}
          <Link to="/login" className="font-semibold text-campus-gold hover:underline">
            Sign in to CampusDesk
          </Link>
        </div>
      </div>
    </div>
  );
};
