import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Android shell for the Bader web app (same code as the desktop app and the phone web app).
 * The built site (out/) is bundled inside the APK, so the app works fully offline.
 * Build:  npm run build && npx cap sync android   (then Android Studio / gradle, see docs/ANDROID-AR.md)
 */
const config: CapacitorConfig = {
  appId: "com.baderinfo.accountmanagement",
  appName: "Bader Account Management",
  webDir: "out",
  backgroundColor: "#f0f9ff",
  server: {
    androidScheme: "https", // origin https://localhost: same-origin storage, secure context for WebCrypto
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon",
      iconColor: "#0EA5E9",
    },
  },
};

export default config;
