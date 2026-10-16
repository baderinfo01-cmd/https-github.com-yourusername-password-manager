"use client";
import { useEffect, useRef, useState } from "react";
import { withFont } from "@/lib/fontEmbed";
import type { LicenseStatus } from "@/lib/license";
import { buildLicenseHtml } from "@/lib/licenseHtml";
import type { Lang } from "@/store/ui";

/** Scaled live preview of the printable licence certificate (same HTML that is printed / saved as PDF). */
export function CertPreview({ s, lang, version }: { s: LicenseStatus; lang: Lang; version: string }) {
  const [html, setHtml] = useState("");
  const [scale, setScale] = useState(1);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let live = true;
    buildLicenseHtml(s, lang, version, window.location.origin).then(withFont).then((h) => live && setHtml(h));
    return () => { live = false; };
  }, [s, lang, version]);
  useEffect(() => {
    const el = box.current; if (!el) return;
    const ro = new ResizeObserver(() => setScale(Math.min(1, el.clientWidth / 794)));
    ro.observe(el); return () => ro.disconnect();
  }, []);
  return (
    <div ref={box} className="mx-auto overflow-hidden rounded-lg bg-white shadow-lg" style={{ width: "100%", maxWidth: 794, height: 1123 * scale }}>
      {html && <iframe title="license" srcDoc={html} style={{ width: 794, height: 1123, border: 0, background: "#fff", transform: `scale(${scale})`, transformOrigin: "top left" }} />}
    </div>
  );
}
