import type { InferAgentUIMessage } from "ai";
import {
  readUIMessageStream,
  ToolLoopAgent,
  tool,
  toUIMessageStream,
} from "ai";
import { z } from "zod";
import { getLanguageModel } from "@/lib/ai/providers";

const HTTP_METHOD = z
  .enum(["GET", "POST", "PUT", "PATCH", "DELETE"])
  .describe("HTTP method for the request");

export const httpRequest = tool({
  description:
    "Execute an HTTP request and return full details including headers and body.",
  inputSchema: z.object({
    method: HTTP_METHOD,
    url: z.string().url().describe("The URL to request"),
    headers: z
      .record(z.string())
      .optional()
      .describe("Optional headers object (Authorization, Content-Type, etc.)"),
    body: z
      .string()
      .optional()
      .describe("JSON body for POST/PUT/PATCH requests"),
    timeout: z
      .number()
      .min(1000)
      .max(3e4)
      .default(1e4)
      .describe("Request timeout in milliseconds"),
  }),
  execute: async ({ method, url, headers, body, timeout }) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body:
          body && ["POST", "PUT", "PATCH"].includes(method) ? body : undefined,
        signal: controller.signal,
      });

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      const contentType = response.headers.get("content-type") || "";
      let responseBody: unknown;
      try {
        const text = await response.text();
        if (contentType.includes("application/json")) {
          responseBody = JSON.parse(text);
        } else if (contentType.includes("text/")) {
          responseBody = text;
        } else {
          responseBody = text;
        }
      } catch {
        responseBody = "(binary or unreadable response)";
      }

      return {
        request: { method, url, headers, body: body ?? null },
        response: {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
          body: responseBody,
        },
        ok: response.ok,
      };
    } catch (err) {
      return {
        request: { method, url, headers, body: body ?? null },
        error: err instanceof Error ? err.message : String(err),
      };
    } finally {
      clearTimeout(timeoutId);
    }
  },
});

export const randomApiSubagent = new ToolLoopAgent({
  model: getLanguageModel("claude-edge"),
  instructions: `You are a random API subagent. Execute HTTP requests with full CRUD operations.

CRITICAL RULES:
1. Show your work: describe what endpoint you're calling, what method, headers, and body
2. Display the response headers and body in full detail
3. Handle errors gracefully and report them clearly
4. After the final API call, summarize what was accomplished`,
  tools: {
    httpRequest,
  },
});

export type RandomApiSubagentMessage = InferAgentUIMessage<
  typeof randomApiSubagent
>;

const executeRandomApi = async function* (
  { task }: { task: string },
  { abortSignal }: { abortSignal: AbortSignal }
) {
  const result = await randomApiSubagent.stream({
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

export const randomApiTool = tool({
  description:
    "Execute random API calls with full CRUD operations. Makes HTTP requests and shows complete request/response details in a collapsible panel.",
  inputSchema: z.object({
    task: z
      .string()
      .describe(
        "The API task to execute. Example: 'GET https://api.kilo.ai/v1/models' or 'POST to https://api.kilo.ai/v1/chat with body {\"model\": \"gpt-4\"}' (do not wrap in backticks)"
      ),
  }),
  execute: executeRandomApi,
  toModelOutput: ({ output: message }) => {
    const lastTextPart = message?.parts.findLast((p: any) => p.type === "text");
    return {
      type: "text",
      value:
        (lastTextPart?.text as string | undefined) ?? "Random API completed.",
    };
  },
});
