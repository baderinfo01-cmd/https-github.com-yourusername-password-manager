/**
 * Security alerts channel.
 * Works while the vault is LOCKED (it uses a separate, alert-only key that cannot decrypt your data),
 * so a failed unlock on the PC reaches the phone, and the other way round.
 */
import { open, seal, hmacHex, fromB64u, type AlertSecret } from "./crypto.ts";
import type { Transport } from "./engine.ts";

export interface AlertConfig extends AlertSecret {
  serverUrl: string;
  device: string; // this device's id (32 hex)
  cursor: number;
}

export interface AlertEvent {
  id: string;
  t: number;
  result: "success" | "failed" | "locked";
  device: string;
  os: string;
  app: string;
  ip?: string;
  city?: string;
  region?: string;
  country?: string;
  source: "desktop" | "web" | "phone";
}

const url = (cfg: AlertConfig, a: string) =>
  cfg.serverUrl.replace(/\/+$/, "") + (cfg.serverUrl.endsWith(".php") ? "" : "/api.php") + `?a=${a}`;

const importKeys = async (cfg: AlertConfig) => ({
  enc: await crypto.subtle.importKey("raw", fromB64u(cfg.enc) as BufferSource, "AES-GCM", false, ["encrypt", "decrypt"]),
  mac: await crypto.subtle.importKey("raw", fromB64u(cfg.mac) as BufferSource, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]),
});

export async function pushAlert(cfg: AlertConfig, t: Transport, ev: AlertEvent): Promise<boolean> {
  try {
    const { enc, mac } = await importKeys(cfg);
    const k = "A:" + (await hmacHex(mac, "alert:" + ev.id));
    const sealed = await seal(enc, { ev, dev: cfg.device }, k);
    const r = await t.post(url(cfg, "push"), {
      id: cfg.id,
      auth: cfg.auth,
      device: cfg.device,
      ops: [{ k, ts: ev.t, ...sealed }],
    });
    return !!(r.ok && r.json?.ok);
  } catch {
    return false;
  }
}

/** Returns alerts made by OTHER devices since the stored cursor, and the new cursor. */
export async function pullAlerts(cfg: AlertConfig, t: Transport): Promise<{ events: AlertEvent[]; cursor: number } | null> {
  try {
    const { enc } = await importKeys(cfg);
    const events: AlertEvent[] = [];
    let cursor = cfg.cursor;
    for (let guard = 0; guard < 20; guard++) {
      const r = await t.post(url(cfg, "pull"), { id: cfg.id, auth: cfg.auth, since: cursor });
      if (!r.ok || !r.json?.ok) return null;
      for (const op of r.json.ops as any[]) {
        cursor = Math.max(cursor, op.seq);
        const p = await open<{ ev: AlertEvent; dev: string }>(enc, op.iv, op.ct, op.k);
        if (p && p.dev !== cfg.device && p.ev?.id) events.push(p.ev);
      }
      cursor = Math.max(cursor, r.json.cursor || 0);
      if (!r.json.more) break;
    }
    return { events, cursor };
  } catch {
    return null;
  }
}
