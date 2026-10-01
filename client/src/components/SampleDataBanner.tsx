import React, { useState } from "react";
import { Info, X } from "lucide-react";

export const SampleDataBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState<boolean>(false);

  if (dismissed) return null;

  return (
    <div
      role="status"
      className="glass-panel border-campus-border text-campus-secondary text-xs px-4 py-2.5 flex items-center justify-between rounded-2xl mb-4 shadow-subtle"
    >
      <div className="flex items-center space-x-2.5">
        <Info className="w-4 h-4 text-campus-accent flex-shrink-0" aria-hidden="true" />
        <span className="text-[11px] text-campus-secondary">
          <strong className="text-campus-text font-mono uppercase tracking-wider text-[10px] mr-1.5 px-2 py-0.5 rounded-full bg-campus-btnPrimary/25 border border-campus-border text-campus-accent font-bold">Live Sandbox:</strong>
          Currently inspecting pre-seeded institutional dataset. All metrics, SLA ages, and timelines are computed directly from the PostgreSQL engine.
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-campus-muted hover:text-campus-text ml-3 p-1 rounded-lg focus:outline-none transition-colors"
        aria-label="Dismiss sample data banner"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

