import { buildAiSummary, type AuditResult } from "./securityAudit.ts";

export type ToolId = "security" | "organize";

/**
 * The ONLY payloads that may be sent to the AI per tool. Never passwords, card numbers, CVV, PINs,
 * document numbers, usernames or notes. Add a case here (and a unit test) before sending anything new.
 * For a new module that has dates/prices, add a "radar"-style tool that sends names + dates only.
 */
export function buildSummary(tool: ToolId, audit: AuditResult, categories: Record<string, number>) {
  switch (tool) {
    case "security":
      return buildAiSummary(audit, categories);
    case "organize":
      return { accountsByCategory: categories, totalAccounts: audit.total };
  }
}

/** HIBP check, k-anonymity: only the first 5 chars of the SHA-1 hash leave the device. */
export async function sha1Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

/** Number of known breaches containing this password, or null when the lookup failed (offline). */
export async function breachCount(
  password: string,
  range: (prefix: string) => Promise<{ ok: boolean; text?: string }>
): Promise<number | null> {
  const h = await sha1Hex(password);
  const res = await range(h.slice(0, 5));
  if (!res.ok || !res.text) return null;
  const suffix = h.slice(5);
  for (const line of res.text.split("\n")) {
    const [s, c] = line.trim().split(":");
    if (s === suffix) return Number(c) || 0;
  }
  return 0;
}
