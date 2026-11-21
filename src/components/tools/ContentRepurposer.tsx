import { useState, useRef, useEffect } from "react";
import {
  Link2,
  Youtube,
  HardDrive,
  Upload,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Flame,
  Clock,
  Play,
  Pause,
  Copy,
  Check,
  Download,
  RotateCcw,
  Volume2,
  VolumeX,
  FileVideo,
  CheckCircle2,
} from "lucide-react";
import clipUrl from "@/assets/samples/clip.webm";
import screenThumbnail from "@/assets/samples/screen-1.png";

interface ClipItem {
  id: string;
  hookTitle: string;
  viralityScore: number;
  startSec: number;
  endSec: number;
  transcript: string;
  captions: string;
  hashtags: string[];
}

const DEFAULT_CLIPS: ClipItem[] = [
  {
    id: "clip-1",
    hookTitle: "The $0 to $10k Micro-SaaS Playbook Nobody Talks About",
    viralityScore: 96,
    startSec: 194, // 03:14
    endSec: 232,   // 03:52
    transcript:
      "Most founders waste 6 months building in stealth before talking to a single human. Here's how we pre-sold $10,000 in software before writing 1 line of code...",
    captions: "WE PRE-SOLD $10K IN SOFTWARE BEFORE WRITING A SINGLE LINE OF CODE.",
    hashtags: ["#saas", "#startups", "#indiehacker", "#founders", "#buildinpublic"],
  },
  {
    id: "clip-2",
    hookTitle: "Why 90% of Landing Pages Bleed Conversions",
    viralityScore: 91,
    startSec: 452, // 07:32
    endSec: 498,   // 08:18
    transcript:
      "If your hero section takes more than 3 seconds to explain what you do, you lost them. Let me show you the 3-second clarity test...",
    captions: "IF YOUR HERO SECTION TAKES OVER 3 SECONDS, YOU ALREADY LOST THEM.",
    hashtags: ["#webdesign", "#cro", "#growthhacks", "#marketing", "#uiux"],
  },
  {
    id: "clip-3",
    hookTitle: "The Secret Pricing Rule High-Growth Apps Use",
    viralityScore: 88,
    startSec: 680, // 11:20
    endSec: 725,   // 12:05
    transcript:
      "Never price based on your costs; price based on the outcome you unlock. When we bumped our tier from $19 to $79, churn actually dropped by half...",
    captions: "PRICE BASED ON THE OUTCOME YOU UNLOCK — NOT WHAT IT COSTS YOU.",
    hashtags: ["#pricing", "#productledgrowth", "#business", "#solopreneur"],
  },
  {
    id: "clip-4",
    hookTitle: "How to Automate 80% of Customer Support",
    viralityScore: 84,
    startSec: 810, // 13:30
    endSec: 855,   // 14:15
    transcript:
      "We turned 400 support tickets a week into zero manual replies using this simple 3-tier workflow that filters repetitive questions automatically...",
    captions: "ZERO MANUAL REPLIES USING A SMART THREE-TIER WORKFLOW.",
    hashtags: ["#ai", "#automation", "#customersupport", "#nocode", "#productivity"],
  },
];

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function ContentRepurposer() {
  const [viewState, setViewState] = useState<"entry" | "scanning" | "results">("entry");
  const [urlInput, setUrlInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [scanStep, setScanStep] = useState(0);
  const [videoTitle, setVideoTitle] = useState("How to Build a $10K/mo Micro-SaaS Solo (Full Blueprint)");
  const [videoDuration] = useState("14:28");
  const [clips, setClips] = useState<ClipItem[]>(DEFAULT_CLIPS);
  const [selectedClipId, setSelectedClipId] = useState<string>(DEFAULT_CLIPS[0].id);
  const [captionStyle, setCaptionStyle] = useState<"bold-yellow" | "clean-white" | "none">("bold-yellow");
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const activeClip = clips.find((c) => c.id === selectedClipId) || clips[0];

  // Close smart popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Toast auto-clear
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 2500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const showToast = (msg: string) => setToastMessage(msg);

  const handleStartScan = (sourceTitle?: string) => {
    if (sourceTitle) setVideoTitle(sourceTitle);
    setIsFocused(false);
    setViewState("scanning");
    setScanStep(0);

    const steps = [
      "Downloading high-res audio & video streams...",
      "Scanning speech pauses, hooks & emotional spikes...",
      "Auto-framing 9:16 vertical subject tracking...",
      "Synthesizing dynamic word-level subtitles...",
    ];

    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      if (current < steps.length) {
        setScanStep(current);
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setViewState("results");
        }, 500);
      }
    }, 650);
  };

  const handleSourceSelect = (source: string) => {
    setSelectedSource(source);
    if (source === "youtube") {
      const demoUrl = "https://www.youtube.com/watch?v=saas-blueprint-10k";
      setUrlInput(demoUrl);
      setTimeout(() => {
        handleStartScan("How to Build a $10K/mo Micro-SaaS Solo (Full Blueprint)");
      }, 300);
    } else if (source === "drive") {
      const demoUrl = "https://drive.google.com/file/d/1A2b3C4d5E6F7G8/view";
      setUrlInput(demoUrl);
      setTimeout(() => {
        handleStartScan("Q3_Product_Growth_Keynote_Recording.mp4");
      }, 300);
    } else if (source === "upload") {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUrlInput(file.name);
      handleStartScan(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleTrimNudge = (type: "start" | "end", delta: number) => {
    setClips((prev) =>
      prev.map((clip) => {
        if (clip.id !== selectedClipId) return clip;
        if (type === "start") {
          const newStart = Math.max(0, clip.startSec + delta);
          if (newStart >= clip.endSec) return clip;
          return { ...clip, startSec: newStart };
        } else {
          const newEnd = Math.max(clip.startSec + 2, clip.endSec + delta);
          return { ...clip, endSec: newEnd };
        }
      })
    );
    showToast(`Adjusted ${type === "start" ? "start" : "end"} time (${delta > 0 ? "+" : ""}${delta}s)`);
  };

  const handleCopyHook = () => {
    const textToCopy = `${activeClip.hookTitle}\n\n${activeClip.hashtags.join(" ")}`;
    navigator.clipboard.writeText(textToCopy);
    showToast("Hook & hashtags copied to clipboard!");
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = clipUrl;
    a.download = `${activeClip.hookTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast("Downloading 9:16 vertical clip (.mp4)...");
  };

  const hasValidInput = urlInput.trim().length > 5;

  return (
    <div className="relative mx-auto max-w-6xl w-full px-4 py-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-[#000000] bg-[#000000] px-4 py-3 text-sm font-semibold text-[#FAF7F0] shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="h-4 w-4 text-[#7895B2]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hidden File Input for Direct Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* 1. THE ENTRY VIEW */}
      {viewState === "entry" && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          {/* Header pill badge */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#D6CCB5] bg-[#FAF7F0] px-4 py-1.5 text-xs font-semibold tracking-wide text-[#4A4740] shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-[#7895B2]" />
            AI CONTENT REPURPOSER
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-[#000000] max-w-2xl mb-4 font-serif">
            Turn long videos into viral vertical clips in seconds.
          </h1>
          <p className="text-sm md:text-base text-[#4A4740] max-w-lg mb-10">
            Paste any YouTube video, Drive recording, or upload an MP4. Our AI auto-frames 9:16 clips, writes hooks, and adds animated captions.
          </p>

          {/* Single Pill-Shaped Input Bar with Popover */}
          <div ref={containerRef} className="relative w-full max-w-2xl">
            <div
              className={`flex items-center rounded-full border bg-white p-2 shadow-lg transition-all duration-200 ${
                isFocused
                  ? "border-[#000000] ring-2 ring-[#7895B2]/30 shadow-xl"
                  : "border-[#D6CCB5] hover:border-[#7895B2]"
              }`}
            >
              {/* Link Icon */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FAF7F0] text-[#4A4740] ml-1">
                <Link2 className="h-5 w-5 text-[#7895B2]" />
              </div>

              {/* Input */}
              <input
                ref={inputRef}
                type="text"
                value={urlInput}
                onFocus={() => setIsFocused(true)}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && hasValidInput) {
                    handleStartScan();
                  }
                }}
                placeholder="Drop a video link or paste a YouTube URL..."
                className="flex-1 bg-transparent px-4 py-2 text-sm md:text-base font-medium text-[#000000] placeholder:text-[#9E988D] focus:outline-none"
              />

              {/* Inline Action Trigger: "Get Clips →" slides in when valid */}
              {hasValidInput && (
                <button
                  type="button"
                  onClick={() => handleStartScan()}
                  className="flex items-center gap-1.5 rounded-full bg-[#000000] px-5 py-2.5 text-sm font-bold text-[#FAF7F0] transition hover:bg-[#1A1917] active:scale-95 animate-in fade-in slide-in-from-right-3 duration-200"
                >
                  <span>Get Clips</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Smart Focus Popover */}
            {isFocused && (
              <div className="absolute left-0 right-0 top-full mt-3 z-30 rounded-2xl border border-[#000000] bg-[#1A1917] p-5 text-left text-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                <p className="text-xs font-semibold tracking-wider uppercase text-[#AEBDCA] mb-3">
                  Supported Sources (MVP)
                </p>

                {/* Grid of Sources */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4">
                  {/* YouTube */}
                  <button
                    type="button"
                    onClick={() => handleSourceSelect("youtube")}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-left transition hover:border-[#7895B2] hover:bg-white/10 group"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600/20 text-red-500 group-hover:scale-105 transition-transform">
                      <Youtube className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">YouTube</div>
                      <div className="text-[11px] text-[#AEBDCA]">Pastes link & clips</div>
                    </div>
                  </button>

                  {/* Google Drive */}
                  <button
                    type="button"
                    onClick={() => handleSourceSelect("drive")}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-left transition hover:border-[#7895B2] hover:bg-white/10 group"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:scale-105 transition-transform">
                      <HardDrive className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Google Drive</div>
                      <div className="text-[11px] text-[#AEBDCA]">Shared video file</div>
                    </div>
                  </button>

                  {/* Upload File */}
                  <button
                    type="button"
                    onClick={() => handleSourceSelect("upload")}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-left transition hover:border-[#7895B2] hover:bg-white/10 group"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 group-hover:scale-105 transition-transform">
                      <Upload className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Upload File</div>
                      <div className="text-[11px] text-[#AEBDCA]">MP4, MOV up to 2GB</div>
                    </div>
                  </button>
                </div>

                {/* Trust / Friction-Reducer Footer */}
                <div className="flex items-center justify-between border-t border-white/10 pt-3 text-xs text-[#AEBDCA]">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Sparkles className="h-3.5 w-3.5 text-[#7895B2]" />
                    Free to try. No login required. Max 20 mins.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setUrlInput("https://www.youtube.com/watch?v=saas-blueprint-10k");
                      handleStartScan("How to Build a $10K/mo Micro-SaaS Solo (Full Blueprint)");
                    }}
                    className="text-xs font-semibold text-[#7895B2] hover:underline"
                  >
                    Try sample video →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Features Row */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl text-left border-t border-[#D6CCB5] pt-8">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8DFCA] text-[#000000] font-bold text-xs">
                9:16
              </div>
              <div>
                <p className="text-xs font-bold text-[#000000]">Smart AI Auto-Crop</p>
                <p className="text-xs text-[#4A4740]">Detects active speaker & centers 9:16 framing automatically.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8DFCA] text-[#000000] font-bold text-xs">
                90+
              </div>
              <div>
                <p className="text-xs font-bold text-[#000000]">Virality Scoring</p>
                <p className="text-xs text-[#4A4740]">Ranks clips by retention potential and high-energy hooks.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8DFCA] text-[#000000] font-bold text-xs">
                Aa
              </div>
              <div>
                <p className="text-xs font-bold text-[#000000]">Dynamic Subtitles</p>
                <p className="text-xs text-[#4A4740]">Renders TikTok/Reels style animated captions on the fly.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCANNING STATE */}
      {viewState === "scanning" && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-[#000000] bg-[#FAF7F0] shadow-xl">
            <Sparkles className="h-10 w-10 text-[#7895B2] animate-spin" style={{ animationDuration: "3s" }} />
          </div>

          <h2 className="text-2xl font-bold text-[#000000] mb-2 font-serif">
            Analyzing video & finding viral hooks...
          </h2>
          <p className="text-sm text-[#4A4740] max-w-md mb-6">
            Scanning transcript, speech inflection, and chapter breaks to generate optimized 9:16 cutdowns.
          </p>

          <div className="w-full max-w-md rounded-full bg-[#E8DFCA] p-1 border border-[#D6CCB5]">
            <div
              className="h-2 rounded-full bg-[#000000] transition-all duration-500 ease-out"
              style={{ width: `${((scanStep + 1) / 4) * 100}%` }}
            />
          </div>

          <p className="mt-4 text-xs font-semibold text-[#7895B2] tracking-wide animate-pulse">
            Step {scanStep + 1} of 4:{" "}
            {[
              "Downloading high-res audio & video streams...",
              "Scanning speech pauses, hooks & emotional spikes...",
              "Auto-framing 9:16 vertical subject tracking...",
              "Synthesizing dynamic word-level subtitles...",
            ][scanStep]}
          </p>
        </div>
      )}

      {/* 2. THE RESULTS VIEW */}
      {viewState === "results" && (
        <div className="animate-in fade-in duration-300">
          {/* Top Bar (Mini Source Strip) */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#D6CCB5] bg-[#FAF7F0] p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <img
                src={screenThumbnail}
                alt="Video Thumbnail"
                className="h-12 w-20 rounded-lg object-cover border border-[#D6CCB5]"
              />
              <div>
                <p className="text-sm font-bold text-[#000000] line-clamp-1 max-w-md">
                  {videoTitle}
                </p>
                <div className="flex items-center gap-3 text-xs text-[#4A4740]">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-[#7895B2]" />
                    {videoDuration} total duration
                  </span>
                  <span>•</span>
                  <span className="font-semibold text-emerald-700">4 viral clips detected</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setViewState("entry");
                setUrlInput("");
              }}
              className="flex items-center gap-1.5 rounded-full border border-[#D6CCB5] bg-white px-4 py-2 text-xs font-bold text-[#000000] transition hover:border-[#000000] hover:bg-[#FAF7F0]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>← New Video</span>
            </button>
          </div>

          {/* Clean 2-Panel Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column — Viral Clips Feed (Scrollable) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#4A4740]">
                  Detected Clips ({clips.length})
                </h3>
                <span className="text-xs text-[#7895B2] font-semibold">
                  Sorted by virality score
                </span>
              </div>

              <div className="space-y-3">
                {clips.map((clip) => {
                  const isSelected = clip.id === selectedClipId;
                  return (
                    <div
                      key={clip.id}
                      onClick={() => setSelectedClipId(clip.id)}
                      className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${
                        isSelected
                          ? "border-[#000000] bg-white ring-2 ring-[#000000]/10 shadow-md"
                          : "border-[#D6CCB5] bg-[#FAF7F0] hover:border-[#7895B2] hover:bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        {/* Virality Score Badge */}
                        <div
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                            clip.viralityScore >= 90
                              ? "bg-amber-100 text-amber-900 border border-amber-300"
                              : "bg-emerald-100 text-emerald-900 border border-emerald-300"
                          }`}
                        >
                          <Flame className="h-3.5 w-3.5 fill-current text-amber-600" />
                          <span>{clip.viralityScore}/100 Virality</span>
                        </div>

                        {/* Timestamp */}
                        <div className="flex items-center gap-1 text-xs font-mono font-medium text-[#4A4740]">
                          <Clock className="h-3 w-3 text-[#7895B2]" />
                          <span>
                            {formatTime(clip.startSec)} – {formatTime(clip.endSec)}
                          </span>
                        </div>
                      </div>

                      {/* Hook Title */}
                      <h4 className="text-base font-bold text-[#000000] mb-1.5 leading-snug">
                        {clip.hookTitle}
                      </h4>

                      {/* 2-line Transcript Preview */}
                      <p className="text-xs text-[#4A4740] line-clamp-2 leading-relaxed">
                        "{clip.transcript}"
                      </p>

                      {/* Action cue */}
                      <div className="mt-3 flex items-center justify-between border-t border-[#D6CCB5]/60 pt-2 text-[11px] text-[#7895B2]">
                        <span className="font-semibold">
                          {isSelected ? "Currently previewing in player →" : "Click to preview clip"}
                        </span>
                        <span className="font-mono text-[#4A4740]">
                          {clip.endSec - clip.startSec}s cutdown
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column — Sticky Preview & Export */}
            <div className="lg:col-span-5 sticky top-6 space-y-4">
              <div className="rounded-3xl border border-[#000000] bg-[#1A1917] p-5 text-white shadow-xl">
                <div className="flex items-center justify-between mb-3 text-xs text-[#AEBDCA]">
                  <span className="font-semibold uppercase tracking-wider">
                    9:16 Vertical Preview
                  </span>
                  <span className="font-mono text-[11px] bg-white/10 px-2 py-0.5 rounded-md">
                    {formatTime(activeClip.startSec)} – {formatTime(activeClip.endSec)}
                  </span>
                </div>

                {/* 9:16 Vertical Player Frame */}
                <div className="relative mx-auto aspect-[9/16] w-full max-w-[280px] overflow-hidden rounded-2xl bg-black border border-white/20 shadow-inner group">
                  <video
                    ref={videoRef}
                    src={clipUrl}
                    autoPlay
                    loop
                    muted={isMuted}
                    playsInline
                    className="h-full w-full object-cover"
                  />

                  {/* Dynamic Caption Overlay */}
                  {captionStyle !== "none" && (
                    <div className="pointer-events-none absolute inset-x-3 bottom-12 flex justify-center text-center">
                      <div
                        className={`rounded-lg px-2.5 py-1.5 font-black uppercase tracking-tight text-sm sm:text-base leading-tight ${
                          captionStyle === "bold-yellow"
                            ? "bg-black/75 text-[#FACC15] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] border border-yellow-400/40"
                            : "bg-black/60 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] border border-white/30"
                        }`}
                      >
                        {activeClip.captions}
                      </div>
                    </div>
                  )}

                  {/* Video Overlay Controls (Mute / Play) */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsMuted(!isMuted)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/90 transition"
                      title={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!videoRef.current) return;
                        if (isPlaying) {
                          videoRef.current.pause();
                          setIsPlaying(false);
                        } else {
                          videoRef.current.play();
                          setIsPlaying(true);
                        }
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/90 transition"
                      title={isPlaying ? "Pause" : "Play"}
                    >
                      {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                {/* 3 Micro-Controls Underneath */}
                <div className="mt-5 space-y-4 pt-3 border-t border-white/10">
                  {/* Micro-Control 1: Caption Style Swatches */}
                  <div>
                    <label className="text-xs font-semibold text-[#AEBDCA] block mb-2">
                      Caption Style
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setCaptionStyle("bold-yellow")}
                        className={`flex items-center justify-center gap-1.5 rounded-xl border p-2 text-xs font-bold transition ${
                          captionStyle === "bold-yellow"
                            ? "border-yellow-400 bg-yellow-400/20 text-yellow-300"
                            : "border-white/10 bg-white/5 text-white/70 hover:border-white/30"
                        }`}
                      >
                        <span className="h-2.5 w-2.5 rounded-full bg-yellow-400 shadow-sm" />
                        <span>Bold Yellow</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCaptionStyle("clean-white")}
                        className={`flex items-center justify-center gap-1.5 rounded-xl border p-2 text-xs font-bold transition ${
                          captionStyle === "clean-white"
                            ? "border-white bg-white/20 text-white"
                            : "border-white/10 bg-white/5 text-white/70 hover:border-white/30"
                        }`}
                      >
                        <span className="h-2.5 w-2.5 rounded-full bg-white shadow-sm" />
                        <span>Clean White</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCaptionStyle("none")}
                        className={`flex items-center justify-center gap-1.5 rounded-xl border p-2 text-xs font-bold transition ${
                          captionStyle === "none"
                            ? "border-white bg-white/20 text-white"
                            : "border-white/10 bg-white/5 text-white/70 hover:border-white/30"
                        }`}
                      >
                        <span className="h-2.5 w-2.5 rounded-full border border-white/40" />
                        <span>None</span>
                      </button>
                    </div>
                  </div>

                  {/* Micro-Control 2: Trim Nudgers (-1s / +1s) */}
                  <div>
                    <label className="text-xs font-semibold text-[#AEBDCA] block mb-2">
                      Fine-Trim Timeline
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Start Time Nudger */}
                      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-2 px-3">
                        <span className="text-[11px] font-mono text-[#AEBDCA]">
                          Start: {formatTime(activeClip.startSec)}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleTrimNudge("start", -1)}
                            className="h-6 w-6 rounded bg-white/10 text-xs font-mono font-bold hover:bg-white/20 active:scale-95 transition"
                            title="-1 second start"
                          >
                            -1s
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTrimNudge("start", +1)}
                            className="h-6 w-6 rounded bg-white/10 text-xs font-mono font-bold hover:bg-white/20 active:scale-95 transition"
                            title="+1 second start"
                          >
                            +1s
                          </button>
                        </div>
                      </div>

                      {/* End Time Nudger */}
                      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-2 px-3">
                        <span className="text-[11px] font-mono text-[#AEBDCA]">
                          End: {formatTime(activeClip.endSec)}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleTrimNudge("end", -1)}
                            className="h-6 w-6 rounded bg-white/10 text-xs font-mono font-bold hover:bg-white/20 active:scale-95 transition"
                            title="-1 second end"
                          >
                            -1s
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTrimNudge("end", +1)}
                            className="h-6 w-6 rounded bg-white/10 text-xs font-mono font-bold hover:bg-white/20 active:scale-95 transition"
                            title="+1 second end"
                          >
                            +1s
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Micro-Control 3: Primary CTA & Secondary CTA */}
                  <div className="space-y-2 pt-2">
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#FAF7F0] px-4 py-3 text-sm font-extrabold text-[#000000] shadow-md transition hover:bg-white active:scale-98"
                    >
                      <Download className="h-4 w-4 text-[#000000]" />
                      <span>Download Clip (.mp4)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyHook}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/20 active:scale-98"
                    >
                      <Copy className="h-3.5 w-3.5 text-[#AEBDCA]" />
                      <span>Copy Hook & Hashtags</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
