"use client";

import { useMemo, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Search,
  Palette,
  Languages,
  Clock3,
  CalendarDays,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ExternalLink,
} from "lucide-react";
import { branding } from "@/config/branding";
import { useStore } from "@/store/useStore";
import {
  checkPasswordStrength,
  findDuplicates,
} from "@/lib/passwordStrength";

type NotificationType = "danger" | "warning" | "info";

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  type: NotificationType;
  href?: string;
};

export default function Header() {
  const [showColors, setShowColors] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const pathname = usePathname();
  const router = useRouter();

  const accounts = useStore((state: any) => state.accounts || []);
  const subscriptions = useStore((state: any) => state.subscriptions || []);
  const documents = useStore((state: any) => state.documents || []);

  const currentTheme = useStore((state: any) => state.theme);
  const setStoreTheme = useStore((state: any) => state.setTheme);

  const currentLocale = pathname.split("/")[1] || "ar";

  const themes = ["purple", "blue", "green", "pink", "brown"] as const;

  const themeColors: Record<string, string> = {
    purple: "#a855f7",
    blue: "#0ea5e9",
    green: "#22c55e",
    pink: "#ec4899",
    brown: "#92400e",
  };

  const languages = [
    { code: "ar", label: "العربية", flag: "ع" },
    { code: "en", label: "English", flag: "EN" },
    { code: "fr", label: "Français", flag: "FR" },
  ];

  const currentLang = languages.find((l) => l.code === currentLocale);

  const notifications = useMemo<NotificationItem[]>(() => {
    const items: NotificationItem[] = [];
    const now = Date.now();

    const expiringSubscriptions = subscriptions.filter((sub: any) => {
      if (sub.status !== "active") return false;

      const days = Math.ceil(
        (new Date(sub.endDate).getTime() - now) /
          (1000 * 60 * 60 * 24)
      );

      return days > 0 && days <= 7;
    });

    const expiredSubscriptions = subscriptions.filter((sub: any) => {
      const days = Math.ceil(
        (new Date(sub.endDate).getTime() - now) /
          (1000 * 60 * 60 * 24)
      );

      return days <= 0 || sub.status === "expired";
    });

    const expiringDocuments = documents.filter((doc: any) => {
      if (!doc.expiryDate) return false;

      const days = Math.ceil(
        (new Date(doc.expiryDate).getTime() - now) /
          (1000 * 60 * 60 * 24)
      );

      return days > 0 && days <= 30;
    });

    const expiredDocuments = documents.filter((doc: any) => {
      if (!doc.expiryDate) return false;

      const days = Math.ceil(
        (new Date(doc.expiryDate).getTime() - now) /
          (1000 * 60 * 60 * 24)
      );

      return days <= 0;
    });

    const weakPasswords = accounts.filter((acc: any) => {
      if (!acc.password) return false;
      return checkPasswordStrength(acc.password).score <= 2;
    });

    const duplicatePasswords = findDuplicates(accounts);
    const duplicatePasswordGroups = Array.from(
      duplicatePasswords.values()
    ).filter((count) => count > 1).length;

    if (expiringSubscriptions.length > 0) {
      items.push({
        id: "expiring-subscriptions",
        type: "warning",
        title: "اشتراكات تنتهي قريبًا",
        description: `${expiringSubscriptions.length} اشتراك يحتاج إلى متابعة خلال 7 أيام.`,
        href: `/${currentLocale}/subscriptions`,
      });
    }

    if (expiredSubscriptions.length > 0) {
      items.push({
        id: "expired-subscriptions",
        type: "danger",
        title: "اشتراكات منتهية",
        description: `${expiredSubscriptions.length} اشتراك منتهي أو يحتاج إلى مراجعة.`,
        href: `/${currentLocale}/subscriptions`,
      });
    }

    if (expiringDocuments.length > 0) {
      items.push({
        id: "expiring-documents",
        type: "warning",
        title: "وثائق تنتهي قريبًا",
        description: `${expiringDocuments.length} وثيقة تنتهي خلال 30 يومًا.`,
        href: `/${currentLocale}/documents`,
      });
    }

    if (expiredDocuments.length > 0) {
      items.push({
        id: "expired-documents",
        type: "danger",
        title: "وثائق منتهية",
        description: `${expiredDocuments.length} وثيقة منتهية الصلاحية.`,
        href: `/${currentLocale}/documents`,
      });
    }

    if (weakPasswords.length > 0) {
      items.push({
        id: "weak-passwords",
        type: "danger",
        title: "كلمات مرور ضعيفة",
        description: `${weakPasswords.length} حساب يحتوي على كلمة مرور ضعيفة.`,
        href: `/${currentLocale}/accounts`,
      });
    }

    if (duplicatePasswordGroups > 0) {
      items.push({
        id: "duplicate-passwords",
        type: "warning",
        title: "كلمات مرور مكررة",
        description: `${duplicatePasswordGroups} مجموعة من كلمات المرور مكررة.`,
        href: `/${currentLocale}/accounts`,
      });
    }

    return items;
  }, [accounts, subscriptions, documents, currentLocale]);

  const setTheme = (theme: string) => {
    if (setStoreTheme) {
      setStoreTheme(theme);
    }

    document.documentElement.setAttribute("data-theme", theme);
    setShowColors(false);
  };

  const switchLanguage = (lang: string) => {
    const segments = pathname.split("/");
    segments[1] = lang;
    const newPath = segments.join("/");

    router.push(newPath);
    setShowLanguages(false);
  };

  const openNotification = (item: NotificationItem) => {
    if (item.href) {
      router.push(item.href);
      setShowNotifications(false);
    }
  };

  return (
    <header className="glass sticky top-0 z-30 border-b border-border">
      <div className="px-6 py-3 flex items-center justify-between gap-4">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="بحث..."
              className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-white/60 border border-border focus:outline-none focus:border-primary transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Date and Time */}
          <DateTimeWidget locale={currentLocale} />

          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => {
                setShowLanguages(!showLanguages);
                setShowColors(false);
                setShowNotifications(false);
              }}
              className="p-2.5 rounded-xl hover:bg-white/60 transition-colors flex items-center gap-1.5"
              aria-label="تغيير اللغة"
            >
              <Languages className="w-5 h-5 text-gray-700" />
              <span className="text-sm hidden md:inline">
                {currentLang?.flag}
              </span>
            </button>

            {showLanguages && (
              <div className="absolute top-full mt-2 right-0 glass rounded-2xl p-2 shadow-xl z-50 min-w-[160px]">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => switchLanguage(lang.code)}
                    className={`w-full px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors ${
                      currentLocale === lang.code
                        ? "bg-primary text-white"
                        : "hover:bg-white/60"
                    }`}
                    style={
                      currentLocale === lang.code
                        ? { backgroundColor: "rgb(var(--color-primary))" }
                        : {}
                    }
                  >
                    <span className="text-lg">{lang.flag}</span>
                    <span>{lang.label}</span>
                    {currentLocale === lang.code && (
                      <span className="mr-auto">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme Switcher */}
          <div className="relative">
            <button
              onClick={() => {
                setShowColors(!showColors);
                setShowLanguages(false);
                setShowNotifications(false);
              }}
              className="p-2.5 rounded-xl hover:bg-white/60 transition-colors"
              aria-label="الألوان"
            >
              <Palette className="w-5 h-5 text-gray-700" />
            </button>

            {showColors && (
              <div className="absolute top-full mt-2 right-0 glass rounded-2xl p-2 flex gap-2 shadow-xl z-50">
                {themes.map((th) => (
                  <button
                    key={th}
                    onClick={() => setTheme(th)}
                    className={`w-8 h-8 rounded-full hover:scale-110 transition-transform ${
                      currentTheme === th ? "ring-2 ring-primary" : ""
                    }`}
                    style={{ backgroundColor: themeColors[th] }}
                    aria-label={th}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowColors(false);
                setShowLanguages(false);
              }}
              className="p-2.5 rounded-xl hover:bg-white/60 transition-colors relative"
              aria-label="الإشعارات"
            >
              <Bell className="w-5 h-5 text-gray-700" />

              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {notifications.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute top-full mt-2 right-0 glass rounded-2xl shadow-xl z-50 w-80 overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm">الإشعارات</div>
                    <div className="text-xs text-gray-500">
                      {notifications.length > 0
                        ? `${notifications.length} تنبيه`
                        : "لا توجد تنبيهات"}
                    </div>
                  </div>

                  {notifications.length > 0 ? (
                    <ShieldAlert className="w-5 h-5 text-red-500" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  )}
                </div>

                <div className="max-h-96 overflow-y-auto p-2">
                  {notifications.length === 0 ? (
                    <div className="p-5 text-center text-sm text-gray-500">
                      <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-green-600" />
                      كل شيء جيد حاليًا
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {notifications.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => openNotification(item)}
                          className={`w-full text-right p-3 rounded-xl border transition-colors ${getNotificationClass(
                            item.type
                          )}`}
                        >
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />

                            <div className="flex-1">
                              <div className="font-bold text-sm">
                                {item.title}
                              </div>
                              <div className="text-xs leading-5 mt-1 opacity-80">
                                {item.description}
                              </div>
                            </div>

                            {item.href && (
                              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Info */}
          <UserInfoBox />
        </div>
      </div>
    </header>
  );
}

function UserInfoBox() {
  const myInfo = useStore((state: any) => state.myInfo) || {};

  const username = myInfo?.username || "";
  const firstName = myInfo?.firstName || "";
  const lastName = myInfo?.lastName || "";
  const savedRole = myInfo?.role || "";

  const fullName =
    firstName || lastName ? `${firstName} ${lastName}`.trim() : "";

  // عرض اسم المستخدم أولاً، وإذا غير موجود يعرض الاسم واللقب، وإذا غير موجود يعرض الاسم الافتراضي
  const displayName = username || fullName || branding.ownerName;

  const role = savedRole || branding.ownerRole;

  // الحروف داخل الدائرة من اسم المستخدم أولاً
  const initials = username
    ? username.slice(0, 2).toUpperCase()
    : firstName || lastName
    ? `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase()
    : branding.logoText.toUpperCase();

  return (
    <div className="flex items-center gap-2 pr-2 border-r border-border">
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md"
        style={{ background: "rgb(var(--color-primary))" }}
      >
        {initials}
      </div>

      <div className="hidden md:block">
        <div className="text-sm font-medium">{displayName}</div>
        <div className="text-xs text-gray-500">{role}</div>
      </div>
    </div>
  );
}

function DateTimeWidget({ locale }: { locale: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());

    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!now) return null;

  const dateLocale =
    locale === "en" ? "en-GB" : locale === "fr" ? "fr-FR" : "ar-DZ";

  return (
    <div className="hidden xl:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/60 border border-border">
      <CalendarDays className="w-4 h-4 text-primary" />

      <div className="leading-tight">
        <div className="text-[11px] text-gray-500">
          {now.toLocaleDateString(dateLocale, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>

        <div className="text-xs font-mono font-bold text-primary flex items-center gap-1">
          <Clock3 className="w-3 h-3" />
          {now.toLocaleTimeString(dateLocale)}
        </div>
      </div>
    </div>
  );
}

function getNotificationClass(type: NotificationType) {
  if (type === "danger") {
    return "bg-red-50 border-red-100 text-red-700 hover:bg-red-100";
  }

  if (type === "warning") {
    return "bg-orange-50 border-orange-100 text-orange-700 hover:bg-orange-100";
  }

  return "bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100";
}