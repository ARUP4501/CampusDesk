import React, { useState } from "react";
import { HelpCircle, Send, CheckCircle2, Building, ShieldCheck, CornerDownRight, Sparkles, CircleHelp } from "lucide-react";
import { apiRequest, UserProfile } from "../api/client.js";

interface FaqMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  source?: string;
  contactOffice?: string;
  timestamp: string;
}

export const FaqAssistantPage: React.FC<{ user: UserProfile | null }> = ({ user }) => {
  const [messages, setMessages] = useState<FaqMessage[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "Hello! I am the CampusDesk Database Assistant. I can look up live records from your college database:\n- Are classes cancelled today?\n- Today's mess menu\n- Fee dues and deadlines\n- Live gate pass status\n- Maintenance complaint status\n- Department office contacts\n\nIf the data is not in our system, I will direct you to the official administrative office.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);

  const [questionInput, setQuestionInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleAsk = async (queryText?: string) => {
    const q = (queryText || questionInput).trim();
    if (!q) return;

    const userMsg: FaqMessage = {
      id: `u_${Date.now()}`,
      sender: "user",
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuestionInput("");
    setLoading(true);

    try {
      const data = await apiRequest<{
        answer: string;
        source?: string;
        contactOffice?: string;
      }>("/api/faq/ask", {
        method: "POST",
        body: JSON.stringify({ question: q })
      });

      const botMsg: FaqMessage = {
        id: `b_${Date.now()}`,
        sender: "bot",
        text: data.answer,
        source: data.source,
        contactOffice: data.contactOffice,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errMsg: FaqMessage = {
        id: `err_${Date.now()}`,
        sender: "bot",
        text: "Could not query the database. Please try again or visit the administration desk.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const sampleQueries = [
    "Is class cancelled today?",
    "What is today's mess menu?",
    "What are my fee dues?",
    "Check my gate pass status",
    "Track my maintenance complaint",
    "Office contact directory"
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="glass-panel p-6 rounded-3xl border border-[var(--border-subtle)] shadow-glass flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-[#FF6D1F]/40 border border-[#FF6D1F]/25 flex items-center justify-center text-[var(--text-primary)]">
            <CircleHelp className="w-5 h-5 text-[var(--text-primary)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Campus Database Assistant</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Deterministic answers grounded strictly in verified college database tables with zero hallucinated data
            </p>
          </div>
        </div>
      </div>

      {/* Suggested Query Buttons */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
        <span className="text-[var(--text-muted)] text-[11px] font-mono whitespace-nowrap">Suggested:</span>
        {sampleQueries.map((sq) => (
          <button
            key={sq}
            onClick={() => handleAsk(sq)}
            className="whitespace-nowrap glass-card text-[var(--text-primary)] hover:text-[var(--text-primary)] px-3.5 py-1.5 rounded-full text-xs font-medium border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)]/80 transition-all"
          >
            {sq}
          </button>
        ))}
      </div>

      {/* Chat Area */}
      <div className="glass-panel rounded-3xl flex flex-col h-[520px] overflow-hidden border border-[var(--border-subtle)] shadow-glass">
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-3xl p-4 text-xs ${
                  m.sender === "user"
                    ? "bg-[#FF6D1F] text-[#141414] font-semibold shadow-sm"
                    : "campus-block border border-[var(--border-subtle)] text-[var(--text-primary)]"
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>

                {m.source && (
                  <div className="mt-2.5 pt-2.5 border-t border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)] font-mono flex items-center space-x-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#FF6D1F]" />
                    <span>Verified Source: {m.source}</span>
                  </div>
                )}

                {m.contactOffice && (
                  <div className="mt-1.5 text-[11px] text-[#FF6D1F] font-bold">
                    Office Contact: {m.contactOffice}
                  </div>
                )}

                <div
                  className={`mt-2 text-[10px] font-mono ${
                    m.sender === "user" ? "text-[#141414]/70 text-right" : "text-[var(--text-subtle)]"
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="campus-block border border-[var(--border-subtle)] rounded-2xl p-4 text-xs text-[var(--text-secondary)] flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-[#FF6D1F] border-t-transparent rounded-full animate-spin" />
                <span>Querying college database records...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] flex items-center space-x-2.5"
        >
          <input
            type="text"
            value={questionInput}
            onChange={(e) => setQuestionInput(e.target.value)}
            placeholder="Ask about classes, mess food, fee dates, pass status..."
            className="flex-1 text-xs px-4 py-3 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-input)] text-[var(--text-primary)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-[#FF6D1F]"
          />
          <button
            type="submit"
            disabled={loading || !questionInput.trim()}
            className="btn-primary px-5 py-3 text-xs font-bold flex items-center space-x-1.5 disabled:opacity-40 shadow-sm"
          >
            <Send className="w-4 h-4" />
            <span>Ask</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default FaqAssistantPage;
