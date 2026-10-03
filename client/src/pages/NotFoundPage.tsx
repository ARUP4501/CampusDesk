import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FileQuestion } from "lucide-react";

export const NotFoundPage: React.FC = () => {
  return (
    <div className="max-w-md mx-auto my-20 text-center px-4">
      <div className="glass-card rounded-3xl p-8 shadow-glass border border-[var(--border-subtle)] space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#FF6D1F]/40 border border-[#FF6D1F]/25 flex items-center justify-center mx-auto text-[var(--text-primary)] shadow-sm">
          <FileQuestion className="w-7 h-7 text-[var(--text-primary)]" />
        </div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">404 — Page Not Found</h1>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          The requested system route or operational resource does not exist in the CampusDesk service layer.
        </p>
        <div className="pt-3">
          <Link
            to="/"
            className="btn-primary inline-flex items-center space-x-2 text-xs font-bold px-5 py-2.5 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to CampusDesk</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
