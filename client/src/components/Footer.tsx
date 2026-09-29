import React from "react";
import { Link } from "react-router-dom";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-stone-100 border-t border-stone-300 text-stone-600 text-xs py-8 mt-12 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 font-bold text-stone-900 text-sm mb-2">
              <span className="w-5 h-5 bg-[#0f4c3a] text-white flex items-center justify-center text-[10px] rounded-[3px]">
                CD
              </span>
              <span>CampusDesk</span>
            </div>
            <p className="text-stone-600 max-w-md leading-relaxed text-xs">
              Unified digital operations portal for college hostels, departments and student services. Operates under the Digital Personal Data Protection Act, 2023.
            </p>
          </div>

          <div>
            <div className="font-semibold text-stone-900 uppercase tracking-wider text-[11px] mb-2">
              Core Services
            </div>
            <ul className="space-y-1.5">
              <li>
                <Link to="/tickets" className="hover:text-stone-900 hover:underline">
                  Complaint Ticketing
                </Link>
              </li>
              <li>
                <Link to="/gatepass" className="hover:text-stone-900 hover:underline">
                  Gate Pass and Leave
                </Link>
              </li>
              <li>
                <Link to="/notices" className="hover:text-stone-900 hover:underline">
                  Targeted Notices
                </Link>
              </li>
              <li>
                <Link to="/academics" className="hover:text-stone-900 hover:underline">
                  Timetable and Attendance
                </Link>
              </li>
              <li>
                <Link to="/console" className="hover:text-stone-900 hover:underline font-medium text-emerald-900">
                  Text Command Console
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="font-semibold text-stone-900 uppercase tracking-wider text-[11px] mb-2">
              Governance and Policies
            </div>
            <ul className="space-y-1.5">
              <li>
                <Link to="/privacy" className="hover:text-stone-900 hover:underline font-medium text-stone-800">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-stone-900 hover:underline font-medium text-stone-800">
                  Terms and Conditions
                </Link>
              </li>
              <li>
                <Link to="/adoption" className="hover:text-stone-900 hover:underline">
                  Adoption and Rollout Guide
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-stone-900 hover:underline">
                  FAQ and Office Contacts
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-stone-500">
          <div>
            &copy; {new Date().getFullYear()} CampusDesk College Administration System. All rights reserved.
          </div>
          <div className="mt-2 sm:mt-0">
            Compliant with DPDP Act, 2023. Server role verified.
          </div>
        </div>
      </div>
    </footer>
  );
};
