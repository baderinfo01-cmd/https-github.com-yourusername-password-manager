"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useRequireUnlock } from "@/lib/session";
import LoginNotice from "@/components/ui/LoginNotice";
import { startAutoSync } from "@/lib/sync/controller";

const FIRST_SETUP_KEY = "bader-first-setup-completed-v1";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const unlocked = useRequireUnlock();

  useEffect(() => {
    if (unlocked) startAutoSync(); // idempotent: keeps the background sync loop alive while unlocked
  }, [unlocked]);

  useEffect(() => {
    if (!unlocked) return;
    const locale = pathname.split("/")[1] || "ar";

    const isSetupPage = pathname.includes("/setup-profile");
    const isLicensePage = pathname.includes("/bader-license");
    const isRootLocalePage =
      pathname === `/${locale}` || pathname === `/${locale}/`;

    const setupDone =
      localStorage.getItem(FIRST_SETUP_KEY) === "true";

    if (!setupDone && !isSetupPage && !isLicensePage && !isRootLocalePage) {
      router.replace(`/${locale}/setup-profile`);
      return;
    }

    setChecking(false);
  }, [pathname, router, unlocked]);

  if (!unlocked || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">جاري التحميل...</p>
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