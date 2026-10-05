import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest, UserProfile, setAuthToken, broadcastAuthEvent } from "../api/client.js";
import { UserCheck, Shield, ChevronRight, CheckCircle2, Eye, EyeOff, Lock, KeyRound, MapPin, Bus, CalendarDays } from "lucide-react";

interface RegisterPageProps {
  onLoginSuccess: (user: UserProfile) => void;
}

interface CourseOption {
  code: string;
  name: string;
  durationYears: number;
  branches: { code: string; name: string }[];
}

const DEFAULT_COURSES: CourseOption[] = [
  {
    code: "B.Tech",
    name: "Bachelor of Technology",
    durationYears: 4,
    branches: [
      { code: "CSE", name: "Computer Science & Engineering" },
      { code: "IT", name: "Information Technology" },
      { code: "ECE", name: "Electronics & Communication Engineering" },
      { code: "MECH", name: "Mechanical Engineering" },
      { code: "CIVIL", name: "Civil Engineering" }
    ]
  },
  {
    code: "MCA",
    name: "Master of Computer Applications",
    durationYears: 2,
    branches: [
      { code: "CA", name: "Computer Applications" },
      { code: "DS", name: "Data Science" }
    ]
  },
  {
    code: "BCA",
    name: "Bachelor of Computer Applications",
    durationYears: 3,
    branches: [
      { code: "CA", name: "Computer Applications" },
      { code: "DS", name: "Data Science" }
    ]
  },
  {
    code: "BBA",
    name: "Bachelor of Business Administration",
    durationYears: 3,
    branches: [
      { code: "GEN", name: "General" },
      { code: "FIN", name: "Finance" },
      { code: "MKT", name: "Marketing" },
      { code: "HRM", name: "Human Resource Management" }
    ]
  },
  {
    code: "MBA",
    name: "Master of Business Administration",
    durationYears: 2,
    branches: [
      { code: "FIN", name: "Finance" },
      { code: "MKT", name: "Marketing" },
      { code: "HRM", name: "Human Resource Management" },
      { code: "OPS", name: "Operations" }
    ]
  },
  {
    code: "M.Tech",
    name: "Master of Technology",
    durationYears: 2,
    branches: [
      { code: "CSE", name: "Computer Science & Engineering" },
      { code: "OTHER", name: "Other available specializations" }
    ]
  }
];

