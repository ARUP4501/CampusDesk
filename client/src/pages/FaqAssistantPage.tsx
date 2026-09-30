import React, { useState } from "react";
import { HelpCircle, Send, CheckCircle2, Building, ShieldCheck, CornerDownRight, Sparkles } from "lucide-react";
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
      <div className="bg-campus-card border border-campus-border p-5 rounded-lg">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded bg-campus-elevated border border-campus-border flex items-center justify-center text-campus-gold">
            <HelpCircle className="w-4 h-4" />
          </div>
          <h1 className="text-lg font-semibold text-campus-text">Database Assistant & Knowledge Base</h1>
        </div>
        <p className="text-xs text-campus-muted mt-1.5 ml-10">
          Deterministic answers grounded strictly in verified college database tables with zero hallucinated data
        </p>
      </div>

      {/* Suggested Query Buttons */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
        <span className="text-campus-muted text-[11px] font-mono whitespace-nowrap">Suggested:</span>
        {sampleQueries.map((sq) => (
          <button
            key={sq}
            onClick={() => handleAsk(sq)}
            className="whitespace-nowrap bg-campus-card hover:bg-campus-elevated border border-campus-border hover:border-campus-gold/40 text-campus-secondary hover:text-campus-text px-3 py-1.5 rounded text-xs transition-colors"
          >
            {sq}
          </button>
        ))}
      </div>

      {/* Chat Area */}
      <div className="bg-campus-card border border-campus-border rounded-lg shadow-xl flex flex-col h-[520px] overflow-hidden">
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-lg p-4 text-xs ${
                  m.sender === "user"
                    ? "bg-campus-gold text-campus-bg font-medium"
                    : "bg-campus-elevated/70 border border-campus-border text-campus-text"
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>

                {m.source && (
                  <div className="mt-2.5 pt-2.5 border-t border-campus-border/60 text-[10px] text-campus-muted font-mono flex items-center space-x-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-campus-success" />
                    <span>Verified Source: {m.source}</span>
                  </div>
                )}

                {m.contactOffice && (
                  <div className="mt-1.5 text-[11px] text-campus-gold font-medium">
                    Office Contact: {m.contactOffice}
                  </div>
                )}

                <div
                  className={`mt-2 text-[10px] font-mono ${
                    m.sender === "user" ? "text-campus-bg/70 text-right" : "text-campus-muted"
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-campus-elevated/70 border border-campus-border rounded-lg p-3.5 text-xs text-campus-muted flex items-center space-x-2">
                <div className="w-3.5 h-3.5 border-2 border-campus-gold border-t-transparent rounded-full animate-spin" />
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
          className="p-3.5 border-t border-campus-border bg-campus-elevated/40 flex items-center space-x-2"
        >
          <input
            type="text"
            value={questionInput}
            onChange={(e) => setQuestionInput(e.target.value)}
            placeholder="Ask about classes, mess food, fee dates, pass status..."
            className="flex-1 text-xs px-3.5 py-2.5 border border-campus-border rounded bg-campus-bg text-campus-text placeholder-campus-muted focus:outline-none focus:border-campus-gold"
          />
          <button
            type="submit"
            disabled={loading || !questionInput.trim()}
            className="px-4 py-2.5 bg-campus-gold hover:bg-campus-gold-light text-campus-bg text-xs font-semibold rounded flex items-center space-x-1.5 disabled:opacity-40 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Ask</span>
          </button>
        </form>
      </div>
    </div>
  );
};
