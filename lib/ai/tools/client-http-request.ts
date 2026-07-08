import { tool } from "ai";
import { z } from "zod";

/**
 * Client-side HTTP request tool.
 * Executes in the browser using regular `fetch` — NO proxy.
 * Use this for API calls that should come from the user's IP, not the server.
 *
 * @see httpRequest in lib/ai/tools/random-api.ts for the server-side version
 *     that routes through HTTP_PROXY.
 */
export const clientHttpRequest = tool({
  description: `Execute an HTTP request from the CLIENT/BROWSER (no proxy, user's IP).
Use this when the user explicitly asks for a client-side call, or says 'from my browser/IP', 'client call', or 'from my machine'.
Returns status, headers, and parsed JSON body rendered as a rich card.
For server-side/proxied requests (the default), use the server-side randomApiTool/httpRequest instead.`,
  inputSchema: z.object({
    method: z
      .enum(["GET", "POST", "PUT", "PATCH", "DELETE"])
      .describe("HTTP method for the request"),

    url: z.string().url().describe("The URL to request"),

    headers: z
      .record(z.string())
      .optional()
      .describe("Optional request headers"),

    body: z
      .string()
      .optional()
      .describe(
        "Raw request body. Must match the supplied Content-Type (e.g. JSON string, URL-encoded string, XML, etc.)"
      ),

    timeout: z
      .number()
      .min(1000)
      .max(30_000)
      .default(10_000)
      .describe("Request timeout in milliseconds"),

    referrerPolicy: z
      .enum([
        "no-referrer",
        "no-referrer-when-downgrade",
        "origin",
        "origin-when-cross-origin",
        "same-origin",
        "strict-origin",
        "strict-origin-when-cross-origin",
        "unsafe-url",
      ])
      .default("strict-origin-when-cross-origin")
      .describe("Browser referrer policy for the request"),
  }),

  execute: async ({ method, url, headers, body, timeout, referrerPolicy }) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Cache-busting: always get fresh responses from APIs
    const cacheBusterUrl = new URL(url);
    cacheBusterUrl.searchParams.set("_t", Date.now().toString());
    cacheBusterUrl.searchParams.set("_cb", Math.random().toString(36).slice(2));

    try {
      const response = await fetch(cacheBusterUrl.toString(), {
        method,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
          ...headers,
        },
        body:
          body && ["POST", "PUT", "PATCH"].includes(method) ? body : undefined,
        signal: controller.signal,
        cache: "no-store",
        referrerPolicy,
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
        } else {
          responseBody = text;
        }
      } catch {
        responseBody = "(binary or unreadable response)";
      }

      return {
        request: {
          method,
          url,
          headers,
          body: body ?? null,
          referrerPolicy,
        },
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
        request: {
          method,
          url,
          headers,
          body: body ?? null,
          referrerPolicy,
        },
        error: err instanceof Error ? err.message : String(err),
      };
    } finally {
      clearTimeout(timeoutId);
    }
  },
});
