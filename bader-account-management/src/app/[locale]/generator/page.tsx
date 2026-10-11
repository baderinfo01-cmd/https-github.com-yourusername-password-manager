"use client";

import { useState, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import AppLayout from "@/components/layout/AppLayout";
import { useStore } from "@/store/useStore";
import {
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Check,
  X,
  Sparkles,
  Trash2,
  Clock,
  Search,
  Download,
  Printer,
} from "lucide-react";
import { copyToClipboard } from "@/lib/utils";
import { printElement } from "@/lib/print";
import { generateId } from "@/lib/encryption";

export default function GeneratorPage() {
  const t = useTranslations("generator");
  const locale = useLocale();

  const generatedPasswords = useStore(
    (state) => state.generatedPasswords || []
  );
  const addGeneratedPassword = useStore((state) => state.addGeneratedPassword);
  const removeGeneratedPassword = useStore(
    (state) => state.removeGeneratedPassword
  );
  const clearAllGeneratedPasswords = useStore(
    (state) => state.clearAllGeneratedPasswords
  );

  const [length, setLength] = useState(16);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [excludeSimilar, setExcludeSimilar] = useState(false);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStrength, setFilterStrength] = useState<string>("all");

  const printTitle = `${t("title")} - Bader Account Management`;

  const localeForDate =
    locale === "ar" ? "ar-DZ" : locale === "fr" ? "fr-FR" : "en-US";

  const getStrengthKey = (score: number): string => {
    if (score <= 2) return "veryWeak";
    if (score <= 3) return "weak";
    if (score <= 4) return "medium";
    if (score <= 5) return "strong";
    return "veryStrong";
  };

  const getStrengthLabel = (score: number): string => {
    return t(`strength.${getStrengthKey(score)}`);
  };

  const calculateStrength = (
    len: number,
    hasUp: boolean,
    hasLow: boolean,
    hasNum: boolean,
    hasSym: boolean
  ): number => {
    let score = 0;

    if (len >= 8) score += 1;
    if (len >= 12) score += 1;
    if (len >= 16) score += 1;
    if (len >= 20) score += 1;
    if (hasUp && hasLow) score += 1;
    if (hasNum) score += 1;
    if (hasSym) score += 1;

    return Math.min(score, 7);
  };

  const getStrengthColor = (score: number): string => {
    if (score <= 2) return "from-red-500 to-red-600";
    if (score <= 3) return "from-orange-500 to-red-500";
    if (score <= 4) return "from-yellow-500 to-orange-500";
    if (score <= 5) return "from-lime-500 to-yellow-500";
    return "from-green-500 to-emerald-500";
  };

  const getStrengthWidth = (score: number): string => {
    return `${(score / 7) * 100}%`;
  };

  const generatePassword = () => {
    let upperChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let lowerChars = "abcdefghijklmnopqrstuvwxyz";
    let numberChars = "0123456789";
    let symbolChars = "!@#$%^&*()_+-=[]{}|;:,.<>?";

    if (excludeSimilar) {
      upperChars = upperChars.replace(/[IO]/g, "");
      lowerChars = lowerChars.replace(/[lo]/g, "");
      numberChars = numberChars.replace(/[01]/g, "");
    }

    if (excludeAmbiguous) {
      symbolChars = symbolChars.replace(/[{}()[\]/\\']/g, "");
    }

    let chars = "";

    if (uppercase) chars += upperChars;
    if (lowercase) chars += lowerChars;
    if (numbers) chars += numberChars;
    if (symbols) chars += symbolChars;

    if (!chars) {
      alert(t("alerts.selectOneType"));
      return;
    }

    const usedChars: string[] = [];

    if (uppercase && upperChars) {
      usedChars.push(upperChars[Math.floor(Math.random() * upperChars.length)]);
    }

    if (lowercase && lowerChars) {
      usedChars.push(lowerChars[Math.floor(Math.random() * lowerChars.length)]);
    }

    if (numbers && numberChars) {
      usedChars.push(
        numberChars[Math.floor(Math.random() * numberChars.length)]
      );
    }

    if (symbols && symbolChars) {
      usedChars.push(
        symbolChars[Math.floor(Math.random() * symbolChars.length)]
      );
    }

    for (let i = usedChars.length; i < length; i++) {
      usedChars.push(chars[Math.floor(Math.random() * chars.length)]);
    }

    for (let i = usedChars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [usedChars[i], usedChars[j]] = [usedChars[j], usedChars[i]];
    }

    const result = usedChars.join("");
    setPassword(result);

    const strength = calculateStrength(
      length,
      uppercase,
      lowercase,
      numbers,
      symbols
    );

    addGeneratedPassword({
      id: generateId(),
      password: result,
      length,
      hasUppercase: uppercase,
      hasLowercase: lowercase,
      hasNumbers: numbers,
      hasSymbols: symbols,
      strength,
      strengthLabel: getStrengthLabel(strength),
      createdAt: new Date().toISOString(),
    });

    setCopied(false);
  };

  const currentStrength = useMemo(() => {
    return calculateStrength(length, uppercase, lowercase, numbers, symbols);
  }, [length, uppercase, lowercase, numbers, symbols]);

  const handleCopy = async () => {
    if (!password) return;

    const success = await copyToClipboard(password);

    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyOldPassword = async (pwd: string) => {
    await copyToClipboard(pwd);
    alert(t("alerts.copied"));
  };

  const filteredPasswords = useMemo(() => {
    let result = generatedPasswords || [];

    if (search) {
      result = result.filter((p) => p.password.includes(search));
    }

    if (filterStrength !== "all") {
      result = result.filter((p) => {
        if (filterStrength === "very_weak") return p.strength <= 2;
        if (filterStrength === "weak") return p.strength === 3;
        if (filterStrength === "medium") return p.strength === 4;
        if (filterStrength === "strong") return p.strength === 5;
        if (filterStrength === "very_strong") return p.strength >= 6;

        return true;
      });
    }

    return result;
  }, [generatedPasswords, search, filterStrength]);

  const exportPasswords = () => {
    const data = JSON.stringify(generatedPasswords, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `bader-passwords-${Date.now()}.json`;
    a.click();

    URL.revokeObjectURL(url);
  };

  const options = [
    {
      label: t("options.uppercase"),
      enabled: uppercase,
      onChange: setUppercase,
    },
    {
      label: t("options.lowercase"),
      enabled: lowercase,
      onChange: setLowercase,
    },
    {
      label: t("options.numbers"),
      enabled: numbers,
      onChange: setNumbers,
    },
    {
      label: t("options.symbols"),
      enabled: symbols,
      onChange: setSymbols,
    },
    {
      label: t("options.excludeSimilar"),
      enabled: excludeSimilar,
      onChange: setExcludeSimilar,
    },
    {
      label: t("options.excludeAmbiguous"),
      enabled: excludeAmbiguous,
      onChange: setExcludeAmbiguous,
    },
  ];

  const tips = [
    { type: "good", text: t("tips.useLongPassword") },
    { type: "good", text: t("tips.mixCharacters") },
    { type: "good", text: t("tips.uniquePassword") },
    { type: "good", text: t("tips.changeRegularly") },
    { type: "bad", text: t("tips.noPersonalInfo") },
    { type: "bad", text: t("tips.doNotShare") },
  ];

  return (
    <AppLayout>
      <div className="space-y-6" id="generator-content">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">🪄 {t("title")}</h1>
            <p className="text-gray-600 mt-1">{t("subtitle")}</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={exportPasswords}
              className="px-4 py-2.5 rounded-xl glass hover:bg-white/80 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {t("actions.export")}
            </button>

            <button
              onClick={() => printElement("generator-content", printTitle)}
              className="px-4 py-2.5 rounded-xl glass hover:bg-white/80 transition-colors flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              {t("actions.print")}
            </button>
          </div>
        </div>

        {/* Main Generator */}
        <div className="glass rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-primary">
            <Sparkles className="w-5 h-5" />
            {t("generate.title")}
          </h2>

          <div className="flex gap-2">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("generate.placeholder")}
              className="flex-1 px-4 py-4 text-lg font-mono rounded-xl bg-white border-2 border-border focus:outline-none focus:border-primary"
              dir="ltr"
            />

            <button
              onClick={() => setShowPassword(!showPassword)}
              className="px-4 rounded-xl bg-white border-2 border-border hover:bg-gray-50"
              title={showPassword ? t("actions.hide") : t("actions.show")}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>

            <button
              onClick={handleCopy}
              className="px-4 rounded-xl bg-white border-2 border-border hover:bg-gray-50 flex items-center gap-2"
              title={t("actions.copy")}
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-green-600">
                    {t("actions.done")}
                  </span>
                </>
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>
          </div>

          {password && (
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">
                  {t("generate.strength")}:
                </span>
                <span className="text-sm font-bold">
                  {getStrengthLabel(currentStrength)}
                </span>
              </div>

              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${getStrengthColor(
                    currentStrength
                  )} transition-all duration-500`}
                  style={{ width: getStrengthWidth(currentStrength) }}
                />
              </div>
            </div>
          )}

          <button
            onClick={generatePassword}
            className="w-full btn-3d py-4 rounded-xl text-white font-bold text-lg flex items-center justify-center gap-2"
            style={{ background: "rgb(var(--color-primary))" }}
          >
            <RefreshCw className="w-5 h-5" />
            {t("generate.button")}
          </button>
        </div>

        {/* Options */}
        <div className="glass rounded-2xl p-6 space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2 text-primary">
            ⚙️ {t("settings.title")}
          </h3>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium">
                {t("settings.length")}
              </label>
              <span className="text-sm font-bold text-primary text-lg">
                {length}
              </span>
            </div>

            <input
              type="range"
              min="4"
              max="64"
              value={length}
              onChange={(e) => setLength(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />

            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>4</span>
              <span>16</span>
              <span>32</span>
              <span>48</span>
              <span>64</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {options.map((option, index) => (
              <ToggleOption
                key={index}
                label={option.label}
                enabled={option.enabled}
                onChange={option.onChange}
              />
            ))}
          </div>
        </div>

        {/* History */}
        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold flex items-center gap-2 text-primary">
              <Clock className="w-5 h-5" />
              {t("history.title")} ({generatedPasswords.length})
            </h3>

            {generatedPasswords.length > 0 && (
              <button
                onClick={() => {
                  if (confirm(t("history.confirmClear"))) {
                    clearAllGeneratedPasswords();
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-sm flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                {t("actions.clearAll")}
              </button>
            )}
          </div>

          {generatedPasswords.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <div className="flex-1 relative min-w-[200px]">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("history.searchPlaceholder")}
                  className="w-full pr-9 pl-3 py-2 rounded-lg border border-border text-sm"
                />
              </div>

              <select
                value={filterStrength}
                onChange={(e) => setFilterStrength(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border text-sm"
              >
                <option value="all">{t("filters.all")}</option>
                <option value="very_weak">{t("strength.veryWeak")}</option>
                <option value="weak">{t("strength.weak")}</option>
                <option value="medium">{t("strength.medium")}</option>
                <option value="strong">{t("strength.strong")}</option>
                <option value="very_strong">{t("strength.veryStrong")}</option>
              </select>
            </div>
          )}

          {filteredPasswords.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>
                {generatedPasswords.length === 0
                  ? t("history.empty")
                  : t("history.noResults")}
              </p>
              <p className="text-xs mt-1">{t("history.hint")}</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredPasswords.map((pwd) => (
                <PasswordHistoryCard
                  key={pwd.id}
                  pwd={pwd}
                  localeForDate={localeForDate}
                  onCopy={() => copyOldPassword(pwd.password)}
                  onDelete={() => removeGeneratedPassword(pwd.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="glass rounded-2xl p-6">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            💡 {t("tips.title")}
          </h3>

          <ul className="space-y-2 text-sm text-gray-700">
            {tips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2">
                {tip.type === "good" ? (
                  <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <X className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                )}
                <span>{tip.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AppLayout>
  );
}

function ToggleOption({
  label,
  enabled,
  onChange,
}: {
  label: string;
  enabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`px-3 py-3 rounded-xl border-2 text-sm font-medium transition-all flex items-center justify-between gap-2 ${
        enabled
          ? "border-primary bg-primary text-white"
          : "border-border bg-white text-gray-700 hover:border-primary"
      }`}
      style={
        enabled
          ? {
              backgroundColor: "rgb(var(--color-primary))",
              borderColor: "rgb(var(--color-primary))",
            }
          : {}
      }
    >
      <span>{label}</span>
      {enabled ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
    </button>
  );
}

function PasswordHistoryCard({
  pwd,
  localeForDate,
  onCopy,
  onDelete,
}: {
  pwd: any;
  localeForDate: string;
  onCopy: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations("generator");

  const getStrengthKey = (score: number): string => {
    if (score <= 2) return "veryWeak";
    if (score <= 3) return "weak";
    if (score <= 4) return "medium";
    if (score <= 5) return "strong";
    return "veryStrong";
  };

  const getStrengthLabel = (score: number): string => {
    return t(`strength.${getStrengthKey(score)}`);
  };

  const getStrengthColor = (score: number) => {
    if (score <= 2) return "from-red-500 to-red-600";
    if (score <= 3) return "from-orange-500 to-red-500";
    if (score <= 4) return "from-yellow-500 to-orange-500";
    if (score <= 5) return "from-lime-500 to-yellow-500";
    return "from-green-500 to-emerald-500";
  };

  return (
    <div className="bg-white rounded-xl p-3 border border-border hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getStrengthColor(
            pwd.strength
          )} flex items-center justify-center text-white flex-shrink-0`}
        >
          <Sparkles className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-mono text-sm truncate" dir="ltr">
            {pwd.password}
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1 flex-wrap">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(pwd.createdAt).toLocaleString(localeForDate)}
            </span>

            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
              {t("history.lengthChars", { length: pwd.length })}
            </span>

            <span
              className={`px-2 py-0.5 rounded-full bg-gradient-to-r ${getStrengthColor(
                pwd.strength
              )} text-white`}
            >
              {getStrengthLabel(pwd.strength)}
            </span>
          </div>
        </div>

        <button
          onClick={onCopy}
          className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex-shrink-0"
          title={t("actions.copy")}
        >
          <Copy className="w-4 h-4" />
        </button>

        <button
          onClick={onDelete}
          className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex-shrink-0"
          title={t("actions.delete")}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}