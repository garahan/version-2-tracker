// ============================================================
// Life OS v3 — Encryption layer (v3 §26: encryption-ready)
// AES-GCM via Web Crypto API. Optional passphrase-based encryption
// of the localStorage payload. The architecture is encryption-ready:
// if a passphrase is set, state is encrypted at rest; otherwise plain JSON.
//
// Design:
//   - User sets a passphrase in Settings
//   - Key derived via PBKDF2 (100k iterations, SHA-256)
//   - State serialized to JSON, encrypted with AES-GCM
//   - Stored as base64 in localStorage under a separate key
//   - On load: if encrypted blob exists, prompt for passphrase
//   - Gist sync sends encrypted blob (zero-knowledge backup)
// ============================================================

const ENC_KEY = 'lifeos-v3-enc';
const SALT_KEY = 'lifeos-v3-salt';
const ITERATIONS = 100_000;

// ---- Check if encryption is enabled ----
export function isEncrypted() {
  return !!localStorage.getItem(ENC_KEY);
}

// ---- Derive AES key from passphrase ----
async function deriveKey(passphrase, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// ---- Encrypt JSON string → base64 blob ----
export async function encryptState(jsonStr, passphrase) {
  let salt = new Uint8Array(localStorage.getItem(SALT_KEY)
    ? Array.from(atob(localStorage.getItem(SALT_KEY)), c => c.charCodeAt(0))
    : null);
  if (!localStorage.getItem(SALT_KEY)) {
    salt = crypto.getRandomValues(new Uint8Array(16));
    localStorage.setItem(SALT_KEY, btoa(String.fromCharCode(...salt)));
  }
  const key = await deriveKey(passphrase, salt);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, key, enc.encode(jsonStr)
  );
  // Pack iv + ciphertext into one base64 blob
  const packed = new Uint8Array(iv.length + ciphertext.byteLength);
  packed.set(iv, 0);
  packed.set(new Uint8Array(ciphertext), iv.length);
  return btoa(String.fromCharCode(...packed));
}

// ---- Decrypt base64 blob → JSON string ----
export async function decryptState(blob, passphrase) {
  const salt = new Uint8Array(Array.from(atob(localStorage.getItem(SALT_KEY)), c => c.charCodeAt(0)));
  const key = await deriveKey(passphrase, salt);
  const packed = Uint8Array.from(atob(blob), c => c.charCodeAt(0));
  const iv = packed.slice(0, 12);
  const ciphertext = packed.slice(12);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv }, key, ciphertext
  );
  return new TextDecoder().decode(decrypted);
}

// ---- Enable encryption (encrypts current state) ----
export async function enableEncryption(passphrase, currentStateJson) {
  const blob = await encryptState(currentStateJson, passphrase);
  localStorage.setItem(ENC_KEY, blob);
  return blob;
}

// ---- Disable encryption (removes encrypted blob, keeps plain) ----
export function disableEncryption() {
  localStorage.removeItem(ENC_KEY);
  localStorage.removeItem(SALT_KEY);
}

// ---- Load encrypted state (prompts for passphrase) ----
export async function loadEncrypted(passphrase) {
  const blob = localStorage.getItem(ENC_KEY);
  if (!blob) return null;
  return await decryptState(blob, passphrase);
}
