"use client";
import { Copy, Download, KeyRound } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui";
import { blr, call } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { useUi } from "@/store/ui";

/** Shows a newly issued recovery key ONCE; the user must confirm they saved it. */
export function RecoveryKeyDialog() {
  const t = useT();
  const key = useUi((s) => s.recoveryKey);
  const clear = useUi((s) => s.clearRecovery);
  const notify = useUi((s) => s.notify);
  const [ok, setOk] = useState(false);
  if (!key) return null;
  const copy = async () => { try { await navigator.clipboard.writeText(key); notify(t("copied")); } catch { notify(t("error"), "err"); } };
  const save = async () => {
    const text = `BLR Fatourati — ${t("recovery_key")}\\r\\n\\r\\n${key}\\r\\n\\r\\n${t("recovery_file_note")}\\r\\n`;
    try { const r = await call<{ saved: boolean }>(blr().file.saveText("BLR-recovery-key.txt", text)); if (r.saved) notify(t("saved")); } catch { notify(t("error"), "err"); }
  };
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
      <div className="glass pop w-full max-w-md rounded-3xl bg-surface p-7 text-center" style={{ background: "var(--surface)" }}>
        <div className="glow-ring mx-auto grid h-14 w-14 place-items-center rounded-2xl text-white" style={{ backgroundImage: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}><KeyRound size={26} /></div>
        <h2 className="mt-4 text-xl font-bold">{t("recovery_key")}</h2>
        <p className="mt-2 text-sm text-muted">{t("recovery_explain")}</p>
        <div dir="ltr" className="num mt-5 select-all rounded-2xl border-2 border-dashed border-accent/50 bg-accent/5 px-4 py-4 text-xl font-bold tracking-widest text-accent">{key}</div>
        <div className="mt-4 flex justify-center gap-2">
          <Button variant="secondary" size="sm" onClick={copy}><Copy size={14} />{t("copy")}</Button>
          <Button variant="secondary" size="sm" onClick={save}><Download size={14} />{t("save_as_file")}</Button>
        </div>
        <p className="mt-4 rounded-xl bg-warn/10 px-3 py-2 text-xs text-warn">{t("recovery_warning")}</p>
        <label className="mt-4 flex items-center justify-center gap-2 text-sm"><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} />{t("recovery_saved_confirm")}</label>
        <Button className="mt-4 h-11 w-full rounded-2xl" disabled={!ok} onClick={() => { setOk(false); clear(); }}>{t("continue")}</Button>
      </div>
    </div>
  );
}
