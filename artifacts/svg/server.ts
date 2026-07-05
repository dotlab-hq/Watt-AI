import { streamText } from "ai";
import { updateDocumentPrompt } from "@/lib/ai/prompts";
import { getLanguageModel } from "@/lib/ai/providers";
import { createDocumentHandler } from "@/lib/artifacts/server";

function stripFences(svg: string): string {
  return svg
    .replace(/^```[\w]*\n?/, "")
    .replace(/\n?```\s*$/, "")
    .trim();
}

export const svgDocumentHandler = createDocumentHandler<"svg">({
  kind: "svg",
  onCreateDocument: async ({ title, dataStream, modelId }) => {
    let draftContent = "";

    const { stream } = streamText({
      model: getLanguageModel(modelId),
      instructions: `You are an SVG generator. Output ONLY the raw SVG markup. No explanations, no markdown fences, no wrapping. The output must start with <svg and end with </svg>. Use viewBox for responsive sizing.`,
      prompt: title,
    });

    for await (const delta of stream) {
      if (delta.type === "text-delta") {
        draftContent += delta.text;
        dataStream.write({
          type: "data-svgDelta",
          data: stripFences(draftContent),
          transient: true,
        });
      }
    }

    return stripFences(draftContent);
  },
  onUpdateDocument: async ({ document, description, dataStream, modelId }) => {
    let draftContent = "";

    const { stream } = streamText({
      model: getLanguageModel(modelId),
      instructions: `${updateDocumentPrompt(document.content, "svg")}\n\nOutput ONLY the complete updated SVG markup. No explanations, no markdown fences, no wrapping. Must start with <svg and end with </svg>.`,
      prompt: description,
    });

    for await (const delta of stream) {
      if (delta.type === "text-delta") {
        draftContent += delta.text;
        dataStream.write({
          type: "data-svgDelta",
          data: stripFences(draftContent),
          transient: true,
        });
      }
    }

    return stripFences(draftContent);
  },
});
