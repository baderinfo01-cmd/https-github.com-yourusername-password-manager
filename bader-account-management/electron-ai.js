"use strict";

// AI assistant (Claude) — runs in the main process so the renderer needs no network access.
// The renderer only ever sends a privacy-safe summary (no passwords, no card data).

const MODEL = "claude-sonnet-5-5";
const MAX_QUESTION = 1000;
const MAX_SUMMARY = 20000;

const SYSTEM = {
  ar: "أنت مساعد أمني داخل برنامج لإدارة الحسابات. ستتلقى ملخصاً عن الخزنة (أسماء المواقع وتصنيف قوة كلمات المرور فقط؛ لا توجد كلمات مرور حقيقية). أجب بالعربية بإيجاز وبخطوات عملية مرتبة. لا تطلب كلمات المرور أبداً.",
  en: "You are a security assistant inside an account-management app. You receive a summary of the vault (site names and password strength labels only; no real passwords). Answer concisely with practical, ordered steps. Never ask for passwords.",
  fr: "Vous êtes un assistant de sécurité dans une application de gestion de comptes. Vous recevez un résumé du coffre (noms de sites et force des mots de passe uniquement ; aucun vrai mot de passe). Répondez brièvement avec des étapes pratiques. Ne demandez jamais de mots de passe.",
};

function registerAi(ipcMain) {
  registerBreach(ipcMain);
  ipcMain.handle("bader-ai:ask", async (_event, payload) => {
    try {
      const { apiKey, question, summary, locale } = payload || {};
      if (typeof apiKey !== "string" || !/^sk-ant-[\w-]{10,}$/.test(apiKey)) {
        return { ok: false, error: "invalid-key" };
      }
      if (typeof question !== "string" || !question.trim() || question.length > MAX_QUESTION) {
        return { ok: false, error: "invalid-question" };
      }
      const summaryText = JSON.stringify(summary || {}).slice(0, MAX_SUMMARY);

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 1024,
          system: SYSTEM[locale] || SYSTEM.en,
          messages: [
            {
              role: "user",
              content: `Vault summary (JSON):\n${summaryText}\n\nQuestion: ${question.trim()}`,
            },
          ],
        }),
        signal: AbortSignal.timeout(60000),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false, error: data?.error?.message || `HTTP ${res.status}` };
      }
      const text = (data.content || [])
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n");
      return { ok: true, text };
    } catch (e) {
      return { ok: false, error: e && e.message ? e.message : "network-error" };
    }
  });
}

// Have-I-Been-Pwned "range" API: only the first 5 chars of a SHA-1 hash ever leave the device.
function registerBreach(ipcMain) {
  ipcMain.handle("bader-ai:breach-range", async (_event, prefix) => {
    try {
      if (typeof prefix !== "string" || !/^[0-9A-F]{5}$/.test(prefix)) {
        return { ok: false, error: "invalid-prefix" };
      }
      const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
        headers: { "Add-Padding": "true" },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
      return { ok: true, text: await res.text() };
    } catch (e) {
      return { ok: false, error: e && e.message ? e.message : "network-error" };
    }
  });
}

module.exports = { registerAi, registerBreach };
