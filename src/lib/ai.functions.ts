import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const PROMPTS: Record<string, string> = {
  "video-summarizer":
    "You summarize video transcripts. The user will specify an Output Preset — follow it exactly:\n- 'Executive TL;DR': 3-sentence summary, then 5 key decisions/takeaways as bullets.\n- 'Lecture Notes': topic heading, then structured bullet-point notes grouped by concept, then a 'Key terms' section.\n- 'Meeting Action Items': attendees (if mentioned), then numbered action items with owner + deadline (if mentioned), then open questions.\n- 'Clips & Show Notes': 3-5 shareable quote clips (with timestamps if available), then SEO show notes (100-150 words), then 5 hashtags.\n- Default/unspecified: 2-sentence TL;DR, then 'Key points' (5-8 bullets), then 'Chapters' with timestamps ONLY if present. Use plain text with '-' bullets.",
  "youtube-title-generator":
    "You are an elite YouTube growth strategist and SEO copywriter. Based on the user's video topic, target keyword, tone, and format (Long Video or Shorts), generate high-converting YouTube assets.\n\nOutput in this EXACT structure with these delimiters:\n---TITLES---\n1. [Title 1 - strictly under 70 characters, high CTR]\n2. [Title 2 - strictly under 70 characters, curiosity/hook-driven]\n3. [Title 3 - strictly under 70 characters, benefit-focused]\n4. [Title 4 - strictly under 70 characters, strong search SEO]\n5. [Title 5 - strictly under 70 characters, bold & punchy]\n---DESCRIPTION---\n[A strong, compelling 2-line SEO hook at the very top that entices the viewer to watch]\n\nIn this video:\n• [Key takeaway or chapter bullet point 1]\n• [Key takeaway or chapter bullet point 2]\n• [Key takeaway or chapter bullet point 3]\n• [Key takeaway or chapter bullet point 4]\n\nLinks & Resources:\n👉 [Subscribe Here]: https://youtube.com/@channel?sub_confirmation=1\n🎬 [Watch Next]: https://youtube.com/watch?v=example\n\n#[Hashtag1] #[Hashtag2] #[Hashtag3] #[Hashtag4]",
  "content-repurposer":
    "You repurpose long content. Output these sections: 'LinkedIn post', 'X / Twitter thread' (5 posts), 'Instagram caption' (with hashtags), 'Newsletter draft' (subject line + body). Match the original voice. Plain text.",
  "product-description-generator":
    "You write benefit-led ecommerce copy. Output: 'Headline', 'Description' (80-150 words), 'Feature bullets' (5), and a 'Short version' (1 sentence). Use the requested tone. Never invent specifications not given. Plain text.",
  "screenshot-to-guide":
    "You turn screenshots and notes into a clear step-by-step guide. Output: a title, a 1-line purpose, numbered steps (one per screenshot, in order, with what to click/see), tips, and a short SOP summary. Only describe what is visible or stated; mark uncertain steps with '(verify)'. Plain text.",
  "demo-script-generator":
    "You are an expert SaaS product marketer, creative director, and video producer. You write high-converting product demo scripts formatted scene-by-scene for creator recording.\n\nGenerate structured scene cards tailored to the user's chosen Demo Format and Hook Angle. Output in this EXACT delimited structure with these tags:\n\n===SCENE===\n[TIME]: 0:00–0:05\n[NAME]: Hook\n[VISUAL]: Screen recording: ... (clear visual on-screen camera direction)\n[VOICEOVER]: ... (spoken script with natural pacing)\n===SCENE===\n[TIME]: 0:05–0:20\n[NAME]: Problem & Solution\n[VISUAL]: ...\n[VOICEOVER]: ...\n===SCENE===\n[TIME]: 0:20–0:45\n[NAME]: Core Walkthrough\n[VISUAL]: ...\n[VOICEOVER]: ...\n===SCENE===\n[TIME]: 0:45–1:00\n[NAME]: Call to Action\n[VISUAL]: ...\n[VOICEOVER]: ...\n\nKeep visual cues bold and actionable. Keep spoken voiceovers conversational and benefit-driven. Plain text.",
};

export const runAiTool = createServerFn({ method: "POST" })
  .validator((d) =>
    z
      .object({
        tool: z.string(),
        input: z.string().min(3).max(40000),
        images: z.array(z.string().startsWith("data:image/")).max(10).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const prompt = PROMPTS[data.tool];
    if (!prompt) throw new Error("Unknown tool");
    const { generateText } = await import("./ai.server");
    const content = [
      { type: "text" as const, text: data.input },
      ...(data.images ?? []).map((image) => ({ type: "image" as const, image })),
    ];
    const text = await generateText(prompt, [{ role: "user", content }]);
    return { text };
  });

export const runVoiceover = createServerFn({ method: "POST" })
  .validator((d) => z.object({ text: z.string().min(1).max(4000), voice: z.string().max(30) }).parse(d))
  .handler(async ({ data }) => {
    const { speak } = await import("./ai.server");
    return speak(data.text, data.voice);
  });

export const runTranscribe = createServerFn({ method: "POST" })
  .validator((d) =>
    z.object({ audio: z.string().max(34_000_000), mime: z.string().max(100), name: z.string().max(200) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { transcribe } = await import("./ai.server");
    return { text: await transcribe(data.audio, data.mime, data.name) };
  });
