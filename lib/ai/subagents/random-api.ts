import { ToolLoopAgent } from "ai";
import type { InferAgentUIMessage } from "ai";
import { getLanguageModel } from "@/lib/ai/providers";

/**
 * Random API subagent — executes HTTP requests with full CRUD support.
 * Uses Kilo AI gateway backends with round-robin routing.
 */
export const randomApiSubagent = new ToolLoopAgent({
  model: getLanguageModel("claude-edge"),
  instructions: `You are a random API subagent. Execute HTTP requests with full CRUD operations against the Kilo AI gateway.

CRITICAL RULES:
1. Show your work: describe what endpoint you're calling, what method, headers, and body
2. Display the response headers and body in full detail
3. Handle errors gracefully and report them clearly
4. After the final API call, summarize what was accomplished`,
  tools: {
    // HTTP request tools will be registered by the host
  },
});

export type RandomApiSubagentMessage = InferAgentUIMessage<typeof randomApiSubagent>;