export const RegisterPage: React.FC<RegisterPageProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [coursesList, setCoursesList] = useState<CourseOption[]>(DEFAULT_COURSES);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
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
    branch: "Computer Science & Engineering",
    year: 1,
    semester: 1,
    section: "A",
    batch: "2024-2028",
    fatherName: "",
    fatherPhone: "",
    motherName: "",
    motherPhone: "",
    guardianName: "",
    guardianRelation: "Guardian",
    guardianPhone: "",
    guardianAddress: "",
    permanentAddress: "",
    livingType: "HOSTELLER",
    requestedHostel: "Hostel-A",
    roomPreference: "Double Sharing",
    currentAddress: "",
    busRoute: "Route 1",
    pickupPoint: "",
    vehicleNumber: "",
    parkingZone: "Zone A (Two-Wheeler)",
    consentAgreed: false
  });

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchCoursesMetadata = async () => {
      try {
        const res = await apiRequest<{ courses: CourseOption[] }>("/api/academic/courses");
        if (res && res.courses && res.courses.length > 0) {
          setCoursesList(res.courses);
        }
      } catch (err) {
        // Fallback to DEFAULT_COURSES
      }
    };
    fetchCoursesMetadata();
  }, []);

  const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCourseCode = e.target.value;
    const selectedCourseObj = coursesList.find((c) => c.code === selectedCourseCode) || coursesList[0];
    const defaultBranchName = selectedCourseObj?.branches?.[0]?.name || "General";
    const currentYear = new Date().getFullYear();
    const endYear = currentYear + (selectedCourseObj?.durationYears || 4);

    setFormData((prev) => ({
      ...prev,
      course: selectedCourseCode,
      department: selectedCourseObj?.name || prev.department,
      branch: defaultBranchName,
      year: 1,
      semester: 1,
      batch: `${currentYear}-${endYear}`
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validateStep1 = () => {
    if (!formData.fullName.trim()) {
      setError("Please enter your full legal name.");
      return false;
    }
    if (!formData.rollNumber.trim()) {
      setError("Please enter your official student roll or registration number.");
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      setError("Please enter a valid official student email address.");
      return false;
    }
    if (!formData.phone.trim() || formData.phone.length < 8) {
      setError("Please enter a valid phone number.");
      return false;
    }
    if (!formData.dob) {
      setError("Please enter your date of birth.");
      return false;
    }
    const selectedDob = new Date(formData.dob);
    const today = new Date();
    if (selectedDob > today) {
      setError("Date of birth cannot be in the future. Please select a valid past date.");
      return false;
    }
    const ageInYears = (today.getTime() - selectedDob.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    if (ageInYears < 14) {
      setError("Date of birth indicates student is under 14 years old. Please select a valid student DOB.");
      return false;
    }
    if (!formData.password || formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match. Please verify.");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.fatherName.trim()) {
      setError("Father's full name is required for verification.");
      return false;
    }
    if (!formData.fatherPhone.trim() || formData.fatherPhone.length < 8) {
      setError("Father's contact number is required.");
      return false;
    }
    if (!formData.guardianName.trim()) {
      setError("Local guardian name is required for student records.");
      return false;
    }
    if (!formData.guardianPhone.trim() || formData.guardianPhone.length < 8) {
      setError("Local guardian phone number is required.");
      return false;
    }
    if (!formData.permanentAddress.trim()) {
      setError("Permanent residential address is required.");
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (formData.livingType === "DAY_SCHOLAR" && !formData.currentAddress.trim()) {
      setError("Local commuter / city residence address is required for Day Scholars.");
      return false;
    }
    if (!formData.consentAgreed) {
      setError("You must acknowledge the verification declaration to proceed.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateStep1() || !validateStep2() || !validateStep3()) {
      return;
    }

    try {
      setLoading(true);
      const res = await apiRequest<{ token: string; user: UserProfile }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(formData)
      });

      if (res.token && res.user) {
        setAuthToken(res.token);
        broadcastAuthEvent("LOGIN");
        setSuccessMessage("Registration submitted successfully! Verifying credentials...");
        setTimeout(() => {
          onLoginSuccess(res.user);
          navigate("/dashboard");
        }, 1200);
      } else {
        setSuccessMessage("Application submitted! Please await institutional verification.");
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || "Registration failed. Please check your data and retry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto my-8 px-4 pb-16">
      <div className="campus-panel rounded-2xl p-6 sm:p-8 relative overflow-hidden border border-[var(--border-subtle)] shadow-2xl">
        <div className="relative text-center mb-6">
          <div className="w-12 h-12 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[#FF6D1F] flex items-center justify-center font-bold text-sm rounded-xl mx-auto mb-3 shadow-sm">
            <UserCheck className="w-6 h-6" />
          </div>
          <span className="editorial-eyebrow">ENROLLMENT PORTAL</span>
          <h1 className="editorial-title text-xl sm:text-2xl font-bold text-[var(--text-primary)] mt-1">Student Campus Enrollment</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-md mx-auto">
            Profile onboarding with academic branch, parent emergency contacts, and residential living preferences.
          </p>
        </div>

        {/* Multi-Step Indicator */}
        <div className="relative flex items-center justify-center mb-6 border-b border-[var(--border-subtle)] pb-4">
          <div className="flex items-center space-x-2 sm:space-x-3 text-xs font-mono">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                currentStep === 1
                  ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)] font-bold"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              <span>01.</span>
              <span>Personal & Academic</span>
            </button>
            <span className="text-[var(--text-muted)] opacity-40">/</span>
            <button
              type="button"
              onClick={() => {
                if (validateStep1()) {
                  setError(null);
                  setCurrentStep(2);
                }
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                currentStep === 2
                  ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)] font-bold"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              <span>02.</span>
              <span>Guardians</span>
            </button>
            <span className="text-[var(--text-muted)] opacity-40">/</span>
            <button
              type="button"
              onClick={() => {
                if (validateStep1() && validateStep2()) {
                  setError(null);
                  setCurrentStep(3);
                }
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                currentStep === 3
                  ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)] font-bold"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              <span>03.</span>
              <span>Living & Housing</span>
            </button>
          </div>
        </div>

        {error && (
          <div role="alert" className="p-3 mb-4 text-xs font-mono font-medium text-rose-400 bg-rose-500/15 border border-rose-500/30 rounded-xl">
            {error}
          </div>
        )}

        {successMessage && (
          <div role="status" className="p-3 mb-4 text-xs font-mono font-medium text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 rounded-xl">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* STEP 1: Personal & Academic Details */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-xs font-mono font-bold text-[#FF6D1F] uppercase tracking-wider border-b border-[var(--border-subtle)] pb-1.5">
                01. Personal Identification
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label htmlFor="fullName" className="block text-[10px] font-mono uppercase text-[var(--text-secondary)] mb-1">
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
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-xs placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF6D1F]"
                  />
                </div>

                <div>
                  <label htmlFor="rollNumber" className="block text-[10px] font-mono uppercase text-[var(--text-secondary)] mb-1">
                    Roll / Reg. Number *
                  </label>
                  <input
                    id="rollNumber"
                    name="rollNumber"
                    type="text"
                    required
                    value={formData.rollNumber}
                    onChange={handleChange}
                    placeholder="e.g. 2024CS101"
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-xs placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF6D1F] font-mono uppercase"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-[10px] font-mono uppercase text-[var(--text-secondary)] mb-1">
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
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-xs placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF6D1F] font-mono"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-[10px] font-mono uppercase text-[var(--text-secondary)] mb-1">
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
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-xs placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF6D1F] font-mono"
                  />
                </div>

                <div>
                  <label htmlFor="dob" className="block text-[10px] font-mono uppercase text-[var(--text-secondary)] mb-1">
                    Date of Birth *
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="dob"
                      name="dob"
                      type="date"
                      required
                      max={new Date().toISOString().split("T")[0]}
                      min="1940-01-01"
                      value={formData.dob}
                      onChange={handleChange}
                      onClick={(e) => {
                        try {
                          (e.target as HTMLInputElement).showPicker?.();
                        } catch {}
                      }}
                      className="w-full py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-xs focus:outline-none focus:border-[#FF6D1F] font-mono input-with-left-icon"
                    />
                    <CalendarDays
                      className="w-4 h-4 text-[#FF6D1F] absolute left-3 top-1/2 -translate-y-1/2 cursor-pointer z-10"
                      onClick={() => {
                        const input = document.getElementById("dob") as HTMLInputElement;
                        if (input) {
                          try {
                            input.showPicker?.();
                          } catch {
                            input.focus();
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label htmlFor="gender" className="block text-[10px] font-mono uppercase text-[var(--text-secondary)] mb-1">
                        Gender *
                      </label>
                      <select
                        id="gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-xs focus:outline-none focus:border-[#FF6D1F] font-mono"
                      >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="bloodGroup" className="block text-[10px] font-mono uppercase text-[var(--text-secondary)] mb-1">
                        Blood Group
                      </label>
                      <select
                        id="bloodGroup"
                        name="bloodGroup"
                        value={formData.bloodGroup}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-xs focus:outline-none focus:border-[#FF6D1F] font-mono"
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
                  <label htmlFor="password" className="block text-[10px] font-mono uppercase text-[var(--text-secondary)] mb-1">
                    Password (min 6 chars) *
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-xs placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF6D1F] input-with-both-icons"
                    />
                    <KeyRound className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF6D1F]"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-[10px] font-mono uppercase text-[var(--text-secondary)] mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-xs placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF6D1F] input-with-both-icons"
                    />
                    <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF6D1F]"
                      aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <h2 className="text-xs font-mono font-bold text-[#FF6D1F] uppercase tracking-wider border-b border-[var(--border-subtle)] pb-1.5 pt-3">
                02. Academic Program
              </h2>
              {(() => {
                const selectedCourseObj = coursesList.find((c) => c.code === formData.course) || coursesList[0];
                const availableBranches = selectedCourseObj?.branches || [];
                const maxYears = selectedCourseObj?.durationYears || 4;

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label htmlFor="course" className="block text-[10px] font-mono uppercase text-[var(--text-secondary)] mb-1">
                        Degree Program *
                      </label>
                      <select
                        id="course"
                        name="course"
                        value={formData.course}
                        onChange={handleCourseChange}
                        className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-xs focus:outline-none focus:border-[#FF6D1F] font-mono font-semibold"
                      >
                        {coursesList.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.code} — {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="branch" className="block text-[10px] font-mono uppercase text-[var(--text-secondary)] mb-1">
                        Branch / Specialization *
                      </label>
                      <select
                        id="branch"
                        name="branch"
                        value={formData.branch}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-xs focus:outline-none focus:border-[#FF6D1F] font-mono"
                      >
                        {availableBranches.map((b) => (
                          <option key={b.code} value={b.name}>
                            {b.name} ({b.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label htmlFor="year" className="block text-[10px] font-mono uppercase text-[var(--text-secondary)] mb-1">
                            Year *
                          </label>
                          <select
                            id="year"
                            name="year"
                            value={formData.year}
                            onChange={handleChange}
                            className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-xs focus:outline-none focus:border-[#FF6D1F] font-mono"
                          >
                            {Array.from({ length: maxYears }, (_, i) => i + 1).map((yr) => (
                              <option key={yr} value={yr}>
                                {yr === 1 ? "1st Yr" : yr === 2 ? "2nd Yr" : yr === 3 ? "3rd Yr" : `${yr}th Yr`}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label htmlFor="semester" className="block text-[10px] font-mono uppercase text-[var(--text-secondary)] mb-1">
                            Semester
                          </label>
                          <select
                            id="semester"
                            name="semester"
                            value={formData.semester}
                            onChange={handleChange}
                            className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-xs focus:outline-none focus:border-[#FF6D1F] font-mono"
                          >
                            {Array.from({ length: maxYears * 2 }, (_, i) => i + 1).map((s) => (
                              <option key={s} value={s}>
                                Sem {s}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={() => {
                    if (validateStep1()) {
                      setError(null);
                      setCurrentStep(2);
                    }
                  }}
                  className="btn-primary px-5 py-2 text-xs font-bold font-mono rounded-xl"
                >
                  Next: Parents & Guardian →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Parents & Local Guardian */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-xs font-mono font-bold text-[#FF6D1F] uppercase tracking-wider border-b border-[var(--border-subtle)] pb-1.5">
                03. Parent Verification Contacts
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label htmlFor="fatherName" className="block text-[10px] font-mono uppercase text-[var(--text-secondary)] mb-1">
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
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-xs placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF6D1F]"
                  />
                </div>

                <div>
                  <label htmlFor="fatherPhone" className="block text-[10px] font-mono uppercase text-[var(--text-secondary)] mb-1">
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
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-xs placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF6D1F] font-mono"
                  />
                </div>

                <div>
                  <label htmlFor="motherName" className="block text-[10px] font-mono uppercase text-[var(--text-secondary)] mb-1">
                    Mother's Full Name
                  </label>
                  <input
                    id="motherName"
                    name="motherName"
                    type="text"
                    value={formData.motherName}
                    onChange={handleChange}
                    placeholder="e.g. Sunita Sharma"
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-xs placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF6D1F]"
                  />
                </div>

                <div>
                  <label htmlFor="motherPhone" className="block text-[10px] font-mono uppercase text-[var(--text-secondary)] mb-1">
                    Mother's Phone Number
                  </label>
                  <input
                    id="motherPhone"
                    name="motherPhone"
                    type="tel"
                    value={formData.motherPhone}
                    onChange={handleChange}
                    placeholder="9876543289"
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-xs placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF6D1F] font-mono"
                  />
                </div>
              </div>

              <h2 className="text-xs font-mono font-bold text-[#FF6D1F] uppercase tracking-wider border-b border-[var(--border-subtle)] pb-1.5 pt-3">
                04. Local Guardian (Emergency Pass Verification)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label htmlFor="guardianName" className="block text-[10px] font-mono uppercase text-[var(--text-secondary)] mb-1">
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
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-xs placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF6D1F]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="guardianRelation" className="block text-[10px] font-mono uppercase text-[var(--text-secondary)] mb-1">
                      Relationship *
                    </label>
                    <input
                      id="guardianRelation"
                      name="guardianRelation"
                      type="text"
                      required
                      value={formData.guardianRelation}
                      onChange={handleChange}
                      placeholder="e.g. Uncle"
                      className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-xs placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF6D1F]"
                    />
                  </div>

                  <div>
                    <label htmlFor="guardianPhone" className="block text-[10px] font-mono uppercase text-[var(--text-secondary)] mb-1">
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
                      className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-xs placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF6D1F] font-mono"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="guardianAddress" className="block text-[10px] font-mono uppercase text-[var(--text-secondary)] mb-1">
                    Guardian Local Address
                  </label>
                  <input
                    id="guardianAddress"
                    name="guardianAddress"
                    type="text"
                    value={formData.guardianAddress}
                    onChange={handleChange}
                    placeholder="Plot 12, Saheed Nagar, Bhubaneswar"
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-xs placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF6D1F]"
                  />
                </div>
              </div>

              <h2 className="text-xs font-mono font-bold text-[#FF6D1F] uppercase tracking-wider border-b border-[var(--border-subtle)] pb-1.5 pt-3">
                05. Permanent Residential Address
              </h2>
              <div>
                <label htmlFor="permanentAddress" className="block text-[10px] font-mono uppercase text-[var(--text-secondary)] mb-1">
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
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-xs placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF6D1F] resize-none"
                />
              </div>

              <div className="flex justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="btn-secondary px-4 py-2 text-xs font-mono rounded-xl"
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
                  className="btn-primary px-5 py-2 text-xs font-bold font-mono rounded-xl"
                >
                  Next: Housing Preference →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Living Type & Preferences */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-xs font-mono font-bold text-[#FF6D1F] uppercase tracking-wider border-b border-[var(--border-subtle)] pb-1.5">
                06. Campus Living Status & Logistics
              </h2>

              <div>
                <label className="block text-[10px] font-mono uppercase text-[var(--text-secondary)] mb-1.5">
                  Residency Status *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, livingType: "HOSTELLER" }))}
                    className={`p-3 rounded-xl border text-left transition-all font-mono ${
                      formData.livingType === "HOSTELLER"
                        ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[#FF6D1F] shadow-sm"
                        : "bg-[var(--bg-input)] text-[var(--text-muted)] border-[var(--border-subtle)]"
                    }`}
                  >
                    <div className="text-xs font-bold text-[var(--text-primary)]">HOSTELLER</div>
                    <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Living in campus residence hostel</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, livingType: "DAY_SCHOLAR" }))}
                    className={`p-3 rounded-xl border text-left transition-all font-mono ${
                      formData.livingType === "DAY_SCHOLAR"
                        ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[#FF6D1F] shadow-sm"
                        : "bg-[var(--bg-input)] text-[var(--text-muted)] border-[var(--border-subtle)]"
                    }`}
                  >
                    <div className="text-xs font-bold text-[var(--text-primary)]">DAY SCHOLAR</div>
                    <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Daily commuter via transit / personal vehicle</div>
                  </button>
                </div>
              </div>

              {formData.livingType === "HOSTELLER" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 animate-fadeIn">
                  <div>
                    <label htmlFor="requestedHostel" className="block text-[10px] font-mono uppercase text-[var(--text-secondary)] mb-1">
                      Requested Hostel Block *
                    </label>
                    <select
                      id="requestedHostel"
                      name="requestedHostel"
                      value={formData.requestedHostel}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-xs focus:outline-none focus:border-[#FF6D1F] font-mono"
                    >
                      <option value="Hostel-A">Hostel-A (Boys Senior Block)</option>
                      <option value="Hostel-B">Hostel-B (Boys Junior Block)</option>
                      <option value="Hostel-C">Hostel-C (Girls Campus Block)</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="roomPreference" className="block text-[10px] font-mono uppercase text-[var(--text-secondary)] mb-1">
                      Room Configuration
                    </label>
                    <select
                      id="roomPreference"
                      name="roomPreference"
                      value={formData.roomPreference}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-xs focus:outline-none focus:border-[#FF6D1F] font-mono"
                    >
                      <option value="Double Sharing">Double Sharing (2 Beds)</option>
                      <option value="Single Room">Single Room (Subject to Availability)</option>
                      <option value="Triple Sharing">Triple Sharing (3 Beds)</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 animate-fadeIn">
                  <div className="sm:col-span-2">
                    <label htmlFor="currentAddress" className="block text-[10px] font-mono uppercase text-[var(--text-secondary)] mb-1">
                      City Residence / Local Address *
                    </label>
                    <input
                      id="currentAddress"
                      name="currentAddress"
                      type="text"
                      required={formData.livingType === "DAY_SCHOLAR"}
                      value={formData.currentAddress}
                      onChange={handleChange}
                      placeholder="e.g. Plot 45, Forest Park, Bhubaneswar, Odisha"
                      className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-xs placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF6D1F]"
                    />
                  </div>

                  <div>
                    <label htmlFor="busRoute" className="block text-[10px] font-mono uppercase text-[var(--text-secondary)] mb-1">
                      Transit Route Preference
                    </label>
                    <select
                      id="busRoute"
                      name="busRoute"
                      value={formData.busRoute}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-xs focus:outline-none focus:border-[#FF6D1F] font-mono"
                    >
                      <option value="Route 1">Route 1 (Master Canteen / Vani Vihar)</option>
                      <option value="Route 2">Route 2 (Khandagiri / Baramunda)</option>
                      <option value="Route 3">Route 3 (Patia / Infocity)</option>
                      <option value="Route 4">Route 4 (Cuttack Link Road / Badambadi)</option>
                      <option value="Self-Transport">Self-Transport / Personal Vehicle</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="pickupPoint" className="block text-[10px] font-mono uppercase text-[var(--text-secondary)] mb-1">
                      Pickup / Boarding Stop
                    </label>
                    <input
                      id="pickupPoint"
                      name="pickupPoint"
                      type="text"
                      value={formData.pickupPoint}
                      onChange={handleChange}
                      placeholder="e.g. Master Canteen Square"
                      className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-xs placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF6D1F]"
                    />
                  </div>

                  <div>
                    <label htmlFor="vehicleNumber" className="block text-[10px] font-mono uppercase text-[var(--text-secondary)] mb-1">
                      Vehicle Plate Number
                    </label>
                    <input
                      id="vehicleNumber"
                      name="vehicleNumber"
                      type="text"
                      value={formData.vehicleNumber}
                      onChange={handleChange}
                      placeholder="e.g. OD-02-AB-1234"
                      className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-xs placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF6D1F] font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label htmlFor="parkingZone" className="block text-[10px] font-mono uppercase text-[var(--text-secondary)] mb-1">
                      Requested Parking Zone
                    </label>
                    <select
                      id="parkingZone"
                      name="parkingZone"
                      value={formData.parkingZone}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-xs focus:outline-none focus:border-[#FF6D1F] font-mono"
                    >
                      <option value="Zone A (Two-Wheeler)">Zone A (Two-Wheeler Main Lot)</option>
                      <option value="Zone B (Four-Wheeler)">Zone B (Four-Wheeler North Lot)</option>
                      <option value="Zone C (Bicycle)">Zone C (Eco Bicycle Stand)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Data Privacy and Consent Agreement */}
              <div className="pt-2">
                <div className="p-3.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl">
                  <label className="flex items-start space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      name="consentAgreed"
                      required
                      checked={formData.consentAgreed}
                      onChange={handleChange}
                      className="mt-0.5 rounded border-[var(--border-subtle)] text-[#FF6D1F] focus:ring-[#FF6D1F]"
                    />
                    <span className="text-xs text-[var(--text-secondary)] leading-relaxed font-mono">
                      I declare that the information provided is accurate and authentic. I consent to official campus verification, institutional guidelines, and data processing. *
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="btn-secondary px-4 py-2 text-xs font-mono rounded-xl"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary px-6 py-2 text-xs font-bold font-mono rounded-xl disabled:opacity-40"
                >
                  {loading ? "Registering..." : "Submit Registration for Verification"}
                </button>
              </div>
            </div>
          )}
        </form>

        <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] text-center text-xs font-mono text-[var(--text-muted)]">
          Already registered?{" "}
          <Link to="/login" className="font-bold text-[#FF6D1F] hover:underline">
            Sign in to CampusDesk
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
