"use client";
// Android entry point: detects the Capacitor shell, installs the phone bridge + licence client on `window`
// (the same globals the Electron preload provides), so the rest of the app needs no platform checks.
import nacl from "tweetnacl";
import { MOBILE_LICENSE } from "./config";
import { MobileLicense } from "./license";
import { createMobileBridge } from "./bridge";
import { useUi } from "@/store/ui";

const forced = () => { try { return localStorage.getItem("blr-force-native") === "1"; } catch { return false; } }; // browser preview / tests
export const isNative = () => typeof window !== "undefined" && (!!(window as any).Capacitor?.isNativePlatform?.() || forced());

let installed = false;
export async function installNative() {
  if (installed || !isNative()) return;
  installed = true;
  document.documentElement.classList.add("native");
  const [{ Device }, { Preferences }, { CapacitorHttp }] = await Promise.all([import("@capacitor/device"), import("@capacitor/preferences"), import("@capacitor/core")]);
  const sha256Hex = async (s: string) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s))), (b) => b.toString(16).padStart(2, "0")).join("");
  const lic = new MobileLicense(MOBILE_LICENSE, {
    storage: { get: async (k) => (await Preferences.get({ key: k })).value, set: (k, v) => Preferences.set({ key: k, value: v }), remove: (k) => Preferences.remove({ key: k }) },
    post: async (url, body) => {
      const r = await CapacitorHttp.post({ url, headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" }, data: Object.fromEntries(new URLSearchParams(body)), connectTimeout: 12000, readTimeout: 12000 });
      return { status: r.status, text: typeof r.data === "string" ? r.data : JSON.stringify(r.data) };
    },
    rawDeviceId: async () => (await Device.getId()).identifier,
    deviceLabel: async () => { const i = await Device.getInfo(); return `${i.manufacturer} ${i.model} — Android ${i.osVersion}`.slice(0, 120); },
    sha256Hex,
    randomHex: (n) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => b.toString(16).padStart(2, "0")).join(""),
    verify: (m, s, k) => nacl.sign.detached.verify(m, s, k),
    now: () => Math.floor(Date.now() / 1000),
    lang: () => useUi.getState().lang,
  });
  (window as any).blr = createMobileBridge();
  (window as any).baderLicense = {
    status: () => lic.status(), recheck: () => lic.recheck(), activate: (c: string) => lic.activate(c),
    config: async () => ({ app_name: MOBILE_LICENSE.app_name, purchase_url: MOBILE_LICENSE.purchase_url, device_label: (await Device.getInfo()).model }),
    deviceId: () => lic.deviceId(),
  };
  // Hardware back button: go back in the app, exit at the root
  const { App } = await import("@capacitor/app");
  App.addListener("backButton", ({ canGoBack }) => { if (canGoBack && location.pathname !== "/") history.back(); else App.exitApp(); });
  const { StatusBar, Style } = await import("@capacitor/status-bar");
  StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
  StatusBar.setBackgroundColor({ color: "#067a4c" }).catch(() => {});
}
