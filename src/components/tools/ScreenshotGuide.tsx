import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Upload,
  X,
  Copy,
  Check,
  FileText,
  FileCode,
  Printer,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  CheckCircle2,
  Trash2,
  Plus,
  ShieldCheck,
  Layers,
  ArrowRight,
  Crosshair,
  Download,
  Info,
  Edit3,
  Tag,
  Sliders,
  ChevronDown,
  Circle,
  Square,
  ArrowUpRight,
  Radio,
  Zap,
} from "lucide-react";
import screen1 from "@/assets/samples/screen-1.png";
import screen2 from "@/assets/samples/screen-2.png";
import screen3 from "@/assets/samples/screen-3.png";
import { runAiTool } from "@/lib/ai.functions";
import { useServerFn } from "@tanstack/react-start";

type OutputStyle = "sop" | "help-center" | "checklist";

export type HotspotColor = "blue" | "red" | "green" | "amber" | "purple" | "black";
export type HotspotShape = "circle" | "box" | "arrow" | "beacon";
export type HotspotSize = "sm" | "md" | "lg";
export type LabelPosition = "right" | "bottom" | "top" | "left";
export type LabelTheme = "dark" | "light" | "match";

export interface StepAnnotation {
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  label?: string;
  // Hotspot properties
  color?: HotspotColor;
  shape?: HotspotShape;
  size?: HotspotSize;
  pulse?: boolean;
  // Label properties
  labelPosition?: LabelPosition;
  labelTheme?: LabelTheme;
  showStepNumber?: boolean;
}

export const HOTSPOT_COLORS: Record<
  HotspotColor,
  {
    name: string;
    hex: string;
    bg: string;
    border: string;
    ring: string;
    text: string;
  }
> = {
  blue: {
    name: "Classic Blue",
    hex: "#2563EB",
    bg: "bg-blue-600",
    border: "border-blue-400",
    ring: "ring-blue-400",
    text: "text-blue-500",
  },
  red: {
    name: "Alert Red",
    hex: "#EF4444",
    bg: "bg-red-600",
    border: "border-red-400",
    ring: "ring-red-400",
    text: "text-red-500",
  },
  green: {
    name: "Emerald",
    hex: "#10B981",
    bg: "bg-emerald-600",
    border: "border-emerald-400",
    ring: "ring-emerald-400",
    text: "text-emerald-500",
  },
  amber: {
    name: "Amber",
    hex: "#F59E0B",
    bg: "bg-amber-600",
    border: "border-amber-400",
    ring: "ring-amber-400",
    text: "text-amber-500",
  },
  purple: {
    name: "Violet",
    hex: "#8B5CF6",
    bg: "bg-purple-600",
    border: "border-purple-400",
    ring: "ring-purple-400",
    text: "text-purple-500",
  },
  black: {
    name: "Noir",
    hex: "#18181B",
    bg: "bg-stone-900",
    border: "border-stone-500",
    ring: "ring-stone-400",
    text: "text-stone-900",
  },
};

interface GuideStep {
  id: string;
  stepNumber: number;
  heading: string;
  instruction: string;
  imageUrl?: string;
  annotation?: StepAnnotation;
}

interface GeneratedGuide {
  title: string;
  summary: string;
  steps: GuideStep[];
}

