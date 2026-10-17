"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Eye, EyeOff, Shield, Sparkles } from "lucide-react";
import { useStore } from "@/store/useStore";
import {
  createVault,
  unlockVault,
  getVaultState,
  hasLegacyData,
  passwordProblem,
  MIN_PASSWORD_LENGTH,
  appendLoginEvent,
  updateLoginEvent,
  type VaultState,
} from "@/lib/vaultCrypto";
import { getSessionInfo } from "@/lib/security";
import { branding } from "@/config/branding";

const LANGS = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
];

/**
 * Login / first-run screen. State machine from vaultCrypto.getVaultState():
 *   needs-setup (no vault yet: choose the master password) -> locked (ask the password) -> unlocked.
 * There is NO password recovery by design: the key is derived from the password and never stored.
 */
export default function LoginPage() {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale(); // the URL decides the language, never a hard-coded default
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<VaultState | "checking">("checking");
  const [legacy, setLegacy] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMode(getVaultState());
    setLegacy(hasLegacyData());
  }, []);

  /** Logs a failed / blocked attempt in the background (the place lookup may take seconds). */
  const logFailure = (result: "failed" | "locked") => {
    const ev = appendLoginEvent({ t: Date.now(), result, device: "…", os: "", app: "", source: "desktop" });
    if (ev) void getSessionInfo().then((info) => updateLoginEvent(ev.id, info));
  };

  const enter = async () => {
    try {
      sessionStorage.setItem("bader-login-pending", "1"); // LoginNotice logs the success + shows the summary once
    } catch {
      /* ignore */
    }
    // the key is in memory now: load + decrypt the data, then open the app (client navigation keeps the key)
    await useStore.persist.rehydrate();
    router.push(`/${locale}/dashboard/`);
  };

  const submit = async () => {
    if (loading || mode === "checking") return;
    setError(null);
    setLoading(true);
    try {
      if (mode === "needs-setup") {
        const problem = passwordProblem(password);
        if (problem) return setError(problem === "short" ? "passwordTooShort" : "passwordWeak");
        if (password !== confirm) return setError("passwordsMismatch");
        await createVault(password);
        return await enter();
      }
      const res = await unlockVault(password);
      if (res.ok) return await enter();
      if (res.waitMs) {
        setError(`wait:${Math.ceil(res.waitMs / 1000)}`);
        logFailure("locked");
      } else {
        setError("wrongPassword");
        logFailure("failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const errorText = () => {
    if (!error) return "";
    if (error.startsWith("wait:")) return t("auth.tooManyAttempts", { seconds: error.slice(5) });
    if (error === "passwordTooShort") return t("auth.passwordTooShort", { min: MIN_PASSWORD_LENGTH });
    return t(`auth.${error}`);
  };

  const field = "w-full px-5 py-4 rounded-2xl bg-card text-fg border-2 text-center text-lg";

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -start-40 w-96 h-96 rounded-full opacity-30 blur-3xl animate-float bg-primary" />
        <div className="absolute -bottom-40 -end-40 w-[500px] h-[500px] rounded-full opacity-30 blur-3xl animate-float bg-primary" />
      </div>

      <div className="absolute top-6 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 z-20">
        <div className="glass rounded-full p-1.5 flex gap-1" role="group" aria-label="language">
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => router.push(`/${l.code}/`)}
              className={`px-5 py-2 rounded-full text-sm font-medium ${locale === l.code ? "text-white bg-primary" : "text-muted hover:bg-accent"}`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md animate-slide-up">
        <form
          className="glass rounded-3xl p-8 md:p-10"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <div className="flex justify-center mb-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={branding.assets.logo} alt={branding.appName} className="w-24 h-24 rounded-3xl shadow-2xl" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-center mb-1 text-primary">{t("common.appName")}</h1>
          <div className="flex items-center justify-center gap-1.5 mb-5 mt-2 text-xs font-medium text-muted">
            <Shield className="w-3.5 h-3.5 text-primary" /> AES-256 Encrypted
          </div>

          <div className="text-center mb-5">
            <h2 className="text-xl font-bold mb-1">{mode === "needs-setup" ? t("auth.createTitle") : t("auth.welcome")}</h2>
            <p className="text-sm text-muted">{mode === "needs-setup" ? t("auth.createDescription") : t("auth.enterPassword")}</p>
            {mode === "needs-setup" && legacy && <p className="mt-2 text-xs text-amber-700 bg-amber-500/10 border border-amber-300 rounded-lg p-2">{t("auth.legacyNotice")}</p>}
          </div>

          <div className="relative mb-4">
            <input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              className={`${field} ${error ? "border-red-400" : "border-border"}`}
              placeholder="••••••••••••"
              aria-label={t("auth.password")}
              autoFocus
              autoComplete={mode === "needs-setup" ? "new-password" : "current-password"}
            />
            <button type="button" onClick={() => setShow(!show)} className="absolute top-1/2 -translate-y-1/2 end-3 text-muted p-2 rounded-lg hover:bg-accent" aria-label={show ? "hide" : "show"}>
              {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {mode === "needs-setup" && (
            <>
              <input
                type={show ? "text" : "password"}
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setError(null); }}
                className={`${field} border-border mb-3`}
                placeholder={t("auth.confirmPassword")}
                aria-label={t("auth.confirmPassword")}
                autoComplete="new-password"
              />
              <p className="mb-4 text-xs text-muted text-center">{t("auth.noRecoveryWarning")}</p>
            </>
          )}

          {error && <div role="alert" className="mb-4 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-300 text-red-600 text-sm text-center">⚠️ {errorText()}</div>}

          <button type="submit" disabled={loading || mode === "checking"} className="w-full btn-3d py-4 rounded-2xl text-white font-bold text-lg bg-primary disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {loading ? t("common.loading") : mode === "needs-setup" ? t("auth.create") : t("auth.unlock")}
          </button>

          <p className="mt-6 pt-5 border-t border-border text-center text-xs text-muted flex items-center justify-center gap-2">
            <Shield className="w-3.5 h-3.5" /> {t("auth.footer")}
          </p>
        </form>
        <div className="text-center mt-4 text-xs text-muted">{branding.version} • Powered by {branding.developer.company}</div>
      </div>
    </div>
  );
}
