"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { branding } from "@/config/branding";
import { useStore } from "@/store/useStore";
import { lockApp } from "@/lib/session";
import {
  LayoutDashboard,
  KeyRound,
  Wand2,
  Bot,
  ShieldCheck,
  Settings,
  BadgeCheck,
  Lock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function Sidebar() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  // phone / small windows: the menu is a slide-in drawer opened from the header button
  const [mobileOpen, setMobileOpen] = useState(false);
  const myInfo = useStore((s) => s.myInfo);

  useEffect(() => {
    const toggle = () => setMobileOpen((v) => !v);
    window.addEventListener("bader:toggle-menu", toggle);
    return () => window.removeEventListener("bader:toggle-menu", toggle);
  }, []);
  useEffect(() => setMobileOpen(false), [pathname]);

  const locale = pathname.split("/")[1] || "ar";
  const fullName = `${myInfo.firstName} ${myInfo.lastName}`.trim();
  const displayName = myInfo.username || fullName || branding.appShortName;
  const initials = (myInfo.username || fullName || branding.logoText).slice(0, 2).toUpperCase();

  // add_module.py inserts the entry of a new module right after the marker. Keys must exist in messages/*.json "nav".
  const menu = [
    { href: "/dashboard", icon: LayoutDashboard, key: "dashboard" },
    { href: "/accounts", icon: KeyRound, key: "accounts" },
    // @nav
    { href: "/ai", icon: Bot, key: "ai" },
    { href: "/generator", icon: Wand2, key: "generator" },
    { href: "/security", icon: ShieldCheck, key: "security" },
    { href: "/settings", icon: Settings, key: "settings" },
    { href: "/license-info", icon: BadgeCheck, key: "license" },
  ];

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setMobileOpen(false)} aria-hidden="true" />}
      <aside
        className={`${collapsed ? "md:w-20" : "md:w-72"} w-72 max-w-[85vw] glass h-dvh flex flex-col border-e border-border transition-transform duration-300 md:transition-all
        fixed inset-y-0 start-0 z-50 md:sticky md:top-0 md:z-auto
        ${mobileOpen ? "translate-x-0" : "ltr:-translate-x-full rtl:translate-x-full md:!translate-x-0"}`}
      >
        <div className={`px-5 pt-5 pb-1 flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={branding.assets.logo} alt="" className="w-10 h-10 rounded-xl shadow-md flex-shrink-0" />
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <div className="font-bold text-sm truncate">{branding.appName}</div>
              <div className="text-[11px] text-muted">{branding.developer.company}</div>
            </div>
          )}
        </div>

        <div className="p-4 flex items-center justify-between border-b border-border gap-2">
          {!collapsed && (
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold bg-primary flex-shrink-0">{initials}</div>
              <div className="min-w-0">
                <div className="font-bold text-sm truncate" dir="auto">{displayName}</div>
                <div className="text-xs text-muted truncate">{branding.version}</div>
              </div>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="p-2 rounded-lg hover:bg-accent hidden md:block" aria-label="toggle sidebar">
            {collapsed ? <ChevronRight className="w-5 h-5 rtl:rotate-180" /> : <ChevronLeft className="w-5 h-5 rtl:rotate-180" />}
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {menu.map((item) => {
              const Icon = item.icon;
              const href = `/${locale}${item.href}`;
              const active = pathname === href || pathname === `${href}/` || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={item.href}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${active ? "text-white shadow-lg bg-primary" : "hover:bg-accent"} ${collapsed ? "justify-center" : ""}`}
                  title={collapsed ? t(item.key) : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span className="font-medium text-sm truncate">{t(item.key)}</span>}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t border-border">
          <button
            type="button"
            onClick={() => lockApp(locale)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-500/10 w-full ${collapsed ? "justify-center" : ""}`}
            title={collapsed ? t("logout") : undefined}
          >
            <Lock className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="font-medium text-sm">{t("logout")}</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
