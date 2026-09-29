import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest, UserProfile } from "../api/client.js";

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
      <div className="bg-white border border-stone-300 rounded-[6px] p-6 sm:p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="w-10 h-10 bg-[#0f4c3a] text-white flex items-center justify-center font-bold text-base rounded-[4px] mx-auto mb-2">
            CD
          </div>
          <h1 className="text-xl font-bold text-stone-900">Student Campus Registration</h1>
          <p className="text-xs text-stone-600 mt-1">
            Complete your profile with academic, guardian and hostel preferences. Registration undergoes 2-step verification by your Warden and Administration.
          </p>
        </div>

        {/* Multi-Step Indicator */}
        <div className="flex items-center justify-center mb-6 border-b border-stone-200 pb-4">
          <div className="flex items-center space-x-2 sm:space-x-4 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-[4px] ${
                currentStep === 1 ? "bg-[#0f4c3a] text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
              }`}
            >
              <span>1.</span>
              <span>Personal & Academic</span>
            </button>
            <span className="text-stone-300">/</span>
            <button
              type="button"
              onClick={() => {
                if (validateStep1()) {
                  setError(null);
                  setCurrentStep(2);
                }
              }}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-[4px] ${
                currentStep === 2 ? "bg-[#0f4c3a] text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
              }`}
            >
              <span>2.</span>
              <span>Parents & Guardian</span>
            </button>
            <span className="text-stone-300">/</span>
            <button
              type="button"
              onClick={() => {
                if (validateStep1() && validateStep2()) {
                  setError(null);
                  setCurrentStep(3);
                }
              }}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-[4px] ${
                currentStep === 3 ? "bg-[#0f4c3a] text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
              }`}
            >
              <span>3.</span>
              <span>Hostel & Verification</span>
            </button>
          </div>
        </div>

        {error && (
          <div role="alert" className="p-3 mb-4 text-xs font-medium text-red-900 bg-red-50 border border-red-200 rounded-[4px]">
            {error}
          </div>
        )}

        {successMessage && (
          <div role="status" className="p-3 mb-4 text-xs font-medium text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-[4px]">
            {successMessage} Redirecting to your dashboard...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* STEP 1: Personal & Academic Details */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <h2 className="text-xs font-bold text-stone-800 uppercase tracking-wider border-b border-stone-200 pb-1">
                1. Personal Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="fullName" className="block text-xs font-semibold text-stone-800 mb-1">
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
                    className="w-full px-3 py-2 border border-stone-300 rounded-[4px] text-sm focus:border-stone-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="rollNumber" className="block text-xs font-semibold text-stone-800 mb-1">
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
                    className="w-full px-3 py-2 border border-stone-300 rounded-[4px] text-sm focus:border-stone-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-stone-800 mb-1">
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
                    className="w-full px-3 py-2 border border-stone-300 rounded-[4px] text-sm focus:border-stone-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-xs font-semibold text-stone-800 mb-1">
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
                    className="w-full px-3 py-2 border border-stone-300 rounded-[4px] text-sm focus:border-stone-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="dob" className="block text-xs font-semibold text-stone-800 mb-1">
                    Date of Birth *
                  </label>
                  <input
                    id="dob"
                    name="dob"
                    type="date"
                    required
                    value={formData.dob}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-stone-300 rounded-[4px] text-sm focus:border-stone-500 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label htmlFor="gender" className="block text-xs font-semibold text-stone-800 mb-1">
                        Gender *
                      </label>
                      <select
                        id="gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-stone-300 rounded-[4px] text-sm focus:border-stone-500 focus:outline-none bg-white"
                      >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="bloodGroup" className="block text-xs font-semibold text-stone-800 mb-1">
                        Blood Group
                      </label>
                      <select
                        id="bloodGroup"
                        name="bloodGroup"
                        value={formData.bloodGroup}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-stone-300 rounded-[4px] text-sm focus:border-stone-500 focus:outline-none bg-white"
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
                  <label htmlFor="password" className="block text-xs font-semibold text-stone-800 mb-1">
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
                    className="w-full px-3 py-2 border border-stone-300 rounded-[4px] text-sm focus:border-stone-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-xs font-semibold text-stone-800 mb-1">
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
                    className="w-full px-3 py-2 border border-stone-300 rounded-[4px] text-sm focus:border-stone-500 focus:outline-none"
                  />
                </div>
              </div>

              <h2 className="text-xs font-bold text-stone-800 uppercase tracking-wider border-b border-stone-200 pb-1 pt-3">
                2. Academic Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="course" className="block text-xs font-semibold text-stone-800 mb-1">
                    Course / Degree *
                  </label>
                  <select
                    id="course"
                    name="course"
                    value={formData.course}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-stone-300 rounded-[4px] text-sm focus:border-stone-500 focus:outline-none bg-white"
                  >
                    <option value="B.Tech">B.Tech</option>
                    <option value="M.Tech">M.Tech</option>
                    <option value="MCA">MCA</option>
                    <option value="MBA">MBA</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="branch" className="block text-xs font-semibold text-stone-800 mb-1">
                    Department / Branch *
                  </label>
                  <select
                    id="branch"
                    name="branch"
                    value={formData.branch}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-stone-300 rounded-[4px] text-sm focus:border-stone-500 focus:outline-none bg-white"
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
                      <label htmlFor="year" className="block text-xs font-semibold text-stone-800 mb-1">
                        Year *
                      </label>
                      <select
                        id="year"
                        name="year"
                        value={formData.year}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-stone-300 rounded-[4px] text-sm focus:border-stone-500 focus:outline-none bg-white"
                      >
                        <option value={1}>1st Yr</option>
                        <option value={2}>2nd Yr</option>
                        <option value={3}>3rd Yr</option>
                        <option value={4}>4th Yr</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="semester" className="block text-xs font-semibold text-stone-800 mb-1">
                        Semester
                      </label>
                      <select
                        id="semester"
                        name="semester"
                        value={formData.semester}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-stone-300 rounded-[4px] text-sm focus:border-stone-500 focus:outline-none bg-white"
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
                  className="px-5 py-2 bg-[#0f4c3a] hover:bg-[#1a6650] text-white text-xs font-bold rounded-[4px] transition-colors"
                >
                  Next: Parents & Guardian →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Parents & Local Guardian */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <h2 className="text-xs font-bold text-stone-800 uppercase tracking-wider border-b border-stone-200 pb-1">
                3. Parent Contact Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="fatherName" className="block text-xs font-semibold text-stone-800 mb-1">
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
                    className="w-full px-3 py-2 border border-stone-300 rounded-[4px] text-sm focus:border-stone-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="fatherPhone" className="block text-xs font-semibold text-stone-800 mb-1">
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
                    className="w-full px-3 py-2 border border-stone-300 rounded-[4px] text-sm focus:border-stone-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="motherName" className="block text-xs font-semibold text-stone-800 mb-1">
                    Mother's Full Name
                  </label>
                  <input
                    id="motherName"
                    name="motherName"
                    type="text"
                    value={formData.motherName}
                    onChange={handleChange}
                    placeholder="e.g. Sunita Sharma"
                    className="w-full px-3 py-2 border border-stone-300 rounded-[4px] text-sm focus:border-stone-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="motherPhone" className="block text-xs font-semibold text-stone-800 mb-1">
                    Mother's Phone Number
                  </label>
                  <input
                    id="motherPhone"
                    name="motherPhone"
                    type="tel"
                    value={formData.motherPhone}
                    onChange={handleChange}
                    placeholder="9876543289"
                    className="w-full px-3 py-2 border border-stone-300 rounded-[4px] text-sm focus:border-stone-500 focus:outline-none"
                  />
                </div>
              </div>

              <h2 className="text-xs font-bold text-stone-800 uppercase tracking-wider border-b border-stone-200 pb-1 pt-3">
                4. Local Guardian Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="guardianName" className="block text-xs font-semibold text-stone-800 mb-1">
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
                    className="w-full px-3 py-2 border border-stone-300 rounded-[4px] text-sm focus:border-stone-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="guardianRelation" className="block text-xs font-semibold text-stone-800 mb-1">
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
                      className="w-full px-3 py-2 border border-stone-300 rounded-[4px] text-sm focus:border-stone-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="guardianPhone" className="block text-xs font-semibold text-stone-800 mb-1">
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
                      className="w-full px-3 py-2 border border-stone-300 rounded-[4px] text-sm focus:border-stone-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="guardianAddress" className="block text-xs font-semibold text-stone-800 mb-1">
                    Guardian Local Address
                  </label>
                  <input
                    id="guardianAddress"
                    name="guardianAddress"
                    type="text"
                    value={formData.guardianAddress}
                    onChange={handleChange}
                    placeholder="Plot 12, Saheed Nagar, Bhubaneswar"
                    className="w-full px-3 py-2 border border-stone-300 rounded-[4px] text-sm focus:border-stone-500 focus:outline-none"
                  />
                </div>
              </div>

              <h2 className="text-xs font-bold text-stone-800 uppercase tracking-wider border-b border-stone-200 pb-1 pt-3">
                5. Permanent Residential Address
              </h2>
              <div>
                <label htmlFor="permanentAddress" className="block text-xs font-semibold text-stone-800 mb-1">
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
                  className="w-full px-3 py-2 border border-stone-300 rounded-[4px] text-sm focus:border-stone-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium rounded-[4px]"
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
                  className="px-5 py-2 bg-[#0f4c3a] hover:bg-[#1a6650] text-white text-xs font-bold rounded-[4px] transition-colors"
                >
                  Next: Hostel Preference →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Hostel Preference & Consent */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <h2 className="text-xs font-bold text-stone-800 uppercase tracking-wider border-b border-stone-200 pb-1">
                6. Hostel Admission Preference
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="requestedHostel" className="block text-xs font-semibold text-stone-800 mb-1">
                    Requested Hostel Block *
                  </label>
                  <select
                    id="requestedHostel"
                    name="requestedHostel"
                    value={formData.requestedHostel}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-stone-300 rounded-[4px] text-sm focus:border-stone-500 focus:outline-none bg-white"
                  >
                    <option value="Hostel-A">Hostel-A (Boys Senior Block)</option>
                    <option value="Hostel-B">Hostel-B (Boys Junior Block)</option>
                    <option value="Hostel-C">Hostel-C (Girls Campus Block)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="roomPreference" className="block text-xs font-semibold text-stone-800 mb-1">
                    Room Preference
                  </label>
                  <select
                    id="roomPreference"
                    name="roomPreference"
                    value={formData.roomPreference}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-stone-300 rounded-[4px] text-sm focus:border-stone-500 focus:outline-none bg-white"
                  >
                    <option value="Double Sharing">Double Sharing (2 Beds)</option>
                    <option value="Single Room">Single Room (Subject to Availability)</option>
                    <option value="Triple Sharing">Triple Sharing (3 Beds)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-stone-50 border border-stone-200 rounded-[4px] text-xs text-stone-600 space-y-1">
                <span className="font-bold text-stone-800 block">Hostel Allocation Notice:</span>
                <p>
                  Rooms and beds are assigned by the assigned Hostel Warden and Administration after verifying admission eligibility. Your account will start in <strong>Pending Warden Verification</strong> status.
                </p>
              </div>

              {/* Data Privacy and Consent Agreement */}
              <div className="pt-2">
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-[4px]">
                  <label className="flex items-start space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      name="consentAgreed"
                      required
                      checked={formData.consentAgreed}
                      onChange={handleChange}
                      className="mt-0.5 rounded border-stone-300 text-[#0f4c3a] focus:ring-[#0f4c3a]"
                    />
                    <span className="text-xs text-stone-700 leading-relaxed">
                      I declare that the information provided is accurate and authentic. I consent to official campus verification, hostel allocation policies, and data processing in accordance with institutional guidelines. *
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium rounded-[4px]"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-[#0f4c3a] hover:bg-[#1a6650] text-white text-xs font-bold rounded-[4px] shadow-sm disabled:opacity-50 transition-colors"
                >
                  {loading ? "Submitting Registration..." : "Submit Registration for Verification"}
                </button>
              </div>
            </div>
          )}
        </form>

        <div className="mt-6 pt-4 border-t border-stone-200 text-center text-xs text-stone-600">
          Already registered?{" "}
          <Link to="/login" className="font-semibold text-[#0f4c3a] hover:underline">
            Sign in to CampusDesk
          </Link>
        </div>
      </div>
    </div>
  );
};
