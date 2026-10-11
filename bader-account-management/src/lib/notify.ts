/** One way to show a system notification: Android app (Capacitor) or desktop / browser (Notification API). */
export async function notify(title: string, body: string): Promise<void> {
  try {
    const cap = (window as any).Capacitor;
    if (cap?.isNativePlatform?.()) {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== "granted") {
        const asked = await LocalNotifications.requestPermissions();
        if (asked.display !== "granted") return;
      }
      await LocalNotifications.schedule({
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
  const cap = (window as any).Capacitor;
  if (cap?.isNativePlatform?.()) {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    return (await LocalNotifications.requestPermissions()).display;
  }
  return typeof Notification !== "undefined" ? await Notification.requestPermission() : "denied";
}
