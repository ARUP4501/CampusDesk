import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Cpu } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[var(--bg-elevated)] border-t border-[var(--border-subtle)] text-[var(--text-secondary)] text-xs py-8 mt-16 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-sm tracking-tight text-[var(--text-primary)] font-sans">
                CAMPUS<span className="text-[#FF6D1F]">DESK</span>
              </span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[#FF6D1F] font-bold">
                CAMPUS OS // v2.6
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] max-w-md font-sans">
              Digital operating system for higher education institutions. Safety curfew logs, academic attendance sync, and operational infrastructure.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-[var(--text-secondary)]">
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>DPDP ACT 2023 COMPLIANT</span>
            </div>
            <span className="text-[var(--border-subtle)]">•</span>
            <div className="flex items-center space-x-1.5">
              <Cpu className="w-3.5 h-3.5 text-[#FF6D1F]" />
              <span>OFFLINE INDEXEDDB QUEUE</span>
            </div>
            <span className="text-[var(--border-subtle)]">•</span>
            <Link to="/privacy" className="hover:text-[var(--text-primary)] transition-colors">
              PRIVACY
            </Link>
            <span className="text-[var(--border-subtle)]">•</span>
            <Link to="/terms" className="hover:text-[var(--text-primary)] transition-colors">
              TERMS
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
