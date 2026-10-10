"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Shield,
  Key,
  Check,
  Crown,
  Building,
  User,
  Cpu,
  Loader2,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default function LicensePage() {
  const router = useRouter();
  const t = useTranslations();
  const [licenseKey, setLicenseKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [selectedType, setSelectedType] = useState("professional");
  const [step, setStep] = useState<"choose" | "activate" | "success">("choose");
  const [activation, setActivation] = useState<any>(null);
  const [currentLocale, setCurrentLocale] = useState("ar");

  useEffect(() => {
    const path = window.location.pathname;
    const locale = path.split("/")[1] || "ar";
    setCurrentLocale(locale);

    let id = localStorage.getItem("bader-device-id");
    if (!id) {
      id = `DEV-${Date.now().toString(36).toUpperCase()}-${Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase()}`;
      localStorage.setItem("bader-device-id", id);
    }
    setDeviceId(id);

    const savedLicense = localStorage.getItem("bader-license");
    if (savedLicense) {
      try {
        const parsed = JSON.parse(savedLicense);
        setActivation(parsed);
        setStep("success");
      } catch {}
    }
  }, []);

  const LICENSE_TYPES = [
    {
      id: "personal",
      name: t("license.personal"),
      icon: User,
      color: "from-blue-500 to-cyan-500",
      devices: "1",
      price: "49$",
      features: [
        t("license.features.device1"),
        t("license.features.basicFeatures"),
        t("license.features.updates1y"),
        t("license.features.emailSupport"),
      ],
    },
    {
      id: "professional",
      name: t("license.professional"),
      icon: Crown,
      color: "from-purple-500 to-pink-500",
      devices: "3",
      price: "129$",
      features: [
        t("license.features.device3"),
        t("license.features.allFeatures"),
        t("license.features.lifetimeUpdates"),
        t("license.features.prioritySupport"),
        t("license.features.cloudSync"),
      ],
      popular: true,
    },
    {
      id: "enterprise",
      name: t("license.enterprise"),
      icon: Building,
      color: "from-orange-500 to-red-500",
      devices: t("license.unlimited"),
      price: t("license.contactUs"),
      features: [
        t("license.features.unlimitedDevices"),
        t("license.features.allFeatures"),
        t("license.features.customization"),
        t("license.features.dedicatedSupport"),
        t("license.features.teamTraining"),
        t("license.features.customAPI"),
      ],
    },
  ];

  const handleActivate = async () => {
    if (!licenseKey.trim()) {
      setError(t("license.errors.emptyKey"));
      return;
    }
    if (licenseKey.length < 10) {
      setError(t("license.errors.invalidKey"));
      return;
    }

    setLoading(true);
    setError("");

    await new Promise((resolve) => setTimeout(resolve, 2000));

    if (licenseKey.startsWith("BADER-") && licenseKey.length >= 20) {
      const activationData = {
        key: licenseKey,
        type: selectedType,
        deviceId,
        activatedAt: new Date().toISOString(),
        expiresAt: new Date(
          Date.now() + 365 * 24 * 60 * 60 * 1000
        ).toISOString(),
        status: "active",
      };
      localStorage.setItem("bader-license", JSON.stringify(activationData));
      setActivation(activationData);
      setStep("success");
    } else {
      setError(t("license.errors.invalidFormat"));
    }
    setLoading(false);
  };

  const handleContinue = () => {
    router.push(`/${currentLocale}/dashboard`);
  };

  const handleDeactivate = () => {
    if (confirm(t("license.confirmDeactivate"))) {
      localStorage.removeItem("bader-license");
      setStep("choose");
    }
  };

  const switchLanguage = (lang: string) => {
    router.push(`/${lang}/license`);
  };

  // مكون لعرض العنوان بشكل صحيح (بدون انعكاس)
  const BilingualTitle = ({ ar, en }: { ar: string; en: string }) => (
    <h1 className="text-4xl font-bold mb-2">
      {currentLocale === "ar" ? (
        <>
          <span dir="ltr" className="inline-block">
            {en}
          </span>{" "}
          {ar}
        </>
      ) : (
        <>{en}</>
      )}
    </h1>
  );

  return (
    <div className="min-h-screen animated-bg p-4 md:p-8">
      {/* Language Switcher */}
      <div className="absolute top-4 left-4 z-10">
        <div className="glass rounded-full p-1.5 flex gap-1 shadow-xl">
          {[
            { code: "fr", label: "Français" },
            { code: "en", label: "English" },
            { code: "ar", label: "العربية" },
          ].map((lang) => (
            <button
              key={lang.code}
              onClick={() => switchLanguage(lang.code)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                currentLocale === lang.code
                  ? "text-white"
                  : "hover:bg-white/50"
              }`}
              style={
                currentLocale === lang.code
                  ? { backgroundColor: "rgb(var(--color-primary))" }
                  : {}
              }
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto pt-16">
        {step === "choose" && (
          <div className="space-y-8">
            <div className="text-center">
              <div
                className="inline-flex p-5 rounded-3xl mb-4 shadow-2xl"
                style={{
                  background:
                    "linear-gradient(135deg, rgb(var(--color-primary)), rgb(var(--color-primary) / 0.6))",
                }}
              >
                <Shield className="w-12 h-12 text-white" />
              </div>

              <BilingualTitle
                ar={t("license.titleAr")}
                en={t("license.titleEn")}
              />

              <p className="text-gray-600">{t("license.subtitle")}</p>
            </div>

            {/* License Types */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {LICENSE_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <div
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`glass rounded-2xl p-6 cursor-pointer transition-all relative card-hover ${
                      selectedType === type.id
                        ? "ring-2 ring-primary scale-105"
                        : ""
                    }`}
                  >
                    {type.popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-white text-xs font-bold whitespace-nowrap">
                        <span dir="ltr" className="inline-block">
                          ⭐ {t("license.mostPopular")}
                        </span>
                      </span>
                    )}

                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${type.color} flex items-center justify-center mb-4 shadow-lg`}
                    >
                      <Icon className="w-7 h-7 text-white" />
                    </div>

                    <h3 className="text-2xl font-bold mb-1">{type.name}</h3>
                    <div className="text-3xl font-bold text-primary mb-1">
                      <span dir="ltr" className="inline-block">
                        {type.price}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mb-4">
                      <span dir="ltr" className="inline-block">
                        {type.devices}
                      </span>{" "}
                      {type.id !== "enterprise" && t("license.devicesCount")}
                    </div>

                    <ul className="space-y-2 text-sm">
                      {type.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {selectedType === type.id && (
                      <div className="absolute top-4 right-4">
                        <Check className="w-6 h-6 text-primary" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* How it works */}
            <div className="glass rounded-2xl p-6 mt-8">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                {t("license.howItWorks")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  {
                    icon: Building,
                    title: t("license.steps.1.title"),
                    desc: t("license.steps.1.desc"),
                  },
                  {
                    icon: Key,
                    title: t("license.steps.2.title"),
                    desc: t("license.steps.2.desc"),
                  },
                  {
                    icon: Shield,
                    title: t("license.steps.3.title"),
                    desc: t("license.steps.3.desc"),
                  },
                  {
                    icon: Check,
                    title: t("license.steps.4.title"),
                    desc: t("license.steps.4.desc"),
                  },
                ].map((step, idx) => {
                  const Icon = step.icon;
                  return (
                    <div key={idx} className="text-center">
                      <div
                        className="w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center text-white"
                        style={{
                          background:
                            "linear-gradient(135deg, rgb(var(--color-primary)), rgb(var(--color-primary) / 0.6))",
                        }}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="font-bold text-sm mb-1">
                        {idx + 1}. {step.title}
                      </div>
                      <div className="text-xs text-gray-600">{step.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Activate Button */}
            <div className="text-center">
              <button
                onClick={() => setStep("activate")}
                className="btn-3d px-8 py-4 rounded-2xl text-white font-bold text-lg inline-flex items-center gap-2"
                style={{ background: "rgb(var(--color-primary))" }}
              >
                <Key className="w-5 h-5" />
                {t("license.haveKey")}
              </button>

              <p className="text-sm text-gray-600 mt-4">
                {t("license.noKey")}{" "}
                <a
                  href="https://baderinfo.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary font-medium hover:underline"
                >
                  {t("license.buyFrom")}{" "}
                  <span dir="ltr" className="inline-block">
                    baderinfo.com
                  </span>
                </a>
              </p>
            </div>

            {/* Device ID */}
            <div className="glass rounded-2xl p-4 max-w-md mx-auto">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Cpu className="w-4 h-4" />
                <span>{t("license.deviceId")}:</span>
                <code
                  dir="ltr"
                  className="px-2 py-0.5 bg-white rounded font-mono text-xs"
                >
                  {deviceId}
                </code>
              </div>
            </div>
          </div>
        )}

        {step === "activate" && (
          <div className="max-w-md mx-auto space-y-6">
            <button
              onClick={() => setStep("choose")}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              ← {t("license.back")}
            </button>

            <div className="glass rounded-2xl p-8">
              <div
                className="inline-flex p-4 rounded-2xl mb-4"
                style={{
                  background:
                    "linear-gradient(135deg, rgb(var(--color-primary)), rgb(var(--color-primary) / 0.6))",
                }}
              >
                <Key className="w-8 h-8 text-white" />
              </div>

              <h2 className="text-2xl font-bold mb-2">
                {t("license.enterKey")}
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                {t("license.keyHint")}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t("license.key")}
                  </label>
                  <input
                    type="text"
                    value={licenseKey}
                    onChange={(e) => {
                      setLicenseKey(e.target.value.toUpperCase());
                      setError("");
                    }}
                    placeholder="BADER-XXXX-XXXX-XXXX-XXXX"
                    className="w-full px-4 py-3 rounded-xl bg-white border-2 border-border focus:outline-none focus:border-primary font-mono"
                    dir="ltr"
                  />
                  {error && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleActivate}
                  disabled={loading}
                  className="w-full btn-3d py-3 rounded-xl text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: "rgb(var(--color-primary))" }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t("license.activating")}
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      {t("license.activate")}
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="glass rounded-2xl p-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Cpu className="w-4 h-4" />
                <span>{t("license.deviceId")}:</span>
                <code
                  dir="ltr"
                  className="px-2 py-0.5 bg-white rounded font-mono text-xs"
                >
                  {deviceId}
                </code>
              </div>
            </div>
          </div>
        )}

        {step === "success" && activation && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="glass rounded-2xl p-8 text-center">
              <div
                className="inline-flex p-5 rounded-3xl mb-4 shadow-2xl"
                style={{
                  background: "linear-gradient(135deg, #10b981, #059669)",
                }}
              >
                <Check className="w-12 h-12 text-white" />
              </div>

              <h1 className="text-3xl font-bold mb-2">
                {t("license.successTitle")}
              </h1>
              <p className="text-gray-600 mb-6">{t("license.welcomeMsg")}</p>

              <div className="bg-white rounded-xl p-4 text-right space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {t("license.type")}
                  </span>
                  <span className="font-bold">
                    {
                      LICENSE_TYPES.find((t) => t.id === activation.type)
                        ?.name
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {t("license.activatedAt")}
                  </span>
                  <span dir="ltr" className="inline-block">
                    {new Date(activation.activatedAt).toLocaleDateString(
                      currentLocale === "ar" ? "ar-DZ" : currentLocale
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {t("license.expiresAt")}
                  </span>
                  <span
                    dir="ltr"
                    className="inline-block text-primary font-bold"
                  >
                    {new Date(activation.expiresAt).toLocaleDateString(
                      currentLocale === "ar" ? "ar-DZ" : currentLocale
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {t("license.status")}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                    {t("license.active")}
                  </span>
                </div>
              </div>

              <button
                onClick={handleContinue}
                className="mt-6 btn-3d px-8 py-3 rounded-xl text-white font-bold inline-flex items-center gap-2"
                style={{ background: "rgb(var(--color-primary))" }}
              >
                <Sparkles className="w-5 h-5" />
                {t("license.enterApp")}
              </button>
            </div>

            <div className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{t("license.key")}:</div>
                  <code
                    dir="ltr"
                    className="text-sm text-gray-600 font-mono"
                  >
                    {activation.key}
                  </code>
                </div>
                <button
                  onClick={handleDeactivate}
                  className="text-red-600 hover:bg-red-50 px-3 py-1 rounded-lg text-sm"
                >
                  {t("license.deactivate")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}