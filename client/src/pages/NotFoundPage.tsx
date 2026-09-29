import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FileQuestion } from "lucide-react";

export const NotFoundPage: React.FC = () => {
  return (
    <div className="max-w-md mx-auto my-16 text-center">
      <div className="bg-white border border-stone-300 rounded-[6px] p-8 shadow-sm space-y-4">
        <FileQuestion className="w-12 h-12 text-stone-400 mx-auto" />
        <h1 className="text-2xl font-bold text-stone-900">404 - Page Not Found</h1>
        <p className="text-xs text-stone-600 leading-relaxed">
          The requested page or service route does not exist in the CampusDesk portal. Please verify the URL or return to the main dashboard.
        </p>
        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 bg-[#0f4c3a] text-white hover:bg-[#0b392b] text-xs font-semibold px-4 py-2 rounded-[4px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Portal Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
