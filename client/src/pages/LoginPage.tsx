import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest, UserProfile } from "../api/client.js";
import { Shield, ArrowRight, Lock, Mail, KeyRound } from "lucide-react";

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
    <div className="max-w-md mx-auto my-12">
      <div className="bg-campus-card border border-campus-border rounded-lg p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Subtle grid backdrop */}
        <div className="absolute inset-0 bg-grid-technical opacity-10 pointer-events-none" />

        <div className="relative text-center mb-6">
          <div className="w-10 h-10 bg-campus-elevated border border-campus-gold/30 text-campus-gold flex items-center justify-center font-bold text-sm rounded mx-auto mb-3">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-campus-text">Sign in to CampusDesk</h1>
          <p className="text-xs text-campus-muted mt-1">
            Enterprise campus infrastructure & digital operations platform
          </p>
        </div>

        {error && (
          <div role="alert" className="relative p-3 mb-4 text-xs font-mono text-campus-error bg-campus-error/10 border border-campus-error/30 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative">
          <div>
            <label htmlFor="email" className="block text-xs font-mono text-campus-muted uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@campusdesk.edu"
                className="w-full pl-9 pr-3 py-2.5 bg-campus-bg border border-campus-border rounded text-campus-text text-xs placeholder-campus-muted focus:outline-none focus:border-campus-gold transition-colors font-mono"
              />
              <Mail className="w-4 h-4 text-campus-muted absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-mono text-campus-muted uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2.5 bg-campus-bg border border-campus-border rounded text-campus-text text-xs placeholder-campus-muted focus:outline-none focus:border-campus-gold transition-colors"
              />
              <KeyRound className="w-4 h-4 text-campus-muted absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-campus-gold hover:bg-campus-gold-light text-campus-bg font-semibold py-2.5 px-4 text-xs rounded transition-colors disabled:opacity-40 flex items-center justify-center space-x-2 mt-2"
          >
            <span>{loading ? "Authenticating session..." : "Sign In to Console"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="relative mt-6 pt-5 border-t border-campus-border">
          <div className="text-[11px] font-mono text-campus-muted uppercase tracking-wider mb-2.5">
            Quick-Fill Role Credentials:
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleDemoFill("student@campusdesk.edu")}
              className="p-2 border border-campus-border bg-campus-elevated/40 hover:bg-campus-elevated hover:border-campus-gold/40 text-campus-secondary hover:text-campus-text rounded text-left transition-colors"
            >
              <span className="font-semibold block text-campus-text text-[11px]">Student</span>
              <span className="text-[10px] text-campus-muted font-mono">aarav@campusdesk.edu</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill("warden@campusdesk.edu")}
              className="p-2 border border-campus-border bg-campus-elevated/40 hover:bg-campus-elevated hover:border-campus-gold/40 text-campus-secondary hover:text-campus-text rounded text-left transition-colors"
            >
              <span className="font-semibold block text-campus-text text-[11px]">Hostel Warden</span>
              <span className="text-[10px] text-campus-muted font-mono">warden@campusdesk.edu</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill("staff@campusdesk.edu")}
              className="p-2 border border-campus-border bg-campus-elevated/40 hover:bg-campus-elevated hover:border-campus-gold/40 text-campus-secondary hover:text-campus-text rounded text-left transition-colors"
            >
              <span className="font-semibold block text-campus-text text-[11px]">Dept Staff</span>
              <span className="text-[10px] text-campus-muted font-mono">staff@campusdesk.edu</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill("admin@campusdesk.edu")}
              className="p-2 border border-campus-border bg-campus-elevated/40 hover:bg-campus-elevated hover:border-campus-gold/40 text-campus-secondary hover:text-campus-text rounded text-left transition-colors"
            >
              <span className="font-semibold block text-campus-text text-[11px]">Central Admin</span>
              <span className="text-[10px] text-campus-muted font-mono">admin@campusdesk.edu</span>
            </button>
          </div>
        </div>

        <div className="relative mt-6 text-center text-xs text-campus-muted">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="text-campus-gold hover:underline font-medium">
            Register as a student
          </Link>
        </div>

        <div className="relative mt-4 text-center text-[10px] text-campus-muted/80">
          Protected by CampusDesk RBAC and encrypted session cookies.{" "}
          <Link to="/privacy" className="underline hover:text-campus-secondary">Privacy</Link> &{" "}
          <Link to="/terms" className="underline hover:text-campus-secondary">Terms</Link>.
        </div>
      </div>
    </div>
  );
};
