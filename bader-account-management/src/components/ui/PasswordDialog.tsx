"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { changeMasterPassword, passwordProblem, verifyPassword } from "@/lib/vaultCrypto";

interface Props {
  mode: "change" | "confirm";
  onClose: () => void;
  /** called after the password was verified (confirm) or changed (change) */
  onDone?: () => void;
}

export default function PasswordDialog({ mode, onClose, onDone }: Props) {
  const t = useTranslations("settings.security");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setMsg("");
    try {
      if (mode === "confirm") {
        if (await verifyPassword(current)) {
          onClose();
          onDone?.();
        } else setMsg(t("confirmFailed"));
        return;
      }
      if (passwordProblem(next)) return setMsg(t("passwordTooShort"));
      if (await changeMasterPassword(current, next)) {
        setMsg(t("changePasswordSuccess"));
        setTimeout(() => {
          onClose();
          onDone?.();
        }, 1200);
      } else setMsg(t("wrongCurrent"));
    } finally {
      setBusy(false);
    }
  };

  const input = "w-full px-3 py-2 rounded-lg border border-border bg-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="glass rounded-2xl p-6 w-full max-w-sm space-y-3 bg-white">
        <h3 className="text-lg font-bold">
          {mode === "change" ? t("changePasswordTitle") : t("confirmWithPassword")}
        </h3>
        <input
          type="password"
          autoFocus
          className={input}
          placeholder={t("currentPassword")}
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && mode === "confirm" && submit()}
        />
        {mode === "change" && (
          <input
            type="password"
            className={input}
            placeholder={t("newPassword")}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        )}
        {msg && <p className="text-sm">{msg}</p>}
        <div className="flex gap-2 justify-end pt-1">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm">
            {t("cancel")}
          </button>
          <button
            onClick={submit}
            disabled={busy || !current}
            className="px-4 py-2 rounded-lg text-white text-sm disabled:opacity-50"
            style={{ background: "rgb(var(--color-primary))" }}
          >
            {t("save")}
          </button>
        </div>
      </div>
    </div>
  );
}
