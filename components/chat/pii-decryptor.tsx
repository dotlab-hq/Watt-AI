"use client";

import { useEffect, useRef } from "react";
import { getKeystate, subscribeKeystate, decryptMap } from "@/lib/keypair-state";
import type { ChatMessage } from "@/lib/types";
import { mergePiiMap } from "@/lib/pii-store";

/**
 * Watches messages and decrypts any encrypted piiMap envelopes into the
 * global PII store so message.tsx can reveal placeholder values.
 * Requires the keypair to be unlocked first.
 */
export function PiiDecryptor({ messages }: { messages: ChatMessage[] }) {
  const kpState = useRef(getKeystate());
  const processedIds = useRef(new Set<string>());

  useEffect(() => {
    return subscribeKeystate(() => {
      kpState.current = getKeystate();
    });
  }, []);

  useEffect(() => {
    if (kpState.current !== "ready") return;

    const newMessages = messages.filter(
      (m) =>
        !processedIds.current.has(m.id) &&
        m.role === "user" &&
        (m as any).piiMap &&
        typeof (m as any).piiMap === "string"
    );

    if (newMessages.length === 0) return;

    const decrypt = async () => {
      const merged: Record<string, string> = {};
      for (const msg of newMessages) {
        const envelope = (msg as any).piiMap as string;
        try {
          const map = await decryptMap(envelope);
          Object.assign(merged, map);
          processedIds.current.add(msg.id);
        } catch {
          // can't decrypt — password may be wrong
        }
      }
      if (Object.keys(merged).length > 0) {
        mergePiiMap(merged);
      }
    };
    decrypt();
  }, [messages]);

  // Reset when messages array changes (chat switch)
  useEffect(() => {
    processedIds.current.clear();
  }, [messages]);

  return null;
}
