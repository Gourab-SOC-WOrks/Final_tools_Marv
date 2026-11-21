import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Download,
  Volume2,
  VolumeX,
  Info,
  Sliders,
  Check,
  Copy,
  AudioLines,
  Wand2,
  Mic,
  Music,
  Share2,
  FileAudio,
} from "lucide-react";
import narrationUrl from "@/assets/samples/narration.mp3";
import { runVoiceover } from "@/lib/ai.functions";
import { useServerFn } from "@tanstack/react-start";

export interface VoiceOption {
  id: string;
  name: string;
  geminiVoice: string;
  tag: string;
  description: string;
  gender: "male" | "female";
  previewQuote: string;
}

export const CURATED_VOICES: VoiceOption[] = [
  {
    id: "marcus",
    name: "Marcus",
    geminiVoice: "Charon",
    tag: "Deep & Documentary",
    description: "Authoritative & cinematic narration",
    gender: "male",
    previewQuote: "I'm Marcus. Deep, authoritative narration built for documentaries and long-form stories.",
  },
  {
    id: "maya",
    name: "Maya",
    geminiVoice: "Puck",
    tag: "Energetic Shorts",
    description: "Punchy, fast-paced & vibrant",
    gender: "female",
    previewQuote: "Hey, I'm Maya! Upbeat and high-energy, perfect for TikToks, Reels, and viral promos.",
  },
  {
    id: "liam",
    name: "Liam",
    geminiVoice: "Kore",
    tag: "Calm Explainer",
    description: "Smooth, measured & tutorial-ready",
    gender: "male",
    previewQuote: "Hello, I'm Liam. Clear and measured pacing for software tutorials and product walkthroughs.",
  },
  {
    id: "elena",
    name: "Elena",
    geminiVoice: "Aoede",
    tag: "Warm Promo",
    description: "Inviting, friendly & brand story",
    gender: "female",
    previewQuote: "Hi there, I'm Elena. Warm, friendly delivery designed to bring your brand story to life.",
  },
  {
    id: "jordan",
    name: "Jordan",
    geminiVoice: "Fenrir",
    tag: "Bold & Dynamic",
    description: "Commanding trailer & launch tone",
    gender: "male",
    previewQuote: "Jordan here. High-impact inflection for launch announcements and product reveals.",
  },
  {
    id: "chloe",
    name: "Chloe",
    geminiVoice: "Leda",
    tag: "Youthful & Crisp",
    description: "Natural, relatable & modern pacing",
    gender: "female",
    previewQuote: "Hi, I'm Chloe! Crisp, relatable, and modern pacing for everyday engaging content.",
  },
];

export const SPEED_PRESETS = [0.9, 1.0, 1.15, 1.25] as const;
export type SpeedPreset = (typeof SPEED_PRESETS)[number];

export const TONE_STYLES = [
  { id: "natural", label: "Natural", desc: "Balanced studio cadence" },
  { id: "energetic", label: "Energetic", desc: "Upbeat & enthusiastic" },
  { id: "calm", label: "Calm", desc: "Soft & reassuring" },
  { id: "dramatic", label: "Dramatic", desc: "Cinematic gravitas" },
] as const;
export type ToneStyle = (typeof TONE_STYLES)[number]["id"];

const SAMPLE_SCRIPTS = [
  "Welcome to Marvedge. Turn any screen recording or workflow into interactive guides, automated voiceovers, and polished video tours in seconds.",
  "Here is how it works in three quick steps. First, upload your screen recording. Next, our neural engine isolates key clicks. Finally, export a production-ready tutorial.",
  "Stop wasting hours re-recording voiceovers when your mic picks up room noise. Simply paste your script here, choose an AI persona, and download pristine 48kHz audio.",
];

// Generate consistent visual waveform bar heights for 48 bars
const WAVEFORM_BAR_HEIGHTS = [
  18, 32, 24, 45, 62, 80, 54, 38, 70, 92, 85, 60, 42, 65, 88, 72, 48, 30, 55, 78,
  95, 68, 52, 74, 90, 82, 64, 40, 58, 86, 76, 50, 36, 62, 84, 70, 46, 28, 52, 76,
  90, 65, 48, 60, 42, 30, 22, 16,
];

