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
      <div className="bg-campus-card border border-campus-border p-5 rounded-lg">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded bg-campus-elevated border border-campus-border flex items-center justify-center text-campus-gold">
            <Terminal className="w-4 h-4" />
          </div>
          <h1 className="text-lg font-semibold text-campus-text">Hostel Office Terminal & Slip Kiosk</h1>
        </div>
        <p className="text-xs text-campus-muted mt-1.5 ml-10">
          Low-bandwidth CLI console for front-desk staff. Execute rapid keyboard commands and generate printed receipts.
        </p>
      </div>

      {/* Operator Assistant Bar */}
      <div className="bg-campus-card border border-campus-border rounded-lg p-4 text-xs space-y-3">
        <div className="font-mono text-campus-gold text-[11px] uppercase tracking-wider font-semibold">
          Active Student Context (for requests filed on student&apos;s behalf)
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full sm:w-64">
            <label htmlFor="studentRoll" className="block text-[11px] text-campus-muted mb-1 font-mono">
              Student Roll Number
            </label>
            <input
              id="studentRoll"
              type="text"
              value={studentRoll}
              onChange={(e) => setStudentRoll(e.target.value.toUpperCase())}
              placeholder="e.g. 2024CS101"
              className="w-full px-3 py-1.5 border border-campus-border rounded font-mono bg-campus-bg text-campus-text uppercase focus:outline-none focus:border-campus-gold"
            />
          </div>

          <div className="flex-1 text-[11px] text-campus-secondary leading-relaxed">
            When a student visits the hostel office in person, enter their roll number above and execute shorthand commands. Physical thermal slips can be generated on demand.
          </div>
        </div>
      </div>

      {/* Quick Command Buttons */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
        <span className="text-campus-muted text-[11px] font-mono whitespace-nowrap">Quick Commands:</span>
        <button
          onClick={() => handleExecute("STATUS CD-1001")}
          className="whitespace-nowrap bg-campus-card hover:bg-campus-elevated border border-campus-border text-campus-secondary hover:text-campus-gold px-2.5 py-1 rounded font-mono text-[11px] transition-colors"
        >
          STATUS CD-1001
        </button>
        <button
          onClick={() => handleExecute("COMPLAIN washbasin tap leaking water")}
          className="whitespace-nowrap bg-campus-card hover:bg-campus-elevated border border-campus-border text-campus-secondary hover:text-campus-gold px-2.5 py-1 rounded font-mono text-[11px] transition-colors"
        >
          COMPLAIN tap leaking
        </button>
        <button
          onClick={() => handleExecute("MESS TODAY")}
          className="whitespace-nowrap bg-campus-card hover:bg-campus-elevated border border-campus-border text-campus-secondary hover:text-campus-gold px-2.5 py-1 rounded font-mono text-[11px] transition-colors"
        >
          MESS TODAY
        </button>
        <button
          onClick={() => handleExecute("CANCEL")}
          className="whitespace-nowrap bg-campus-card hover:bg-campus-elevated border border-campus-border text-campus-secondary hover:text-campus-gold px-2.5 py-1 rounded font-mono text-[11px] transition-colors"
        >
          CANCEL
        </button>
        <button
          onClick={() => handleExecute("FEES")}
          className="whitespace-nowrap bg-campus-card hover:bg-campus-elevated border border-campus-border text-campus-secondary hover:text-campus-gold px-2.5 py-1 rounded font-mono text-[11px] transition-colors"
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
        className="bg-campus-card border border-campus-border rounded-lg p-2.5 shadow-xl flex items-center space-x-2"
      >
        <div className="font-mono text-campus-gold font-bold text-sm pl-2 select-none flex items-center">
          <ChevronRight className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={commandInput}
          onChange={(e) => setCommandInput(e.target.value)}
          placeholder="Enter command (e.g. COMPLAIN tube light flickering A-204, or STATUS CD-1001)..."
          className="flex-1 text-xs font-mono px-3 py-2 bg-campus-bg border border-campus-border rounded text-campus-text placeholder-campus-muted focus:outline-none focus:border-campus-gold"
          autoFocus
        />
        <button
          type="submit"
          disabled={loading || !commandInput.trim()}
          className="px-4 py-2 bg-campus-gold hover:bg-campus-gold-light text-campus-bg text-xs font-mono font-bold rounded flex items-center space-x-1.5 disabled:opacity-40 transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Run</span>
        </button>
      </form>

      {/* Terminal History Logs */}
      <div className="bg-[#0b0e11] text-campus-text border border-campus-border rounded-lg p-5 font-mono text-xs shadow-2xl min-h-[360px] max-h-[550px] overflow-y-auto space-y-4">
        {logs.map((entry) => (
          <div key={entry.id} className="border-b border-campus-border/60 pb-3.5 last:border-none">
            <div className="flex items-center justify-between text-campus-muted text-[11px] mb-1.5">
              <div className="flex items-center space-x-2">
                <span className="text-campus-gold font-bold">&gt; {entry.command}</span>
                {entry.studentRoll && (
                  <span className="text-campus-secondary font-mono">[Student: {entry.studentRoll}]</span>
                )}
              </div>
              <span className="text-campus-muted font-mono">{entry.timestamp}</span>
            </div>

            <div
              className={`p-3 rounded whitespace-pre-wrap leading-relaxed border ${
                entry.response.success
                  ? "bg-campus-bg text-campus-text border-campus-border font-mono text-[11px]"
                  : "bg-campus-error/10 text-campus-error border-campus-error/30 font-mono text-[11px]"
              }`}
            >
              {entry.response.message}
            </div>

            {entry.response.printableTicketId && (
              <div className="mt-2.5">
                <button
                  onClick={() => handlePrintSlip(entry.response.printableTicketId!)}
                  className="px-3 py-1.5 bg-campus-gold hover:bg-campus-gold-light text-campus-bg text-xs font-semibold rounded inline-flex items-center space-x-1.5 transition-colors"
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
