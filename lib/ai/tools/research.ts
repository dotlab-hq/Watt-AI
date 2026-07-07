import { readUIMessageStream, tool, toUIMessageStream } from "ai";
import { z } from "zod";
import { researchSubagent } from "@/lib/ai/subagents/research";

/**
 * Wraps the research subagent as a streaming tool for the main agent.
 *
 * When the main agent calls this tool:
 * - Users see the full subagent execution streamed in real time
 * - The main agent receives only a concise summary via toModelOutput
 */
const executeResearch = async function* (
  { task }: { task: string },
  { abortSignal }: { abortSignal: AbortSignal }
) {
  const result = await researchSubagent.stream({
    prompt: task,
    abortSignal,
  });

  // eslint-disable-next-line no-restricted-syntax
  for await (const message of readUIMessageStream({
    stream: toUIMessageStream({ stream: result.stream }),
  })) {
    yield message;
  }
};

export const researchTool = tool({
  description:
    "Research a topic by searching the web, extracting relevant pages, and returning a synthesized answer. Use this for questions that require current information, factual lookups, or multi-source research. Takes longer than normal tools, but provides real-time progress updates.",
  inputSchema: z.object({
    task: z
      .string()
      .describe(
        "The research task, question, or topic to investigate. Be specific about what information you need."
      ),
  }),
  execute: executeResearch,
  toModelOutput: ({ output: message }) => {
    const lastTextPart = message?.parts.findLast((p: any) => p.type === "text");
    return {
      type: "text",
      value:
        (lastTextPart?.text as string | undefined) ?? "Research completed.",
    };
  },
});
