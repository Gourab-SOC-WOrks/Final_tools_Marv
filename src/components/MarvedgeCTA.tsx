import { Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowUpRight,
  Play,
  Sparkles,
  ShieldCheck,
  Cpu,
  ArrowUp,
  Lock,
  CheckCircle2,
  Globe,
  FileText,
  Wrench,
  Sparkle,
} from "lucide-react";
import { MARVEDGE_URL, tools } from "@/lib/tools";
import marvedgeLogo from "@/assets/marvedge-logo.png";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function MarvedgeCTA({ context }: { context?: string }) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
      <div className="relative overflow-hidden rounded-[2rem] bg-[#000000] p-8 text-[#FFFFFF] shadow-2xl sm:p-14 lg:p-16">
        {/* Subtle structural ambient grid line */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #FFFFFF 1px, transparent 1px), linear-gradient(to bottom, #FFFFFF 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative z-10 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1 text-xs font-semibold tracking-wide text-[#AEBDCA]">
              <Sparkles className="h-3.5 w-3.5 text-[#7895B2]" />
              <span>THE MARVEDGE PLATFORM</span>
            </div>

            <h2 className="mt-5 font-serif text-3xl font-normal leading-[1.12] tracking-tight text-[#FFFFFF] sm:text-5xl">
              Turn everyday screen recordings into interactive product demos.
            </h2>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-[#AEBDCA] sm:text-lg">
              {context ?? "These focused utilities are lightweight stepping stones."} Marvedge transforms your screen captures into click-through interactive showcases, auto-reframes to 9:16 mobile feeds, and translates voiceovers across 30 languages.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href={MARVEDGE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#FFFFFF] px-6 py-3.5 text-sm font-semibold text-[#000000] shadow-md transition-all duration-200 hover:bg-[#E8DFCA] hover:shadow-lg active:scale-[0.98]"
              >
                <span>Explore the Marvedge Platform</span>
                <ArrowUpRight className="h-4 w-4" />
              </a>

              <a
                href={MARVEDGE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-transparent px-5 py-3.5 text-sm font-medium text-[#FFFFFF] transition-colors hover:border-white/40 hover:bg-white/5 active:scale-[0.98]"
              >
                <Play className="h-3.5 w-3.5 fill-current text-[#7895B2]" />
                <span>Watch 60s Demo</span>
              </a>
            </div>
          </div>

          {/* Apple-style Interactive Screen Preview Mockup */}
          <div className="relative rounded-2xl border border-white/10 bg-[#111111] p-5 shadow-inner">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-[#D95338]" />
                <div className="h-2.5 w-2.5 rounded-full bg-[#7895B2]" />
                <div className="h-2.5 w-2.5 rounded-full bg-white/20" />
              </div>
              <span className="font-mono text-[11px] text-white/50">marvedge.engine // live</span>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-white/5 p-3 text-xs">
                <span className="text-white/80">Auto-Reframe Subject Lock</span>
                <span className="rounded-md bg-[#7895B2]/20 px-2 py-0.5 font-mono text-[11px] text-[#7895B2]">
                  Active · 9:16
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-white/5 p-3 text-xs">
                <span className="text-white/80">Synthetic Voice Generation</span>
                <span className="rounded-md bg-white/10 px-2 py-0.5 font-mono text-[11px] text-[#AEBDCA]">
                  Studio Model · 0.2s latency
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-white/5 p-3 text-xs">
                <span className="text-white/80">Interactive Hotspot Telemetry</span>
                <span className="rounded-md bg-white/10 px-2 py-0.5 font-mono text-[11px] text-white/90">
                  Click-to-Advance
                </span>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-dashed border-[#7895B2]/40 bg-[#7895B2]/5 p-3 text-center text-xs text-[#7895B2]">
              Interactive canvas ready · Zero install required
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SiteFooter() {
  const [legalModal, setLegalModal] = useState<"privacy" | "terms" | "security" | null>(null);

  const freeUtilities = tools.filter((t) => t.category === "Free utility");
  const aiTools = tools.filter((t) => t.category === "AI tool");

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <>
      <footer className="border-t border-[#D6CCB5] bg-[#E8DFCA] pt-16 pb-12 text-[#000000]">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          {/* Main 5-Column Grid */}
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-12 lg:gap-8">
            {/* Column 1: Brand & Philosophy (spans 4 columns on large screens) */}
            <div className="lg:col-span-4 flex flex-col justify-between">
              <div>
                <Link to="/" className="inline-block transition-transform duration-200 hover:scale-105">
                  <img
                    src={marvedgeLogo}
                    alt="Marvedge Tools"
                    className="h-9 w-auto object-contain"
                  />
                </Link>

                <p className="mt-4 text-sm leading-relaxed text-[#000000]/75 max-w-sm">
                  Nineteen single-purpose media utilities and AI creative instruments. Built for creators, founders, and engineers. Zero server uploads for core utilities — 100% client-side privacy.
                </p>

                {/* Privacy & Engine Badges */}
                <div className="mt-6 flex flex-wrap gap-2">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-[#D6CCB5] bg-white px-3 py-1 text-[11px] font-semibold text-black shadow-xs">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Client-Side Wasm</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-[#D6CCB5] bg-white px-3 py-1 text-[11px] font-semibold text-black shadow-xs">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#7895B2]" />
                    <span>Zero Data Retention</span>
                  </div>
                </div>
              </div>

              {/* Marvedge Main CTA Pill */}
              <div className="mt-8 pt-6 border-t border-[#D6CCB5]/60">
                <div className="text-xs font-semibold text-black/50 uppercase tracking-wider">Flagship Platform</div>
                <a
                  href={MARVEDGE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#000000] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:bg-[#7895B2] active:scale-95"
                >
                  <span>Explore Marvedge.com</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            {/* Column 2: Free Utilities (spans 2 columns) */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-black">
                <Wrench className="h-3.5 w-3.5 text-[#7895B2]" />
                <span>Free Utilities</span>
              </div>
              <ul className="mt-4 space-y-2 text-xs">
                {freeUtilities.map((t) => (
                  <li key={t.slug}>
                    <Link
                      to="/$slug"
                      params={{ slug: t.slug }}
                      className="text-black/70 transition-colors hover:text-black hover:underline"
                    >
                      {t.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: AI Studio & Voice (spans 2 columns) */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-black">
                <Sparkle className="h-3.5 w-3.5 text-[#7895B2]" />
                <span>AI Media Studio</span>
              </div>
              <ul className="mt-4 space-y-2 text-xs">
                {aiTools.map((t) => (
                  <li key={t.slug}>
                    <Link
                      to="/$slug"
                      params={{ slug: t.slug }}
                      className="text-black/70 transition-colors hover:text-black hover:underline"
                    >
                      {t.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4: Platform & Features (spans 2 columns) */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-black">
                <Globe className="h-3.5 w-3.5 text-[#7895B2]" />
                <span>Platform</span>
              </div>
              <ul className="mt-4 space-y-2 text-xs text-black/70">
                <li>
                  <a
                    href={MARVEDGE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-black hover:underline"
                  >
                    <span>Interactive Demos</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </a>
                </li>
                <li>
                  <a
                    href={MARVEDGE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-black hover:underline"
                  >
                    <span>Auto-Reframe 9:16</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </a>
                </li>
                <li>
                  <a
                    href={MARVEDGE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-black hover:underline"
                  >
                    <span>Multilingual Voice</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </a>
                </li>
                <li>
                  <span className="text-black/50">WebCodecs Hardware Sync</span>
                </li>
                <li>
                  <span className="text-black/50">FFmpeg WebAssembly</span>
                </li>
                <li>
                  <span className="text-black/50">In-Browser Canvas API</span>
                </li>
              </ul>
            </div>

            {/* Column 5: Trust & Governance (spans 2 columns) */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-black">
                <Lock className="h-3.5 w-3.5 text-[#7895B2]" />
                <span>Trust & Legal</span>
              </div>
              <ul className="mt-4 space-y-2.5 text-xs">
                <li>
                  <button
                    onClick={() => setLegalModal("privacy")}
                    className="text-left text-black/70 hover:text-black hover:underline cursor-pointer transition-colors"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setLegalModal("terms")}
                    className="text-left text-black/70 hover:text-black hover:underline cursor-pointer transition-colors"
                  >
                    Terms of Service
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setLegalModal("security")}
                    className="text-left text-black/70 hover:text-black hover:underline cursor-pointer transition-colors"
                  >
                    Security Architecture
                  </button>
                </li>
                <li>
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200/80 rounded px-1.5 py-0.5 font-medium">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    Zero Tracking Cookies
                  </span>
                </li>
                <li className="pt-2">
                  <a
                    href="mailto:support@marvedge.com"
                    className="text-black/70 hover:text-black hover:underline text-xs"
                  >
                    Contact Support
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* System Telemetry & Operational Row */}
          <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-[#D6CCB5] pt-8 text-xs font-mono text-black/60 sm:flex-row">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="font-semibold text-black">19 Tools Operational</span>
              <span className="text-black/30">·</span>
              <span>Client-Side Wasm Sandbox</span>
            </div>

            <button
              onClick={scrollToTop}
              className="group inline-flex items-center gap-1.5 rounded-full border border-[#D6CCB5] bg-white px-3 py-1.5 font-sans text-xs font-semibold text-black transition-all duration-200 hover:bg-[#000000] hover:text-white hover:border-[#000000] active:scale-95 cursor-pointer shadow-xs"
            >
              <span>Back to top</span>
              <ArrowUp className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-y-0.5" />
            </button>
          </div>

          {/* Copyright & Disclaimer Bar */}
          <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-[#D6CCB5]/40 pt-6 text-xs text-black/50 md:flex-row">
            <p>
              © {new Date().getFullYear()} Marvedge Inc. All rights reserved. Built with Apple-inspired precision.
            </p>
            <p className="text-center md:text-right font-mono text-[11px]">
              Media files are processed locally in your browser memory and never uploaded to any server.
            </p>
          </div>
        </div>
      </footer>

      {/* Accessible Interactive Dialogs for Privacy, Terms, and Security */}
      <Dialog open={legalModal !== null} onOpenChange={(open) => !open && setLegalModal(null)}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto rounded-3xl border border-[#D6CCB5] bg-[#FFFFFF] p-6 text-black sm:p-8">
          {legalModal === "privacy" && (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl font-normal text-black">
                  Privacy Policy & Zero-Storage Guarantee
                </DialogTitle>
                <DialogDescription className="text-xs font-mono text-black/60">
                  Last updated: 2026 · Client-Side Confidentiality
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 space-y-4 text-xs leading-relaxed text-black/80">
                <div className="rounded-xl bg-[#FAF7F0] p-4 border border-[#E8DFCA]">
                  <h4 className="font-bold text-black text-sm">Core Privacy Guarantee</h4>
                  <p className="mt-1">
                    Your video, image, audio, and PDF files never leave your device. All 11 browser utilities operate exclusively through compiled WebAssembly, WebCodecs, and HTML5 Canvas inside your local browser sandbox.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-black">1. Zero Media Uploads</h4>
                  <p className="mt-1">
                    When you trim an MP4, compress an image, merge PDFs, or crop photos, processing occurs on your device's CPU and GPU. No binary file data is transmitted to Marvedge servers or third parties.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-black">2. Ephemeral AI Generation</h4>
                  <p className="mt-1">
                    For AI-powered text and voice tools, your inputs are processed in-memory solely to generate the requested output and are immediately purged. We do not use your inputs or generated media to train machine learning models.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-black">3. Zero Tracking Cookies</h4>
                  <p className="mt-1">
                    Marvedge Tools does not deploy tracking beacons, third-party advertising cookies, or behavioral profiling scripts.
                  </p>
                </div>
              </div>
            </>
          )}

          {legalModal === "terms" && (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl font-normal text-black">
                  Terms of Service
                </DialogTitle>
                <DialogDescription className="text-xs font-mono text-black/60">
                  Fair, Transparent Usage Guidelines
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 space-y-4 text-xs leading-relaxed text-black/80">
                <div className="rounded-xl bg-[#FAF7F0] p-4 border border-[#E8DFCA]">
                  <h4 className="font-bold text-black text-sm">Ownership & Rights</h4>
                  <p className="mt-1">
                    You retain 100% intellectual property, copyright, and commercial rights over all files, GIFs, images, transcripts, scripts, and synthesized media produced with Marvedge Tools.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-black">1. Permitted Use</h4>
                  <p className="mt-1">
                    Marvedge Tools are provided for personal and commercial creative work. You agree not to use the utilities to process malicious code or unlawful material.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-black">2. High Availability</h4>
                  <p className="mt-1">
                    Because all utility operations execute client-side, the tools remain operational even under intermittent connectivity once loaded into browser cache.
                  </p>
                </div>
              </div>
            </>
          )}

          {legalModal === "security" && (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl font-normal text-black">
                  Security Architecture
                </DialogTitle>
                <DialogDescription className="text-xs font-mono text-black/60">
                  Local Sandboxing & Cryptographic Safety
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 space-y-4 text-xs leading-relaxed text-black/80">
                <div className="rounded-xl bg-[#FAF7F0] p-4 border border-[#E8DFCA]">
                  <h4 className="font-bold text-black text-sm">Browser Sandbox Isolation</h4>
                  <p className="mt-1">
                    Every file operation is isolated within standard web worker threads. Memory allocations (`ArrayBuffer`, `Blob`) are de-allocated immediately upon download completion.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-black">1. Hardware Acceleration</h4>
                  <p className="mt-1">
                    Utilizes hardware-accelerated WebCodecs and WebAssembly binaries with strict Content Security Policy (CSP) headers preventing unauthorized script execution or exfiltration.
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
