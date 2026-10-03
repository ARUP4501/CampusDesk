import React, { useState } from "react";
import { Terminal, Send, Printer, User, HelpCircle, CheckCircle2, ChevronRight } from "lucide-react";
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
      <div className="glass-panel p-6 rounded-3xl border border-[var(--border-subtle)] shadow-glass flex items-center space-x-3">
        <div className="w-11 h-11 rounded-2xl bg-[#FF6D1F]/40 border border-[#FF6D1F]/25 flex items-center justify-center text-[var(--text-primary)]">
          <Terminal className="w-5 h-5 text-[var(--text-primary)]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Hostel Office Terminal & Slip Kiosk</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Low-bandwidth CLI console for front-desk staff. Execute rapid keyboard commands and generate printed receipts.
          </p>
        </div>
      </div>

      {/* Operator Assistant Bar */}
      <div className="glass-panel rounded-3xl p-5 text-xs space-y-3 border border-[var(--border-subtle)] shadow-glass">
        <div className="font-mono text-[#FF6D1F] text-[11px] uppercase tracking-wider font-bold">
          Active Student Context (for requests filed on student&apos;s behalf)
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full sm:w-64">
            <label htmlFor="studentRoll" className="block text-[11px] text-[var(--text-primary)] mb-1 font-semibold">
              Student Roll Number
            </label>
            <input
              id="studentRoll"
              type="text"
              value={studentRoll}
              onChange={(e) => setStudentRoll(e.target.value.toUpperCase())}
              placeholder="e.g. 2024CS101"
              className="w-full px-3.5 py-2 border border-[var(--border-subtle)] rounded-xl font-mono bg-[var(--bg-input)] text-[var(--text-primary)] uppercase focus:outline-none focus:border-[#FF6D1F]"
            />
          </div>

          <div className="flex-1 text-[11px] text-[var(--text-secondary)] leading-relaxed">
            When a student visits the hostel office in person, enter their roll number above and execute shorthand commands. Physical thermal slips can be generated on demand.
          </div>
        </div>
      </div>

      {/* Quick Command Buttons */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
        <span className="text-[var(--text-muted)] text-[11px] font-mono whitespace-nowrap">Quick Commands:</span>
        <button
          onClick={() => handleExecute("STATUS CD-1001")}
          className="whitespace-nowrap glass-card text-[var(--text-primary)] hover:text-[var(--text-primary)] px-3 py-1 rounded-xl font-mono text-[11px] border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)]/80 transition-all"
        >
          STATUS CD-1001
        </button>
        <button
          onClick={() => handleExecute("COMPLAIN washbasin tap leaking water")}
          className="whitespace-nowrap glass-card text-[var(--text-primary)] hover:text-[var(--text-primary)] px-3 py-1 rounded-xl font-mono text-[11px] border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)]/80 transition-all"
        >
          COMPLAIN tap leaking
        </button>
        <button
          onClick={() => handleExecute("MESS TODAY")}
          className="whitespace-nowrap glass-card text-[var(--text-primary)] hover:text-[var(--text-primary)] px-3 py-1 rounded-xl font-mono text-[11px] border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)]/80 transition-all"
        >
          MESS TODAY
        </button>
        <button
          onClick={() => handleExecute("CANCEL")}
          className="whitespace-nowrap glass-card text-[var(--text-primary)] hover:text-[var(--text-primary)] px-3 py-1 rounded-xl font-mono text-[11px] border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)]/80 transition-all"
        >
          CANCEL
        </button>
        <button
          onClick={() => handleExecute("FEES")}
          className="whitespace-nowrap glass-card text-[var(--text-primary)] hover:text-[var(--text-primary)] px-3 py-1 rounded-xl font-mono text-[11px] border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)]/80 transition-all"
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
        className="glass-panel rounded-3xl p-2.5 flex items-center space-x-2 border border-[var(--border-subtle)] shadow-glass"
      >
        <div className="font-mono text-[#FF6D1F] font-bold text-sm pl-2 select-none flex items-center">
          <ChevronRight className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={commandInput}
          onChange={(e) => setCommandInput(e.target.value)}
          placeholder="Enter command (e.g. COMPLAIN tube light flickering A-204, or STATUS CD-1001)..."
          className="flex-1 text-xs font-mono px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-[#FF6D1F]"
          autoFocus
        />
        <button
          type="submit"
          disabled={loading || !commandInput.trim()}
          className="btn-primary px-5 py-2.5 text-xs font-mono font-bold flex items-center space-x-1.5 disabled:opacity-40 shadow-sm"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Run</span>
        </button>
      </form>

      {/* Terminal History Logs */}
      <div className="glass-panel rounded-3xl p-5 font-mono text-xs min-h-[360px] max-h-[550px] overflow-y-auto space-y-4 border border-[var(--border-subtle)] shadow-glass">
        {logs.map((entry) => (
          <div key={entry.id} className="border-b border-[var(--border-subtle)] pb-3.5 last:border-none">
            <div className="flex items-center justify-between text-[var(--text-muted)] text-[11px] mb-1.5">
              <div className="flex items-center space-x-2">
                <span className="text-[#FF6D1F] font-bold">&gt; {entry.command}</span>
                {entry.studentRoll && (
                  <span className="text-[var(--text-primary)] font-mono">[Student: {entry.studentRoll}]</span>
                )}
              </div>
              <span className="text-[var(--text-subtle)] font-mono">{entry.timestamp}</span>
            </div>

            <div
              className={`p-3.5 rounded-2xl whitespace-pre-wrap leading-relaxed border ${
                entry.response.success
                  ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[var(--border-subtle)] font-mono text-[11px]"
                  : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20 font-mono text-[11px]"
              }`}
            >
              {entry.response.message}
            </div>

            {entry.response.printableTicketId && (
              <div className="mt-2.5">
                <button
                  onClick={() => handlePrintSlip(entry.response.printableTicketId!)}
                  className="btn-primary px-3 py-1.5 text-xs font-semibold inline-flex items-center space-x-1.5 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Ticket Slip Receipt</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommandConsolePage;
