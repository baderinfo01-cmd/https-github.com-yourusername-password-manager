"use strict";

// AI assistant (Claude). Runs in the main process: the API key is stored encrypted with the OS
// (safeStorage) and is never handed to the web page. Only business summaries are sent.

const fs = require("node:fs");
const path = require("node:path");

const MODEL = "claude-sonnet-5-5";
const MAX_SUMMARY = 60000;

const LANG = { ar: "العربية", en: "English", fr: "français" };
const SYSTEM = (locale) =>
  `You are the business assistant inside BLR, an invoicing and accounting desktop program for small businesses. ` +
  `You receive a JSON summary of the user's business (sales, debts, stock, expenses). Answer ONLY from that data, never invent numbers; ` +
  `say clearly when the data does not contain the answer. Be concise, practical, and use short lists or tables. ` +
  `Reply in ${LANG[locale] || LANG.en}. Never ask for passwords.`;

function registerAi({ ipcMain, safeStorage, dataDir }) {
  const keyFile = path.join(dataDir, "ai.key");

  const readKey = () => {
    try {
      if (!fs.existsSync(keyFile) || !safeStorage.isEncryptionAvailable()) return null;
      return safeStorage.decryptString(fs.readFileSync(keyFile));
    } catch {
      return null;
    }
  };

  ipcMain.handle("blr-ai:has-key", () => !!readKey());
  ipcMain.handle("blr-ai:set-key", (_e, key) => {
    if (key === "") { try { fs.unlinkSync(keyFile); } catch {} return { ok: true }; }
    if (typeof key !== "string" || !/^sk-ant-[\w-]{10,}$/.test(key.trim())) return { ok: false, error: "invalid-key" };
    if (!safeStorage.isEncryptionAvailable()) return { ok: false, error: "no-secure-storage" };
    fs.writeFileSync(keyFile, safeStorage.encryptString(key.trim()));
    return { ok: true };
  });

  async function call(body) {
    const apiKey = readKey();
    if (!apiKey) return { ok: false, error: "no-key" };
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: MODEL, ...body }),
        signal: AbortSignal.timeout(90000),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, error: data?.error?.message || `HTTP ${res.status}` };
      const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
      return { ok: true, text };
    } catch (e) {
      return { ok: false, error: e && e.message ? e.message : "network-error" };
    }
  }

  ipcMain.handle("blr-ai:ask", async (_e, { messages, summary, locale } = {}) => {
    if (!Array.isArray(messages) || !messages.length || messages.length > 30) return { ok: false, error: "invalid-question" };
    const clean = messages
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
    if (!clean.length || clean[clean.length - 1].role !== "user") return { ok: false, error: "invalid-question" };
    const data = JSON.stringify(summary || {}).slice(0, MAX_SUMMARY);
    // the data goes in the first user turn so follow-up questions keep the same context
    clean[0] = { role: "user", content: `Business data (JSON):\n${data}\n\n${clean[0].content}` };
    if (clean[0].role !== "user") return { ok: false, error: "invalid-question" };
    return call({ max_tokens: 1500, system: SYSTEM(locale), messages: clean });
  });

  // Read a photo/scan of a supplier invoice or receipt and return structured fields
  ipcMain.handle("blr-ai:scan", async (_e, { dataUrl, locale } = {}) => {
    const m = /^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl || "");
    if (!m || m[2].length > 7_000_000) return { ok: false, error: "invalid-image" };
    const r = await call({
      max_tokens: 1500,
      system:
        "You extract data from a photo of an invoice or receipt. Reply with ONLY one JSON object, no prose: " +
        '{"supplier":string,"date":"YYYY-MM-DD"|"","number":string,"currency":string,"total":number,"tax":number,' +
        '"lines":[{"description":string,"qty":number,"unitPrice":number}]}. Use 0 or "" when unknown. Never guess amounts.',
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: m[1], data: m[2] } },
          { type: "text", text: `Extract this document (UI language: ${locale || "en"}).` },
        ],
      }],
    });
    if (!r.ok) return r;
    try {
      const j = JSON.parse(r.text.slice(r.text.indexOf("{"), r.text.lastIndexOf("}") + 1));
      return { ok: true, data: j };
    } catch {
      return { ok: false, error: "unreadable" };
    }
  });
}

module.exports = { registerAi };
