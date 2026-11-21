import { type ReactNode, lazy, Suspense } from "react";

// --- Lazy wrappers for named exports ---
const Mp4ToGif = lazy(() => import("./VideoTools").then((m) => ({ default: m.Mp4ToGif })));
const VideoCompressor = lazy(() => import("./VideoTools").then((m) => ({ default: m.VideoCompressor })));
const AspectRatio = lazy(() => import("./VideoTools").then((m) => ({ default: m.AspectRatio })));
const GifCompressor = lazy(() => import("./VideoTools").then((m) => ({ default: m.GifCompressor })));

const ImageCompressor = lazy(() => import("./ImageTools").then((m) => ({ default: m.ImageCompressor })));
const ImageResizer = lazy(() => import("./ImageTools").then((m) => ({ default: m.ImageResizer })));
const FormatConverter = lazy(() => import("./ImageTools").then((m) => ({ default: m.FormatConverter })));
const QrGenerator = lazy(() => import("./ImageTools").then((m) => ({ default: m.QrGenerator })));
const FaviconGenerator = lazy(() => import("./ImageTools").then((m) => ({ default: m.FaviconGenerator })));
const PdfTool = lazy(() => import("./ImageTools").then((m) => ({ default: m.PdfTool })));

const LinkShortener = lazy(() => import("./LinkShortener").then((m) => ({ default: m.LinkShortener })));

const AiTextTool = lazy(() => import("./AiTools").then((m) => ({ default: m.AiTextTool })));
const ScreenshotGuide = lazy(() => import("./ScreenshotGuide").then((m) => ({ default: m.ScreenshotGuide })));
const SubtitleGenerator = lazy(() => import("./AiTools").then((m) => ({ default: m.SubtitleGenerator })));
const VoiceoverGenerator = lazy(() => import("./VoiceoverGenerator").then((m) => ({ default: m.VoiceoverGenerator })));
const VideoSummarizer = lazy(() => import("./AiTools").then((m) => ({ default: m.VideoSummarizer })));
const YoutubeTitleGenerator = lazy(() => import("./AiTools").then((m) => ({ default: m.YoutubeTitleGenerator })));
const ContentRepurposer = lazy(() => import("./AiTools").then((m) => ({ default: m.ContentRepurposer })));
const ProductDescriptionGenerator = lazy(() => import("./ProductDescriptionGenerator").then((m) => ({ default: m.ProductDescriptionGenerator })));
const DemoScriptGenerator = lazy(() => import("./DemoScriptGenerator").then((m) => ({ default: m.DemoScriptGenerator })));

// Loading spinner shown while a tool chunk loads
function ToolFallback() {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#000] border-t-transparent" />
    </div>
  );
}

export function ToolWorkspace({ slug }: { slug: string }): ReactNode {
  const inner = (() => {
    switch (slug) {
      case "mp4-to-gif":           return <Mp4ToGif />;
      case "image-compressor":     return <ImageCompressor />;
      case "qr-code-generator":    return <QrGenerator />;
      case "video-compressor":     return <VideoCompressor />;
      case "gif-compressor":       return <GifCompressor />;
      case "image-resizer":        return <ImageResizer />;
      case "image-format-converter": return <FormatConverter />;
      case "pdf-merger":           return <PdfTool />;
      case "favicon-generator":    return <FaviconGenerator />;
      case "link-shortener":       return <LinkShortener />;
      case "video-aspect-ratio":   return <AspectRatio />;
      case "screenshot-to-guide":  return <ScreenshotGuide />;
      case "subtitle-generator":   return <SubtitleGenerator />;
      case "voiceover-generator":  return <VoiceoverGenerator />;
      case "video-summarizer":     return <VideoSummarizer />;
      case "youtube-title-generator": return <YoutubeTitleGenerator />;
      case "content-repurposer":   return <ContentRepurposer />;
      case "product-description-generator": return <ProductDescriptionGenerator />;
      case "demo-script-generator": return <DemoScriptGenerator />;
      default:                     return <AiTextTool slug={slug} />;    }
  })();

  return <Suspense fallback={<ToolFallback />}>{inner}</Suspense>;
}
