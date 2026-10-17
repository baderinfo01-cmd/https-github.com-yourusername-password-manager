"use client";
import { Download, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { NewParam } from "@/components/NewParam";
import { Badge, Button, Card, Confirm, Empty, Field, Input, Modal, PageHeader, Table, Td, Textarea } from "@/components/ui";
import { api, call } from "@/lib/api";
import { num } from "@/lib/calc";
import { toCsv, useMoney } from "@/lib/hooks";
import { useT } from "@/lib/i18n";
import type { __Type__ } from "@/lib/types";
import { use__Type__Store } from "@/store/__kind__";
import { can, useUi } from "@/store/ui";

const EMPTY: Partial<__Type__> = { name: "", amount: 0, active: true };

export default function __Type__Page() {
  const t = useT();
  const money = useMoney();
  const role = useUi((s) => s.user?.role);
  const notify = useUi((s) => s.notify);
  const { rows: all, load, save, remove } = use__Type__Store();
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<Partial<__Type__> | null>(null);
  const [del, setDel] = useState<__Type__ | null>(null);
  const writable = can(role, "__perm__");
  useEffect(() => { load().catch(() => {}); }, [load]);

  const rows = useMemo(() => {
    const k = q.trim().toLowerCase();
    return all.filter((r) => !k || [r.name, r.category].some((v) => v?.toLowerCase().includes(k))).sort((a, b) => a.name.localeCompare(b.name));
  }, [all, q]);

  if (!can(role, "__perm__:read")) return <Empty text={t("no_permission")} />;

  const doSave = async () => {
    if (!edit?.name?.trim()) return notify(t("name_required"), "err");
    try {
      await save({ ...edit, name: edit.name.trim(), amount: num(edit.amount) });
      setEdit(null);
      notify(t("saved"));
    } catch (e: any) { notify(t("err_" + (e?.message || "generic")), "err"); }
  };
  const exportCsv = async () => {
    const r = await call<{ saved: boolean }>(api().file.saveText("__kind__.csv", toCsv([[t("name"), t("category"), t("amount")], ...rows.map((x) => [x.name, x.category || "", x.amount])])));
    if (r.saved) notify(t("saved"));
  };
  const set = (k: keyof __Type__, v: string) => setEdit((e) => ({ ...e, [k]: v }));

  return (
    <div className="mx-auto max-w-5xl">
      <NewParam onNew={() => writable && setEdit(EMPTY)} />
      <PageHeader
        title={t("__kind__")} subtitle={`${all.length}`}
        actions={<>
          <Button variant="secondary" size="sm" onClick={exportCsv}><Download size={14} />{t("export")}</Button>
          {writable && <Button onClick={() => setEdit(EMPTY)}><Plus size={16} />{t("add___single__")}</Button>}
        </>}
      />
      <Card pad={false}>
        <div className="border-b border-line p-3">
          <div className="relative max-w-sm">
            <Search size={15} className="pointer-events-none absolute start-3 top-3 text-muted" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} className="ps-9" aria-label={t("search")} />
          </div>
        </div>
        {rows.length === 0 ? <Empty text={t("no_data")} /> : (
          <Table head={[t("name"), t("category"), t("amount"), t("status"), ""]}>
            {rows.map((r) => (
              <tr key={r.id}>
                <Td className="font-medium">{r.name}</Td><Td>{r.category || "—"}</Td><Td className="num">{money(r.amount)}</Td>
                <Td><Badge tone={r.active === false ? "bad" : "ok"}>{r.active === false ? t("disabled") : t("active")}</Badge></Td>
                <Td className="whitespace-nowrap text-end">
                  {writable && <button onClick={() => setEdit(r)} className="rounded p-1.5 text-muted hover:bg-surface2" aria-label={t("edit")}><Pencil size={15} /></button>}
                  {can(role, "delete") && <button onClick={() => setDel(r)} className="rounded p-1.5 text-bad hover:bg-bad/10" aria-label={t("delete")}><Trash2 size={15} /></button>}
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? t("edit___single__") : t("add___single__")} footer={<><Button variant="secondary" onClick={() => setEdit(null)}>{t("cancel")}</Button><Button onClick={doSave}>{t("save")}</Button></>}>
        {edit && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("name") + " *"} className="sm:col-span-2"><Input value={edit.name || ""} onChange={(e) => set("name", e.target.value)} autoFocus /></Field>
            <Field label={t("category")}><Input value={edit.category || ""} onChange={(e) => set("category", e.target.value)} /></Field>
            <Field label={t("amount")}><Input inputMode="decimal" className="num" value={edit.amount ?? ""} onChange={(e) => set("amount", e.target.value)} /></Field>
            <Field label={t("notes")} className="sm:col-span-2"><Textarea value={edit.notes || ""} onChange={(e) => set("notes", e.target.value)} /></Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={edit.active !== false} onChange={(e) => setEdit({ ...edit, active: e.target.checked })} />{t("active")}</label>
          </div>
        )}
      </Modal>
      <Confirm open={!!del} message={t("confirm_delete", { name: del?.name || "" })} onNo={() => setDel(null)} onYes={async () => { if (del) await remove(del.id); setDel(null); notify(t("deleted")); }} />
    </div>
  );
}
