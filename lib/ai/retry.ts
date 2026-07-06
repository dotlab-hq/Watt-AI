/**
 * Server-side retry mechanism for AI SDK streamText and generateText calls.
 *
 * The AI gateway / provider API can drop mid-stream, especially during long
 * reasoning phases with reasoning models. This module provides transparent
 * retry wrappers that:
 *
 * 1. Buffer the full stream from streamText
 * 2. If the stream fails BEFORE producing any substantive content
 *    (text-delta or tool-call), automatically retry with exponential backoff
 * 3. Only forward chunks to the consumer once the stream completes
 *    successfully — making retries completely transparent
 * 4. Also track usage from the successful attempt
 *
 * For generateText (non-streaming), a simpler retry wrapper is provided.
 */

import { generateText, streamText } from "ai";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 2, meaning 2 retries = 3 total attempts) */
  maxRetries?: number;
  /** Maximum backoff delay in milliseconds (default: 10_000) */
  maxBackoffMs?: number;
}

// ─── Retry for streamText ───────────────────────────────────────────────────

const CONTENT_EVENT_TYPES = new Set([
  "text-delta",
  "tool-call-begin",
  "tool-call",
]);

/**
 * Wrap streamText with automatic mid-stream retry.
 *
 * Buffers the entire stream into memory. If the underlying API call drops
 * mid-stream (common during long reasoning phases) and NO substantive
 * content has been produced yet, the call is retried with exponential
 * backoff. Only after a full successful run are chunks yielded to the
 * consumer — making retries completely transparent.
 *
 * Once content (text-delta or tool-call) starts flowing, the stream is
 * committed and no retry is attempted — the error propagates naturally.
 *
 * @example
 * ```ts
 * const { stream, usage } = await retryableStreamText({
 *   model: getLanguageModel(chatModel),
 *   messages: modelMessages,
 *   // ... other streamText options
 * });
 * ```
 */
export function retryableStreamText(
  params: Parameters<typeof streamText>[0],
  options: RetryOptions = {}
): {
  stream: ReadableStream<any>;
  usage: Promise<any>;
} {
  const { maxRetries = 2, maxBackoffMs = 10_000 } = options;

  // We'll resolve usage from the last (successful) attempt
  let usageResolve: (usage: any) => void;
  const usagePromise = new Promise<any>((resolve) => {
    usageResolve = resolve;
  });

  const stream = new ReadableStream<any>({
    async start(controller) {
      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        if (attempt > 0) {
          // Exponential backoff: 1s, 2s, 4s, ...
          const backoff = Math.min(1000 * 2 ** (attempt - 1), maxBackoffMs);
          console.warn(
            `[retry:streamText] Backing off ${backoff}ms before attempt ${attempt + 1}/${maxRetries + 1}`
          );
          await new Promise((r) => setTimeout(r, backoff));
        }

        // Also apply SDK-level maxRetries for transient HTTP failures
        const result = streamText({ ...params, maxRetries: 1 });
        let hasProducedContent = false;
        const buffer: any[] = [];

        try {
          // Read the entire stream into the buffer
          for await (const chunk of result.stream) {
            buffer.push(chunk);

            if (CONTENT_EVENT_TYPES.has(chunk.type)) {
              hasProducedContent = true;
            }
          }

          // Full stream completed — flush buffer to consumer
          for (const chunk of buffer) {
            controller.enqueue(chunk);
          }
          controller.close();

          // Resolve usage from this successful attempt
          result.usage.then(usageResolve, () => usageResolve(null));
          return;
        } catch (error) {
          lastError =
            error instanceof Error
              ? error
              : new Error(`Stream error: ${String(error)}`);

          if (hasProducedContent) {
            // Can't safely retry — content was already delivered
            console.error(
              `[retry:streamText] Stream failed AFTER content on attempt ${attempt + 1}/${maxRetries + 1}: ${lastError.message}`
            );
            usageResolve(null);
            controller.error(lastError);
            return;
          }

          console.warn(
            `[retry:streamText] Stream failed BEFORE content on attempt ${attempt + 1}/${maxRetries + 1}: ${lastError.message}`
          );

          if (attempt >= maxRetries) {
            // Last attempt also failed
            usageResolve(null);
            controller.error(lastError);
            return;
          }

          // Otherwise — retry the loop
        }
      }

      // Shouldn't reach here, but just in case
      const exhausted = lastError ?? new Error("All retry attempts exhausted");
      usageResolve(null);
      controller.error(exhausted);
    },
  });

  return { stream, usage: usagePromise };
}

// ─── Retry for generateText ─────────────────────────────────────────────────

/**
 * Wrap generateText with automatic retry on failure.
 *
 * Uses exponential backoff. All errors trigger retry (unlike the stream
 * variant, since generateText has no partial-failure concept).
 *
 * @example
 * ```ts
 * const result = await retryableGenerateText({
 *   model: getLanguageModel(modelId),
 *   prompt: "...",
 * });
 * ```
 */
export async function retryableGenerateText(
  params: Parameters<typeof generateText>[0],
  options: RetryOptions = {}
): Promise<Awaited<ReturnType<typeof generateText>>> {
  const { maxRetries = 2, maxBackoffMs = 10_000 } = options;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      const backoff = Math.min(1000 * 2 ** (attempt - 1), maxBackoffMs);
      await new Promise((r) => setTimeout(r, backoff));
    }

    try {
      const result = await generateText({ ...params, maxRetries: 1 });
      return result;
    } catch (error) {
      lastError =
        error instanceof Error
          ? error
          : new Error(`GenerateText error: ${String(error)}`);

      console.warn(
        `[retry:generateText] Failed on attempt ${attempt + 1}/${maxRetries + 1}: ${lastError.message}`
      );

      if (attempt >= maxRetries) {
        throw lastError;
      }
    }
  }

  throw lastError ?? new Error("All retry attempts exhausted");
}
