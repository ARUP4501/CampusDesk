import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, ShieldCheck, Cpu } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-campus-bg border-t border-campus-border text-campus-secondary text-xs py-12 mt-20 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-3.5">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-xl bg-campus-btnPrimary text-campus-text border border-campus-accent/20 flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4 text-campus-text" />
              </div>
              <span className="font-extrabold text-base text-campus-text tracking-tight">
                Campus<span className="text-campus-accent">Desk</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-campus-btnPrimary/25 border border-campus-border text-campus-accent font-bold">
                v3.0 Enterprise
              </span>
            </div>
            <p className="text-campus-secondary max-w-md leading-relaxed text-xs">
              Unified digital operations platform for higher education institutions. Orchestrating student complaints, warden approvals, real-time gate passes, and targeted announcements.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-campus-muted">
              <div className="flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-campus-accent" />
                <span>DPDP Act 2023 Compliant</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Cpu className="w-4 h-4 text-campus-accent" />
                <span>Local-First IndexedDB Queue</span>
              </div>
            </div>
          </div>

          <div>
            <div className="font-mono text-[11px] uppercase tracking-wider text-campus-text font-bold mb-3">
              Platform Modules
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/tickets" className="text-campus-secondary hover:text-campus-accent transition-colors">
                  Complaints & SLA Maintenance
                </Link>
              </li>
              <li>
                <Link to="/gatepass" className="text-campus-secondary hover:text-campus-accent transition-colors">
                  QR Gate Passes & Leaves
                </Link>
              </li>
              <li>
                <Link to="/notices" className="text-campus-secondary hover:text-campus-accent transition-colors">
                  Targeted Official Notices
                </Link>
              </li>
              <li>
                <Link to="/academics" className="text-campus-secondary hover:text-campus-accent transition-colors">
                  Academic Timetable & Sync
                </Link>
              </li>
              <li>
                <Link to="/mess" className="text-campus-secondary hover:text-campus-accent transition-colors">
                  Mess Menu & Catering Ratings
                </Link>
              </li>
              <li>
                <Link to="/console" className="text-campus-accent hover:text-campus-text transition-colors font-mono font-medium">
                  Offline Text Command CLI
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="font-mono text-[11px] uppercase tracking-wider text-campus-text font-bold mb-3">
              Governance & Support
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/privacy" className="text-campus-secondary hover:text-campus-text transition-colors">
                  Privacy & Data Protection
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-campus-secondary hover:text-campus-text transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/adoption" className="text-campus-secondary hover:text-campus-text transition-colors">
                  Institutional Rollout Guide
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-campus-secondary hover:text-campus-text transition-colors">
                  Knowledge Base & Contacts
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-campus-border flex flex-col sm:flex-row items-center justify-between text-[11px] text-campus-muted gap-2">
          <div>
            &copy; {new Date().getFullYear()} CampusDesk Systems. Built for higher education institutions.
          </div>
          <div className="font-mono text-[10px] text-campus-muted">
            End-to-End Encrypted • Audit Trail Verified
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

