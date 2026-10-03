import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest, UserProfile, setAuthToken, broadcastAuthEvent } from "../api/client.js";
import { ArrowRight, Mail, KeyRound, User, Shield, Wrench, Building, Eye, EyeOff, GraduationCap, ShieldAlert } from "lucide-react";

interface LoginPageProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await apiRequest<{ user: UserProfile; token?: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      if (data.token) {
        setAuthToken(data.token);
      }
      onLoginSuccess(data.user);
      broadcastAuthEvent({ type: "LOGIN", user: data.user });
      if (data.user.role === "FACULTY") {
        navigate("/faculty", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
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
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 py-8">
      <div className="campus-panel max-w-md w-full p-8 border border-[var(--border-subtle)] shadow-2xl relative">
        {/* Brand Treatment (Section 47 & 48) */}
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[#FF6D1F] font-mono font-black text-base flex items-center justify-center mx-auto mb-3 shadow-sm">
            CD
          </div>
          <h1 className="editorial-title text-2xl sm:text-3xl text-[var(--text-primary)] tracking-tight">
            CAMPUS<span className="text-[#FF6D1F]">DESK</span>
          </h1>
          <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-[var(--text-muted)] mt-1">
            CAMPUS OPERATING SYSTEM
          </p>
        </div>

        {error && (
          <div role="alert" className="p-3 mb-5 text-xs font-mono text-rose-300 bg-rose-950/40 border border-rose-500/40 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          {/* Hidden inputs to deflect browser password manager autofill on load */}
          <input
            type="text"
            name="fake_username_remember"
            style={{ position: "absolute", opacity: 0, height: 0, width: 0, zIndex: -1 }}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />
          <input
            type="password"
            name="fake_password_remember"
            style={{ position: "absolute", opacity: 0, height: 0, width: 0, zIndex: -1 }}
            tabIndex={-1}
            autoComplete="new-password"
            aria-hidden="true"
          />

          <div className="space-y-1.5">
            <label htmlFor="login-email" className="block text-[10px] font-mono uppercase text-[var(--text-secondary)] font-bold tracking-wider">
              Institutional Email
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)] flex items-center z-10">
                <Mail className="w-4 h-4" />
              </span>
              <input
                id="login-email"
                name="campus_academic_user_id"
                type="email"
                required
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="identity@campusdesk.edu"
                style={{ paddingLeft: "2.75rem", paddingRight: "1rem" }}
                className="w-full py-2.5 bg-[var(--bg-input)] border border-[var(--bg-input-border)] rounded-lg text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-subtle)] focus:border-[#FF6D1F] outline-none transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="login-password" className="block text-[10px] font-mono uppercase text-[var(--text-secondary)] font-bold tracking-wider">
              Passphrase / Password
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)] flex items-center z-10">
                <KeyRound className="w-4 h-4" />
              </span>
              <input
                id="login-password"
                name="campus_academic_user_secret"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                style={{ paddingLeft: "2.75rem", paddingRight: "2.75rem" }}
                className="w-full py-2.5 bg-[var(--bg-input)] border border-[var(--bg-input-border)] rounded-lg text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-subtle)] focus:border-[#FF6D1F] outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1.5 flex items-center z-10 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center space-x-2 mt-2 transition-all shadow-md"
          >
            <span>{loading ? "INITIALIZING..." : "INITIALIZE SESSION"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

          {/* 1-Click Demo Accounts Preset (Section 50: Demo-First UX) */}
        <div className="mt-8 pt-5 border-t border-[var(--border-subtle)]">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] mb-3">
            <span>Hackathon Demo Roles (6 Roles)</span>
            <span className="text-[#FF6D1F] font-bold">Password@123</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <button
              type="button"
              onClick={() => handleDemoFill("student@campusdesk.edu")}
              className="p-2.5 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] hover:border-[#FF6D1F]/50 text-left transition-colors group"
            >
              <div className="flex items-center space-x-1.5 text-[var(--text-primary)] font-bold text-[11px]">
                <User className="w-3.5 h-3.5 text-[#FF6D1F]" />
                <span>Student</span>
              </div>
              <span className="text-[9px] text-[var(--text-muted)] block mt-0.5 truncate">student@campusdesk.edu</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoFill("faculty@campusdesk.edu")}
              className="p-2.5 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] hover:border-[#FF6D1F]/50 text-left transition-colors group"
            >
              <div className="flex items-center space-x-1.5 text-[var(--text-primary)] font-bold text-[11px]">
                <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                <span>Faculty</span>
              </div>
              <span className="text-[9px] text-[var(--text-muted)] block mt-0.5 truncate">faculty@campusdesk.edu</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoFill("warden@campusdesk.edu")}
              className="p-2.5 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] hover:border-[#FF6D1F]/50 text-left transition-colors group"
            >
              <div className="flex items-center space-x-1.5 text-[var(--text-primary)] font-bold text-[11px]">
                <Shield className="w-3.5 h-3.5 text-[#FF6D1F]" />
                <span>Warden</span>
              </div>
              <span className="text-[9px] text-[var(--text-muted)] block mt-0.5 truncate">warden@campusdesk.edu</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoFill("staff@campusdesk.edu")}
              className="p-2.5 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] hover:border-[#FF6D1F]/50 text-left transition-colors group"
            >
              <div className="flex items-center space-x-1.5 text-[var(--text-primary)] font-bold text-[11px]">
                <Wrench className="w-3.5 h-3.5 text-amber-400" />
                <span>Operations Staff</span>
              </div>
              <span className="text-[9px] text-[var(--text-muted)] block mt-0.5 truncate">staff@campusdesk.edu</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoFill("security.main@campusdesk.edu")}
              className="p-2.5 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] hover:border-[#FF6D1F]/50 text-left transition-colors group"
            >
              <div className="flex items-center space-x-1.5 text-[var(--text-primary)] font-bold text-[11px]">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>Gate Security</span>
              </div>
              <span className="text-[9px] text-[var(--text-muted)] block mt-0.5 truncate">security.main@campusdesk.edu</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoFill("admin@campusdesk.edu")}
              className="p-2.5 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] hover:border-[#FF6D1F]/50 text-left transition-colors group"
            >
              <div className="flex items-center space-x-1.5 text-[var(--text-primary)] font-bold text-[11px]">
                <Building className="w-3.5 h-3.5 text-emerald-400" />
                <span>Administrator</span>
              </div>
              <span className="text-[9px] text-[var(--text-muted)] block mt-0.5 truncate">admin@campusdesk.edu</span>
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-xs font-mono text-[var(--text-muted)]">
          New campus registration?{" "}
          <Link to="/register" className="text-[#FF6D1F] hover:underline font-bold">
            Create Student Dossier
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
