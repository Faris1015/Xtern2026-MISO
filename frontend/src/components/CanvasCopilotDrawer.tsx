import React, { useState, useEffect, useRef } from "react";
import { Sparkles, X, Send, Bot, User, CornerDownLeft, ShieldCheck } from "lucide-react";
import type { AudienceMode, ChatMessage, SearchResponse } from "../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  apiBase: string;
  result: SearchResponse | null;
  audienceMode: AudienceMode;
  onSelectPrompt?: (prompt: string) => void;
}

export const CanvasCopilotDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  apiBase,
  result,
  audienceMode,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedChips, setSuggestedChips] = useState<string[]>([
    "Why did prices peak at this interval?",
    "Explain Day-Ahead vs. Real-Time spread",
    "What are the grid reliability implications?",
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus input on open & handle Escape key
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Reset or initialize when new search result arrives
  useEffect(() => {
    if (result) {
      const hubLabel = result.hubId || result.query;
      setMessages([
        {
          role: "assistant",
          content: `I'm your **MISO Grid Copilot**. I have loaded verified telemetry for **${hubLabel}** (${result.chartType.replace("_", " ")}). Ask me any analytical question about these numbers, spreads, or dispatch conditions!`,
        },
      ]);
    }
  }, [result]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const queryText = (textToSend || inputValue).trim();
    if (!queryText || isLoading || !result) return;

    const userMsg: ChatMessage = { role: "user", content: queryText };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInputValue("");
    setIsLoading(true);

    try {
      const payload = {
        message: queryText,
        canvasContext: {
          query: result.query,
          chartType: result.chartType,
          hubId: result.hubId,
          kpis: result.kpis,
          data: Array.isArray(result.data) ? result.data.slice(0, 12) : result.data,
          sourceCitation: result.sourceCitation,
        },
        persona: audienceMode,
        history: updatedHistory.slice(-4),
      };

      const res = await fetch(`${apiBase}/api/canvas-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.response },
        ]);
        if (data.suggestedFollowUps && data.suggestedFollowUps.length > 0) {
          setSuggestedChips(data.suggestedFollowUps);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "I ran into a temporary connection issue. Telemetry is verified, please try asking again.",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Unable to reach the Copilot service. Please check your network connection.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <aside
      className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col transition-transform duration-300 ease-in-out"
      aria-label="Canvas Copilot Assistant"
    >
      {/* Header */}
      <div className="bg-[#0F2942] text-white px-5 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-sky-500/20 text-sky-300 rounded-lg">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-wide flex items-center gap-2">
              Canvas Copilot
              <span className="text-[10px] font-normal uppercase tracking-wider px-2 py-0.5 rounded bg-sky-500/30 text-sky-200">
                Grounded AI
              </span>
            </h2>
            <p className="text-xs text-sky-200/80">
              Active Context: <span className="text-white font-medium">{result?.hubId || result?.query || "MISO Data"}</span>
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400"
          aria-label="Close Copilot drawer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Sub-Header Context Bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Zero-Hallucination Verified Mode</span>
        </div>
        <span className="font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
          {audienceMode}
        </span>
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-2.5 ${
              msg.role === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
                msg.role === "user"
                  ? "bg-sky-600 text-white"
                  : "bg-[#0F2942] text-sky-300"
              }`}
            >
              {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div
              className={`rounded-xl px-3.5 py-2.5 max-w-[82%] text-xs leading-relaxed ${
                msg.role === "user"
                  ? "bg-sky-600 text-white rounded-tr-none shadow-sm"
                  : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200 shadow-sm"
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#0F2942] text-sky-300 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-100 rounded-xl rounded-tl-none px-4 py-3 border border-slate-200">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-600 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-sky-600 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-sky-600 animate-bounce [animation-delay:0.4s]" />
                <span className="text-[11px] text-slate-500 ml-1.5">Analyzing telemetry...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Starter Chips */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-200">
        <div className="text-[11px] font-semibold text-slate-500 mb-1.5">
          Suggested Follow-Ups:
        </div>
        <div className="flex flex-wrap gap-1.5">
          {suggestedChips.map((chip, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(chip)}
              disabled={isLoading}
              className="text-[11px] text-sky-700 bg-white border border-sky-200 hover:bg-sky-50 hover:border-sky-300 px-2.5 py-1 rounded-full transition-all text-left disabled:opacity-50"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Message Input Box */}
      <div className="p-4 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about this canvas data..."
            disabled={isLoading}
            className="flex-1 text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 disabled:bg-slate-100"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="bg-[#0F2942] hover:bg-sky-700 text-white p-2.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-sky-500"
            aria-label="Send question to Copilot"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[10px] text-slate-400 mt-2 text-center">
          Press <kbd className="font-mono bg-slate-100 px-1 py-0.5 rounded">Enter</kbd> to send • <kbd className="font-mono bg-slate-100 px-1 py-0.5 rounded">Esc</kbd> to close
        </p>
      </div>
    </aside>
  );
};

