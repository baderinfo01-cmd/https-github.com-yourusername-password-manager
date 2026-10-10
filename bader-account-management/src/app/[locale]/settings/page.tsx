"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import AppLayout from "@/components/layout/AppLayout";
import { exportEncryptedBackup } from "@/lib/backup";
import PasswordDialog from "@/components/ui/PasswordDialog";
import { wipeVaultData } from "@/lib/vaultCrypto";
import { useStore } from "@/store/useStore";
import {
  Palette,
  Shield,
  Download,
  Upload,
  Lock,
  Key,
  Clock,
  Database,
  Trash2,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Server,
  Sparkles,
  Volume2,
  HardDrive,
  Zap,
  FileText,
} from "lucide-react";

export default function SettingsPage() {
  const t = useTranslations("settings");
const router = useRouter();
const params = useParams();
const locale = (params?.locale as string) || "ar";
const resetFirstSetup = () => {
  if (confirm("هل تريد إعادة إعداد معلومات المستخدم الأول؟")) {
    localStorage.removeItem("bader-first-setup-completed-v1");
    router.push(`/${locale}/setup-profile`);
  }
};
  const [pwOpen, setPwOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const confirmWithPassword = (fn: () => void) => setPendingAction(() => fn);
  const accounts = useStore((state) => state.accounts);
  const subscriptions = useStore((state) => state.subscriptions);
  const cards = useStore((state) => state.cards);
  const documents = useStore((state) => state.documents);
  const contacts = useStore((state) => state.contacts);

  const theme = useStore((state) => state.theme);
  const setTheme = useStore((state) => state.setTheme);

  const autoLockMinutes = useStore((state) => state.autoLockMinutes);
  const setAutoLockMinutes = useStore((state) => state.setAutoLockMinutes);

  const backupFrequency = useStore((state) => state.backupFrequency);
  const setBackupFrequency = useStore((state) => state.setBackupFrequency);

  const exportFormat = useStore((state) => state.exportFormat);
  const setExportFormat = useStore((state) => state.setExportFormat);

  const sessionTimeout = useStore((state) => state.sessionTimeout);
  const setSessionTimeout = useStore((state) => state.setSessionTimeout);

  const [fontSize, setFontSize] = useState("medium");
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSavedMessage, setShowSavedMessage] = useState(false);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [theme]);

  const totalData =
    accounts.length +
    subscriptions.length +
    cards.length +
    documents.length +
    contacts.length;

  const showMessage = () => {
    setShowSavedMessage(true);
    setTimeout(() => setShowSavedMessage(false), 1500);
  };

  const handleExport = async () => {
    const data = {
      version: "3.0.0",
      exportDate: new Date().toISOString(),
      accounts,
      subscriptions,
      cards,
      documents,
      contacts,
      settings: { theme, backupFrequency, exportFormat },
    };
    // backups always leave the app encrypted
    if (await exportEncryptedBackup(JSON.stringify(data), "bader-export")) showMessage();
  };

  const themes = [
    { value: "blue", gradient: "from-blue-500 to-cyan-500" },
    { value: "purple", gradient: "from-purple-500 to-indigo-500" },
    { value: "green", gradient: "from-green-500 to-emerald-500" },
    { value: "pink", gradient: "from-pink-500 to-rose-500" },
    { value: "brown", gradient: "from-amber-700 to-yellow-600" },
  ];

  const fontSizes = [
    { value: "small", label: t("appearance.font.small"), size: "text-xs" },
    { value: "medium", label: t("appearance.font.medium"), size: "text-sm" },
    { value: "large", label: t("appearance.font.large"), size: "text-base" },
  ];

  const backupFrequencies = [
    { value: "daily", label: t("backup.frequencies.daily") },
    { value: "weekly", label: t("backup.frequencies.weekly") },
    { value: "monthly", label: t("backup.frequencies.monthly") },
    { value: "never", label: t("backup.frequencies.never") },
  ];

  const exportFormats = [
    {
      value: "json",
      label: "JSON",
      desc: t("backup.formats.json"),
    },
    {
      value: "csv",
      label: "CSV",
      desc: t("backup.formats.csv"),
    },
    {
      value: "encrypted",
      label: t("backup.formats.encryptedLabel"),
      desc: t("backup.formats.encrypted"),
    },
  ];

  const currentFontSizeLabel =
    fontSize === "small"
      ? t("appearance.font.small")
      : fontSize === "large"
      ? t("appearance.font.large")
      : t("appearance.font.medium");

  const currentBackupFrequencyLabel =
    backupFrequencies.find((item) => item.value === backupFrequency)?.label ||
    backupFrequency;

  return (
    <AppLayout>
      {pwOpen && <PasswordDialog mode="change" onClose={() => setPwOpen(false)} />}
      {pendingAction && (
        <PasswordDialog mode="confirm" onClose={() => setPendingAction(null)} onDone={pendingAction} />
      )}
      <div className="space-y-6 max-w-5xl mx-auto" id="settings-content">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">⚙️ {t("title")}</h1>
            <p className="text-gray-600 mt-1">{t("subtitle")}</p>
          </div>

          <button
            onClick={showMessage}
            className="btn-3d px-6 py-3 rounded-xl text-white font-medium flex items-center gap-2"
            style={{ background: "#10b981" }}
          >
            <Save className="w-5 h-5" />
            {t("saveSettings")}
          </button>
        </div>

        {showSavedMessage && (
          <div className="glass rounded-2xl p-4 bg-green-50 border border-green-200 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="text-green-700 font-medium">
              {t("savedSuccess")}
            </span>
          </div>
        )}

        {/* Appearance */}
        <div className="glass rounded-2xl p-6 space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2 text-primary">
            <Palette className="w-5 h-5" />
            {t("appearance.title")}
          </h3>

          <div>
            <label className="block text-sm font-medium mb-3">
              {t("appearance.currentTheme")}:{" "}
              <span className="text-primary font-bold">
                {t(`appearance.themes.${theme}`)}
              </span>
            </label>

            <div className="flex gap-2">
              {themes.map((item) => (
                <button
                  key={item.value}
                  onClick={() => {
                    setTheme(item.value);
                    showMessage();
                  }}
                  className={`w-12 h-12 bg-gradient-to-br ${
                    item.gradient
                  } rounded-lg transition-all ${
                    theme === item.value
                      ? "ring-2 ring-primary scale-110"
                      : "hover:scale-105"
                  }`}
                  title={t(`appearance.themes.${item.value}`)}
                >
                  {theme === item.value && (
                    <CheckCircle2 className="w-4 h-4 text-white mx-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t("appearance.currentFontSize")}:{" "}
              <span className="text-primary font-bold">
                {currentFontSizeLabel}
              </span>
            </label>

            <div className="flex gap-2">
              {fontSizes.map((size) => (
                <button
                  key={size.value}
                  onClick={() => {
                    setFontSize(size.value);
                    showMessage();
                  }}
                  className={`flex-1 px-4 py-2 rounded-xl border-2 transition-all ${
                    fontSize === size.value
                      ? "border-primary bg-blue-50 text-primary"
                      : "border-border bg-white hover:border-primary"
                  } ${size.size}`}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="glass rounded-2xl p-6 space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2 text-primary">
            <Shield className="w-5 h-5" />
            {t("security.title")}
          </h3>

          <div>
            <label className="block text-sm font-medium mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              {t("security.autoLockCurrent", {
                minutes: autoLockMinutes,
              })}
            </label>

            <div className="flex gap-2 flex-wrap">
              {[1, 5, 15, 30, 60].map((min) => (
                <button
                  key={min}
                  onClick={() => {
                    setAutoLockMinutes(min);
                    showMessage();
                  }}
                  className={`px-4 py-2 rounded-xl border-2 transition-all text-sm ${
                    autoLockMinutes === min
                      ? "border-primary bg-blue-50 text-primary"
                      : "border-border bg-white hover:border-primary"
                  }`}
                >
                  {min < 60
                    ? t("security.minutes", { minutes: min })
                    : t("security.hour")}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t("security.sessionTimeout")}:{" "}
              <span className="text-primary font-bold">{sessionTimeout}</span>
            </label>

            <input
              type="number"
              value={sessionTimeout}
              onChange={(e) => {
                setSessionTimeout(parseInt(e.target.value));
                showMessage();
              }}
              min={5}
              max={120}
              className="w-32 px-3 py-2 rounded-lg border border-border"
            />
          </div>

          <ToggleRow
            icon={<Lock className="w-4 h-4" />}
            label={t("security.encryptionTitle")}
            description={t("security.encryptionDescription")}
            enabled={true}
            onChange={() => {}}
            disabled={true}
          />

          <button
            onClick={() => setPwOpen(true)}
            className="w-full px-4 py-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center justify-center gap-2 font-medium text-sm"
          >
            <Key className="w-4 h-4" />
            {t("security.changeMainPassword")}
          </button>
        </div>

        {/* Backup */}
        <div className="glass rounded-2xl p-6 space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2 text-primary">
            <Database className="w-5 h-5" />
            {t("backup.title")}
          </h3>

          <div>
            <label className="block text-sm font-medium mb-2">
              <HardDrive className="w-4 h-4 inline mr-1" />
              {t("backup.frequencyCurrent")}:{" "}
              <span className="text-primary font-bold">
                {currentBackupFrequencyLabel}
              </span>
            </label>

            <div className="flex gap-2">
              {backupFrequencies.map((freq) => (
                <button
                  key={freq.value}
                  onClick={() => {
                    setBackupFrequency(freq.value);
                    showMessage();
                  }}
                  className={`flex-1 px-3 py-2 rounded-xl border-2 transition-all text-sm ${
                    backupFrequency === freq.value
                      ? "border-primary bg-blue-50 text-primary"
                      : "border-border bg-white hover:border-primary"
                  }`}
                >
                  {freq.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              {t("backup.formatCurrent")}:{" "}
              <span className="text-primary font-bold">
                {exportFormat.toUpperCase()}
              </span>
            </label>

            <div className="grid grid-cols-3 gap-2">
              {exportFormats.map((fmt) => (
                <button
                  key={fmt.value}
                  onClick={() => {
                    setExportFormat(fmt.value);
                    showMessage();
                  }}
                  className={`p-3 rounded-xl border-2 transition-all text-right ${
                    exportFormat === fmt.value
                      ? "border-primary bg-blue-50"
                      : "border-border bg-white hover:border-primary"
                  }`}
                >
                  <div className="font-medium text-sm">{fmt.label}</div>
                  <div className="text-xs text-gray-500">{fmt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <ToggleRow
            icon={<Zap className="w-4 h-4" />}
            label={t("backup.autoUpdate")}
            description={t("backup.autoUpdateDescription")}
            enabled={autoUpdate}
            onChange={(v) => {
              setAutoUpdate(v);
              showMessage();
            }}
          />

          <div className="grid grid-cols-3 gap-2 bg-white rounded-xl p-3">
            <StatItem
              label={t("backup.stats.accounts")}
              value={accounts.length}
              icon="🔑"
            />

            <StatItem
              label={t("backup.stats.subscriptions")}
              value={subscriptions.length}
              icon="👑"
            />

            <StatItem
              label={t("backup.stats.cards")}
              value={cards.length}
              icon="💳"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleExport}
              className="px-4 py-3 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              {t("backup.exportButton", {
                format: exportFormat.toUpperCase(),
              })}
            </button>

            <button className="px-4 py-3 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 transition-colors flex items-center justify-center gap-2 text-sm font-medium">
              <Upload className="w-4 h-4" />
              {t("backup.importData")}
            </button>
          </div>
        </div>

        {/* Advanced */}
        <div className="glass rounded-2xl p-6 space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2 text-primary">
            <Sparkles className="w-5 h-5" />
            {t("advanced.title")}
          </h3>

          <ToggleRow
            icon={<Volume2 className="w-4 h-4" />}
            label={t("advanced.systemSounds")}
            description={t("advanced.systemSoundsDescription")}
            enabled={soundEnabled}
            onChange={(v) => {
              setSoundEnabled(v);
              showMessage();
            }}
          />
        </div>

        {/* System Info */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-xl font-bold flex items-center gap-2 text-primary mb-4">
            <Server className="w-5 h-5" />
            {t("system.title")}
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SystemInfo label={t("system.version")} value="v2.0.0" />
            <SystemInfo label={t("system.releaseDate")} value="2026" />
            <SystemInfo label={t("system.totalItems")} value={totalData.toString()} />
            <SystemInfo label={t("system.dataSize")} value="~1.2 MB" />
            <SystemInfo label={t("system.encryption")} value="AES-256" />
            <SystemInfo label={t("system.storage")} value={t("system.local")} />
            <SystemInfo label={t("system.lastUpdate")} value={t("system.now")} />
            <SystemInfo label={t("system.status")} value={t("system.active")} />
          </div>
        </div>

        {/* Danger Zone */}
        <div className="glass rounded-2xl p-6 border-2 border-red-200 bg-red-50/50">
          <h3 className="text-xl font-bold flex items-center gap-2 text-red-600 mb-4">
            <AlertTriangle className="w-5 h-5" />
            {t("danger.title")}
          </h3>

          <p className="text-sm text-gray-600 mb-4">
            {t("danger.description")}
          </p>

          <div className="space-y-2">
            <button
  onClick={resetFirstSetup}
  className="w-full px-4 py-3 rounded-xl bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
>
  <RotateCcw className="w-4 h-4" />
  إعادة إعداد معلومات المستخدم الأول
</button>
            <button
              onClick={() => {
                if (confirm(t("danger.confirmDeleteAll"))) {
                  void confirmWithPassword(() => {
                    wipeVaultData();
                    localStorage.removeItem("bader-settings-custom");
                    localStorage.removeItem("bader-settings-extras");
                    window.location.reload();
                  });
                }
              }}
              className="w-full px-4 py-3 rounded-xl bg-red-100 text-red-700 hover:bg-red-200 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
            >
              <Trash2 className="w-4 h-4" />
              {t("danger.deleteAll")}
            </button>

            <button
              onClick={() => {
                if (confirm(t("danger.confirmRestore"))) {
                  void confirmWithPassword(() => {
                    wipeVaultData();
                    localStorage.removeItem("bader-settings-custom");
                    localStorage.removeItem("bader-settings-extras");
                    window.location.reload();
                  });
                }
              }}
              className="w-full px-4 py-3 rounded-xl bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
            >
              <RotateCcw className="w-4 h-4" />
              {t("danger.restoreDefaults")}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="glass rounded-2xl p-5 text-xs text-gray-500 text-center">
          <strong className="text-primary">Bader Account Management</strong>{" "}
          v2.0.0
          <br />© 2026 baderinfo.com - {t("footer.rights")}
        </div>
      </div>
    </AppLayout>
  );
}

function ToggleRow({
  icon,
  label,
  description,
  enabled,
  onChange,
  disabled = false,
}: {
  icon: ReactNode;
  label: string;
  description: string;
  enabled: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${
        disabled ? "bg-gray-50 border-gray-200" : "bg-white border-border"
      }`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
            disabled ? "bg-gray-200 text-gray-500" : "bg-blue-50 text-primary"
          }`}
        >
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">{label}</div>
          <div className="text-xs text-gray-500 truncate">{description}</div>
        </div>
      </div>

      <button
        onClick={() => !disabled && onChange(!enabled)}
        disabled={disabled}
        className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
          enabled ? "bg-primary" : disabled ? "bg-gray-300" : "bg-gray-300"
        } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
      >
        <div
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            enabled ? "translate-x-6" : "translate-x-0"
          }`}
        ></div>
      </button>
    </div>
  );
}

function StatItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: string;
}) {
  return (
    <div className="text-center">
      <div className="text-xl mb-1">{icon}</div>
      <div className="text-base font-bold">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

function SystemInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white rounded-xl p-2 text-center">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="font-bold text-xs text-primary">{value}</div>
    </div>
  );
}