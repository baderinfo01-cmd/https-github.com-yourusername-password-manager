import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

let clipboardTimer: ReturnType<typeof setTimeout> | null = null;

/** Copies text and wipes the clipboard after `clearAfterMs` (default 20 s) if it is still ours. */
export async function copyToClipboard(text: string, clearAfterMs = 20_000): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    if (clipboardTimer) clearTimeout(clipboardTimer);
    clipboardTimer = setTimeout(async () => {
      try {
        if ((await navigator.clipboard.readText()) === text) await navigator.clipboard.writeText("");
      } catch {
        /* clipboard may be unavailable when the window is not focused */
      }
    }, clearAfterMs);
    return true;
  } catch {
    return false;
  }
}

export function formatDate(date: Date | string, locale: string = "ar"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}