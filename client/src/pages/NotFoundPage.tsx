import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FileQuestion } from "lucide-react";

export const NotFoundPage: React.FC = () => {
  return (
    <div className="max-w-md mx-auto my-20 text-center">
      <div className="bg-campus-card border border-campus-border rounded-lg p-8 shadow-2xl space-y-4">
        <div className="w-12 h-12 rounded bg-campus-elevated border border-campus-border flex items-center justify-center mx-auto text-campus-gold">
          <FileQuestion className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-semibold text-campus-text">404 — Endpoint Not Found</h1>
        <p className="text-xs text-campus-muted leading-relaxed">
          The requested system route or operational resource does not exist in the CampusDesk service layer.
        </p>
        <div className="pt-3">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 bg-campus-gold hover:bg-campus-gold-light text-campus-bg text-xs font-semibold px-4 py-2 rounded transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Platform Console</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
