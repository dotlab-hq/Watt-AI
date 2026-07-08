import { EnvHttpProxyAgent, fetch as undiciFetch } from "undici";

/**
 * Creates a per-request undici dispatcher that respects `HTTP_PROXY` /
 * `HTTPS_PROXY` / `NO_PROXY` environment variables. When no proxy is
 * configured, `EnvHttpProxyAgent` falls back to a direct connection.
 *
 * Only use this for specific outbound calls that need proxying — e.g.
 * the Random API tool — without affecting the rest of the application.
 */
const proxyAgent = new EnvHttpProxyAgent();

/**
 * Drop-in replacement for `fetch()` that routes through the HTTP proxy
 * configured via `HTTP_PROXY` / `HTTPS_PROXY` environment variables.
 *
 * Use this only in code that needs proxy support (like the random-api tool).
 * Most application traffic should use the global `fetch()` directly.
 */
export function proxyFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  // undici's fetch and DOM fetch have slightly incompatible types at the
  // TypeScript level, but they are compatible at runtime. Cast through
  // `unknown` to satisfy the compiler.
  return undiciFetch(
    input as any,
    {
      ...init,
      dispatcher: proxyAgent,
    } as any
  ) as unknown as Promise<Response>;
}
