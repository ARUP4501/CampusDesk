import React, { useState } from "react";
import { Terminal, Send, Printer, User, HelpCircle, CheckCircle2 } from "lucide-react";
import { apiRequest, UserProfile } from "../api/client.js";

interface CommandLogEntry {
  id: string;
  command: string;
  studentRoll?: string;
  response: {
    success: boolean;
    message: string;
    printableTicketId?: string;
  };
  timestamp: string;
}

export const CommandConsolePage: React.FC<{ user: UserProfile | null }> = ({ user }) => {
  const [commandInput, setCommandInput] = useState<string>("");
  const [studentRoll, setStudentRoll] = useState<string>(user?.rollNumber || "2024CS101");
  const [logs, setLogs] = useState<CommandLogEntry[]>([
    {
      id: "initial",
      command: "HELP",
      response: {
        success: true,
        message: [
          "CampusDesk Hostel Office Text Command Console Initialized.",
          "Available Commands:",
          "1. STATUS <ticket_or_pass_number>  - Track open maintenance ticket or gate pass",
          "2. COMPLAIN <problem_description>   - Register new complaint on student's behalf",
          "3. PASS <destination> <reason>     - File outing gate pass request",
          "4. MESS [today|tomorrow]            - View mess dining menu",
          "5. NOTICES                          - View recent college circulars",
          "6. CANCEL                           - View cancelled lectures today",
          "7. FEES                             - Check fee dues status",
          "8. HELP                             - List command syntax"
        ].join("\n")
      },
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);

  const [loading, setLoading] = useState<boolean>(false);

  const handleExecute = async (cmdToRun?: string) => {
    const cmd = (cmdToRun || commandInput).trim();
    if (!cmd) return;

    setLoading(true);
    setCommandInput("");

    try {
      const result = await apiRequest<{
        success: boolean;
        command: string;
        message: string;
        printableTicketId?: string;
      }>("/api/commands/execute", {
        method: "POST",
        body: JSON.stringify({
          command: cmd,
          studentRollNumber: studentRoll || undefined
        })
      });

      const entry: CommandLogEntry = {
        id: `cmd_${Date.now()}`,
        command: cmd,
        studentRoll: studentRoll || undefined,
        response: result,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setLogs((prev) => [entry, ...prev]);
    } catch (err: any) {
      const errorEntry: CommandLogEntry = {
        id: `err_${Date.now()}`,
        command: cmd,
        response: {
          success: false,
          message: err.message || "Execution failed."
        },
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setLogs((prev) => [errorEntry, ...prev]);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintSlip = (ticketId: string) => {
    window.open(`/api/tickets/${ticketId}/slip`, "_blank");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="bg-white border border-stone-300 p-4 rounded-[6px]">
        <div className="flex items-center space-x-2">
          <Terminal className="w-5 h-5 text-[#0f4c3a]" />
          <h1 className="text-xl font-bold text-stone-900">Hostel Office Command Terminal & Slip Kiosk</h1>
        </div>
        <p className="text-xs text-stone-600 mt-0.5">
          Staff-assisted console for students without smartphones. Accept short text commands and issue printed physical slips.
        </p>
      </div>

      {/* Operator Assistant Bar */}
      <div className="bg-stone-50 border border-stone-300 rounded-[6px] p-4 text-xs space-y-3 shadow-sm">
        <div className="font-bold text-stone-900 uppercase tracking-wide">
          Student Identification (for requests filed on student&apos;s behalf)
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full sm:w-64">
            <label htmlFor="studentRoll" className="block text-[11px] font-semibold text-stone-700 mb-1">
              Student Roll Number
            </label>
            <input
              id="studentRoll"
              type="text"
              value={studentRoll}
              onChange={(e) => setStudentRoll(e.target.value.toUpperCase())}
              placeholder="e.g. 2024CS101"
              className="w-full px-2.5 py-1.5 border border-stone-300 rounded-[4px] font-mono bg-white uppercase"
            />
          </div>

          <div className="flex-1 text-[11px] text-stone-500">
            When a student visits the hostel office in person, enter their roll number above and type the request command below. A printed ticket slip can be generated immediately.
          </div>
        </div>
      </div>

      {/* Quick Command Buttons */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
        <span className="font-semibold text-stone-600 whitespace-nowrap">Quick Commands:</span>
        <button
          onClick={() => handleExecute("STATUS CD-1001")}
          className="whitespace-nowrap bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 px-2.5 py-1 rounded-[4px] font-mono"
        >
          STATUS CD-1001
        </button>
        <button
          onClick={() => handleExecute("COMPLAIN washbasin tap leaking water")}
          className="whitespace-nowrap bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 px-2.5 py-1 rounded-[4px] font-mono"
        >
          COMPLAIN tap leaking
        </button>
        <button
          onClick={() => handleExecute("MESS TODAY")}
          className="whitespace-nowrap bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 px-2.5 py-1 rounded-[4px] font-mono"
        >
          MESS TODAY
        </button>
        <button
          onClick={() => handleExecute("CANCEL")}
          className="whitespace-nowrap bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 px-2.5 py-1 rounded-[4px] font-mono"
        >
          CANCEL
        </button>
        <button
          onClick={() => handleExecute("FEES")}
          className="whitespace-nowrap bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 px-2.5 py-1 rounded-[4px] font-mono"
        >
          FEES
        </button>
      </div>

      {/* Command Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleExecute();
        }}
        className="bg-white border border-stone-300 rounded-[6px] p-3 shadow-sm flex items-center space-x-2"
      >
        <div className="font-mono text-emerald-900 font-bold text-sm pl-2 select-none">&gt;</div>
        <input
          type="text"
          value={commandInput}
          onChange={(e) => setCommandInput(e.target.value)}
          placeholder="Enter command (e.g. COMPLAIN tube light flickering A-204, or STATUS CD-1001)..."
          className="flex-1 text-xs font-mono px-3 py-2 border border-stone-300 rounded-[4px] focus:outline-none"
          autoFocus
        />
        <button
          type="submit"
          disabled={loading || !commandInput.trim()}
          className="px-4 py-2 bg-stone-900 hover:bg-black text-white text-xs font-mono font-bold rounded-[4px] flex items-center space-x-1.5 disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Execute</span>
        </button>
      </form>

      {/* Terminal History Logs */}
      <div className="bg-stone-900 text-stone-100 border border-stone-800 rounded-[6px] p-4 font-mono text-xs shadow-inner min-h-[360px] max-h-[550px] overflow-y-auto space-y-4">
        {logs.map((entry) => (
          <div key={entry.id} className="border-b border-stone-800 pb-3 last:border-none">
            <div className="flex items-center justify-between text-stone-400 text-[11px] mb-1">
              <div className="flex items-center space-x-2">
                <span className="text-emerald-400 font-bold">&gt; {entry.command}</span>
                {entry.studentRoll && (
                  <span className="text-stone-400">[Student: {entry.studentRoll}]</span>
                )}
              </div>
              <span>{entry.timestamp}</span>
            </div>

            <div
              className={`p-2.5 rounded-[4px] whitespace-pre-wrap leading-relaxed ${
                entry.response.success
                  ? "bg-stone-950 text-emerald-300 border border-emerald-950"
                  : "bg-stone-950 text-red-400 border border-red-950"
              }`}
            >
              {entry.response.message}
            </div>

            {entry.response.printableTicketId && (
              <div className="mt-2">
                <button
                  onClick={() => handlePrintSlip(entry.response.printableTicketId!)}
                  className="px-3 py-1 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold rounded-[4px] inline-flex items-center space-x-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Ticket Slip Receipt for Student</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
