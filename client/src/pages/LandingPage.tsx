import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Wrench,
  QrCode,
  Bell,
  Calendar,
  Utensils,
  FileText,
  CreditCard,
  HelpCircle,
  Terminal,
  BarChart2,
  ShieldCheck,
  CheckCircle,
  Clock,
  Smartphone
} from "lucide-react";
import { UserProfile } from "../api/client.js";

interface LandingPageProps {
  user: UserProfile | null;
  onLoginSuccess: (user: UserProfile) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ user }) => {
  const { t } = useTranslation();

  return (

    <div className="space-y-12">
      {/* Hero Section: Plain, concrete, no banned words, solid background */}
      <section className="bg-white border border-stone-300 rounded-[6px] p-6 sm:p-10 shadow-sm">
        <div className="max-w-3xl">
          <div className="inline-flex items-center space-x-2 bg-stone-100 text-stone-800 text-xs font-semibold px-2.5 py-1 rounded-[4px] border border-stone-300 mb-4">
            <ShieldCheck className="w-4 h-4 text-emerald-800" />
            <span>Official College Operations Portal</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight leading-tight">
            Raise a hostel complaint, request a gate pass and read college notices in one place.
          </h1>

          <p className="mt-4 text-base sm:text-lg text-stone-600 leading-relaxed">
            Staff see every open request and how long it has been waiting. Built for low-bandwidth hostel networks and smartphones, with a text command fallback for hostel offices.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {user ? (
              <Link
                to="/tickets"
                className="bg-[#0f4c3a] text-white hover:bg-[#0b392b] px-5 py-2.5 text-sm font-semibold rounded-[4px] inline-flex items-center space-x-2"
              >
                <Wrench className="w-4 h-4" />
                <span>Go to Complaints Portal</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="bg-[#0f4c3a] text-white hover:bg-[#0b392b] px-5 py-2.5 text-sm font-semibold rounded-[4px] inline-flex items-center space-x-2"
                >
                  <span>Sign In</span>
                </Link>
                <Link
                  to="/register"
                  className="bg-white text-stone-800 hover:bg-stone-100 border border-stone-300 px-5 py-2.5 text-sm font-semibold rounded-[4px]"
                >
                  <span>New Student Registration</span>
                </Link>
              </>
            )}
            <Link
              to="/console"
              className="bg-stone-100 text-stone-800 hover:bg-stone-200 border border-stone-300 px-4 py-2.5 text-sm font-medium rounded-[4px] inline-flex items-center space-x-2"
            >
              <Terminal className="w-4 h-4 text-stone-700" />
              <span>Offline Text Command Console</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Workflow Features Grid */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-stone-900">Core Campus Workflows</h2>
          <p className="text-xs text-stone-600">
            Every feature connects to live PostgreSQL storage with role authorization and audit logging.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1 */}
          <div className="bg-white border border-stone-300 p-5 rounded-[4px]">
            <div className="flex items-center space-x-2 text-stone-900 font-bold mb-2">
              <Wrench className="w-4 h-4 text-[#0f4c3a]" />
              <h3>1. Complaint Ticketing & SLA</h3>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Auto-routes complaint text via TF-IDF classifier into department queues (Plumbing, Electrical, Carpentry). Auto-escalates past 24h and 48h SLAs with immutable audit trails.
            </p>
            <div className="mt-3 flex items-center space-x-2 text-[11px] text-stone-500 font-medium">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
              <span>Recurring issue detection by room/block</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-stone-300 p-5 rounded-[4px]">
            <div className="flex items-center space-x-2 text-stone-900 font-bold mb-2">
              <QrCode className="w-4 h-4 text-[#0f4c3a]" />
              <h3>2. Gate Pass & Leave Approvals</h3>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Warden review with remarks, dynamic cryptographic QR code verification, and security guard gate log with exit/entry timestamps and overdue return tracking.
            </p>
            <div className="mt-3 flex items-center space-x-2 text-[11px] text-stone-500 font-medium">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
              <span>Real-time scan verification at main gate</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-stone-300 p-5 rounded-[4px]">
            <div className="flex items-center space-x-2 text-stone-900 font-bold mb-2">
              <Bell className="w-4 h-4 text-[#0f4c3a]" />
              <h3>3. Targeted Notices with Tracking</h3>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Target by branch, hostel, batch or year. Per-student delivery, read, and action completion tracking with one-click automated reminders for pending students.
            </p>
            <div className="mt-3 flex items-center space-x-2 text-[11px] text-stone-500 font-medium">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
              <span>Web Push and in-app notifications</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white border border-stone-300 p-5 rounded-[4px]">
            <div className="flex items-center space-x-2 text-stone-900 font-bold mb-2">
              <Calendar className="w-4 h-4 text-[#0f4c3a]" />
              <h3>4. Timetable & Cancellations</h3>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Live schedule view with faculty class cancellation alerts and student subject-wise attendance percentage with shortage warnings (&lt;75%).
            </p>
          </div>

          {/* Card 5 */}
          <div className="bg-white border border-stone-300 p-5 rounded-[4px]">
            <div className="flex items-center space-x-2 text-stone-900 font-bold mb-2">
              <FileText className="w-4 h-4 text-[#0f4c3a]" />
              <h3>5. Documents & Bonafide PDF</h3>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Submit scholarship or certificate requests. Download digitally verifiable A4 Bonafide certificate PDFs with official institutional reference stamps upon approval.
            </p>
          </div>

          {/* Card 6 */}
          <div className="bg-white border border-stone-300 p-5 rounded-[4px]">
            <div className="flex items-center space-x-2 text-stone-900 font-bold mb-2">
              <Terminal className="w-4 h-4 text-[#0f4c3a]" />
              <h3>6. Command Fallback & Slips</h3>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Hostel office console accepting short text commands (<code>STATUS 1001</code>, <code>COMPLAIN ...</code>) for students without smartphones, plus printable physical slips.
            </p>
          </div>
        </div>
      </section>

      {/* Accessibility & Low-Bandwidth Specs */}
      <section className="bg-white border border-stone-300 rounded-[6px] p-6">
        <h2 className="text-base font-bold text-stone-900 mb-2">
          Hostel Network & Low-Bandwidth Resilience
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-stone-600">
          <div className="p-3 bg-stone-50 border border-stone-200 rounded-[4px]">
            <div className="font-semibold text-stone-900 mb-1 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-stone-700" />
              <span>Offline Action Queue</span>
            </div>
            <p>
              Requests made offline are stored in browser IndexedDB with a visible &quot;Waiting to send&quot; badge and auto-dispatched once connection is restored.
            </p>
          </div>

          <div className="p-3 bg-stone-50 border border-stone-200 rounded-[4px]">
            <div className="font-semibold text-stone-900 mb-1 flex items-center space-x-1.5">
              <Smartphone className="w-3.5 h-3.5 text-stone-700" />
              <span>Compressed Uploads</span>
            </div>
            <p>
              Complaint photos are resized and compressed on the server with Sharp before PostgreSQL bytea storage, keeping payloads below 250KB.
            </p>
          </div>

          <div className="p-3 bg-stone-50 border border-stone-200 rounded-[4px]">
            <div className="font-semibold text-stone-900 mb-1 flex items-center space-x-1.5">
              <BarChart2 className="w-3.5 h-3.5 text-stone-700" />
              <span>Live Database Metrics</span>
            </div>
            <p>
              Zero mock statistics. Every admin metric, ageing bucket, resolution median, and recurring matrix cell is computed directly from SQL queries.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
