import { useState, useMemo, useEffect } from "react";
import {
  Sparkles,
  Clapperboard,
  Mic,
  Monitor,
  Copy,
  Check,
  RotateCcw,
  Plus,
  Trash2,
  Globe,
  Clock,
  FileText,
  Share2,
  ExternalLink,
  ChevronRight,
  Info,
  Sliders,
  Download,
  Play,
  Volume2,
  Layers,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { runAiTool } from "@/lib/ai.functions";
import { useServerFn } from "@tanstack/react-start";

export interface DemoScene {
  id: string;
  startSec: number; // e.g. 0
  endSec: number; // e.g. 5
  timeRange: string; // e.g. "00:00–00:05"
  name: string; // e.g. "Hook"
  durationSec: number; // e.g. 5
  visualCue: string; // e.g. "Screen recording: Paste YouTube link..."
  voiceover: string; // e.g. "You just recorded a two-hour podcast..."
}

export type DemoFormat = "30s" | "60s" | "2min";
export type HookAngle = "problem" | "before_after" | "show_tell";
export type AspectRatioType = "16:9" | "9:16" | "1:1" | "4:5";

export function formatTimecode(sec: number): string {
  const m = Math.floor(Math.max(0, sec) / 60);
  const s = Math.floor(Math.max(0, sec) % 60);
  return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
}

export function parseTimecode(str: string): number {
  const parts = str.trim().split(":");
  if (parts.length === 2) {
    const m = parseInt(parts[0] || "0", 10) || 0;
    const s = parseInt(parts[1] || "0", 10) || 0;
    return m * 60 + s;
  }
  return parseInt(str, 10) || 0;
}

export const ASPECT_RATIOS = [
  {
    id: "16:9",
    label: "16:9 Landscape",
    sub: "YouTube / Desktop / Loom",
    iconBox: "w-5 h-3",
    tag: "16:9 Desktop",
    framingTip: "Widescreen 16:9: Full desktop screen capture with browser URL bar & dashboard.",
  },
  {
    id: "9:16",
    label: "9:16 Vertical",
    sub: "Shorts / TikTok / Reels",
    iconBox: "w-3 h-5",
    tag: "9:16 Mobile",
    framingTip: "Vertical 9:16: Center-crop key actions into middle 60% for mobile feeds.",
  },
  {
    id: "1:1",
    label: "1:1 Square",
    sub: "LinkedIn / X Feeds",
    iconBox: "w-4 h-4",
    tag: "1:1 Square",
    framingTip: "Square 1:1: Tight crop on UI cards, metrics, and cursor clicks.",
  },
  {
    id: "4:5",
    label: "4:5 Portrait",
    sub: "Instagram Feed",
    iconBox: "w-3.5 h-4.5",
    tag: "4:5 Feed",
    framingTip: "Portrait 4:5: Optimized vertical feed view with subtitle padding.",
  },
] as const;

export const FORMAT_OPTIONS = [
  { id: "30s", label: "30s Launch Teaser", desc: "X / Product Hunt viral hook", targetWords: 75, targetSec: 30 },
  { id: "60s", label: "60s Explainer", desc: "Classic high-converting SaaS demo", targetWords: 150, targetSec: 60 },
  { id: "2min", label: "2-Min Loom Walkthrough", desc: "Detailed step-by-step workflow", targetWords: 300, targetSec: 120 },
] as const;

export const HOOK_OPTIONS = [
  { id: "problem", label: "Problem-Agitation", desc: "Start with the creator's biggest headache" },
  { id: "before_after", label: "Before vs. After", desc: "Contrast the painful old way with the new way" },
  { id: "show_tell", label: "Direct Show-Don't-Tell", desc: "Jump straight into the magic 1-click feature" },
] as const;

export const SAMPLE_PRODUCT = {
  name: "ClipFlow — Turn long podcasts into viral Shorts in 1 click",
  url: "https://clipflow.ai",
  features:
    "1. Paste any YouTube podcast link or upload MP4\n2. AI auto-detects viral moments, punchlines, and retention hooks\n3. Auto-crops to vertical 9:16 with animated karaoke captions & speaker tracking\n4. 1-click export to TikTok, Instagram Reels, and YouTube Shorts",
  audience: "Busy solo podcasters, video editors, and social media agencies",
};

export const INITIAL_SAMPLE_SCENES: DemoScene[] = [
  {
    id: "s1",
    startSec: 0,
    endSec: 5,
    timeRange: "00:00–00:05",
    name: "Hook",
    durationSec: 5,
    visualCue:
      "Screen recording: Zoom in on exhausting video editor timeline with 40+ cut tracks and an alert popup 'Exporting: 4 hours remaining'. Creator looks stressed.",
    voiceover:
      "You just recorded a two-hour podcast. Now comes the nightmare: spending six hours scrubbing for clips that might get twenty views.",
  },
  {
    id: "s2",
    startSec: 5,
    endSec: 20,
    timeRange: "00:05–00:20",
    name: "Problem & Solution",
    durationSec: 15,
    visualCue:
      "Open browser window to clipflow.ai. Paste a long YouTube URL into the minimalist glow input bar and click the 'Auto-Extract Shorts' button.",
    voiceover:
      "What if you could turn that entire episode into five viral TikToks and Reels before your coffee gets cold? That is why we built ClipFlow.",
  },
  {
    id: "s3",
    startSec: 20,
    endSec: 45,
    timeRange: "00:20–00:45",
    name: "Core Walkthrough",
    durationSec: 25,
    visualCue:
      "Split screen animation: ClipFlow dashboard highlights 3 high-retention segments with virality scores (94, 91, 88). Click Segment 1: Auto-reframes active speaker into vertical 9:16 with kinetic bouncing captions.",
    voiceover:
      "Watch this. ClipFlow's neural engine identifies the strongest punchlines, automatically centers the active speaker in vertical 9:16, and styles animated captions with zero manual keyframing.",
  },
  {
    id: "s4",
    startSec: 45,
    endSec: 60,
    timeRange: "00:45–01:00",
    name: "Call to Action",
    durationSec: 15,
    visualCue:
      "Click 'Export All 3 Clips' in 4K. Download bar finishes instantly. Screen transitions to clean logo card with 'Try free at clipflow.ai' and free trial badge.",
    voiceover:
      "Stop editing like it's 2018. Try ClipFlow free today at clipflow.ai and turn your next episode into your biggest growth channel.",
  },
];

export function DemoScriptGenerator() {
  // Input State
  const [productName, setProductName] = useState(SAMPLE_PRODUCT.name);
  const [websiteUrl, setWebsiteUrl] = useState(SAMPLE_PRODUCT.url);
  const [features, setFeatures] = useState(SAMPLE_PRODUCT.features);
  const [audience, setAudience] = useState(SAMPLE_PRODUCT.audience);
  const [format, setFormat] = useState<DemoFormat>("60s");
  const [hookAngle, setHookAngle] = useState<HookAngle>("problem");
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>("16:9");

  // Output State
  const [scenes, setScenes] = useState<DemoScene[]>(INITIAL_SAMPLE_SCENES);
  const [busy, setBusy] = useState(false);
  const [regeneratingSceneId, setRegeneratingSceneId] = useState<string | null>(null);
  const [urlFetching, setUrlFetching] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // TanStack Server Function
  const runAi = useServerFn(runAiTool);

  const selectedAspectRatio = useMemo(
    () => ASPECT_RATIOS.find((a) => a.id === aspectRatio) ?? ASPECT_RATIOS[0],
    [aspectRatio]
  );

  // Helper toast notification
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2400);
  };

  // Adjust scene time start or end by delta seconds (+/- 1s)
  const adjustSceneTime = (sceneId: string, type: "start" | "end", delta: number) => {
    setScenes((prev) =>
      prev.map((s) => {
        if (s.id !== sceneId) return s;
        if (type === "start") {
          const nextStart = Math.max(0, Math.min(s.endSec - 1, s.startSec + delta));
          return {
            ...s,
            startSec: nextStart,
            durationSec: s.endSec - nextStart,
            timeRange: `${formatTimecode(nextStart)}–${formatTimecode(s.endSec)}`,
          };
        } else {
          const nextEnd = Math.max(s.startSec + 1, s.endSec + delta);
          return {
            ...s,
            endSec: nextEnd,
            durationSec: nextEnd - s.startSec,
            timeRange: `${formatTimecode(s.startSec)}–${formatTimecode(nextEnd)}`,
          };
        }
      })
    );
  };

  // Word count and estimated speaking time calculation
  const metrics = useMemo(() => {
    const totalWords = scenes.reduce((acc, sc) => {
      const words = sc.voiceover.trim() ? sc.voiceover.trim().split(/\s+/).length : 0;
      return acc + words;
    }, 0);

    // Standard speaking rate: ~145 words per minute (~2.4 words per second)
    const estimatedSeconds = Math.max(1, Math.round(totalWords / 2.4));
    const targetConfig = FORMAT_OPTIONS.find((f) => f.id === format) ?? FORMAT_OPTIONS[1];

    return {
      totalWords,
      estimatedSeconds,
      targetSec: targetConfig.targetSec,
      targetWords: targetConfig.targetWords,
    };
  }, [scenes, format]);

  // Update specific scene field
  const updateScene = (id: string, field: "visualCue" | "voiceover" | "name" | "timeRange", val: string) => {
    setScenes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: val } : s))
    );
  };

  // Add a new scene
  const addScene = (index: number) => {
    const prevScene = scenes[index];
    const nextStart = prevScene ? prevScene.endSec : 0;
    const nextEnd = nextStart + 15;

    const newScene: DemoScene = {
      id: `s_${Date.now()}`,
      startSec: nextStart,
      endSec: nextEnd,
      timeRange: `${formatTimecode(nextStart)}–${formatTimecode(nextEnd)}`,
      name: `Step ${scenes.length + 1}`,
      durationSec: 15,
      visualCue: `Screen recording (${selectedAspectRatio.tag}): Demonstrate product feature in action.`,
      voiceover: "Here is how this feature solves your workflow challenges effortlessly.",
    };
    const next = [...scenes];
    next.splice(index + 1, 0, newScene);
    setScenes(next);
    showToast("Added new scene");
  };

  // Delete scene
  const deleteScene = (id: string) => {
    if (scenes.length <= 1) {
      showToast("Must have at least one scene");
      return;
    }
    setScenes((prev) => prev.filter((s) => s.id !== id));
    showToast("Removed scene");
  };

  // Website URL quick extraction simulation
  const handleFetchUrl = () => {
    if (!websiteUrl.trim()) return;
    setUrlFetching(true);
    setTimeout(() => {
      setUrlFetching(false);
      // Auto-extract features & pitch if not populated or to augment
      if (!productName || productName === SAMPLE_PRODUCT.name) {
        try {
          const host = new URL(websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`).hostname.replace("www.", "");
          const brand = host.split(".")[0];
          const capBrand = brand ? brand.charAt(0).toUpperCase() + brand.slice(1) : "Product";
          setProductName(`${capBrand} — Fast, modern workflow automation`);
        } catch {
          // ignore invalid url
        }
      }
      showToast("Features & context fetched from landing page!");
    }, 800);
  };

  // Parse AI output into scenes
  const parseScenesFromText = (rawText: string): DemoScene[] => {
    const parsed: DemoScene[] = [];
    const blocks = rawText.split(/===SCENE===|---SCENE---|Scene \d+:/i).filter((b) => b.trim().length > 15);

    if (blocks.length >= 2) {
      blocks.forEach((block, idx) => {
        let visual = "";
        let voiceover = "";
        let time = `Scene ${idx + 1}`;
        let name = idx === 0 ? "Hook" : idx === blocks.length - 1 ? "CTA" : `Feature ${idx}`;

        const visualMatch = block.match(/\[?VISUAL\]?:?\s*([\s\S]*?)(?=\[?VOICEOVER\]?|$)/i);
        if (visualMatch && visualMatch[1]) {
          visual = visualMatch[1].trim();
        }

        const voMatch = block.match(/\[?VOICEOVER\]?:?\s*([\s\S]*?)(?=\[?TIME\]?|===|$)/i);
        if (voMatch && voMatch[1]) {
          voiceover = voMatch[1].trim();
        }

        let startSec = idx * 15;
        let endSec = (idx + 1) * 15;

        const timeMatch = block.match(/\[?TIME\]?:?\s*([0-9:–— -]+)/i);
        if (timeMatch && timeMatch[1]) {
          time = timeMatch[1].trim();
          const tParts = time.split(/[-–—]/);
          if (tParts.length === 2) {
            const pStart = parseTimecode(tParts[0]?.trim() ?? "");
            const pEnd = parseTimecode(tParts[1]?.trim() ?? "");
            if (pEnd > pStart) {
              startSec = pStart;
              endSec = pEnd;
            }
          }
        }

        const nameMatch = block.match(/\[?NAME\]?:?\s*([^\n\r]+)/i);
        if (nameMatch && nameMatch[1]) {
          name = nameMatch[1].trim();
        }

        // Fallback line parsing if explicit tags are omitted
        if (!visual || !voiceover) {
          const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
          lines.forEach((l) => {
            if (/^(visual|screen|action|on-screen):/i.test(l)) {
              visual = l.replace(/^(visual|screen|action|on-screen):/i, "").trim();
            } else if (/^(voiceover|narration|audio|say):/i.test(l)) {
              voiceover = l.replace(/^(voiceover|narration|audio|say):/i, "").trim();
            }
          });
          if (!voiceover && lines.length > 0) {
            voiceover = lines[lines.length - 1] ?? "";
            visual = visual || lines[0] || "Show key product interaction.";
          }
        }

        if (visual || voiceover) {
          parsed.push({
            id: `sc_${idx}_${Date.now()}`,
            startSec,
            endSec,
            timeRange: `${formatTimecode(startSec)}–${formatTimecode(endSec)}`,
            name,
            durationSec: Math.max(1, endSec - startSec),
            visualCue: visual || `Screen recording (${selectedAspectRatio.tag}): Highlight product workflow on screen.`,
            voiceover: voiceover || "Here is how this feature delivers results for users.",
          });
        }
      });
    }

    if (parsed.length >= 2) {
      return parsed;
    }

    // Fallback: split paragraphs into 3-4 scenes
    const paragraphs = rawText.split("\n\n").map((p) => p.trim()).filter((p) => p.length > 20);
    return paragraphs.slice(0, 4).map((p, idx) => {
      const sSec = idx === 0 ? 0 : idx === 1 ? 5 : idx === 2 ? 20 : 45;
      const eSec = idx === 0 ? 5 : idx === 1 ? 20 : idx === 2 ? 45 : 60;
      return {
        id: `sc_p_${idx}_${Date.now()}`,
        startSec: sSec,
        endSec: eSec,
        timeRange: `${formatTimecode(sSec)}–${formatTimecode(eSec)}`,
        name: idx === 0 ? "Hook" : idx === 1 ? "Problem" : idx === 2 ? "Walkthrough" : "CTA",
        durationSec: eSec - sSec,
        visualCue: `Screen recording (${selectedAspectRatio.tag}): Demonstrate step ${idx + 1} clearly on screen.`,
        voiceover: p.replace(/^[-•*#\d.]+\s*/, ""),
      };
    });
  };

  // Generate full script
  const handleGenerate = async () => {
    if (!productName.trim()) {
      showToast("Please enter a product name or pitch");
      return;
    }
    setBusy(true);

    const promptPayload = [
      `Product: ${productName}`,
      websiteUrl ? `Website: ${websiteUrl}` : "",
      `Features & Workflow:\n${features}`,
      audience ? `Target Audience: ${audience}` : "",
      `Format Target: ${format === "30s" ? "30s Launch Teaser" : format === "60s" ? "60s Explainer" : "2-Min Loom Walkthrough"}`,
      `Hook Angle: ${hookAngle === "problem" ? "Problem-Agitation" : hookAngle === "before_after" ? "Before vs. After" : "Direct Show-Don't-Tell"}`,
      `Aspect Ratio Framing: ${selectedAspectRatio.label} (${selectedAspectRatio.framingTip})`,
      `\nCRITICAL INSTRUCTIONS: Output formatted scenes. For every scene output EXACTLY:
===SCENE===
[TIME]: 00:00–00:05
[NAME]: Hook
[VISUAL]: Screen recording (${selectedAspectRatio.id}): ... (bold actionable camera/screen cue tailored for ${selectedAspectRatio.label})
[VOICEOVER]: ... (natural, conversational spoken script)
===SCENE===
(Provide 3 to 5 scenes matching the chosen video duration)`,
    ]
      .filter(Boolean)
      .join("\n\n");

    try {
      const res = await runAi({
        data: {
          tool: "demo-script-generator",
          input: promptPayload,
        },
      });

      const parsed = parseScenesFromText(res.text);
      if (parsed.length > 0) {
        setScenes(parsed);
        showToast("Generated high-converting demo script!");
      }
    } catch (err: any) {
      console.error("Demo script generation failed:", err);
      showToast("AI synthesis failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  // Regenerate single scene
  const handleRegenerateScene = async (sceneId: string, sceneIndex: number) => {
    const targetScene = scenes.find((s) => s.id === sceneId);
    if (!targetScene) return;

    setRegeneratingSceneId(sceneId);
    const scenePrompt = [
      `Rewrite ONLY Scene ${sceneIndex + 1} (${targetScene.name}) for:`,
      `Product: ${productName}`,
      `Hook Angle: ${hookAngle}`,
      `Current Visual Cue: ${targetScene.visualCue}`,
      `Current Voiceover: ${targetScene.voiceover}`,
      `Provide an alternative, fresher angle with exact tags:\n[VISUAL]: (new visual action cue)\n[VOICEOVER]: (punchy spoken line)`,
    ].join("\n");

    try {
      const res = await runAi({
        data: {
          tool: "demo-script-generator",
          input: scenePrompt,
        },
      });

      const visualMatch = res.text.match(/\[?VISUAL\]?:?\s*([^\n\r]+)/i);
      const voMatch = res.text.match(/\[?VOICEOVER\]?:?\s*([\s\S]+)/i);

      if (visualMatch || voMatch) {
        updateScene(
          sceneId,
          "visualCue",
          visualMatch ? visualMatch[1]?.trim() ?? targetScene.visualCue : targetScene.visualCue
        );
        updateScene(
          sceneId,
          "voiceover",
          voMatch ? voMatch[1]?.trim().replace(/^\[VOICEOVER\]:?/i, "") ?? targetScene.voiceover : targetScene.voiceover
        );
        showToast(`Regenerated ${targetScene.name}!`);
      } else {
        // Fallback: take trimmed text as voiceover
        updateScene(sceneId, "voiceover", res.text.slice(0, 200).trim());
        showToast(`Updated ${targetScene.name}!`);
      }
    } catch (err) {
      console.error("Single scene regeneration failed:", err);
      showToast("Could not regenerate scene.");
    } finally {
      setRegeneratingSceneId(null);
    }
  };

  // Copy Voiceover Only (teleprompter text)
  const copyVoiceoverOnly = () => {
    const text = scenes
      .map((s, idx) => `[${s.name} - ${s.timeRange}]\n${s.voiceover}`)
      .join("\n\n");
    navigator.clipboard.writeText(text);
    showToast("Copied Voiceover Only! Ready for teleprompter.");
  };

  // Copy Full Script (Markdown table for Notion/Docs)
  const copyFullScript = () => {
    let md = `# Product Demo Script: ${productName}\n\n`;
    md += `**Target Duration**: ${format} | **Word Count**: ${metrics.totalWords} words (~${metrics.estimatedSeconds}s)\n\n`;
    md += `| Time & Scene | Visual Cue (What to Show) | Spoken Audio (What to Say) |\n`;
    md += `| :--- | :--- | :--- |\n`;

    scenes.forEach((s) => {
      const cleanVisual = s.visualCue.replace(/\|/g, "\\|").replace(/\n/g, " ");
      const cleanVo = s.voiceover.replace(/\|/g, "\\|").replace(/\n/g, " ");
      md += `| **${s.timeRange}**<br>_${s.name}_ | ${cleanVisual} | ${cleanVo} |\n`;
    });

    navigator.clipboard.writeText(md);
    showToast("Copied Full Script (Visuals + VO) in Markdown!");
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-16">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-[#1D1D1F] px-4 py-3 text-xs font-semibold text-white shadow-xl animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Split Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ==================================================================== */}
        {/* 1. INPUT BOX & CONTROLS (Left / Top Column - 5 Cols) */}
        {/* ==================================================================== */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl border border-black/[0.08] bg-white p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-5">
            {/* Header with Title */}
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-4">
              <div>
                <span className="text-[11px] font-semibold tracking-widest text-[#86868B] uppercase">
                  DEMO DIRECTOR STUDIO
                </span>
                <h2 className="text-xl font-semibold tracking-tight text-[#1D1D1F] mt-0.5">
                  AI Product Demo Script
                </h2>
              </div>

              {/* Sample Reset */}
              <button
                type="button"
                onClick={() => {
                  setProductName(SAMPLE_PRODUCT.name);
                  setWebsiteUrl(SAMPLE_PRODUCT.url);
                  setFeatures(SAMPLE_PRODUCT.features);
                  setAudience(SAMPLE_PRODUCT.audience);
                  setScenes(INITIAL_SAMPLE_SCENES);
                  showToast("Loaded SaaS ClipFlow demo template");
                }}
                className="text-xs font-medium text-[#0071E3] hover:underline"
              >
                Reset sample →
              </button>
            </div>

            {/* Product Name & 1-Line Pitch */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider block">
                Product Name & 1-Line Pitch <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. ClipFlow — Turn long podcasts into viral Shorts in 1 click"
                className="w-full rounded-xl border border-black/[0.08] bg-black/[0.015] px-3.5 py-2.5 text-xs md:text-sm text-[#1D1D1F] placeholder:text-[#86868B]/60 focus:border-[#0071E3] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 transition"
              />
            </div>

            {/* Website URL Fetcher (Optional) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider block">
                  Website URL Fetcher <span className="text-[#86868B] font-normal">(Optional)</span>
                </label>
                <span className="text-[10px] text-[#86868B]">Auto-pulls features</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Globe className="absolute left-3 top-2.5 h-4 w-4 text-[#86868B]" />
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://yourproduct.com"
                    className="w-full rounded-xl border border-black/[0.08] bg-black/[0.015] pl-9 pr-3 py-2 text-xs text-[#1D1D1F] placeholder:text-[#86868B]/60 focus:border-[#0071E3] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 transition"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleFetchUrl}
                  disabled={urlFetching || !websiteUrl.trim()}
                  className="rounded-xl border border-black/[0.08] bg-black/[0.03] hover:bg-black/[0.06] text-[#1D1D1F] px-3 py-2 text-xs font-semibold transition active:scale-95 disabled:opacity-40"
                >
                  {urlFetching ? "Fetching..." : "Fetch"}
                </button>
              </div>
            </div>

            {/* Key Features / Core Workflow */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider block">
                  Key Features / Core Workflow
                </label>
                <span className="text-[10px] text-[#86868B]">3–4 steps or bullets</span>
              </div>
              <textarea
                rows={4}
                value={features}
                onChange={(e) => setFeatures(e.target.value)}
                placeholder="1. Upload screen recording or paste link&#10;2. AI automatically detects key moments&#10;3. Export in 1 click"
                className="w-full rounded-xl border border-black/[0.08] bg-black/[0.015] p-3 text-xs md:text-sm text-[#1D1D1F] placeholder:text-[#86868B]/60 focus:border-[#0071E3] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 transition resize-y leading-relaxed"
              />
            </div>

            {/* Target Audience (Optional) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider block">
                Target Audience <span className="text-[#86868B] font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="e.g. Busy solo founders, creators, or B2B sales teams"
                className="w-full rounded-xl border border-black/[0.08] bg-black/[0.015] px-3.5 py-2 text-xs text-[#1D1D1F] placeholder:text-[#86868B]/60 focus:border-[#0071E3] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 transition"
              />
            </div>

            {/* Quick Controls: Demo Format */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider block">
                Demo Format & Duration
              </label>
              <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-black/[0.04] border border-black/[0.04]">
                {FORMAT_OPTIONS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFormat(f.id)}
                    className={`py-2 px-1 text-xs font-medium rounded-lg text-center transition-all duration-150 active:scale-[0.96] flex flex-col items-center justify-center ${
                      format === f.id
                        ? "bg-white text-[#1D1D1F] shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_1px_rgba(0,0,0,0.04)] font-semibold"
                        : "text-[#86868B] hover:text-[#1D1D1F] hover:bg-white/50"
                    }`}
                  >
                    <span>{f.id === "30s" ? "30s Teaser" : f.id === "60s" ? "60s Explainer" : "2-Min Loom"}</span>
                    <span className="text-[9px] text-[#86868B] mt-0.5">{f.targetWords}w</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Controls: Hook Angle */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider block">
                Hook Angle
              </label>
              <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-black/[0.04] border border-black/[0.04]">
                {HOOK_OPTIONS.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => setHookAngle(h.id)}
                    className={`py-2 px-1 text-[11px] font-medium rounded-lg text-center transition-all duration-150 active:scale-[0.96] ${
                      hookAngle === h.id
                        ? "bg-white text-[#1D1D1F] shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_1px_rgba(0,0,0,0.04)] font-semibold"
                        : "text-[#86868B] hover:text-[#1D1D1F] hover:bg-white/50"
                    }`}
                  >
                    {h.id === "problem" ? "Problem" : h.id === "before_after" ? "Before/After" : "Show-Don't-Tell"}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Controls: Aspect Ratio Selector Tool */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider block">
                  Aspect Ratio Selector
                </label>
                <span className="text-[10px] text-[#0071E3] font-semibold">
                  {selectedAspectRatio.tag}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-black/[0.04] border border-black/[0.04]">
                {ASPECT_RATIOS.map((ar) => (
                  <button
                    key={ar.id}
                    type="button"
                    onClick={() => {
                      setAspectRatio(ar.id);
                      showToast(`Framing set to ${ar.label}`);
                    }}
                    className={`py-2 px-1 text-xs font-medium rounded-lg text-center transition-all duration-150 active:scale-[0.96] flex flex-col items-center justify-center gap-1.5 ${
                      aspectRatio === ar.id
                        ? "bg-white text-[#1D1D1F] shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_1px_rgba(0,0,0,0.04)] font-semibold"
                        : "text-[#86868B] hover:text-[#1D1D1F] hover:bg-white/50"
                    }`}
                  >
                    <span
                      className={`border-1.5 rounded-xs ${ar.iconBox} ${
                        aspectRatio === ar.id
                          ? "border-[#0071E3] bg-[#0071E3]/15"
                          : "border-[#86868B]"
                      }`}
                    />
                    <span className="text-[10px] font-mono leading-none">{ar.id}</span>
                    <span className="text-[9px] text-[#86868B] hidden sm:inline leading-none truncate max-w-full">
                      {ar.tag.split(" ")[1] ?? ar.tag}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-[#86868B] italic">
                {selectedAspectRatio.framingTip}
              </p>
            </div>

            {/* "Generate Demo Script" CTA Button */}
            <div className="pt-2">
              <button
                type="button"
                disabled={busy || !productName.trim()}
                onClick={handleGenerate}
                className="w-full relative flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-b from-[#2563EB] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1E40AF] px-6 py-4 text-sm font-semibold tracking-[-0.01em] text-white shadow-[0_2px_4px_rgba(37,99,235,0.2),0_6px_14px_rgba(37,99,235,0.25),inset_0_1px_0.5px_rgba(255,255,255,0.35)] hover:shadow-[0_4px_8px_rgba(37,99,235,0.25),0_8px_18px_rgba(37,99,235,0.3)] active:scale-[0.985] active:brightness-95 transition-all duration-150 ease-out disabled:opacity-45 disabled:cursor-not-allowed disabled:active:scale-100 disabled:shadow-none"
              >
                <Sparkles className={`h-4 w-4 text-white/90 ${busy ? "animate-spin" : ""}`} />
                <span>{busy ? "Drafting Scene-by-Scene Script..." : "Generate Demo Script"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* 2. OUTPUT WORKSPACE: 2-COLUMN RECORDING TABLE (Right / Bottom - 7 Cols) */}
        {/* ==================================================================== */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-3xl border border-black/[0.08] bg-white p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-6">
            {/* Header & Live Read-Time / Word Counter */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/[0.06] pb-4">
              <div>
                <span className="text-[11px] font-semibold tracking-widest text-[#86868B] uppercase">
                  RECORDING TABLE
                </span>
                <h3 className="text-base font-semibold text-[#1D1D1F] mt-0.5">
                  Scene-by-Scene Recording Guide
                </h3>
              </div>

              {/* Live Read-Time & Word Counter Badge */}
              <div className="flex items-center gap-2 rounded-xl bg-black/[0.03] border border-black/[0.05] px-3 py-1.5 text-xs">
                <Clock className="h-3.5 w-3.5 text-[#0071E3]" />
                <span className="font-semibold text-[#1D1D1F]">
                  {metrics.totalWords} words
                </span>
                <span className="text-[#86868B]">·</span>
                <span
                  className={`font-mono font-semibold ${
                    metrics.estimatedSeconds > metrics.targetSec * 1.2
                      ? "text-amber-600"
                      : "text-emerald-600"
                  }`}
                >
                  ~{metrics.estimatedSeconds}s spoken
                </span>
                <span className="text-[10px] text-[#86868B]">
                  (Target: {metrics.targetSec}s)
                </span>
              </div>
            </div>

            {/* One-Click Export Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 p-2 rounded-2xl bg-black/[0.02] border border-black/[0.05]">
              <span className="text-[11px] font-semibold text-[#86868B] pl-2">
                One-Click Export:
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyVoiceoverOnly}
                  className="flex items-center gap-1.5 rounded-xl border border-black/[0.08] bg-white px-3 py-1.5 text-xs font-semibold text-[#1D1D1F] hover:bg-black/[0.03] transition active:scale-95 shadow-2xs"
                  title="Copy voiceover lines for teleprompter"
                >
                  <Mic className="h-3.5 w-3.5 text-[#0071E3]" />
                  <span>Copy Voiceover Only</span>
                </button>

                <button
                  type="button"
                  onClick={copyFullScript}
                  className="flex items-center gap-1.5 rounded-xl bg-[#1D1D1F] hover:bg-[#2D2D2F] px-3.5 py-1.5 text-xs font-semibold text-white transition active:scale-95 shadow-xs"
                  title="Copy full script formatted as Markdown table for Notion or Google Docs"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Copy Full Script (Visuals + VO)</span>
                </button>
              </div>
            </div>

            {/* Scene-by-Scene Cards */}
            <div className="space-y-4">
              {scenes.map((scene, idx) => {
                const isRegenerating = regeneratingSceneId === scene.id;
                const sceneWords = scene.voiceover.trim() ? scene.voiceover.trim().split(/\s+/).length : 0;
                const sceneSec = Math.max(1, Math.round(sceneWords / 2.4));

                return (
                  <div
                    key={scene.id}
                    className="group rounded-2xl border border-black/[0.08] bg-white p-4 space-y-3 hover:border-black/[0.16] transition-all shadow-xs"
                  >
                    {/* Scene Card Header: Time, Scene Name, Word count, Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-black/[0.05] pb-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0071E3]/10 text-[11px] font-bold text-[#0071E3]">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={scene.name}
                          onChange={(e) => updateScene(scene.id, "name", e.target.value)}
                          className="font-semibold text-xs text-[#1D1D1F] bg-transparent border-b border-transparent hover:border-black/20 focus:border-[#0071E3] focus:outline-none px-1"
                        />

                        {/* Custom Timeline Changer Capsules */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Start Capsule */}
                          <div className="inline-flex items-center gap-2 rounded-full bg-[#1D1D1F] px-3 py-1 shadow-sm border border-black/10">
                            <span className="font-mono text-[11px] text-[#A1A1A6] select-none tracking-tight">
                              Start: <span className="text-white font-medium">{formatTimecode(scene.startSec)}</span>
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => adjustSceneTime(scene.id, "start", -1)}
                                className="flex h-5 items-center justify-center rounded-[5px] bg-[#323234] hover:bg-[#3E3E42] px-1.5 text-[10px] font-mono text-white transition active:scale-95 cursor-pointer"
                                title="Subtract 1 second from start time"
                              >
                                -1s
                              </button>
                              <button
                                type="button"
                                onClick={() => adjustSceneTime(scene.id, "start", 1)}
                                className="flex h-5 items-center justify-center rounded-[5px] bg-[#323234] hover:bg-[#3E3E42] px-1.5 text-[10px] font-mono text-white transition active:scale-95 cursor-pointer"
                                title="Add 1 second to start time"
                              >
                                +1s
                              </button>
                            </div>
                          </div>

                          {/* End Capsule */}
                          <div className="inline-flex items-center gap-2 rounded-full bg-[#1D1D1F] px-3 py-1 shadow-sm border border-black/10">
                            <span className="font-mono text-[11px] text-[#A1A1A6] select-none tracking-tight">
                              End: <span className="text-white font-medium">{formatTimecode(scene.endSec)}</span>
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => adjustSceneTime(scene.id, "end", -1)}
                                className="flex h-5 items-center justify-center rounded-[5px] bg-[#323234] hover:bg-[#3E3E42] px-1.5 text-[10px] font-mono text-white transition active:scale-95 cursor-pointer"
                                title="Subtract 1 second from end time"
                              >
                                -1s
                              </button>
                              <button
                                type="button"
                                onClick={() => adjustSceneTime(scene.id, "end", 1)}
                                className="flex h-5 items-center justify-center rounded-[5px] bg-[#323234] hover:bg-[#3E3E42] border border-white/60 px-1.5 text-[10px] font-mono text-white transition active:scale-95 cursor-pointer"
                                title="Add 1 second to end time"
                              >
                                +1s
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Scene Stats & Actions */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-[#86868B] font-mono mr-1">
                          {sceneWords}w (~{sceneSec}s)
                        </span>

                        {/* Per-Scene Regenerate Button */}
                        <button
                          type="button"
                          disabled={isRegenerating}
                          onClick={() => handleRegenerateScene(scene.id, idx)}
                          title={`Regenerate ${scene.name} with fresh angle`}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/[0.08] bg-black/[0.02] text-[#555] hover:text-[#1D1D1F] hover:bg-black/[0.06] transition active:scale-90"
                        >
                          <RotateCcw className={`h-3.5 w-3.5 ${isRegenerating ? "animate-spin text-[#0071E3]" : ""}`} />
                        </button>

                        {/* Add Scene Below */}
                        <button
                          type="button"
                          onClick={() => addScene(idx)}
                          title="Add scene below"
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/[0.08] bg-black/[0.02] text-[#555] hover:text-[#1D1D1F] hover:bg-black/[0.06] transition active:scale-90"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>

                        {/* Delete Scene */}
                        <button
                          type="button"
                          onClick={() => deleteScene(scene.id)}
                          title="Remove scene"
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/[0.08] bg-black/[0.02] text-[#555] hover:text-red-600 hover:bg-red-50 transition active:scale-90"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* 2-Column Recording Layout: Visual Cue (Left) | Spoken Audio (Right) */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">
                      {/* Left Column: Visual / Screen Cue (5 Cols) */}
                      <div className="md:col-span-5 rounded-xl bg-amber-500/[0.04] border border-amber-600/15 p-3 flex flex-col justify-between space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                            <Monitor className="h-3.5 w-3.5 text-amber-600" />
                            <span>Visual / Screen Cue</span>
                          </div>
                          <span className="text-[10px] font-semibold text-amber-900 bg-amber-500/15 border border-amber-500/20 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                            <span className={`border rounded-2xs ${selectedAspectRatio.iconBox}`} />
                            <span>{selectedAspectRatio.id}</span>
                          </span>
                        </div>
                        <textarea
                          rows={3}
                          value={scene.visualCue}
                          onChange={(e) => updateScene(scene.id, "visualCue", e.target.value)}
                          placeholder="Action direction on screen..."
                          className="w-full text-xs text-[#1D1D1F] font-medium leading-relaxed bg-transparent resize-y border-0 focus:outline-none focus:ring-0 p-0"
                        />
                      </div>

                      {/* Right Column: Spoken Voiceover (7 Cols) */}
                      <div className="md:col-span-7 rounded-xl bg-blue-500/[0.04] border border-blue-600/15 p-3 flex flex-col justify-between space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-bold text-blue-900 uppercase tracking-wider">
                          <div className="flex items-center gap-1.5">
                            <Mic className="h-3.5 w-3.5 text-[#0071E3]" />
                            <span>Spoken Voiceover</span>
                          </div>
                          <span className="font-normal text-[9px] text-[#0071E3]">Click to edit text</span>
                        </div>
                        <textarea
                          rows={3}
                          value={scene.voiceover}
                          onChange={(e) => updateScene(scene.id, "voiceover", e.target.value)}
                          placeholder="Spoken words with natural pauses..."
                          className="w-full text-xs text-[#1D1D1F] leading-relaxed bg-transparent resize-y border-0 focus:outline-none focus:ring-0 p-0"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Add Scene Button */}
            <button
              type="button"
              onClick={() => addScene(scenes.length - 1)}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl border border-dashed border-black/[0.15] bg-black/[0.015] hover:bg-black/[0.04] text-xs font-semibold text-[#555] hover:text-[#1D1D1F] transition active:scale-[0.99]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Another Scene Card</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
