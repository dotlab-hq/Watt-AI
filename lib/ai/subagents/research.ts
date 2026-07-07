import type { InferAgentUIMessage } from "ai";
import { ToolLoopAgent } from "ai";
import { getLanguageModel } from "@/lib/ai/providers";
import {
  rankTracker,
  webExtract,
  webImageSearch,
  webSearch,
  webSearchExtract,
} from "@/lib/ai/tools/web-search";

/**
 * Research subagent — runs independently with web search tools,
 * then returns a concise summary to the main agent.
 *
 * The main agent only sees the final summary (via toModelOutput),
 * while the UI shows the full subagent execution.
 */
export const researchSubagent = new ToolLoopAgent({
  model: getLanguageModel("claude-edge"),
  instructions: `You are a research agent. Your job is to answer the user's question by searching the web, extracting content from pages, and synthesizing the findings.

CRITICAL RULES:
1. **Search first, then extract.** Start with webSearch to find relevant pages. Only call webExtract on URLs that look directly relevant.
2. **Be efficient.** Limit searches to what's needed. Don't call the same search twice with similar queries.
3. **Synthesize, don't dump.** After gathering information, write a clear, structured summary of your findings as your FINAL response.
4. **Cite sources.** Include the URLs and titles of the most relevant sources in your summary.

Available tools:
- webSearch: Search and get snippets with titles, URLs, and snippets
- webSearchExtract: Search and extract cleaned page content from top results
- webExtract: Extract cleaned markdown from a single URL
- webImageSearch: Search for images related to a query
- rankTracker: Check where a domain ranks for keywords

When you have gathered enough information and written your summary, STOP. Do not keep searching after you have enough to answer the question.`,
  tools: {
    webSearch,
    webSearchExtract,
    webExtract,
    webImageSearch,
    rankTracker,
  },
});

export type ResearchSubagentMessage = InferAgentUIMessage<
  typeof researchSubagent
>;
