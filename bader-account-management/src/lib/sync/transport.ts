import type { Transport } from "./engine.ts";

declare global {
  interface Window {
    baderApp?: {
      onLock?: (cb: () => void) => () => void;
      session?: (opts: { geo: boolean }) => Promise<any>;
      /** desktop app: network calls go through the main process (the page itself may not reach the internet) */
      syncPost?: (url: string, body: unknown) => Promise<{ ok: boolean; status: number; json: any }>;
    };
  }
}

/** Browser / phone: plain fetch. Desktop app: IPC to the main process. */
export const httpTransport: Transport = {
  async post(url, body) {
    if (typeof window !== "undefined" && window.baderApp?.syncPost) {
      return window.baderApp.syncPost(url, body);
    }
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 25_000);
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: ctl.signal,
      });
      const json = await r.json().catch(() => null);
      return { ok: r.ok, status: r.status, json };
    } finally {
      clearTimeout(timer);
    }
  },
};