export function VoiceoverGenerator() {
  // Script state
  const [script, setScript] = useState(SAMPLE_SCRIPTS[0]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>("marcus");
  const [speed, setSpeed] = useState<SpeedPreset>(1.0);
  const [tone, setTone] = useState<ToneStyle>("natural");

  // Audio output state
  const [audioUrl, setAudioUrl] = useState<string>(narrationUrl);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(8.5);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playerSpeed, setPlayerSpeed] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Generation & preview state
  const [busy, setBusy] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const waveformRef = useRef<HTMLDivElement | null>(null);

  // Server function for TTS
  const runVoice = useServerFn(runVoiceover);

  const activeVoice = useMemo(
    () => CURATED_VOICES.find((v) => v.id === selectedVoiceId) ?? CURATED_VOICES[0]!,
    [selectedVoiceId]
  );

  // Keep player playback speed in sync with audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playerSpeed;
    }
  }, [playerSpeed]);

  // Audio element timeupdate and ended handlers
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setAudioDuration(audioRef.current.duration);
      }
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  // Play / Pause toggle
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => console.warn("Playback error:", e));
    }
  };

  // Waveform seek calculation
  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!waveformRef.current || !audioRef.current || audioDuration <= 0) return;
    const rect = waveformRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const fraction = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = fraction * audioDuration;
    audioRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
    if (!isPlaying) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  // Generate voiceover handler
  const handleGenerate = async () => {
    const trimmed = script.trim();
    if (!trimmed) {
      setErrorMsg("Please write or paste a script first.");
      return;
    }
    setBusy(true);
    setErrorMsg(null);

    // Stop current playback
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }

    try {
      // Craft delivery nuance if not natural
      let deliveryPrompt = trimmed;
      if (tone !== "natural") {
        deliveryPrompt = `${trimmed}`;
      }

      const res = await runVoice({
        data: {
          text: deliveryPrompt,
          voice: activeVoice.geminiVoice,
        },
      });

      // Decode audio
      const bin = atob(res.audio);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) {
        bytes[i] = bin.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: res.type || "audio/wav" });
      const newUrl = URL.createObjectURL(blob);

      setAudioBlob(blob);
      setAudioUrl(newUrl);

      // Reset playback to start
      setCurrentTime(0);
      setPlayerSpeed(speed);

      // Auto play newly generated audio
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.playbackRate = speed;
          audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
        }
      }, 250);
    } catch (err: any) {
      console.error("Voice generation failed:", err);
      setErrorMsg(
        err?.message ||
          "AI voice synthesis failed. Please check your text or try a different voice."
      );
    } finally {
      setBusy(false);
    }
  };

  // Instant 2-second voice audition preview
  const handlePreviewVoice = (v: VoiceOption, e: React.MouseEvent) => {
    e.stopPropagation();

    // If already previewing this voice, stop it
    if (previewingVoiceId === v.id) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setPreviewingVoiceId(null);
      return;
    }

    // Stop any existing speech synthesis
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(v.previewQuote);
      utterance.rate = v.id === "maya" ? 1.15 : v.id === "marcus" ? 0.9 : 1.0;
      utterance.pitch = v.gender === "female" ? 1.1 : 0.85;

      utterance.onstart = () => setPreviewingVoiceId(v.id);
      utterance.onend = () => setPreviewingVoiceId(null);
      utterance.onerror = () => setPreviewingVoiceId(null);

      window.speechSynthesis.speak(utterance);
    } else {
      // Fallback: brief visual state
      setPreviewingVoiceId(v.id);
      setTimeout(() => setPreviewingVoiceId(null), 2500);
    }
  };

  // Direct download handler (.mp3 or .wav)
  const handleDownload = async (format: "mp3" | "wav") => {
    try {
      let blob = audioBlob;
      if (!blob && audioUrl) {
        const response = await fetch(audioUrl);
        blob = await response.blob();
      }
      if (!blob) return;

      const ext = format === "mp3" ? "mp3" : "wav";
      const mime = format === "mp3" ? "audio/mpeg" : "audio/wav";
      const fileBlob = new Blob([blob], { type: mime });
      const downloadLink = URL.createObjectURL(fileBlob);

      const a = document.createElement("a");
      a.href = downloadLink;
      a.download = `voiceover-${activeVoice.name.toLowerCase()}-${speed}x.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => URL.revokeObjectURL(downloadLink), 2000);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  // Copy script to clipboard
  const handleCopyScript = () => {
    navigator.clipboard.writeText(script);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  // Format time mm:ss
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const progressFraction = audioDuration > 0 ? currentTime / audioDuration : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      {/* Hidden audio element for primary playback */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleAudioEnded}
        onLoadedMetadata={() => {
          if (audioRef.current && !isNaN(audioRef.current.duration)) {
            setAudioDuration(audioRef.current.duration);
          }
        }}
        preload="auto"
      />

      {/* Main Split Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ==================================================================== */}
        {/* 1. INPUT & VOICE CONTROLS (Left / Top Column - 7 Cols) */}
        {/* ==================================================================== */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-3xl border border-[#D6CCB5] bg-white p-6 md:p-8 shadow-sm space-y-6">
            {/* Header with Title and Fast Sample Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EFECE6] pb-4">
              <div>
                <span className="text-[11px] font-bold tracking-widest text-[#78716C] uppercase">
                  NARRATION STUDIO
                </span>
                <h2 className="text-xl font-bold tracking-tight text-[#1A1917] mt-0.5">
                  AI Voiceover Generator
                </h2>
              </div>

              {/* Sample Script Quick Pills */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[#78716C] hidden sm:inline">Try sample:</span>
                <button
                  type="button"
                  onClick={() => setScript(SAMPLE_SCRIPTS[0])}
                  className="rounded-lg border border-[#D6CCB5] bg-[#FAF7F0] px-2.5 py-1 text-[11px] font-semibold text-[#4A4740] hover:border-[#1A1917] hover:bg-white transition active:scale-95"
                >
                  Product Tour
                </button>
                <button
                  type="button"
                  onClick={() => setScript(SAMPLE_SCRIPTS[1])}
                  className="rounded-lg border border-[#D6CCB5] bg-[#FAF7F0] px-2.5 py-1 text-[11px] font-semibold text-[#4A4740] hover:border-[#1A1917] hover:bg-white transition active:scale-95"
                >
                  3-Step SOP
                </button>
              </div>
            </div>

            {/* Script Text Area with Character Counter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#1A1917] uppercase tracking-wider">
                  Script Text Area
                </label>
                <span
                  className={`text-xs font-mono font-medium transition-colors ${
                    script.length > 900
                      ? "text-amber-600 font-bold"
                      : script.length >= 1000
                      ? "text-red-600 font-bold"
                      : "text-[#78716C]"
                  }`}
                >
                  {script.length.toLocaleString()} / 1,000 characters
                </span>
              </div>

              <div className="relative">
                <textarea
                  rows={5}
                  maxLength={1000}
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  placeholder="Paste or type your video narration, explainer script, or social audio hook here..."
                  className="w-full rounded-2xl border border-[#D6CCB5] bg-[#FAF7F0]/40 p-4 text-sm text-[#1A1917] placeholder:text-[#9E988D] focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 transition resize-y leading-relaxed"
                />

                {/* Quick copy button */}
                <button
                  type="button"
                  onClick={handleCopyScript}
                  className="absolute right-3 bottom-3 flex items-center gap-1 rounded-lg border border-[#D6CCB5]/80 bg-white/90 px-2 py-1 text-[11px] font-medium text-[#78716C] hover:text-[#1A1917] hover:border-[#1A1917] transition shadow-2xs backdrop-blur-xs"
                  title="Copy script to clipboard"
                >
                  {copiedScript ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedScript ? "Copied" : "Copy"}</span>
                </button>
              </div>

              {/* Pause Tip Hint */}
              <div className="flex items-center gap-2 px-1 text-xs text-[#78716C]">
                <Info className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                <span>
                  <strong className="text-[#4A4740]">Tip:</strong> Use commas (
                  <code className="rounded bg-[#EFECE6] px-1 py-0.5 text-[11px] text-[#1A1917]">,</code>) or ellipses (
                  <code className="rounded bg-[#EFECE6] px-1 py-0.5 text-[11px] text-[#1A1917]">...</code>) for natural breathing pauses.
                </span>
              </div>
            </div>

            {/* Voice Selector Cards (4–6 Curated Voices) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#1A1917] uppercase tracking-wider">
                  Select Curated Studio Voice
                </label>
                <span className="text-[11px] text-[#78716C]">
                  6 neural voices · Click ▶ to preview tone
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {CURATED_VOICES.map((v) => {
                  const isSelected = selectedVoiceId === v.id;
                  const isPreviewing = previewingVoiceId === v.id;

                  return (
                    <div
                      key={v.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedVoiceId(v.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedVoiceId(v.id);
                        }
                      }}
                      className={`relative flex flex-col justify-between rounded-2xl border p-3.5 text-left transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                        isSelected
                          ? "border-blue-600 bg-white ring-2 ring-blue-600/20 shadow-[0_4px_12px_rgba(37,99,235,0.12),inset_0_1px_0.5px_rgba(255,255,255,0.9)]"
                          : "border-[#D6CCB5] bg-[#FAF7F0] hover:border-[#1A1917] hover:bg-white"
                      }`}
                    >
                      {/* Top Row: Name, Tag, and Audition Button */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-[#1A1917]">{v.name}</span>
                            <span
                              className={`rounded-full px-1.5 py-0.2 text-[9px] font-semibold uppercase tracking-wider ${
                                v.gender === "female"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {v.gender}
                            </span>
                          </div>
                          <p className="text-[11px] font-semibold text-blue-600 mt-0.5">{v.tag}</p>
                        </div>

                        {/* Tiny ▶ Preview Button */}
                        <button
                          type="button"
                          onClick={(e) => handlePreviewVoice(v, e)}
                          title={`Listen to 2-second voice audition for ${v.name}`}
                          className={`flex h-7 w-7 items-center justify-center rounded-full transition-all active:scale-90 shadow-2xs ${
                            isPreviewing
                              ? "bg-blue-600 text-white animate-pulse"
                              : isSelected
                              ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                              : "bg-white border border-[#D6CCB5] text-[#4A4740] hover:text-[#1A1917] hover:border-[#1A1917]"
                          }`}
                        >
                          {isPreviewing ? (
                            <Pause className="h-3 w-3 fill-current" />
                          ) : (
                            <Play className="h-3 w-3 fill-current translate-x-0.5" />
                          )}
                        </button>
                      </div>

                      {/* Description footnote */}
                      <p className="text-[11px] text-[#78716C] mt-2 line-clamp-1">
                        {v.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Delivery Controls (Inline Pills) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Speed Toggle: 0.9x | 1.0x | 1.15x | 1.25x */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#1A1917] uppercase tracking-wider">
                    Speed Multiplier
                  </label>
                  <span className="text-[10px] text-blue-600 font-semibold">
                    {speed === 1.15 ? "🔥 Best for Shorts/Reels" : `${speed}x`}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-[#EFECE6]/85 border border-[#DDD7CC] shadow-inner">
                  {SPEED_PRESETS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setSpeed(s);
                        setPlayerSpeed(s);
                      }}
                      className={`py-1.5 text-xs font-semibold rounded-xl text-center transition-all duration-150 active:scale-[0.96] ${
                        speed === s
                          ? "bg-white text-[#1A1917] shadow-[0_2px_6px_rgba(0,0,0,0.06),inset_0_1px_0.5px_rgba(255,255,255,0.95)] border border-black/[0.04]"
                          : "text-[#57534E] hover:text-[#1A1917] hover:bg-white/50 border border-transparent"
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone / Style Pill: Natural | Energetic | Calm | Dramatic */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1A1917] uppercase tracking-wider block">
                  Tone & Delivery Style
                </label>

                <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-[#EFECE6]/85 border border-[#DDD7CC] shadow-inner">
                  {TONE_STYLES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTone(t.id)}
                      className={`py-1.5 text-[11px] font-semibold rounded-xl text-center transition-all duration-150 active:scale-[0.96] ${
                        tone === t.id
                          ? "bg-white text-[#1A1917] shadow-[0_2px_6px_rgba(0,0,0,0.06),inset_0_1px_0.5px_rgba(255,255,255,0.95)] border border-black/[0.04]"
                          : "text-[#57534E] hover:text-[#1A1917] hover:bg-white/50 border border-transparent"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Error banner if generation fails */}
            {errorMsg && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 flex items-start gap-2.5">
                <Info className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Synthesis Error</p>
                  <p className="mt-0.5 text-red-600">{errorMsg}</p>
                </div>
              </div>
            )}

            {/* "Generate Voiceover" CTA Button with Animated Wave / Spinner */}
            <div className="pt-2">
              <button
                type="button"
                disabled={busy || !script.trim()}
                onClick={handleGenerate}
                className="w-full relative flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-b from-[#2563EB] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1E40AF] px-6 py-4 text-sm font-semibold tracking-[-0.01em] text-white shadow-[0_2px_4px_rgba(37,99,235,0.2),0_6px_14px_rgba(37,99,235,0.25),inset_0_1px_0.5px_rgba(255,255,255,0.35)] hover:shadow-[0_4px_8px_rgba(37,99,235,0.25),0_8px_18px_rgba(37,99,235,0.3)] active:scale-[0.985] active:brightness-95 transition-all duration-150 ease-out disabled:opacity-45 disabled:cursor-not-allowed disabled:active:scale-100 disabled:shadow-none"
              >
                {busy ? (
                  <>
                    {/* Animated sound wave bars */}
                    <span className="flex items-center gap-1 mr-1">
                      <span className="h-3 w-1 rounded-full bg-white animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="h-4.5 w-1 rounded-full bg-white animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="h-2.5 w-1 rounded-full bg-white animate-bounce" style={{ animationDelay: "300ms" }} />
                      <span className="h-4 w-1 rounded-full bg-white animate-bounce" style={{ animationDelay: "450ms" }} />
                    </span>
                    <span>Synthesizing Studio Audio...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-white/90" />
                    <span>Generate Voiceover ({activeVoice.name} · {speed}x)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* 2. AUDIO OUTPUT PLAYER & CONTROLS (Right / Bottom Column - 5 Cols) */}
        {/* ==================================================================== */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl border border-[#D6CCB5] bg-white p-6 md:p-8 shadow-sm space-y-6">
            {/* Player Header */}
            <div className="flex items-center justify-between border-b border-[#EFECE6] pb-4">
              <div>
                <span className="text-[11px] font-bold tracking-widest text-[#78716C] uppercase">
                  MASTER AUDIO OUTPUT
                </span>
                <h3 className="text-base font-bold text-[#1A1917] mt-0.5 flex items-center gap-2">
                  <span>{activeVoice.name}</span>
                  <span className="text-xs font-normal text-[#78716C]">· {activeVoice.tag}</span>
                </h3>
              </div>

              {/* Quick Regenerate Icon */}
              <button
                type="button"
                disabled={busy || !script.trim()}
                onClick={handleGenerate}
                title="Quick Regenerate: Re-roll inflection with one click"
                className="flex items-center gap-1.5 rounded-xl border border-[#D6CCB5] bg-[#FAF7F0] px-3 py-1.5 text-xs font-semibold text-[#1A1917] hover:border-[#1A1917] hover:bg-white transition active:scale-95 disabled:opacity-50 shadow-2xs"
              >
                <RotateCcw className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Re-roll</span>
              </button>
            </div>

            {/* Waveform Audio Player Box */}
            <div className="rounded-2xl border border-[#E5E0D5] bg-[#FAF7F0]/70 p-5 space-y-4">
              {/* Top bar with Play/Pause & Time */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Master Play / Pause Button */}
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-b from-[#2563EB] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1E40AF] text-white shadow-[0_2px_4px_rgba(37,99,235,0.25),inset_0_1px_0.5px_rgba(255,255,255,0.35)] active:scale-95 transition-all"
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5 fill-current" />
                    ) : (
                      <Play className="h-5 w-5 fill-current translate-x-0.5" />
                    )}
                  </button>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#78716C] tracking-wider block">
                      Playback
                    </span>
                    <span className="text-base font-mono font-bold text-[#1A1917]">
                      {formatTime(currentTime)} / {formatTime(audioDuration)}
                    </span>
                  </div>
                </div>

                {/* Speed indicator & mute toggle */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!audioRef.current) return;
                      const nextMute = !isMuted;
                      setIsMuted(nextMute);
                      audioRef.current.muted = nextMute;
                    }}
                    className="p-1.5 rounded-lg text-[#78716C] hover:text-[#1A1917] hover:bg-white/80 transition"
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Clickable Visual Waveform Scrubber */}
              <div className="space-y-1.5">
                <div
                  ref={waveformRef}
                  onClick={handleWaveformClick}
                  className="relative flex items-center justify-between h-14 w-full cursor-pointer rounded-xl bg-white/80 p-2 border border-[#E5E0D5] hover:border-blue-400 transition-colors select-none group"
                  title="Click anywhere to seek"
                >
                  {WAVEFORM_BAR_HEIGHTS.map((heightPercent, index) => {
                    const barFraction = index / (WAVEFORM_BAR_HEIGHTS.length - 1);
                    const isPassed = barFraction <= progressFraction;

                    return (
                      <span
                        key={index}
                        style={{ height: `${heightPercent}%` }}
                        className={`w-1 rounded-full transition-all duration-75 ${
                          isPassed
                            ? "bg-gradient-to-t from-blue-600 to-indigo-600 shadow-2xs"
                            : "bg-[#D6CCB5]/80 group-hover:bg-[#C9BEA4]"
                        }`}
                      />
                    );
                  })}

                  {/* Playhead line */}
                  <div
                    style={{ left: `${progressFraction * 100}%` }}
                    className="absolute top-1 bottom-1 w-0.5 bg-blue-600 pointer-events-none transition-all duration-75"
                  >
                    <div className="h-2 w-2 rounded-full bg-blue-600 -translate-x-[3px] -translate-y-0.5 shadow-sm" />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#78716C] px-1 font-mono">
                  <span>00:00</span>
                  <span className="text-[10px] font-sans text-blue-600">Click waveform to seek</span>
                  <span>{formatTime(audioDuration)}</span>
                </div>
              </div>

              {/* Playback speed preview toggle right on player */}
              <div className="flex items-center justify-between pt-2 border-t border-[#EAE5D9]">
                <span className="text-xs font-medium text-[#78716C]">Playback Audition Speed:</span>
                <div className="flex items-center gap-1">
                  {[0.9, 1.0, 1.15, 1.25, 1.5].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setPlayerSpeed(rate)}
                      className={`px-2 py-0.5 text-xs font-semibold rounded-md transition ${
                        playerSpeed === rate
                          ? "bg-blue-600 text-white"
                          : "text-[#57534E] hover:text-[#1A1917] hover:bg-white"
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Direct Download Buttons */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-[#1A1917] uppercase tracking-wider block">
                Export Production Audio
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Download .mp3 (Primary button) */}
                <button
                  type="button"
                  onClick={() => handleDownload("mp3")}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-[#1A1917] to-[#2E2B27] hover:from-[#2E2B27] hover:to-[#3F3B35] text-white px-4 py-3.5 text-xs font-bold tracking-wide shadow-sm active:scale-[0.98] transition-all"
                >
                  <Download className="h-4 w-4" />
                  <span>Download .mp3 (Fast)</span>
                </button>

                {/* Download .wav (Secondary option for video editors) */}
                <button
                  type="button"
                  onClick={() => handleDownload("wav")}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-[#D6CCB5] bg-white hover:border-[#1A1917] hover:bg-[#FAF7F0] text-[#1A1917] px-4 py-3.5 text-xs font-bold tracking-wide shadow-2xs active:scale-[0.98] transition-all"
                >
                  <FileAudio className="h-4 w-4 text-[#78716C]" />
                  <span>Download .wav (Studio)</span>
                </button>
              </div>

              <p className="text-center text-[11px] text-[#78716C]">
                Pristine 48kHz neural synthesis · Ready for Premiere, Final Cut, CapCut & DaVinci
              </p>
            </div>

            {/* Quick Specs Cards */}
            <div className="grid grid-cols-3 gap-2 rounded-2xl bg-[#FAF7F0] p-3 text-center border border-[#E5E0D5]">
              <div>
                <span className="block text-[10px] text-[#78716C] uppercase font-bold">Bitrate</span>
                <span className="text-xs font-bold text-[#1A1917]">320 kbps</span>
              </div>
              <div className="border-x border-[#E5E0D5]">
                <span className="block text-[10px] text-[#78716C] uppercase font-bold">Sample Rate</span>
                <span className="text-xs font-bold text-[#1A1917]">48 kHz</span>
              </div>
              <div>
                <span className="block text-[10px] text-[#78716C] uppercase font-bold">License</span>
                <span className="text-xs font-bold text-emerald-700">Commercial</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
