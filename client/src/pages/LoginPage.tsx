import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest, UserProfile, setAuthToken, broadcastAuthEvent } from "../api/client.js";
import { ArrowRight, Mail, KeyRound, Sparkles, User, Shield, Wrench, Building, Eye, EyeOff, GraduationCap } from "lucide-react";

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
    <div className="max-w-md mx-auto my-8 sm:my-12">
      <div className="glass-panel rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-card">
        <div className="relative text-center mb-6">
          <div className="w-11 h-11 bg-campus-btnPrimary text-campus-text flex items-center justify-center rounded-2xl mx-auto mb-3 shadow-sm border border-campus-accent/20">
            <Sparkles className="w-5 h-5 text-campus-text" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-campus-text">Sign in to CampusDesk</h1>
          <p className="text-xs text-campus-muted mt-1 max-w-xs mx-auto">
            Unified institutional platform for student operations & faculty services
          </p>
        </div>

        {error && (
          <div role="alert" className="relative p-3.5 mb-5 text-xs text-rose-800 bg-rose-500/15 border border-rose-500/30 rounded-2xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-campus-text mb-1.5">
              Email Address
            </label>
            <div className="relative flex items-center">
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@campusdesk.edu"
                className="w-full pl-10 pr-4 py-2.5 bg-white/70 border border-campus-border rounded-xl text-campus-text text-xs placeholder-campus-muted focus:outline-none focus:border-campus-accent font-mono transition-colors"
              />
              <Mail className="w-4 h-4 text-campus-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="block text-xs font-semibold text-campus-text">
                Password
              </label>
            </div>
            <div className="relative flex items-center">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-white/70 border border-campus-border rounded-xl text-campus-text text-xs placeholder-campus-muted focus:outline-none focus:border-campus-accent transition-colors"
              />
              <KeyRound className="w-4 h-4 text-campus-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-campus-muted hover:text-campus-text transition-colors rounded-lg focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary font-bold py-3 px-4 text-xs rounded-xl disabled:opacity-40 flex items-center justify-center space-x-2 mt-2"
          >
            <span>{loading ? "Authenticating..." : "Sign In to Workspace"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* 1-Click Demo Accounts */}
        <div className="relative mt-7 pt-5 border-t border-campus-border">
          <div className="text-[11px] font-mono text-campus-muted uppercase tracking-wider mb-2.5 flex items-center justify-between">
            <span>Instant Demo Accounts</span>
            <span className="text-[10px] text-campus-accent font-bold">Password@123</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleDemoFill("student@campusdesk.edu")}
              className="p-2.5 border border-campus-border bg-white/50 hover:bg-white/80 hover:border-campus-accent/50 text-campus-secondary hover:text-campus-text rounded-2xl text-left transition-all group shadow-sm"
            >
              <div className="flex items-center space-x-1.5 text-campus-text font-bold text-[11px]">
                <User className="w-3.5 h-3.5 text-campus-accent group-hover:scale-110 transition-transform" />
                <span>Student</span>
              </div>
              <span className="text-[10px] text-campus-muted font-mono block mt-0.5 truncate">student@campusdesk.edu</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoFill("warden@campusdesk.edu")}
              className="p-2.5 border border-campus-border bg-white/50 hover:bg-white/80 hover:border-campus-accent/50 text-campus-secondary hover:text-campus-text rounded-2xl text-left transition-all group shadow-sm"
            >
              <div className="flex items-center space-x-1.5 text-campus-text font-bold text-[11px]">
                <Shield className="w-3.5 h-3.5 text-campus-accent group-hover:scale-110 transition-transform" />
                <span>Hostel Warden</span>
              </div>
              <span className="text-[10px] text-campus-muted font-mono block mt-0.5 truncate">warden@campusdesk.edu</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoFill("staff@campusdesk.edu")}
              className="p-2.5 border border-campus-border bg-white/50 hover:bg-white/80 hover:border-campus-accent/50 text-campus-secondary hover:text-campus-text rounded-2xl text-left transition-all group shadow-sm"
            >
              <div className="flex items-center space-x-1.5 text-campus-text font-bold text-[11px]">
                <Wrench className="w-3.5 h-3.5 text-campus-accent group-hover:scale-110 transition-transform" />
                <span>Dept Staff</span>
              </div>
              <span className="text-[10px] text-campus-muted font-mono block mt-0.5 truncate">staff@campusdesk.edu</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoFill("faculty@campusdesk.edu")}
              className="p-2.5 border border-campus-border bg-white/50 hover:bg-white/80 hover:border-campus-accent/50 text-campus-secondary hover:text-campus-text rounded-2xl text-left transition-all group shadow-sm"
            >
              <div className="flex items-center space-x-1.5 text-campus-text font-bold text-[11px]">
                <GraduationCap className="w-3.5 h-3.5 text-campus-accent group-hover:scale-110 transition-transform" />
                <span>Academic Faculty</span>
              </div>
              <span className="text-[10px] text-campus-muted font-mono block mt-0.5 truncate">faculty@campusdesk.edu</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoFill("admin@campusdesk.edu")}
              className="p-2.5 border border-campus-border bg-white/50 hover:bg-white/80 hover:border-campus-accent/50 text-campus-secondary hover:text-campus-text rounded-2xl text-left transition-all group shadow-sm"
            >
              <div className="flex items-center space-x-1.5 text-campus-text font-bold text-[11px]">
                <Building className="w-3.5 h-3.5 text-campus-accent group-hover:scale-110 transition-transform" />
                <span>Central Admin</span>
              </div>
              <span className="text-[10px] text-campus-muted font-mono block mt-0.5 truncate">admin@campusdesk.edu</span>
            </button>
          </div>
        </div>

        <div className="relative mt-6 text-center text-xs text-campus-muted">
          Don&apos;t have an account yet?{" "}
          <Link to="/register" className="text-campus-accent hover:underline font-bold">
            Register as a Student
          </Link>
        </div>

        <div className="relative mt-4 text-center text-[10px] text-campus-muted">
          Encrypted session auth •{" "}
          <Link to="/privacy" className="underline hover:text-campus-text">Privacy</Link> &{" "}
          <Link to="/terms" className="underline hover:text-campus-text">Terms</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

