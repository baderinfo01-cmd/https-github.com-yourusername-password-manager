"use client";
import { Download, Pencil, Plus, Search, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { NewParam } from "./NewParam";
import { Badge, Button, Card, Confirm, Empty, Field, Input, Modal, PageHeader, Table, Td, Textarea } from "./ui";
import { useMoney } from "@/lib/hooks";
import { useT } from "@/lib/i18n";
import { exportXlsx, pick, pickTable } from "@/lib/io";
import { partyBalance } from "@/lib/party";
import type { Party } from "@/lib/types";
import { useData } from "@/store/data";
import { can, useUi } from "@/store/ui";

const EMPTY: Partial<Party> = { name: "" };

export function PartiesPage({ kind }: { kind: "clients" | "suppliers" }) {
  const t = useT();
  const money = useMoney();
  const role = useUi((s) => s.user?.role);
  const notify = useUi((s) => s.notify);
  const { docs, payments, saveParty, removeParty } = useData();
  const list = useData((s) => s[kind]);
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<Partial<Party> | null>(null);
  const [del, setDel] = useState<Party | null>(null);
  const writable = can(role, kind === "clients" ? "clients" : "purchases");
  const singular = kind === "clients" ? "client" : "supplier";

  const rows = useMemo(() => {
    const k = q.trim().toLowerCase();
    return list
      .filter((p) => !k || [p.name, p.company, p.phone, p.email, p.taxId].some((v) => v?.toLowerCase().includes(k)))
      .map((p) => ({ p, bal: partyBalance(kind, p, docs, payments) }))
      .sort((a, b) => a.p.name.localeCompare(b.p.name));
  }, [list, q, docs, payments, kind]);

  const save = async () => {
    if (!edit?.name?.trim()) return notify(t("name_required"), "err");
    await saveParty(kind, { ...edit, name: edit.name.trim() });
    setEdit(null);
    notify(t("saved"));
  };

  const doImport = async () => {
    try {
      const table = await pickTable();
      if (!table) return;
      let n = 0;
      for (const r of table) {
        const name = pick(r, "name");
        if (!name) continue;
        await saveParty(kind, { name, company: pick(r, "company"), phone: pick(r, "phone"), email: pick(r, "email"), address: pick(r, "address"), city: pick(r, "city"), taxId: pick(r, "taxId"), rc: pick(r, "rc") });
        n++;
      }
      notify(t("imported", { n }));
    } catch { notify(t("import_failed"), "err"); }
  };
  const doExport = () =>
    exportXlsx(kind, t(kind), [
      [t("name"), t("company"), t("phone"), t("email"), t("address"), t("city"), "NIF", "RC", t("balance")],
      ...rows.map(({ p, bal }) => [p.name, p.company || "", p.phone || "", p.email || "", p.address || "", p.city || "", p.taxId || "", p.rc || "", bal]),
    ]);

  const set = (k: keyof Party, v: string) => setEdit((e) => ({ ...e, [k]: v }));
  return (
    <div className="mx-auto max-w-7xl">
      <NewParam onNew={() => writable && setEdit(EMPTY)} />
      <PageHeader
        title={t(kind)}
        subtitle={`${list.length}`}
        actions={<>
          <Button variant="secondary" size="sm" onClick={doExport}><Download size={14} />{t("export")}</Button>
          {writable && <Button variant="secondary" size="sm" onClick={doImport}><Upload size={14} />{t("import")}</Button>}
          {writable && <Button onClick={() => setEdit(EMPTY)}><Plus size={16} />{t("add_" + singular)}</Button>}
        </>}
      />
      <Card pad={false}>
        <div className="border-b border-line p-3">
          <div className="relative max-w-sm">
            <Search size={15} className="pointer-events-none absolute start-3 top-3 text-muted" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} className="ps-9" />
          </div>
        </div>
        {rows.length === 0 ? <Empty text={t("no_data")} action={writable ? <Button onClick={() => setEdit(EMPTY)}>{t("add_" + singular)}</Button> : undefined} /> : (
          <Table head={[t("name"), t("phone"), t("email"), t("city"), t("balance"), ""]}>
            {rows.map(({ p, bal }) => (
              <tr key={p.id}>
                <Td><Link href={`/parties/view/?kind=${kind}&id=${p.id}`} className="font-medium text-accent">{p.name}</Link>{p.company && <div className="text-xs text-muted">{p.company}</div>}</Td>
                <Td className="num">{p.phone}</Td><Td>{p.email}</Td><Td>{p.city}</Td>
                <Td className="num font-semibold">{bal > 0 ? <Badge tone={kind === "clients" ? "warn" : "info"}>{money(bal)}</Badge> : money(bal)}</Td>
                <Td className="text-end whitespace-nowrap">
                  {writable && <button onClick={() => setEdit(p)} className="rounded p-1.5 text-muted hover:bg-surface2" aria-label={t("edit")}><Pencil size={15} /></button>}
                  {can(role, "delete") && <button onClick={() => setDel(p)} className="rounded p-1.5 text-bad hover:bg-bad/10" aria-label={t("delete")}><Trash2 size={15} /></button>}
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Modal open={!!edit} onClose={() => setEdit(null)} wide title={edit?.id ? t("edit") : t("add_" + singular)} footer={<><Button variant="secondary" onClick={() => setEdit(null)}>{t("cancel")}</Button><Button onClick={save}>{t("save")}</Button></>}>
        {edit && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("name") + " *"}><Input value={edit.name || ""} onChange={(e) => set("name", e.target.value)} autoFocus /></Field>
            <Field label={t("company")}><Input value={edit.company || ""} onChange={(e) => set("company", e.target.value)} /></Field>
            <Field label={t("phone")}><Input value={edit.phone || ""} onChange={(e) => set("phone", e.target.value)} /></Field>
            <Field label={t("email")}><Input type="email" value={edit.email || ""} onChange={(e) => set("email", e.target.value)} /></Field>
            <Field label={t("address")} className="sm:col-span-2"><Input value={edit.address || ""} onChange={(e) => set("address", e.target.value)} /></Field>
            <Field label={t("city")}><Input value={edit.city || ""} onChange={(e) => set("city", e.target.value)} /></Field>
            <Field label="NIF"><Input value={edit.taxId || ""} onChange={(e) => set("taxId", e.target.value)} /></Field>
            <Field label="RC"><Input value={edit.rc || ""} onChange={(e) => set("rc", e.target.value)} /></Field>
            <Field label="AI / NIS"><Input value={edit.ai || ""} onChange={(e) => set("ai", e.target.value)} /></Field>
            <Field label={t("opening_balance")}><Input type="number" step="any" value={edit.openingBalance ?? ""} onChange={(e) => setEdit((x) => ({ ...x, openingBalance: e.target.value === "" ? undefined : parseFloat(e.target.value) }))} /></Field>
            {kind === "clients" && <Field label={t("credit_limit")}><Input type="number" step="any" value={edit.creditLimit ?? ""} onChange={(e) => setEdit((x) => ({ ...x, creditLimit: e.target.value === "" ? undefined : parseFloat(e.target.value) }))} /></Field>}
            <Field label={t("notes")} className="sm:col-span-2"><Textarea value={edit.notes || ""} onChange={(e) => set("notes", e.target.value)} /></Field>
          </div>
        )}
      </Modal>
      <Confirm open={!!del} message={t("confirm_delete", { name: del?.name || "" })} onNo={() => setDel(null)} onYes={async () => { if (del) await removeParty(kind, del.id); setDel(null); }} />
    </div>
  );
}
