"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { KeyRound, ShieldCheck, Star, Activity } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { useStore } from "@/store/useStore";
import { auditAccounts } from "@/lib/securityAudit";
import { branding } from "@/config/branding";
import { formatWhen } from "@/lib/security";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tn = useTranslations("nav"); // module cards take their label from nav.<kind>
  const locale = useLocale();
  const accounts = useStore((s) => s.accounts);
  const activity = useStore((s) => s.activityLog);
  const myInfo = useStore((s) => s.myInfo);
  // @module-dashboard-selectors

  const audit = useMemo(() => auditAccounts(accounts), [accounts]);
  const name = myInfo.username || myInfo.firstName || branding.ownerName;

  const tiles = [
    { href: "accounts", icon: <KeyRound className="w-6 h-6" />, label: t("accounts"), value: accounts.length },
    { href: "accounts", icon: <Star className="w-6 h-6" />, label: t("favorites"), value: accounts.filter((a) => a.isFavorite).length },
    { href: "ai", icon: <ShieldCheck className="w-6 h-6" />, label: t("securityScore"), value: accounts.length ? `${audit.score}%` : "—" },
    // @module-dashboard-cards
  ];

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold" dir="auto">{t("welcome", { name })}</h1>
          <p className="text-muted mt-1">{t("subtitle")}</p>
        </div>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {tiles.map((c) => (
            <Link key={c.label} href={`/${locale}/${c.href}/`} className="glass rounded-2xl p-5 hover:-translate-y-1 transition-transform block">
              <div className="text-primary mb-2">{c.icon}</div>
              <div className="text-3xl font-bold num">{c.value}</div>
              <div className="text-sm text-muted">{c.label}</div>
            </Link>
          ))}
        </div>

        {accounts.length > 0 && (audit.weak > 0 || audit.reused > 0 || audit.old > 0) && (
          <div className="glass rounded-2xl p-5 border-amber-300">
            <h2 className="font-bold mb-1">{t("attention")}</h2>
            <p className="text-sm text-muted">{t("attentionText", { weak: audit.weak, reused: audit.reused, old: audit.old })}</p>
          </div>
        )}

        <div className="glass rounded-2xl p-5">
          <h2 className="font-bold mb-3 flex items-center gap-2"><Activity className="w-5 h-5 text-primary" />{t("recent")}</h2>
          {activity.length === 0 ? (
            <p className="text-sm text-muted">{t("noActivity")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {activity.slice(0, 8).map((a) => (
                <li key={a.id} className="py-2 flex items-center justify-between gap-3 text-sm">
                  <span dir="auto" className="min-w-0 truncate">{t(`activity.${a.type}`)}: <b>{a.itemName}</b></span>
                  <span className="text-xs text-muted whitespace-nowrap">{formatWhen(new Date(a.createdAt).getTime(), locale)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
