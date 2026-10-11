"use client";
import { create } from "zustand";
import { blr, call } from "@/lib/api";
import {
  addDays, addPeriod, affectsStock, balances, computeTotals, num, round, stampDuty, stockSign, todayIso,
} from "@/lib/calc";
import { DEFAULT_SETTINGS } from "@/lib/defaults";
import type { Category, Doc, DocType, Expense, Item, Line, Party, Payment, Recurring, Settings, StockMove, Task } from "@/lib/types";

interface DataState {
  loaded: boolean;
  settings: Settings;
  clients: Party[]; suppliers: Party[]; items: Item[]; docs: Doc[]; payments: Payment[];
  expenses: Expense[]; moves: StockMove[]; recurring: Recurring[]; tasks: Task[]; categories: Category[]; audit: any[];
  saveCategory(kind: "product" | "service", name: string, oldName?: string): Promise<void>;
  removeCategory(kind: "product" | "service", name: string): Promise<void>;
  saveTask(t: Partial<Task>): Promise<void>;
  removeTask(id: string): Promise<void>;
  load(): Promise<void>;
  reset(): void;
  saveSettings(s: Settings): Promise<void>;
  saveParty(kind: "clients" | "suppliers", p: Partial<Party>): Promise<Party>;
  removeParty(kind: "clients" | "suppliers", id: string): Promise<void>;
  saveItem(i: Partial<Item>): Promise<Item>;
  removeItem(id: string): Promise<void>;
  saveDoc(d: Doc): Promise<Doc>;
  removeDoc(id: string): Promise<void>;
  newDocNumber(type: DocType, date: string): Promise<string>;
  addPayment(p: Omit<Payment, "id">): Promise<void>;
  removePayment(id: string): Promise<void>;
  saveExpense(e: Partial<Expense>): Promise<void>;
  removeExpense(id: string): Promise<void>;
  adjustStock(itemId: string, qty: number, reason: string, note?: string): Promise<void>;
  saveRecurring(r: Partial<Recurring>): Promise<void>;
  removeRecurring(id: string): Promise<void>;
  runRecurring(): Promise<number>;
  convert(docId: string, to: DocType): Promise<Doc>;
  log(action: string, detail?: object): void;
}

const uid = () => crypto.randomUUID();
const list = <T,>(kind: string) => call<T[]>(blr().db.list(kind));

