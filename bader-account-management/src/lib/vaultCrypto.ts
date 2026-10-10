/**
 * Real master-password protection.
 *
 * - The master password is NEVER stored. A key is derived from it with PBKDF2-SHA256 (600k iterations)
 *   and a random salt; correctness is proven by decrypting a small "check" value with AES-GCM.
 * - All app data (accounts, cards, documents ...) is stored encrypted with AES-GCM in localStorage.
 * - The derived key lives only in memory; locking / reloading the app discards it.
 */

const VAULT_KEY = "bader-vault-v3";
const LEGACY_KEY = "bader-storage-v2";
const CHECK_TEXT = "bader-vault-ok";
const ITERATIONS = 600_000;
export const MIN_PASSWORD_LENGTH = 8;

interface Cipher {
  iv: string;
  ct: string;
}

interface VaultBlob {
  v: 3;
  salt: string;
  iter: number;
  check: Cipher;
  data?: Cipher;
  fails?: number;
  lockUntil?: number;
}

let sessionKey: CryptoKey | null = null;

const enc = new TextEncoder();
const dec = new TextDecoder();

const b64 = (buf: ArrayBuffer | Uint8Array) => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s);
};
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function deriveKey(password: string, salt: Uint8Array, iter: number) {
  const base = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: iter, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptText(key: CryptoKey, text: string): Promise<Cipher> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(text));
  return { iv: b64(iv), ct: b64(ct) };
}

async function decryptText(key: CryptoKey, c: Cipher): Promise<string> {
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: unb64(c.iv) as BufferSource },
    key,
    unb64(c.ct) as BufferSource
  );
  return dec.decode(pt);
}

function readBlob(): VaultBlob | null {
  try {
    const raw = localStorage.getItem(VAULT_KEY);
    return raw ? (JSON.parse(raw) as VaultBlob) : null;
  } catch {
    return null;
  }
}

function writeBlob(b: VaultBlob) {
  localStorage.setItem(VAULT_KEY, JSON.stringify(b));
}

export type VaultState = "needs-setup" | "locked" | "unlocked";

export function getVaultState(): VaultState {
  if (sessionKey) return "unlocked";
  return readBlob() ? "locked" : "needs-setup";
}

export function isUnlocked() {
  return sessionKey !== null;
}

/** Legacy plaintext data from earlier versions (they accepted any password). */
export function hasLegacyData() {
  try {
    return !!localStorage.getItem(LEGACY_KEY);
  } catch {
    return false;
  }
}

export function passwordProblem(pw: string): string | null {
  if (pw.length < MIN_PASSWORD_LENGTH) return "short";
  if (!/[a-zA-Z]/.test(pw) || !/[0-9]/.test(pw)) return "weak";
  return null;
}

/** Create a new vault. Existing legacy plaintext data is migrated into it, then wiped. */
export async function createVault(password: string): Promise<void> {
  if (passwordProblem(password)) throw new Error("weak-password");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(password, salt, ITERATIONS);
  const blob: VaultBlob = {
    v: 3,
    salt: b64(salt),
    iter: ITERATIONS,
    check: await encryptText(key, CHECK_TEXT),
  };
  const legacy = localStorage.getItem(LEGACY_KEY);
  if (legacy) {
    // drop the old plaintext master password that earlier versions saved
    try {
      const parsed = JSON.parse(legacy);
      if (parsed?.state) {
        delete parsed.state.masterPassword;
        delete parsed.state.isUnlocked;
      }
      blob.data = await encryptText(key, JSON.stringify(parsed));
    } catch {
      /* corrupt legacy data is simply discarded */
    }
  }
  writeBlob(blob);
  localStorage.removeItem(LEGACY_KEY);
  sessionKey = key;
}

export interface UnlockResult {
  ok: boolean;
  waitMs?: number;
}

/** Throttle: 3 free attempts, then 2^n seconds (max 15 min) between attempts. */
function delayFor(fails: number) {
  return fails < 3 ? 0 : Math.min(2 ** (fails - 2), 900) * 1000;
}

