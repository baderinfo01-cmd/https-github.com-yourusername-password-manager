"use client";

import { decryptBackup, encryptBackup, isEncryptedBackup, passwordProblem } from "@/lib/vaultCrypto";

/** Texts for the password prompt: pass translated strings (this file has no i18n of its own). */
export interface BackupLabels {
  title: string;
  hint?: string;
  ok: string;
  cancel: string;
  mismatch: string;
  weak: string;
  wrong?: string;
}

/** Small promise-based password dialog (window.prompt does not exist in Electron). */
export function askPassword(labels: BackupLabels, opts: { confirm?: boolean } = {}): Promise<string | null> {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    const box = document.createElement("div");
    box.className = "bg-card text-fg rounded-2xl p-6 w-full max-w-sm space-y-3 shadow-2xl border border-border";
    const h = document.createElement("h3");
    h.className = "text-lg font-bold";
    h.textContent = labels.title;
    box.appendChild(h);
    const mk = () => {
      const i = document.createElement("input");
      i.type = "password";
      i.placeholder = "••••••••";
      i.autocomplete = "new-password";
      i.className = "w-full px-3 py-2 rounded-lg border border-border bg-card text-fg";
      box.appendChild(i);
      return i;
    };
    const p1 = mk();
    const p2 = opts.confirm ? mk() : null;
    const msg = document.createElement("p");
    msg.className = "text-xs text-muted";
    msg.textContent = labels.hint || "";
    box.appendChild(msg);
    const row = document.createElement("div");
    row.className = "flex gap-2 justify-end";
    const cancel = document.createElement("button");
    cancel.textContent = labels.cancel;
    cancel.className = "px-4 py-2 rounded-lg bg-accent text-fg";
    const ok = document.createElement("button");
    ok.textContent = labels.ok;
    ok.className = "px-4 py-2 rounded-lg bg-primary text-white";
    row.append(cancel, ok);
    box.appendChild(row);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    p1.focus();
    const done = (v: string | null) => {
      overlay.remove();
      resolve(v);
    };
    const fail = (text: string) => {
      msg.className = "text-sm text-red-600";
      msg.textContent = text;
    };
    cancel.onclick = () => done(null);
    ok.onclick = () => {
      if (!p1.value) return;
      if (p2) {
        if (passwordProblem(p1.value)) return fail(labels.weak);
        if (p1.value !== p2.value) return fail(labels.mismatch);
      }
      done(p1.value);
    };
    overlay.addEventListener("keydown", (e) => {
      if (e.key === "Enter") ok.click();
      if (e.key === "Escape") cancel.click();
    });
  });
}

function download(content: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Exports data as a password-protected .bbak file. Returns false if cancelled. Backups ALWAYS leave the app encrypted. */
export async function exportEncryptedBackup(json: string, baseName: string, labels: BackupLabels): Promise<boolean> {
  const pw = await askPassword(labels, { confirm: true });
  if (!pw) return false;
  download(await encryptBackup(json, pw), `${baseName}-${Date.now()}.bbak`, "application/octet-stream");
  return true;
}

/** Opens a file picker and resolves with the plain JSON text (decrypting when needed), or null. */
export function pickBackupFile(labels: BackupLabels): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".bbak,.json";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = async () => {
        const text = String(reader.result || "");
        if (!isEncryptedBackup(text)) return resolve(text);
        const pw = await askPassword(labels);
        resolve(pw ? await decryptBackup(text, pw) : null);
      };
      reader.readAsText(file);
    };
    input.click();
  });
}
