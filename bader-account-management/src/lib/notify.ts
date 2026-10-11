/** System notification (desktop app and browsers use the standard Notification API). */
export async function notify(title: string, body: string): Promise<void> {
  try {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "default") await Notification.requestPermission();
    if (Notification.permission === "granted") {
      new Notification(title, { body, icon: "/brand/app-icon.png" });
    }
  } catch {
    /* notifications are best effort */
  }
}
