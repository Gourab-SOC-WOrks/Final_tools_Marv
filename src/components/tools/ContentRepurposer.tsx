import { useState, useRef, useEffect } from "react";
import {
  Link2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Flame,
  Clock,
  Play,
  Pause,
  Copy,
  Download,
  Volume2,
  VolumeX,
  CheckCircle2,
  RotateCcw,
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

export type AspectRatioType = "9:16" | "16:9" | "1:1" | "4:5";

export interface AspectRatioOption {
  id: AspectRatioType;
  label: string;
  tag: string;
  iconBox: string;
  containerClass: string;
}

export const ASPECT_RATIOS: AspectRatioOption[] = [
  {
    id: "9:16",
    label: "9:16 Vertical",
    tag: "Shorts / Reels / TikTok",
    iconBox: "w-2.5 h-4",
    containerClass: "aspect-[9/16] max-w-[280px]",
  },
  {
    id: "16:9",
    label: "16:9 Landscape",
    tag: "YouTube / Desktop",
    iconBox: "w-4 h-2.5",
    containerClass: "aspect-[16/9] max-w-[420px]",
  },
  {
    id: "1:1",
    label: "1:1 Square",
    tag: "LinkedIn / X Feeds",
    iconBox: "w-3 h-3",
    containerClass: "aspect-square max-w-[310px]",
  },
  {
    id: "4:5",
    label: "4:5 Portrait",
    tag: "Instagram Feed",
    iconBox: "w-3 h-3.5",
    containerClass: "aspect-[4/5] max-w-[290px]",
  },
];

// 12 Supported Sources mapped to row-major order for 3-column layout
interface SourceOption {
  id: string;
  label: string;
  url?: string;
  isUpload?: boolean;
  icon: JSX.Element;
}

const SOURCES: SourceOption[] = [
  // Row 1
  {
    id: "youtube",
    label: "YouTube",
    url: "https://www.youtube.com/watch?v=saas-blueprint-10k",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white" aria-hidden="true">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    id: "vimeo",
    label: "Vimeo",
    url: "https://vimeo.com/894210345",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white" aria-hidden="true">
        <path d="M23.977 6.416c-.105 2.338-1.739 5.543-4.894 9.609-3.268 4.247-6.026 6.37-8.29 6.37-1.409 0-2.578-1.294-3.553-3.881L5.322 11.4C4.603 8.816 3.834 7.525 3.01 7.525c-.179 0-.806.378-1.881 1.131L0 7.234c1.183-1.042 2.383-2.083 3.6-3.125 1.688-1.464 2.946-2.238 3.773-2.324 1.954-.18 3.161 1.157 3.621 4.01.55 3.393.914 5.518 1.092 6.374.526 2.502 1.107 3.753 1.742 3.753.493 0 1.23-.787 2.21-2.361.984-1.575 1.516-2.775 1.597-3.6.148-1.423-.404-2.135-1.657-2.135-.615 0-1.25.138-1.905.414 1.255-4.108 3.642-6.109 7.16-6.002 2.607.078 3.844 1.484 3.709 4.218z" />
      </svg>
    ),
  },
  {
    id: "x",
    label: "X",
    url: "https://x.com/indiehackers/status/1782390142",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },

  // Row 2
  {
    id: "facebook",
    label: "Facebook",
    url: "https://facebook.com/watch/?v=9876543210",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    id: "twitch",
    label: "Twitch",
    url: "https://www.twitch.tv/videos/2048591823",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white" aria-hidden="true">
        <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
      </svg>
    ),
  },
  {
    id: "rumble",
    label: "Rumble",
    url: "https://rumble.com/v4abcde-founders-playbook.html",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white" aria-hidden="true">
        <path d="M21.57 9.87c-.36-.93-1.09-1.63-2.02-1.92-2.82-.9-9.5-.9-12.32 0-.93.29-1.66.99-2.02 1.92-.89 2.29-.89 6.22 0 8.51.36.93 1.09 1.63 2.02 1.92 2.82.9 9.5.9 12.32 0 .93-.29 1.66-.99 2.02-1.92.89-2.29.89-6.22 0-8.51zM10.12 15.68V8.32L15.88 12l-5.76 3.68z" />
      </svg>
    ),
  },

  // Row 3
  {
    id: "loom",
    label: "Loom",
    url: "https://www.loom.com/share/9a8b7c6d5e4f",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-white stroke-[2.2]" aria-hidden="true">
        <circle cx="12" cy="12" r="3" fill="white" />
        <path d="M12 2v3m0 14v3M2 12h3m14 0h3m-3.07-6.93l-2.12 2.12m-9.62 9.62l-2.12 2.12m0-13.86l2.12 2.12m9.62 9.62l2.12 2.12" />
      </svg>
    ),
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    url: "https://www.linkedin.com/posts/saas-launch-video",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white" aria-hidden="true">
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
      </svg>
    ),
  },
  {
    id: "zoom",
    label: "Zoom",
    url: "https://zoom.us/rec/play/xyz789",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white" aria-hidden="true">
        <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h8A2.5 2.5 0 0 1 17 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-8A2.5 2.5 0 0 1 4 17.5v-11zm14 2.8l4.4-3.3A1 1 0 0 1 24 6.8v10.4a1 1 0 0 1-1.6.8L18 14.7V9.3z" />
      </svg>
    ),
  },

  // Row 4
  {
    id: "gdrive",
    label: "Google Drive",
    url: "https://drive.google.com/file/d/1A2b3C4d5E6F7G8/view",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white" aria-hidden="true">
        <path d="M8.27 2.5L2.73 12.09l4.55 7.88 5.54-9.59L8.27 2.5zm7.46 0H8.27l4.55 7.88h7.46L15.73 2.5zm1.54 9.59H9.82l-2.54 4.41h14.91l-4.91-8.5v4.09z" />
      </svg>
    ),
  },
  {
    id: "dropbox",
    label: "Dropbox",
    url: "https://www.dropbox.com/s/rec4920/demo.mp4?dl=0",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white" aria-hidden="true">
        <path d="M6 2L0 6.5l6 4.5 6-4.5L6 2zm12 0l-6 4.5 6 4.5 6-4.5L18 2zM0 15.5l6 4.5 6-4.5-6-4.5-6 4.5zm18-4.5l-6 4.5 6 4.5 6-4.5-6-4.5zM6 18.5l6 4.5 6-4.5-6-4.5-6 4.5z" />
      </svg>
    ),
  },
  {
    id: "upload",
    label: "Upload a file",
    isUpload: true,
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-white stroke-[2.2]" aria-hidden="true">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
  },
];

