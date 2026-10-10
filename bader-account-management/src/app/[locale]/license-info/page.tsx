"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import AppLayout from "@/components/layout/AppLayout";
import { copyToClipboard } from "@/lib/utils";
import { branding } from "@/config/branding";
import { useStore } from "@/store/useStore";
import {
  ShieldCheck,
  ShieldAlert,
  Copy,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Clock,
  KeyRound,
  User,
  Monitor,
  BadgeCheck,
  ExternalLink,
  RefreshCw,
  Info,
} from "lucide-react";

const LICENSE_STORAGE_KEY = "bader-license-info-v1";
const DEVICE_ID_KEY = "bader-device-id-v1";

type LicenseStatus = "active" | "inactive" | "expired";

type LicenseInfo = {
  status: LicenseStatus;
  licenseType: string;
  ownerName: string;
  deviceId: string;
  activatedAt: string;
  expiresAt: string;
  version: string;
};

function createDeviceId() {
  if (typeof window === "undefined") return "";

  const existing = localStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;

  let random = "";

  if (window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    random = Array.from(array)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
  } else {
    random = Math.random().toString(36).slice(2).toUpperCase();
  }

  const deviceId = `BDR-${random.slice(0, 4)}-${random.slice(
    4,
    8
  )}-${random.slice(8, 12)}-${random.slice(12, 16)}`;

  localStorage.setItem(DEVICE_ID_KEY, deviceId);

  return deviceId;
}

function readLicenseInfo(deviceId: string): LicenseInfo {
  if (typeof window === "undefined") {
    return {
      status: "inactive",
      licenseType: "",
      ownerName: "",
      deviceId,
      activatedAt: "",
      expiresAt: "",
      version: branding.version,
    };
  }

  const raw = localStorage.getItem(LICENSE_STORAGE_KEY);

  if (!raw) {
    return {
      status: "inactive",
      licenseType: "",
      ownerName: "",
      deviceId,
      activatedAt: "",
      expiresAt: "",
      version: branding.version,
    };
  }

  try {
    const parsed = JSON.parse(raw);

    return {
      status: parsed.status || "inactive",
      licenseType: parsed.licenseType || "",
      ownerName: parsed.ownerName || "",
      deviceId: parsed.deviceId || deviceId,
      activatedAt: parsed.activatedAt || "",
      expiresAt: parsed.expiresAt || "",
      version: parsed.version || branding.version,
    };
  } catch {
    return {
      status: "inactive",
      licenseType: "",
      ownerName: "",
      deviceId,
      activatedAt: "",
      expiresAt: "",
      version: branding.version,
    };
  }
}

