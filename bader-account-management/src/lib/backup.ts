"use client";

import { decryptBackup, encryptBackup, isEncryptedBackup, passwordProblem } from "@/lib/vaultCrypto";

/** Small promise-based password dialog (window.prompt does not exist in Electron). */
function askPassword(title: string, opts: { confirm?: boolean; hint?: string } = {}): Promise<string | null> {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4";
    overlay.setAttribute("role", "dialog");
    const box = document.createElement("div");
    box.className = "bg-white rounded-2xl p-6 w-full max-w-sm space-y-3 shadow-2xl";
    const h = document.createElement("h3");
    h.className = "text-lg font-bold";
    h.textContent = title;
    box.appendChild(h);
    const mk = (ph: string) => {
      const i = document.createElement("input");
      i.type = "password";
      i.placeholder = ph;
      i.className = "w-full px-3 py-2 rounded-lg border border-gray-300";
      box.appendChild(i);
      return i;
    };
    const p1 = mk("••••••••");
    const p2 = opts.confirm ? mk("••••••••") : null;
    const msg = document.createElement("p");
    msg.className = "text-sm text-red-600";
    msg.textContent = opts.hint || "";
    if (opts.hint) msg.className = "text-xs text-gray-500";
    box.appendChild(msg);
    const row = document.createElement("div");
    row.className = "flex gap-2 justify-end";
    const cancel = document.createElement("button");
    cancel.textContent = "✕";
    cancel.className = "px-4 py-2 rounded-lg bg-gray-100";
    const ok = document.createElement("button");
    ok.textContent = "OK";
    ok.className = "px-4 py-2 rounded-lg bg-sky-600 text-white";
    row.append(cancel, ok);
    box.appendChild(row);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    p1.focus();
    const done = (v: string | null) => {
      overlay.remove();
      resolve(v);
    };
    cancel.onclick = () => done(null);
    ok.onclick = () => {
      if (!p1.value) return;
      if (p2) {
        if (passwordProblem(p1.value)) {
          msg.className = "text-sm text-red-600";
          msg.textContent = "≥ 8 + letters + digits";
          return;
        }
        if (p1.value !== p2.value) {
          msg.className = "text-sm text-red-600";
          msg.textContent = "≠";
          return;
        }
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

/** Exports data as a password-protected .bbak file. Returns false if cancelled. */
export async function exportEncryptedBackup(json: string, baseName: string): Promise<boolean> {
  const pw = await askPassword("🔐 Backup password", {
    confirm: true,
    hint: "Needed to restore this backup. It can be different from your master password.",
  });
  if (!pw) return false;
  download(await encryptBackup(json, pw), `${baseName}-${Date.now()}.bbak`, "application/octet-stream");
  return true;
}

/** Opens a file picker and resolves with the plain JSON text (decrypting when needed), or null. */
export function pickBackupFile(): Promise<string | null> {
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
        const pw = await askPassword("🔐 Backup password");
        resolve(pw ? await decryptBackup(text, pw) : null);
      };
      reader.readAsText(file);
    };
    input.click();
  });
}
