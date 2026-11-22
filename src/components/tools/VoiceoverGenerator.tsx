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

export type VoiceGender = "male" | "female";
export type VoiceAge = "youth" | "young_adult" | "mature" | "senior";
export type AccentCode = "us" | "uk" | "au" | "in" | "es";

export interface VoiceOption {
  id: string;
  name: string;
  geminiVoice: string;
  tag: string;
  description: string;
  gender: VoiceGender;
  age: VoiceAge;
  ageLabel: string;
  accent: AccentCode;
  accentLabel: string;
  flag: string;
  langCode: string;
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
    age: "mature",
    ageLabel: "Mature · 40s",
    accent: "us",
    accentLabel: "American",
    flag: "🇺🇸",
    langCode: "en-US",
    previewQuote: "I'm Marcus. Deep, authoritative narration built for documentaries and long-form stories.",
  },
  {
    id: "maya",
    name: "Maya",
    geminiVoice: "Puck",
    tag: "Energetic Shorts",
    description: "Punchy, fast-paced & vibrant",
    gender: "female",
    age: "young_adult",
    ageLabel: "Young Adult · 20s",
    accent: "us",
    accentLabel: "American",
    flag: "🇺🇸",
    langCode: "en-US",
    previewQuote: "Hey, I'm Maya! Upbeat and high-energy, perfect for TikToks, Reels, and viral promos.",
  },
  {
    id: "liam",
    name: "Liam",
    geminiVoice: "Kore",
    tag: "Calm Explainer",
    description: "Refined, measured British tutorial pacing",
    gender: "male",
    age: "young_adult",
    ageLabel: "Young Adult · 30s",
    accent: "uk",
    accentLabel: "British",
    flag: "🇬🇧",
    langCode: "en-GB",
    previewQuote: "Hello, I'm Liam. Clear and measured British pacing for software tutorials and product walkthroughs.",
  },
  {
    id: "elena",
    name: "Elena",
    geminiVoice: "Aoede",
    tag: "Warm Promo",
    description: "Inviting, friendly & brand story",
    gender: "female",
    age: "mature",
    ageLabel: "Mature · 30s",
    accent: "us",
    accentLabel: "American",
    flag: "🇺🇸",
    langCode: "en-US",
    previewQuote: "Hi there, I'm Elena. Warm, friendly delivery designed to bring your brand story to life.",
  },
  {
    id: "oliver",
    name: "Oliver",
    geminiVoice: "Charon",
    tag: "Distinguished British",
    description: "Sophisticated, classical & wise",
    gender: "male",
    age: "senior",
    ageLabel: "Senior · 50s+",
    accent: "uk",
    accentLabel: "British",
    flag: "🇬🇧",
    langCode: "en-GB",
    previewQuote: "Good day, I'm Oliver. A distinguished British cadence for heritage and classical narratives.",
  },
  {
    id: "aria",
    name: "Aria",
    geminiVoice: "Leda",
    tag: "Upbeat Australian",
    description: "Crisp, sunny & modern Aussie vibe",
    gender: "female",
    age: "youth",
    ageLabel: "Youth · 20s",
    accent: "au",
    accentLabel: "Australian",
    flag: "🇦🇺",
    langCode: "en-AU",
    previewQuote: "G'day, I'm Aria! Sunny, crisp Australian energy for modern podcasts and dynamic ads.",
  },
  {
    id: "rohan",
    name: "Rohan",
    geminiVoice: "Fenrir",
    tag: "Tech & Global",
    description: "Clear, dynamic tech explainer voice",
    gender: "male",
    age: "young_adult",
    ageLabel: "Young Adult · 20s",
    accent: "in",
    accentLabel: "Indian",
    flag: "🇮🇳",
    langCode: "en-IN",
    previewQuote: "Namaste, I'm Rohan. Clear, articulate Indian English for tech demos and global corporate explainers.",
  },
  {
    id: "sofia",
    name: "Sofia",
    geminiVoice: "Aoede",
    tag: "Warm Spanish / Global",
    description: "Smooth, expressive & international",
    gender: "female",
    age: "young_adult",
    ageLabel: "Young Adult · 20s",
    accent: "es",
    accentLabel: "Spanish",
    flag: "🇪🇸",
    langCode: "es-ES",
    previewQuote: "Hola, soy Sofia. Smooth, expressive delivery with warm Spanish inflection for global audiences.",
  },
  {
    id: "jordan",
    name: "Jordan",
    geminiVoice: "Fenrir",
    tag: "Bold & Dynamic",
    description: "Commanding trailer & launch tone",
    gender: "male",
    age: "mature",
    ageLabel: "Mature · 30s",
    accent: "us",
    accentLabel: "American",
    flag: "🇺🇸",
    langCode: "en-US",
    previewQuote: "Jordan here. High-impact inflection for launch announcements and product reveals.",
  },
  {
    id: "chloe",
    name: "Chloe",
    geminiVoice: "Leda",
    tag: "Youthful & Crisp",
    description: "Natural, relatable & social-first",
    gender: "female",
    age: "youth",
    ageLabel: "Youth · 18–24",
    accent: "us",
    accentLabel: "American",
    flag: "🇺🇸",
    langCode: "en-US",
    previewQuote: "Hi, I'm Chloe! Crisp, relatable, and modern pacing for everyday engaging social content.",
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

  // Filter states: Gender, Age & Accent
  const [genderFilter, setGenderFilter] = useState<"all" | VoiceGender>("all");
  const [ageFilter, setAgeFilter] = useState<"all" | VoiceAge>("all");
  const [accentFilter, setAccentFilter] = useState<"all" | AccentCode>("all");

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

  // Filtered voice roster based on gender, age, and accent
  const filteredVoices = useMemo(() => {
    return CURATED_VOICES.filter((v) => {
      if (genderFilter !== "all" && v.gender !== genderFilter) return false;
      if (ageFilter !== "all" && v.age !== ageFilter) return false;
      if (accentFilter !== "all" && v.accent !== accentFilter) return false;
      return true;
    });
  }, [genderFilter, ageFilter, accentFilter]);

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

  // Instant 2-second voice audition preview with regional accent
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
      utterance.lang = v.langCode;
      utterance.rate =
        v.id === "maya" || v.id === "aria" || v.id === "chloe" ? 1.08 :
        v.id === "marcus" || v.id === "oliver" ? 0.92 : 1.0;
      utterance.pitch =
        v.gender === "female"
          ? (v.age === "youth" ? 1.15 : 1.05)
          : (v.age === "senior" ? 0.82 : v.age === "mature" ? 0.88 : 0.95);

      if (typeof window.speechSynthesis.getVoices === "function") {
        const voices = window.speechSynthesis.getVoices();
        const matched = voices.find((sv) =>
          sv.lang.toLowerCase().replace("_", "-") === v.langCode.toLowerCase()
        ) || voices.find((sv) =>
          sv.lang.toLowerCase().startsWith(v.langCode.slice(0, 2).toLowerCase())
        );
        if (matched) {
          utterance.voice = matched;
        }
      }

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
          <div className="rounded-3xl border border-black/[0.08] bg-white p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-6">
            {/* Header with Title and Fast Sample Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] pb-4">
              <div>
                <span className="text-[11px] font-semibold tracking-widest text-[#86868B] uppercase">
                  NARRATION STUDIO
                </span>
                <h2 className="text-xl font-semibold tracking-tight text-[#1D1D1F] mt-0.5">
                  AI Voiceover Generator
                </h2>
              </div>

              {/* Sample Script Quick Pills */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[#86868B] hidden sm:inline">Try sample:</span>
                <button
                  type="button"
                  onClick={() => setScript(SAMPLE_SCRIPTS[0])}
                  className="rounded-lg border border-black/[0.08] bg-black/[0.02] px-2.5 py-1 text-[11px] font-medium text-[#1D1D1F] hover:bg-black/[0.06] transition active:scale-95"
                >
                  Product Tour
                </button>
                <button
                  type="button"
                  onClick={() => setScript(SAMPLE_SCRIPTS[1])}
                  className="rounded-lg border border-black/[0.08] bg-black/[0.02] px-2.5 py-1 text-[11px] font-medium text-[#1D1D1F] hover:bg-black/[0.06] transition active:scale-95"
                >
                  3-Step SOP
                </button>
              </div>
            </div>

            {/* Script Text Area with Character Counter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">
                  Script Text Area
                </label>
                <span
                  className={`text-xs font-mono font-medium transition-colors ${
                    script.length > 900
                      ? "text-amber-600 font-bold"
                      : script.length >= 1000
                      ? "text-red-600 font-bold"
                      : "text-[#86868B]"
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
                  className="w-full rounded-2xl border border-black/[0.08] bg-black/[0.015] p-4 text-sm text-[#1D1D1F] placeholder:text-[#86868B]/60 focus:border-[#0071E3] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 transition resize-y leading-relaxed"
                />

                {/* Quick copy button */}
                <button
                  type="button"
                  onClick={handleCopyScript}
                  className="absolute right-3 bottom-3 flex items-center gap-1 rounded-lg border border-black/[0.08] bg-white/90 px-2 py-1 text-[11px] font-medium text-[#86868B] hover:text-[#1D1D1F] hover:border-black/[0.2] transition shadow-2xs backdrop-blur-xs"
                  title="Copy script to clipboard"
                >
                  {copiedScript ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedScript ? "Copied" : "Copy"}</span>
                </button>
              </div>

              {/* Pause Tip Hint */}
              <div className="flex items-center gap-2 px-1 text-xs text-[#86868B]">
                <Info className="h-3.5 w-3.5 text-[#0071E3] shrink-0" />
                <span>
                  <strong className="text-[#1D1D1F]">Tip:</strong> Use commas (
                  <code className="rounded bg-black/[0.04] px-1 py-0.5 text-[11px] text-[#1D1D1F]">,</code>) or ellipses (
                  <code className="rounded bg-black/[0.04] px-1 py-0.5 text-[11px] text-[#1D1D1F]">...</code>) for natural breathing pauses.
                </span>
              </div>
            </div>

            {/* Voice Selector Cards with Accent, Gender & Age Controls (Apple HIG) */}
            <div className="space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">
                  Curated Studio Voices ({filteredVoices.length})
                </label>
                <span className="text-[11px] text-[#86868B]">
                  Filter by accent, gender & age · Tap ▶ to audition
                </span>
              </div>

              {/* Apple-style Filter Toolbar */}
              <div className="space-y-2 rounded-2xl bg-black/[0.02] border border-black/[0.05] p-2.5">
                {/* Row 1: Gender & Age Segmented Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {/* Gender Filter */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-[#86868B]">Gender:</span>
                    <div className="flex p-0.5 rounded-lg bg-black/[0.04] border border-black/[0.04]">
                      {(["all", "male", "female"] as const).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGenderFilter(g)}
                          className={`px-2.5 py-1 text-[11px] font-medium rounded-md capitalize transition-all active:scale-95 ${
                            genderFilter === g
                              ? "bg-white text-[#1D1D1F] shadow-xs font-semibold"
                              : "text-[#86868B] hover:text-[#1D1D1F]"
                          }`}
                        >
                          {g === "all" ? "All" : g}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Age Filter */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-[#86868B]">Age:</span>
                    <div className="flex p-0.5 rounded-lg bg-black/[0.04] border border-black/[0.04]">
                      {[
                        { id: "all", label: "All Ages" },
                        { id: "youth", label: "Youth (18–24)" },
                        { id: "young_adult", label: "25–35" },
                        { id: "mature", label: "36–50" },
                        { id: "senior", label: "50s+" },
                      ].map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => setAgeFilter(a.id as any)}
                          className={`px-2 py-1 text-[11px] font-medium rounded-md transition-all active:scale-95 ${
                            ageFilter === a.id
                              ? "bg-white text-[#1D1D1F] shadow-xs font-semibold"
                              : "text-[#86868B] hover:text-[#1D1D1F]"
                          }`}
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Row 2: Accent / Regional Language Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 scrollbar-none border-t border-black/[0.04]">
                  <span className="text-[11px] font-semibold text-[#86868B] shrink-0 mr-0.5">Accent:</span>
                  {[
                    { id: "all", label: "All Accents", flag: "🌐" },
                    { id: "us", label: "American", flag: "🇺🇸" },
                    { id: "uk", label: "British", flag: "🇬🇧" },
                    { id: "au", label: "Australian", flag: "🇦🇺" },
                    { id: "in", label: "Indian", flag: "🇮🇳" },
                    { id: "es", label: "Spanish", flag: "🇪🇸" },
                  ].map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setAccentFilter(acc.id as any)}
                      className={`flex items-center gap-1 shrink-0 px-2.5 py-1 text-[11px] font-medium rounded-full transition-all active:scale-95 ${
                        accentFilter === acc.id
                          ? "bg-[#0071E3] text-white shadow-2xs font-semibold"
                          : "bg-white text-[#555] hover:bg-black/[0.04] hover:text-[#1D1D1F] border border-black/[0.06]"
                      }`}
                    >
                      <span className="text-xs">{acc.flag}</span>
                      <span>{acc.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid of Filtered Voices */}
              {filteredVoices.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-black/[0.1] bg-black/[0.015] p-6 text-center space-y-2">
                  <p className="text-xs font-medium text-[#86868B]">
                    No voices match the selected combination of gender, age, and accent.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setGenderFilter("all");
                      setAgeFilter("all");
                      setAccentFilter("all");
                    }}
                    className="text-xs font-semibold text-[#0071E3] hover:underline"
                  >
                    Reset all filters →
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {filteredVoices.map((v) => {
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
                        className={`group relative flex flex-col justify-between rounded-2xl border p-3.5 text-left transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                          isSelected
                            ? "border-[#0071E3] bg-[#0071E3]/[0.03] shadow-[0_2px_12px_rgba(0,113,227,0.12),inset_0_1px_0.5px_rgba(255,255,255,0.9)] ring-1 ring-[#0071E3]"
                            : "border-black/[0.08] bg-white hover:border-black/[0.18] hover:shadow-xs"
                        }`}
                      >
                        {/* Top Row: Name, Accent Flag & Audition Button */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-semibold tracking-tight text-[#1D1D1F]">
                                {v.name}
                              </span>
                              <span className="text-[10px] font-medium text-[#555] bg-black/[0.04] px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                <span>{v.flag}</span>
                                <span>{v.accentLabel}</span>
                              </span>
                            </div>

                            {/* Gender & Age Subtitle */}
                            <div className="flex items-center gap-1 mt-1 text-[10px] text-[#86868B] font-medium">
                              <span className="capitalize">{v.gender}</span>
                              <span>·</span>
                              <span>{v.ageLabel}</span>
                            </div>

                            <p className="text-xs font-medium text-[#0071E3] mt-0.5">
                              {v.tag}
                            </p>
                          </div>

                          {/* Apple-style circular preview button */}
                          <button
                            type="button"
                            onClick={(e) => handlePreviewVoice(v, e)}
                            title={`Audition voice sample for ${v.name} (${v.accentLabel})`}
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all active:scale-90 ${
                              isPreviewing
                                ? "bg-[#0071E3] text-white shadow-sm animate-pulse"
                                : isSelected
                                ? "bg-[#0071E3]/10 text-[#0071E3] hover:bg-[#0071E3]/20"
                                : "bg-black/[0.04] text-[#1D1D1F] hover:bg-black/[0.08]"
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
                        <p className="text-[11px] text-[#86868B] mt-2 line-clamp-1">
                          {v.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Delivery Controls (Apple Segmented Controls) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Speed Multiplier */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">
                    Speed Multiplier
                  </label>
                  <span className="text-[10px] text-[#0071E3] font-semibold">
                    {speed === 1.15 ? "Best for Shorts / Reels" : `${speed}x`}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-black/[0.04] border border-black/[0.04]">
                  {SPEED_PRESETS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setSpeed(s);
                        setPlayerSpeed(s);
                      }}
                      className={`py-1.5 text-xs font-medium rounded-lg text-center transition-all duration-150 active:scale-[0.96] ${
                        speed === s
                          ? "bg-white text-[#1D1D1F] shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_1px_rgba(0,0,0,0.04)] font-semibold"
                          : "text-[#86868B] hover:text-[#1D1D1F] hover:bg-white/50"
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone & Delivery Style */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider block">
                  Tone & Delivery Style
                </label>

                <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-black/[0.04] border border-black/[0.04]">
                  {TONE_STYLES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTone(t.id)}
                      className={`py-1.5 text-xs font-medium rounded-lg text-center transition-all duration-150 active:scale-[0.96] ${
                        tone === t.id
                          ? "bg-white text-[#1D1D1F] shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_1px_rgba(0,0,0,0.04)] font-semibold"
                          : "text-[#86868B] hover:text-[#1D1D1F] hover:bg-white/50"
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
          <div className="rounded-3xl border border-black/[0.08] bg-white p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-6">
            {/* Player Header */}
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-4">
              <div>
                <span className="text-[11px] font-semibold tracking-widest text-[#86868B] uppercase">
                  MASTER AUDIO OUTPUT
                </span>
                <h3 className="text-base font-semibold text-[#1D1D1F] mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span>{activeVoice.flag}</span>
                  <span>{activeVoice.name}</span>
                  <span className="text-xs font-normal text-[#86868B]">
                    · {activeVoice.accentLabel} ({activeVoice.gender}, {activeVoice.ageLabel})
                  </span>
                </h3>
              </div>

              {/* Quick Regenerate Button */}
              <button
                type="button"
                disabled={busy || !script.trim()}
                onClick={handleGenerate}
                title="Regenerate voiceover with current voice & speed"
                className="flex items-center gap-1.5 rounded-xl border border-black/[0.08] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#1D1D1F] hover:bg-black/[0.03] transition active:scale-95 disabled:opacity-50 shadow-2xs"
              >
                <RotateCcw className={`h-3.5 w-3.5 ${busy ? "animate-spin text-[#0071E3]" : ""}`} />
                <span>Regenerate Voiceover</span>
              </button>
            </div>

            {/* Waveform Audio Player Box */}
            <div className="rounded-2xl border border-black/[0.06] bg-black/[0.02] p-5 space-y-4">
              {/* Top bar with Play/Pause & Time */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Master Play / Pause Button */}
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white shadow-[0_2px_8px_rgba(0,113,227,0.25),inset_0_1px_0.5px_rgba(255,255,255,0.35)] active:scale-95 transition-all"
                  >
                    {isPlaying ? (
                      <Pause className="h-4.5 w-4.5 fill-current" />
                    ) : (
                      <Play className="h-4.5 w-4.5 fill-current translate-x-0.5" />
                    )}
                  </button>

                  <div>
                    <span className="text-[10px] uppercase font-semibold text-[#86868B] tracking-wider block">
                      Playback
                    </span>
                    <span className="text-sm font-mono font-semibold text-[#1D1D1F]">
                      {formatTime(currentTime)} / {formatTime(audioDuration)}
                    </span>
                  </div>
                </div>

                {/* Speed indicator & mute toggle */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (!audioRef.current) return;
                      const nextMute = !isMuted;
                      setIsMuted(nextMute);
                      audioRef.current.muted = nextMute;
                    }}
                    className="p-1.5 rounded-lg text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.04] transition"
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
                  className="relative flex items-center justify-between h-14 w-full cursor-pointer rounded-xl bg-white p-2 border border-black/[0.06] hover:border-[#0071E3]/50 transition-colors select-none group"
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
                            ? "bg-[#0071E3] shadow-2xs"
                            : "bg-black/[0.08] group-hover:bg-black/[0.14]"
                        }`}
                      />
                    );
                  })}

                  {/* Playhead line */}
                  <div
                    style={{ left: `${progressFraction * 100}%` }}
                    className="absolute top-1 bottom-1 w-0.5 bg-[#0071E3] pointer-events-none transition-all duration-75"
                  >
                    <div className="h-2 w-2 rounded-full bg-[#0071E3] -translate-x-[3px] -translate-y-0.5 shadow-xs" />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#86868B] px-1 font-mono">
                  <span>00:00</span>
                  <span className="text-[10px] font-sans text-[#0071E3]">Click waveform to seek</span>
                  <span>{formatTime(audioDuration)}</span>
                </div>
              </div>

              {/* Playback speed preview toggle right on player */}
              <div className="flex items-center justify-between pt-2 border-t border-black/[0.05]">
                <span className="text-xs font-medium text-[#86868B]">Audition Speed:</span>
                <div className="flex items-center gap-1">
                  {[0.9, 1.0, 1.15, 1.25, 1.5].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setPlayerSpeed(rate)}
                      className={`px-2 py-0.5 text-xs font-medium rounded-md transition ${
                        playerSpeed === rate
                          ? "bg-[#0071E3] text-white"
                          : "text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.04]"
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
              <label className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider block">
                Export Production Audio
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Download .mp3 (Primary button) */}
                <button
                  type="button"
                  onClick={() => handleDownload("mp3")}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#1D1D1F] hover:bg-[#2D2D2F] text-white px-4 py-3 text-xs font-semibold tracking-tight shadow-[0_1px_3px_rgba(0,0,0,0.12),inset_0_1px_0.5px_rgba(255,255,255,0.2)] active:scale-[0.985] transition-all"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download .mp3 · Fast</span>
                </button>

                {/* Download .wav (Secondary option for video editors) */}
                <button
                  type="button"
                  onClick={() => handleDownload("wav")}
                  className="flex items-center justify-center gap-2 rounded-xl border border-black/[0.1] bg-white hover:bg-black/[0.02] text-[#1D1D1F] px-4 py-3 text-xs font-semibold tracking-tight shadow-[0_1px_2px_rgba(0,0,0,0.04)] active:scale-[0.985] transition-all"
                >
                  <FileAudio className="h-3.5 w-3.5 text-[#86868B]" />
                  <span>Download .wav · Studio</span>
                </button>
              </div>

              <p className="text-center text-[11px] text-[#86868B]">
                Pristine 48kHz neural synthesis · Ready for Premiere, Final Cut, CapCut & DaVinci
              </p>
            </div>

            {/* Quick Specs Cards */}
            <div className="grid grid-cols-3 gap-2 rounded-xl bg-black/[0.03] p-3 text-center border border-black/[0.04]">
              <div>
                <span className="block text-[10px] text-[#86868B] uppercase font-semibold">Bitrate</span>
                <span className="text-xs font-semibold text-[#1D1D1F]">320 kbps</span>
              </div>
              <div className="border-x border-black/[0.06]">
                <span className="block text-[10px] text-[#86868B] uppercase font-semibold">Sample Rate</span>
                <span className="text-xs font-semibold text-[#1D1D1F]">48 kHz</span>
              </div>
              <div>
                <span className="block text-[10px] text-[#86868B] uppercase font-semibold">License</span>
                <span className="text-xs font-semibold text-emerald-600">Commercial</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
