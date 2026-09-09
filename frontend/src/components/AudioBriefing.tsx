import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Headphones,
  Pause,
  Play,
  RotateCcw,
  Sliders,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import type { AudienceMode } from "../types";

export interface AudioBriefingProps {
  audienceMode?: AudienceMode;
  onAudienceModeChange?: (mode: AudienceMode) => void;
  className?: string;
  defaultOpen?: boolean;
}

interface BriefingScript {
  id: AudienceMode;
  title: string;
  tagline: string;
  targetDurationSeconds: number;
  text: string;
}

const BRIEFING_SCRIPTS: Record<AudienceMode, BriefingScript> = {
  "Power Trader": {
    id: "Power Trader",
    title: "Market & Trading Desk Briefing",
    tagline: "LMP spreads, congestion risks & peak hour forecast",
    targetDurationSeconds: 45,
    text: "Good morning. This is your 45-second MISO market conditions briefing. Across our 15-state footprint, operational reserves remain strong with total demand tracking near 78 gigawatts. Indiana Hub is clearing at a real-time average of $40.79 per megawatt-hour, with day-ahead spreads widening in hour ending 18. Natural gas anchors generation at 40 percent, followed by coal at 26 percent and wind delivering 15 percent of supply. Interties across the Central and Northern regions show stable transmission throughput with negligible congestion. Ancillary services are fully funded and all reliability margins are satisfied.",
  },
  "Municipal Co-op": {
    id: "Municipal Co-op",
    title: "Co-op & Member Reliability Briefing",
    tagline: "Hedging costs, reserve margins & demand stability",
    targetDurationSeconds: 45,
    text: "Good morning. This is your 45-second MISO co-op resource and reliability briefing. Coincident peak demand across municipal distribution territories is trending steady at 78 gigawatts. Day-ahead energy schedules reflect an average price of $38.67, providing favorable wholesale cost hedging. Capacity reserve margins currently sit at 18.2 percent, well above the required Planning Reserve Margin. Renewable contributions are led by wind at 15 percent and utility solar at 3 percent. Transmission corridors into load centers remain unconstrained with zero emergency alerts issued.",
  },
  "Public / Media": {
    id: "Public / Media",
    title: "Clean Energy & Public Grid Overview",
    tagline: "Zero-carbon generation, regional scope & reliability",
    targetDurationSeconds: 45,
    text: "Good morning. Here is your 45-second MISO clean energy and grid overview. Today, MISO is reliably powering 45 million people across 15 Midwest states and Manitoba. Current electricity demand is 78 gigawatts. Clean, zero-carbon energy is currently supplying nearly 30 percent of the region's electricity, led by 15 percent wind and 14 percent nuclear power. Natural gas provides 40 percent to ensure continuous grid stability. All regional transmission systems are running smoothly with no weather-related alerts, ensuring dependable power for homes and businesses.",
  },
  "State Regulator": {
    id: "State Regulator",
    title: "Regulatory & System Planning Briefing",
    tagline: "Statutory reserves, MTEP metrics & transmission health",
    targetDurationSeconds: 45,
    text: "Good morning. This is your 45-second MISO regulatory and transmission briefing. Grid reliability metrics remain robust with operating reserves exceeding statutory criteria across all three operational regions. Indiana Hub real-time prices average $40.79 per megawatt-hour. Long-Range Transmission Planning tranche investments continue to reduce regional congestion, with inter-regional transfer capability operating within nominal limits. Generation resource adequacy complies with all MTEP benchmark targets, and fuel diversity maintains resilience against planned summer maintenance outages.",
  },
};

const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5] as const;

