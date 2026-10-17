"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Languages, Lock, Menu } from "lucide-react";
import ModeToggle from "@/components/ui/ModeToggle";
import { lockApp } from "@/lib/session";

const LANGS = [
  { code: "ar", label: "العربية" },
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
];

export default function Header() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.split("/")[1] || "ar";

  // static export + client navigation: the vault key stays in memory (a full reload would lock the app)
  const switchLanguage = (lang: string) => {
    const seg = pathname.split("/");
    seg[1] = lang;
    router.push(seg.join("/"));
  };

  return (
    <header className="glass sticky top-0 z-30 border-b border-border">
      <div className="px-3 sm:px-6 py-3 flex items-center justify-between gap-2">
        <button type="button" onClick={() => window.dispatchEvent(new Event("bader:toggle-menu"))} className="md:hidden p-2.5 rounded-xl hover:bg-accent" aria-label="menu">
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <Languages className="w-5 h-5 text-muted" aria-hidden="true" />
          <select
            aria-label="language"
            value={locale}
            onChange={(e) => switchLanguage(e.target.value)}
            className="rounded-xl border border-border bg-card text-fg px-2 py-1.5 text-sm"
          >
            {LANGS.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
          <ModeToggle />
          <button type="button" onClick={() => lockApp(locale)} className="p-2.5 rounded-xl hover:bg-accent text-red-600" aria-label="lock" title={t("logout")}>
            <Lock className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
