import type { Account, Card, Contact, Document, Subscription } from "@/types";
import { MASK, formatDate, maskCard, printReport, type ReportColumn, type ReportLabels } from "@/lib/printReport";

type Tr = (key: string, values?: Record<string, string | number>) => string;

interface Ctx {
  locale: string;
  /** translator for the "print" namespace */
  tp: Tr;
  title: string;
}

function labels(tp: Tr): ReportLabels {
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

const col = (tp: Tr, key: string, label: string, width?: string, ltr?: boolean): ReportColumn => ({
  key,
  label: tp(`col.${label}`),
  width,
  ltr,
});

/** Asks (once) whether secrets may appear on paper. Default is hidden. */
function askSecrets(tp: Tr): boolean {
  return typeof window !== "undefined" && window.confirm(tp("includeSecretsPrompt"));
}

const secretsNote = (tp: Tr, shown: boolean) => (shown ? tp("secretsShown") : tp("secretsHidden"));

export function printAccounts(c: Ctx, accounts: Account[], categoryLabel: (v: string) => string) {
  const secrets = askSecrets(c.tp);
  printReport({
    title: c.title,
    locale: c.locale,
    labels: labels(c.tp),
    landscape: true,
    note: secretsNote(c.tp, secrets),
    columns: [
      col(c.tp, "site", "site", "17%"),
      col(c.tp, "category", "category", "10%"),
      col(c.tp, "username", "username", "14%", true),
      col(c.tp, "email", "email", "19%", true),
      col(c.tp, "phone", "phone", "12%", true),
      col(c.tp, "password", "password", "12%", true),
      col(c.tp, "notes", "notes"),
    ],
    rows: accounts.map((a) => ({
      site: [a.siteName, a.siteUrl].filter(Boolean).join("\n"),
      category: categoryLabel(a.category),
      username: a.username,
      email: [...(a.emails || []).map((e) => e.email), a.recoveryEmail && `↩ ${a.recoveryEmail}`]
        .filter(Boolean)
        .join("\n"),
      phone: (a.phones || []).join("\n"),
      password: a.password ? (secrets ? a.password : MASK) : "",
      notes: a.notes,
    })),
  });
}

export function printSubscriptions(c: Ctx, subs: Subscription[], categoryLabel: (v: string) => string) {
  const secrets = askSecrets(c.tp);
  const spend: Record<string, number> = {};
  subs.filter((s) => s.status === "active").forEach((s) => (spend[s.currency] = (spend[s.currency] || 0) + (s.price || 0)));
  printReport({
    title: c.title,
    locale: c.locale,
    labels: labels(c.tp),
    landscape: true,
    note: secretsNote(c.tp, secrets),
    summary: Object.entries(spend).map(([cur, v]) => ({ label: `${c.tp("col.price")} (${c.tp("status.active")})`, value: `${v.toLocaleString(c.locale)} ${cur}` })),
    columns: [
      col(c.tp, "name", "name", "13%"),
      col(c.tp, "category", "category", "9%"),
      col(c.tp, "owner", "subOwner", "11%"),
      col(c.tp, "username", "username", "11%", true),
      col(c.tp, "email", "email", "14%", true),
      col(c.tp, "password", "password", "10%", true),
      col(c.tp, "start", "start", "8%", true),
      col(c.tp, "end", "end", "8%", true),
      col(c.tp, "price", "price", "8%"),
      col(c.tp, "status", "status", "6%"),
    ],
    rows: subs.map((s) => ({
      name: s.name,
      category: categoryLabel(s.category),
      owner: s.customerName,
      username: s.username,
      email: s.email,
      password: s.password ? (secrets ? s.password : MASK) : "",
      start: formatDate(s.startDate, c.locale),
      end: formatDate(s.endDate, c.locale),
      price: `${s.price ?? 0} ${s.currency || ""}`.trim(),
      status: c.tp(`status.${s.status}`),
    })),
  });
}

export function printCards(c: Ctx, cards: Card[], typeLabel: (v: string) => string) {
  const secrets = askSecrets(c.tp);
  printReport({
    title: c.title,
    locale: c.locale,
    labels: labels(c.tp),
    landscape: true,
    note: secretsNote(c.tp, secrets),
    columns: [
      col(c.tp, "type", "type", "10%"),
      col(c.tp, "holder", "holder", "14%"),
      col(c.tp, "number", "cardNumber", "15%", true),
      col(c.tp, "bank", "bank", "10%"),
      col(c.tp, "expiry", "expiry", "8%", true),
      col(c.tp, "iban", "iban", "14%", true),
      col(c.tp, "accUser", "accUser", "10%", true),
      col(c.tp, "accPass", "accPass", "9%", true),
      col(c.tp, "pin", "pin", "7%", true),
    ],
    rows: cards.map((k) => ({
      type: k.customType || typeLabel(k.type),
      holder: k.holderName,
      number: secrets ? k.cardNumber : maskCard(k.cardNumber),
      bank: k.issuerBank,
      expiry: k.expiryDate ? formatDate(k.expiryDate, c.locale) : "",
      iban: k.iban,
      accUser: k.accountUsername,
      accPass: k.accountPassword ? (secrets ? k.accountPassword : MASK) : "",
      pin: k.pinCode || k.cvv ? (secrets ? [k.pinCode, k.cvv && `CVV ${k.cvv}`].filter(Boolean).join(" / ") : MASK) : "",
    })),
  });
}

export function printDocuments(c: Ctx, docs: Document[], typeLabel: (v: string) => string) {
  const secrets = askSecrets(c.tp);
  printReport({
    title: c.title,
    locale: c.locale,
    labels: labels(c.tp),
    landscape: true,
    note: secretsNote(c.tp, secrets),
    columns: [
      col(c.tp, "type", "type", "13%"),
      col(c.tp, "owner", "docOwner", "16%"),
      col(c.tp, "number", "docNumber", "13%", true),
      col(c.tp, "nid", "nationalId", "13%", true),
      col(c.tp, "issue", "issue", "9%", true),
      col(c.tp, "expiry", "expiry", "9%", true),
      col(c.tp, "place", "issuePlace", "10%"),
      col(c.tp, "pin", "pin", "7%", true),
      col(c.tp, "notes", "notes"),
    ],
    rows: docs.map((d) => ({
      type: d.customTypeName || typeLabel(d.type),
      owner: [d.firstName, d.lastName].filter(Boolean).join(" "),
      number: d.documentNumber,
      nid: d.nationalIdNumber,
      issue: formatDate(d.issueDate, c.locale),
      expiry: formatDate(d.expiryDate, c.locale),
      place: d.issuePlace,
      pin: d.pinCode ? (secrets ? d.pinCode : MASK) : "",
      notes: d.notes,
    })),
  });
}

export function printContacts(c: Ctx, contacts: Contact[], categoryLabel: (v: string) => string) {
  printReport({
    title: c.title,
    locale: c.locale,
    labels: labels(c.tp),
    columns: [
      col(c.tp, "name", "fullName", "20%"),
      col(c.tp, "category", "category", "12%"),
      col(c.tp, "p1", "phone1", "14%", true),
      col(c.tp, "p2", "phone2", "14%", true),
      col(c.tp, "email", "email", "20%", true),
      col(c.tp, "place", "city", "12%"),
      col(c.tp, "notes", "notes"),
    ],
    rows: contacts.map((k) => ({
      name: [k.firstName, k.lastName].filter(Boolean).join(" "),
      category: categoryLabel(k.category),
      p1: k.phone1,
      p2: k.phone2,
      email: k.email,
      place: [k.city, k.state].filter(Boolean).join(" / "),
      notes: k.notes,
    })),
  });
}
