import { auditAccounts, buildAiSummary, type AuditResult } from "@/lib/securityAudit";

export type ToolId = "security" | "subscriptions" | "expiry" | "organize";

interface Sub {
  name: string;
  category: string;
  endDate: string;
  price: number;
  currency: string;
  status: string;
}
interface Dated {
  label: string;
  type: string;
  expiryDate?: string;
}

export interface Radar {
  subscriptionsSoon: { name: string; days: number; price: number; currency: string }[];
  subscriptionsExpired: { name: string }[];
  monthlySpend: Record<string, number>;
  itemsExpiring: { label: string; type: string; days: number }[];
  itemsExpired: { label: string; type: string }[];
}

const daysUntil = (iso?: string) => {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : Math.ceil((t - Date.now()) / 86_400_000);
};

/** Local analysis of dates and money. No secret fields are read. */
export function buildRadar(subs: Sub[], items: Dated[]): Radar {
  const r: Radar = { subscriptionsSoon: [], subscriptionsExpired: [], monthlySpend: {}, itemsExpiring: [], itemsExpired: [] };
  for (const s of subs) {
    const d = daysUntil(s.endDate);
    if (s.status === "active" && d !== null) {
      if (d < 0) r.subscriptionsExpired.push({ name: s.name });
      else if (d <= 30) r.subscriptionsSoon.push({ name: s.name, days: d, price: s.price, currency: s.currency });
    } else if (s.status === "expired") r.subscriptionsExpired.push({ name: s.name });
    if (s.status === "active") r.monthlySpend[s.currency] = (r.monthlySpend[s.currency] || 0) + (s.price || 0);
  }
  for (const i of items) {
    const d = daysUntil(i.expiryDate);
    if (d === null) continue;
    if (d < 0) r.itemsExpired.push({ label: i.label, type: i.type });
    else if (d <= 90) r.itemsExpiring.push({ label: i.label, type: i.type, days: d });
  }
  r.subscriptionsSoon.sort((a, b) => a.days - b.days);
  r.itemsExpiring.sort((a, b) => a.days - b.days);
  return r;
}

/**
 * The ONLY payloads sent to the AI per tool. Never passwords, card numbers, CVV, PINs,
 * document numbers, usernames or notes.
 */
export function buildSummary(tool: ToolId, audit: AuditResult, categories: Record<string, number>, radar: Radar, subs: Sub[]) {
  switch (tool) {
    case "security":
      return buildAiSummary(audit, categories);
    case "subscriptions":
      return {
        subscriptions: subs.slice(0, 80).map((s) => ({
          name: s.name,
          category: s.category,
          status: s.status,
          endDate: s.endDate,
          price: s.price,
          currency: s.currency,
        })),
        monthlySpend: radar.monthlySpend,
      };
    case "expiry":
      return { ...radar };
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
