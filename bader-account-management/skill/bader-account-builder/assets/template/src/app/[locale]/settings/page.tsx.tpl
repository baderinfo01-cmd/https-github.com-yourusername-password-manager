"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Download, KeyRound, Palette, Timer, Trash2, Upload, User, MapPin, CheckCircle2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PasswordDialog from "@/components/ui/PasswordDialog";
import { useStore } from "@/store/useStore";
import { exportEncryptedBackup, pickBackupFile, type BackupLabels } from "@/lib/backup";
import { wipeVaultData } from "@/lib/vaultCrypto";
import { geoEnabled, setGeoEnabled } from "@/lib/security";
import { branding } from "@/config/branding";

const THEMES = ["brand", "purple", "green", "pink", "brown"];
const THEME_SWATCH: Record<string, string> = { brand: branding.accent, purple: "#a855f7", green: "#22c55e", pink: "#ec4899", brown: "#92400e" };

/**
 * Every control on this page DOES something (no decorative toggles): theme, auto-lock, profile (owner of the reports),
 * change master password, encrypted backup / restore, location lookup of sign-ins, wipe.
 * Dangerous actions go through <PasswordDialog mode="confirm"> (re-checks the master password).
 */
export default function SettingsPage() {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const ts = useTranslations("settings.security");
  const tb = useTranslations("settings.backup");

  const s = useStore();
  const [changeOpen, setChangeOpen] = useState(false);
  const [pending, setPending] = useState<(() => void) | null>(null);
  const [geo, setGeo] = useState(geoEnabled());
  const [msg, setMsg] = useState("");

  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(""), 2500);
  };
  const labels = (title: string, hint?: string): BackupLabels => ({
    title, hint, ok: tc("ok"), cancel: tc("cancel"), mismatch: tb("mismatch"), weak: tb("weak"),
  });

  const exportBackup = async () => {
    // backups always leave the app encrypted (.bbak); the JSON carries the "app" tag of THIS program
    if (await exportEncryptedBackup(s.exportAllData(), branding.slug, labels(tb("passwordTitle"), tb("passwordHint")))) flash(tb("exported"));
  };
  const importBackup = async () => {
    const text = await pickBackupFile(labels(tb("passwordTitle")));
    if (!text) return flash(tb("importFailed"));
    if (!confirm(tb("confirmImport"))) return;
    flash(s.importAllData(text) ? tb("imported") : tb("importFailed"));
  };
  const wipe = () => {
    if (!confirm(t("danger.confirmDeleteAll"))) return;
    setPending(() => () => {
      wipeVaultData(); // removes the encrypted data, keeps the master password
      window.location.reload();
    });
  };

  const card = "glass rounded-2xl p-6 space-y-4";
  const h3 = "text-xl font-bold flex items-center gap-2 text-primary";
  const input = "px-3 py-2 rounded-lg border border-border bg-card text-fg";

  return (
    <AppLayout>
      {changeOpen && <PasswordDialog mode="change" onClose={() => setChangeOpen(false)} />}
      {pending && <PasswordDialog mode="confirm" onClose={() => setPending(null)} onDone={pending} />}
      <div className="space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold">⚙️ {t("title")}</h1>
          <p className="text-muted mt-1">{t("subtitle")}</p>
        </div>
        {msg && <div role="status" className="glass rounded-2xl p-3 flex items-center gap-2 text-green-700"><CheckCircle2 className="w-5 h-5" />{msg}</div>}

        <section className={card}>
          <h3 className={h3}><User className="w-5 h-5" />{t("profile.title")}</h3>
          <p className="text-sm text-muted">{t("profile.hint")}</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <input className={input} placeholder={t("profile.firstName")} aria-label={t("profile.firstName")} value={s.myInfo.firstName} onChange={(e) => s.updateMyInfo({ firstName: e.target.value })} dir="auto" />
            <input className={input} placeholder={t("profile.lastName")} aria-label={t("profile.lastName")} value={s.myInfo.lastName} onChange={(e) => s.updateMyInfo({ lastName: e.target.value })} dir="auto" />
            <input className={input} placeholder={t("profile.username")} aria-label={t("profile.username")} value={s.myInfo.username} onChange={(e) => s.updateMyInfo({ username: e.target.value })} dir="ltr" />
          </div>
        </section>

        <section className={card}>
          <h3 className={h3}><Palette className="w-5 h-5" />{t("appearance.title")}</h3>
          <div className="flex gap-2">
            {THEMES.map((th) => (
              <button key={th} onClick={() => s.setTheme(th)} aria-label={t(`appearance.themes.${th}`)} title={t(`appearance.themes.${th}`)}
                className={`w-12 h-12 rounded-lg ${s.theme === th ? "ring-2 ring-offset-2 ring-primary scale-110" : ""}`} style={{ background: THEME_SWATCH[th] }} />
            ))}
          </div>
        </section>

        <section className={card}>
          <h3 className={h3}><KeyRound className="w-5 h-5" />{ts("title")}</h3>
          <label className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2"><Timer className="w-4 h-4" />{ts("autoLock")}</span>
            <select className={input} value={s.autoLockMinutes} onChange={(e) => s.setAutoLockMinutes(Number(e.target.value))} aria-label={ts("autoLock")}>
              {[1, 5, 15, 30, 60].map((m) => <option key={m} value={m}>{ts("minutes", { count: m })}</option>)}
            </select>
          </label>
          <label className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2"><MapPin className="w-4 h-4" />{ts("geo")}</span>
            <input type="checkbox" checked={geo} onChange={(e) => { setGeoEnabled(e.target.checked); setGeo(e.target.checked); }} />
          </label>
          <button onClick={() => setChangeOpen(true)} className="px-4 py-2 rounded-xl border border-border bg-card text-sm">{ts("changePasswordTitle")}</button>
        </section>

        <section className={card}>
          <h3 className={h3}><Download className="w-5 h-5" />{tb("title")}</h3>
          <p className="text-sm text-muted">{tb("hint")}</p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={exportBackup} className="px-4 py-3 rounded-xl bg-primary text-white flex items-center justify-center gap-2 text-sm font-medium"><Download className="w-4 h-4" />{tb("export")}</button>
            <button onClick={importBackup} className="px-4 py-3 rounded-xl border border-border bg-card flex items-center justify-center gap-2 text-sm font-medium"><Upload className="w-4 h-4" />{tb("import")}</button>
          </div>
        </section>

        <section className={`${card} border-red-300`}>
          <h3 className="text-xl font-bold flex items-center gap-2 text-red-600"><Trash2 className="w-5 h-5" />{t("danger.title")}</h3>
          <button onClick={wipe} className="w-full px-4 py-3 rounded-xl bg-red-500/10 text-red-600 text-sm font-medium">{t("danger.deleteAll")}</button>
        </section>
      </div>
    </AppLayout>
  );
}