export default function LicenseInfoPage() {
  const t = useTranslations("licenseInfo");
  const params = useParams();
  const locale = (params?.locale as string) || "ar";

  const myInfo = useStore((state: any) => state.myInfo) || {};

  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [copied, setCopied] = useState(false);

  const dateLocale =
    locale === "ar" ? "ar-DZ" : locale === "fr" ? "fr-FR" : "en-US";

  useEffect(() => {
    const deviceId = createDeviceId();
    const info = readLicenseInfo(deviceId);

    if (!info.ownerName && (myInfo?.firstName || myInfo?.lastName)) {
      info.ownerName = `${myInfo?.firstName || ""} ${
        myInfo?.lastName || ""
      }`.trim();
    }

    setLicense(info);
  }, [myInfo]);

  const computedStatus: LicenseStatus = useMemo(() => {
    if (!license) return "inactive";

    if (license.status !== "active") return license.status;

    if (!license.expiresAt) return "active";

    const expiryTime = new Date(license.expiresAt).getTime();

    if (!Number.isNaN(expiryTime) && expiryTime < Date.now()) {
      return "expired";
    }

    return "active";
  }, [license]);

  const statusConfig = useMemo(() => {
    if (computedStatus === "active") {
      return {
        label: t("status.active"),
        description: t("statusDescriptions.active"),
        icon: <ShieldCheck className="w-8 h-8" />,
        className: "bg-green-50 text-green-700 border-green-200",
        badgeClass: "bg-green-100 text-green-700",
      };
    }

    if (computedStatus === "expired") {
      return {
        label: t("status.expired"),
        description: t("statusDescriptions.expired"),
        icon: <ShieldAlert className="w-8 h-8" />,
        className: "bg-red-50 text-red-700 border-red-200",
        badgeClass: "bg-red-100 text-red-700",
      };
    }

    return {
      label: t("status.inactive"),
      description: t("statusDescriptions.inactive"),
      icon: <XCircle className="w-8 h-8" />,
      className: "bg-orange-50 text-orange-700 border-orange-200",
      badgeClass: "bg-orange-100 text-orange-700",
    };
  }, [computedStatus, t]);

  const formatDate = (value: string) => {
    if (!value) return t("notAvailable");

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return t("notAvailable");
    }

    return date.toLocaleDateString(dateLocale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleCopyDeviceId = async () => {
    if (!license?.deviceId) return;

    const ok = await copyToClipboard(license.deviceId);

    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const goToActivation = () => {
    window.location.href = `/${locale}/bader-license/activation.html`;
  };

  const reloadLicense = () => {
    const deviceId = createDeviceId();
    const info = readLicenseInfo(deviceId);
    setLicense(info);
  };

  if (!license) {
    return (
      <AppLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-500 text-sm">{t("loading")}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="glass rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute -top-20 -left-20 w-52 h-52 bg-blue-400/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-52 h-52 bg-primary/20 rounded-full blur-3xl" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-border text-sm text-gray-600 mb-4">
                <BadgeCheck className="w-4 h-4 text-primary" />
                {t("badge")}
              </div>

              <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>

              <p className="text-gray-600 leading-7 max-w-2xl">
                {t("subtitle")}
              </p>
            </div>

            <div
              className={`rounded-3xl border p-5 min-w-[230px] ${statusConfig.className}`}
            >
              <div className="flex items-center gap-3">
                <div>{statusConfig.icon}</div>

                <div>
                  <div className="text-sm opacity-80">
                    {t("licenseStatus")}
                  </div>
                  <div className="text-2xl font-bold">
                    {statusConfig.label}
                  </div>
                </div>
              </div>

              <p className="text-sm mt-3 leading-6">
                {statusConfig.description}
              </p>
            </div>
          </div>
        </div>

        {/* Main Info */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_330px] gap-6">
          <div className="space-y-6">
            <div className="glass rounded-3xl p-6">
              <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-primary" />
                {t("detailsTitle")}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoCard
                  icon={<ShieldCheck className="w-5 h-5" />}
                  label={t("fields.status")}
                  value={statusConfig.label}
                  badgeClass={statusConfig.badgeClass}
                />

                <InfoCard
                  icon={<BadgeCheck className="w-5 h-5" />}
                  label={t("fields.licenseType")}
                  value={license.licenseType || t("notAvailable")}
                />

                <InfoCard
                  icon={<User className="w-5 h-5" />}
                  label={t("fields.ownerName")}
                  value={license.ownerName || t("notAvailable")}
                />

                <InfoCard
                  icon={<Monitor className="w-5 h-5" />}
                  label={t("fields.deviceId")}
                  value={license.deviceId}
                  mono
                />

                <InfoCard
                  icon={<CalendarDays className="w-5 h-5" />}
                  label={t("fields.activatedAt")}
                  value={formatDate(license.activatedAt)}
                />

                <InfoCard
                  icon={<Clock className="w-5 h-5" />}
                  label={t("fields.expiresAt")}
                  value={formatDate(license.expiresAt)}
                />

                <InfoCard
                  icon={<Info className="w-5 h-5" />}
                  label={t("fields.version")}
                  value={license.version || branding.version}
                />
              </div>
            </div>

            <div className="glass rounded-3xl p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                {t("whyTitle")}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <ReasonItem text={t("reasons.status")} />
                <ReasonItem text={t("reasons.expiry")} />
                <ReasonItem text={t("reasons.device")} />
                <ReasonItem text={t("reasons.support")} />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <div className="glass rounded-3xl p-6">
              <h3 className="font-bold mb-4">{t("actionsTitle")}</h3>

              <div className="space-y-3">
                <button
                  onClick={handleCopyDeviceId}
                  className="w-full px-4 py-3 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                >
                  {copied ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  {copied ? t("copied") : t("copyDeviceId")}
                </button>

                <button
                  onClick={goToActivation}
                  className="w-full px-4 py-3 rounded-xl text-white transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  style={{ background: "rgb(var(--color-primary))" }}
                >
                  <ExternalLink className="w-4 h-4" />
                  {computedStatus === "active"
                    ? t("manageActivation")
                    : t("goToActivation")}
                </button>

                <button
                  onClick={reloadLicense}
                  className="w-full px-4 py-3 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <RefreshCw className="w-4 h-4" />
                  {t("refresh")}
                </button>
              </div>
            </div>

            <div className="glass rounded-3xl p-6">
              <h3 className="font-bold mb-3">{t("deviceTitle")}</h3>

              <p className="text-sm text-gray-600 leading-7 mb-3">
                {t("deviceDescription")}
              </p>

              <div className="bg-white border border-border rounded-2xl p-3">
                <div className="text-xs text-gray-500 mb-1">
                  {t("fields.deviceId")}
                </div>
                <div className="font-mono text-xs text-primary break-all">
                  {license.deviceId}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="glass rounded-2xl p-5 text-xs text-gray-500 text-center">
          <strong className="text-primary">Bader Account Management</strong>{" "}
          {branding.version}
          <br />
          © 2026 baderinfo.com - {t("rights")}
        </div>
      </div>
    </AppLayout>
  );
}

function InfoCard({
  icon,
  label,
  value,
  mono = false,
  badgeClass,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  mono?: boolean;
  badgeClass?: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-border">
      <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
        <span className="text-primary">{icon}</span>
        <span>{label}</span>
      </div>

      <div
        className={`font-bold text-sm break-all ${
          mono ? "font-mono" : ""
        } ${
          badgeClass
            ? `inline-flex px-3 py-1 rounded-full ${badgeClass}`
            : "text-gray-900"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function ReasonItem({ text }: { text: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-border flex items-start gap-2">
      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
      <span className="text-sm text-gray-600 leading-6">{text}</span>
    </div>
  );
}