export const useData = create<DataState>((set, get) => ({
  loaded: false,
  settings: DEFAULT_SETTINGS,
  clients: [], suppliers: [], items: [], docs: [], payments: [], expenses: [], moves: [], recurring: [], tasks: [], categories: [], audit: [],

  async load() {
    const [settingsArr, clients, suppliers, items, docs, payments, expenses, moves, recurring, tasks, categories, audit] = await Promise.all([
      list<Settings>("settings"), list<Party>("clients"), list<Party>("suppliers"), list<Item>("items"), list<Doc>("docs"),
      list<Payment>("payments"), list<Expense>("expenses"), list<StockMove>("moves"), list<Recurring>("recurring"), list<Task>("tasks"), list<Category>("categories"), list<any>("audit"),
    ]);
    const saved = settingsArr.find((s) => s.id === "main");
    const settings: Settings = saved
      ? { ...DEFAULT_SETTINGS, ...saved, company: { ...DEFAULT_SETTINGS.company, ...saved.company }, currency: { ...DEFAULT_SETTINGS.currency, ...saved.currency }, numbering: { ...DEFAULT_SETTINGS.numbering, ...saved.numbering } }
      : DEFAULT_SETTINGS;
    set({ settings, clients, suppliers, items, docs, payments, expenses, moves, recurring, tasks, categories, audit: audit.sort((a, b) => b.at - a.at), loaded: true });
  },
  reset: () => set({ loaded: false, clients: [], suppliers: [], items: [], docs: [], payments: [], expenses: [], moves: [], recurring: [], tasks: [], categories: [], audit: [] }),

  // rename (oldName given) or add a category; renaming also moves the items that used it
  async saveCategory(kind, name, oldName) {
    const n = name.trim();
    if (!n) return;
    const st = get();
    const existing = st.categories.find((c) => c.kind === kind && c.name === (oldName ?? n));
    const ops: any[] = [{ op: "save", kind: "categories", doc: { ...(existing || {}), kind, name: n } }];
    if (oldName && oldName !== n) for (const it of st.items) if (it.category === oldName && (kind === "service") === (it.type === "service")) ops.push({ op: "save", kind: "items", doc: { ...it, category: n } });
    const res = await call<any[]>(blr().db.batch(ops));
    set((s) => ({
      categories: upsert(s.categories, res[0]),
      items: res.slice(1).reduce((acc, it) => upsert(acc, it), s.items),
    }));
  },
  async removeCategory(kind, name) {
    const st = get();
    const ops: any[] = st.categories.filter((c) => c.kind === kind && c.name === name).map((c) => ({ op: "remove", kind: "categories", id: c.id }));
    const moved = st.items.filter((it) => it.category === name && (kind === "service") === (it.type === "service")).map((it) => ({ ...it, category: "" }));
    for (const it of moved) ops.push({ op: "save", kind: "items", doc: it });
    if (!ops.length) return;
    const res = await call<any[]>(blr().db.batch(ops));
    set((s) => ({
      categories: s.categories.filter((c) => !(c.kind === kind && c.name === name)),
      items: res.slice(ops.filter((o) => o.op === "remove").length).reduce((acc, it) => upsert(acc, it), s.items),
    }));
  },

  async saveTask(t) {
    const saved = await call<Task>(blr().db.save("tasks", t));
    set((s) => ({ tasks: upsert(s.tasks, saved) }));
  },
  async removeTask(id) {
    await call(blr().db.remove("tasks", id));
    set((s) => ({ tasks: s.tasks.filter((x) => x.id !== id) }));
  },

  log(action, detail) {
    void blr().db.audit(action, detail);
  },

  async saveSettings(s) {
    const saved = await call<Settings>(blr().db.save("settings", s));
    set({ settings: saved });
  },

  async saveParty(kind, p) {
    const saved = await call<Party>(blr().db.save(kind, p));
    set((st) => ({ [kind]: upsert(st[kind], saved) }) as any);
    return saved;
  },
  async removeParty(kind, id) {
    await call(blr().db.remove(kind, id));
    set((st) => ({ [kind]: st[kind].filter((x) => x.id !== id) }) as any);
    get().log(`delete-${kind}`, { id });
  },

  async saveItem(i) {
    const saved = await call<Item>(blr().db.save("items", i));
    set((st) => ({ items: upsert(st.items, saved) }));
    return saved;
  },
  async removeItem(id) {
    await call(blr().db.remove("items", id));
    set((st) => ({ items: st.items.filter((x) => x.id !== id) }));
    get().log("delete-item", { id });
  },

  async newDocNumber(type, date) {
    const { numbering } = get().settings;
    const cfg = numbering[type];
    const year = date.slice(0, 4);
    const n = await call<number>(blr().db.next(cfg.yearly ? `${type}:${year}` : type));
    const seq = String(n).padStart(cfg.pad, "0");
    return cfg.yearly ? `${cfg.prefix}-${year}-${seq}` : `${cfg.prefix}-${seq}`;
  },

  // Saves a document and keeps stock in step (reverses the previous effect, applies the new one) — all in one transaction.
  async saveDoc(input) {
    const st = get();
    const prev = st.docs.find((d) => d.id === input.id);
    const doc: Doc = { ...input };
    if (!doc.number) doc.number = await get().newDocNumber(doc.type, doc.date);
    const t = computeTotals(doc.lines, doc.discount, doc.discountType, doc.shipping, doc.stamp, st.settings.pricesIncludeTax, doc.extraTaxes || []);
    Object.assign(doc, { subtotal: t.subtotal, discountAmount: t.discountAmount, tax: t.tax, extraTax: t.extra, total: t.total });

    // desired stock effect of this doc: itemId -> signed qty
    const effect: Record<string, number> = {};
    const sign = stockSign(doc.type);
    const counts = affectsStock(doc.type) && doc.status !== "draft" && doc.status !== "void" && !(doc.type === "delivery" && doc.refId);
    if (counts && sign !== 0) {
      for (const l of doc.lines) {
        const it = st.items.find((i) => i.id === l.itemId);
        if (it?.trackStock) effect[it.id] = (effect[it.id] || 0) + sign * num(l.qty);
        // a service consumes the goods listed in its materials (restored by a credit note)
        if (it?.type === "service" && doc.type !== "purchase") {
          for (const m of it.materials || []) {
            const mi = st.items.find((i) => i.id === m.itemId);
            if (mi?.trackStock) effect[mi.id] = (effect[mi.id] || 0) + sign * num(m.qty) * num(l.qty);
          }
        }
      }
    }
    const applied = prev?.stockApplied || {};
    doc.stockApplied = effect;

    const ops: any[] = [];
    const itemUpdates = new Map<string, Item>();
    const moves: StockMove[] = [];
    for (const id of new Set([...Object.keys(applied), ...Object.keys(effect)])) {
      const delta = round((effect[id] || 0) - (applied[id] || 0), 4);
      if (!delta) continue;
      const it = itemUpdates.get(id) || st.items.find((i) => i.id === id);
      if (!it) continue;
      const updated = { ...it, stock: round(it.stock + delta, 4) };
      // a purchase refreshes the item's cost price
      if (doc.type === "purchase") {
        const line = doc.lines.find((l) => l.itemId === id);
        if (line && num(line.price) > 0) updated.cost = num(line.price);
      }
      itemUpdates.set(id, updated);
      moves.push({ id: uid(), itemId: id, qty: delta, reason: doc.type, docId: doc.id, date: doc.date, note: doc.number });
    }
    ops.push({ op: "save", kind: "docs", doc });
    for (const it of itemUpdates.values()) ops.push({ op: "save", kind: "items", doc: it });
    for (const m of moves) ops.push({ op: "save", kind: "moves", doc: m });
    const res = await call<any[]>(blr().db.batch(ops));
    const savedDoc = res[0] as Doc;
    const savedItems = res.slice(1, 1 + itemUpdates.size) as Item[];
    const savedMoves = res.slice(1 + itemUpdates.size) as StockMove[];
    set((s) => ({
      docs: upsert(s.docs, savedDoc),
      items: savedItems.reduce((acc, it) => upsert(acc, it), s.items),
      moves: [...s.moves, ...savedMoves],
    }));
    get().log(prev ? "update-doc" : "create-doc", { type: doc.type, number: doc.number });
    return savedDoc;
  },

  async removeDoc(id) {
    const st = get();
    const d = st.docs.find((x) => x.id === id);
    if (!d) return;
    // undo its stock effect and drop its payments
    const ops: any[] = [{ op: "remove", kind: "docs", id }];
    const itemUpdates: Item[] = [];
    for (const [itemId, qty] of Object.entries(d.stockApplied || {})) {
      const it = st.items.find((i) => i.id === itemId);
      if (it) { const u = { ...it, stock: round(it.stock - qty, 4) }; itemUpdates.push(u); ops.push({ op: "save", kind: "items", doc: u }); }
    }
    const pays = st.payments.filter((p) => p.docId === id);
    for (const p of pays) ops.push({ op: "remove", kind: "payments", id: p.id });
    const mv = st.moves.filter((m) => m.docId === id);
    for (const m of mv) ops.push({ op: "remove", kind: "moves", id: m.id });
    await call(blr().db.batch(ops));
    set((s) => ({
      docs: s.docs.filter((x) => x.id !== id),
      items: itemUpdates.reduce((acc, it) => upsert(acc, it), s.items),
      payments: s.payments.filter((p) => p.docId !== id),
      moves: s.moves.filter((m) => m.docId !== id),
    }));
    get().log("delete-doc", { type: d.type, number: d.number });
  },

  async addPayment(p) {
    const year = p.date.slice(0, 4);
    const n = await call<number>(blr().db.next(`receipt:${year}`));
    const number = `RCPT-${year}-${String(n).padStart(5, "0")}`;
    const saved = await call<Payment>(blr().db.save("payments", { ...p, id: uid(), number }));
    set((s) => ({ payments: [...s.payments, saved] }));
    get().log("payment", { amount: p.amount, docId: p.docId });
  },
  async removePayment(id) {
    await call(blr().db.remove("payments", id));
    set((s) => ({ payments: s.payments.filter((p) => p.id !== id) }));
    get().log("delete-payment", { id });
  },

  async saveExpense(e) {
    const saved = await call<Expense>(blr().db.save("expenses", e));
    set((s) => ({ expenses: upsert(s.expenses, saved) }));
  },
  async removeExpense(id) {
    await call(blr().db.remove("expenses", id));
    set((s) => ({ expenses: s.expenses.filter((x) => x.id !== id) }));
  },

  async adjustStock(itemId, qty, reason, note) {
    const it = get().items.find((i) => i.id === itemId);
    if (!it || !qty) return;
    const updated = { ...it, stock: round(it.stock + qty, 4) };
    const move: StockMove = { id: uid(), itemId, qty, reason, date: todayIso(), note };
    const res = await call<any[]>(blr().db.batch([{ op: "save", kind: "items", doc: updated }, { op: "save", kind: "moves", doc: move }]));
    set((s) => ({ items: upsert(s.items, res[0]), moves: [...s.moves, res[1]] }));
    get().log("stock-adjust", { itemId, qty, reason });
  },

  async saveRecurring(r) {
    const saved = await call<Recurring>(blr().db.save("recurring", r));
    set((s) => ({ recurring: upsert(s.recurring, saved) }));
  },
  async removeRecurring(id) {
    await call(blr().db.remove("recurring", id));
    set((s) => ({ recurring: s.recurring.filter((x) => x.id !== id) }));
  },

  // creates the invoices of every recurring template that is due
  async runRecurring() {
    let made = 0;
    const today = todayIso();
    for (const r of get().recurring) {
      if (!r.active) continue;
      let next = r.nextDate;
      let guard = 0;
      while (next <= today && (!r.endDate || next <= r.endDate) && guard++ < 24) {
        const client = get().clients.find((c) => c.id === r.partyId);
        const doc = await get().saveDoc({
          id: uid(), type: "invoice", number: "", date: next, dueDate: addDays(next, r.dueDays), partyId: r.partyId,
          partyName: client?.name || "", lines: r.lines.map((l) => ({ ...l, id: uid() })), discount: r.discount, discountType: r.discountType,
          shipping: 0, stamp: 0, notes: r.notes, terms: r.terms, status: "sent", subtotal: 0, discountAmount: 0, tax: 0, total: 0,
        });
        made++;
        next = addPeriod(next, r.every);
        await get().saveRecurring({ ...r, nextDate: next, lastNumber: doc.number });
      }
    }
    return made;
  },

  async convert(docId, to) {
    const st = get();
    const src = st.docs.find((d) => d.id === docId);
    if (!src) throw new Error("not-found");
    const date = todayIso();
    const s = st.settings;
    const doc: Doc = {
      ...src, id: uid(), type: to, number: "", date, refId: src.id, refNumber: src.number,
      dueDate: to === "invoice" ? addDays(date, s.dueDays) : undefined,
      status: to === "invoice" ? "sent" : "issued", stockApplied: {}, createdAt: undefined, updatedAt: undefined,
      lines: src.lines.map((l) => ({ ...l, id: uid() })),
    };
    const saved = await get().saveDoc(doc);
    if (src.type === "quote" || src.type === "proforma") await get().saveDoc({ ...src, status: "accepted" });
    return saved;
  },
}));

function upsert<T extends { id: string }>(arr: T[], item: T): T[] {
  const i = arr.findIndex((x) => x.id === item.id);
  if (i < 0) return [...arr, item];
  const copy = arr.slice();
  copy[i] = item;
  return copy;
}

// ---- helpers used by pages ----
export function useDocInfo() {
  const { docs, payments } = useData.getState();
  return balances(docs, payments);
}

export function newLine(taxRate: number): Line {
  return { id: uid(), desc: "", qty: 1, price: 0, discountPct: 0, taxRate };
}
export const cashStamp = (total: number, enabled: boolean, method?: string) => (enabled && method === "cash" ? stampDuty(total) : 0);
