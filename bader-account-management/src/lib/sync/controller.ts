"use client";

/**
 * Glue between the sync engine and the app: pairing, background sync loop, and security alerts.
 */
import { useStore } from "@/store/useStore";
import { SyncEngine, COLLECTIONS, type Adapter } from "./engine.ts";
import { deriveKeys, decodePairing, encodePairing, fromB64u, randomBytes, toB64u, toHex } from "./crypto.ts";
import { httpTransport } from "./transport.ts";
import { pullAlerts, pushAlert, type AlertConfig, type AlertEvent } from "./alerts.ts";
import { mergeRemoteLoginEvents, readLoginLog, type LoginEvent } from "@/lib/vaultCrypto";

const ALERT_KEY = "bader-sync-alert";
const DEFAULT_SERVER = "https://baderinfo.com/bader-sync/api.php";
export const defaultSyncServer = DEFAULT_SERVER;

/* ------------------------------------------------------------------ store adapter */

const adapter: Adapter = {
  read() {
    const s = useStore.getState();
    const out: Record<string, any[]> = {};
    for (const c of COLLECTIONS) out[c.name] = c.name === "myInfo" ? [s.myInfo] : [...((s as any)[c.name] || [])];
    return out;
  },
  write(next) {
    const patch: Record<string, any> = {};
    for (const c of COLLECTIONS) {
      if (c.name === "myInfo") {
        if (next.myInfo?.[0]) patch.myInfo = next.myInfo[0];
      } else patch[c.name] = next[c.name];
    }
    useStore.setState(patch);
  },
  getState: () => useStore.getState().syncState as any,
  setState: (st) => useStore.getState().setSyncState(st),
};

/* ------------------------------------------------------------------ status (observable) */

export interface SyncStatus {
  running: boolean;
  lastSync: number | null;
  error: string | null;
  lastResult: { pushed: number; pulled: number; applied: number } | null;
}

let status: SyncStatus = { running: false, lastSync: null, error: null, lastResult: null };
const listeners = new Set<() => void>();
const emit = (patch: Partial<SyncStatus>) => {
  status = { ...status, ...patch };
  listeners.forEach((l) => l());
};
export const getSyncStatus = () => status;
export const subscribeSyncStatus = (l: () => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};

/* ------------------------------------------------------------------ engine */

function makeEngine(): SyncEngine | null {
  const cfg = useStore.getState().syncConfig;
  if (!cfg?.enabled) return null;
  return new SyncEngine({
    serverUrl: cfg.serverUrl,
    K: fromB64u(cfg.key),
    deviceId: cfg.deviceId,
    adapter,
    transport: httpTransport,
  });
}

export async function syncNow(): Promise<boolean> {
  const engine = makeEngine();
  if (!engine || status.running) return false;
  emit({ running: true, error: null });
  try {
    const r = await engine.syncOnce();
    const cfg = useStore.getState().syncConfig;
    if (cfg) useStore.getState().setSyncConfig({ ...cfg, lastSync: Date.now() });
    emit({ running: false, lastSync: Date.now(), lastResult: r });
    return true;
  } catch (e: any) {
    emit({ running: false, error: e?.code || e?.message || "error" });
    return false;
  }
}

/* ------------------------------------------------------------------ pairing */

export function getPairingCode(): string | null {
  const cfg = useStore.getState().syncConfig;
  return cfg ? encodePairing(cfg.serverUrl, fromB64u(cfg.key)) : null;
}

async function saveAlertConfig(serverUrl: string, K: Uint8Array, device: string) {
  const { alert } = await deriveKeys(K);
  const cfg: AlertConfig = { ...alert, serverUrl, device, cursor: 0 };
  localStorage.setItem(ALERT_KEY, JSON.stringify(cfg));
}

