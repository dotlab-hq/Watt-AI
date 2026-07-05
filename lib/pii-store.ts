/**
 * Global PII map store — decrypted placeholder→value mappings per conversation.
 * Populated from two sources:
 * 1. Decrypting piiMaps returned by the messages API (existing chats)
 * 2. The guard's session table for newly sent messages
 */

let store: Record<string, string> = {};
let listeners: Array<() => void> = [];

export function getPiiMap(): Record<string, string> {
  return store;
}

export function setPiiMap(map: Record<string, string>) {
  store = map;
  for (const fn of listeners) fn();
}

export function mergePiiMap(entries: Record<string, string>) {
  store = { ...store, ...entries };
  for (const fn of listeners) fn();
}

export function clearPiiMap() {
  store = {};
  for (const fn of listeners) fn();
}

export function onPiiMapChange(fn: () => void): () => void {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}
