import { tool } from "ai";
import { z } from "zod";
import { getDocumentsById } from "@/lib/db/queries";

export const readArtifact = () =>
  tool({
    description:
      "Read the current content of an existing artifact. Use this BEFORE answering questions about what's in a diagram, code, document, or any artifact. The content is returned as-is — for diagrams, it's Excalidraw JSON containing elements with positions, sizes, and labels. For code/text, it's the raw content string.",
    inputSchema: z.object({
      id: z.string().describe("The ID of the artifact to read"),
    }),
    execute: async ({ id }) => {
      const documents = await getDocumentsById({ id });

      if (!documents || documents.length === 0) {
        return { error: "Artifact not found" };
      }

      // Get the latest version (last in the array)
      const latest = documents.at(-1);

      if (!latest) {
        return { error: "No versions found for this artifact" };
      }

      return {
        id: latest.id,
        title: latest.title,
        kind: latest.kind,
        totalVersions: documents.length,
        content: latest.content ?? "",
      };
    },
  });