export function ContentRepurposer() {
  const [viewState, setViewState] = useState<"entry" | "scanning" | "results">("entry");
  const [urlInput, setUrlInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [videoTitle, setVideoTitle] = useState("How to Build a $10K/mo Micro-SaaS Solo (Full Blueprint)");
  const [videoDuration] = useState("14:28");
  const [clips, setClips] = useState<ClipItem[]>(DEFAULT_CLIPS);
  const [selectedClipId, setSelectedClipId] = useState<string>(DEFAULT_CLIPS[0].id);
  const [captionStyle, setCaptionStyle] = useState<"bold-yellow" | "clean-white" | "none">("bold-yellow");
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>("9:16");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const activeClip = clips.find((c) => c.id === selectedClipId) || clips[0];
  const currentAspectRatio = ASPECT_RATIOS.find((a) => a.id === aspectRatio) ?? ASPECT_RATIOS[0];

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

  const handleSourceSelect = (src: SourceOption) => {
    if (src.isUpload) {
      fileInputRef.current?.click();
      return;
    }
    if (src.url) {
      setUrlInput(src.url);
      setIsFocused(false);
      showToast(`Selected ${src.label}`);
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

  const hasValidInput = urlInput.trim().length > 3;

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
        <div className="flex flex-col items-center justify-center py-12 md:py-16 text-center">
          {/* Header pill badge */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#D6CCB5] bg-[#FAF7F0] px-4 py-1.5 text-xs font-semibold tracking-wide text-[#4A4740] shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-[#7895B2]" />
            AI CONTENT REPURPOSER
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-[#000000] max-w-2xl mb-3 font-serif">
            Turn long videos into viral vertical clips in seconds.
          </h1>
          <p className="text-sm md:text-base text-[#4A4740] max-w-xl mb-10 leading-relaxed">
            Auto-framing 9:16 vertical clips, retention-backed virality scores, dynamic subtitles, hashtags, and optimal scheduling.
          </p>

          {/* Centered Search/Input Box with Popover */}
          <div ref={containerRef} className="relative w-full max-w-xl">
            {/* The Input Bar */}
            <div
              className={`flex items-center rounded-2xl border bg-white px-3 py-2.5 shadow-sm transition-all duration-200 ${
                isFocused
                  ? "border-[#000000] ring-2 ring-[#7895B2]/20 shadow-md"
                  : "border-[#D6CCB5] hover:border-[#7895B2]"
              }`}
            >
              {/* Link Icon (🔗) */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center text-[#78716C] pl-1">
                <Link2 className="h-5 w-5 stroke-[2]" />
              </div>

              {/* Text Input */}
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
                placeholder="Drop a video link"
                className="flex-1 bg-transparent px-3 py-1 text-sm md:text-base font-normal text-[#1A1917] placeholder:text-[#8C867A] focus:outline-none"
              />

              {/* Inline Action Trigger: "Get Clips →" slides in when valid */}
              {hasValidInput && (
                <button
                  type="button"
                  onClick={() => handleStartScan()}
                  className="flex items-center gap-1.5 rounded-xl bg-[#000000] px-4 py-2 text-xs md:text-sm font-bold text-[#FAF7F0] transition hover:bg-[#1A1917] active:scale-95 animate-in fade-in slide-in-from-right-3 duration-200 shadow-sm"
                >
                  <span>Get Clips</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Smart Focus Popover - Matches exact layout from reference image */}
            {isFocused && (
              <div className="absolute left-0 right-0 top-full mt-2 z-40 rounded-2xl border border-[#2A2926] bg-[#1E1E1E] p-5 text-left text-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                {/* Header text */}
                <h3 className="text-sm font-bold text-white tracking-tight mb-4">
                  Import a video from any of these
                </h3>

                {/* 3-Column x 4-Row Grid of 12 Supported Services */}
                <div className="grid grid-cols-3 gap-x-4 sm:gap-x-8 gap-y-3.5">
                  {SOURCES.map((source) => (
                    <button
                      key={source.id}
                      type="button"
                      onClick={() => handleSourceSelect(source)}
                      className="group flex items-center gap-2.5 rounded-lg py-1 px-1.5 text-left transition hover:bg-white/10 active:scale-95"
                    >
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all">
                        {source.icon}
                      </div>
                      <span className="truncate text-xs sm:text-sm font-medium text-white/90 group-hover:text-white">
                        {source.label}
                      </span>
                    </button>
                  ))}
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

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleStartScan(videoTitle)}
                className="flex items-center gap-1.5 rounded-full border border-[#D6CCB5] bg-white px-4 py-2 text-xs font-bold text-[#000000] transition hover:border-[#000000] hover:bg-[#FAF7F0] shadow-2xs active:scale-95"
                title="Regenerate viral clips and reframing"
              >
                <RotateCcw className="h-3.5 w-3.5 text-[#7895B2]" />
                <span>Regenerate Clips</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewState("entry");
                  setUrlInput("");
                }}
                className="flex items-center gap-1.5 rounded-full border border-[#D6CCB5] bg-white px-4 py-2 text-xs font-bold text-[#000000] transition hover:border-[#000000] hover:bg-[#FAF7F0] shadow-2xs active:scale-95"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>New Video</span>
              </button>
            </div>
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
                  <div className="flex items-center gap-2">
                    <span className="font-semibold uppercase tracking-wider">
                      {currentAspectRatio.label} Preview
                    </span>
                    <span className="text-[10px] text-white/50 bg-white/10 px-1.5 py-0.5 rounded font-mono">
                      {currentAspectRatio.tag}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] bg-white/10 px-2 py-0.5 rounded-md">
                    {formatTime(activeClip.startSec)} – {formatTime(activeClip.endSec)}
                  </span>
                </div>

                {/* Adaptive Video Player Frame */}
                <div className={`relative mx-auto w-full overflow-hidden rounded-2xl bg-black border border-white/20 shadow-inner group transition-all duration-300 ${currentAspectRatio.containerClass}`}>
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

                {/* Micro-Controls Underneath */}
                <div className="mt-5 space-y-4 pt-3 border-t border-white/10">
                  {/* Aspect Ratio Selector Tool */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-[#AEBDCA]">
                        Aspect Ratio Selector
                      </label>
                      <span className="text-[11px] font-mono text-emerald-400 font-medium">
                        {currentAspectRatio.id} Framing
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10">
                      {ASPECT_RATIOS.map((ar) => (
                        <button
                          key={ar.id}
                          type="button"
                          onClick={() => {
                            setAspectRatio(ar.id);
                            showToast(`Framing set to ${ar.label}`);
                          }}
                          className={`py-2 px-1 text-xs font-medium rounded-lg text-center transition-all duration-150 active:scale-[0.96] flex flex-col items-center justify-center gap-1 ${
                            aspectRatio === ar.id
                              ? "bg-white text-black shadow-sm font-semibold"
                              : "text-[#AEBDCA] hover:text-white hover:bg-white/10"
                          }`}
                        >
                          <span
                            className={`border-1.5 rounded-xs ${ar.iconBox} ${
                              aspectRatio === ar.id ? "border-black bg-black/10" : "border-[#AEBDCA]"
                            }`}
                          />
                          <span className="text-[10px] font-mono leading-none">{ar.id}</span>
                        </button>
                      ))}
                    </div>
                  </div>

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

                  {/* Micro-Control 2: Custom Timeline Changer Capsules (Matching Reference Screenshot) */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-[#AEBDCA]">
                        Custom Timeline Changer
                      </label>
                      <span className="text-[10px] text-white/50 font-mono">
                        {activeClip.endSec - activeClip.startSec}s cutdown
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Start Capsule */}
                      <div className="inline-flex items-center gap-2.5 rounded-full bg-[#1D1D1F] px-4 py-1.5 shadow-sm border border-white/10">
                        <span className="font-mono text-xs text-[#A1A1A6] select-none tracking-tight">
                          Start: <span className="text-white font-medium">{formatTime(activeClip.startSec)}</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleTrimNudge("start", -1)}
                            className="flex h-5 items-center justify-center rounded-[5px] bg-[#323234] hover:bg-[#3E3E42] px-1.5 text-[10px] font-mono text-white transition active:scale-95 cursor-pointer"
                            title="Subtract 1 second from start time"
                          >
                            -1s
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTrimNudge("start", 1)}
                            className="flex h-5 items-center justify-center rounded-[5px] bg-[#323234] hover:bg-[#3E3E42] px-1.5 text-[10px] font-mono text-white transition active:scale-95 cursor-pointer"
                            title="Add 1 second to start time"
                          >
                            +1s
                          </button>
                        </div>
                      </div>

                      {/* End Capsule */}
                      <div className="inline-flex items-center gap-2.5 rounded-full bg-[#1D1D1F] px-4 py-1.5 shadow-sm border border-white/10">
                        <span className="font-mono text-xs text-[#A1A1A6] select-none tracking-tight">
                          End: <span className="text-white font-medium">{formatTime(activeClip.endSec)}</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleTrimNudge("end", -1)}
                            className="flex h-5 items-center justify-center rounded-[5px] bg-[#323234] hover:bg-[#3E3E42] px-1.5 text-[10px] font-mono text-white transition active:scale-95 cursor-pointer"
                            title="Subtract 1 second from end time"
                          >
                            -1s
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTrimNudge("end", 1)}
                            className="flex h-5 items-center justify-center rounded-[5px] bg-[#323234] hover:bg-[#3E3E42] border border-white/60 px-1.5 text-[10px] font-mono text-white transition active:scale-95 cursor-pointer"
                            title="Add 1 second to end time"
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
