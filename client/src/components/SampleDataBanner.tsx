import React, { useState } from "react";
import { Info, X } from "lucide-react";

export const SampleDataBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState<boolean>(false);

  if (dismissed) return null;

  return (
    <div
      role="status"
      className="bg-campus-elevated/80 border border-campus-border text-campus-secondary text-xs px-3.5 py-2 flex items-center justify-between rounded mb-4 shadow-sm"
    >
      <div className="flex items-center space-x-2">
        <Info className="w-3.5 h-3.5 text-campus-gold flex-shrink-0" aria-hidden="true" />
        <span className="text-[11px] text-campus-muted">
          <strong className="text-campus-text font-mono uppercase tracking-wider text-[10px] mr-1.5 px-1.5 py-0.5 rounded bg-campus-card border border-campus-border text-campus-gold">Live Sandbox:</strong>
          Currently inspecting pre-seeded institutional dataset. All metrics, SLA ages, and timelines are computed directly from the PostgreSQL engine.
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-campus-muted hover:text-campus-text ml-3 p-1 rounded focus:outline-none transition-colors"
        aria-label="Dismiss sample data banner"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
