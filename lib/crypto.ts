/**
 * Hybrid encryption: RSA-OAEP wraps an AES-GCM key; AES-GCM encrypts the data.
 * Password-based private key encryption uses PBKDF2 + AES-GCM.
 */

const RSA_KEY_LENGTH = 2048;
const PBKDF2_ITERATIONS = 100_000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

function ab2b6(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function b642ab(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

async function deriveAesKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    { name: "RSA-OAEP", modulusLength: RSA_KEY_LENGTH, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["wrapKey", "unwrapKey"],
  );
}

export async function exportPublicKey(key: CryptoKey): Promise<string> {
  return ab2b6(await crypto.subtle.exportKey("spki", key));
}

/** Encrypt the private key with a password for server storage. Returns base64 envelope. */
export async function encryptPrivateKey(key: CryptoKey, password: string): Promise<string> {
  const raw = await crypto.subtle.exportKey("pkcs8", key);
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const aesKey = await deriveAesKey(password, salt);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, raw);
  // envelope: salt(16) + iv(12) + ciphertext
  return ab2b6(new Uint8Array([...salt, ...iv, ...new Uint8Array(encrypted)]).buffer);
}

/** Decrypt the private key using the password. */
export async function decryptPrivateKey(encryptedB64: string, password: string): Promise<CryptoKey> {
  const envelope = new Uint8Array(b642ab(encryptedB64));
  const salt = envelope.slice(0, SALT_LENGTH);
  const iv = envelope.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const ciphertext = envelope.slice(SALT_LENGTH + IV_LENGTH);
  const aesKey = await deriveAesKey(password, salt);
  const raw = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, aesKey, ciphertext);
  return crypto.subtle.importKey("pkcs8", raw, { name: "RSA-OAEP", hash: "SHA-256" }, false, ["unwrapKey"]);
}

export async function importPublicKey(spkiB64: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("spki", b642ab(spkiB64), { name: "RSA-OAEP", hash: "SHA-256" }, false, ["wrapKey"]);
}

/** Encrypt a PII map with the user's public key (hybrid: AES-GCM + RSA-OAEP wrap). */
export async function encryptPiiMap(map: Record<string, string>, publicKey: CryptoKey): Promise<string> {
  const plaintext = new TextEncoder().encode(JSON.stringify(map));
  const aesKey = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "wrapKey"]);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, plaintext);
  const wrappedKey = await crypto.subtle.wrapKey("raw", aesKey, publicKey, { name: "RSA-OAEP" });
  // envelope: wrappedKeyLen(4) + wrappedKey + iv(12) + ciphertext
  const wrappedKeyArr = new Uint8Array(wrappedKey);
  const header = new Uint32Array([wrappedKeyArr.length]);
  const envelope = new Uint8Array(4 + wrappedKeyArr.length + IV_LENGTH + ciphertext.byteLength);
  envelope.set(new Uint8Array(header.buffer), 0);
  envelope.set(wrappedKeyArr, 4);
  envelope.set(iv, 4 + wrappedKeyArr.length);
  envelope.set(new Uint8Array(ciphertext), 4 + wrappedKeyArr.length + IV_LENGTH);
  return ab2b6(envelope.buffer);
}

/** Decrypt a PII map using the user's private key. */
export async function decryptPiiMap(envelope: string, privateKey: CryptoKey): Promise<Record<string, string>> {
  const data = new Uint8Array(b642ab(envelope));
  const wrappedKeyLen = new Uint32Array(data.buffer.slice(0, 4))[0];
  const wrappedKey = data.slice(4, 4 + wrappedKeyLen);
  const iv = data.slice(4 + wrappedKeyLen, 4 + wrappedKeyLen + IV_LENGTH);
  const ciphertext = data.slice(4 + wrappedKeyLen + IV_LENGTH);
  const aesKey = await crypto.subtle.unwrapKey("raw", wrappedKey, privateKey, { name: "RSA-OAEP" }, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, aesKey, ciphertext);
  return JSON.parse(new TextDecoder().decode(plaintext));
}
