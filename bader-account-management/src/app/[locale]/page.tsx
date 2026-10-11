"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Lock, Eye, EyeOff, Shield, Sparkles } from "lucide-react";
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
import { sendAlert } from "@/lib/sync/controller";

export default function LoginPage() {
  const t = useTranslations();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<VaultState | "checking">("checking");
  const [legacy, setLegacy] = useState(false);
  const [locale, setLocale] = useState<"ar" | "en" | "fr">("ar");
  const [theme, setTheme] = useState<"purple" | "blue" | "green" | "pink" | "brown">("blue");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    setMode(getVaultState());
    setLegacy(hasLegacyData());
  }, []);

  /** Logs a failed / blocked attempt in the background (place lookup may take a few seconds). */
  const logFailure = (result: "failed" | "locked") => {
    const ev = appendLoginEvent({ t: Date.now(), result, device: "…", os: "", app: "", source: "desktop" });
    if (!ev) return;
    void getSessionInfo().then((info) => {
      updateLoginEvent(ev.id, info);
      void sendAlert({ ...ev, ...info }); // tell the other devices, even though the vault is locked
    });
  };

  const enter = async () => {
    try {
      sessionStorage.setItem("bader-login-pending", "1");
    } catch {
      /* ignore */
    }
    // the vault key is now in memory: load the decrypted data, then open the app
    await useStore.persist.rehydrate();
    router.push(`/${locale}/dashboard`);
  };

  const handleUnlock = async () => {
    if (loading || mode === "checking") return;
    setError(null);
    setLoading(true);
    try {
      if (mode === "needs-setup") {
        const problem = passwordProblem(password);
        if (problem) {
          setError(problem === "short" ? "passwordTooShort" : "passwordWeak");
          return;
        }
        if (password !== confirm) {
          setError("passwordsMismatch");
          return;
        }
        await createVault(password);
        await enter();
        return;
      }
      const res = await unlockVault(password);
      if (res.ok) {
        await enter();
      } else if (res.waitMs) {
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

  const switchLocale = (newLocale: "ar" | "en" | "fr") => {
    setLocale(newLocale);
    router.push(`/${newLocale}`);
  };

  const languages = [
    { code: "fr" as const, label: "Français" },
    { code: "en" as const, label: "English" },
    { code: "ar" as const, label: "العربية" },
  ];

  const themes: Array<"purple" | "blue" | "green" | "pink" | "brown"> = [
    "purple", "blue", "green", "pink", "brown",
  ];

  const themeColors: Record<string, string> = {
    purple: "#a855f7",
    blue: "#0ea5e9",
    green: "#22c55e",
    pink: "#ec4899",
    brown: "#92400e",
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-background">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-30 blur-3xl animate-float"
          style={{ background: themeColors[theme] }}
        ></div>
        <div
          className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full opacity-30 blur-3xl animate-float"
          style={{ background: themeColors[theme], animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20 blur-3xl animate-float"
          style={{ background: themeColors[theme], animationDelay: "2s" }}
        ></div>
      </div>

      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
        <div className="glass rounded-full p-1.5 flex gap-1 shadow-xl">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => switchLocale(lang.code)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                locale === lang.code
                  ? "text-white shadow-lg scale-105"
                  : "text-gray-600 hover:text-gray-900 hover:bg-white/40"
              }`}
              style={
                locale === lang.code
                  ? { backgroundColor: themeColors[theme] }
                  : {}
              }
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
        <div className="glass rounded-full p-2 flex gap-2 shadow-xl">
          {themes.map((th) => (
            <button
              key={th}
              onClick={() => setTheme(th)}
              className={`w-9 h-9 rounded-full transition-all duration-300 ${
                theme === th
                  ? "scale-125 ring-4 ring-white shadow-xl"
                  : "hover:scale-110 ring-2 ring-transparent hover:ring-white/50"
              }`}
              style={{ backgroundColor: themeColors[th] }}
              aria-label={th}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md animate-slide-up">
        <div className="glass rounded-3xl p-8 md:p-10 card-hover">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div
                className="absolute inset-0 rounded-3xl blur-2xl opacity-50 animate-pulse"
                style={{ backgroundColor: themeColors[theme] }}
              ></div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/app-icon.png"
                alt="Bader Account Management"
                className="relative w-24 h-24 md:w-28 md:h-28 rounded-3xl shadow-2xl"
              />
            </div>
          </div>

          <h1
            className="text-2xl md:text-3xl font-bold text-center mb-1 bg-clip-text text-transparent"
            style={{
              backgroundImage: `linear-gradient(to right, ${themeColors[theme]}, ${themeColors[theme]}aa)`,
            }}
          >
            {t("common.appName")}
          </h1>

          <div className="flex items-center justify-center gap-2 mb-6 mt-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/60 backdrop-blur-sm border border-border">
              <Shield className="w-3.5 h-3.5" style={{ color: themeColors[theme] }} />
              <span className="text-xs font-medium text-gray-600">
                AES-256 Encrypted
              </span>
            </div>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-xl md:text-2xl font-bold mb-1">
              👋 {mode === "needs-setup" ? t("auth.createTitle") : t("auth.welcome")}
            </h2>
            <p className="text-sm text-gray-600">
              {mode === "needs-setup" ? t("auth.createDescription") : t("auth.enterPassword")}
            </p>
            {mode === "needs-setup" && legacy && (
              <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                {t("auth.legacyNotice")}
              </p>
            )}
          </div>

          <div className="relative mb-4">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
              className={`w-full px-5 py-4 rounded-2xl bg-white border-2 ${
                error ? "border-red-400" : "border-gray-200"
              } focus:outline-none text-center text-lg transition-all duration-300`}
              placeholder="••••••••••••"
              autoFocus
              autoComplete={mode === "needs-setup" ? "new-password" : "current-password"}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-1/2 -translate-y-1/2 end-4 text-gray-500 hover:text-gray-700 transition-colors p-2 rounded-lg hover:bg-gray-100"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          {mode === "needs-setup" && (
            <>
              <input
                type={showPassword ? "text" : "password"}
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                className="w-full mb-3 px-5 py-4 rounded-2xl bg-white border-2 border-gray-200 focus:outline-none text-center text-lg"
                placeholder={t("auth.confirmPassword")}
                autoComplete="new-password"
              />
              <p className="mb-4 text-xs text-gray-500 text-center">{t("auth.noRecoveryWarning")}</p>
            </>
          )}

          {error && (
            <div className="mb-4 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm text-center">
              ⚠️ {errorText()}
            </div>
          )}

          <button
            onClick={handleUnlock}
            disabled={loading || mode === "checking"}
            className="w-full btn-3d py-4 rounded-2xl text-white font-bold text-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              background: `linear-gradient(135deg, ${themeColors[theme]}, ${themeColors[theme]}cc)`,
            }}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {t("common.loading")}
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                {mode === "needs-setup" ? t("auth.create") : t("auth.unlock")}
              </>
            )}
          </button>

          <div className="mt-6 pt-6 border-t border-gray-200/50">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <Shield className="w-3.5 h-3.5" />
              <span>البيانات مشفرة ومحمية على جهازك فقط</span>
            </div>
          </div>
        </div>

        <div className="text-center mt-4 text-xs text-gray-500">
          v3.0.0 • Powered by Baderinfo
        </div>
      </div>
    </div>
  );
}