export default function AudioBriefing({
  audienceMode = "Power Trader",
  onAudienceModeChange,
  className = "",
  defaultOpen = false,
}: AudioBriefingProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [selectedPersona, setSelectedPersona] = useState<AudienceMode>(audienceMode);
  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // Web Speech API support & state
  const [isSupported, setIsSupported] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>("");
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [pitch, setPitch] = useState<number>(1);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(false);

  // Playback tracking
  const [currentCharIndex, setCurrentCharIndex] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // References
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const keepAliveIntervalRef = useRef<number | null>(null);
  const elapsedTimerRef = useRef<number | null>(null);

  // Keep internal persona in sync if external prop changes
  useEffect(() => {
    setSelectedPersona(audienceMode);
  }, [audienceMode]);

  const activeScript = useMemo(
    () => BRIEFING_SCRIPTS[selectedPersona] ?? BRIEFING_SCRIPTS["Power Trader"],
    [selectedPersona],
  );

  // Estimated duration adjusted for playback rate
  const estimatedTotalSeconds = useMemo(() => {
    return Math.max(10, Math.round(activeScript.targetDurationSeconds / playbackRate));
  }, [activeScript.targetDurationSeconds, playbackRate]);

  // Click outside and Escape key listeners to close the tooltip
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Check browser support and populate voices
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setIsSupported(false);
      return;
    }

    const updateVoices = () => {
      try {
        const available = window.speechSynthesis.getVoices();
        if (available && available.length > 0) {
          const englishVoices = available.filter((v) =>
            v.lang.toLowerCase().startsWith("en"),
          );
          const list = englishVoices.length > 0 ? englishVoices : available;
          setVoices(list);

          setSelectedVoiceURI((prev) => {
            if (prev && list.some((v) => v.voiceURI === prev)) return prev;
            const preferred =
              list.find(
                (v) =>
                  v.name.includes("Natural") ||
                  v.name.includes("Neural") ||
                  v.name.includes("Google") ||
                  v.name.includes("Samantha"),
              ) ?? list[0];
            return preferred?.voiceURI ?? "";
          });
        }
      } catch {
        // Graceful fallback
      }
    };

    updateVoices();
    window.speechSynthesis.addEventListener("voiceschanged", updateVoices);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", updateVoices);
    };
  }, []);

  // Timer cleanup helper
  const clearTimers = useCallback(() => {
    if (keepAliveIntervalRef.current !== null) {
      window.clearInterval(keepAliveIntervalRef.current);
      keepAliveIntervalRef.current = null;
    }
    if (elapsedTimerRef.current !== null) {
      window.clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
  }, []);

  // Stop speech completely
  const stopSpeech = useCallback(() => {
    clearTimers();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentCharIndex(0);
    setElapsedSeconds(0);
    setStatusMessage("Briefing stopped.");
  }, [clearTimers]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      clearTimers();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [clearTimers]);

  // Start speech synthesis with Chrome keepalive workaround
  const startSpeech = useCallback(
    (resumeFromChar = 0) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

      window.speechSynthesis.cancel();
      clearTimers();

      const textToSpeak =
        resumeFromChar > 0
          ? activeScript.text.slice(resumeFromChar)
          : activeScript.text;

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utteranceRef.current = utterance;

      if (selectedVoiceURI) {
        const voice = voices.find((v) => v.voiceURI === selectedVoiceURI);
        if (voice) utterance.voice = voice;
      }
      utterance.rate = playbackRate;
      utterance.pitch = pitch;
      utterance.volume = isMuted ? 0 : volume;

      utterance.onstart = () => {
        setIsPlaying(true);
        setIsPaused(false);
        setStatusMessage(`Playing 45-second ${activeScript.title}`);
      };

      utterance.onboundary = (event: SpeechSynthesisEvent) => {
        if (event.name === "word" || event.charIndex !== undefined) {
          const index = resumeFromChar + event.charIndex;
          setCurrentCharIndex(index);
        }
      };

      utterance.onend = () => {
        clearTimers();
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentCharIndex(activeScript.text.length);
        setElapsedSeconds(estimatedTotalSeconds);
        setStatusMessage("Briefing completed.");
      };

      utterance.onerror = (e) => {
        if (e.error === "canceled" || e.error === "interrupted") return;
        clearTimers();
        setIsPlaying(false);
        setIsPaused(false);
        setStatusMessage("Playback encountered an issue. Please try again.");
      };

      elapsedTimerRef.current = window.setInterval(() => {
        setElapsedSeconds((prev) => {
          if (prev >= estimatedTotalSeconds) return estimatedTotalSeconds;
          return prev + 1;
        });
      }, 1000);

      keepAliveIntervalRef.current = window.setInterval(() => {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }, 10000);

      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
      setIsPaused(false);
    },
    [
      activeScript,
      clearTimers,
      estimatedTotalSeconds,
      isMuted,
      pitch,
      playbackRate,
      selectedVoiceURI,
      voices,
      volume,
    ],
  );

  // Pause speech
  const pauseSpeech = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        setIsPaused(true);
        setStatusMessage("Briefing paused.");
        if (elapsedTimerRef.current !== null) {
          window.clearInterval(elapsedTimerRef.current);
          elapsedTimerRef.current = null;
        }
      }
    }
  }, []);

  // Resume speech
  const resumeSpeech = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
        setStatusMessage("Briefing resumed.");

        elapsedTimerRef.current = window.setInterval(() => {
          setElapsedSeconds((prev) => {
            if (prev >= estimatedTotalSeconds) return estimatedTotalSeconds;
            return prev + 1;
          });
        }, 1000);
      } else {
        startSpeech(currentCharIndex);
      }
    }
  }, [currentCharIndex, estimatedTotalSeconds, startSpeech]);

  // Toggle Play / Pause main button
  const togglePlay = useCallback(() => {
    if (!isPlaying) {
      startSpeech(0);
    } else if (isPaused) {
      resumeSpeech();
    } else {
      pauseSpeech();
    }
  }, [isPaused, isPlaying, pauseSpeech, resumeSpeech, startSpeech]);

  // Handle persona switch
  const handleSelectPersona = useCallback(
    (persona: AudienceMode) => {
      setSelectedPersona(persona);
      onAudienceModeChange?.(persona);
      if (isPlaying) {
        stopSpeech();
      } else {
        setCurrentCharIndex(0);
        setElapsedSeconds(0);
      }
    },
    [isPlaying, onAudienceModeChange, stopSpeech],
  );

  // Speed change handler
  const handleSpeedChange = useCallback(
    (speed: number) => {
      setPlaybackRate(speed);
      if (isPlaying && !isPaused) {
        startSpeech(currentCharIndex);
      }
    },
    [currentCharIndex, isPaused, isPlaying, startSpeech],
  );

  // Copy transcript text to clipboard
  const handleCopyTranscript = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(activeScript.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }, [activeScript.text]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const progressPercent = useMemo(() => {
    if (!isPlaying && elapsedSeconds === 0) return 0;
    if (elapsedSeconds >= estimatedTotalSeconds) return 100;
    if (activeScript.text.length > 0 && currentCharIndex > 0) {
      return Math.min(100, Math.round((currentCharIndex / activeScript.text.length) * 100));
    }
    return Math.min(100, Math.round((elapsedSeconds / estimatedTotalSeconds) * 100));
  }, [activeScript.text.length, currentCharIndex, elapsedSeconds, estimatedTotalSeconds, isPlaying]);

  const { spokenText, currentWord, upcomingText } = useMemo(() => {
    const text = activeScript.text;
    if (currentCharIndex <= 0) {
      return { spokenText: "", currentWord: "", upcomingText: text };
    }
    if (currentCharIndex >= text.length) {
      return { spokenText: text, currentWord: "", upcomingText: "" };
    }

    const nextSpace = text.indexOf(" ", currentCharIndex);
    const wordEnd = nextSpace === -1 ? text.length : nextSpace;

    return {
      spokenText: text.slice(0, currentCharIndex),
      currentWord: text.slice(currentCharIndex, wordEnd),
      upcomingText: text.slice(wordEnd),
    };
  }, [activeScript.text, currentCharIndex]);

  return (
    <div
      ref={containerRef}
      className={`relative inline-block ${className}`}
      data-tour="audio-briefing"
    >
      {/* Screen Reader Live Announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {statusMessage}
      </div>

      {/* Trigger Button to the left of "Guided Tour" */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-controls="audio-briefing-tooltip"
        aria-label={
          isPlaying && !isPaused
            ? `Audio Briefing playing (${formatTime(elapsedSeconds)}). Click to open controls.`
            : "Morning Market Briefing (45-second audio overview)"
        }
        className={`miso-button-secondary text-xs sm:text-sm font-semibold transition-all ${
          isOpen
            ? "border-miso-sky text-miso-sky bg-miso-soft"
            : isPlaying && !isPaused
              ? "border-miso-sky text-miso-navy bg-miso-soft/70 shadow-xs"
              : ""
        }`}
      >
        {/* Animated sound wave bars when active */}
        {isPlaying && !isPaused ? (
          <div className="flex h-3 items-end gap-0.5" aria-hidden="true">
            {["h-1.5", "h-3", "h-2", "h-3"].map((h, i) => (
              <span
                key={i}
                className={`w-0.5 rounded-full bg-miso-sky animate-pulse ${h}`}
                style={{ animationDelay: `${i * 120}ms` }}
              />
            ))}
          </div>
        ) : (
          <Volume2
            size={16}
            className={isOpen ? "text-miso-sky" : "text-miso-sky"}
            aria-hidden="true"
          />
        )}

        <span>
          {isPlaying && !isPaused
            ? `Briefing (${formatTime(elapsedSeconds)})`
            : isPaused
              ? `Paused (${formatTime(elapsedSeconds)})`
              : "Morning Briefing"}
        </span>

        <span className="rounded bg-miso-soft px-1.5 py-0.2 text-[10px] font-bold text-miso-navy tracking-tight">
          45s
        </span>

        {isOpen ? (
          <ChevronUp size={13} className="text-miso-muted" aria-hidden="true" />
        ) : (
          <ChevronDown size={13} className="text-miso-muted" aria-hidden="true" />
        )}
      </button>

      {/* Floating Tooltip / Popover Panel */}
      {isOpen && (
        <section
          id="audio-briefing-tooltip"
          role="dialog"
          aria-label="45-second audio market briefing player"
          className="absolute right-0 top-full mt-2 z-50 w-[420px] sm:w-[480px] max-w-[calc(100vw-2rem)] rounded-xs border border-miso-border bg-white shadow-panel animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Top Decorative Border */}
          <div className="h-1 w-full bg-miso-sky" />

          {/* Popover Header */}
          <div className="flex items-center justify-between border-b border-miso-border px-4 py-3 bg-miso-card/60">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xs ${
                  isPlaying && !isPaused
                    ? "bg-miso-sky text-white"
                    : "bg-miso-navy text-white"
                }`}
              >
                <Headphones size={15} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="miso-eyebrow text-[10px]">Market Audio</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-miso-navy">
                    <Sparkles size={10} className="text-miso-sky" aria-hidden="true" />
                    Web Speech API
                  </span>
                </div>
                <h3 className="text-xs font-bold text-miso-navy truncate">
                  45s Briefing · {activeScript.title}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowSettings((prev) => !prev)}
                aria-label="Synthesizer settings"
                aria-expanded={showSettings}
                title="Synthesizer settings"
                className={`icon-button p-1 rounded-xs border transition ${
                  showSettings
                    ? "border-miso-sky text-miso-sky bg-miso-soft"
                    : "border-transparent text-miso-muted hover:text-miso-navy"
                }`}
              >
                <Sliders size={14} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close audio briefing tooltip"
                className="icon-button p-1 rounded-xs text-miso-muted hover:text-miso-navy hover:bg-miso-border/40"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Persona Tabs */}
          <div
            role="tablist"
            aria-label="Audience briefing focus"
            className="grid grid-cols-4 border-b border-miso-border bg-miso-soft/30 text-[11px]"
          >
            {(Object.keys(BRIEFING_SCRIPTS) as AudienceMode[]).map((persona) => {
              const isActive = selectedPersona === persona;
              return (
                <button
                  key={persona}
                  role="tab"
                  type="button"
                  aria-selected={isActive}
                  onClick={() => handleSelectPersona(persona)}
                  className={`py-1.5 px-2 text-center font-semibold transition border-b-2 truncate ${
                    isActive
                      ? "border-miso-sky text-miso-navy font-bold bg-white"
                      : "border-transparent text-miso-muted hover:text-miso-navy hover:bg-white/60"
                  }`}
                  title={BRIEFING_SCRIPTS[persona].tagline}
                >
                  {persona.split(" ")[0]}
                </button>
              );
            })}
          </div>

          {/* Quick Player Bar */}
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              {/* Main Play / Pause CTA */}
              <button
                type="button"
                onClick={togglePlay}
                disabled={!isSupported}
                aria-label={
                  !isPlaying
                    ? "Listen to Morning Briefing: 45-second audio summary"
                    : isPaused
                      ? "Resume 45-second briefing"
                      : "Pause 45-second briefing"
                }
                className={`miso-button-primary text-xs font-bold px-3.5 py-2 shadow-xs transition-colors flex-1 justify-center ${
                  isPlaying && !isPaused
                    ? "bg-miso-navy hover:bg-slate-800"
                    : "bg-miso-sky hover:bg-miso-navy"
                }`}
              >
                {isPlaying && !isPaused ? (
                  <>
                    <Pause size={15} aria-hidden="true" />
                    <span>Pause</span>
                  </>
                ) : isPaused ? (
                  <>
                    <Play size={15} aria-hidden="true" />
                    <span>Resume Briefing</span>
                  </>
                ) : (
                  <>
                    <Volume2 size={15} aria-hidden="true" />
                    <span>🔊 Listen to Morning Briefing</span>
                  </>
                )}
              </button>

              {/* Stop / Reset Button */}
              {(isPlaying || isPaused || elapsedSeconds > 0) && (
                <button
                  type="button"
                  onClick={stopSpeech}
                  aria-label="Stop and restart briefing"
                  title="Stop and restart"
                  className="icon-button border border-miso-border bg-white text-miso-slate hover:text-miso-navy p-2"
                >
                  <RotateCcw size={14} aria-hidden="true" />
                </button>
              )}

              {/* Speed Buttons */}
              <div
                className="inline-flex rounded border border-miso-border bg-white p-0.5 text-[11px] font-semibold"
                role="group"
                aria-label="Playback speed"
              >
                {SPEED_OPTIONS.map((speed) => (
                  <button
                    key={speed}
                    type="button"
                    onClick={() => handleSpeedChange(speed)}
                    aria-pressed={playbackRate === speed}
                    aria-label={`${speed}x speed`}
                    className={`px-1.5 py-0.5 transition ${
                      playbackRate === speed
                        ? "bg-miso-sky font-bold text-white shadow-xs"
                        : "text-miso-muted hover:text-miso-navy"
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>

              {/* Mute Toggle */}
              <button
                type="button"
                onClick={() => setIsMuted((prev) => !prev)}
                aria-label={isMuted ? "Unmute audio" : "Mute audio"}
                aria-pressed={isMuted}
                title={isMuted ? "Unmute" : "Mute"}
                className={`icon-button border border-miso-border bg-white p-2 ${
                  isMuted
                    ? "text-red-600 bg-red-50"
                    : "text-miso-slate hover:text-miso-navy"
                }`}
              >
                {isMuted ? (
                  <VolumeX size={14} aria-hidden="true" />
                ) : (
                  <Volume2 size={14} aria-hidden="true" />
                )}
              </button>
            </div>

            {/* Progress Bar & Timestamps */}
            <div>
              <div className="flex items-center justify-between text-[11px] text-miso-muted font-semibold">
                <span className="tabular-nums">
                  {formatTime(elapsedSeconds)} / {formatTime(estimatedTotalSeconds)}
                </span>
                <span className="truncate max-w-[220px] text-[11px] text-miso-slate">
                  {isPlaying && !isPaused ? (
                    <span className="text-miso-sky font-bold">
                      {currentWord || "Reading market summary..."}
                    </span>
                  ) : isPaused ? (
                    <span className="text-amber-700">Paused</span>
                  ) : (
                    <span>~45 sec target duration</span>
                  )}
                </span>
                <span className="tabular-nums font-bold text-miso-navy">
                  {progressPercent}%
                </span>
              </div>

              <div
                className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-miso-border/60"
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Briefing audio progress"
              >
                <div
                  className="h-full bg-miso-sky transition-all duration-300 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Settings Subpanel */}
            {showSettings && (
              <div className="rounded border border-miso-border bg-miso-card p-3 space-y-2.5 text-xs">
                <div className="flex items-center justify-between font-bold text-miso-navy text-[11px] uppercase tracking-wider">
                  <span>Synthesizer Preferences</span>
                  <button
                    type="button"
                    onClick={() => setShowSettings(false)}
                    className="text-miso-muted hover:text-miso-navy"
                  >
                    Close
                  </button>
                </div>

                <div>
                  <label
                    htmlFor="speech-voice-select-tooltip"
                    className="block text-[11px] font-semibold text-miso-slate mb-1"
                  >
                    Voice
                  </label>
                  <select
                    id="speech-voice-select-tooltip"
                    value={selectedVoiceURI}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                      setSelectedVoiceURI(e.target.value)
                    }
                    className="w-full border border-miso-border bg-white px-2 py-1 text-xs text-miso-navy focus:border-miso-sky"
                  >
                    {voices.length === 0 && (
                      <option value="">Default System Voice</option>
                    )}
                    {voices.map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-miso-slate mb-0.5">
                      <label htmlFor="speech-pitch-tooltip">Pitch</label>
                      <span className="tabular-nums text-miso-muted">
                        {pitch.toFixed(1)}
                      </span>
                    </div>
                    <input
                      id="speech-pitch-tooltip"
                      type="range"
                      min="0.7"
                      max="1.3"
                      step="0.1"
                      value={pitch}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setPitch(parseFloat(e.target.value))
                      }
                      className="w-full accent-miso-sky h-1.5"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-miso-slate mb-0.5">
                      <label htmlFor="speech-vol-tooltip">Volume</label>
                      <span className="tabular-nums text-miso-muted">
                        {Math.round((isMuted ? 0 : volume) * 100)}%
                      </span>
                    </div>
                    <input
                      id="speech-vol-tooltip"
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        setVolume(parseFloat(e.target.value));
                        if (isMuted) setIsMuted(false);
                      }}
                      className="w-full accent-miso-sky h-1.5"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Collapsible Transcript Section */}
            <div className="rounded border border-miso-border bg-white p-3">
              <div className="flex items-center justify-between border-b border-miso-border pb-2 mb-2">
                <button
                  type="button"
                  onClick={() => setIsTranscriptExpanded((prev) => !prev)}
                  className="flex items-center gap-1.5 text-xs font-bold text-miso-navy hover:text-miso-sky"
                  aria-expanded={isTranscriptExpanded}
                >
                  <span className="miso-eyebrow text-[10px]">Transcript</span>
                  {isTranscriptExpanded ? (
                    <ChevronUp size={13} aria-hidden="true" />
                  ) : (
                    <ChevronDown size={13} aria-hidden="true" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleCopyTranscript}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-miso-slate hover:text-miso-sky transition"
                  aria-label="Copy script text"
                >
                  {copied ? (
                    <>
                      <Check size={12} className="text-miso-emerald" aria-hidden="true" />
                      <span className="text-miso-emerald">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} aria-hidden="true" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {isTranscriptExpanded && (
                <div
                  className="max-h-40 overflow-y-auto pr-1 text-xs leading-relaxed text-miso-slate select-text"
                  tabIndex={0}
                  aria-label="Narration Transcript"
                >
                  {spokenText && (
                    <span className="text-miso-muted bg-miso-soft/50 transition-colors">
                      {spokenText}
                    </span>
                  )}
                  {currentWord && (
                    <mark className="bg-amber-200 text-miso-navy px-1 py-0.2 rounded-xs font-semibold shadow-xs">
                      {currentWord}
                    </mark>
                  )}
                  {upcomingText && <span>{upcomingText}</span>}
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
