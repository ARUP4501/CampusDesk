import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest, UserProfile } from "../api/client.js";

interface LoginPageProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await apiRequest<{ user: UserProfile }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      onLoginSuccess(data.user);
      navigate(data.user.role === "STUDENT" ? "/tickets" : "/admin");
    } catch (err: any) {
      setError(err.message || "Failed to log in.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("Password@123");
  };

  return (
    <div className="max-w-md mx-auto my-8">
      <div className="bg-white border border-stone-300 rounded-[6px] p-6 sm:p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="w-10 h-10 bg-[#0f4c3a] text-white flex items-center justify-center font-bold text-base rounded-[4px] mx-auto mb-2">
            CD
          </div>
          <h1 className="text-xl font-bold text-stone-900">Sign in to CampusDesk</h1>
          <p className="text-xs text-stone-600 mt-1">
            Access complaints, gate passes, notices and student records
          </p>
        </div>

        {error && (
          <div role="alert" className="p-3 mb-4 text-xs font-medium text-red-900 bg-red-50 border border-red-200 rounded-[4px]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-stone-800 mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. student@campusdesk.edu"
              className="w-full px-3 py-2 border border-stone-300 rounded-[4px] text-sm focus:border-stone-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-stone-800 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your account password"
              className="w-full px-3 py-2 border border-stone-300 rounded-[4px] text-sm focus:border-stone-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0f4c3a] hover:bg-[#0b392b] text-white font-semibold py-2.5 px-4 text-sm rounded-[4px] transition-colors disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-stone-200">
          <div className="text-xs font-semibold text-stone-700 mb-2">
            Quick-Fill Demo Credentials:
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleDemoFill("student@campusdesk.edu")}
              className="p-1.5 border border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-800 rounded-[4px] text-left"
            >
              Student (Aarav)
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill("warden@campusdesk.edu")}
              className="p-1.5 border border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-800 rounded-[4px] text-left"
            >
              Hostel Warden
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill("staff@campusdesk.edu")}
              className="p-1.5 border border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-800 rounded-[4px] text-left"
            >
              Dept Staff
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill("admin@campusdesk.edu")}
              className="p-1.5 border border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-800 rounded-[4px] text-left"
            >
              Central Admin
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-stone-600">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="text-emerald-800 font-semibold hover:underline">
            Register as a student
          </Link>
        </div>

        <div className="mt-4 text-center text-[11px] text-stone-500">
          By signing in, you agree to the{" "}
          <Link to="/privacy" className="underline hover:text-stone-800">Privacy Policy</Link> and{" "}
          <Link to="/terms" className="underline hover:text-stone-800">Terms of Service</Link>.
        </div>
      </div>
    </div>
  );
};
