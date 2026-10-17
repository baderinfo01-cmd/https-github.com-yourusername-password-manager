import type { Metadata, Viewport } from "next";
import { El_Messiri } from "next/font/google";
import "./globals.css";
import { Shell } from "@/components/Shell";

const elMessiri = El_Messiri({ subsets: ["arabic", "latin"], weight: ["400", "500", "600", "700"], display: "swap", variable: "--font-el-messiri" });

export const metadata: Metadata = { title: "BLR Fatourati", description: "BLR Fatourati — Smart invoicing & business management", icons: { icon: "/brand/icon-192.png" } };

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#0a9f63" };

// Capacitor serves the exported pages locally: make sure the RSC payloads (.txt) get their proper type so
// Next.js can navigate client-side (otherwise every link would reload the page and drop the in-memory session).
const FETCH_FIX = `(function(){try{var f=window.fetch;window.fetch=function(i,o){var u=typeof i==="string"?i:(i&&i.url)||"";return f.apply(this,arguments).then(function(r){if(/\\.txt(\\?|$)/.test(u)&&!/x-component/.test(r.headers.get("content-type")||"")){var h=new Headers(r.headers);h.set("content-type","text/x-component");return new Response(r.body,{status:r.status,statusText:r.statusText,headers:h})}return r})}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" data-theme="green" className={elMessiri.variable} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: FETCH_FIX }} /></head>
      <body className={`${elMessiri.className} antialiased`}>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
