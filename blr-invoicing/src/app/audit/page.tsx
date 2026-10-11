"use client";
import { useState } from "react";
import { Badge, Card, Empty, Input, PageHeader, Table, Td } from "@/components/ui";
import { fmtDate, useT } from "@/lib/i18n";
import { useData } from "@/store/data";
import { can, useUi } from "@/store/ui";

export default function Audit() {
  const t = useT();
  const lang = useUi((s) => s.lang);
  const role = useUi((s) => s.user?.role);
  const audit = useData((s) => s.audit);
  const [q, setQ] = useState("");
  if (!can(role, "*")) return <Empty text={t("no_permission")} />;
  const rows = audit.filter((a) => !q || `${a.action} ${a.user} ${JSON.stringify(a.detail || {})}`.toLowerCase().includes(q.toLowerCase())).slice(0, 500);
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title={t("audit")} subtitle={t("audit_hint")} />
      <Card pad={false}>
        <div className="border-b border-line p-3"><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} className="max-w-sm" /></div>
        {rows.length === 0 ? <Empty text={t("no_data")} /> : (
          <Table head={[t("date"), t("username"), t("action"), t("details")]}>
            {rows.map((a) => (
              <tr key={a.id}>
                <Td className="num whitespace-nowrap">{fmtDate(new Date(a.at).toISOString(), lang)} {new Date(a.at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</Td>
                <Td>{a.user || "—"}</Td><Td><Badge tone={a.action === "login-failed" ? "bad" : a.action.startsWith("delete") ? "warn" : "info"}>{a.action}</Badge></Td>
                <Td className="num text-xs text-muted">{a.detail && Object.keys(a.detail).length ? JSON.stringify(a.detail) : ""}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
