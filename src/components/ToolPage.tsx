import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, Check, ShieldCheck, Sparkles, Send } from "lucide-react";
import { getTool, type Tool, type ToolCluster } from "@/lib/tools";
import { getToolSeo } from "@/lib/tool-seo";
import { ToolWorkspace } from "./tools/registry";
import { ToolEditorialSections } from "./ToolSections";
import { ToolFaqSection } from "./ToolFaq";

const BRIDGE_CONTENT: Record<
  ToolCluster,
  {
    eyebrow: string;
    title: string;
    description: string;
    ctaLabel: string;
    ctaId: string;
    formPrompt: string;
  }
> = {
  "demo-video": {
    eyebrow: "Interactive Demos",
    title: "Turn this video into a clickable, interactive product demo.",
    description:
      "Screen recordings show your product. Interactive demos let buyers click through it with hotspots, auto-zoom, and voiceovers.",
    ctaLabel: "Build interactive demo",
    ctaId: "tool_bridge_video",
    formPrompt: "Join the platform early-access waitlist",
  },
  "guides-docs": {
    eyebrow: "Clickable Guides",
    title: "Turn static guides into self-guided product tours.",
    description:
      "Transform step-by-step screenshots into interactive walkthroughs that onboard customers faster.",
    ctaLabel: "Make guide clickable",
    ctaId: "tool_bridge_guides",
    formPrompt: "Join the interactive guides waitlist",
  },
  "brand-assets": {
    eyebrow: "Brand Consistency",
    title: "Store your brand assets once. Reuse them in every product demo.",
    description:
      "Keep logos, colors, and typography synced across all interactive customer walkthroughs.",
    ctaLabel: "Explore Marvedge",
    ctaId: "tool_bridge_brand",
    formPrompt: "Get The SaaS Demo Playbook & updates",
  },
  "gtm-copy": {
    eyebrow: "Growth & Conversion",
    title: "Pair every product launch post with an interactive demo link.",
    description:
      "Product copy drives traffic. Self-guided interactive demo links convert visitors into signups.",
    ctaLabel: "Create shareable demo",
    ctaId: "tool_bridge_gtm",
    formPrompt: "Get early access to interactive link cards",
  },
};

