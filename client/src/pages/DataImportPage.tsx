import React, { useState } from "react";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Download, FileText } from "lucide-react";
import { UserProfile } from "../api/client.js";

interface ImportResponse {
  success: boolean;
  totalRows: number;
  importedCount: number;
  errors: string[];
}

export const DataImportPage: React.FC<{ user: UserProfile | null }> = ({ user }) => {
  const [selectedType, setSelectedType] = useState<"students" | "timetable" | "fees" | "mess-menu">("students");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState<boolean>(false);
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setResult(null);
      setErrorMsg(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert("Please select a CSV file to upload.");
      return;
    }

    setImporting(true);
    setResult(null);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch(`/api/import/${selectedType}`, {
        method: "POST",
        credentials: "include",
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Import failed");
      }
      setResult(data);
      setSelectedFile(null);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to process CSV import.");
    } finally {
      setImporting(false);
    }
  };

  const templates = [
    {
      type: "students",
      title: "Students Roster Template",
      columns: "rollNumber, fullName, email, phone, hostelBlock, roomNumber, branch, year, batch",
      example: "2024CS101, Aarav Sharma, aarav@campusdesk.edu, 9876543210, Hostel-A, A-204, CSE, 2, 2024"
    },
    {
      type: "timetable",
      title: "Academic Timetable Template",
      columns: "branch, year, subjectCode, subjectName, facultyName, dayOfWeek, startTime, endTime, room",
      example: "CSE, 2, CS201, Data Structures, Prof. Sengupta, 1, 09:00, 10:00, Room-201"
    },
    {
      type: "fees",
      title: "Accounts Dues Register Template",
      columns: "rollNumber, studentName, totalFee, paidFee, dueFee, dueDate, semester, academicYear, status",
      example: "2024CS101, Aarav Sharma, 55000, 55000, 0, 2026-10-15, 4, 2025-26, PAID"
    },
    {
      type: "mess-menu",
      title: "Hostel Mess Menu Template",
      columns: "hostelBlock, dayOfWeek, breakfast, lunch, snacks, dinner",
      example: "Hostel-A, 1, Idli Sambhar, Rice Dal Paneer, Tea & Samosa, Roti Dal Tadka"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="glass-panel p-6 rounded-3xl border border-[var(--border-subtle)] shadow-glass flex items-center space-x-3">
        <div className="w-11 h-11 rounded-2xl bg-[#FF6D1F]/40 border border-[#FF6D1F]/25 flex items-center justify-center text-[var(--text-primary)]">
          <Upload className="w-5 h-5 text-[var(--text-primary)]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Data Migration & CSV Ingestion</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Migrate college registers, student rosters, subject timetables, and fee registers with schema validation
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Form Box */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 sm:p-8 space-y-5 border border-[var(--border-subtle)] shadow-glass">
          <h2 className="text-xs font-bold text-[#FF6D1F] uppercase tracking-wider border-b border-[var(--border-subtle)] pb-3 flex items-center space-x-2">
            <FileSpreadsheet className="w-4 h-4 text-[#FF6D1F]" />
            <span>Ingest CSV Dataset</span>
          </h2>

          <form onSubmit={handleUpload} className="space-y-4 text-xs">
            <div>
              <label htmlFor="importDatasetType" className="block font-semibold text-[var(--text-primary)] mb-1.5">
                Select Dataset Category *
              </label>
              <select
                id="importDatasetType"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-[#FF6D1F]"
              >
                <option value="students">Student Roster (Students, Hostels & Rooms)</option>
                <option value="timetable">Academic Timetable & Course Schedule</option>
                <option value="fees">Fee Records & Outstanding Dues Register</option>
                <option value="mess-menu">Hostel Mess Weekly Menus</option>
              </select>
            </div>

            <div>
              <label htmlFor="importCsvFile" className="block font-semibold text-[var(--text-primary)] mb-1.5">
                Upload CSV File *
              </label>
              <input
                id="importCsvFile"
                type="file"
                accept=".csv"
                required
                onChange={handleFileChange}
                className="w-full text-xs text-[var(--text-secondary)] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border file:border-[var(--border-subtle)] file:text-xs file:font-semibold file:bg-[var(--bg-elevated)] file:text-[var(--text-primary)] hover:file:bg-[var(--bg-hover)] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={importing || !selectedFile}
              className="btn-primary px-6 py-2.5 text-xs font-bold flex items-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{importing ? "Validating & Ingesting..." : "Validate and Ingest Records"}</span>
            </button>
          </form>

          {/* Results Reporting */}
          {errorMsg && (
            <div className="p-3 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-mono">
              {errorMsg}
            </div>
          )}

          {result && (
            <div className="p-4 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl space-y-3 text-xs">
              <div className="flex items-center space-x-2 font-medium text-[var(--text-primary)]">
                {result.errors.length === 0 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                )}
                <span>
                  Ingestion Summary: <span className="font-mono text-[#FF6D1F] font-bold">{result.importedCount}</span> of <span className="font-mono text-[var(--text-primary)]">{result.totalRows}</span> rows successfully committed.
                </span>
              </div>

              {result.errors.length > 0 && (
                <div className="pt-2 border-t border-[var(--border-subtle)]">
                  <div className="font-semibold text-rose-300 mb-1">Validation Errors Encountered:</div>
                  <div className="max-h-40 overflow-y-auto space-y-1 bg-rose-500/10 p-3 border border-rose-500/20 rounded-xl text-[11px] text-rose-300 font-mono">
                    {result.errors.map((err, i) => (
                      <div key={i}>{err}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Templates Specs */}
        <div className="glass-panel rounded-3xl p-5 space-y-4 text-xs border border-[var(--border-subtle)] shadow-glass">
          <h2 className="font-bold text-[#FF6D1F] uppercase tracking-wider border-b border-[var(--border-subtle)] pb-2.5">
            CSV Schema Specifications
          </h2>

          <div className="space-y-3.5">
            {templates.map((tpl) => (
              <div key={tpl.type} className="bg-[var(--bg-elevated)] p-4 border border-[var(--border-subtle)] rounded-2xl space-y-2">
                <div className="font-semibold text-[var(--text-primary)] flex items-center justify-between">
                  <span>{tpl.title}</span>
                  <span className="text-[10px] font-mono bg-[#FF6D1F]/15 px-2 py-0.5 rounded border border-[#FF6D1F]/30 text-[#FF6D1F] font-bold">
                    {tpl.type}.csv
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block mb-1">Required Headers:</span>
                  <code className="text-[11px] text-[var(--text-primary)] font-mono block bg-[var(--bg-input)] p-2 rounded-xl border border-[var(--border-subtle)] break-all select-all">
                    {tpl.columns}
                  </code>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block mb-1">Example Payload:</span>
                  <code className="text-[11px] text-[var(--text-secondary)] font-mono block bg-[var(--bg-input)] p-2 rounded-xl border border-[var(--border-subtle)] truncate select-all">
                    {tpl.example}
                  </code>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataImportPage;
