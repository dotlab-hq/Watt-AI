import type { ChatGuard } from "@nationaldesignstudio/rampart";
import { createGuard } from "@nationaldesignstudio/rampart";
import { mergePiiMap } from "@/lib/pii-store";

let guardPromise: Promise<ChatGuard> | null = null;
let guardInstance: ChatGuard | null = null;
let isGuest = true;

/** Initialize the rampart guard. Only works for non-guest users. */
export function initGuard(guest: boolean) {
  isGuest = guest;
  if (guest) return;
  if (guardPromise) return;
  guardPromise = createGuard({ device: "wasm" }).then((g) => {
    guardInstance = g;
    return g;
  });
}

export function isGuardReady(): boolean {
  return guardInstance !== null;
}

export async function getGuard(): Promise<ChatGuard | null> {
  if (isGuest) return null;
  if (!guardPromise) {
    guardPromise = createGuard({ device: "wasm" }).then((g) => {
      guardInstance = g;
      return g;
    });
  }
  return guardPromise;
}

/** Synchronous access after guard is loaded. Returns null until ready. */
export function getGuardSync(): ChatGuard | null {
  return guardInstance;
}

/**
 * Extract the placeholder→value PII map from the guard's session table.
 * Accesses the internal `reverse` map via type assertion — the session table
 * maps placeholder tokens back to raw PII values.
 */
function extractPiiMapFromGuard(guard: ChatGuard): Record<string, string> {
  // SessionEntityTable has a private `reverse` Map<placeholder, value>
  const table = (guard as any).table as { reverse?: Map<string, string> } | undefined;
  if (!table?.reverse) return {};
  const map: Record<string, string> = {};
  for (const [placeholder, value] of table.reverse) {
    map[placeholder] = value;
  }
  return map;
}

/** Run protect and return the result plus the PII map for storage. */
export async function protectText(text: string) {
  const guard = await getGuard();
  if (!guard) return null;
  const result = await guard.protect(text);
  const piiMap = extractPiiMapFromGuard(guard);
  return { ...result, piiMap };
}
