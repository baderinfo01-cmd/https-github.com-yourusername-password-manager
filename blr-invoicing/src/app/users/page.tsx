"use client";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Card, Confirm, Empty, Field, Input, Modal, PageHeader, Select, Table, Td } from "@/components/ui";
import { blr, call } from "@/lib/api";
import { useT } from "@/lib/i18n";
import type { Role, User } from "@/lib/types";
import { can, useUi } from "@/store/ui";

export default function Users() {
  const t = useT();
  const me = useUi((s) => s.user);
  const notify = useUi((s) => s.notify);
  const [users, setUsers] = useState<User[]>([]);
  const [edit, setEdit] = useState<(Partial<User> & { password?: string }) | null>(null);
  const [del, setDel] = useState<User | null>(null);
  const load = useCallback(() => call<User[]>(blr().auth.users()).then(setUsers).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);
  if (!can(me?.role, "*")) return <Empty text={t("no_permission")} />;

  const err = (e: any) => notify(t("err_" + (e?.message || "generic")) , "err");
  const save = async () => {
    if (!edit) return;
    try {
      await call(blr().auth.saveUser(edit));
      setEdit(null); load(); notify(t("saved"));
    } catch (e) { err(e); }
  };
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={t("users")} subtitle={t("users_hint")} actions={<Button onClick={() => setEdit({ name: "", username: "", role: "cashier", password: "" })}><Plus size={16} />{t("add_user")}</Button>} />
      <Card pad={false}>
        <Table head={[t("name"), t("username"), t("role"), t("status"), ""]}>
          {users.map((u) => (
            <tr key={u.id}>
              <Td className="font-medium">{u.name}</Td><Td className="num">{u.username}</Td><Td><Badge tone={u.role === "admin" ? "info" : "muted"}>{t("role_" + u.role)}</Badge></Td>
              <Td><Badge tone={u.active === false ? "bad" : "ok"}>{u.active === false ? t("disabled") : t("active")}</Badge></Td>
              <Td className="text-end whitespace-nowrap">
                <button onClick={() => setEdit({ ...u, password: "" })} className="rounded p-1.5 text-muted hover:bg-surface2" aria-label={t("edit")}><Pencil size={15} /></button>
                {u.id !== me?.id && <button onClick={() => setDel(u)} className="rounded p-1.5 text-bad hover:bg-bad/10" aria-label={t("delete")}><Trash2 size={15} /></button>}
              </Td>
            </tr>
          ))}
        </Table>
      </Card>
      <Card className="mt-5" title={t("roles_title")}>
        <ul className="space-y-1.5 text-sm text-muted">{(["admin", "manager", "cashier", "accountant"] as Role[]).map((r) => <li key={r}><b className="text-ink">{t("role_" + r)}</b> — {t("roledesc_" + r)}</li>)}</ul>
      </Card>
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? t("edit") : t("add_user")} footer={<><Button variant="secondary" onClick={() => setEdit(null)}>{t("cancel")}</Button><Button onClick={save}>{t("save")}</Button></>}>
        {edit && (
          <div className="grid gap-4">
            <Field label={t("full_name")}><Input value={edit.name || ""} onChange={(e) => setEdit({ ...edit, name: e.target.value })} autoFocus /></Field>
            {!edit.id && <Field label={t("username")}><Input value={edit.username || ""} onChange={(e) => setEdit({ ...edit, username: e.target.value })} /></Field>}
            <Field label={t("role")}><Select value={edit.role} onChange={(e) => setEdit({ ...edit, role: e.target.value as Role })}>{(["admin", "manager", "cashier", "accountant"] as Role[]).map((r) => <option key={r} value={r}>{t("role_" + r)}</option>)}</Select></Field>
            <Field label={edit.id ? t("new_password_optional") : t("password")}><Input type="password" value={edit.password || ""} onChange={(e) => setEdit({ ...edit, password: e.target.value })} autoComplete="new-password" /></Field>
            {edit.id && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={edit.active !== false} onChange={(e) => setEdit({ ...edit, active: e.target.checked })} />{t("active")}</label>}
          </div>
        )}
      </Modal>
      <Confirm open={!!del} message={t("confirm_delete", { name: del?.name || "" })} onNo={() => setDel(null)} onYes={async () => { try { if (del) await call(blr().auth.deleteUser(del.id)); load(); } catch (e) { err(e); } setDel(null); }} />
    </div>
  );
}
