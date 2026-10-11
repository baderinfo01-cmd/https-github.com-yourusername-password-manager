"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { isUnlocked, lockVault } from "@/lib/vaultCrypto";
import "@/lib/security"; // Window.baderApp typings

/** Forget the key and reload so decrypted data disappears from memory. */
export function lockApp(locale: string) {
  lockVault();
  window.location.replace(`/${locale}/`);
}

/**
 * Route guard + idle auto-lock. Returns true only while the vault is unlocked.
 * Without a valid unlock the visitor is sent back to the login page.
 */
export function useRequireUnlock(): boolean {
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.split("/")[1] || "ar";
  const minutes = useStore((s) => s.autoLockMinutes);
  const [ok, setOk] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isUnlocked()) {
      router.replace(`/${locale}/`);
      return;
    }
    setOk(true);
  }, [locale, router]);

  // the desktop shell asks us to lock on minimize / screen lock / sleep
  useEffect(() => {
    if (!ok) return;
    return window.baderApp?.onLock?.(() => lockApp(locale));
  }, [ok, locale]);

  useEffect(() => {
    if (!ok) return;
    const ms = Math.max(1, minutes || 5) * 60_000;
    const reset = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => lockApp(locale), ms);
    };
    const events = ["mousemove", "keydown", "mousedown", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      events.forEach((e) => window.removeEventListener(e, reset));
      if (timer.current) clearTimeout(timer.current);
    };
  }, [ok, minutes, locale]);

  return ok;
}
