import { streamText } from "ai";
import { getLanguageModel } from "@/lib/ai/providers";
import { createDocumentHandler } from "@/lib/artifacts/server";

export const videoDocumentHandler = createDocumentHandler<"video">({
  kind: "video",
  onCreateDocument: async ({ title, dataStream, modelId }) => {
    let draftContent = "";

    const { stream } = streamText({
      maxOutputTokens: 32_000,
      model: getLanguageModel(modelId),
      instructions:
        "Generate a video content description. Include the video title, a brief description, and if available, include the exact URL for the video you want to play. You can provide URLs for YouTube, Vimeo, Mux, or other supported video platforms. If creating educational content, suggest a relevant video that demonstrates the concept. Be specific about the video content and timing.",
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

    return draftContent;
  },
  onUpdateDocument: async ({ document, description, dataStream, modelId }) => {
    let draftContent = "";

    const { stream } = streamText({
      maxOutputTokens: 32_000,
      model: getLanguageModel(modelId),
      instructions: `You are updating a video document. The current content is: \n\n${document.content}\n\nEnhance this content by adding more details about the video, improving the description, or updating the video URL if needed. Include the video title, description, and the embed code for the video player. Use the following description: ${description}`,
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

    return draftContent;
  },
});