export async function createSyncAccount(serverUrl: string, registerKey: string, deviceName: string) {
  const K = randomBytes(32);
  const deviceId = toHex(randomBytes(16));
  const engine = new SyncEngine({ serverUrl, K, deviceId, adapter, transport: httpTransport });
  await engine.register(registerKey);
  useStore.getState().setSyncConfig({ serverUrl, key: toB64u(K), deviceId, deviceName, enabled: true });
  await saveAlertConfig(serverUrl, K, deviceId);
  await syncNow();
}

export async function joinSyncAccount(code: string, deviceName: string) {
  const p = decodePairing(code);
  if (!p) throw Object.assign(new Error("bad_code"), { code: "bad_code" });
  const deviceId = toHex(randomBytes(16));
  const engine = new SyncEngine({ serverUrl: p.serverUrl, K: p.K, deviceId, adapter, transport: httpTransport });
  await engine.verify();
  useStore.getState().setSyncConfig({ serverUrl: p.serverUrl, key: toB64u(p.K), deviceId, deviceName, enabled: true });
  await saveAlertConfig(p.serverUrl, p.K, deviceId);
  await syncNow();
}

export function disconnectSync() {
  stopAutoSync();
  useStore.getState().setSyncConfig(null);
  try {
    localStorage.removeItem(ALERT_KEY);
  } catch {
    /* ignore */
  }
  emit({ lastSync: null, lastResult: null, error: null });
}

/* ------------------------------------------------------------------ background loop (vault unlocked) */

let timer: ReturnType<typeof setInterval> | null = null;
let debounce: ReturnType<typeof setTimeout> | null = null;
let unsub: (() => void) | null = null;

export function startAutoSync() {
  if (timer || !useStore.getState().syncConfig?.enabled) return;
  void syncNow();
  timer = setInterval(() => void syncNow(), 45_000);
  // push soon after the user edits something
  let prev = COLLECTIONS.map((c) => (useStore.getState() as any)[c.name]);
  unsub = useStore.subscribe((s) => {
    const cur = COLLECTIONS.map((c) => (s as any)[c.name]);
    if (cur.some((v, i) => v !== prev[i])) {
      prev = cur;
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => void syncNow(), 4000);
    }
  });
}

export function stopAutoSync() {
  if (timer) clearInterval(timer);
  if (debounce) clearTimeout(debounce);
  unsub?.();
  timer = debounce = null;
  unsub = null;
}

/* ------------------------------------------------------------------ alerts (work while locked) */

function readAlertConfig(): AlertConfig | null {
  try {
    const raw = localStorage.getItem(ALERT_KEY);
    return raw ? (JSON.parse(raw) as AlertConfig) : null;
  } catch {
    return null;
  }
}

/** Sends a sign-in event to the other devices. Safe to call without a vault key. */
export async function sendAlert(ev: LoginEvent): Promise<void> {
  const cfg = readAlertConfig();
  if (!cfg) return;
  await pushAlert(cfg, httpTransport, ev as AlertEvent);
}

type RemoteHandler = (events: LoginEvent[]) => void;
const remoteHandlers = new Set<RemoteHandler>();
export const onRemoteAlerts = (h: RemoteHandler) => {
  remoteHandlers.add(h);
  return () => void remoteHandlers.delete(h);
};

let alertTimer: ReturnType<typeof setInterval> | null = null;

async function pollAlerts() {
  const cfg = readAlertConfig();
  if (!cfg) return;
  const r = await pullAlerts(cfg, httpTransport);
  if (!r) return;
  try {
    localStorage.setItem(ALERT_KEY, JSON.stringify({ ...cfg, cursor: r.cursor }));
  } catch {
    /* ignore */
  }
  const known = new Set(readLoginLog().map((e) => e.id));
  const fresh = r.events.filter((e) => !known.has(e.id)) as LoginEvent[];
  if (!fresh.length) return;
  mergeRemoteLoginEvents(fresh);
  remoteHandlers.forEach((h) => h(fresh));
}

export function startAlertPolling() {
  if (alertTimer || typeof window === "undefined") return;
  void pollAlerts();
  alertTimer = setInterval(() => void pollAlerts(), 45_000);
}
