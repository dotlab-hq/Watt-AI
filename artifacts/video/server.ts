import { streamText } from "ai";
import { getLanguageModel } from "@/lib/ai/providers";
import { createDocumentHandler } from "@/lib/artifacts/server";

function extractVideoMetadata(content: string): {
  videoUrl: string;
  videoTitle: string;
} {
  // Match any playable video URL: YouTube, Vimeo, direct video files (.mp4, .webm, .mov, .ogg, .avi),
  // streaming HLS (.m3u8), or any http(s) URL ending in a known video extension or from a video platform
  const urlMatch =
    content.match(
      /https?:\/\/[^\s"')\]]+\.(?:mp4|webm|mov|avi|ogg|mkv|flv|wmv|m3u8)[^\s"')\]]*/i
    ) ??
    content.match(
      /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|vimeo\.com\/|player\.vimeo\.com\/video\/|dai\.ly\/|dailymotion\.com\/|twitch\.tv\/|mux\.com\/|streamable\.com\/|wistia\.com\/|loom\.com\/share\/|facebook\.com\/watch\/)[^\s"')\]]*/
    );
  const titleMatch = content.match(/\*\*Title:\*\*\s*(.+)/);
  const fallbackTitleMatch = content.match(/^#\s*(.+)/m);

  return {
    videoUrl: urlMatch?.[0] ?? "",
    videoTitle:
      titleMatch?.[1]?.trim() ?? fallbackTitleMatch?.[1]?.trim() ?? "",
  };
}

export const videoDocumentHandler = createDocumentHandler<"video">({
  kind: "video",
  onCreateDocument: async ({ title, dataStream, modelId }) => {
    let draftContent = "";

    const { stream } = streamText({
      maxOutputTokens: 32_000,
      model: getLanguageModel(modelId),
      instructions:
        "Generate a video content description. Include:\n" +
        "1. A heading with the video title\n" +
        "2. The EXACT playable video URL on its own line\n" +
        "3. A brief description of the video content\n\n" +
        "For the video URL, you can use:\n" +
        "- YouTube: https://www.youtube.com/watch?v=...\n" +
        "- Vimeo: https://vimeo.com/...\n" +
        "- Direct video files: any URL ending in .mp4, .webm, .mov, .avi, .ogg, .mkv, .flv\n" +
        "- HLS streams: any URL ending in .m3u8\n" +
        "- Other platforms: Dailymotion, Twitch, Facebook Video, Streamable, Loom, Wistia\n\n" +
        "Use real, playable URLs where possible. If creating educational content, suggest a relevant real video.\n\n" +
        "IMPORTANT: The video URL must be a complete, valid URL on its own line so it can be parsed for playback.",
      prompt: title,
    });

    for await (const delta of stream) {
      if (delta.type === "text-delta") {
        draftContent += delta.text;
        dataStream.write({
          type: "data-videoDelta",
          data: draftContent,
          transient: true,
        });
      }
    }

    // Extract video metadata from final content and emit it
    const metadata = extractVideoMetadata(draftContent);
    if (metadata.videoUrl) {
      dataStream.write({
        type: "data-videoMetadata",
        data: metadata,
        transient: true,
      });
    }

    return draftContent;
  },
  onUpdateDocument: async ({ document, description, dataStream, modelId }) => {
    let draftContent = "";

    const { stream } = streamText({
      maxOutputTokens: 32_000,
      model: getLanguageModel(modelId),
      instructions: `You are updating a video document. The current content is:\n\n${document.content}\n\nEnhance this content. Include:\n1. A heading with the updated video title\n2. The EXACT playable video URL on its own line (YouTube, Vimeo, .mp4, .webm, .m3u8, or any other supported format)\n3. More details about the video content\n\nUpdate based on: ${description}`,
      prompt: "Update the video content",
    });

    for await (const delta of stream) {
      if (delta.type === "text-delta") {
        draftContent += delta.text;
        dataStream.write({
          type: "data-videoDelta",
          data: draftContent,
          transient: true,
        });
      }
    }

    // Extract video metadata from final content and emit it
    const metadata = extractVideoMetadata(draftContent);
    if (metadata.videoUrl) {
      dataStream.write({
        type: "data-videoMetadata",
        data: metadata,
        transient: true,
      });
    }

    return draftContent;
  },
});