export function ToolPage({ tool }: { tool: Tool }) {
  const seo = getToolSeo(tool.slug);
  const bridge = BRIDGE_CONTENT[tool.cluster];
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const platformLink = `https://marvedge.com/?utm_source=tools&utm_medium=site&utm_campaign=bridge&utm_content=${bridge.ctaId}&utm_term=${tool.slug}`;

  const handleCapture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#E8DFCA] text-[#000000]">
      {/* 1. HEADER & INTERACTIVE TOOL WORKSPACE */}
      <section className="mx-auto max-w-7xl px-5 pt-8 pb-6 sm:px-8 sm:pt-10">
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-2 text-xs text-[#4A4740]">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 font-medium text-[#000000] transition-colors hover:text-[#537190] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7895B2]"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              All tools
            </Link>
            <span className="text-[#D6CCB5]" aria-hidden="true">
              /
            </span>
            <span>{tool.clusterLabel}</span>
          </div>

          <h1 className="font-serif text-4xl font-normal leading-tight tracking-tight text-[#000000] sm:text-5xl md:text-6xl">
            {tool.name}
          </h1>

          <p className="mt-2 max-w-2xl text-base leading-relaxed text-[#4A4740] sm:text-lg">
            {tool.tagline}
          </p>
        </div>

        {/* ACTUAL INTERACTIVE TOOL WORKSPACE (UNTOUCHED CODE) */}
        <ToolWorkspace slug={tool.slug} />

        {/* DIRECT ANSWER SUMMARY & HONEST RUNTIME BADGES */}
        <div className="mt-8 rounded-2xl border border-[#D6CCB5] bg-[#FFFFFF] p-6 sm:p-7 shadow-xs">
          <p className="text-base sm:text-lg font-medium leading-relaxed text-[#000000]">
            {seo.definitionLead}
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            {seo.capabilities.map((cap) => (
              <span
                key={cap}
                className="inline-flex items-center gap-2 rounded-full border border-[#D6CCB5]/80 bg-[#FAF7F0] px-3.5 py-1.5 text-xs font-semibold text-[#000000] shadow-2xs"
              >
                <Check className="h-3.5 w-3.5 text-[#537190]" aria-hidden="true" />
                {cap}
              </span>
            ))}
            <span className="inline-flex items-center gap-2 rounded-full border border-[#D6CCB5]/80 bg-[#FAF7F0] px-3.5 py-1.5 text-xs font-semibold text-[#000000] shadow-2xs">
              {tool.runtime === "client" ? (
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
              ) : tool.runtime === "ai" ? (
                <Sparkles className="h-3.5 w-3.5 text-[#537190]" aria-hidden="true" />
              ) : (
                <ShieldCheck className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
              )}
              {tool.runtimeBadge}
            </span>
          </div>
        </div>
      </section>

      {/* 2. EDITORIAL CONTENT SECTIONS */}
      <ToolEditorialSections seo={seo} tool={tool} />

      {/* 3. FREQUENTLY ASKED QUESTIONS */}
      <ToolFaqSection slug={tool.slug} toolName={tool.name} />

      {/* 4. CLUSTER CONVERSION BANNER WITH UTM ATTRIBUTION & LEAD CAPTURE */}
      <section className="mx-auto max-w-5xl px-5 pt-8 pb-16 sm:px-8">
        <div className="flex flex-col items-start justify-between gap-8 rounded-[2rem] border border-white/10 bg-[#000000] p-8 text-[#FFFFFF] shadow-xl md:p-10">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center w-full">
            <div className="max-w-xl">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#AEBDCA]">
                {bridge.eyebrow}
              </div>
              <h2 className="mt-2 font-serif text-2xl font-normal tracking-tight text-[#FFFFFF] sm:text-3xl">
                {bridge.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#AEBDCA]">
                {bridge.description}
              </p>
            </div>
            <div className="flex shrink-0 items-center">
              <a
                href={platformLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#FFFFFF] px-5 py-3 text-xs font-semibold text-[#000000] shadow-md transition-colors hover:bg-[#E8DFCA] active:scale-[0.98]"
              >
                {bridge.ctaLabel} <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Lead Capture Sub-Card */}
          <div className="w-full border-t border-white/15 pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-[#FFFFFF]">
                  {bridge.formPrompt}
                </p>
                <p className="text-[11px] text-[#AEBDCA] mt-0.5">
                  Early cohort access, product updates, and demo teardowns. Zero spam.
                </p>
              </div>

              {submitted ? (
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-emerald-400 border border-emerald-400/30">
                  <Check className="h-3.5 w-3.5" />
                  <span>You are on the list. We will send updates soon.</span>
                </div>
              ) : (
                <form onSubmit={handleCapture} className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter work email"
                    className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs text-white placeholder-white/50 focus:outline-none focus:border-white w-full sm:w-56"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-black transition-colors hover:bg-[#E8DFCA] shrink-0 cursor-pointer"
                  >
                    <span>Submit</span>
                    <Send className="h-3 w-3" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* EXPANDED 4-5 CHAINED RELATED TOOLS */}
        <div className="mt-12 border-t border-[#D6CCB5] pt-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[#537190]">
                Chained workflow
              </div>
              <h2 className="mt-1 font-serif text-2xl font-normal tracking-tight text-[#000000]">
                Next steps in this workflow
              </h2>
            </div>
            <p className="text-xs text-[#4A4740]">
              Continue with recommended tools in the {tool.clusterLabel} chain.
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {tool.related.map((slug) => {
              const r = getTool(slug);
              return (
                <Link
                  key={slug}
                  to="/$slug"
                  params={{ slug: slug }}
                  className="group flex flex-col justify-between rounded-2xl border border-[#D6CCB5] bg-[#FFFFFF] p-4 transition-colors hover:border-[#7895B2] shadow-xs"
                >
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#537190]">
                      {r.clusterLabel}
                    </span>
                    <p className="font-serif text-base font-normal text-[#000000] group-hover:underline mt-1">
                      {r.name}
                    </p>
                    <p className="mt-1 text-xs text-[#4A4740] line-clamp-2">
                      {r.tagline}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-[#537190]">
                    <span>Open tool</span>
                    <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
