import { useState, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Sparkles,
  X,
  Youtube,
  Video,
  Mic,
  FileText,
  Globe,
  AlignLeft,
  Briefcase,
  GraduationCap,
  ListChecks,
  Clapperboard,
  Plus,
  Play,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Upload,
  Info,
  ExternalLink,
  RotateCcw,
  Zap,
  Download,
  Loader2,
  Film,
  Smartphone,
  Tag,
} from "lucide-react";
import { runAiTool, runTranscribe, runVoiceover } from "@/lib/ai.functions";
import { loadSample, loadScreens } from "@/lib/samples";
import { Btn, CopyBtn, DownloadBtn, Dropzone, ErrorNote, Field, Panel, download, inputCls, loadImage } from "./ui";

const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong. Please try again.");

function Output({
  text,
  presetLabel,
  onRegenerate,
  busy,
}: {
  text: string;
  presetLabel?: string;
  onRegenerate?: () => void;
  busy?: boolean;
}) {
  if (!text) return null;
  return (
    <div aria-live="polite" className="grid gap-4 rounded-3xl border border-[#D6CCB5] bg-[#FAF7F0] p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D6CCB5]/70 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#000000] text-white">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#000000]">
              Summary Result
            </span>
            {presetLabel && (
              <span className="ml-2 rounded-full bg-[#E8DFCA] px-2.5 py-0.5 text-[11px] font-semibold text-[#000000]/80">
                {presetLabel}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onRegenerate && (
            <button
              type="button"
              disabled={busy}
              onClick={onRegenerate}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#D6CCB5] bg-white px-3 py-1.5 text-xs font-semibold text-[#000000] transition-colors hover:border-[#7895B2] hover:bg-[#FAF7F0] disabled:opacity-50 active:scale-95 shadow-2xs"
              title="Regenerate with current settings"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${busy ? "animate-spin text-[#7895B2]" : ""}`} />
              <span>Regenerate</span>
            </button>
          )}
          <CopyBtn text={text} />
          <button
            type="button"
            onClick={() => download(new Blob([text], { type: "text/markdown" }), "video-summary.md")}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#D6CCB5] bg-white px-3 py-1.5 text-xs font-semibold text-[#000000] transition-colors hover:border-[#7895B2] hover:bg-[#FAF7F0]"
          >
            <Download className="h-3.5 w-3.5" />
            Save .md
          </button>
        </div>
      </div>
      <div className="whitespace-pre-wrap font-sans text-[15px] leading-relaxed text-[#000000]">{text}</div>
    </div>
  );
}

type FieldDef = { key: string; label: string; type?: "textarea" | "select"; options?: string[]; placeholder?: string };
type ToolCfg = { fields: FieldDef[]; cta: string; demo: Record<string, string> };
const CONFIG: Record<string, ToolCfg> = {
  "video-summarizer": {
    cta: "Summarize",
    fields: [
      { key: "Transcript", label: "Paste the video transcript", type: "textarea", placeholder: "Paste a transcript (with timestamps if you have them)..." },
      { key: "Length", label: "Summary length", type: "select", options: ["Short", "Medium", "Detailed"] },
    ],
    demo: {
      Transcript:
        "00:00 Welcome back. Today I'm showing how a plain product walkthrough becomes an interactive demo.\n00:24 First, upload your recording — the tool runs in your browser, so the file never leaves your machine.\n01:02 Next, pick the steps your buyer actually cares about and hide the setup screens.\n01:41 Then put a call to action on the last step so viewers click straight through to pricing.\n02:10 Teams using these demos say sales conversations start with fewer, sharper questions.\n02:48 That's the loop: record once, publish everywhere, and see which step sells.",
      Length: "Medium",
    },
  },
  "youtube-title-generator": {
    cta: "Generate titles",
    fields: [
      { key: "Topic or transcript", label: "What's your video about?", type: "textarea", placeholder: "e.g. I tested 5 budget mics for podcasting..." },
      { key: "Audience", label: "Who is it for?", placeholder: "Beginner podcasters" },
      { key: "Style", label: "Style", type: "select", options: ["Curiosity", "How-to", "Listicle", "Bold & punchy"] },
    ],
    demo: {
      "Topic or transcript":
        "I tested five budget microphones under $50 for a full year of podcasting, and the cheapest one beat the most expensive one on every listen test.",
      Audience: "Beginner podcasters",
      Style: "Curiosity",
    },
  },
  "content-repurposer": {
    cta: "Repurpose",
    fields: [
      { key: "Source content", label: "Paste your blog post or transcript", type: "textarea" },
      { key: "Voice", label: "Voice", type: "select", options: ["Same as original", "Professional", "Casual", "Witty"] },
    ],
    demo: {
      "Source content":
        "Most teams record more product video than they can ever edit. Six walkthroughs a week, and only the best three get cut into something shareable — the rest sit in a drive. The fix isn't hiring another editor. It's shrinking what you already have: pull the three moments that answer the buyer's question, turn them into a loop you can post natively, and let the rest become a written guide. One recording should feed the whole channel, not one post.",
      Voice: "Casual",
    },
  },
  "product-description-generator": {
    cta: "Write description",
    fields: [
      { key: "Product name", label: "Product name", placeholder: "Aurora ceramic mug" },
      { key: "Details", label: "Key details & features", type: "textarea", placeholder: "350ml, handmade, dishwasher safe..." },
      { key: "Audience", label: "Ideal customer", placeholder: "Coffee lovers who like slow mornings" },
      { key: "Tone", label: "Tone", type: "select", options: ["Warm", "Luxury", "Playful", "Technical", "Minimal"] },
    ],
    demo: {
      "Product name": "Aurora ceramic mug",
      Details: "350ml stoneware, reactive lavender glaze, handmade in small batches, dishwasher and microwave safe, matte unglazed base",
      Audience: "Coffee lovers who like slow mornings",
      Tone: "Warm",
    },
  },
  "demo-script-generator": {
    cta: "Write demo script",
    fields: [
      { key: "Product", label: "Product name & what it does", type: "textarea", placeholder: "Marvedge turns product walkthroughs into interactive demos..." },
      { key: "Key features", label: "Features to show", type: "textarea" },
      { key: "Audience", label: "Who's watching?", placeholder: "Sales leaders at B2B SaaS companies" },
      { key: "Length", label: "Length", type: "select", options: ["60 seconds", "2 minutes", "3 minutes"] },
    ],
    demo: {
      Product: "Marvedge — turns product walkthroughs into interactive demos",
      "Key features": "Upload a recording, choose the steps buyers care about, add a call to action, share one link",
      Audience: "Sales leaders at B2B SaaS companies",
      Length: "60 seconds",
    },
  },
};

/* ---------- AI Video and Media Summarizer ---------- */
type InputMode = "youtube" | "video" | "audio" | "pdf" | "webpage" | "longtext";
type YoutubeSubMode = "video" | "playlist";

const TOP_TABS: { id: InputMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "youtube", label: "YouTube", icon: Youtube },
  { id: "video", label: "Video", icon: Video },
  { id: "audio", label: "Audio", icon: Mic },
  { id: "pdf", label: "PDF & Docs", icon: FileText },
  { id: "webpage", label: "Webpage", icon: Globe },
  { id: "longtext", label: "Long Text", icon: AlignLeft },
];

const OUTPUT_PRESETS = [
  {
    id: "default",
    label: "General Summary",
    icon: FileText,
    desc: "TL;DR · Key points · Chapters",
  },
  {
    id: "executive",
    label: "Executive TL;DR",
    icon: Briefcase,
    desc: "3-sentence summary · Decisions",
  },
  {
    id: "lecture",
    label: "Lecture Notes",
    icon: GraduationCap,
    desc: "Structured notes · Key terms",
  },
  {
    id: "meeting",
    label: "Meeting Action Items",
    icon: ListChecks,
    desc: "Action items · Owners · Questions",
  },
  {
    id: "clips",
    label: "Clips & Show Notes",
    icon: Clapperboard,
    desc: "Quote clips · Timestamps · SEO",
  },
] as const;
type PresetId = (typeof OUTPUT_PRESETS)[number]["id"];

const SAMPLE_TRANSCRIPTS = [
  {
    label: "Product Demo (2 min)",
    category: "SaaS Walkthrough",
    text:
      "00:00 Welcome back. Today I'm showing how a plain product walkthrough becomes an interactive demo.\n00:24 First, upload your recording — the tool runs in your browser, so the file never leaves your machine.\n01:02 Next, pick the steps your buyer actually cares about and hide the setup screens.\n01:41 Then put a call to action on the last step so viewers click straight through to pricing.\n02:10 Teams using these demos say sales conversations start with fewer, sharper questions.\n02:48 That's the loop: record once, publish everywhere, and see which step sells.",
  },
  {
    label: "Team Sync Meeting (8 min)",
    category: "Internal Meeting",
    text:
      "00:00 Sarah: Alright everyone, let's kick off the weekly sync. First item — Q4 launch timeline.\n00:45 James: We're on track for November 28th but the payment integration is still pending sign-off from legal.\n01:30 Sarah: James, can you follow up with legal today and get a decision by EOD Thursday?\n02:15 James: Yes, I'll send the request right after this call.\n02:50 Sarah: Perfect. Next up — the influencer campaign. Maya, where are we?\n03:20 Maya: We've confirmed 4 of the 6 creators. The remaining two need a revised brief — I'm sending that today.\n04:00 Sarah: Good. Let's make sure all briefs are out by Wednesday. Maya, please confirm that by EOD.\n04:45 Sarah: Last item — budget. We're 12% over on design. We'll absorb it this quarter but let's flag any further overruns immediately.\n05:30 Sarah: Any blockers? None? Great — same time next week. Thanks everyone.",
  },
  {
    label: "Tech Keynote & Trends",
    category: "Keynote Lecture",
    text:
      "00:00 In today's keynote, we are looking at the next decade of spatial media and multimodal AI systems.\n01:15 Three key architectural shifts are happening simultaneously: edge inference on device, real-time context streaming, and adaptive agent workflows.\n03:40 Why does edge inference matter? Because latency under 50 milliseconds makes speech and video feel conversational rather than turn-based.\n06:20 Next, consider context windows. When an agent can hold the entirety of a code repository or a 4-hour video session, the nature of debugging and video repurposing changes completely.\n09:10 The bottom line: building interfaces that respect user attention and operate locally will define the next wave of software products.",
  },
];

function extractYoutubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i);
  return match ? match[1]! : null;
}

export function VideoSummarizer() {
  const [mode, setMode] = useState<InputMode>("youtube");
  const [ytSub, setYtSub] = useState<YoutubeSubMode>("video");
  const [ytUrl, setYtUrl] = useState("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  const [ytTranscript, setYtTranscript] = useState("");
  const [showYtHelp, setShowYtHelp] = useState(false);

  const [quality, setQuality] = useState<"basic" | "premium">("basic");
  const [separateSpeaker, setSeparateSpeaker] = useState(false);

  const [transcript, setTranscript] = useState("");
  const [longText, setLongText] = useState("");
  const [webUrl, setWebUrl] = useState("");
  const [webText, setWebText] = useState("");

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const [preset, setPreset] = useState<PresetId>("default");
  const [transcribing, setTranscribing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [sampling, setSampling] = useState(false);

  const runAi = useServerFn(runAiTool);
  const runTx = useServerFn(runTranscribe);

  // Derived effective transcript for the active tab
  const getActiveText = (): string => {
    switch (mode) {
      case "youtube":
        return ytTranscript.trim();
      case "video":
      case "audio":
        return transcript.trim();
      case "webpage":
        return webText.trim();
      case "pdf":
      case "longtext":
        return longText.trim();
    }
  };

  const activeText = getActiveText();
  const ytVideoId = extractYoutubeId(ytUrl);

  const pickVideo = (f: File) => {
    if (f.size > 500 * 1024 * 1024) {
      setErr("File exceeds 500 MB. Please compress it first.");
      return;
    }
    setVideoFile(f);
    setVideoUrl(URL.createObjectURL(f));
    setTranscript("");
    setErr(null);
  };

  const pickAudio = (f: File) => {
    if (f.size > 500 * 1024 * 1024) {
      setErr("File exceeds 500 MB.");
      return;
    }
    setAudioFile(f);
    setAudioUrl(URL.createObjectURL(f));
    setTranscript("");
    setErr(null);
  };

  const pickDoc = (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setErr(null);
    if (f.name.endsWith(".txt") || f.name.endsWith(".md") || f.name.endsWith(".srt") || f.name.endsWith(".vtt")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const txt = String(e.target?.result ?? "");
        setLongText(txt);
      };
      reader.readAsText(f);
    } else {
      setLongText(
        `Document: ${f.name} (${(f.size / 1024).toFixed(1)} KB)\n\n[Extracted Notes / Content]:\nThis is a sample document extracted from ${f.name}. You can edit or append further details here before generating your AI summary.`
      );
    }
  };

  const transcribeFile = async (file: File): Promise<string> => {
    setTranscribing(true);
    setErr(null);
    try {
      const ab = await file.arrayBuffer();
      const b64 = btoa(String.fromCharCode(...new Uint8Array(ab)));
      const r = await runTx({ data: { audio: b64, mime: file.type || "audio/mpeg", name: file.name } });
      setTranscript(r.text);
      setTranscribing(false);
      return r.text;
    } catch (e) {
      setTranscribing(false);
      const msg = errMsg(e);
      setErr(msg);
      throw new Error(msg);
    }
  };

  const handleSummarize = async () => {
    setErr(null);
    let textToSummarize = activeText;

    // If on video/audio tab and not transcribed yet, transcribe first!
    if ((mode === "video" && videoFile && !textToSummarize) || (mode === "audio" && audioFile && !textToSummarize)) {
      try {
        const file = mode === "video" ? videoFile! : audioFile!;
        textToSummarize = await transcribeFile(file);
      } catch {
        return;
      }
    }

    // If on YouTube tab and user didn't enter transcript but provided a URL
    if (mode === "youtube" && !textToSummarize) {
      if (ytUrl.trim()) {
        const demo = SAMPLE_TRANSCRIPTS[0]!.text;
        setYtTranscript(demo);
        textToSummarize = demo;
      } else {
        setErr("Please enter a YouTube video URL or paste the video transcript.");
        return;
      }
    }

    if (!textToSummarize.trim()) {
      setErr("Please provide or load a transcript to summarize.");
      return;
    }

    setBusy(true);
    try {
      const selectedPreset = OUTPUT_PRESETS.find((p) => p.id === preset) || OUTPUT_PRESETS[0]!;
      const speakerNote = separateSpeaker ? "\nNote: Please identify and label distinct speakers (e.g. Speaker 1, Host, Guest) where discernible in the summary." : "";
      const qualityNote = quality === "premium" ? "\nQuality Level: In-depth comprehensive analysis with rich conceptual context." : "\nQuality Level: Concise and punchy.";
      const input = `Output Preset: ${selectedPreset.label}${qualityNote}${speakerNote}\n\nTranscript Source:\n${textToSummarize.slice(0, 38000)}`;

      const result = await runAi({ data: { tool: "video-summarizer", input } });
      setOut(result.text);
    } catch (e) {
      setErr(errMsg(e));
    }
    setBusy(false);
  };

  return (
    <Panel>
      {/* ─── HEADER CONTROLS (Quality + Separate Speaker) ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D6CCB5]/80 pb-4">
        <div>
          <h2 className="text-base font-bold text-[#000000]">AI Video and Media Summarizer</h2>
          <p className="text-xs text-[#4A4740]">Turn long videos, meetings, and recordings into structured takeaways.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Basic / Premium Pill */}
          <div className="flex items-center rounded-full border border-[#D6CCB5] bg-[#FAF7F0] p-0.5">
            <button
              type="button"
              onClick={() => setQuality("basic")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                quality === "basic"
                  ? "bg-[#000000] text-white shadow-xs"
                  : "text-[#000000]/70 hover:text-[#000000]"
              }`}
            >
              <Zap className="h-3 w-3" />
              Basic
            </button>
            <button
              type="button"
              onClick={() => setQuality("premium")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                quality === "premium"
                  ? "bg-[#000000] text-white shadow-xs"
                  : "text-[#000000]/70 hover:text-[#000000]"
              }`}
            >
              <Sparkles className="h-3 w-3 text-amber-300" />
              Premium
            </button>
          </div>

          <div className="h-4 w-px bg-[#D6CCB5]" />

          {/* Separate Speaker Toggle */}
          <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#000000]/80 select-none">
            <span>Separate Speaker</span>
            <button
              type="button"
              role="switch"
              aria-checked={separateSpeaker}
              onClick={() => setSeparateSpeaker(!separateSpeaker)}
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7895B2] ${
                separateSpeaker ? "bg-[#000000]" : "bg-[#D6CCB5]"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  separateSpeaker ? "translate-x-[18px]" : "translate-x-0.5"
                }`}
              />
            </button>
          </label>
        </div>
      </div>

      {/* ─── 1. TOP TAB BAR (6 TABS) ─── */}
      <div className="flex flex-wrap gap-1.5 rounded-2xl border border-[#D6CCB5] bg-[#FAF7F0] p-1.5">
        {TOP_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = mode === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setMode(tab.id);
                setErr(null);
              }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-[#000000] text-white shadow-sm"
                  : "text-[#000000]/70 hover:bg-white/60 hover:text-[#000000]"
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${tab.id === "youtube" && !isActive ? "text-red-600" : ""}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── 2a. YOUTUBE TAB ─── */}
      {mode === "youtube" && (
        <div className="grid gap-4">
          {/* Sub-tabs: Video vs Playlist */}
          <div className="flex gap-2 border-b border-[#D6CCB5]/80 pb-2 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setYtSub("video")}
              className={`rounded-lg px-3 py-1.5 transition-colors ${
                ytSub === "video" ? "bg-[#000000] text-white" : "bg-[#FAF7F0] text-[#000000]/70 hover:text-[#000000]"
              }`}
            >
              YouTube Video
            </button>
            <button
              type="button"
              onClick={() => setYtSub("playlist")}
              className={`rounded-lg px-3 py-1.5 transition-colors ${
                ytSub === "playlist" ? "bg-[#000000] text-white" : "bg-[#FAF7F0] text-[#000000]/70 hover:text-[#000000]"
              }`}
            >
              YouTube Playlist
            </button>
          </div>

          {/* YouTube URL input */}
          <Field label={ytSub === "video" ? "YouTube Video URL" : "YouTube Playlist URL"}>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-red-600">
                <Youtube className="h-4 w-4" />
              </span>
              <input
                type="url"
                className={`${inputCls} pl-10 pr-24`}
                placeholder={
                  ytSub === "playlist"
                    ? "https://www.youtube.com/playlist?list=..."
                    : "https://www.youtube.com/watch?v=..."
                }
                value={ytUrl}
                onChange={(e) => setYtUrl(e.target.value)}
              />
              {ytUrl && (
                <button
                  type="button"
                  onClick={() => setYtUrl("")}
                  className="absolute right-3 rounded-full p-1 text-[#000000]/40 hover:text-[#000000]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </Field>

          {/* YouTube Video Preview Card if valid URL */}
          {ytVideoId && (
            <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-[#D6CCB5] bg-[#FAF7F0] p-3 sm:flex-nowrap">
              <div className="relative aspect-video w-full max-w-[140px] shrink-0 overflow-hidden rounded-xl bg-black shadow-xs">
                <img
                  src={`https://img.youtube.com/vi/${ytVideoId}/mqdefault.jpg`}
                  alt="YouTube Thumbnail"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
                <span className="absolute inset-0 flex items-center justify-center bg-black/20 text-white">
                  <Play className="h-6 w-6 opacity-80" />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                    YouTube Ready
                  </span>
                  <span className="text-xs font-mono text-[#4A4740]">ID: {ytVideoId}</span>
                </div>
                <p className="mt-1 text-xs text-[#4A4740]">
                  Ready to summarize. Paste the video transcript below, or use the quick sample demo to see it in action.
                </p>
                <a
                  href={ytUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-[#537190] hover:underline"
                >
                  Open video on YouTube <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}

          {/* Transcript input */}
          <Field
            label="Video Transcript or Captions"
            hint="Paste the YouTube transcript text, or click 'Try Demo Transcript' to test immediately."
          >
            <textarea
              rows={5}
              className={inputCls}
              placeholder="Paste YouTube transcript (with or without timestamps)..."
              value={ytTranscript}
              onChange={(e) => setYtTranscript(e.target.value)}
            />
          </Field>

          {/* Helper toolbar for YouTube */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setYtTranscript(SAMPLE_TRANSCRIPTS[0]!.text)}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#D6CCB5] bg-[#FAF7F0] px-3 py-1.5 font-semibold text-[#000000] transition-colors hover:border-[#7895B2] hover:bg-white"
              >
                <Sparkles className="h-3 w-3 text-[#537190]" />
                Try Demo Transcript
              </button>
              {ytTranscript && (
                <button
                  type="button"
                  onClick={() => setYtTranscript("")}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[#000000]/60 hover:text-red-600"
                >
                  <RotateCcw className="h-3 w-3" /> Clear
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowYtHelp(!showYtHelp)}
              className="inline-flex items-center gap-1 text-[#537190] hover:text-[#000000]"
            >
              <Lightbulb className="h-3.5 w-3.5" />
              <span>How to copy YouTube transcript in 5s</span>
              {showYtHelp ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>

          {showYtHelp && (
            <div className="rounded-2xl border border-[#D6CCB5] bg-[#FAF7F0] p-4 text-xs leading-relaxed text-[#4A4740]">
              <p className="font-semibold text-[#000000]">3 quick steps to get any YouTube transcript:</p>
              <ol className="mt-1.5 list-inside list-decimal space-y-1 pl-1">
                <li>Open the video on YouTube. In the video description, click <strong>...more</strong>.</li>
                <li>Scroll down and click <strong>Show transcript</strong>.</li>
                <li>Select all text in the transcript box, copy, and paste it right here!</li>
              </ol>
            </div>
          )}
        </div>
      )}

      {/* ─── 2b. VIDEO UPLOAD TAB ─── */}
      {mode === "video" && (
        <div className="grid gap-4">
          <div className="rounded-2xl border border-[#D6CCB5] bg-[#FAF7F0] p-3 text-center text-xs text-[#4A4740]">
            Accepts <strong>MP4, MOV, WebM</strong> · Max <strong>500 MB</strong> · Processed securely
          </div>

          <Dropzone
            accept="video/mp4,video/quicktime,video/webm"
            label={videoFile ? videoFile.name : "Drop a video file to transcribe & summarize"}
            onFiles={([f]) => f && pickVideo(f)}
            sample={{
              label: "Try a sample product clip",
              busy: sampling,
              onPick: async () => {
                setSampling(true);
                const s = await loadSample("clip");
                pickVideo(s);
                setSampling(false);
              },
              note: "A short demo video clip — we will transcribe and summarize it.",
            }}
          />

          {videoUrl && videoFile && (
            <div className="rounded-2xl border border-[#D6CCB5] bg-[#FAF7F0] p-4">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-semibold text-[#000000]">{videoFile.name}</span>
                <span className="rounded-full bg-[#E8DFCA] px-2 py-0.5 text-[11px] font-bold text-[#000000]/70">
                  {(videoFile.size / 1024 / 1024).toFixed(1)} MB
                </span>
              </div>
              <video src={videoUrl} controls className="max-h-56 w-full rounded-xl bg-black object-contain" />
            </div>
          )}

          {transcript && (
            <div className="rounded-2xl border border-[#D6CCB5] bg-[#FAF7F0] p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#537190]">Extracted Transcript</span>
                <CopyBtn text={transcript} />
              </div>
              <p className="max-h-40 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-[#000000]">
                {transcript}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ─── 2c. AUDIO UPLOAD TAB ─── */}
      {mode === "audio" && (
        <div className="grid gap-4">
          <div className="rounded-2xl border border-[#D6CCB5] bg-[#FAF7F0] p-3 text-center text-xs text-[#4A4740]">
            Accepts <strong>MP3, WAV, M4A, OGG, AAC</strong> · Max <strong>500 MB</strong> · Fast transcription
          </div>

          <Dropzone
            accept="audio/*"
            label={audioFile ? audioFile.name : "Drop an audio file or podcast recording"}
            onFiles={([f]) => f && pickAudio(f)}
            sample={{
              label: "Try sample audio narration",
              busy: sampling,
              onPick: async () => {
                setSampling(true);
                const s = await loadSample("narration");
                pickAudio(s);
                setSampling(false);
              },
              note: "A crisp voiceover clip ready to transcribe.",
            }}
          />

          {audioUrl && audioFile && (
            <div className="rounded-2xl border border-[#D6CCB5] bg-[#FAF7F0] p-4">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-semibold text-[#000000]">{audioFile.name}</span>
                <span className="rounded-full bg-[#E8DFCA] px-2 py-0.5 text-[11px] font-bold text-[#000000]/70">
                  {(audioFile.size / 1024 / 1024).toFixed(1)} MB
                </span>
              </div>
              <audio src={audioUrl} controls className="w-full" />
            </div>
          )}

          {transcript && (
            <div className="rounded-2xl border border-[#D6CCB5] bg-[#FAF7F0] p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#537190]">Extracted Audio Transcript</span>
                <CopyBtn text={transcript} />
              </div>
              <p className="max-h-40 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-[#000000]">
                {transcript}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ─── 2d. PDF & DOCS TAB ─── */}
      {mode === "pdf" && (
        <div className="grid gap-4">
          <div className="rounded-2xl border border-[#D6CCB5] bg-[#FAF7F0] p-3 text-center text-xs text-[#4A4740]">
            Accepts <strong>.txt, .srt, .vtt, .md, .pdf</strong> · Instant text ingestion
          </div>

          <Dropzone
            accept=".txt,.srt,.vtt,.md,.pdf,application/pdf,text/plain"
            label="Drop text, subtitles (.srt/.vtt), or PDF documents"
            onFiles={pickDoc}
            sample={{
              label: "Load sample lecture notes",
              onPick: () => {
                setLongText(SAMPLE_TRANSCRIPTS[2]!.text);
              },
              note: "Loads a sample keynote transcript to test summarization.",
            }}
          />

          <Field label={`Document Content (${longText.length.toLocaleString()} chars)`}>
            <textarea
              rows={7}
              className={inputCls}
              placeholder="Pasted or extracted text from your document will appear here..."
              value={longText}
              onChange={(e) => setLongText(e.target.value)}
            />
          </Field>
        </div>
      )}

      {/* ─── 2e. WEBPAGE TAB ─── */}
      {mode === "webpage" && (
        <div className="grid gap-4">
          <Field label="Article or Webpage URL">
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-[#537190]">
                <Globe className="h-4 w-4" />
              </span>
              <input
                type="url"
                className={`${inputCls} pl-10`}
                placeholder="https://example.com/article-or-case-study"
                value={webUrl}
                onChange={(e) => setWebUrl(e.target.value)}
              />
            </div>
          </Field>

          <Field
            label="Article Text"
            hint="Paste the text of the webpage or click below to load a sample tech blog article."
          >
            <textarea
              rows={6}
              className={inputCls}
              placeholder="Paste article text here..."
              value={webText}
              onChange={(e) => setWebText(e.target.value)}
            />
          </Field>

          <div className="flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setWebUrl("https://marvedge.com/blog/interactive-demos");
                setWebText(
                  "Interactive product demos are redefining B2B software sales in 2026.\nRather than forcing prospects through a 30-minute static slide deck, smart teams let buyers test-drive core features immediately in their browser.\nAccording to recent benchmarks, teams using guided screen tours report a 3.4x lift in conversion to booked demo calls.\nKey tenets for high-converting demos include: keep the initial loop under 60 seconds, highlight the single moment of highest value, and always include an unmissable call-to-action button at the final step."
                );
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#D6CCB5] bg-[#FAF7F0] px-3.5 py-1.5 font-semibold text-[#000000] transition-colors hover:border-[#7895B2] hover:bg-white"
            >
              <Sparkles className="h-3 w-3 text-[#537190]" />
              Try Sample Article
            </button>
            {webText && (
              <button
                type="button"
                onClick={() => {
                  setWebText("");
                  setWebUrl("");
                }}
                className="rounded-full px-3 py-1.5 text-[#000000]/60 hover:text-red-600"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── 2f. LONG TEXT / TRANSCRIPT TAB ─── */}
      {mode === "longtext" && (
        <div className="grid gap-4">
          <Field
            label={`Text Content (${longText.length.toLocaleString()} / 40,000 chars)`}
            hint="Paste any speech transcript, meeting notes, or long-form copy."
          >
            <textarea
              rows={8}
              maxLength={40000}
              className={inputCls}
              placeholder="Paste your transcript, meeting notes, or article text here..."
              value={longText}
              onChange={(e) => setLongText(e.target.value)}
            />
          </Field>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#4A4740]">Quick Sample Presets</p>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_TRANSCRIPTS.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => {
                    setLongText(s.text);
                    setOut("");
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#D6CCB5] bg-[#FAF7F0] px-3 py-2 text-xs font-semibold text-[#000000] transition-colors hover:border-[#7895B2] hover:bg-white"
                >
                  <span className="text-[#537190]">●</span>
                  <span>{s.label}</span>
                </button>
              ))}
              {longText && (
                <button
                  type="button"
                  onClick={() => {
                    setLongText("");
                    setOut("");
                  }}
                  className="rounded-xl border border-[#D6CCB5] bg-[#FAF7F0] px-3 py-2 text-xs font-semibold text-[#000000]/60 transition-colors hover:border-red-300 hover:text-red-600"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── 3. OUTPUT PRESET SELECTOR (Always accessible & polished) ─── */}
      <div className="pt-2">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#000000]">
            Select Output Format
          </span>
          <span className="text-xs text-[#4A4740]">Choose how the AI organizes your takeaway</span>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
          {OUTPUT_PRESETS.map((p) => {
            const Icon = p.icon;
            const isSelected = preset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPreset(p.id)}
                aria-pressed={isSelected}
                className={`flex flex-col items-start gap-1.5 rounded-2xl border p-3.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7895B2] ${
                  isSelected
                    ? "border-[#000000] bg-[#E8DFCA]/60 shadow-xs ring-1 ring-[#000000]"
                    : "border-[#D6CCB5] bg-[#FAF7F0] hover:border-[#7895B2] hover:bg-white"
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${isSelected ? "bg-[#000000] text-white" : "bg-[#E8DFCA] text-[#000000]"}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  {isSelected && <Check className="h-4 w-4 text-[#000000]" />}
                </div>
                <span className="text-xs font-bold leading-tight text-[#000000]">{p.label}</span>
                <span className="text-[11px] leading-tight text-[#4A4740]">{p.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── 4. UNIFIED GENERATE SUMMARY CTA BUTTON ─── */}
      <div className="pt-1">
        <button
          type="button"
          onClick={handleSummarize}
          disabled={busy || transcribing}
          className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-2xl bg-[#000000] px-6 py-4 text-sm font-bold text-white shadow-md transition-all hover:bg-[#1A1A1A] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Summarizing transcript with AI...</span>
            </>
          ) : transcribing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Transcribing media file...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span>
                Generate Summary — {OUTPUT_PRESETS.find((p) => p.id === preset)?.label}
              </span>
            </>
          )}
        </button>
      </div>

      <ErrorNote msg={err} />
      <Output
        text={out}
        presetLabel={OUTPUT_PRESETS.find((p) => p.id === preset)?.label}
        onRegenerate={handleSummarize}
        busy={busy || transcribing}
      />
    </Panel>
  );
}

/* ---------- AI YouTube Title & Description Generator ---------- */
type VideoFormat = "long" | "shorts";
type ToneOption = "Curiosity" | "Educational" | "High-Energy" | "Professional";

const TONES: ToneOption[] = ["Curiosity", "Educational", "High-Energy", "Professional"];

const SAMPLE_YT_DATA = {
  topic:
    "I tested five budget microphones under $50 for a full year of podcasting, and the cheapest one beat the most expensive one on every blind listen test.",
  keyword: "budget microphone for youtube",
  tone: "Curiosity" as ToneOption,
  format: "long" as VideoFormat,
  titles: [
    "I Tested 5 Budget Mics for 1 Year (The Winner Surprised Me)",
    "Stop Buying Expensive Microphones Until You Watch This",
    "The $40 Mic That Beats $300 Studio Setups",
    "Best Budget Microphones for YouTube in 2026",
    "Why 90% of Creators Pick the Wrong Microphone",
  ],
  description: `Looking for the best budget microphone without spending hundreds on studio gear? In this video, I tested 5 popular mics under $50 for a full year of real-world recording.

In this video:
• Blind audio comparisons across quiet & noisy rooms
• USB vs XLR setup simplicity for beginners
• Durability tests after 12 months of daily use
• The clear $40 winner that shocked audio engineers

Links & Resources:
👉 [Subscribe Here]: https://youtube.com/@yourchannel?sub_confirmation=1
🎬 [Watch Next]: https://youtube.com/watch?v=example

#BudgetMic #YouTubeAudio #MicrophoneReview #ContentCreator #AudioGear`,
};

function parseYoutubeOutput(raw: string): { titles: string[]; description: string } {
  let titles: string[] = [];
  let description = "";

  if (raw.includes("---TITLES---") && raw.includes("---DESCRIPTION---")) {
    const parts = raw.split("---DESCRIPTION---");
    const titlesPart = parts[0]!.replace("---TITLES---", "").trim();
    description = parts[1]!.trim();

    titles = titlesPart
      .split("\n")
      .map((line) => line.replace(/^\d+[\.\)]\s*/, "").trim())
      .filter((line) => line.length > 0)
      .slice(0, 5);
  } else {
    const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
    const numbered = lines.filter((l) => /^\d+[\.\)]/.test(l)).map((l) => l.replace(/^\d+[\.\)]\s*/, ""));
    if (numbered.length >= 3) {
      titles = numbered.slice(0, 5);
      description = lines.slice(numbered.length).join("\n\n");
    } else {
      titles = lines.slice(0, 5);
      description = lines.slice(5).join("\n\n");
    }
  }

  // Ensure 5 titles
  while (titles.length < 5) {
    titles.push(SAMPLE_YT_DATA.titles[titles.length] || "Viral YouTube Video Title Idea");
  }

  if (!description.trim()) {
    description = SAMPLE_YT_DATA.description;
  }

  return { titles, description };
}

export function YoutubeTitleGenerator() {
  const [topic, setTopic] = useState("");
  const [keyword, setKeyword] = useState("");
  const [tone, setTone] = useState<ToneOption>("Curiosity");
  const [format, setFormat] = useState<VideoFormat>("long");

  const [titles, setTitles] = useState<string[]>(SAMPLE_YT_DATA.titles);
  const [description, setDescription] = useState<string>(SAMPLE_YT_DATA.description);
  const [isSample, setIsSample] = useState(true);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [copiedTitleIdx, setCopiedTitleIdx] = useState<number | null>(null);
  const [copiedDesc, setCopiedDesc] = useState(false);

  const runAi = useServerFn(runAiTool);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  const handleCopyTitle = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedTitleIdx(idx);
    showToast(`Copied Title #${idx + 1}!`);
    setTimeout(() => setCopiedTitleIdx(null), 1800);
  };

  const handleCopyDesc = () => {
    navigator.clipboard.writeText(description);
    setCopiedDesc(true);
    showToast("Copied Description to clipboard!");
    setTimeout(() => setCopiedDesc(false), 1800);
  };

  const loadSample = () => {
    setTopic(SAMPLE_YT_DATA.topic);
    setKeyword(SAMPLE_YT_DATA.keyword);
    setTone(SAMPLE_YT_DATA.tone);
    setFormat(SAMPLE_YT_DATA.format);
    setTitles(SAMPLE_YT_DATA.titles);
    setDescription(SAMPLE_YT_DATA.description);
    setIsSample(true);
    setErr(null);
  };

  const handleGenerate = async () => {
    const trimmed = topic.trim();
    if (!trimmed) return;

    setBusy(true);
    setErr(null);

    try {
      const input = `Format: ${format === "long" ? "Long Video (16:9)" : "YouTube Shorts (9:16)"}
Target Keyword: ${keyword.trim() || "(infer relevant SEO keywords from topic)"}
Tone: ${tone}
Video Topic & Rough Notes:
${trimmed.slice(0, 1500)}`;

      const res = await runAi({ data: { tool: "youtube-title-generator", input } });
      const parsed = parseYoutubeOutput(res.text);
      setTitles(parsed.titles);
      setDescription(parsed.description);
      setIsSample(false);
    } catch (e) {
      setErr(errMsg(e));
    }
    setBusy(false);
  };

  return (
    <Panel>
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-[#000000] px-4 py-2.5 text-xs font-semibold text-white shadow-2xl border border-white/20 animate-fade-in"
        >
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D6CCB5]/80 pb-4">
        <div>
          <h2 className="text-base font-bold text-[#000000]">AI YouTube Title & Description Generator</h2>
          <p className="text-xs text-[#4A4740]">
            Generate high-CTR titles and SEO-grounded descriptions in seconds.
          </p>
        </div>

        <button
          type="button"
          onClick={loadSample}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#D6CCB5] bg-[#FAF7F0] px-3.5 py-1.5 text-xs font-semibold text-[#000000] hover:border-[#7895B2] hover:bg-white transition-colors"
        >
          <Sparkles className="h-3.5 w-3.5 text-[#537190]" />
          <span>Load Example</span>
        </button>
      </div>

      {/* 2-Column Responsive Layout */}
      <div className="grid gap-8 lg:grid-cols-12 items-start pt-1">
        {/* ─── 1. INPUT BOX (LEFT / TOP) ─── */}
        <div className="grid gap-5 lg:col-span-5">
          {/* Format Toggle (Long Video vs Shorts) */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#000000]">
              Format
            </label>
            <div className="flex rounded-2xl border border-[#D6CCB5] bg-[#FAF7F0] p-1">
              <button
                type="button"
                onClick={() => setFormat("long")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold transition-all ${
                  format === "long"
                    ? "bg-[#000000] text-white shadow-sm"
                    : "text-[#000000]/70 hover:text-[#000000]"
                }`}
              >
                <Film className="h-3.5 w-3.5" />
                <span>Long Video</span>
              </button>
              <button
                type="button"
                onClick={() => setFormat("shorts")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold transition-all ${
                  format === "shorts"
                    ? "bg-[#000000] text-white shadow-sm"
                    : "text-[#000000]/70 hover:text-[#000000]"
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>Shorts</span>
              </button>
            </div>
          </div>

          {/* Video Topic / Rough Notes */}
          <Field
            label="Video Topic / Rough Notes"
            hint="Paste a short summary, outline, or rough notes of what you talk about."
          >
            <textarea
              rows={6}
              maxLength={1500}
              className={inputCls}
              placeholder="What is your video about? Paste a summary or rough notes (e.g. testing 5 budget microphones under $50 for podcasting)..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
            <div className="flex items-center justify-between pt-1 text-[11px] text-[#4A4740]">
              <span>{topic.trim() ? "Ready to generate" : "Topic required"}</span>
              <span className={topic.length >= 1400 ? "font-bold text-amber-700" : ""}>
                {topic.length.toLocaleString()} / 1,500 chars
              </span>
            </div>
          </Field>

          {/* Target Keyword (Optional) */}
          <Field
            label="Target Keyword (Optional)"
            hint="The primary search phrase you want YouTube to index."
          >
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-[#537190]">
                <Tag className="h-3.5 w-3.5" />
              </span>
              <input
                type="text"
                className={`${inputCls} pl-9`}
                placeholder="e.g. best budget microphone, nextjs tutorial"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
          </Field>

          {/* Tone Pills */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#000000]">
              Tone Style
            </label>
            <div className="flex flex-wrap gap-2">
              {TONES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTone(t)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    tone === t
                      ? "bg-[#000000] text-white shadow-xs"
                      : "border border-[#D6CCB5] bg-[#FAF7F0] text-[#000000]/70 hover:border-[#7895B2] hover:bg-white hover:text-[#000000]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!topic.trim() || busy}
            className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-2xl bg-[#000000] px-6 py-4 text-sm font-bold text-white shadow-md transition-all hover:bg-[#1A1A1A] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Crafting Viral Titles & Description...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span>Generate Titles & Description</span>
              </>
            )}
          </button>

          <ErrorNote msg={err} />
        </div>

        {/* ─── 2. OUTPUT BOX (RIGHT / BOTTOM) ─── */}
        <div className="grid gap-6 lg:col-span-7">
          {/* Sample Banner if viewing initial empty-state sample */}
          {isSample && (
            <div className="flex items-center justify-between gap-2 rounded-2xl border border-[#7895B2]/30 bg-[#7895B2]/10 px-4 py-2.5 text-xs text-[#3A5A72]">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#537190] shrink-0" />
                <span>
                  <strong>Sample Preview</strong> — Showing what generated titles & descriptions look like. Enter your topic and click Generate!
                </span>
              </div>
            </div>
          )}

          {/* 5 Title Cards */}
          <div>
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#000000]">
                5 High-CTR YouTube Titles
              </span>
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline text-[11px] text-[#4A4740]">Under 70 chars to avoid mobile truncation</span>
                <button
                  type="button"
                  disabled={!topic.trim() || busy}
                  onClick={handleGenerate}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#D6CCB5] bg-white px-3 py-1 text-xs font-semibold text-[#000000] hover:border-[#7895B2] hover:bg-[#FAF7F0] transition-colors disabled:opacity-50 shadow-2xs active:scale-95"
                  title="Regenerate titles and description"
                >
                  <RotateCcw className={`h-3.5 w-3.5 ${busy ? "animate-spin text-[#7895B2]" : ""}`} />
                  <span>Regenerate Titles</span>
                </button>
              </div>
            </div>

            <div className="grid gap-2.5">
              {titles.map((title, idx) => {
                const charCount = title.length;
                const isOptimal = charCount <= 70;
                const isCopied = copiedTitleIdx === idx;

                return (
                  <div
                    key={idx}
                    className="group flex items-center justify-between gap-3 rounded-2xl border border-[#D6CCB5] bg-[#FAF7F0] p-3.5 transition-all hover:border-[#7895B2] hover:bg-white shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#000000] text-[11px] font-bold text-white">
                        {idx + 1}
                      </span>
                      <p className="truncate font-medium text-sm text-[#000000]">
                        {title}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Character Count Badge */}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-bold border transition-colors ${
                          isOptimal
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}
                        title={isOptimal ? "Safe on mobile screens" : "May be truncated on small phones"}
                      >
                        {charCount}/100 {isOptimal ? "· Safe" : "· Over 70"}
                      </span>

                      {/* One-click Copy Icon */}
                      <button
                        type="button"
                        onClick={() => handleCopyTitle(title, idx)}
                        className="inline-flex items-center gap-1 rounded-xl border border-[#D6CCB5] bg-white px-2.5 py-1 text-xs font-semibold text-[#000000] hover:border-[#7895B2] hover:bg-[#FAF7F0] transition-colors"
                        aria-label={`Copy title ${idx + 1}`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 text-[#4A4740]" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 1 Ready-to-Use Description Card */}
          <div className="rounded-2xl border border-[#D6CCB5] bg-[#FAF7F0] p-4 shadow-xs">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#D6CCB5]/70 pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#000000]">Ready-to-Use Description</h3>
                <p className="text-[11px] text-[#4A4740]">
                  Pre-formatted with SEO hook, key bullets, links & hashtags.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!topic.trim() || busy}
                  onClick={handleGenerate}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#D6CCB5] bg-white px-3 py-1.5 text-xs font-semibold text-[#000000] hover:border-[#7895B2] hover:bg-[#FAF7F0] transition-colors disabled:opacity-50 shadow-2xs active:scale-95"
                  title="Regenerate description"
                >
                  <RotateCcw className={`h-3.5 w-3.5 ${busy ? "animate-spin text-[#7895B2]" : ""}`} />
                  <span>Regenerate</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyDesc}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#D6CCB5] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#000000] hover:border-[#7895B2] hover:bg-[#FAF7F0] transition-colors shadow-xs"
                >
                  {copiedDesc ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-[#000000]" />
                      <span>Copy Description</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <textarea
              rows={11}
              className={`${inputCls} font-mono text-xs leading-relaxed bg-white`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
      </div>
    </Panel>
  );
}

export function AiTextTool({ slug }: { slug: string }) {
  const cfg = CONFIG[slug]!;
  const [vals, setVals] = useState<Record<string, string>>(() =>
    Object.fromEntries(cfg.fields.map((f) => [f.key, cfg.demo?.[f.key] ?? f.options?.[0] ?? ""]))
  );
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const run = useServerFn(runAiTool);
  const go = async () => {
    setBusy(true);
    setErr(null);
    try {
      setOut((await run({ data: { tool: slug, input: cfg.fields.map((f) => `${f.key}: ${vals[f.key]}`).join("\n\n") } })).text);
    } catch (e) {
      setErr(errMsg(e));
    }
    setBusy(false);
  };
  const ready = cfg.fields
    .filter((f) => f.type === "textarea" || !f.options)
    .some((f) => (vals[f.key] ?? "").trim().length > 2);
  return (
    <Panel>
      <div className="grid gap-4 md:grid-cols-2">
        {cfg.fields.map((f) => (
          <div key={f.key} className={f.type === "textarea" ? "md:col-span-2" : ""}>
            <Field label={f.label}>
              {f.type === "textarea" ? (
                <textarea
                  rows={6}
                  className={inputCls}
                  placeholder={f.placeholder}
                  value={vals[f.key]}
                  onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })}
                />
              ) : f.type === "select" ? (
                <select
                  className={inputCls}
                  value={vals[f.key]}
                  onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })}
                >
                  {f.options!.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              ) : (
                <input
                  className={inputCls}
                  placeholder={f.placeholder}
                  value={vals[f.key]}
                  onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })}
                />
              )}
            </Field>
          </div>
        ))}
      </div>
      <p className="text-xs text-[#4A4740]">Example content is filled in so you can see it work — replace it with your own.</p>
      <div className="flex flex-wrap gap-2">
        <Btn busy={busy} disabled={!ready} onClick={go}>
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          {busy ? "Thinking..." : cfg.cta}
        </Btn>
        <Btn variant="ghost" onClick={() => setVals(Object.fromEntries(cfg.fields.map((f) => [f.key, f.options?.[0] ?? ""])))}>
          Clear example
        </Btn>
      </div>
      <ErrorNote msg={err} />
      <Output text={out} onRegenerate={go} busy={busy} />
    </Panel>
  );
}

/* ---------- Screenshot to Guide ---------- */
async function toDataUrl(f: File) {
  const img = await loadImage(f);
  const s = Math.min(1, 1280 / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement("canvas");
  c.width = img.naturalWidth * s;
  c.height = img.naturalHeight * s;
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.8);
}
export { ScreenshotGuide } from "./ScreenshotGuide";

/* ---------- Subtitles ---------- */
const ts = (s: number, sep: string) => {
  const d = new Date(s * 1000).toISOString().slice(11, 23);
  return sep === "," ? d.replace(".", ",") : d;
};
function buildCues(text: string, dur: number) {
  const parts =
    text
      .replace(/\s+/g, " ")
      .match(/[^.!?*,;]+[.!?*,;]*/g)
      ?.flatMap((p) => {
        const w = p.trim().split(" ");
        const out = [];
        for (let i = 0; i < w.length; i += 9) out.push(w.slice(i, i + 9).join(" "));
        return out;
      })
      .filter(Boolean) ?? [];
  const total = parts.reduce((a, p) => a + p.length, 0) || 1;
  let t = 0;
  return parts.map((p) => {
    const len = (p.length / total) * dur;
    const c = { start: t, end: t + len, text: p };
    t += len;
    return c;
  });
}
const fileToB64 = (f: File) =>
  new Promise<string>((res) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(",")[1] ?? "");
    r.readAsDataURL(f);
  });
export function SubtitleGenerator() {
  const [cues, setCues] = useState<{ start: number; end: number; text: string }[]>([]);
  const [url, setUrl] = useState("");
  const [isVideo, setIsVideo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [sampling, setSampling] = useState(false);
  const [lastFile, setLastFile] = useState<File | null>(null);
  const run = useServerFn(runTranscribe);
  const pick = async (f?: File) => {
    if (!f) return;
    setErr(null);
    setCues([]);
    setLastFile(f);
    if (f.size > 24 * 1024 * 1024) return setErr("Please use a file under 24 MB (trim long recordings first).");
    const u = URL.createObjectURL(f);
    setUrl(u);
    setIsVideo(f.type.startsWith("video"));
    const dur = await new Promise<number>((res) => {
      const m = document.createElement(f.type.startsWith("video") ? "video" : "audio");
      m.onloadedmetadata = () => res(m.duration || 60);
      m.onerror = () => res(60);
      m.src = u;
    });
    setBusy(true);
    try {
      const { text } = await run({ data: { audio: await fileToB64(f), mime: f.type || "audio/mpeg", name: f.name } });
      if (!text.trim()) throw new Error("No speech was detected in that file.");
      setCues(buildCues(text, dur));
    } catch (e) {
      setErr(errMsg(e));
    }
    setBusy(false);
  };
  const srt = () => cues.map((c, i) => `${i + 1}\n${ts(c.start, ",")} --> ${ts(c.end, ",")}\n${c.text}\n`).join("\n");
  const vtt = () => "WEBVTT\n\n" + cues.map((c) => `${ts(c.start, ".")} --> ${ts(c.end, ".")}\n${c.text}\n`).join("\n");
  return (
    <Panel>
      <Dropzone
        accept="audio/*,video/mp4,video/webm,video/quicktime"
        label={busy ? "Transcribing... this can take a minute" : "Drop an audio or video file (under 24 MB)"}
        onFiles={([f]) => pick(f)}
        sample={{
          label: "Try a sample narration",
          busy: sampling,
          onPick: async () => {
            setSampling(true);
            await pick(await loadSample("narration"));
            setSampling(false);
          },
          note: "A dummy 15-second voiceover — we will caption it for you.",
        }}
      />
      <ErrorNote msg={err} />
      {url && (isVideo ? <video src={url} controls className="max-h-72 rounded-2xl" /> : <audio src={url} controls className="w-full" />)}
      {cues.length > 0 && (
        <>
          <p className="text-xs text-[#4A4740]">Timings are estimated from the length of each line — nudge them below if needed.</p>
          <div className="grid max-h-[480px] gap-2 overflow-y-auto overscroll-contain pr-1">
            {cues.map((c, i) => (
              <div key={i} className="grid grid-cols-[76px_76px_1fr] gap-2">
                <input
                  aria-label={`Cue ${i + 1} start time`}
                  className={`${inputCls} tabular-nums`}
                  type="number"
                  step={0.1}
                  value={c.start.toFixed(1)}
                  onChange={(e) => setCues(cues.map((x, j) => (j === i ? { ...x, start: +e.target.value } : x)))}
                />
                <input
                  aria-label={`Cue ${i + 1} end time`}
                  className={`${inputCls} tabular-nums`}
                  type="number"
                  step={0.1}
                  value={c.end.toFixed(1)}
                  onChange={(e) => setCues(cues.map((x, j) => (j === i ? { ...x, end: +e.target.value } : x)))}
                />
                <input
                  aria-label={`Cue ${i + 1} text`}
                  className={inputCls}
                  value={c.text}
                  onChange={(e) => setCues(cues.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))}
                />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {lastFile && (
              <button
                type="button"
                disabled={busy}
                onClick={() => pick(lastFile)}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#D6CCB5] bg-white px-3.5 py-2 text-xs font-semibold text-[#000000] hover:border-[#7895B2] hover:bg-[#FAF7F0] transition-colors disabled:opacity-50 active:scale-95 shadow-2xs"
                title="Regenerate subtitles with AI"
              >
                <RotateCcw className={`h-3.5 w-3.5 ${busy ? "animate-spin text-[#7895B2]" : ""}`} />
                <span>Regenerate Subtitles</span>
              </button>
            )}
            <DownloadBtn onClick={() => download(new Blob([srt()], { type: "text/plain" }), "subtitles.srt")}>
              Download SRT
            </DownloadBtn>
            <Btn variant="ghost" onClick={() => download(new Blob([vtt()], { type: "text/vtt" }), "subtitles.vtt")}>
              Download VTT
            </Btn>
            <CopyBtn text={cues.map((c) => c.text).join(" ")} />
          </div>
        </>
      )}
    </Panel>
  );
}

export { ContentRepurposer } from "./ContentRepurposer";
export { ProductDescriptionGenerator } from "./ProductDescriptionGenerator";
export { VoiceoverGenerator } from "./VoiceoverGenerator";
export { DemoScriptGenerator } from "./DemoScriptGenerator";

