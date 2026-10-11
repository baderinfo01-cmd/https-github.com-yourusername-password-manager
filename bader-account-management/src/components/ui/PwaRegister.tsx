"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";

/** Registers the service worker so the phone web app is installable and works offline. */
export default function PwaRegister() {
  const params = useParams();
  const locale = (params?.locale as string) || "ar";

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    // not inside the desktop app (custom app:// scheme) or the Android shell (it ships the files itself)
    if (!/^https?:$/.test(location.protocol) || (window as any).baderApp || (window as any).Capacitor) return;
    if (location.hostname === "localhost" && location.port === "3000") return; // dev server
    navigator.serviceWorker.register(`/sw.js?lang=${locale}`, { scope: "/" }).catch(() => {
      /* offline support is optional */
    });
  }, [locale]);

  return null;
}
