"use client";
import { FileDown, Printer, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button, Input, Select } from "./ui";
import { blr, call } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { usePreview, type Paper } from "@/store/preview";
import { useUi } from "@/store/ui";

/** Print preview: shows the exact page before it is sent to the printer, with printer / copies / paper choices. */
export function PrintPreviewHost() {
  const t = useT();
  const { req, close } = usePreview();
  const notify = useUi((s) => s.notify);
  const [paper, setPaper] = useState<Paper>("a4");
  const [html, setHtml] = useState("");
  const [printers, setPrinters] = useState<{ name: string; displayName: string; isDefault: boolean }[]>([]);
  const [printer, setPrinter] = useState("");
  const [copies, setCopies] = useState("1");
  const [dialog, setDialog] = useState(false);
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(1);
  const [h, setH] = useState(1123);

  useEffect(() => {
    if (!req) return;
    setPaper(req.paper || req.papers?.[0] || "a4");
    setCopies("1");
    call<any[]>(blr().print.printers()).then((l) => { setPrinters(l); setPrinter(l.find((p) => p.isDefault)?.name || ""); }).catch(() => {});
  }, [req]);
  useEffect(() => {
    if (!req) return;
    let live = true;
    req.build(paper).then((x) => live && setHtml(x));
    return () => { live = false; };
  }, [req, paper]);
  useEffect(() => {
    const el = box.current;
    if (!el || !req) return;
    const w = paper === "thermal" ? 302 : 794;
    const ro = new ResizeObserver(() => setScale(Math.min(1.2, (el.clientWidth - 32) / w)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [req, paper]);
  useEffect(() => {
    if (!req) return;
    const h2 = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", h2);
    return () => window.removeEventListener("keydown", h2);
  }, [req, close]);

  if (!req) return null;
  const w = paper === "thermal" ? 302 : 794;
  const measure = () => {
    const d = frame.current?.contentDocument;
    if (d) setH(Math.max(paper === "thermal" ? 200 : 1123, d.documentElement.scrollHeight));
  };
  const print = async () => {
    setBusy(true);
    try {
      const r = await call<{ printed: boolean; reason?: string }>(blr().print.html(html, { paper, deviceName: printer, copies, dialog }));
      if (r.printed) { notify(t("sent_to_printer")); close(); } else if (r.reason !== "cancelled") notify(t("print_failed") + (r.reason ? ` (${r.reason})` : ""), "err");
    } catch { notify(t("print_failed"), "err"); } finally { setBusy(false); }
  };
  const pdf = async () => {
    const r = await call<{ saved: boolean }>(blr().print.pdf(html, req.fileName.endsWith(".pdf") ? req.fileName : req.fileName + ".pdf", { paper }));
    if (r.saved) notify(t("saved"));
  };

  return (
    <div className="no-print fixed inset-0 z-[70] flex flex-col bg-black/70 backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-3 border-b border-line bg-surface px-4 py-3">
        <div className="me-auto flex items-center gap-2 font-semibold"><Printer size={18} className="text-accent" />{t("print_preview")} — {req.title}</div>
        {(req.papers?.length || 0) > 1 && (
          <div className="flex overflow-hidden rounded-lg border border-line text-xs">
            {req.papers!.map((p) => <button key={p} onClick={() => setPaper(p)} className={`px-3 py-1.5 ${paper === p ? "bg-accent text-white" : "bg-surface hover:bg-surface2"}`}>{p === "a4" ? "A4" : t("thermal_80")}</button>)}
          </div>
        )}
        <Select value={printer} onChange={(e) => setPrinter(e.target.value)} className="h-9 w-56 text-xs" aria-label={t("printer")}>
          <option value="">{t("default_printer")}</option>
          {printers.map((p) => <option key={p.name} value={p.name}>{p.displayName}{p.isDefault ? " ★" : ""}</option>)}
        </Select>
        <label className="flex items-center gap-1.5 text-xs text-muted">{t("copies")}<Input type="number" min="1" max="99" value={copies} onChange={(e) => setCopies(e.target.value)} className="num h-9 w-16" /></label>
        <label className="flex items-center gap-1.5 text-xs text-muted"><input type="checkbox" checked={dialog} onChange={(e) => setDialog(e.target.checked)} />{t("system_dialog")}</label>
        <Button variant="secondary" size="sm" onClick={pdf}><FileDown size={14} />PDF</Button>
        <Button onClick={print} disabled={busy || !html}><Printer size={15} />{t("print")}</Button>
        <button onClick={close} aria-label="close" className="rounded-md p-2 text-muted hover:bg-surface2"><X size={18} /></button>
      </div>
      <div ref={box} className="flex-1 overflow-auto p-4" style={{ direction: "ltr" }}>
        <div className="mx-auto shadow-2xl" style={{ width: w * scale, height: h * scale, background: "#fff" }}>
          <iframe ref={frame} title="preview" srcDoc={html} sandbox="allow-same-origin" onLoad={measure} className="block border-0 bg-white" style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: "top left" }} />
        </div>
      </div>
    </div>
  );
}
