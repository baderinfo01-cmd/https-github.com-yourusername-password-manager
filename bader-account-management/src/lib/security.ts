import type { LoginEvent } from "@/lib/vaultCrypto";

const GEO_KEY = "bader-geo";

export function geoEnabled(): boolean {
  try {
    return localStorage.getItem(GEO_KEY) !== "off";
  } catch {
    return true;
  }
}

export function setGeoEnabled(on: boolean) {
  try {
    localStorage.setItem(GEO_KEY, on ? "on" : "off");
  } catch {
    /* ignore */
  }
}

declare global {
  interface Window {
    baderApp?: {
      onLock?: (cb: () => void) => () => void;
      session?: (opts: { geo: boolean }) => Promise<SessionInfo>;
    };
  }
}

export type SessionInfo = Omit<LoginEvent, "id" | "t" | "result">;

function parseUserAgent(ua: string) {
  const os = /Windows NT 10/.test(ua) ? "Windows 10/11" : /Android ([\d.]+)/.exec(ua)?.[0] || (/iPhone|iPad/.test(ua) ? "iOS" : /Mac OS X/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "Unknown");
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser";
  return { os, browser };
}

async function lookupGeo(): Promise<Partial<SessionInfo>> {
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 5000);
    const r = await fetch("https://ipwho.is/", { signal: ctl.signal });
    clearTimeout(timer);
    const j = await r.json();
    if (j && j.success !== false && j.ip) {
      return { ip: j.ip, city: j.city, region: j.region, country: j.country };
    }
  } catch {
    /* offline or blocked: the event is still logged without a place */
  }
  return {};
}

/** Where / how the app is being opened right now. Place lookup is optional (settings > security). */
export async function getSessionInfo(): Promise<SessionInfo> {
  const geo = geoEnabled();
  if (typeof window !== "undefined" && window.baderApp?.session) {
    try {
      return await window.baderApp.session({ geo });
    } catch {
      /* fall through to the web path */
    }
  }
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const { os, browser } = parseUserAgent(ua);
  const isPhone = /Android|iPhone|iPad/.test(ua);
  return {
    device: `${browser} — ${os}`,
    os,
    app: "web",
    source: isPhone ? "phone" : "web",
    ...(geo ? await lookupGeo() : {}),
  };
}

export function placeText(e: Pick<LoginEvent, "city" | "region" | "country">) {
  return [e.city, e.country].filter(Boolean).join(", ");
}

export function formatWhen(t: number, locale: string) {
  const l = locale === "ar" ? "ar-DZ-u-nu-latn" : locale === "fr" ? "fr-FR" : "en-GB";
  return new Date(t).toLocaleString(l, { dateStyle: "medium", timeStyle: "medium" });
}
