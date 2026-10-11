"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import AppLayout from "@/components/layout/AppLayout";
import { branding, whatsappLink } from "@/config/branding";
import {
  Mail,
  MessageSquare,
  Send,
  Globe,
  Phone,
  Check,
  Copy,
  ExternalLink,
  Clock,
  Headphones,
  Bug,
  Lightbulb,
  ShieldQuestion,
  Sparkles,
  User,
  AtSign,
  Tag,
  AlertCircle,
  MessageCircle,
} from "lucide-react";
import { copyToClipboard } from "@/lib/utils";

export default function ContactPage() {
  const t = useTranslations("contact");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    category: "general",
    priority: "normal",
    message: "",
  });

  const [sent, setSent] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [error, setError] = useState("");

  const contactEmail = branding.developer.email;
  const websiteUrl = branding.developer.website;

  const categories = [
    {
      value: "general",
      label: t("categories.general"),
      icon: MessageCircle,
      color: "from-blue-500 to-cyan-500",
    },
    {
      value: "support",
      label: t("categories.support"),
      icon: Headphones,
      color: "from-green-500 to-emerald-500",
    },
    {
      value: "bug",
      label: t("categories.bug"),
      icon: Bug,
      color: "from-red-500 to-rose-500",
    },
    {
      value: "suggestion",
      label: t("categories.suggestion"),
      icon: Lightbulb,
      color: "from-yellow-500 to-orange-500",
    },
    {
      value: "security",
      label: t("categories.security"),
      icon: ShieldQuestion,
      color: "from-purple-500 to-indigo-500",
    },
  ];

  const selectedCategory = useMemo(() => {
    return (
      categories.find((item) => item.value === formData.category) ||
      categories[0]
    );
  }, [formData.category, categories]);

  const quickTopics = [
    {
      title: t("quickTopics.help.title"),
      description: t("quickTopics.help.description"),
      icon: Headphones,
    },
    {
      title: t("quickTopics.suggestion.title"),
      description: t("quickTopics.suggestion.description"),
      icon: Lightbulb,
    },
    {
      title: t("quickTopics.bug.title"),
      description: t("quickTopics.bug.description"),
      icon: Bug,
    },
    {
      title: t("quickTopics.security.title"),
      description: t("quickTopics.security.description"),
      icon: ShieldQuestion,
    },
  ];

  const handleCopyEmail = async () => {
    const ok = await copyToClipboard(contactEmail);

    if (ok) {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 1800);
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) return t("validation.nameRequired");

    if (!formData.email.trim()) return t("validation.emailRequired");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return t("validation.emailInvalid");
    }

    if (!formData.subject.trim()) return t("validation.subjectRequired");

    if (!formData.message.trim()) return t("validation.messageRequired");

    if (formData.message.trim().length < 10) {
      return t("validation.messageTooShort");
    }

    return "";
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");

    const priorityText =
      formData.priority === "high"
        ? t("priorities.high")
        : formData.priority === "low"
        ? t("priorities.low")
        : t("priorities.normal");

    const body = `
${t("mailBody.name")}: ${formData.name}
${t("mailBody.email")}: ${formData.email}
${t("mailBody.category")}: ${selectedCategory.label}
${t("mailBody.priority")}: ${priorityText}

${t("mailBody.message")}:
${formData.message}
`.trim();

    const mailto = `mailto:${contactEmail}?subject=${encodeURIComponent(
      formData.subject
    )}&body=${encodeURIComponent(body)}`;

    window.location.href = mailto;

    setSent(true);

    setTimeout(() => {
      setSent(false);
      setFormData({
        name: "",
        email: "",
        subject: "",
        category: "general",
        priority: "normal",
        message: "",
      });
    }, 3000);
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Hero */}
        <div className="glass rounded-3xl p-8 overflow-hidden relative">
          <div className="absolute -top-16 -left-16 w-44 h-44 rounded-full bg-blue-400/20 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-52 h-52 rounded-full bg-primary/20 blur-3xl" />

          <div className="relative text-center">
            <div
              className="w-24 h-24 rounded-[2rem] mx-auto mb-5 flex items-center justify-center text-white shadow-2xl"
              style={{
                background:
                  "linear-gradient(135deg, rgb(var(--color-primary)), rgb(var(--color-primary) / 0.55))",
              }}
            >
              <Mail className="w-12 h-12" />
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-border text-sm text-gray-600 mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              {t("hero.badge")}
            </div>

            <h1 className="text-4xl font-bold mb-3">{t("title")}</h1>

            <p className="text-gray-600 leading-8 max-w-2xl mx-auto">
              {t("subtitle")}
            </p>
          </div>
        </div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="glass rounded-2xl p-6 text-center card-hover group"
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageCircle className="w-7 h-7" />
            </div>
            <h3 className="font-bold mb-1">WhatsApp</h3>
            <p className="text-sm text-gray-600 mb-3" dir="ltr">{branding.developer.phone}</p>
            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
              {branding.developer.name}
              <ExternalLink className="w-3 h-3" />
            </span>
          </a>

          <a
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="glass rounded-2xl p-6 text-center card-hover group"
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-primary mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Globe className="w-7 h-7" />
            </div>

            <h3 className="font-bold mb-1">{t("cards.website.title")}</h3>
            <p className="text-sm text-gray-600 mb-3">baderinfo.com</p>

            <span className="inline-flex items-center gap-1 text-xs text-primary font-medium">
              {t("cards.website.action")}
              <ExternalLink className="w-3 h-3" />
            </span>
          </a>

          <button
            type="button"
            onClick={handleCopyEmail}
            className="glass rounded-2xl p-6 text-center card-hover group"
          >
            <div className="w-14 h-14 rounded-2xl bg-green-50 text-green-600 mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Mail className="w-7 h-7" />
            </div>

            <h3 className="font-bold mb-1">{t("cards.email.title")}</h3>
            <p className="text-sm text-gray-600 mb-3">{contactEmail}</p>

            <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
              {copiedEmail ? t("cards.email.copied") : t("cards.email.copy")}
              <Copy className="w-3 h-3" />
            </span>
          </button>

          <div className="glass rounded-2xl p-6 text-center card-hover">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 mx-auto mb-4 flex items-center justify-center">
              <Clock className="w-7 h-7" />
            </div>

            <h3 className="font-bold mb-1">{t("cards.response.title")}</h3>
            <p className="text-sm text-gray-600 mb-3">
              {t("cards.response.time")}
            </p>

            <span className="inline-flex items-center gap-1 text-xs text-purple-600 font-medium">
              {t("cards.response.note")}
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* Form */}
          <div className="glass rounded-3xl p-7">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-primary flex items-center justify-center">
                <MessageSquare className="w-6 h-6" />
              </div>

              <div>
                <h2 className="text-xl font-bold">{t("form.title")}</h2>
                <p className="text-sm text-gray-500">
                  {t("form.description")}
                </p>
              </div>
            </div>

            {sent && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-2">
                <Check className="w-5 h-5" />
                <span>{t("form.success")}</span>
              </div>
            )}

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label={t("form.name")}
                  required
                  icon={<User className="w-4 h-4" />}
                >
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-border focus:outline-none focus:border-primary"
                    placeholder={t("form.namePlaceholder")}
                  />
                </FormField>

                <FormField
                  label={t("form.email")}
                  required
                  icon={<AtSign className="w-4 h-4" />}
                >
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-border focus:outline-none focus:border-primary"
                    placeholder="email@example.com"
                    dir="ltr"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label={t("form.category")}
                  required
                  icon={<Tag className="w-4 h-4" />}
                >
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-border focus:outline-none focus:border-primary"
                  >
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField
                  label={t("form.priority")}
                  icon={<AlertCircle className="w-4 h-4" />}
                >
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-border focus:outline-none focus:border-primary"
                  >
                    <option value="low">{t("priorities.low")}</option>
                    <option value="normal">{t("priorities.normal")}</option>
                    <option value="high">{t("priorities.high")}</option>
                  </select>
                </FormField>
              </div>

              <FormField
                label={t("form.subject")}
                required
                icon={<MessageSquare className="w-4 h-4" />}
              >
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-border focus:outline-none focus:border-primary"
                  placeholder={t("form.subjectPlaceholder")}
                />
              </FormField>

              <FormField
                label={t("form.message")}
                required
                icon={<MessageCircle className="w-4 h-4" />}
              >
                <textarea
                  required
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  rows={7}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-border focus:outline-none focus:border-primary"
                  placeholder={t("form.messagePlaceholder")}
                />
              </FormField>

              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-700 leading-7">
                <strong>{t("form.noteTitle")}:</strong>{" "}
                {t("form.note", { email: contactEmail })}
              </div>

              <button
                type="submit"
                className="w-full btn-3d py-3 rounded-xl text-white font-medium flex items-center justify-center gap-2"
                style={{ background: "rgb(var(--color-primary))" }}
              >
                <Send className="w-5 h-5" />
                {t("form.submit")}
              </button>
            </form>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="glass rounded-3xl p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                {t("sidebar.helpTitle")}
              </h3>

              <div className="space-y-3">
                {quickTopics.map((item, index) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={index}
                      className="bg-white rounded-2xl p-4 border border-border"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5" />
                        </div>

                        <div>
                          <h4 className="font-bold text-sm mb-1">
                            {item.title}
                          </h4>
                          <p className="text-xs text-gray-500 leading-6">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="glass rounded-3xl p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                {t("sidebar.contactInfo")}
              </h3>

              <div className="space-y-3 text-sm">
                <InfoRow label={t("info.email")} value={contactEmail} dir="ltr" />
                <InfoRow label="WhatsApp / Tel" value={branding.developer.phone} dir="ltr" />
                <InfoRow label="Developer" value={branding.developer.name} dir="ltr" />
                <InfoRow label={t("info.website")} value="baderinfo.com" dir="ltr" />
                <InfoRow label={t("info.support")} value={t("info.supportValue")} />
                <InfoRow label={t("info.response")} value={t("info.responseValue")} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="glass rounded-2xl p-5 text-center text-sm text-gray-500">
          {t("footerNote")}
        </div>
      </div>
    </AppLayout>
  );
}

function FormField({
  label,
  required = false,
  icon,
  children,
}: {
  label: string;
  required?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium mb-2">
        {icon}
        <span>
          {label} {required && <span className="text-red-500">*</span>}
        </span>
      </label>
      {children}
    </div>
  );
}

function InfoRow({
  label,
  value,
  dir,
}: {
  label: string;
  value: string;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div className="flex items-center justify-between gap-3 bg-white rounded-xl p-3 border border-border">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-primary text-xs" dir={dir}>
        {value}
      </span>
    </div>
  );
}