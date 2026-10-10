"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { branding } from "@/config/branding";
import { useStore } from "@/store/useStore";
import { lockApp } from "@/lib/session";
import {
  LayoutDashboard,
  User,
  KeyRound,
  Crown,
  Info,
  CreditCard,
  FileText,
  Phone,
  Wand2,
  BarChart3,
  Settings,
  Code,
  Mail,
  Lock,
  ChevronLeft,
  ChevronRight,
  BadgeCheck,
  Bot,
} from "lucide-react";

export default function Sidebar() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const myInfo = useStore((state: any) => state.myInfo) || {};

  const currentLocale = pathname.split("/")[1] || "ar";

  const username = myInfo?.username || "";
const firstName = myInfo?.firstName || "";
const lastName = myInfo?.lastName || "";

const fullName =
  firstName || lastName ? `${firstName} ${lastName}`.trim() : "";

// عرض اسم المستخدم أولاً
const displayName = username || fullName || branding.appShortName;

const role = myInfo?.role || branding.ownerRole;

// الحروف داخل الشعار من اسم المستخدم أولاً
const initials = username
  ? username.slice(0, 2).toUpperCase()
  : firstName || lastName
  ? `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase()
  : branding.logoText.toUpperCase();

  const menu = [
    { href: "/dashboard", icon: LayoutDashboard, key: "dashboard" },
    { href: "/my-account", icon: User, key: "myAccount" },
    { href: "/my-info", icon: Info, key: "myInfo" },
    { href: "/cards", icon: CreditCard, key: "cards" },
    { href: "/documents", icon: FileText, key: "documents" },
    { href: "/contacts", icon: Phone, key: "contacts" },
    { href: "/accounts", icon: KeyRound, key: "accounts" },
    { href: "/subscriptions", icon: Crown, key: "subscriptions" },
    { href: "/ai", icon: Bot, key: "ai" },
    { href: "/generator", icon: Wand2, key: "generator" },
    { href: "/analytics", icon: BarChart3, key: "analytics" },
    { href: "/settings", icon: Settings, key: "settings" },
    { href: "/contact", icon: Mail, key: "contact" },
    { href: "/developer", icon: Code, key: "developer" },
    { href: "/license-info", icon: BadgeCheck, key: "license" },
  ];

  return (
    <aside
      className={`${
        collapsed ? "w-20" : "w-72"
      } transition-all duration-300 glass h-screen sticky top-0 flex flex-col border-l border-border`}
    >
      <div className="p-6 flex items-center justify-between border-b border-border">
        {!collapsed && (
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0"
              style={{ background: "rgb(var(--color-primary))" }}
            >
              {initials}
            </div>

            <div className="min-w-0">
              <div className="font-bold text-sm truncate">
                {displayName}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {role} · {branding.version}
              </div>
            </div>
          </div>
        )}

        {collapsed && (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg mx-auto"
            style={{ background: "rgb(var(--color-primary))" }}
          >
            {initials}
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-white/50 transition-colors"
          aria-label="toggle sidebar"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          {menu.map((item) => {
            const Icon = item.icon;
            const fullHref = `/${currentLocale}${item.href}`;
            const isActive =
              pathname === fullHref || pathname.startsWith(`${fullHref}/`);

            return (
              <Link
                key={item.href}
                href={fullHref}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? "text-white shadow-lg"
                    : "text-gray-700 hover:bg-white/60"
                } ${collapsed ? "justify-center" : ""}`}
                style={
                  isActive
                    ? { background: "rgb(var(--color-primary))" }
                    : {}
                }
                title={collapsed ? t(item.key as any) : undefined}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 ${
                    isActive ? "" : "group-hover:scale-110 transition-transform"
                  }`}
                />

                {!collapsed && (
                  <span className="font-medium text-sm truncate">
                    {t(item.key as any)}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-border">
        {!collapsed && (
          <div className="mb-3 px-3 py-2 rounded-xl bg-white/50">
            <div className="text-xs text-gray-500">النسخة</div>
            <div className="text-sm font-bold text-primary">
              {branding.version}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => lockApp(currentLocale)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-all w-full ${
            collapsed ? "justify-center" : ""
          }`}
          title={collapsed ? t("logout") : undefined}
        >
          <Lock className="w-5 h-5 flex-shrink-0" />

          {!collapsed && (
            <span className="font-medium text-sm">{t("logout")}</span>
          )}
        </button>
      </div>
    </aside>
  );
}