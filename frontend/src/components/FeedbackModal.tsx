import React, { useState, useEffect, useRef } from "react";
import { X, MessageSquarePlus, Star, Send, CheckCircle2, AlertCircle } from "lucide-react";
import type { AudienceMode, FeedbackCategory, FeedbackPayload, FeedbackResponse } from "../types";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePersona: AudienceMode;
  queryContext?: string;
  apiBaseUrl?: string;
}

const CATEGORIES: { id: FeedbackCategory; label: string; description: string }[] = [
  { id: "bug", label: "Bug Report", description: "Something is broken or not rendering correctly" },
  { id: "data_inaccuracy", label: "Data Inaccuracy", description: "Numbers or tariff citations look incorrect" },
  { id: "feature_request", label: "Feature Suggestion", description: "Ideas for new tools, filters, or comparisons" },
  { id: "general", label: "General Feedback", description: "Thoughts on navigation, accessibility, or UX" },
];

export default function FeedbackModal({
  isOpen,
  onClose,
  activePersona,
  queryContext,
  apiBaseUrl = "http://localhost:8000",
}: FeedbackModalProps) {
  const [category, setCategory] = useState<FeedbackCategory>("feature_request");
  const [rating, setRating] = useState<number>(5);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [persona, setPersona] = useState<AudienceMode>(activePersona);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedResponse, setSubmittedResponse] = useState<FeedbackResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const modalRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setPersona(activePersona);
  }, [activePersona]);

  useEffect(() => {
    if (isOpen) {
      setSubmittedResponse(null);
      setErrorMessage("");
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || message.trim().length < 3) {
      setErrorMessage("Please enter at least a few words describing your feedback.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    const payload: FeedbackPayload = {
      category,
      rating,
      message: message.trim(),
      persona,
      queryContext: queryContext || undefined,
      userEmail: email.trim() || undefined,
    };

    try {
      const res = await fetch(`${apiBaseUrl}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data: FeedbackResponse = await res.json();
      setSubmittedResponse(data);
      setMessage("");
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : "Failed to connect to backend service.";
      setErrorMessage(`Could not submit feedback: ${errText}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <MessageSquarePlus size={20} aria-hidden="true" />
            </div>
            <div>
              <h2 id="feedback-title" className="text-base font-bold text-miso-navy">
                Engineer Feedback & Support
              </h2>
              <p className="text-xs text-miso-muted">
                Direct channel to the engineers maintaining MISO OmniSearch
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close feedback modal"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        {submittedResponse ? (
          <div className="p-8 text-center animate-fadeIn">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Thank You for Your Feedback!</h3>
            <p className="mt-2 text-sm text-slate-600">
              {submittedResponse.message}
            </p>
            <div className="mt-4 inline-block rounded-md bg-slate-100 px-3 py-1.5 font-mono text-xs text-slate-700">
              Tracking ID: <span className="font-semibold">{submittedResponse.feedbackId}</span>
            </div>
            <div className="mt-6">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-lg bg-miso-navy py-2.5 font-semibold text-white shadow hover:bg-slate-800 transition-colors"
              >
                Back to OmniSearch
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errorMessage && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Satisfaction Rating */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-miso-muted mb-1.5">
                How is your experience with OmniSearch?
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-slate-300 hover:text-amber-400 focus:outline-none transition-colors"
                    aria-label={`Rate ${star} out of 5 stars`}
                  >
                    <Star
                      size={24}
                      className={star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}
                    />
                  </button>
                ))}
                <span className="ml-2 text-xs font-medium text-slate-500">
                  {rating === 5 ? "Exceptional" : rating === 4 ? "Good" : rating === 3 ? "Average" : "Needs Improvement"}
                </span>
              </div>
            </div>

            {/* Category Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-miso-muted mb-1.5">
                Feedback Category
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`rounded-lg border p-2 text-left transition-all ${
                      category === cat.id
                        ? "border-sky-500 bg-sky-50/70 text-sky-900 ring-1 ring-sky-500"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="text-xs font-bold">{cat.label}</div>
                    <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                      {cat.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Message Area */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="feedback-message" className="block text-xs font-semibold uppercase tracking-wider text-miso-muted">
                  Message / Details
                </label>
                <span className="text-[10px] text-slate-400">
                  {message.length} characters
                </span>
              </div>
              <textarea
                id="feedback-message"
                ref={textareaRef}
                rows={3}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What went well? What can our engineers improve or fix?"
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            {/* Context & Persona Details */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Your Persona Mode
                </label>
                <select
                  value={persona}
                  onChange={(e) => setPersona(e.target.value as AudienceMode)}
                  className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700 focus:border-sky-500 focus:outline-none"
                >
                  <option value="Power Trader">Power Trader</option>
                  <option value="Municipal Co-op">Municipal Co-op</option>
                  <option value="Public / Media">Public / Media</option>
                  <option value="State Regulator">State Regulator</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.com"
                  className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            {queryContext && (
              <div className="rounded bg-slate-50 px-2.5 py-1 text-[11px] text-slate-500 truncate border border-slate-200">
                Context: <span className="font-mono text-slate-700">{queryContext}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? (
                  <span>Sending to Engineers...</span>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Send Feedback to Maintenance Team</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