export function remainingLockMs(): number {
  const b = readBlob();
  return Math.max(0, (b?.lockUntil ?? 0) - Date.now());
}

export async function unlockVault(password: string): Promise<UnlockResult> {
  const blob = readBlob();
  if (!blob) return { ok: false };
  const wait = remainingLockMs();
  if (wait > 0) return { ok: false, waitMs: wait };
  try {
    const key = await deriveKey(password, unb64(blob.salt), blob.iter);
    const text = await decryptText(key, blob.check);
    if (text !== CHECK_TEXT) throw new Error("bad");
    sessionKey = key;
    delete blob.fails;
    delete blob.lockUntil;
    writeBlob(blob);
    return { ok: true };
  } catch {
    const fails = (blob.fails ?? 0) + 1;
    blob.fails = fails;
    const d = delayFor(fails);
    if (d) blob.lockUntil = Date.now() + d;
    writeBlob(blob);
    return { ok: false, waitMs: d || undefined };
  }
}

/** Re-checks the password without changing the session (used before dangerous actions). */
export async function verifyPassword(password: string): Promise<boolean> {
  const blob = readBlob();
  if (!blob || !sessionKey) return false;
  try {
    const key = await deriveKey(password, unb64(blob.salt), blob.iter);
    return (await decryptText(key, blob.check)) === CHECK_TEXT;
  } catch {
    return false;
  }
}

export async function changeMasterPassword(current: string, next: string): Promise<boolean> {
  if (passwordProblem(next)) throw new Error("weak-password");
  const blob = readBlob();
  if (!blob || !sessionKey || !(await verifyPassword(current))) return false;
  const plain = blob.data ? await decryptText(sessionKey, blob.data) : null;
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(next, salt, ITERATIONS);
  const out: VaultBlob = {
    v: 3,
    salt: b64(salt),
    iter: ITERATIONS,
    check: await encryptText(key, CHECK_TEXT),
  };
  if (plain !== null) out.data = await encryptText(key, plain);
  writeBlob(out);
  sessionKey = key;
  return true;
}

/** Forget the key. Callers should also reload the page to wipe decrypted data from memory. */
export function lockVault() {
  sessionKey = null;
}

/** Removes all stored data but keeps the master password. */
export function wipeVaultData() {
  const blob = readBlob();
  if (blob) {
    delete blob.data;
    writeBlob(blob);
  }
}

/** zustand `persist` storage that keeps everything encrypted at rest. */
export const encryptedStorage = {
  async getItem(): Promise<string | null> {
    const blob = readBlob();
    if (!sessionKey || !blob?.data) return null;
    try {
      return await decryptText(sessionKey, blob.data);
    } catch {
      return null;
    }
  },
  async setItem(_name: string, value: string): Promise<void> {
    const blob = readBlob();
    if (!sessionKey || !blob) return; // never write while locked
    blob.data = await encryptText(sessionKey, value);
    writeBlob(blob);
  },
  async removeItem(): Promise<void> {
    wipeVaultData();
  },
};

/* ---------------- password-protected backups ---------------- */

export async function encryptBackup(plain: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(password, salt, ITERATIONS);
  const c = await encryptText(key, plain);
  return JSON.stringify({ format: "bader-backup", v: 1, salt: b64(salt), iter: ITERATIONS, ...c });
}

export function isEncryptedBackup(text: string): boolean {
  try {
    return JSON.parse(text)?.format === "bader-backup";
  } catch {
    return false;
  }
}

/** Returns the plain text, or null when the password is wrong / the file is damaged. */
export async function decryptBackup(text: string, password: string): Promise<string | null> {
  try {
    const o = JSON.parse(text);
    const key = await deriveKey(password, unb64(o.salt), o.iter);
    return await decryptText(key, { iv: o.iv, ct: o.ct });
  } catch {
    return null;
  }
}
