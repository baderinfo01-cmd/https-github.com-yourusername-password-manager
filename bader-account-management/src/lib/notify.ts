/**
 * One way to show a system notification:
 *  - Android app: the Capacitor "LocalNotifications" plugin, taken from window.Capacitor.Plugins
 *    (no import, so the web / desktop build never depends on the plugin package)
 *  - desktop app and browsers: the standard Notification API
 */
type LocalNotificationsPlugin = {
  checkPermissions(): Promise<{ display: string }>;
  requestPermissions(): Promise<{ display: string }>;
  schedule(o: { notifications: { id: number; title: string; body: string; smallIcon?: string }[] }): Promise<unknown>;
};

function nativePlugin(): LocalNotificationsPlugin | null {
  const cap = (typeof window !== "undefined" ? (window as any).Capacitor : null) as any;
  if (!cap?.isNativePlatform?.()) return null;
  return (cap.Plugins?.LocalNotifications as LocalNotificationsPlugin) ?? null;
}

export async function notify(title: string, body: string): Promise<void> {
  try {
    const native = nativePlugin();
    if (native) {
      let perm = (await native.checkPermissions()).display;
      if (perm !== "granted") perm = (await native.requestPermissions()).display;
      if (perm !== "granted") return;
      await native.schedule({
        notifications: [{ id: Math.floor(Date.now() % 2_000_000_000), title, body, smallIcon: "ic_stat_icon" }],
      });
      return;
    }
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification(title, { body, icon: "/brand/app-icon.png" });
    }
  } catch {
    /* notifications are best effort */
  }
}

export async function requestNotifyPermission(): Promise<string> {
  const native = nativePlugin();
  if (native) return (await native.requestPermissions()).display;
  return typeof Notification !== "undefined" ? await Notification.requestPermission() : "denied";
}
