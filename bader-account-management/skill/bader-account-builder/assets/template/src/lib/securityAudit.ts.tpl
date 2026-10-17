import { checkPasswordStrength, findDuplicates, isPasswordOld } from "./passwordStrength.ts";

export type IssueKind = "weak" | "reused" | "old";

export interface AuditIssue {
  id: string;
  siteName: string;
  kind: IssueKind;
  /** number of accounts sharing the password (reused only) */
  count?: number;
}

export interface AuditResult {
  score: number;
  total: number;
  weak: number;
  reused: number;
  old: number;
  issues: AuditIssue[];
}

interface AccountLike {
  id: string;
  siteName: string;
  password?: string;
  updatedAt?: string;
}

/** Local, offline analysis. Nothing leaves the device. */
export function auditAccounts(accounts: AccountLike[]): AuditResult {
  const dupes = findDuplicates(accounts);
  const issues: AuditIssue[] = [];
  let weak = 0;
  let reused = 0;
  let old = 0;

  for (const a of accounts) {
    if (!a.password) continue;
    if (checkPasswordStrength(a.password).score <= 2) {
      weak++;
      issues.push({ id: a.id, siteName: a.siteName, kind: "weak" });
    }
    const n = dupes.get(a.password) || 0;
    if (n > 1) {
      reused++;
      issues.push({ id: a.id, siteName: a.siteName, kind: "reused", count: n });
    }
    if (a.updatedAt && isPasswordOld(a.updatedAt)) {
      old++;
      issues.push({ id: a.id, siteName: a.siteName, kind: "old" });
    }
  }

  const total = accounts.length;
  const penalty = total ? ((weak * 3 + reused * 2 + old) / (total * 6)) * 100 : 0;
  const score = Math.max(0, Math.round(100 - penalty));
  return { score, total, weak, reused, old, issues };
}

/** The ONLY data sent to the AI: site names and categories of problems. No passwords. */
export function buildAiSummary(audit: AuditResult, categories: Record<string, number>) {
  return {
    totalAccounts: audit.total,
    securityScore: audit.score,
    counts: { weak: audit.weak, reused: audit.reused, old: audit.old },
    accountsByCategory: categories,
    problemAccounts: audit.issues.slice(0, 50).map((i) => ({
      site: i.siteName,
      problem: i.kind,
      ...(i.count ? { sharedWith: i.count - 1 } : {}),
    })),
  };
}
