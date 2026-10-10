"use client";

import { useTranslations } from "next-intl";
import AppLayout from "@/components/layout/AppLayout";
import {
  Mail,
  Globe,
  Heart,
  Sparkles,
  Lock,
  Zap,
  Database,
  FileText,
  CheckCircle2,
  ShieldCheck,
  Star,
  User,
  MessageCircle,
  Info,
  Layers,
} from "lucide-react";

export default function DeveloperPage() {
  const t = useTranslations("developer");

  const appVersion = "v2.0.0";
  const releaseYear = "2026";

  const specifications = [
    {
      title: t("specifications.accounts.title"),
      description: t("specifications.accounts.description"),
      icon: <Lock className="w-5 h-5" />,
    },
    {
      title: t("specifications.subscriptions.title"),
      description: t("specifications.subscriptions.description"),
      icon: <Star className="w-5 h-5" />,
    },
    {
      title: t("specifications.cardsDocuments.title"),
      description: t("specifications.cardsDocuments.description"),
      icon: <FileText className="w-5 h-5" />,
    },
    {
      title: t("specifications.contacts.title"),
      description: t("specifications.contacts.description"),
      icon: <MessageCircle className="w-5 h-5" />,
    },
    {
      title: t("specifications.protection.title"),
      description: t("specifications.protection.description"),
      icon: <ShieldCheck className="w-5 h-5" />,
    },
    {
      title: t("specifications.interface.title"),
      description: t("specifications.interface.description"),
      icon: <Layers className="w-5 h-5" />,
    },
  ];

  const advantages = [
    t("advantages.1"),
    t("advantages.2"),
    t("advantages.3"),
    t("advantages.4"),
    t("advantages.5"),
    t("advantages.6"),
  ];

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Hero */}
        <div className="glass rounded-3xl p-8 overflow-hidden relative">
          <div className="absolute -top-16 -left-16 w-40 h-40 rounded-full bg-blue-400/20 blur-3xl" />
          <div className="absolute -bottom-16 -right-16 w-40 h-40 rounded-full bg-primary/20 blur-3xl" />

          <div className="relative text-center">
            <div
              className="w-28 h-28 rounded-[2rem] mx-auto mb-5 flex items-center justify-center text-white font-bold text-6xl shadow-2xl"
              style={{
                background:
                  "linear-gradient(135deg, rgb(var(--color-primary)), rgb(var(--color-primary) / 0.55))",
              }}
            >
              b
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-border text-sm text-gray-600 mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              {t("hero.badge")}
            </div>

            <h1 className="text-4xl font-bold mb-3">{t("title")}</h1>

            <p className="text-gray-600 leading-7 max-w-2xl mx-auto">
              {t("hero.description")}
            </p>
          </div>
        </div>

        {/* Developer */}
        <div className="glass rounded-3xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-6 items-center">
            <div className="text-center">
              <div className="w-32 h-32 rounded-3xl bg-white border border-border mx-auto flex items-center justify-center shadow-sm">
                <User className="w-14 h-14 text-primary" />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-2">Bader</h2>

              <p className="text-primary font-medium mb-3">
                {t("developer.role")}
              </p>

              <p className="text-gray-600 leading-8 text-sm">
                {t("developer.description")}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
                <a
                  href="https://baderinfo.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 bg-white rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 border border-border"
                >
                  <Globe className="w-5 h-5 text-primary" />
                  <span>{t("contact.officialWebsite")}</span>
                </a>

                <a
                  href="mailto:contact@baderinfo.com"
                  className="p-4 bg-white rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 border border-border"
                >
                  <Mail className="w-5 h-5 text-primary" />
                  <span>{t("contact.email")}</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Program Description */}
        <div className="glass rounded-3xl p-7">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            {t("programDescription.title")}
          </h3>

          <p className="text-gray-600 leading-8 text-sm">
            <strong className="text-primary">
              Bader Account Management
            </strong>{" "}
            {t("programDescription.description")}
          </p>
        </div>

        {/* Specifications */}
        <div className="glass rounded-3xl p-7">
          <h3 className="text-xl font-bold mb-5 flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            {t("specificationsTitle")}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {specifications.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-5 border border-border hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-primary flex items-center justify-center flex-shrink-0">
                    {item.icon}
                  </div>

                  <div>
                    <h4 className="font-bold mb-1">{item.title}</h4>
                    <p className="text-sm text-gray-500 leading-6">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Advantages */}
        <div className="glass rounded-3xl p-7">
          <h3 className="text-xl font-bold mb-5 flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            {t("advantagesTitle")}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {advantages.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-4 border border-border flex items-start gap-3"
              >
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-600 leading-6">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Method */}
        <div className="glass rounded-3xl p-7">
          <h3 className="text-xl font-bold mb-5 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            {t("contactMethod.title")}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-border">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-primary flex items-center justify-center mb-4">
                <Mail className="w-5 h-5" />
              </div>

              <h4 className="font-bold mb-2">{t("contactMethod.emailTitle")}</h4>

              <p className="text-sm text-gray-500 leading-6 mb-4">
                {t("contactMethod.emailDescription")}
              </p>

              <a
                href="mailto:contact@baderinfo.com"
                className="text-primary font-medium text-sm hover:underline"
              >
                contact@baderinfo.com
              </a>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-border">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-primary flex items-center justify-center mb-4">
                <Globe className="w-5 h-5" />
              </div>

              <h4 className="font-bold mb-2">
                {t("contactMethod.websiteTitle")}
              </h4>

              <p className="text-sm text-gray-500 leading-6 mb-4">
                {t("contactMethod.websiteDescription")}
              </p>

              <a
                href="https://baderinfo.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-medium text-sm hover:underline"
              >
                baderinfo.com
              </a>
            </div>
          </div>
        </div>

        {/* Version Info */}
        <div className="glass rounded-3xl p-7">
          <h3 className="text-xl font-bold mb-5 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {t("version.title")}
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <VersionItem label={t("version.appName")} value="Bader Account" />
            <VersionItem label={t("version.version")} value={appVersion} />
            <VersionItem label={t("version.releaseYear")} value={releaseYear} />
            <VersionItem label={t("version.status")} value={t("version.active")} />
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 pb-4">
          {t("footer.madeWith")}{" "}
          <Heart className="w-4 h-4 inline text-red-500" /> {t("footer.by")} Bader
          <br />
          © 2026 baderinfo.com - {t("footer.rights")}
        </div>
      </div>
    </AppLayout>
  );
}

function VersionItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 text-center border border-border">
      <div className="text-xs text-gray-500 mb-2">{label}</div>
      <div className="font-bold text-primary text-sm">{value}</div>
    </div>
  );
}