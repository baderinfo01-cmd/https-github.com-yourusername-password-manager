import type { Metadata } from "next";
import { El_Messiri } from "next/font/google";
import "./globals.css";
import { Shell } from "@/components/Shell";

const elMessiri = El_Messiri({ subsets: ["arabic", "latin"], weight: ["400", "500", "600", "700"], display: "swap", variable: "--font-el-messiri" });

export const metadata: Metadata = { title: "BLR Fatourati", description: "BLR Fatourati — Smart invoicing & business management", icons: { icon: "/brand/icon-192.png" } };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" data-theme="sky" className={elMessiri.variable} suppressHydrationWarning>
      <body className={`${elMessiri.className} antialiased`}>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
