import type { Metadata } from "next";
import "./globals.css";
import { Shell } from "@/components/Shell";

export const metadata: Metadata = { title: "Template App", description: "Template App", icons: { icon: "/brand/icon-192.png" } };

// lang/dir are rewritten at runtime by store/ui.ts (apply()) when the user switches language.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="antialiased">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
