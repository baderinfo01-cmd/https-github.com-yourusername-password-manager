"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useRequireUnlock } from "@/lib/session";
import { useStore } from "@/store/useStore";
import LoginNotice from "@/components/ui/LoginNotice";

/**
 * Every page inside [locale]/ (except the login page) wraps its content in <AppLayout>.
 * useRequireUnlock() sends the visitor back to the login page when the vault key is not in memory
 * (hard reload, deep link, auto-lock) and runs the idle auto-lock timer.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("common");
  const unlocked = useRequireUnlock();
  const theme = useStore((s) => s.theme);

  useEffect(() => {
    if (unlocked) document.documentElement.setAttribute("data-theme", theme);
  }, [theme, unlocked]);

  if (!unlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted text-sm">{t("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh">
      <LoginNotice />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-3 sm:p-6 min-w-0">{children}</main>
      </div>
    </div>
  );
}
