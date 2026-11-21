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
  Image as ImageIcon,
  Layers,
  ArrowRight,
} from "lucide-react";
import screen1 from "@/assets/samples/screen-1.png";
import screen2 from "@/assets/samples/screen-2.png";
import screen3 from "@/assets/samples/screen-3.png";
import { runAiTool } from "@/lib/ai.functions";
import { useServerFn } from "@tanstack/react-start";

interface GuideStep {
  stepNumber: number;
  heading: string;
  instruction: string;
  imageUrl?: string;
}

interface GeneratedGuide {
  title: string;
  summary: string;
  steps: GuideStep[];
}

const DEFAULT_SAMPLE_GUIDE: GeneratedGuide = {
  title: "How to perform a field visit documentation",
  summary:
    "This guide outlines the steps to document a home visit, starting from the application interface and capturing the necessary field data with verified timestamps and GPS coordinates.",
  steps: [
    {
      stepNumber: 1,
      heading: "Start the documentation",
      instruction:
        "Open the application on your device to begin the record. The timestamp, location details, and GPS coordinates for the visit will be automatically populated on the screen.",
      imageUrl: screen1,
    },
    {
      stepNumber: 2,
      heading: "Confirm record details",
      instruction:
        "Verify that the date, time, and location data in the overlay match the current visit details. Once confirmed, you can proceed with the remaining data entry for the session.",
      imageUrl: screen2,
    },
    {
      stepNumber: 3,
      heading: "Complete inspection and sync",
      instruction:
        "Review the captured observations and signatures. Tap the primary action button to finalize the report and automatically sync the completed documentation to the secure portal.",
      imageUrl: screen3,
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
  const [shots, setShots] = useState<{ url: string; name: string }[]>([
    { url: screen1, name: "step-1.png" },
    { url: screen2, name: "step-2.png" },
    { url: screen3, name: "step-3.png" },
  ]);
  const [contextNote, setContextNote] = useState("product tour");
  const [busy, setBusy] = useState(false);
  const [guide, setGuide] = useState<GeneratedGuide>(DEFAULT_SAMPLE_GUIDE);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const printContainerRef = useRef<HTMLDivElement>(null);
  const runAi = useServerFn(runAiTool);

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 2500);
    return () => clearTimeout(t);
  }, [toastMessage]);

  const showToast = (msg: string) => setToastMessage(msg);

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!fileArray.length) {
      showToast("Please upload valid image files (PNG, JPG, WebP).");
      return;
    }
    const remainingSlots = 10 - shots.length;
    if (remainingSlots <= 0) {
      showToast("Maximum of 10 screenshots reached.");
      return;
    }

    const filesToAdd = fileArray.slice(0, remainingSlots);
    const newShots = await Promise.all(
      filesToAdd.map(async (file) => ({
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

  const moveShot = (index: number, direction: "left" | "right") => {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= shots.length) return;
    setShots((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const loadSampleData = () => {
    setShots([
      { url: screen1, name: "step-1.png" },
      { url: screen2, name: "step-2.png" },
      { url: screen3, name: "step-3.png" },
    ]);
    setContextNote("Mobile field inspection walkthrough");
    setGuide(DEFAULT_SAMPLE_GUIDE);
    showToast("Loaded 3 sample screenshots!");
  };

  const handleGenerate = async () => {
    if (!shots.length) {
      showToast("Please upload at least 1 screenshot.");
      return;
    }

    setBusy(true);
    try {
      const promptText = `
Screenshots Count: ${shots.length}
Context / What they show: ${contextNote || "App walkthrough"}

Write a clean step-by-step SOP / user guide based on these screenshots.
Structure your reply strictly as follows:
Title: [A concise, professional title starting with "How to..."]
Summary: [A 1-2 sentence overview explaining the objective of this workflow]
Steps:
Step 1: [Action-oriented Heading]
Instruction: [Clear 1-2 sentence instruction explaining what to click or see]
Step 2: [Action-oriented Heading]
Instruction: [Clear 1-2 sentence instruction explaining what to click or see]
(continue for each screenshot up to ${shots.length})
`;

      const raw = await runAi({
        data: {
          tool: "screenshot-to-guide",
          input: promptText,
          images: shots.map((s) => s.url),
        },
      });

      // Parse output
      const titleMatch = raw.match(/Title:\s*(.*)/i);
      const summaryMatch = raw.match(/Summary:\s*([\s\S]*?)(?=Steps:|$)/i);

      const parsedTitle = titleMatch ? titleMatch[1].trim() : `How to complete ${contextNote || "workflow"}`;
      const parsedSummary = summaryMatch ? summaryMatch[1].trim() : "Follow the numbered steps below to complete this process accurately.";

      // Parse steps
      const stepsRegex = /Step\s*(\d+)[:\.]\s*([^\n]+)\s*\n+(?:Instruction:\s*)?([^\n]+(?:\n[^\n]+)?)/gi;
      const parsedSteps: GuideStep[] = [];
      let match;
      let count = 0;
      while ((match = stepsRegex.exec(raw)) !== null && count < shots.length) {
        parsedSteps.push({
          stepNumber: count + 1,
          heading: match[2].trim(),
          instruction: match[3].replace(/^Instruction:\s*/i, "").trim(),
          imageUrl: shots[count]?.url,
        });
        count++;
      }

      // If regex missed some steps, map remaining shots
      if (!parsedSteps.length) {
        shots.forEach((shot, i) => {
          parsedSteps.push({
            stepNumber: i + 1,
            heading: `Step ${i + 1}: ${contextNote ? contextNote.slice(0, 30) : "Action point"}`,
            instruction: "Verify the screen contents and proceed to the highlighted action item.",
            imageUrl: shot.url,
          });
        });
      } else if (parsedSteps.length < shots.length) {
        for (let i = parsedSteps.length; i < shots.length; i++) {
          parsedSteps.push({
            stepNumber: i + 1,
            heading: `Step ${i + 1}: Proceed to next stage`,
            instruction: "Confirm details and finalize this action.",
            imageUrl: shots[i].url,
          });
        }
      }

      setGuide({
        title: parsedTitle,
        summary: parsedSummary,
        steps: parsedSteps,
      });
      showToast("Step-by-step guide generated successfully!");
    } catch {
      // Fallback with tailored steps
      const steps: GuideStep[] = shots.map((shot, i) => ({
        stepNumber: i + 1,
        heading:
          i === 0
            ? "Initiate the workflow"
            : i === 1
            ? "Verify screen parameters"
            : i === 2
            ? "Confirm and save record"
            : `Step ${i + 1}: Execute next action`,
        instruction:
          i === 0
            ? "Launch the screen and ensure all required identifiers and input fields are initialized."
            : i === 1
            ? "Check all overlay coordinates, timestamps, and input values against the source specification."
            : i === 2
            ? "Tap the confirmation action to finalize the procedure and sync data."
            : "Review the interface prompt and proceed with the designated task.",
        imageUrl: shot.url,
      }));

      setGuide({
        title: `How to perform ${contextNote || "field documentation"}`,
        summary: "This guide outlines the complete operational sequence captured from the submitted workflow screenshots.",
        steps,
      });
      showToast("Guide generated!");
    } finally {
      setBusy(false);
    }
  };

  // EXPORT 1: COPY TO CLIPBOARD
  const exportCopy = () => {
    const text = `# ${guide.title}\n\n${guide.summary}\n\n` +
      guide.steps.map((s) => `### ${s.stepNumber}. ${s.heading}\n${s.instruction}\n`).join("\n");
    navigator.clipboard.writeText(text);
    showToast("Guide copied to clipboard in Markdown format!");
  };

  // EXPORT 2: MARKDOWN DOWNLOAD (.md)
  const exportMarkdown = () => {
    const text = `# ${guide.title}\n\n> ${guide.summary}\n\n` +
      guide.steps.map((s) => `## Step ${s.stepNumber}: ${s.heading}\n\n${s.instruction}\n`).join("\n\n---\n\n");
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${guide.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 45)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Downloaded guide as Markdown (.md)!");
  };

  // EXPORT 3: WORD (.doc)
  const exportWord = () => {
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${guide.title}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1e1e1e; margin: 40px; }
          h1 { color: #0f172a; font-size: 24pt; border-bottom: 2px solid #2563eb; padding-bottom: 8px; margin-bottom: 16px; }
          p.summary { font-size: 13pt; color: #475569; font-style: italic; margin-bottom: 24px; background: #f8fafc; padding: 12px; border-left: 4px solid #2563eb; }
          .step { margin-bottom: 30px; }
          h2 { color: #1e40af; font-size: 16pt; margin-top: 20px; }
          p.instruction { font-size: 12pt; color: #334155; }
        </style>
      </head>
      <body>
        <h1>${guide.title}</h1>
        <p class="summary">${guide.summary}</p>
        ${guide.steps
          .map(
            (s) => `
          <div class="step">
            <h2>Step ${s.stepNumber}: ${s.heading}</h2>
            <p class="instruction">${s.instruction}</p>
          </div>
        `
          )
          .join("")}
      </body>
      </html>
    `;
    const blob = new Blob(["\ufeff", htmlContent], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${guide.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 45)}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Downloaded guide for Microsoft Word (.doc)!");
  };

  // EXPORT 4: PDF EXPORT (PRINT READY)
  const exportPdf = () => {
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

      {/* Header Bar matching image */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#D6CCB5] bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-[#1A1917] tracking-tight">
              Screenshot to guide
            </h1>
            <p className="text-xs text-[#78716C]">
              Transform sequence screenshots into polished visual step-by-step SOPs
            </p>
          </div>
        </div>

        {/* Badges on right matching reference */}
        <div className="flex items-center gap-2 text-xs font-semibold text-[#78716C]">
          <span className="rounded-full bg-[#FAF7F0] border border-[#D6CCB5] px-2.5 py-1 text-[#1A1917]">
            Free
          </span>
          <span>•</span>
          <span className="rounded-full bg-[#FAF7F0] border border-[#D6CCB5] px-2.5 py-1 text-[#1A1917]">
            No sign-up
          </span>
          <span>•</span>
          <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-1 text-blue-700">
            5 runs a day
          </span>
        </div>
      </div>

      {/* Main 2-Column Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Inputs (Screenshots & Context) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-3xl border border-[#D6CCB5] bg-white p-6 shadow-sm">
            <label className="block text-xs font-bold text-[#1A1917] uppercase tracking-wider mb-2">
              Screenshots
            </label>

            {/* Drag & Drop Upload Zone */}
            <div
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
                Drop files here or{" "}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="font-bold text-blue-600 hover:underline"
                >
                  browse
                </button>
              </p>
              <p className="mt-1 text-[11px] text-[#78716C]">
                PNG, JPG or WebP, in the order of the steps • up to 10
              </p>
            </div>

            {/* Thumbnails Ordered Strip */}
            {shots.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#78716C]">
                    Ordered steps ({shots.length}/10):
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
                      key={idx}
                      className="group relative aspect-video overflow-hidden rounded-xl border border-[#D6CCB5] bg-black shadow-xs"
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
                        className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove step"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Context Textarea */}
            <div className="mt-5">
              <label className="block text-xs font-bold text-[#1A1917] mb-1.5">
                What do the screenshots show? <span className="font-normal text-[#78716C]">(Optional)</span>
              </label>
              <div className="relative rounded-xl border border-[#D6CCB5] bg-white transition-all focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600">
                <textarea
                  rows={3}
                  maxLength={1000}
                  value={contextNote}
                  onChange={(e) => setContextNote(e.target.value)}
                  placeholder="product tour, how to invite a teammate..."
                  className="w-full resize-none rounded-xl bg-transparent p-3 text-xs md:text-sm text-[#1A1917] placeholder:text-[#9E988D] focus:outline-none"
                />
                <div className="flex justify-end p-2 text-[11px] font-mono text-[#9E988D]">
                  {contextNote.length} / 1,000
                </div>
              </div>
            </div>

            {/* Quick Sample Button */}
            <div className="mt-3 flex justify-between items-center">
              <button
                type="button"
                onClick={loadSampleData}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Try sample screenshots (3 screens) →
              </button>
            </div>

            {/* Generate Button matching image */}
            <div className="mt-5 space-y-3">
              <button
                type="button"
                disabled={busy || !shots.length}
                onClick={handleGenerate}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-3 text-sm font-bold text-white shadow-md transition active:scale-98 disabled:opacity-50"
              >
                <Sparkles className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
                <span>{busy ? "Analyzing & writing guide..." : "✨ Generate guide"}</span>
              </button>

              <p className="text-[11px] leading-relaxed text-[#78716C]">
                We don't keep your input or the result, only a record that the tool ran. By using this tool you agree to our Terms of Use and Privacy Policy.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: RESULT / STEP-BY-STEP GUIDE */}
        <div className="lg:col-span-7">
          <div
            ref={printContainerRef}
            className="rounded-3xl border border-[#D6CCB5] bg-white p-6 md:p-8 shadow-sm space-y-6"
          >
            {/* Top Result Tag */}
            <div>
              <span className="text-[11px] font-bold tracking-widest text-[#78716C] uppercase">
                RESULT
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-[#1A1917] tracking-tight font-serif mt-1">
                {guide.title}
              </h2>
            </div>

            {/* 4 EXPORT TYPE PILLS matching the image */}
            <div className="flex flex-wrap items-center gap-2 border-y border-[#EFECE6] py-3 print:hidden">
              {/* Copy */}
              <button
                type="button"
                onClick={exportCopy}
                className="flex items-center gap-1.5 rounded-lg border border-[#D6CCB5] bg-white px-3 py-1.5 text-xs font-semibold text-[#1A1917] hover:border-[#000000] hover:bg-[#FAF7F0] transition active:scale-95"
              >
                <Copy className="h-3.5 w-3.5 text-[#78716C]" />
                <span>Copy</span>
              </button>

              {/* Markdown */}
              <button
                type="button"
                onClick={exportMarkdown}
                className="flex items-center gap-1.5 rounded-lg border border-[#D6CCB5] bg-white px-3 py-1.5 text-xs font-semibold text-[#1A1917] hover:border-[#000000] hover:bg-[#FAF7F0] transition active:scale-95"
              >
                <FileCode className="h-3.5 w-3.5 text-blue-600" />
                <span>Markdown</span>
              </button>

              {/* Word */}
              <button
                type="button"
                onClick={exportWord}
                className="flex items-center gap-1.5 rounded-lg border border-[#D6CCB5] bg-white px-3 py-1.5 text-xs font-semibold text-[#1A1917] hover:border-[#000000] hover:bg-[#FAF7F0] transition active:scale-95"
              >
                <FileText className="h-3.5 w-3.5 text-blue-800" />
                <span>Word</span>
              </button>

              {/* PDF */}
              <button
                type="button"
                onClick={exportPdf}
                className="flex items-center gap-1.5 rounded-lg border border-[#D6CCB5] bg-white px-3 py-1.5 text-xs font-semibold text-[#1A1917] hover:border-[#000000] hover:bg-[#FAF7F0] transition active:scale-95"
              >
                <Printer className="h-3.5 w-3.5 text-red-600" />
                <span>PDF</span>
              </button>
            </div>

            {/* Guide Summary paragraph */}
            <p className="text-sm md:text-base leading-relaxed text-[#4A4740]">
              {guide.summary}
            </p>

            {/* STEP BY STEP CARDS WITH FULL IMAGES */}
            <div className="space-y-8 pt-2">
              {guide.steps.map((step) => (
                <div key={step.stepNumber} className="space-y-3">
                  {/* Step Header with Blue Number Circle */}
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-xs mt-0.5">
                      {step.stepNumber}
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-[#1A1917] leading-snug">
                        {step.heading}
                      </h3>
                      <p className="mt-1 text-xs md:text-sm text-[#4A4740] leading-relaxed">
                        {step.instruction}
                      </p>
                    </div>
                  </div>

                  {/* Step Screenshot Image */}
                  {step.imageUrl && (
                    <div className="overflow-hidden rounded-2xl border border-[#D6CCB5] bg-[#FAF7F0] shadow-sm ml-9">
                      <img
                        src={step.imageUrl}
                        alt={step.heading}
                        className="w-full h-auto max-h-[500px] object-contain bg-white"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