const DEFAULT_SAMPLE_GUIDE: GeneratedGuide = {
  title: "How to connect a custom domain",
  summary:
    "Follow this quick 3-step guide to configure DNS records, route traffic, and issue automatic SSL certificates for your custom domain.",
  steps: [
    {
      id: "step-1",
      stepNumber: 1,
      heading: "Navigate to Domain Settings",
      instruction: "Click on Settings in the left sidebar and select the Custom Domains tab.",
      imageUrl: screen1,
      annotation: {
        x: 82,
        y: 22,
        label: "Settings",
        color: "blue",
        shape: "circle",
        size: "md",
        labelPosition: "right",
        labelTheme: "dark",
        pulse: true,
        showStepNumber: true,
      },
    },
    {
      id: "step-2",
      stepNumber: 2,
      heading: "Enter CNAME and TXT verification records",
      instruction: "Copy the provided DNS records into your DNS provider (Cloudflare, GoDaddy, or Namecheap).",
      imageUrl: screen2,
      annotation: {
        x: 50,
        y: 48,
        label: "Verify DNS",
        color: "amber",
        shape: "box",
        size: "md",
        labelPosition: "top",
        labelTheme: "dark",
        pulse: true,
        showStepNumber: true,
      },
    },
    {
      id: "step-3",
      stepNumber: 3,
      heading: "Confirm and activate SSL certification",
      instruction: "Click Verify Domain to activate automated TLS certificate provisioning.",
      imageUrl: screen3,
      annotation: {
        x: 78,
        y: 76,
        label: "Verify Domain",
        color: "green",
        shape: "circle",
        size: "md",
        labelPosition: "right",
        labelTheme: "dark",
        pulse: true,
        showStepNumber: true,
      },
    },
  ],
};

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ScreenshotGuide() {
  const [shots, setShots] = useState<{ id: string; url: string; name: string }[]>([
    { id: "s1", url: screen1, name: "domain-settings.png" },
    { id: "s2", url: screen2, name: "dns-records.png" },
    { id: "s3", url: screen3, name: "activate-ssl.png" },
  ]);
  const [goalContext, setGoalContext] = useState("How to connect a custom domain");
  const [outputStyle, setOutputStyle] = useState<OutputStyle>("sop");
  const [busy, setBusy] = useState(false);
  const [guide, setGuide] = useState<GeneratedGuide>(DEFAULT_SAMPLE_GUIDE);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedShotIdx, setDraggedShotIdx] = useState<number | null>(null);
  const [activeDragStep, setActiveDragStep] = useState<number | null>(null);
  const [expandedPropsStep, setExpandedPropsStep] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const runAi = useServerFn(runAiTool);

  // Helper: update any property of a step's annotation
  const updateStepAnnotation = (stepIdx: number, patch: Partial<StepAnnotation>) => {
    setGuide((prev) => {
      const copy = [...prev.steps];
      if (copy[stepIdx]) {
        const current = copy[stepIdx].annotation || {
          x: 50,
          y: 50,
          label: `Action ${stepIdx + 1}`,
          color: "blue",
          shape: "circle",
          size: "md",
          labelPosition: "right",
          labelTheme: "dark",
          pulse: true,
          showStepNumber: true,
        };
        copy[stepIdx] = {
          ...copy[stepIdx],
          annotation: {
            ...current,
            ...patch,
          },
        };
      }
      return { ...prev, steps: copy };
    });
  };

  // Helper: toggle / remove hotspot
  const toggleHotspot = (stepIdx: number) => {
    setGuide((prev) => {
      const copy = [...prev.steps];
      if (copy[stepIdx]) {
        if (copy[stepIdx].annotation) {
          copy[stepIdx] = { ...copy[stepIdx], annotation: undefined };
          showToast(`Removed hotspot from step ${stepIdx + 1}`);
        } else {
          copy[stepIdx] = {
            ...copy[stepIdx],
            annotation: {
              x: 50,
              y: 50,
              label: `Action ${stepIdx + 1}`,
              color: "blue",
              shape: "circle",
              size: "md",
              labelPosition: "right",
              labelTheme: "dark",
              pulse: true,
              showStepNumber: true,
            },
          };
          showToast(`Added hotspot to step ${stepIdx + 1}`);
        }
      }
      return { ...prev, steps: copy };
    });
  };

  // Toast timer
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 2500);
    return () => clearTimeout(t);
  }, [toastMessage]);

  const showToast = (msg: string) => setToastMessage(msg);

  // Clipboard Paste Support (Ctrl+V)
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length > 0) {
        e.preventDefault();
        await handleFiles(files);
        showToast(`Pasted ${files.length} screenshot(s) from clipboard!`);
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [shots]);

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!fileArray.length) {
      showToast("Please upload valid image files (PNG, JPG, WebP).");
      return;
    }
    const remainingSlots = 10 - shots.length;
    if (remainingSlots <= 0) {
      showToast("Maximum limit of 10 screenshots reached.");
      return;
    }

    const filesToAdd = fileArray.slice(0, remainingSlots);
    const newShots = await Promise.all(
      filesToAdd.map(async (file, idx) => ({
        id: `shot-${Date.now()}-${idx}`,
        url: await fileToDataUrl(file),
        name: file.name,
      }))
    );

    setShots((prev) => [...prev, ...newShots]);
    showToast(`Added ${newShots.length} screenshot${newShots.length > 1 ? "s" : ""}.`);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeShot = (index: number) => {
    setShots((prev) => prev.filter((_, i) => i !== index));
  };

  // Reordering thumbnails
  const handleThumbnailDragStart = (idx: number) => {
    setDraggedShotIdx(idx);
  };

  const handleThumbnailDrop = (dropIdx: number) => {
    if (draggedShotIdx === null || draggedShotIdx === dropIdx) return;
    setShots((prev) => {
      const copy = [...prev];
      const [dragged] = copy.splice(draggedShotIdx, 1);
      copy.splice(dropIdx, 0, dragged);
      return copy;
    });
    setDraggedShotIdx(null);
  };

  // Free cursor dragging for highlight pins
  const updatePinCoordinates = (stepIndex: number, clientX: number, clientY: number, containerRect: DOMRect) => {
    const rawX = ((clientX - containerRect.left) / containerRect.width) * 100;
    const rawY = ((clientY - containerRect.top) / containerRect.height) * 100;
    const x = Math.max(3, Math.min(97, Math.round(rawX)));
    const y = Math.max(4, Math.min(96, Math.round(rawY)));

    setGuide((prev) => {
      const copy = { ...prev };
      const updatedSteps = [...copy.steps];
      if (updatedSteps[stepIndex]) {
        updatedSteps[stepIndex] = {
          ...updatedSteps[stepIndex],
          annotation: {
            ...updatedSteps[stepIndex].annotation,
            x,
            y,
            label: updatedSteps[stepIndex].annotation?.label ?? `Action ${stepIndex + 1}`,
          },
        };
      }
      return { ...copy, steps: updatedSteps };
    });
  };

  const handlePinPointerDown = (stepIndex: number, e: React.PointerEvent<HTMLDivElement>) => {
    // If user clicked inside a text input or badge, do not drag the pin!
    const target = e.target as HTMLElement;
    if (target.tagName === "INPUT" || target.closest("input")) {
      return;
    }
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setActiveDragStep(stepIndex);
    updatePinCoordinates(stepIndex, e.clientX, e.clientY, e.currentTarget.getBoundingClientRect());
  };

  const handlePinPointerMove = (stepIndex: number, e: React.PointerEvent<HTMLDivElement>) => {
    if (activeDragStep !== stepIndex) return;
    updatePinCoordinates(stepIndex, e.clientX, e.clientY, e.currentTarget.getBoundingClientRect());
  };

  const handlePinPointerUp = (stepIndex: number, e: React.PointerEvent<HTMLDivElement>) => {
    if (activeDragStep === stepIndex) {
      setActiveDragStep(null);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
      showToast(`Highlight pin placed!`);
    }
  };

  // Add / Delete step controls
  const deleteStep = (stepIdx: number) => {
    if (guide.steps.length <= 1) {
      showToast("A guide requires at least one step.");
      return;
    }
    setGuide((prev) => {
      const filtered = prev.steps.filter((_, i) => i !== stepIdx);
      const renumbered = filtered.map((s, idx) => ({ ...s, stepNumber: idx + 1 }));
      return { ...prev, steps: renumbered };
    });
    showToast(`Removed step ${stepIdx + 1}`);
  };

  const addStepAfter = (stepIdx: number) => {
    setGuide((prev) => {
      const newStep: GuideStep = {
        id: `step-${Date.now()}`,
        stepNumber: stepIdx + 2,
        heading: "Next action step",
        instruction: "Click on the designated button to proceed with configuration.",
        imageUrl: shots[stepIdx + 1]?.url || shots[shots.length - 1]?.url || screen1,
        annotation: {
          x: 50,
          y: 50,
          label: `Action ${stepIdx + 2}`,
          color: "blue",
          shape: "circle",
          size: "md",
          labelPosition: "right",
          labelTheme: "dark",
          pulse: true,
          showStepNumber: true,
        },
      };
      const copy = [...prev.steps];
      copy.splice(stepIdx + 1, 0, newStep);
      const renumbered = copy.map((s, idx) => ({ ...s, stepNumber: idx + 1 }));
      return { ...prev, steps: renumbered };
    });
    showToast(`Added new step after step ${stepIdx + 1}`);
  };

  // Generate with AI
  const handleGenerate = async () => {
    if (!shots.length) {
      showToast("Please upload at least 1 screenshot.");
      return;
    }

    setBusy(true);
    const styleDescriptions = {
      sop: "SOP / Internal Documentation: clear, direct, operational steps with exact UI terms",
      "help-center": "Help Center Article: friendly, user-facing, conversational clarity",
      checklist: "Quick Checklist: concise, imperative action verbs and punchy checkboxes",
    };

    try {
      const promptText = `
Guide Goal / Context: ${goalContext || "Follow the step sequence depicted in the screenshots"}
Output Style: ${styleDescriptions[outputStyle]}
Screenshot Count: ${shots.length}

Generate a clear step-by-step user guide for this workflow.
Structure your reply strictly:
Title: [Actionable title starting with "How to..."]
Summary: [1-sentence overview of the goal]
Steps:
Step 1: [Bold action verb + UI element name, e.g. "Click Export in the top-right corner"]
Instruction: [1-2 sentences of specific instructions]
Step 2: [Bold action verb + UI element name]
Instruction: [1-2 sentences of specific instructions]
(continue for each screenshot up to ${shots.length})
`;

      const raw = await runAi({
        data: {
          tool: "screenshot-to-guide",
          input: promptText,
          images: shots.map((s) => s.url),
        },
      });

      const titleMatch = raw.match(/Title:\s*(.*)/i);
      const summaryMatch = raw.match(/Summary:\s*([\s\S]*?)(?=Steps:|$)/i);

      const parsedTitle = titleMatch ? titleMatch[1].trim() : (goalContext || "How to complete this workflow");
      const parsedSummary = summaryMatch ? summaryMatch[1].trim() : "Follow the numbered steps below to execute this process.";

      const stepsRegex = /Step\s*(\d+)[:\.]\s*([^\n]+)\s*\n+(?:Instruction:\s*)?([^\n]+(?:\n[^\n]+)?)/gi;
      const parsedSteps: GuideStep[] = [];
      let match;
      let count = 0;
      while ((match = stepsRegex.exec(raw)) !== null && count < shots.length) {
        parsedSteps.push({
          id: `step-${count + 1}`,
          stepNumber: count + 1,
          heading: match[2].trim(),
          instruction: match[3].replace(/^Instruction:\s*/i, "").trim(),
          imageUrl: shots[count]?.url,
          annotation: {
            x: 50 + (count % 3) * 15,
            y: 35 + (count % 3) * 20,
            label: `Step ${count + 1}`,
            color: (["blue", "amber", "green", "purple"] as HotspotColor[])[count % 4],
            shape: "circle",
            size: "md",
            labelPosition: "right",
            labelTheme: "dark",
            pulse: true,
            showStepNumber: true,
          },
        });
        count++;
      }

      if (!parsedSteps.length) {
        shots.forEach((shot, i) => {
          parsedSteps.push({
            id: `step-${i + 1}`,
            stepNumber: i + 1,
            heading: `Click ${goalContext ? goalContext.slice(0, 25) : "Button"} to proceed`,
            instruction: "Verify the onscreen parameters and select the highlighted element to continue.",
            imageUrl: shot.url,
            annotation: {
              x: 50,
              y: 45,
              label: `Step ${i + 1}`,
              color: (["blue", "amber", "green", "purple"] as HotspotColor[])[i % 4],
              shape: "circle",
              size: "md",
              labelPosition: "right",
              labelTheme: "dark",
              pulse: true,
              showStepNumber: true,
            },
          });
        });
      }

      setGuide({
        title: parsedTitle,
        summary: parsedSummary,
        steps: parsedSteps,
      });
      showToast("Guide generated successfully!");
    } catch {
      // Offline fallback
      const fallbackSteps: GuideStep[] = shots.map((shot, i) => ({
        id: `step-${i + 1}`,
        stepNumber: i + 1,
        heading:
          i === 0
            ? "Open target dashboard"
            : i === 1
            ? "Configure field options"
            : i === 2
            ? "Confirm and save changes"
            : `Execute step ${i + 1}`,
        instruction:
          outputStyle === "checklist"
            ? `Select the verified element and ensure status turns active.`
            : `Navigate to the designated control panel and verify that all inputs conform to requirements.`,
        imageUrl: shot.url,
        annotation: {
          x: 75 - i * 15,
          y: 30 + i * 20,
          label: `Step ${i + 1}`,
          color: (["blue", "amber", "green", "purple"] as HotspotColor[])[i % 4],
          shape: "circle",
          size: "md",
          labelPosition: "right",
          labelTheme: "dark",
          pulse: true,
          showStepNumber: true,
        },
      }));

      setGuide({
        title: goalContext || "How to complete this workflow",
        summary: "This guide provides step-by-step instructions compiled from your sequenced screenshots.",
        steps: fallbackSteps,
      });
      showToast("Guide generated!");
    } finally {
      setBusy(false);
    }
  };

  // EXPORT 1: COPY AS MARKDOWN
  const exportCopyMarkdown = () => {
    const text = `# ${guide.title}\n\n${guide.summary}\n\n` +
      guide.steps
        .map((s) => {
          const pinInfo = s.annotation?.label ? ` *(Target: ${s.annotation.label})*` : "";
          return `### ${s.stepNumber}. ${s.heading}${pinInfo}\n${s.instruction}\n`;
        })
        .join("\n");
    navigator.clipboard.writeText(text);
    showToast("Copied Markdown for Notion, GitHub & Confluence!");
  };

  // EXPORT 2: COPY RICH TEXT (HTML with styling for Google Docs / Word)
  const exportCopyRichText = async () => {
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e1e1e;">
        <h1 style="color: #0f172a; font-size: 24px; border-bottom: 2px solid #2563eb; padding-bottom: 8px;">${guide.title}</h1>
        <p style="font-size: 15px; color: #475569; font-style: italic; background: #f8fafc; padding: 10px; border-left: 4px solid #2563eb;">${guide.summary}</p>
        ${guide.steps
          .map(
            (s) => `
          <div style="margin-top: 24px; margin-bottom: 16px;">
            <h2 style="color: #1e40af; font-size: 18px;">Step ${s.stepNumber}: ${s.heading}</h2>
            <p style="font-size: 14px; color: #334155;">${s.instruction}</p>
            ${s.annotation?.label ? `<div style="margin-top: 6px;"><span style="font-size: 12px; font-weight: bold; color: #2563eb; background: #eff6ff; display: inline-block; padding: 3px 8px; border-radius: 4px; border: 1px solid #bfdbfe;">Action: ${s.annotation.label}</span></div>` : ""}
          </div>
        `
          )
          .join("")}
      </div>
    `;
    const plainText = `# ${guide.title}\n\n${guide.summary}\n\n` +
      guide.steps.map((s) => `Step ${s.stepNumber}: ${s.heading}${s.annotation?.label ? ` [${s.annotation.label}]` : ""}\n${s.instruction}\n`).join("\n");

    try {
      const blobHtml = new Blob([html], { type: "text/html" });
      const blobText = new Blob([plainText], { type: "text/plain" });
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": blobHtml,
          "text/plain": blobText,
        }),
      ]);
      showToast("Copied Rich Text! Ready to paste into Google Docs or Word.");
    } catch {
      navigator.clipboard.writeText(plainText);
      showToast("Copied text to clipboard!");
    }
  };

  // EXPORT 3: DOWNLOAD PDF / HTML
  const exportDownloadHtml = () => {
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${guide.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #111; }
    h1 { font-size: 28px; margin-bottom: 8px; color: #000; }
    .summary { font-size: 16px; color: #4b5563; margin-bottom: 32px; border-left: 3px solid #2563eb; padding-left: 12px; }
    .step { margin-bottom: 40px; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; }
    .step-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .step-badge { background: #2563eb; color: #fff; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 13px; }
    .step-title { font-size: 18px; font-weight: 700; margin: 0; }
    .step-instruction { font-size: 15px; color: #374151; margin-bottom: 16px; }
    img { max-width: 100%; border-radius: 8px; border: 1px solid #d1d5db; }
  </style>
</head>
<body>
  <h1>${guide.title}</h1>
  <p class="summary">${guide.summary}</p>
  ${guide.steps
    .map(
      (s) => `
    <div class="step">
      <div class="step-header">
        <div class="step-badge">${s.stepNumber}</div>
        <h2 class="step-title">${s.heading}</h2>
      </div>
      <p class="step-instruction">${s.instruction}</p>
      ${s.imageUrl ? `<img src="${s.imageUrl}" alt="Step ${s.stepNumber}">` : ""}
    </div>
  `
    )
    .join("")}
</body>
</html>`;
    const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${guide.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 45)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Downloaded standalone HTML guide!");
  };

  const exportPrintPdf = () => {
    window.print();
  };

  return (
    <div className="relative mx-auto max-w-6xl w-full px-4 py-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-[#000000] bg-[#000000] px-4 py-3 text-sm font-semibold text-[#FAF7F0] shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="h-4 w-4 text-blue-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
        }}
      />

      {/* Header Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#D6CCB5] bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-[#1A1917] tracking-tight">
              Screenshot to step-by-step guide
            </h1>
            <p className="text-xs text-[#78716C]">
              Transform sequential screen grabs into polished, annotated visual SOPs
            </p>
          </div>
        </div>

        {/* Badges on right */}
        <div className="flex items-center gap-2 text-xs font-semibold text-[#78716C]">
          <span className="rounded-full bg-[#FAF7F0] border border-[#D6CCB5] px-2.5 py-1 text-[#1A1917]">
            Free
          </span>
          <span>•</span>
          <span className="rounded-full bg-[#FAF7F0] border border-[#D6CCB5] px-2.5 py-1 text-[#1A1917]">
            No sign-up
          </span>
          <span>•</span>
          <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-1 text-blue-700 font-bold">
            5 runs a day
          </span>
        </div>
      </div>

      {/* Main 2-Column Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* 1. INPUT BOX (Left Column - approx 5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-3xl border border-[#D6CCB5] bg-white p-6 shadow-sm">
            {/* Header + Privacy Badge */}
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-[#1A1917] uppercase tracking-wider">
                Screenshots ({shots.length}/10)
              </label>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                <ShieldCheck className="h-3 w-3" />
                <span>Processed temporarily & never stored</span>
              </div>
            </div>

            {/* Multi-Image Dropzone with Ctrl+V Support */}
            <div
              ref={dropzoneRef}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`relative rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-200 ${
                isDragging
                  ? "border-blue-500 bg-blue-50/50"
                  : "border-[#D6CCB5] bg-[#FAF7F0]/40 hover:border-blue-400 hover:bg-[#FAF7F0]"
              }`}
            >
              <div
                onClick={() => fileInputRef.current?.click()}
                className="mx-auto mb-3 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-blue-100 hover:scale-105 transition"
              >
                <Upload className="h-5 w-5" />
              </div>
              <p className="text-xs md:text-sm font-medium text-[#1A1917]">
                Drop screenshots here, or{" "}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="font-bold text-blue-600 hover:underline"
                >
                  browse
                </button>
              </p>
              <p className="mt-1 text-[11px] text-[#78716C]">
                PNG, JPG or WebP in step order • <kbd className="rounded bg-white px-1.5 py-0.5 text-[10px] font-mono border border-[#D6CCB5]">Ctrl+V</kbd> paste supported
              </p>
            </div>

            {/* Sortable Thumbnail Strip */}
            {shots.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-[#78716C]">
                    Drag to reorder sequence:
                  </span>
                  <button
                    type="button"
                    onClick={() => setShots([])}
                    className="text-[11px] text-red-600 hover:underline"
                  >
                    Clear all
                  </button>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {shots.map((shot, idx) => (
                    <div
                      key={shot.id}
                      draggable
                      onDragStart={() => handleThumbnailDragStart(idx)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleThumbnailDrop(idx)}
                      className={`group relative aspect-video cursor-grab overflow-hidden rounded-xl border bg-black shadow-xs transition active:cursor-grabbing ${
                        draggedShotIdx === idx ? "opacity-40 border-blue-500" : "border-[#D6CCB5]"
                      }`}
                      title="Drag to reorder"
                    >
                      <img
                        src={shot.url}
                        alt={`Step ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                      {/* Step Number Badge */}
                      <span className="absolute bottom-1 left-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-xs">
                        {idx + 1}
                      </span>
                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeShot(idx)}
                        className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-black/75 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove screenshot"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Guide Goal / Context (Optional) Single Line */}
            <div className="mt-5">
              <label className="block text-xs font-bold text-[#1A1917] mb-1.5">
                Guide Goal / Context <span className="font-normal text-[#78716C]">(Optional)</span>
              </label>
              <input
                type="text"
                value={goalContext}
                onChange={(e) => setGoalContext(e.target.value)}
                placeholder="e.g. How to export a CSV report in Stripe"
                className="w-full rounded-xl border border-[#D6CCB5] bg-white px-3.5 py-2.5 text-xs md:text-sm text-[#1A1917] placeholder:text-[#9E988D] focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {/* Output Style Pills (3 quick toggles) */}
            <div className="mt-5">
              <label className="block text-xs font-bold text-[#1A1917] mb-2 uppercase tracking-wider">
                Output Style
              </label>
              <div className="grid grid-cols-3 gap-2">
                {/* SOP */}
                <button
                  type="button"
                  onClick={() => setOutputStyle("sop")}
                  className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition ${
                    outputStyle === "sop"
                      ? "border-blue-600 bg-blue-50/50 text-blue-950 font-bold ring-1 ring-blue-600"
                      : "border-[#D6CCB5] bg-[#FAF7F0] text-[#4A4740] hover:border-blue-300 hover:bg-white"
                  }`}
                >
                  <span className="text-xs font-bold">SOP / Doc</span>
                  <span className="text-[10px] text-[#78716C] mt-0.5">Direct steps</span>
                </button>

                {/* Help Center */}
                <button
                  type="button"
                  onClick={() => setOutputStyle("help-center")}
                  className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition ${
                    outputStyle === "help-center"
                      ? "border-blue-600 bg-blue-50/50 text-blue-950 font-bold ring-1 ring-blue-600"
                      : "border-[#D6CCB5] bg-[#FAF7F0] text-[#4A4740] hover:border-blue-300 hover:bg-white"
                  }`}
                >
                  <span className="text-xs font-bold">Help Article</span>
                  <span className="text-[10px] text-[#78716C] mt-0.5">User-facing</span>
                </button>

                {/* Checklist */}
                <button
                  type="button"
                  onClick={() => setOutputStyle("checklist")}
                  className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition ${
                    outputStyle === "checklist"
                      ? "border-blue-600 bg-blue-50/50 text-blue-950 font-bold ring-1 ring-blue-600"
                      : "border-[#D6CCB5] bg-[#FAF7F0] text-[#4A4740] hover:border-blue-300 hover:bg-white"
                  }`}
                >
                  <span className="text-xs font-bold">Checklist</span>
                  <span className="text-[10px] text-[#78716C] mt-0.5">Quick actions</span>
                </button>
              </div>
            </div>

            {/* "Generate Guide" CTA Button */}
            <div className="mt-6 space-y-3">
              <button
                type="button"
                disabled={busy || !shots.length}
                onClick={handleGenerate}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-3.5 text-sm font-bold text-white shadow-md transition active:scale-98 disabled:opacity-50"
              >
                <Sparkles className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
                <span>{busy ? "Analyzing UI & Writing Steps..." : "✨ Generate Guide"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setGoalContext("How to connect a custom domain");
                  setGuide(DEFAULT_SAMPLE_GUIDE);
                  setShots([
                    { id: "s1", url: screen1, name: "domain-settings.png" },
                    { id: "s2", url: screen2, name: "dns-records.png" },
                    { id: "s3", url: screen3, name: "activate-ssl.png" },
                  ]);
                  showToast("Loaded instant 3-step domain sample guide!");
                }}
                className="w-full text-center text-xs font-semibold text-blue-600 hover:underline"
              >
                Reload instant 3-step sample demo →
              </button>
            </div>
          </div>
        </div>

        {/* 2. OUTPUT WORKSPACE (Right Column - approx 7 cols) */}
        <div className="lg:col-span-7">
          <div className="rounded-3xl border border-[#D6CCB5] bg-white p-6 md:p-8 shadow-sm space-y-6">
            {/* Top Workspace Header & One-Click Export Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EFECE6] pb-4">
              <div>
                <span className="text-[11px] font-bold tracking-widest text-[#78716C] uppercase">
                  OUTPUT WORKSPACE
                </span>
                <p className="text-xs text-[#78716C]">
                  Click on any text or screenshot to edit instructions & reposition action pins
                </p>
              </div>

              {/* One-Click Export Bar */}
              <div className="flex flex-wrap items-center gap-2 print:hidden">
                <button
                  type="button"
                  onClick={exportCopyMarkdown}
                  className="flex items-center gap-1.5 rounded-lg border border-[#D6CCB5] bg-white px-3 py-1.5 text-xs font-semibold text-[#1A1917] hover:border-[#000000] hover:bg-[#FAF7F0] transition active:scale-95 shadow-xs"
                  title="Copy as Markdown for Notion, GitHub, Confluence"
                >
                  <FileCode className="h-3.5 w-3.5 text-blue-600" />
                  <span>Copy Markdown</span>
                </button>

                <button
                  type="button"
                  onClick={exportCopyRichText}
                  className="flex items-center gap-1.5 rounded-lg border border-[#D6CCB5] bg-white px-3 py-1.5 text-xs font-semibold text-[#1A1917] hover:border-[#000000] hover:bg-[#FAF7F0] transition active:scale-95 shadow-xs"
                  title="Copy Rich Text for Google Docs, Word"
                >
                  <Copy className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Copy Rich Text</span>
                </button>

                <button
                  type="button"
                  onClick={exportDownloadHtml}
                  className="flex items-center gap-1.5 rounded-lg border border-[#D6CCB5] bg-white px-3 py-1.5 text-xs font-semibold text-[#1A1917] hover:border-[#000000] hover:bg-[#FAF7F0] transition active:scale-95 shadow-xs"
                  title="Download HTML file"
                >
                  <Download className="h-3.5 w-3.5 text-purple-600" />
                  <span>HTML</span>
                </button>

                <button
                  type="button"
                  onClick={exportPrintPdf}
                  className="flex items-center gap-1.5 rounded-lg border border-[#D6CCB5] bg-white px-3 py-1.5 text-xs font-semibold text-[#1A1917] hover:border-[#000000] hover:bg-[#FAF7F0] transition active:scale-95 shadow-xs"
                  title="Download or Print PDF"
                >
                  <Printer className="h-3.5 w-3.5 text-red-600" />
                  <span>PDF</span>
                </button>
              </div>
            </div>

            {/* Editable Guide Title & Intro */}
            <div className="space-y-3">
              <div className="relative group">
                <input
                  type="text"
                  value={guide.title}
                  onChange={(e) => setGuide({ ...guide, title: e.target.value })}
                  className="w-full text-2xl md:text-3xl font-extrabold text-[#1A1917] tracking-tight font-serif bg-transparent border-b border-transparent hover:border-[#D6CCB5] focus:border-blue-600 focus:outline-none py-1"
                  placeholder="Enter guide title..."
                />
                <Edit3 className="h-3.5 w-3.5 text-[#78716C] absolute right-2 top-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>

              <div className="relative group">
                <textarea
                  rows={2}
                  value={guide.summary}
                  onChange={(e) => setGuide({ ...guide, summary: e.target.value })}
                  className="w-full text-xs md:text-sm text-[#4A4740] leading-relaxed bg-transparent border-b border-transparent hover:border-[#D6CCB5] focus:border-blue-600 focus:outline-none resize-none py-1"
                  placeholder="Enter 1-sentence guide overview..."
                />
                <Edit3 className="h-3.5 w-3.5 text-[#78716C] absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>
            </div>

            {/* Numbered Step Cards */}
            <div className="space-y-8 pt-2">
              {guide.steps.map((step, idx) => (
                <div
                  key={step.id || idx}
                  className="group/step relative rounded-2xl border border-[#D6CCB5]/80 bg-[#FAF7F0]/30 p-5 transition hover:border-[#D6CCB5] hover:bg-[#FAF7F0]/60 space-y-4"
                >
                  {/* Step Top Bar: Number + Editable Heading + Step Controls */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-xs mt-0.5">
                        {step.stepNumber}
                      </span>
                      <div className="flex-1 space-y-1">
                        {/* Editable Step Heading */}
                        <input
                          type="text"
                          value={step.heading}
                          onChange={(e) => {
                            const copy = [...guide.steps];
                            copy[idx].heading = e.target.value;
                            setGuide({ ...guide, steps: copy });
                          }}
                          className="w-full text-base font-bold text-[#1A1917] bg-transparent border-b border-transparent hover:border-[#D6CCB5] focus:border-blue-600 focus:outline-none"
                          placeholder="Action verb + UI element..."
                        />
                        {/* Editable Instruction */}
                        <textarea
                          rows={2}
                          value={step.instruction}
                          onChange={(e) => {
                            const copy = [...guide.steps];
                            copy[idx].instruction = e.target.value;
                            setGuide({ ...guide, steps: copy });
                          }}
                          className="w-full text-xs md:text-sm text-[#4A4740] bg-transparent border-b border-transparent hover:border-[#D6CCB5] focus:border-blue-600 focus:outline-none resize-none"
                          placeholder="Describe specific instruction..."
                        />
                      </div>
                    </div>

                    {/* Step Controls (Add / Delete) */}
                    <div className="flex items-center gap-1 opacity-80 group-hover/step:opacity-100 transition-opacity print:hidden">
                      <button
                        type="button"
                        onClick={() => addStepAfter(idx)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#D6CCB5] bg-white text-[#4A4740] hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition"
                        title="Add step after this"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteStep(idx)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#D6CCB5] bg-white text-[#4A4740] hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition"
                        title="Delete this step"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Annotated Screenshot Preview with Free Cursor Dragging Pin */}
                  {step.imageUrl && (
                    <div className="space-y-1.5 ml-10">
                      <div
                        onPointerDown={(e) => handlePinPointerDown(idx, e)}
                        onPointerMove={(e) => handlePinPointerMove(idx, e)}
                        onPointerUp={(e) => handlePinPointerUp(idx, e)}
                        onPointerCancel={(e) => handlePinPointerUp(idx, e)}
                        className={`relative touch-none overflow-hidden rounded-2xl border bg-black shadow-sm group/img ${
                          activeDragStep === idx
                            ? "cursor-grabbing border-blue-500 ring-2 ring-blue-400/40"
                            : "cursor-crosshair border-[#D6CCB5]"
                        }`}
                        title="Click or drag freely anywhere to position the highlight pin"
                      >
                        <img
                          src={step.imageUrl}
                          alt={step.heading}
                          draggable={false}
                          className="w-full h-auto max-h-[460px] object-contain bg-white pointer-events-none select-none"
                        />

                        {/* Interactive Highlight Pin & Crosshair Guide */}
                        {step.annotation && (() => {
                          const ann = step.annotation;
                          const col = HOTSPOT_COLORS[ann.color || "blue"];
                          const shape = ann.shape || "circle";
                          const size = ann.size || "md";
                          const pulse = ann.pulse ?? true;
                          const pos = ann.labelPosition || "right";
                          const theme = ann.labelTheme || "dark";
                          const showNum = ann.showStepNumber ?? true;

                          // Size styling map
                          const sizeStyles = {
                            sm: { pin: "h-6 w-6 text-[10px]", ring: "h-7 w-7", icon: "h-3 w-3", box: "w-24 h-10" },
                            md: { pin: "h-7 w-7 text-xs", ring: "h-8 w-8", icon: "h-3.5 w-3.5", box: "w-32 h-12" },
                            lg: { pin: "h-9 w-9 text-sm", ring: "h-10 w-10", icon: "h-4 w-4", box: "w-40 h-16" },
                          }[size];

                          // Flex positioning for label
                          const posClass = {
                            right: "flex-row items-center",
                            left: "flex-row-reverse items-center",
                            bottom: "flex-col items-center",
                            top: "flex-col-reverse items-center",
                          }[pos];

                          // Label theme styling
                          const themeStyles = {
                            dark: "bg-black/90 text-white border-white/20 hover:border-blue-400 focus:border-blue-500",
                            light: "bg-white/95 text-[#1A1917] border-[#D6CCB5] shadow-lg hover:border-blue-500 focus:border-blue-600",
                            match: `${col.bg}/90 text-white border-white/30 hover:border-white focus:border-white shadow-lg`,
                          }[theme];

                          return (
                            <>
                              {/* Crosshair guide lines while dragging */}
                              {activeDragStep === idx && (
                                <>
                                  <div
                                    className="pointer-events-none absolute inset-y-0 w-px border-l border-dashed border-blue-400/70"
                                    style={{ left: `${ann.x}%` }}
                                  />
                                  <div
                                    className="pointer-events-none absolute inset-x-0 h-px border-t border-dashed border-blue-400/70"
                                    style={{ top: `${ann.y}%` }}
                                  />
                                </>
                              )}

                              {/* The Highlight Pin / Hotspot Container */}
                              <div
                                className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 flex ${posClass} gap-1.5 transition-transform duration-75 ${
                                  activeDragStep === idx ? "scale-125 z-30" : "scale-100 z-10"
                                }`}
                                style={{
                                  left: `${ann.x}%`,
                                  top: `${ann.y}%`,
                                }}
                              >
                                {/* SHAPE 1: CIRCLE PIN */}
                                {shape === "circle" && (
                                  <span className={`relative flex ${sizeStyles.ring} items-center justify-center shrink-0`}>
                                    {pulse && (
                                      <span
                                        className={`absolute inline-flex h-full w-full rounded-full ${col.bg} ${
                                          activeDragStep === idx
                                            ? "animate-none opacity-40 ring-4 ring-white"
                                            : "animate-ping opacity-75"
                                        }`}
                                      />
                                    )}
                                    <span
                                      className={`relative inline-flex ${sizeStyles.pin} items-center justify-center rounded-full ${col.bg} border-2 border-white text-white font-black shadow-xl`}
                                    >
                                      {showNum ? step.stepNumber : <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                                    </span>
                                  </span>
                                )}

                                {/* SHAPE 2: FOCUS BOX */}
                                {shape === "box" && (
                                  <div
                                    className={`pointer-events-none relative rounded-xl border-2 border-dashed ${col.border} ${col.bg}/15 backdrop-blur-xs flex items-center justify-center p-1 shadow-lg ring-1 ${col.ring}/40 ${sizeStyles.box} shrink-0`}
                                  >
                                    <span
                                      className={`absolute -top-2.5 -left-2.5 inline-flex ${sizeStyles.pin} items-center justify-center rounded-full ${col.bg} border-2 border-white text-white font-black shadow-md`}
                                    >
                                      {showNum ? step.stepNumber : <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                                    </span>
                                  </div>
                                )}

                                {/* SHAPE 3: TARGET ARROW */}
                                {shape === "arrow" && (
                                  <div className="relative flex items-center justify-center shrink-0">
                                    {pulse && (
                                      <span
                                        className={`absolute inline-flex ${sizeStyles.ring} rounded-full ${col.bg} animate-ping opacity-60`}
                                      />
                                    )}
                                    <span
                                      className={`relative inline-flex ${sizeStyles.pin} items-center justify-center rounded-full ${col.bg} border-2 border-white text-white font-black shadow-xl`}
                                    >
                                      <ArrowUpRight className={`${sizeStyles.icon} text-white stroke-[2.5]`} />
                                    </span>
                                  </div>
                                )}

                                {/* SHAPE 4: BEACON */}
                                {shape === "beacon" && (
                                  <span className={`relative flex ${sizeStyles.ring} items-center justify-center shrink-0`}>
                                    {pulse && (
                                      <>
                                        <span
                                          className={`absolute inline-flex h-full w-full rounded-full ${col.bg} animate-ping opacity-85`}
                                        />
                                        <span
                                          className={`absolute inline-flex h-4/5 w-4/5 rounded-full ${col.bg} opacity-50 ring-2 ${col.ring}`}
                                        />
                                      </>
                                    )}
                                    <span
                                      className={`relative inline-flex ${sizeStyles.pin} items-center justify-center rounded-full ${col.bg} border-2 border-white shadow-xl text-white font-black`}
                                    >
                                      {showNum ? step.stepNumber : <span className="h-2 w-2 rounded-full bg-white" />}
                                    </span>
                                  </span>
                                )}

                                {/* Editable Label badge beside the highlight shape */}
                                {activeDragStep === idx ? (
                                  <span className="pointer-events-none rounded-md bg-black/90 px-2 py-0.5 text-[10px] font-mono font-bold text-blue-300 shadow-md backdrop-blur border border-blue-400/40 whitespace-nowrap">
                                    {ann.x}%, {ann.y}%
                                  </span>
                                ) : (
                                  <div
                                    className="pointer-events-auto flex items-center select-text"
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <input
                                      type="text"
                                      value={ann.label ?? ""}
                                      onChange={(e) => updateStepAnnotation(idx, { label: e.target.value })}
                                      onPointerDown={(e) => e.stopPropagation()}
                                      onMouseDown={(e) => e.stopPropagation()}
                                      onKeyDown={(e) => e.stopPropagation()}
                                      className={`cursor-text rounded-md px-2 py-0.5 text-[11px] font-bold shadow-md backdrop-blur border focus:outline-none w-28 sm:w-36 text-left transition select-text ${themeStyles}`}
                                      title="Click to edit highlight label text"
                                      placeholder={`Action ${step.stepNumber}...`}
                                    />
                                  </div>
                                )}
                              </div>
                            </>
                          );
                        })()}

                        {/* Hover guidance overlay */}
                        <div
                          className={`absolute inset-x-0 bottom-0 bg-black/60 py-1.5 px-3 text-center text-[10px] font-medium text-white transition-opacity backdrop-blur-xs flex items-center justify-center gap-1.5 print:hidden pointer-events-none ${
                            activeDragStep === idx ? "opacity-100" : "opacity-0 group-hover/img:opacity-100"
                          }`}
                        >
                          <Crosshair className="h-3 w-3 text-blue-400" />
                          <span>
                            {activeDragStep === idx
                              ? "Dragging hotspot pin freely across image..."
                              : "Drag freely or click to position hotspot • Customize styling below"}
                          </span>
                        </div>
                      </div>

                      {/* Hotspot & Label Properties Inspector */}
                      {step.annotation ? (
                        <div className="rounded-xl border border-[#D6CCB5] bg-[#F7F4EE] p-2.5 print:hidden select-text text-xs space-y-2">
                          {/* Row 1: Quick Properties Controls */}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            {/* Label text input */}
                            <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                              <Tag className="h-3.5 w-3.5 text-[#78716C] shrink-0" />
                              <span className="font-semibold text-[#1A1917] text-[11px] shrink-0">Label:</span>
                              <input
                                type="text"
                                value={step.annotation.label ?? ""}
                                onChange={(e) => updateStepAnnotation(idx, { label: e.target.value })}
                                placeholder={`Action ${step.stepNumber}...`}
                                className="flex-1 rounded-md border border-[#D6CCB5] bg-white px-2 py-1 text-xs font-medium text-[#1A1917] focus:border-blue-600 focus:outline-none min-w-[120px]"
                              />
                            </div>

                            {/* Quick Color Swatches */}
                            <div className="flex items-center gap-1.5" title="Hotspot Color Theme">
                              {(Object.keys(HOTSPOT_COLORS) as HotspotColor[]).map((cKey) => {
                                const c = HOTSPOT_COLORS[cKey];
                                const isActive = (step.annotation?.color || "blue") === cKey;
                                return (
                                  <button
                                    key={cKey}
                                    type="button"
                                    onClick={() => updateStepAnnotation(idx, { color: cKey })}
                                    className={`h-4.5 w-4.5 rounded-full ${c.bg} transition-all ${
                                      isActive
                                        ? "ring-2 ring-offset-1 ring-[#1A1917] scale-110"
                                        : "opacity-75 hover:opacity-100 hover:scale-105"
                                    }`}
                                    title={`Color: ${c.name}`}
                                  />
                                );
                              })}
                            </div>

                            {/* Quick Shape Selector */}
                            <div className="flex items-center rounded-lg border border-[#D6CCB5] bg-white p-0.5 text-[10px] font-semibold text-[#1A1917]">
                              {[
                                { id: "circle", label: "Dot", icon: Circle },
                                { id: "box", label: "Box", icon: Square },
                                { id: "arrow", label: "Arrow", icon: ArrowUpRight },
                                { id: "beacon", label: "Beacon", icon: Radio },
                              ].map((s) => {
                                const isActive = (step.annotation?.shape || "circle") === s.id;
                                const IconComp = s.icon;
                                return (
                                  <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => updateStepAnnotation(idx, { shape: s.id as HotspotShape })}
                                    className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition ${
                                      isActive
                                        ? "bg-[#1A1917] text-white shadow-xs"
                                        : "text-[#78716C] hover:text-[#1A1917] hover:bg-stone-100"
                                    }`}
                                    title={`Shape: ${s.label}`}
                                  >
                                    <IconComp className="h-3 w-3" />
                                    <span className="hidden sm:inline">{s.label}</span>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Toggle Detailed Properties Button */}
                            <button
                              type="button"
                              onClick={() => setExpandedPropsStep(expandedPropsStep === idx ? null : idx)}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition ${
                                expandedPropsStep === idx
                                  ? "bg-blue-50 border-blue-400 text-blue-700 shadow-xs"
                                  : "bg-white border-[#D6CCB5] text-[#4A4740] hover:border-[#1A1917] hover:text-[#1A1917]"
                              }`}
                              title="Open Hotspot & Label properties panel"
                            >
                              <Sliders className="h-3 w-3" />
                              <span>Properties</span>
                              <ChevronDown
                                className={`h-3 w-3 transition-transform duration-200 ${
                                  expandedPropsStep === idx ? "rotate-180" : ""
                                }`}
                              />
                            </button>
                          </div>

                          {/* Row 2: Expanded Properties Drawer */}
                          {expandedPropsStep === idx && (
                            <div className="pt-2 border-t border-[#D6CCB5]/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
                              {/* Property 1: Label Placement */}
                              <div className="space-y-1">
                                <span className="font-semibold text-[#1A1917] block">Label Position</span>
                                <div className="grid grid-cols-4 gap-1 bg-white border border-[#D6CCB5] rounded-md p-0.5 text-center font-medium">
                                  {(["left", "top", "bottom", "right"] as LabelPosition[]).map((pos) => {
                                    const isAct = (step.annotation?.labelPosition || "right") === pos;
                                    return (
                                      <button
                                        key={pos}
                                        type="button"
                                        onClick={() => updateStepAnnotation(idx, { labelPosition: pos })}
                                        className={`py-0.5 rounded text-[10px] capitalize transition ${
                                          isAct ? "bg-[#1A1917] text-white font-bold" : "text-[#78716C] hover:bg-stone-100"
                                        }`}
                                      >
                                        {pos}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Property 2: Label Theme Style */}
                              <div className="space-y-1">
                                <span className="font-semibold text-[#1A1917] block">Label Theme</span>
                                <div className="grid grid-cols-3 gap-1 bg-white border border-[#D6CCB5] rounded-md p-0.5 text-center font-medium">
                                  {[
                                    { id: "dark", label: "Dark" },
                                    { id: "light", label: "Light" },
                                    { id: "match", label: "Color" },
                                  ].map((th) => {
                                    const isAct = (step.annotation?.labelTheme || "dark") === th.id;
                                    return (
                                      <button
                                        key={th.id}
                                        type="button"
                                        onClick={() => updateStepAnnotation(idx, { labelTheme: th.id as LabelTheme })}
                                        className={`py-0.5 rounded text-[10px] transition ${
                                          isAct ? "bg-[#1A1917] text-white font-bold" : "text-[#78716C] hover:bg-stone-100"
                                        }`}
                                      >
                                        {th.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Property 3: Hotspot Size */}
                              <div className="space-y-1">
                                <span className="font-semibold text-[#1A1917] block">Hotspot Size</span>
                                <div className="grid grid-cols-3 gap-1 bg-white border border-[#D6CCB5] rounded-md p-0.5 text-center font-medium">
                                  {[
                                    { id: "sm", label: "Small" },
                                    { id: "md", label: "Medium" },
                                    { id: "lg", label: "Large" },
                                  ].map((sz) => {
                                    const isAct = (step.annotation?.size || "md") === sz.id;
                                    return (
                                      <button
                                        key={sz.id}
                                        type="button"
                                        onClick={() => updateStepAnnotation(idx, { size: sz.id as HotspotSize })}
                                        className={`py-0.5 rounded text-[10px] transition ${
                                          isAct ? "bg-[#1A1917] text-white font-bold" : "text-[#78716C] hover:bg-stone-100"
                                        }`}
                                      >
                                        {sz.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Property 4: Pulse & Number Toggles */}
                              <div className="space-y-1">
                                <span className="font-semibold text-[#1A1917] block">Animation & Badges</span>
                                <div className="flex items-center gap-1.5 pt-0.5">
                                  <button
                                    type="button"
                                    onClick={() => updateStepAnnotation(idx, { pulse: !(step.annotation?.pulse ?? true) })}
                                    className={`flex-1 py-1 px-1.5 rounded border text-[10px] font-semibold transition flex items-center justify-center gap-1 ${
                                      step.annotation?.pulse ?? true
                                        ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                                        : "bg-white border-[#D6CCB5] text-[#78716C]"
                                    }`}
                                  >
                                    <Zap className="h-2.5 w-2.5" />
                                    {(step.annotation?.pulse ?? true) ? "Pulse ON" : "Pulse OFF"}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateStepAnnotation(idx, {
                                        showStepNumber: !(step.annotation?.showStepNumber ?? true),
                                      })
                                    }
                                    className={`flex-1 py-1 px-1.5 rounded border text-[10px] font-semibold transition flex items-center justify-center gap-1 ${
                                      step.annotation?.showStepNumber ?? true
                                        ? "bg-blue-50 border-blue-300 text-blue-800"
                                        : "bg-white border-[#D6CCB5] text-[#78716C]"
                                    }`}
                                  >
                                    {(step.annotation?.showStepNumber ?? true) ? "# Number" : "• Plain"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Row 3: Coordinate Readout & Quick Actions */}
                          <div className="flex flex-wrap items-center justify-between text-[10px] text-[#78716C] pt-1 border-t border-[#D6CCB5]/60">
                            <span>
                              Hotspot at ({step.annotation.x}%, {step.annotation.y}%) • Drag freely on image to relocate
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => updateStepAnnotation(idx, { x: 50, y: 50 })}
                                className="hover:text-[#1A1917] underline decoration-dotted"
                              >
                                Center Hotspot
                              </button>
                              <span>•</span>
                              <button
                                type="button"
                                onClick={() => toggleHotspot(idx)}
                                className="text-red-600 hover:text-red-800 hover:underline"
                              >
                                Remove Hotspot
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleHotspot(idx)}
                          className="w-full py-2 rounded-xl border border-dashed border-[#D6CCB5] bg-white text-xs font-semibold text-[#4A4740] hover:border-blue-500 hover:text-blue-600 flex items-center justify-center gap-1.5 transition print:hidden"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Add Hotspot & Label to Screenshot</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Bottom Add Step Button */}
            <div className="pt-2 text-center print:hidden">
              <button
                type="button"
                onClick={() => addStepAfter(guide.steps.length - 1)}
                className="inline-flex items-center gap-2 rounded-xl border border-dashed border-[#D6CCB5] hover:border-blue-500 bg-[#FAF7F0]/50 hover:bg-blue-50/50 px-5 py-2.5 text-xs font-bold text-blue-700 transition"
              >
                <Plus className="h-4 w-4" />
                <span>Add Another Step</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
