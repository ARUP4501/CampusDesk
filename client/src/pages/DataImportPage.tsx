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
      <div className="bg-campus-card border border-campus-border p-5 rounded-lg">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded bg-campus-elevated border border-campus-border flex items-center justify-center text-campus-gold">
            <Upload className="w-4 h-4" />
          </div>
          <h1 className="text-lg font-semibold text-campus-text">Data Migration & CSV Ingestion</h1>
        </div>
        <p className="text-xs text-campus-muted mt-1.5 ml-10">
          Migrate college registers, student rosters, subject timetables, and fee registers with granular schema validation
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Form Box */}
        <div className="lg:col-span-2 bg-campus-card border border-campus-border rounded-lg p-6 space-y-5">
          <h2 className="text-xs font-mono font-semibold text-campus-muted uppercase tracking-wider border-b border-campus-border pb-3 flex items-center space-x-2">
            <FileSpreadsheet className="w-4 h-4 text-campus-gold" />
            <span>Ingest CSV Dataset</span>
          </h2>

          <form onSubmit={handleUpload} className="space-y-4 text-xs">
            <div>
              <label htmlFor="importDatasetType" className="block font-medium text-campus-secondary mb-1.5">
                Select Dataset Category *
              </label>
              <select
                id="importDatasetType"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as any)}
                className="w-full px-3 py-2.5 border border-campus-border rounded bg-campus-bg text-campus-text focus:outline-none focus:border-campus-gold"
              >
                <option value="students">Student Roster (Students, Hostels & Rooms)</option>
                <option value="timetable">Academic Timetable & Course Schedule</option>
                <option value="fees">Fee Records & Outstanding Dues Register</option>
                <option value="mess-menu">Hostel Mess Weekly Menus</option>
              </select>
            </div>

            <div>
              <label htmlFor="importCsvFile" className="block font-medium text-campus-secondary mb-1.5">
                Upload CSV File *
              </label>
              <input
                id="importCsvFile"
                type="file"
                accept=".csv"
                required
                onChange={handleFileChange}
                className="w-full text-xs text-campus-muted file:mr-3 file:py-2 file:px-4 file:rounded file:border file:border-campus-border file:text-xs file:font-semibold file:bg-campus-elevated file:text-campus-text hover:file:bg-campus-border/60 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={importing || !selectedFile}
              className="px-5 py-2.5 bg-campus-gold hover:bg-campus-gold-light text-campus-bg font-semibold text-xs rounded flex items-center space-x-2 disabled:opacity-40 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{importing ? "Validating & Ingesting..." : "Validate and Ingest Records"}</span>
            </button>
          </form>

          {/* Results Reporting */}
          {errorMsg && (
            <div className="p-3 bg-campus-error/10 text-campus-error border border-campus-error/30 rounded text-xs font-mono">
              {errorMsg}
            </div>
          )}

          {result && (
            <div className="p-4 bg-campus-elevated/40 border border-campus-border rounded space-y-3 text-xs">
              <div className="flex items-center space-x-2 font-medium text-campus-text">
                {result.errors.length === 0 ? (
                  <CheckCircle2 className="w-4 h-4 text-campus-success" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-campus-warning" />
                )}
                <span>
                  Ingestion Summary: <span className="font-mono text-campus-gold font-bold">{result.importedCount}</span> of <span className="font-mono">{result.totalRows}</span> rows successfully committed to PostgreSQL.
                </span>
              </div>

              {result.errors.length > 0 && (
                <div className="pt-2 border-t border-campus-border">
                  <div className="font-semibold text-campus-error mb-1">Validation Errors Encountered:</div>
                  <div className="max-h-40 overflow-y-auto space-y-1 bg-campus-bg p-3 border border-campus-error/30 rounded text-[11px] text-campus-error font-mono">
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
        <div className="bg-campus-card border border-campus-border rounded-lg p-5 space-y-4 text-xs">
          <h2 className="font-mono font-semibold text-campus-muted uppercase tracking-wider border-b border-campus-border pb-2.5">
            CSV Schema Specifications
          </h2>

          <div className="space-y-3.5">
            {templates.map((tpl) => (
              <div key={tpl.type} className="bg-campus-elevated/40 p-3 border border-campus-border rounded space-y-1.5">
                <div className="font-semibold text-campus-text flex items-center justify-between">
                  <span>{tpl.title}</span>
                  <span className="text-[10px] font-mono bg-campus-card px-1.5 py-0.5 rounded border border-campus-border text-campus-gold">
                    {tpl.type}.csv
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-campus-muted uppercase block mb-0.5">Required Headers:</span>
                  <code className="text-[10px] text-campus-secondary font-mono block bg-campus-bg p-1.5 rounded border border-campus-border/60">
                    {tpl.columns}
                  </code>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-campus-muted uppercase block mb-0.5">Example Payload:</span>
                  <code className="text-[10px] text-campus-muted font-mono block bg-campus-bg p-1.5 rounded border border-campus-border/60 truncate">
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
