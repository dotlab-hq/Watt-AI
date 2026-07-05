/**
 * Singleton keypair state shared across components.
 * Avoids duplicate API calls and prop drilling.
 */
import {
  decryptPrivateKey,
  encryptPrivateKey,
  exportPublicKey,
  generateKeyPair,
  importPublicKey,
  decryptPiiMap,
} from "@/lib/crypto";

export type Keystate = "loading" | "none" | "locked" | "ready";

let state: Keystate = "loading";
let privateKey: CryptoKey | null = null;
let publicKeyStr: string | null = null;
let listeners: Array<() => void> = [];

function notify() {
  for (const fn of listeners) fn();
}

export function getKeystate(): Keystate {
  return state;
}

export function subscribeKeystate(fn: () => void): () => void {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

/** Check server for existing key pair (call once on app mount). */
export async function checkKeypair() {
  try {
    const res = await fetch("/api/user/keypair");
    const data = await res.json();
    if (data.error || !data.exists) {
      state = "none";
    } else {
      state = "locked";
      publicKeyStr = data.publicKey;
    }
  } catch {
    state = "none";
  }
  notify();
}

/** Create a new key pair with a password. */
export async function createKeyPair(password: string) {
  const kp = await generateKeyPair();
  const pubStr = await exportPublicKey(kp.publicKey);
  const encPrivStr = await encryptPrivateKey(kp.privateKey, password);

  const res = await fetch("/api/user/keypair", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      publicKey: pubStr,
      encryptedPrivateKey: encPrivStr,
    }),
  });

  if (!res.ok) throw new Error("Failed to store key pair");

  privateKey = kp.privateKey;
  publicKeyStr = pubStr;
  state = "ready";
  notify();
}

/** Unlock an existing key pair with the password. */
export async function unlockKeyPair(password: string) {
  const res = await fetch("/api/user/keypair");
  const data = await res.json();
  if (!data.exists) throw new Error("No key pair found");

  const privKey = await decryptPrivateKey(data.encryptedPrivateKey, password);
  privateKey = privKey;
  publicKeyStr = data.publicKey;
  state = "ready";
  notify();
}

/** Decrypt an encrypted PII map envelope. */
export async function decryptMap(
  envelope: string
): Promise<Record<string, string>> {
  if (!privateKey || !publicKeyStr) return {};
  const pubKey = await importPublicKey(publicKeyStr);
  return decryptPiiMap(envelope, pubKey);
}
