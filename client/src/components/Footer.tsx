import React from "react";
import { Link } from "react-router-dom";
import { LayoutGrid, ShieldCheck, Cpu } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#101316] border-t border-[#252B31] text-[#A7ADB5] text-xs py-10 mt-16 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-6 h-6 rounded-[3px] bg-[#14181C] border border-[#252B31] flex items-center justify-center text-[#D6A84F]">
                <LayoutGrid className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-sm text-[#F3F4F6] tracking-tight">
                CAMPUS<span className="text-[#D6A84F]">DESK</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#181D22] border border-[#252B31] text-[#6F7781]">
                v2.4 LTS
              </span>
            </div>
            <p className="text-[#A7ADB5] max-w-md leading-relaxed text-xs">
              Unified digital operations platform for higher education institutions. Orchestrating student complaints, warden approvals, real-time gate passes, and targeted announcements.
            </p>
            <div className="flex items-center space-x-4 pt-1 text-[11px] text-[#6F7781]">
              <div className="flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                <span>DPDP Act 2023 Compliant</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#D6A84F]" />
                <span>Local IndexedDB Queue Active</span>
              </div>
            </div>
          </div>

          <div>
            <div className="font-mono text-[11px] uppercase tracking-wider text-[#F3F4F6] mb-3">
              Platform Modules
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/tickets" className="text-[#A7ADB5] hover:text-[#D6A84F] transition-colors">
                  Complaint & SLA Ticketing
                </Link>
              </li>
              <li>
                <Link to="/gatepass" className="text-[#A7ADB5] hover:text-[#D6A84F] transition-colors">
                  QR Gate Pass & Leave
                </Link>
              </li>
              <li>
                <Link to="/notices" className="text-[#A7ADB5] hover:text-[#D6A84F] transition-colors">
                  Targeted Official Notices
                </Link>
              </li>
              <li>
                <Link to="/academics" className="text-[#A7ADB5] hover:text-[#D6A84F] transition-colors">
                  Academic Timetable & Sync
                </Link>
              </li>
              <li>
                <Link to="/mess" className="text-[#A7ADB5] hover:text-[#D6A84F] transition-colors">
                  Mess Menu & Feedback
                </Link>
              </li>
              <li>
                <Link to="/console" className="text-[#D6A84F] hover:text-[#F0C86A] transition-colors font-mono">
                  Offline Text Command Terminal
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="font-mono text-[11px] uppercase tracking-wider text-[#F3F4F6] mb-3">
              Governance & Support
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/privacy" className="text-[#A7ADB5] hover:text-[#F3F4F6] transition-colors">
                  Privacy & Data Protection
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-[#A7ADB5] hover:text-[#F3F4F6] transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/adoption" className="text-[#A7ADB5] hover:text-[#F3F4F6] transition-colors">
                  Institutional Rollout Guide
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-[#A7ADB5] hover:text-[#F3F4F6] transition-colors">
                  Knowledge Base & Emergency Contacts
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[#252B31] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#6F7781] gap-2">
          <div>
            &copy; {new Date().getFullYear()} CampusDesk Infrastructure Systems. All rights reserved.
          </div>
          <div className="font-mono text-[10px] text-[#6F7781]">
            Encrypted End-to-End • Immutable Audit Logged
          </div>
        </div>
      </div>
    </footer>
  );
};
