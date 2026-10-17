import type { Account } from "@/types";
import { MASK, printReport, type ReportColumn, type ReportLabels } from "@/lib/printReport";

type Tr = (key: string, values?: Record<string, string | number>) => string;

export interface ReportCtx {
  locale: string;
  /** translator for the "print" namespace */
  tp: Tr;
  title: string;
}

export function reportLabels(tp: Tr): ReportLabels {
  return {
    owner: tp("owner"),
    username: tp("username"),
    date: tp("date"),
    total: tp("total"),
    confidential: tp("confidential"),
    footer: tp("footer"),
    empty: tp("empty"),
    page: tp("page"),
  };
}

export const reportCol = (tp: Tr, key: string, width?: string, ltr?: boolean): ReportColumn => ({ key, label: tp(`col.${key}`), width, ltr });

/** Secrets never reach paper unless the user says yes (default = hidden). */
export function askSecrets(tp: Tr): boolean {
  return typeof window !== "undefined" && window.confirm(tp("includeSecretsPrompt"));
}
export const secretsNote = (tp: Tr, shown: boolean) => (shown ? tp("secretsShown") : tp("secretsHidden"));

export function printAccounts(c: ReportCtx, accounts: Account[], categoryLabel: (v: string) => string) {
  const secrets = askSecrets(c.tp);
  printReport({
    title: c.title,
    locale: c.locale,
    labels: reportLabels(c.tp),
    landscape: true,
    note: secretsNote(c.tp, secrets),
    columns: [
      reportCol(c.tp, "site", "22%"),
      reportCol(c.tp, "category", "14%"),
      reportCol(c.tp, "username", "20%", true),
      reportCol(c.tp, "password", "18%", true),
      reportCol(c.tp, "notes"),
    ],
    rows: accounts.map((a) => ({
      site: [a.siteName, a.siteUrl].filter(Boolean).join("\n"),
      category: categoryLabel(a.category),
      username: a.username,
      password: a.password ? (secrets ? a.password : MASK) : "",
      notes: a.notes,
    })),
  });
}

// @module-reports  (add_module.py does not generate reports: copy printAccounts above for new modules)
