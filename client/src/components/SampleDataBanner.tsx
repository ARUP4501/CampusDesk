import React, { useState } from "react";
import { Info, X } from "lucide-react";

export const SampleDataBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState<boolean>(false);

  if (dismissed) return null;

  return (
    <div
      role="status"
      className="bg-stone-100 border border-stone-300 text-stone-800 text-xs px-3 py-1.5 flex items-center justify-between rounded-[4px] mb-4"
    >
      <div className="flex items-center space-x-2">
        <Info className="w-3.5 h-3.5 text-stone-600 flex-shrink-0" aria-hidden="true" />
        <span>
          <strong>Sample data:</strong> Currently viewing pre-seeded college demonstration records. All metrics and charts are computed directly from the database.
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-stone-500 hover:text-stone-800 ml-3 p-0.5 rounded focus:outline-none"
        aria-label="Dismiss sample data banner"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
