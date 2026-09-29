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
      <div className="bg-white border border-stone-300 p-4 rounded-[6px]">
        <div className="flex items-center space-x-2">
          <Upload className="w-5 h-5 text-[#0f4c3a]" />
          <h1 className="text-xl font-bold text-stone-900">Campus Data Migration & CSV Import</h1>
        </div>
        <p className="text-xs text-stone-600 mt-0.5">
          Migrate college registers, student rosters, subject timetables, and fee registers with granular validation
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Form Box */}
        <div className="lg:col-span-2 bg-white border border-stone-300 rounded-[6px] p-6 space-y-5 shadow-sm">
          <h2 className="text-xs font-bold text-stone-700 uppercase tracking-wider border-b border-stone-200 pb-2">
            Import CSV Dataset
          </h2>

          <form onSubmit={handleUpload} className="space-y-4 text-xs">
            <div>
              <label htmlFor="importDatasetType" className="block font-semibold text-stone-800 mb-1">
                Select Dataset Category *
              </label>
              <select
                id="importDatasetType"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as any)}
                className="w-full px-3 py-2 border border-stone-300 rounded-[4px] bg-white text-stone-800 text-sm"
              >
                <option value="students">Student Roster (Students, Hostels & Rooms)</option>
                <option value="timetable">Academic Timetable & Course Schedule</option>
                <option value="fees">Fee Records & Outstanding Dues Register</option>
                <option value="mess-menu">Hostel Mess Weekly Menus</option>
              </select>
            </div>

            <div>
              <label htmlFor="importCsvFile" className="block font-semibold text-stone-800 mb-1">
                Upload CSV File *
              </label>
              <input
                id="importCsvFile"
                type="file"
                accept=".csv"
                required
                onChange={handleFileChange}
                className="w-full text-xs text-stone-600 file:mr-3 file:py-2 file:px-4 file:rounded-[4px] file:border file:border-stone-300 file:text-xs file:font-semibold file:bg-stone-50 hover:file:bg-stone-100"
              />
            </div>

            <button
              type="submit"
              disabled={importing || !selectedFile}
              className="px-5 py-2.5 bg-[#0f4c3a] hover:bg-[#0b392b] text-white font-bold text-xs rounded-[4px] flex items-center space-x-2 disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{importing ? "Validating & Importing..." : "Validate and Import Records"}</span>
            </button>
          </form>

          {/* Results Reporting */}
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-900 border border-red-200 rounded-[4px] text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {result && (
            <div className="p-4 bg-stone-50 border border-stone-300 rounded-[4px] space-y-3 text-xs">
              <div className="flex items-center space-x-2 font-bold text-stone-900">
                {result.errors.length === 0 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-800" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-700" />
                )}
                <span>
                  Import Summary: {result.importedCount} of {result.totalRows} rows successfully processed into PostgreSQL.
                </span>
              </div>

              {result.errors.length > 0 && (
                <div className="pt-2 border-t border-stone-200">
                  <div className="font-bold text-red-800 mb-1">Validation Errors Encountered:</div>
                  <div className="max-h-40 overflow-y-auto space-y-1 bg-white p-2 border border-red-200 rounded-[4px] text-[11px] text-red-900 font-mono">
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
        <div className="bg-stone-50 border border-stone-300 rounded-[6px] p-5 space-y-4 shadow-sm text-xs">
          <h2 className="font-bold text-stone-900 uppercase tracking-wider border-b border-stone-300 pb-2">
            CSV Template Schemas
          </h2>

          <div className="space-y-4">
            {templates.map((tpl) => (
              <div key={tpl.type} className="bg-white p-3 border border-stone-200 rounded-[4px] space-y-1.5">
                <div className="font-bold text-stone-900 flex items-center justify-between">
                  <span>{tpl.title}</span>
                  <span className="text-[10px] font-mono bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200">
                    {tpl.type}.csv
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-stone-500 uppercase block">Required Columns:</span>
                  <code className="text-[10px] text-emerald-950 font-mono block bg-stone-50 p-1 rounded border border-stone-100">
                    {tpl.columns}
                  </code>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-stone-500 uppercase block">Example Row:</span>
                  <code className="text-[10px] text-stone-600 font-mono block bg-stone-50 p-1 rounded border border-stone-100 truncate">
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
