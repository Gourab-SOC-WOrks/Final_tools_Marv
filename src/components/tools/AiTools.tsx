import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, X } from "lucide-react";
import { runAiTool, runTranscribe, runVoiceover } from "@/lib/ai.functions";
import { loadSample, loadScreens } from "@/lib/samples";
import { Btn, CopyBtn, DownloadBtn, Dropzone, ErrorNote, Field, Panel, download, inputCls, loadImage } from "./ui";

const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong. Please try again.");

function Output({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div aria-live="polite" className="grid gap-3 rounded-2xl border border-[#D6CCB5] bg-[#FAF7F0] p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#537190]">
          <Sparkles className="h-4 w-4" aria-hidden="true" /> Result
        </span>
        <CopyBtn text={text} />
      </div>
      <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-[#000000]">{text}</div>
    </div>
  );
}

type FieldDef = { key: string; label: string; type?: "textarea" | "select"; options?: string[]; placeholder?: string };
type ToolCfg = { fields: FieldDef[]; cta: string; demo: Record<string, string> };
const CONFIG: Record<string, ToolCfg> = {
  "video-summarizer": {
    cta: "Summarize",
    fields: [{ key: "Transcript", label: "Paste the video transcript", type: "textarea", placeholder: "Paste a transcript (with timestamps if you have them)Ã¢â‚¬Â¦" }, { key: "Length", label: "Summary length", type: "select", options: ["Short", "Medium", "Detailed"] }],
    demo: {
      Transcript: "00:00 Welcome back. Today I'm showing how a plain product walkthrough becomes an interactive demo.\n00:24 First, upload your recording Ã¢â‚¬â€ the tool runs in your browser, so the file never leaves your machine.\n01:02 Next, pick the steps your buyer actually cares about and hide the setup screens.\n01:41 Then put a call to action on the last step so viewers click straight through to pricing.\n02:10 Teams using these demos say sales conversations start with fewer, sharper questions.\n02:48 That's the loop: record once, publish everywhere, and see which step sells.",
      Length: "Medium",
    },
  },
  "youtube-title-generator": {
    cta: "Generate titles",
    fields: [{ key: "Topic or transcript", label: "What's your video about?", type: "textarea", placeholder: "e.g. I tested 5 budget mics for podcastingÃ¢â‚¬Â¦" }, { key: "Audience", label: "Who is it for?", placeholder: "Beginner podcasters" }, { key: "Style", label: "Style", type: "select", options: ["Curiosity", "How-to", "Listicle", "Bold & punchy"] }],
    demo: {
      "Topic or transcript": "I tested five budget microphones under $50 for a full year of podcasting, and the cheapest one beat the most expensive one on every listen test.",
      Audience: "Beginner podcasters",
      Style: "Curiosity",
    },
  },
  "content-repurposer": {
    cta: "Repurpose",
    fields: [{ key: "Source content", label: "Paste your blog post or transcript", type: "textarea" }, { key: "Voice", label: "Voice", type: "select", options: ["Same as original", "Professional", "Casual", "Witty"] }],
    demo: {
      "Source content": "Most teams record more product video than they can ever edit. Six walkthroughs a week, and only the best three get cut into something shareable Ã¢â‚¬â€ the rest sit in a drive. The fix isn't hiring another editor. It's shrinking what you already have: pull the three moments that answer the buyer's question, turn them into a loop you can post natively, and let the rest become a written guide. One recording should feed the whole channel, not one post.",
      Voice: "Casual",
    },
  },
  "product-description-generator": {
    cta: "Write description",
    fields: [{ key: "Product name", label: "Product name", placeholder: "Aurora ceramic mug" }, { key: "Details", label: "Key details & features", type: "textarea", placeholder: "350ml, handmade, dishwasher safeÃ¢â‚¬Â¦" }, { key: "Audience", label: "Ideal customer", placeholder: "Coffee lovers who like slow mornings" }, { key: "Tone", label: "Tone", type: "select", options: ["Warm", "Luxury", "Playful", "Technical", "Minimal"] }],
    demo: {
      "Product name": "Aurora ceramic mug",
      Details: "350ml stoneware, reactive lavender glaze, handmade in small batches, dishwasher and microwave safe, matte unglazed base",
      Audience: "Coffee lovers who like slow mornings",
      Tone: "Warm",
    },
  },
  "demo-script-generator": {
    cta: "Write demo script",
    fields: [{ key: "Product", label: "Product name & what it does", type: "textarea", placeholder: "Marvedge turns product walkthroughs into interactive demosÃ¢â‚¬Â¦" }, { key: "Key features", label: "Features to show", type: "textarea" }, { key: "Audience", label: "Who's watching?", placeholder: "Sales leaders at B2B SaaS companies" }, { key: "Length", label: "Length", type: "select", options: ["60 seconds", "2 minutes", "3 minutes"] }],
    demo: {
      Product: "Marvedge Ã¢â‚¬â€ turns product walkthroughs into interactive demos",
      "Key features": "Upload a recording, choose the steps buyers care about, add a call to action, share one link",
      Audience: "Sales leaders at B2B SaaS companies",
      Length: "60 seconds",
    },
  },
};

/* ---------- AI Video Summarizer ---------- */
type InputMode = "youtube" | "video" | "audio" | "pdf" | "webpage" | "longtext";
type YoutubeSubMode = "video" | "playlist";

const TOP_TABS: { id: InputMode; label: string; icon: string }[] = [
  { id: "youtube",  label: "YouTube",            icon: "â–¶" },
  { id: "video",    label: "Video",              icon: "ðŸŽ¬" },
  { id: "audio",    label: "Audio",              icon: "ðŸŽ™" },
  { id: "pdf",      label: "PDF, Image & More",  icon: "ðŸ“„" },
  { id: "webpage",  label: "Webpage",            icon: "ðŸŒ" },
  { id: "longtext", label: "Long Text",          icon: "ðŸ“" },
];

const OUTPUT_PRESETS = [
  { id: "default",   label: "General Summary",     emoji: "ðŸ“‹", desc: "TL;DR Â· Key points Â· Chapters" },
  { id: "executive", label: "Executive TL;DR",     emoji: "âš¡", desc: "3-sentence summary Â· Key decisions" },
  { id: "lecture",   label: "Lecture Notes",        emoji: "ðŸŽ“", desc: "Structured notes Â· Key terms" },
  { id: "meeting",   label: "Meeting Action Items", emoji: "âœ…", desc: "Action items Â· Owners Â· Open Qs" },
  { id: "clips",     label: "Clips & Show Notes",   emoji: "ðŸŽ¬", desc: "Quote clips Â· SEO notes Â· Hashtags" },
] as const;
type PresetId = (typeof OUTPUT_PRESETS)[number]["id"];

const SAMPLE_TRANSCRIPTS = [
  {
    label: "Product Demo (2 min)",
    emoji: "ðŸš€",
    text: "00:00 Welcome back. Today I'm showing how a plain product walkthrough becomes an interactive demo.\n00:24 First, upload your recording â€” the tool runs in your browser, so the file never leaves your machine.\n01:02 Next, pick the steps your buyer actually cares about and hide the setup screens.\n01:41 Then put a call to action on the last step so viewers click straight through to pricing.\n02:10 Teams using these demos say sales conversations start with fewer, sharper questions.\n02:48 That's the loop: record once, publish everywhere, and see which step sells.",
  },
  {
    label: "Team Meeting (8 min)",
    emoji: "ðŸ“‹",
    text: "00:00 Sarah: Alright everyone, let's kick off the weekly sync. First item â€” Q4 launch timeline.\n00:45 James: We're on track for November 28th but the payment integration is still pending sign-off from legal.\n01:30 Sarah: James, can you follow up with legal today and get a decision by EOD Thursday?\n02:15 James: Yes, I'll send the request right after this call.\n02:50 Sarah: Perfect. Next up â€” the influencer campaign. Maya, where are we?\n03:20 Maya: We've confirmed 4 of the 6 creators. The remaining two need a revised brief â€” I'm sending that today.\n04:00 Sarah: Good. Let's make sure all briefs are out by Wednesday. Maya, please confirm that by EOD.\n04:45 Sarah: Last item â€” budget. We're 12% over on design. We'll absorb it this quarter but let's flag any further overruns immediately.\n05:30 Sarah: Any blockers? None? Great â€” same time next week. Thanks everyone.",
  },
];

export function VideoSummarizer() {
  const [mode, setMode] = useState<InputMode>("youtube");
  const [ytSub, setYtSub] = useState<YoutubeSubMode>("video");
  const [ytLinks, setYtLinks] = useState<string[]>([""]);
  const [ytErr, setYtErr] = useState<string | null>(null);
  const [separateSpeaker, setSeparateSpeaker] = useState(false);
  const [quality, setQuality] = useState<"basic" | "premium">("basic");

  const [transcript, setTranscript] = useState("");
  const [longText, setLongText] = useState("");
  const [webUrl, setWebUrl] = useState("");
  const [webErr, setWebErr] = useState<string | null>(null);

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

  const pickVideo = (f: File) => {
    if (f.size > 500 * 1024 * 1024) { setErr("File exceeds 500 MB. Compress it first."); return; }
    setVideoFile(f); setVideoUrl(URL.createObjectURL(f)); setErr(null);
  };
  const pickAudio = (f: File) => {
    if (f.size > 500 * 1024 * 1024) { setErr("File exceeds 500 MB."); return; }
    setAudioFile(f); setAudioUrl(URL.createObjectURL(f)); setErr(null);
  };

  const transcribeFile = async (file: File) => {
    setTranscribing(true); setErr(null);
    try {
      const ab = await file.arrayBuffer();
      const b64 = btoa(String.fromCharCode(...new Uint8Array(ab)));
      const r = await runTx({ data: { audio: b64, mime: file.type, name: file.name } });
      setTranscript(r.text);
    } catch (e) { setErr(errMsg(e)); }
    setTranscribing(false);
  };

  const handleYtSubmit = () => {
    setYtErr(null);
    const filled = ytLinks.filter((l) => l.trim());
    if (!filled.length) return;
    const invalid = filled.find((l) => !/^https?:\/\//i.test(l));
    if (invalid) { setYtErr("All links must start with http:// or https://"); return; }
    setYtErr("Direct YouTube processing isn't available yet. Use YouTube's built-in transcript: click â‹¯ â†’ 'Show transcript' â†’ Copy all â†’ switch to Long Text tab.");
  };

  const handleWebSubmit = () => {
    setWebErr(null);
    if (!webUrl.trim()) return;
    if (!/^https?:\/\//i.test(webUrl)) { setWebErr("Please enter a valid URL."); return; }
    setWebErr("Webpage scraping isn't available yet. Copy the article text and paste it in the Long Text tab.");
  };

  const activeTranscript = mode === "longtext" ? longText : transcript;

  const summarize = async () => {
    const src = activeTranscript.trim();
    if (!src) return;
    setBusy(true); setErr(null);
    try {
      const selectedPreset = OUTPUT_PRESETS.find((p) => p.id === preset)!;
      const speakerNote = separateSpeaker ? "\nNote: Separate speakers in the output where identifiable." : "";
      const input = `Output Preset: ${selectedPreset.label}${speakerNote}\n\nTranscript:\n${src}`;
      setOut((await runAi({ data: { tool: "video-summarizer", input } })).text);
    } catch (e) { setErr(errMsg(e)); }
    setBusy(false);
  };

  const reset = () => {
    setTranscript(""); setLongText(""); setOut(""); setVideoFile(null); setVideoUrl(null);
    setAudioFile(null); setAudioUrl(null); setYtLinks([""]); setWebUrl("");
    setErr(null); setYtErr(null); setWebErr(null);
  };

  /* â”€â”€ pill helper â”€â”€ */
  const Pill = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
        active ? "bg-[#000000] text-white" : "border border-[#D6CCB5] bg-[#FAF7F0] text-[#000000]/70 hover:border-[#7895B2] hover:text-[#000000]"
      }`}
    >
      {children}
    </button>
  );

  /* â”€â”€ toggle helper â”€â”€ */
  const Toggle = ({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) => (
    <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#000000]/70 select-none">
      <span>{label}</span>
      <span
        role="switch"
        aria-checked={on}
        onClick={onToggle}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7895B2] ${on ? "bg-[#000000]" : "bg-[#D6CCB5]"}`}
      >
        <span className={`inline-block h-3.5 w-3.5 translate-x-0.5 rounded-full bg-white transition-transform ${on ? "translate-x-[18px]" : ""}`} />
      </span>
    </label>
  );

  return (
    <Panel>
      {/* â•â•â• 1. TOP TAB BAR â•â•â• */}
      <div className="flex flex-wrap gap-1 rounded-2xl border border-[#D6CCB5] bg-[#FAF7F0] p-1">
        {TOP_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => { setMode(tab.id); setErr(null); }}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
              mode === tab.id
                ? "bg-[#000000] text-white"
                : "text-[#000000]/60 hover:text-[#000000]"
            }`}
          >
            <span className="text-sm">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* â•â•â• 2a. YOUTUBE TAB â•â•â• */}
      {mode === "youtube" && (
        <div className="grid gap-4">
          {/* Sub-tabs */}
          <div className="flex gap-1 border-b border-[#D6CCB5]">
            {(["video", "playlist"] as YoutubeSubMode[]).map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => setYtSub(sub)}
                className={`px-4 py-2 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px ${
                  ytSub === sub
                    ? "border-[#7895B2] text-[#000000]"
                    : "border-transparent text-[#000000]/50 hover:text-[#000000]"
                }`}
              >
                YouTube {sub.charAt(0).toUpperCase() + sub.slice(1)}
              </button>
            ))}
          </div>

          {/* Link inputs */}
          <div className="grid gap-2">
            {ytLinks.map((link, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-lg">â–¶</span>
                <input
                  className={`${inputCls} flex-1`}
                  type="url"
                  placeholder={ytSub === "playlist"
                    ? "Paste the YouTube playlist link, e.g. https://youtube.com/playlist?list=â€¦"
                    : "Paste the YouTube video link, e.g. https://youtube.com/watch?v=example"}
                  value={link}
                  onChange={(e) => {
                    const updated = [...ytLinks];
                    updated[i] = e.target.value;
                    setYtLinks(updated);
                    setYtErr(null);
                  }}
                />
                {ytLinks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setYtLinks(ytLinks.filter((_, j) => j !== i))}
                    className="rounded-full p-1 text-[#000000]/40 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Toolbar row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Add More Link */}
            <button
              type="button"
              onClick={() => setYtLinks([...ytLinks, ""])}
              className="flex items-center gap-1.5 rounded-full border border-[#D6CCB5] bg-[#FAF7F0] px-3.5 py-1.5 text-xs font-semibold text-[#000000]/70 transition-colors hover:border-[#7895B2] hover:text-[#000000]"
            >
              <span className="text-base">âŠ•</span> Add More Link
            </button>

            <div className="h-4 w-px bg-[#D6CCB5]" />

            {/* Basic / Premium */}
            <div className="flex gap-1 rounded-full border border-[#D6CCB5] bg-[#FAF7F0] p-0.5">
              <Pill active={quality === "basic"} onClick={() => setQuality("basic")}>
                âš¡ Basic
              </Pill>
              <Pill active={quality === "premium"} onClick={() => setQuality("premium")}>
                âœ¨ Premium
              </Pill>
            </div>

            <div className="h-4 w-px bg-[#D6CCB5]" />

            {/* Separate Speaker */}
            <Toggle on={separateSpeaker} onToggle={() => setSeparateSpeaker(!separateSpeaker)} label="Separate Speaker" />
          </div>

          {ytErr && (
            <div className="rounded-xl border border-[#7895B2]/30 bg-[#7895B2]/10 px-4 py-3 text-sm text-[#3A5A72]">
              ðŸ’¡ {ytErr}
            </div>
          )}

          {/* Generate CTA */}
          <button
            type="button"
            onClick={handleYtSubmit}
            disabled={!ytLinks.some((l) => l.trim())}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#000000] px-6 py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Sparkles className="h-4 w-4" />
            Generate Summary
          </button>
        </div>
      )}

      {/* â•â•â• 2b. VIDEO UPLOAD TAB â•â•â• */}
      {mode === "video" && (
        <div className="grid gap-4">
          <div className="rounded-2xl border border-[#D6CCB5] bg-[#FAF7F0] p-3 text-center">
            <p className="text-xs text-[#4A4740]">
              Accepts <strong>MP4, MOV, WebM</strong> Â· Max <strong>500 MB</strong> / ~90 min Â· processed securely
            </p>
          </div>
          <Dropzone
            accept="video/mp4,video/quicktime,video/webm"
            label="Drop a video file to transcribe"
            onFiles={([f]) => pickVideo(f!)}
            sample={{
              label: "Try a sample clip",
              busy: sampling,
              onPick: async () => {
                setSampling(true);
                await pickVideo(await loadSample("clip"));
                setSampling(false);
              },
              note: "A short sample clip â€” we'll transcribe then summarize it.",
            }}
          />
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1 rounded-full border border-[#D6CCB5] bg-[#FAF7F0] p-0.5">
              <Pill active={quality === "basic"} onClick={() => setQuality("basic")}>âš¡ Basic</Pill>
              <Pill active={quality === "premium"} onClick={() => setQuality("premium")}>âœ¨ Premium</Pill>
            </div>
            <div className="h-4 w-px bg-[#D6CCB5]" />
            <Toggle on={separateSpeaker} onToggle={() => setSeparateSpeaker(!separateSpeaker)} label="Separate Speaker" />
          </div>
          {videoUrl && videoFile && (
            <div className="rounded-2xl border border-[#D6CCB5] bg-[#FAF7F0] p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold text-[#4A4740]">{videoFile.name}</p>
                <span className="rounded-full bg-[#E8DFCA] px-2.5 py-0.5 text-[10px] font-bold text-[#000000]/70">
                  {(videoFile.size / 1024 / 1024).toFixed(1)} MB
                </span>
              </div>
              <video src={videoUrl} controls className="max-h-48 w-full rounded-xl" />
            </div>
          )}
          <button
            type="button"
            onClick={() => videoFile && transcribeFile(videoFile)}
            disabled={!videoFile || transcribing}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#000000] px-6 py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Sparkles className="h-4 w-4" />
            {transcribing ? "Transcribingâ€¦" : "Generate Summary"}
          </button>
          {transcript && (
            <div className="rounded-2xl border border-[#D6CCB5] bg-[#FAF7F0] p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#537190]">Transcript extracted âœ“</p>
              <p className="max-h-40 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-[#000000]">{transcript}</p>
            </div>
          )}
        </div>
      )}

      {/* â•â•â• 2c. AUDIO TAB â•â•â• */}
      {mode === "audio" && (
        <div className="grid gap-4">
          <div className="rounded-2xl border border-[#D6CCB5] bg-[#FAF7F0] p-3 text-center">
            <p className="text-xs text-[#4A4740]">
              Accepts <strong>MP3, WAV, M4A, OGG</strong> Â· Max <strong>500 MB</strong> / ~90 min Â· processed securely
            </p>
          </div>
          <Dropzone
            accept="audio/*"
            label="Drop an audio file to transcribe"
            onFiles={([f]) => pickAudio(f!)}
            sample={{
              label: "Try a sample narration",
              busy: sampling,
              onPick: async () => {
                setSampling(true);
                await pickAudio(await loadSample("narration"));
                setSampling(false);
              },
              note: "A 15-second narration clip â€” we'll transcribe then summarize it.",
            }}
          />
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1 rounded-full border border-[#D6CCB5] bg-[#FAF7F0] p-0.5">
              <Pill active={quality === "basic"} onClick={() => setQuality("basic")}>âš¡ Basic</Pill>
              <Pill active={quality === "premium"} onClick={() => setQuality("premium")}>âœ¨ Premium</Pill>
            </div>
            <div className="h-4 w-px bg-[#D6CCB5]" />
            <Toggle on={separateSpeaker} onToggle={() => setSeparateSpeaker(!separateSpeaker)} label="Separate Speaker" />
          </div>
          {audioUrl && audioFile && (
            <div className="rounded-2xl border border-[#D6CCB5] bg-[#FAF7F0] p-4">
              <p className="mb-2 text-xs font-semibold text-[#4A4740]">{audioFile.name} Â· {(audioFile.size / 1024 / 1024).toFixed(1)} MB</p>
              <audio src={audioUrl} controls className="w-full" />
            </div>
          )}
          <button
            type="button"
            onClick={() => audioFile && transcribeFile(audioFile)}
            disabled={!audioFile || transcribing}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#000000] px-6 py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Sparkles className="h-4 w-4" />
            {transcribing ? "Transcribingâ€¦" : "Generate Summary"}
          </button>
          {transcript && (
            <div className="rounded-2xl border border-[#D6CCB5] bg-[#FAF7F0] p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#537190]">Transcript extracted âœ“</p>
              <p className="max-h-40 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-[#000000]">{transcript}</p>
            </div>
          )}
        </div>
      )}

      {/* â•â•â• 2d. PDF / IMAGE & MORE FILES TAB â•â•â• */}
      {mode === "pdf" && (
        <div className="grid gap-4">
          <div className="rounded-2xl border border-[#D6CCB5] bg-[#FAF7F0] p-4 text-center">
            <p className="text-sm font-semibold text-[#000000]">ðŸ“„ PDF, Image & More Files</p>
            <p className="mt-1 text-xs text-[#4A4740]">
              Support for PDF, DOCX, and image files is coming soon.<br />
              For now, copy the text content and paste it in the <strong>Long Text</strong> tab.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMode("longtext")}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#D6CCB5] bg-[#FAF7F0] px-6 py-3 text-sm font-semibold text-[#000000] transition-colors hover:border-[#7895B2]"
          >
            ðŸ“ Switch to Long Text
          </button>
        </div>
      )}

      {/* â•â•â• 2e. WEBPAGE TAB â•â•â• */}
      {mode === "webpage" && (
        <div className="grid gap-3">
          <Field label="Article or Webpage URL">
            <div className="flex gap-2">
              <input
                className={`${inputCls} flex-1`}
                type="url"
                placeholder="https://example.com/article"
                value={webUrl}
                onChange={(e) => { setWebUrl(e.target.value); setWebErr(null); }}
                onKeyDown={(e) => e.key === "Enter" && handleWebSubmit()}
              />
              <Btn onClick={handleWebSubmit} disabled={!webUrl.trim()}>Go</Btn>
            </div>
          </Field>
          {webErr && (
            <div className="rounded-xl border border-[#7895B2]/30 bg-[#7895B2]/10 px-4 py-3 text-sm text-[#3A5A72]">
              ðŸ’¡ {webErr}
            </div>
          )}
          <div className="rounded-2xl border border-[#D6CCB5] bg-[#FAF7F0] p-4 text-sm text-[#4A4740]">
            <p className="font-semibold text-[#000000]">Get the article text instantly</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
              <li>Select all text on the page (Ctrl+A) â†’ Copy â†’ paste in Long Text tab</li>
              <li>Use browser "Reader View" for clean copy</li>
              <li>Or use a browser extension like Mercury Reader</li>
            </ul>
          </div>
        </div>
      )}

      {/* â•â•â• 2f. LONG TEXT TAB â•â•â• */}
      {mode === "longtext" && (
        <div className="grid gap-4">
          <Field label={`Long Text (${longText.length.toLocaleString()} / 40,000 chars)`}>
            <textarea
              rows={9}
              maxLength={40000}
              className={inputCls}
              placeholder="Paste any long text here â€” article, transcript, meeting notes, PDF contentâ€¦"
              value={longText}
              onChange={(e) => setLongText(e.target.value)}
            />
          </Field>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#4A4740]">Or try a sample</p>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_TRANSCRIPTS.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => { setLongText(s.text); setOut(""); }}
                  className="flex items-center gap-2 rounded-xl border border-[#D6CCB5] bg-[#FAF7F0] px-3.5 py-2 text-xs font-semibold text-[#000000]/80 transition-colors hover:border-[#7895B2] hover:bg-white"
                >
                  <span>{s.emoji}</span> {s.label}
                </button>
              ))}
              {longText && (
                <button type="button" onClick={() => { setLongText(""); setOut(""); }}
                  className="rounded-xl border border-[#D6CCB5] bg-[#FAF7F0] px-3.5 py-2 text-xs font-semibold text-[#000000]/50 transition-colors hover:border-red-300 hover:text-red-600">
                  âœ• Clear
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Toggle on={separateSpeaker} onToggle={() => setSeparateSpeaker(!separateSpeaker)} label="Separate Speaker" />
          </div>
        </div>
      )}

      {/* â•â•â• 3. OUTPUT PRESET SELECTOR â•â•â• */}
      {activeTranscript.trim().length > 2 && (
        <>
          <div>
            <p className="mb-3 text-sm font-semibold text-[#000000]">Output format</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {OUTPUT_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPreset(p.id)}
                  aria-pressed={preset === p.id}
                  className={`flex flex-col items-start gap-1 rounded-2xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7895B2] ${
                    preset === p.id
                      ? "border-[#000000] bg-[#E8DFCA]/60"
                      : "border-[#D6CCB5] bg-[#FAF7F0] hover:border-[#7895B2] hover:bg-white"
                  }`}
                >
                  <span className="text-xl">{p.emoji}</span>
                  <span className="text-[11px] font-bold leading-tight text-[#000000]">{p.label}</span>
                  <span className="text-[9px] leading-tight text-[#4A4740]">{p.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Generate Summary CTA */}
          <button
            type="button"
            onClick={summarize}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#000000] px-6 py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy
              ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Summarizingâ€¦</>
              : <><Sparkles className="h-4 w-4" /> Generate Summary â€” {OUTPUT_PRESETS.find((p) => p.id === preset)?.label}</>
            }
          </button>
        </>
      )}

      <ErrorNote msg={err} />
      <Output text={out} />
    </Panel>
  );
}
export function AiTextTool({ slug }: { slug: string }) {
  const cfg = CONFIG[slug]!;
  const [vals, setVals] = useState<Record<string, string>>(() => Object.fromEntries(cfg.fields.map((f) => [f.key, cfg.demo?.[f.key] ?? f.options?.[0] ?? ""])));
  const [out, setOut] = useState(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  const run = useServerFn(runAiTool);
  const go = async () => {
    setBusy(true); setErr(null);
    try { setOut((await run({ data: { tool: slug, input: cfg.fields.map((f) => `${f.key}: ${vals[f.key]}`).join("\n\n") } })).text); }
    catch (e) { setErr(errMsg(e)); }
    setBusy(false);
  };
  const ready = cfg.fields.filter((f) => f.type === "textarea" || !f.options).some((f) => (vals[f.key] ?? "").trim().length > 2);
  return (
    <Panel>
      <div className="grid gap-4 md:grid-cols-2">
        {cfg.fields.map((f) => (
          <div key={f.key} className={f.type === "textarea" ? "md:col-span-2" : ""}>
            <Field label={f.label}>
              {f.type === "textarea" ? <textarea rows={6} className={inputCls} placeholder={f.placeholder} value={vals[f.key]} onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })} />
                : f.type === "select" ? <select className={inputCls} value={vals[f.key]} onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })}>{f.options!.map((o) => <option key={o}>{o}</option>)}</select>
                : <input className={inputCls} placeholder={f.placeholder} value={vals[f.key]} onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })} />}
            </Field>
          </div>
        ))}
      </div>
      <p className="text-xs text-[#4A4740]">Example content is filled in so you can see it work Ã¢â‚¬â€ replace it with your own.</p>
      <div className="flex flex-wrap gap-2">
        <Btn busy={busy} disabled={!ready} onClick={go}><Sparkles className="h-4 w-4" aria-hidden="true" />{busy ? "ThinkingÃ¢â‚¬Â¦" : cfg.cta}</Btn>
        <Btn variant="ghost" onClick={() => setVals(Object.fromEntries(cfg.fields.map((f) => [f.key, f.options?.[0] ?? ""])))}>Clear example</Btn>
      </div>
      <ErrorNote msg={err} />
      <Output text={out} />
    </Panel>
  );
}

/* ---------- Screenshot to Guide ---------- */
async function toDataUrl(f: File) {
  const img = await loadImage(f);
  const s = Math.min(1, 1280 / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement("canvas"); c.width = img.naturalWidth * s; c.height = img.naturalHeight * s;
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.8);
}
export function ScreenshotGuide() {
  const [shots, setShots] = useState<{ url: string; note: string }[]>([]);
  const [title, setTitle] = useState("");
  const [out, setOut] = useState(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  const [sampling, setSampling] = useState(false);
  const run = useServerFn(runAiTool);
  const add = async (fs: File[]) => { const n = await Promise.all(fs.slice(0, 10 - shots.length).map(toDataUrl)); setShots((s) => [...s, ...n.map((url) => ({ url, note: "" }))]); };
  const go = async () => {
    setBusy(true); setErr(null);
    const input = `Guide topic: ${title || "(infer from screenshots)"}\n\n` + shots.map((s, i) => `Screenshot ${i + 1} note: ${s.note || "(none)"}`).join("\n");
    try { setOut((await run({ data: { tool: "screenshot-to-guide", input, images: shots.map((s) => s.url) } })).text); } catch (e) { setErr(errMsg(e)); }
    setBusy(false);
  };
  return (
    <Panel>
      <Field label="What is this guide for?"><input className={inputCls} placeholder="How to invite a teammate" value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
      {shots.length < 10 && <Dropzone accept="image/*" multiple label="Drop screenshots in order (up to 10)" onFiles={add}
        sample={{ label: "Try sample screenshots", busy: sampling, onPick: async () => { setSampling(true); const fs = await loadScreens(); await add(fs); setTitle((t) => t || "How to publish a Marvedge demo"); setSampling(false); }, note: "Three dummy app screens, already in order." }} />}
      {shots.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shots.map((s, i) => (
            <div key={i} className="relative grid gap-2 rounded-2xl border border-[#D6CCB5] bg-[#FAF7F0] p-3">
              <span className="absolute -left-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#000000] text-xs font-bold tabular-nums text-[#FFFFFF] shadow-sm">{i + 1}</span>
              <button
                type="button"
                aria-label={`Remove screenshot ${i + 1}`}
                onClick={() => setShots(shots.filter((_, j) => j !== i))}
                className="absolute right-2 top-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-[#D6CCB5] bg-[#FFFFFF] text-[#000000] shadow-xs transition-colors hover:bg-[#E8DFCA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7895B2]"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <img src={s.url} alt={s.note || `Screenshot ${i + 1}`} className="h-32 w-full rounded-lg border border-[#D6CCB5] bg-[#FFFFFF] object-cover" />
              <input className={inputCls.replace("bg-[#FAF7F0]", "bg-[#FFFFFF]")} placeholder="Optional note: what happens here?" value={s.note} onChange={(e) => setShots(shots.map((x, j) => (j === i ? { ...x, note: e.target.value } : x)))} />
            </div>
          ))}
        </div>
      )}
      <div><Btn busy={busy} disabled={!shots.length} onClick={go}><Sparkles className="h-4 w-4" aria-hidden="true" />{busy ? "Writing guideÃ¢â‚¬Â¦" : "Generate guide"}</Btn></div>
      <ErrorNote msg={err} />
      <Output text={out} />
      {out && <p className="text-xs text-[#4A4740]">Always review AI-written steps before sharing.</p>}
    </Panel>
  );
}

/* ---------- Subtitles ---------- */
const ts = (s: number, sep: string) => { const d = new Date(s * 1000).toISOString().slice(11, 23); return sep === "," ? d.replace(".", ",") : d; };
function buildCues(text: string, dur: number) {
  const parts = text.replace(/\s+/g, " ").match(/[^.!?,;]+[.!?,;]*/g)?.flatMap((p) => { const w = p.trim().split(" "); const out = []; for (let i = 0; i < w.length; i += 9) out.push(w.slice(i, i + 9).join(" ")); return out; }).filter(Boolean) ?? [];
  const total = parts.reduce((a, p) => a + p.length, 0) || 1; let t = 0;
  return parts.map((p) => { const len = (p.length / total) * dur; const c = { start: t, end: t + len, text: p }; t += len; return c; });
}
const fileToB64 = (f: File) => new Promise<string>((res) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(",")[1] ?? ""); r.readAsDataURL(f); });
export function SubtitleGenerator() {
  const [cues, setCues] = useState<{ start: number; end: number; text: string }[]>([]);
  const [url, setUrl] = useState(""); const [isVideo, setIsVideo] = useState(false);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  const [sampling, setSampling] = useState(false);
  const run = useServerFn(runTranscribe);
  const pick = async (f?: File) => {
    if (!f) return; setErr(null); setCues([]);
    if (f.size > 24 * 1024 * 1024) return setErr("Please use a file under 24 MB (trim long recordings first).");
    const u = URL.createObjectURL(f); setUrl(u); setIsVideo(f.type.startsWith("video"));
    const dur = await new Promise<number>((res) => { const m = document.createElement(f.type.startsWith("video") ? "video" : "audio"); m.onloadedmetadata = () => res(m.duration || 60); m.onerror = () => res(60); m.src = u; });
    setBusy(true);
    try { const { text } = await run({ data: { audio: await fileToB64(f), mime: f.type || "audio/mpeg", name: f.name } }); if (!text.trim()) throw new Error("No speech was detected in that file."); setCues(buildCues(text, dur)); }
    catch (e) { setErr(errMsg(e)); }
    setBusy(false);
  };
  const srt = () => cues.map((c, i) => `${i + 1}\n${ts(c.start, ",")} --> ${ts(c.end, ",")}\n${c.text}\n`).join("\n");
  const vtt = () => "WEBVTT\n\n" + cues.map((c) => `${ts(c.start, ".")} --> ${ts(c.end, ".")}\n${c.text}\n`).join("\n");
  return (
    <Panel>
      <Dropzone accept="audio/*,video/mp4,video/webm,video/quicktime" label={busy ? "TranscribingÃ¢â‚¬Â¦ this can take a minute" : "Drop an audio or video file (under 24 MB)"} onFiles={([f]) => pick(f)}
        sample={{ label: "Try a sample narration", busy: sampling, onPick: async () => { setSampling(true); await pick(await loadSample("narration")); setSampling(false); }, note: "A dummy 15-second voiceover Ã¢â‚¬â€ we'll caption it for you." }} />
      <ErrorNote msg={err} />
      {url && (isVideo ? <video src={url} controls className="max-h-72 rounded-2xl" /> : <audio src={url} controls className="w-full" />)}
      {cues.length > 0 && (
        <>
          <p className="text-xs text-[#4A4740]">Timings are estimated from the length of each line Ã¢â‚¬â€ nudge them below if needed.</p>
          <div className="grid max-h-[480px] gap-2 overflow-y-auto overscroll-contain pr-1">
            {cues.map((c, i) => (
              <div key={i} className="grid grid-cols-[76px_76px_1fr] gap-2">
                <input aria-label={`Cue ${i + 1} start time`} className={`${inputCls} tabular-nums`} type="number" step={0.1} value={c.start.toFixed(1)} onChange={(e) => setCues(cues.map((x, j) => (j === i ? { ...x, start: +e.target.value } : x)))} />
                <input aria-label={`Cue ${i + 1} end time`} className={`${inputCls} tabular-nums`} type="number" step={0.1} value={c.end.toFixed(1)} onChange={(e) => setCues(cues.map((x, j) => (j === i ? { ...x, end: +e.target.value } : x)))} />
                <input aria-label={`Cue ${i + 1} text`} className={inputCls} value={c.text} onChange={(e) => setCues(cues.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <DownloadBtn onClick={() => download(new Blob([srt()], { type: "text/plain" }), "subtitles.srt")}>Download SRT</DownloadBtn>
            <Btn variant="ghost" onClick={() => download(new Blob([vtt()], { type: "text/vtt" }), "subtitles.vtt")}>Download VTT</Btn>
            <CopyBtn text={cues.map((c) => c.text).join(" ")} />
          </div>
        </>
      )}
    </Panel>
  );
}

/* ---------- Voiceover ---------- */
const VOICES = [["Kore", "Firm & clear"], ["Puck", "Upbeat"], ["Charon", "Informative"], ["Aoede", "Breezy"], ["Fenrir", "Excitable"], ["Leda", "Youthful"]];
export function VoiceoverGenerator() {
  const [text, setText] = useState("Welcome to Marvedge. In the next sixty seconds, I'll show you how to turn any product into a demo that sells itself.");
  const [voice, setVoice] = useState("Kore"); const [style, setStyle] = useState("");
  const [audio, setAudio] = useState<{ url: string; blob: Blob } | null>(null);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  const run = useServerFn(runVoiceover);
  const go = async () => {
    setBusy(true); setErr(null);
    try {
      const r = await run({ data: { text: style ? `Say ${style}: ${text}` : text, voice } });
      const blob = new Blob([Uint8Array.from(atob(r.audio), (c) => c.charCodeAt(0))], { type: r.type });
      setAudio({ blob, url: URL.createObjectURL(blob) });
    } catch (e) { setErr(errMsg(e)); }
    setBusy(false);
  };
  return (
    <Panel>
      <Field label={`Script (${text.length}/4000)`}><textarea rows={6} maxLength={4000} className={inputCls} value={text} onChange={(e) => setText(e.target.value)} /></Field>
      <Field label="Voice">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {VOICES.map(([v, d]) => (
            <button
              key={v}
              type="button"
              aria-pressed={voice === v}
              onClick={() => setVoice(v ?? "Kore")}
              className={`cursor-pointer rounded-2xl border p-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7895B2] ${
                voice === v
                  ? "border-[#000000] bg-[#E8DFCA]/60 text-[#000000]"
                  : "border-[#D6CCB5] bg-[#FAF7F0] text-[#000000] hover:border-[#7895B2] hover:bg-[#FFFFFF]"
              }`}
            >
              <p className="font-bold">{v}</p>
              <p className="text-xs text-[#4A4740]">{d}</p>
            </button>
          ))}
        </div>
      </Field>
      <Field label="Delivery (optional)"><input className={inputCls} placeholder="warmly, with energy" value={style} onChange={(e) => setStyle(e.target.value)} /></Field>
      <div><Btn busy={busy} disabled={!text.trim()} onClick={go}><Sparkles className="h-4 w-4" aria-hidden="true" />{busy ? "RecordingÃ¢â‚¬Â¦" : "Generate voiceover"}</Btn></div>
      <ErrorNote msg={err} />
      {audio && <div aria-live="polite" className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#D6CCB5] bg-[#FAF7F0] p-4"><audio src={audio.url} controls autoPlay className="flex-1" /><DownloadBtn onClick={() => download(audio.blob, "voiceover.wav")} /></div>}
    </Panel>
  );
}
