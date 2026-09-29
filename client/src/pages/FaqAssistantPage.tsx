import React, { useState } from "react";
import { HelpCircle, Send, CheckCircle2, Building, ShieldCheck, CornerDownRight } from "lucide-react";
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
      <div className="bg-white border border-stone-300 p-4 rounded-[6px]">
        <div className="flex items-center space-x-2">
          <HelpCircle className="w-5 h-5 text-[#0f4c3a]" />
          <h1 className="text-xl font-bold text-stone-900">Database FAQ Assistant</h1>
        </div>
        <p className="text-xs text-stone-600 mt-0.5">
          Answers grounded strictly in verified college database tables with zero invented statistics
        </p>
      </div>

      {/* Suggested Query Buttons */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
        <span className="font-semibold text-stone-600 whitespace-nowrap">Suggested:</span>
        {sampleQueries.map((sq) => (
          <button
            key={sq}
            onClick={() => handleAsk(sq)}
            className="whitespace-nowrap bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 px-2.5 py-1 rounded-[4px] font-medium"
          >
            {sq}
          </button>
        ))}
      </div>

      {/* Chat Area */}
      <div className="bg-white border border-stone-300 rounded-[6px] shadow-sm flex flex-col h-[520px] overflow-hidden">
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-[6px] p-3 text-xs ${
                  m.sender === "user"
                    ? "bg-[#0f4c3a] text-white"
                    : "bg-stone-50 border border-stone-200 text-stone-900"
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>

                {m.source && (
                  <div className="mt-2 pt-2 border-t border-stone-200 text-[10px] text-stone-500 flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-800" />
                    <span>Verified Source: {m.source}</span>
                  </div>
                )}

                {m.contactOffice && (
                  <div className="mt-1 text-[11px] text-stone-600 font-medium">
                    Office Contact: {m.contactOffice}
                  </div>
                )}

                <div
                  className={`mt-1 text-[10px] ${
                    m.sender === "user" ? "text-emerald-200 text-right" : "text-stone-400"
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-stone-50 border border-stone-200 rounded-[6px] p-3 text-xs text-stone-500 italic">
                Querying database records...
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
          className="p-3 border-t border-stone-200 bg-stone-50 flex items-center space-x-2"
        >
          <input
            type="text"
            value={questionInput}
            onChange={(e) => setQuestionInput(e.target.value)}
            placeholder="Ask about classes, mess food, fee dates, pass status..."
            className="flex-1 text-xs px-3 py-2 border border-stone-300 rounded-[4px] bg-white focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !questionInput.trim()}
            className="px-4 py-2 bg-[#0f4c3a] hover:bg-[#0b392b] text-white text-xs font-semibold rounded-[4px] flex items-center space-x-1 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Ask</span>
          </button>
        </form>
      </div>
    </div>
  );
};
