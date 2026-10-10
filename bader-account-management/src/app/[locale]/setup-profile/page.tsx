"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useStore } from "@/store/useStore";
import { useRequireUnlock } from "@/lib/session";
import {
  User,
  Mail,
  Phone,
  Globe,
  Save,
  ShieldCheck,
  Sparkles,
  Building2,
  Languages,
} from "lucide-react";

const FIRST_SETUP_KEY = "bader-first-setup-completed-v1";
const SETUP_DRAFT_KEY = "bader-setup-profile-draft-v1";

export default function SetupProfilePage() {
  const t = useTranslations("setupProfile");
  const unlocked = useRequireUnlock();

  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "ar";

  const myInfo = useStore((state: any) => state.myInfo) || {};
  const updateMyInfo = useStore((state: any) => state.updateMyInfo);

  const [formData, setFormData] = useState({
    firstName: myInfo?.firstName || "",
    lastName: myInfo?.lastName || "",
    username: myInfo?.username || "",
    email: myInfo?.emails?.[0]?.email || "",
    phone: myInfo?.phones?.[0]?.number || "",
    nationality: myInfo?.nationality || "",
    role: myInfo?.role || t("defaults.role"),
    companyName: myInfo?.companyName || "",
  });

  const [error, setError] = useState("");

  const languages = [
    { code: "ar", label: "العربية", short: "AR", flag: "🇸🇦" },
    { code: "en", label: "English", short: "EN", flag: "🇬🇧" },
    { code: "fr", label: "Français", short: "FR", flag: "🇫🇷" },
  ];

  useEffect(() => {
    const setupDone = localStorage.getItem(FIRST_SETUP_KEY) === "true";

    if (setupDone) {
      router.replace(`/${locale}/dashboard`);
      return;
    }

    const draft = sessionStorage.getItem(SETUP_DRAFT_KEY);

    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setFormData((prev) => ({
          ...prev,
          ...parsed,
        }));
      } catch {
        sessionStorage.removeItem(SETUP_DRAFT_KEY);
      }
    }
  }, [locale, router]);

  const switchLanguage = (nextLocale: string) => {
    sessionStorage.setItem(SETUP_DRAFT_KEY, JSON.stringify(formData));
    router.replace(`/${nextLocale}/setup-profile`);
  };

  const handleSave = () => {
    if (!formData.firstName.trim()) {
      setError(t("validation.firstNameRequired"));
      return;
    }

    if (!formData.lastName.trim()) {
      setError(t("validation.lastNameRequired"));
      return;
    }

    if (!formData.username.trim()) {
      setError(t("validation.usernameRequired"));
      return;
    }

    const updatedInfo = {
      ...myInfo,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      username: formData.username.trim(),
      nationality: formData.nationality.trim(),
      role: formData.role.trim(),
      companyName: formData.companyName.trim(),
      emails: formData.email.trim()
        ? [
            {
              id: Date.now().toString(),
              email: formData.email.trim(),
              password: "",
            },
          ]
        : myInfo?.emails || [],
      phones: formData.phone.trim()
        ? [
            {
              id: Date.now().toString(),
              number: formData.phone.trim(),
            },
          ]
        : myInfo?.phones || [],
    };

    updateMyInfo(updatedInfo);

    localStorage.setItem(FIRST_SETUP_KEY, "true");
    sessionStorage.removeItem(SETUP_DRAFT_KEY);

    router.replace(`/${locale}/dashboard`);
  };

  if (!unlocked) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="w-full max-w-5xl">
        <div className="glass rounded-3xl overflow-hidden shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr]">
            {/* Side */}
            <div
              className="p-8 text-white relative overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, rgb(var(--color-primary)), rgb(var(--color-primary) / 0.65))",
              }}
            >
              <div className="absolute -top-16 -left-16 w-44 h-44 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-20 -right-20 w-56 h-56 rounded-full bg-white/10 blur-2xl" />

              <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur flex items-center justify-center mb-6">
                  <ShieldCheck className="w-10 h-10" />
                </div>

                <h1 className="text-3xl font-bold mb-3">
                  {t("side.title")}
                </h1>

                <p className="text-white/80 leading-8 text-sm">
                  {t("side.description")}
                </p>

                <div className="mt-8 space-y-4">
                  <FeatureItem text={t("side.features.user")} />
                  <FeatureItem text={t("side.features.contact")} />
                  <FeatureItem text={t("side.features.ready")} />
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="p-8 bg-white/70">
              <div className="flex justify-end mb-5">
                <LanguageSwitcher
                  locale={locale}
                  languages={languages}
                  onSwitch={switchLanguage}
                />
              </div>

              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-primary text-sm mb-3">
                  <Sparkles className="w-4 h-4" />
                  {t("badge")}
                </div>

                <h2 className="text-2xl font-bold">
                  {t("formTitle")}
                </h2>

                <p className="text-gray-500 text-sm mt-1">
                  {t("formDescription")}
                </p>
              </div>

              {error && (
                <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label={t("fields.firstName")}
                    required
                    icon={<User className="w-4 h-4" />}
                    value={formData.firstName}
                    onChange={(value) =>
                      setFormData({ ...formData, firstName: value })
                    }
                    placeholder={t("placeholders.firstName")}
                  />

                  <InputField
                    label={t("fields.lastName")}
                    required
                    icon={<User className="w-4 h-4" />}
                    value={formData.lastName}
                    onChange={(value) =>
                      setFormData({ ...formData, lastName: value })
                    }
                    placeholder={t("placeholders.lastName")}
                  />
                </div>

                <InputField
                  label={t("fields.username")}
                  required
                  icon={<User className="w-4 h-4" />}
                  value={formData.username}
                  onChange={(value) =>
                    setFormData({ ...formData, username: value })
                  }
                  placeholder={t("placeholders.username")}
                  dir="ltr"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label={t("fields.email")}
                    icon={<Mail className="w-4 h-4" />}
                    value={formData.email}
                    onChange={(value) =>
                      setFormData({ ...formData, email: value })
                    }
                    placeholder="email@example.com"
                    dir="ltr"
                    type="email"
                  />

                  <InputField
                    label={t("fields.phone")}
                    icon={<Phone className="w-4 h-4" />}
                    value={formData.phone}
                    onChange={(value) =>
                      setFormData({ ...formData, phone: value })
                    }
                    placeholder="+213 XXX XXX XXX"
                    dir="ltr"
                    type="tel"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label={t("fields.nationality")}
                    icon={<Globe className="w-4 h-4" />}
                    value={formData.nationality}
                    onChange={(value) =>
                      setFormData({ ...formData, nationality: value })
                    }
                    placeholder={t("placeholders.nationality")}
                  />

                  <InputField
                    label={t("fields.role")}
                    icon={<ShieldCheck className="w-4 h-4" />}
                    value={formData.role}
                    onChange={(value) =>
                      setFormData({ ...formData, role: value })
                    }
                    placeholder={t("placeholders.role")}
                  />
                </div>

                <InputField
                  label={t("fields.companyName")}
                  icon={<Building2 className="w-4 h-4" />}
                  value={formData.companyName}
                  onChange={(value) =>
                    setFormData({ ...formData, companyName: value })
                  }
                  placeholder={t("placeholders.companyName")}
                />

                <button
                  onClick={handleSave}
                  className="w-full btn-3d py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2"
                  style={{ background: "rgb(var(--color-primary))" }}
                >
                  <Save className="w-5 h-5" />
                  {t("saveButton")}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  {t("footerNote")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  icon,
  required = false,
  dir,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  required?: boolean;
  dir?: "ltr" | "rtl";
  type?: string;
}) {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium mb-2">
        {icon}
        <span>
          {label} {required && <span className="text-red-500">*</span>}
        </span>
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        dir={dir}
        className="w-full px-4 py-2.5 rounded-xl bg-white border border-border focus:outline-none focus:border-primary"
      />
    </div>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-white/90">
      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
        ✓
      </div>
      <span>{text}</span>
    </div>
  );
}

function LanguageSwitcher({
  locale,
  languages,
  onSwitch,
}: {
  locale: string;
  languages: {
    code: string;
    label: string;
    short: string;
    flag: string;
  }[];
  onSwitch: (code: string) => void;
}) {

  return (
    <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur rounded-2xl border border-border p-2 shadow-sm">
      <Languages className="w-4 h-4 text-primary" />

      {languages.map((lang) => {
        const active = locale === lang.code;

        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => onSwitch(lang.code)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              active
                ? "text-white shadow-md"
                : "bg-gray-50 text-gray-700 hover:bg-gray-100"
            }`}
            style={
              active
                ? { background: "rgb(var(--color-primary))" }
                : {}
            }
            title={lang.label}
          >
            <span>{lang.flag}</span>
            <span>{lang.short}</span>
          </button>
        );
      })}
    </div>
  );
}