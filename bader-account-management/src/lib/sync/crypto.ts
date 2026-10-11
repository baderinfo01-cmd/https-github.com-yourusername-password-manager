/**
 * End-to-end encryption helpers for Bader Sync (WebCrypto only, no dependencies).
 *
 * One random 256-bit "sync key" K is created on the first device and moved to the other devices in the
 * pairing code. Everything else is derived from K with HKDF, so the server never learns K:
 *   id, auth        -> identify / authenticate to the relay server (server stores only SHA-256(auth))
 *   enc, mac        -> encrypt items (AES-256-GCM) and hide their ids (HMAC)
 *   alert*          -> a separate, weaker key set used ONLY for security alerts, so alerts can be sent
 *                      while the vault is locked (it can never decrypt your data)
 */

const enc = new TextEncoder();
const dec = new TextDecoder();

export const toB64u = (buf: ArrayBuffer | Uint8Array): string => {
  const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  b.forEach((x) => (s += String.fromCharCode(x)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

export const fromB64u = (s: string): Uint8Array => {
  const p = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  return Uint8Array.from(atob(p), (c) => c.charCodeAt(0));
};

export const toHex = (buf: ArrayBuffer | Uint8Array): string =>
  Array.from(buf instanceof Uint8Array ? buf : new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

export const randomBytes = (n: number) => crypto.getRandomValues(new Uint8Array(n));

async function hkdf(secret: Uint8Array, info: string, length = 32): Promise<Uint8Array> {
  const base = await crypto.subtle.importKey("raw", secret as BufferSource, "HKDF", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt: new Uint8Array(0), info: enc.encode(info) },
    base,
    length * 8
  );
  return new Uint8Array(bits);
}

export interface SyncKeys {
  /** 32 hex chars */
  accountId: string;
  /** 64 hex: proves ownership to the server (data access) */
  auth: string;
  /** 64 hex: alert-only token */
  alertAuth: string;
  enc: CryptoKey;
  mac: CryptoKey;
}

export interface AlertSecret {
  id: string;
  auth: string;
  enc: string; // base64url raw AES key
  mac: string; // base64url raw HMAC key
}

export async function deriveKeys(K: Uint8Array) {
  const id = toHex((await hkdf(K, "bader-sync/id", 16)));
  const auth = toHex(await hkdf(K, "bader-sync/auth"));
  const alertAuth = toHex(await hkdf(K, "bader-sync/alert-auth"));
  const encRaw = await hkdf(K, "bader-sync/enc");
  const macRaw = await hkdf(K, "bader-sync/mac");
  const keys: SyncKeys = {
    accountId: id,
    auth,
    alertAuth,
    enc: await crypto.subtle.importKey("raw", encRaw as BufferSource, "AES-GCM", false, ["encrypt", "decrypt"]),
    mac: await crypto.subtle.importKey("raw", macRaw as BufferSource, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]),
  };
  const alert: AlertSecret = {
    id,
    auth: alertAuth,
    enc: toB64u(await hkdf(K, "bader-sync/alert-enc")),
    mac: toB64u(await hkdf(K, "bader-sync/alert-mac")),
  };
  return { keys, alert };
}

export async function hmacHex(key: CryptoKey, text: string): Promise<string> {
  return toHex(await crypto.subtle.sign("HMAC", key, enc.encode(text)));
}

/** Opaque server-side id of an item: the server never sees collection names or real ids. */
export const itemKey = (mac: CryptoKey, collection: string, id: string) => hmacHex(mac, `item:${collection}:${id}`);

export async function seal(key: CryptoKey, value: unknown, aad: string): Promise<{ iv: string; ct: string }> {
  const iv = randomBytes(12);
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource, additionalData: enc.encode(aad) },
    key,
    enc.encode(JSON.stringify(value))
  );
  return { iv: toB64u(iv), ct: toB64u(ct) };
}

export async function open<T = unknown>(key: CryptoKey, iv: string, ct: string, aad: string): Promise<T | null> {
  try {
    const pt = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromB64u(iv) as BufferSource, additionalData: enc.encode(aad) },
      key,
      fromB64u(ct) as BufferSource
    );
    return JSON.parse(dec.decode(pt)) as T;
  } catch {
    return null;
  }
}

/** Stable JSON (sorted keys) so equal data always hashes equally on every device. */
export function canonical(v: unknown): string {
  if (Array.isArray(v)) return "[" + v.map(canonical).join(",") + "]";
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return "{" + Object.keys(o).sort().filter((k) => o[k] !== undefined).map((k) => JSON.stringify(k) + ":" + canonical(o[k])).join(",") + "}";
  }
  return JSON.stringify(v) ?? "null";
}

export async function hashItem(v: unknown): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", enc.encode(canonical(v)))).slice(0, 24);
}

/* ---------------- pairing code ---------------- */

export function encodePairing(serverUrl: string, K: Uint8Array): string {
  return "BSYNC1:" + toB64u(enc.encode(JSON.stringify({ u: serverUrl, k: toB64u(K) })));
}

export function decodePairing(code: string): { serverUrl: string; K: Uint8Array } | null {
  try {
    const t = code.trim();
    if (!t.startsWith("BSYNC1:")) return null;
    const o = JSON.parse(dec.decode(fromB64u(t.slice(7))));
    const K = fromB64u(String(o.k));
    if (K.length !== 32 || typeof o.u !== "string" || !/^https?:\/\//.test(o.u)) return null;
    return { serverUrl: o.u, K };
  } catch {
    return null;
  }
}
