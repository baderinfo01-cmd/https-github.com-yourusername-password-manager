"use client";
import { ArrowLeft, FileDown, Mail, MessageCircle, Pencil, Printer, Receipt, Repeat, Trash2, Wallet } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { PaymentModal } from "@/components/PaymentModal";
import { Badge, Button, Card, Confirm, Empty } from "@/components/ui";
import { blr, call } from "@/lib/api";
import { buildDocHtml } from "@/lib/invoiceHtml";
import { PAY_TONE, useDocRows, useMoney, usePayLabel } from "@/lib/hooks";
import { fmtDate, useT } from "@/lib/i18n";
import type { DocType } from "@/lib/types";
import { useData } from "@/store/data";
import { can, useUi } from "@/store/ui";

const CONVERT: Partial<Record<DocType, DocType[]>> = {
  quote: ["invoice", "proforma", "delivery"], proforma: ["invoice", "delivery"], order: ["purchase"], invoice: ["delivery", "credit"], delivery: ["invoice"],
};

function Inner() {
  const t = useT();
  const money = useMoney();
  const payLabel = usePayLabel();
  const router = useRouter();
  const id = useSearchParams().get("id") || "";
  const lang = useUi((s) => s.lang);
  const role = useUi((s) => s.user?.role);
  const notify = useUi((s) => s.notify);
  const { settings, clients, suppliers, payments, removePayment, convert, saveDoc, removeDoc } = useData();
  const row = useDocRows().find((r) => r.doc.id === id);
  const doc = row?.doc;
  const [html, setHtml] = useState("");
  const [pay, setPay] = useState(false);
  const [delPay, setDelPay] = useState<string | null>(null);
  const [delDoc, setDelDoc] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(Math.min(1, el.clientWidth / 794)));
    ro.observe(el);
    return () => ro.disconnect();
  });

  const party = useMemo(() => (doc ? [...clients, ...suppliers].find((p) => p.id === doc.partyId) : undefined), [doc, clients, suppliers]);
  useEffect(() => {
    if (!doc || !row) return;
    let live = true;
    buildDocHtml(doc, { lang, settings, party, paid: row.paid, credits: row.credits }).then((h) => live && setHtml(h));
    return () => { live = false; };
  }, [doc, row, lang, settings, party]);

  if (!doc || !row) return <Empty text={t("not_found")} />;
  const isPurchase = doc.type === "purchase" || doc.type === "order";
  const perm = isPurchase ? "purchases" : "sales";
  const hasPay = doc.type === "invoice" || doc.type === "purchase";
  const myPayments = payments.filter((p) => p.docId === doc.id);

  const doPrint = async (paper: "a4" | "thermal") => {
    const h = await buildDocHtml(doc, { lang, settings, party, paid: row.paid, credits: row.credits, paper });
    await call(blr().print.html(h, { paper }));
  };
  const doPdf = async () => {
    const h = await buildDocHtml(doc, { lang, settings, party, paid: row.paid, credits: row.credits });
    const r = await call<{ saved: boolean }>(blr().print.pdf(h, `${doc.number}.pdf`));
    if (r.saved) notify(t("saved"));
  };
  const doConvert = async (to: DocType) => {
    const c = await convert(doc.id, to);
    notify(t("created", { n: c.number }));
    router.push(`/documents/view/?id=${c.id}`);
  };
  const shareText = `${t("t_" + doc.type)} ${doc.number}\n${settings.company.name}\n${t("total")}: ${money(doc.total)}${row.due > 0 && hasPay ? `\n${t("balance_due")}: ${money(row.due)}` : ""}`;
  const wa = () => call(blr().app.openExternal(`https://wa.me/${(party?.phone || "").replace(/[^\d]/g, "")}?text=${encodeURIComponent(shareText)}`));
  const mail = () => call(blr().app.openExternal(`mailto:${party?.email || ""}?subject=${encodeURIComponent(`${t("t_" + doc.type)} ${doc.number}`)}&body=${encodeURIComponent(shareText)}`));

  return (
    <div className="mx-auto max-w-6xl">
      <Link href={`/documents/?type=${doc.type}`} className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft size={14} className="rtl:rotate-180" />{t("back")}</Link>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">{t("t_" + doc.type)} {doc.number}</h1>
          {row.pay ? <Badge tone={PAY_TONE[row.pay]}>{payLabel(row.pay)}</Badge> : <Badge tone="info">{t("s_" + doc.status)}</Badge>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => doPrint("a4")}><Printer size={14} />{t("print")} A4</Button>
          <Button variant="secondary" size="sm" onClick={() => doPrint("thermal")}><Receipt size={14} />{t("print_thermal")}</Button>
          <Button variant="secondary" size="sm" onClick={doPdf}><FileDown size={14} />PDF</Button>
          <Button variant="secondary" size="sm" onClick={wa}><MessageCircle size={14} />WhatsApp</Button>
          <Button variant="secondary" size="sm" onClick={mail}><Mail size={14} />Email</Button>
          {can(role, perm) && <Link href={`/documents/edit/?type=${doc.type}&id=${doc.id}`}><Button variant="secondary" size="sm"><Pencil size={14} />{t("edit")}</Button></Link>}
          {can(role, "delete") && <Button variant="ghost" size="sm" onClick={() => setDelDoc(true)}><Trash2 size={14} className="text-bad" /></Button>}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div ref={box} className="overflow-hidden rounded-xl border border-line bg-white shadow-sm" style={{ height: 1123 * scale, direction: "ltr" }}>
          <iframe title="preview" srcDoc={html} sandbox="" className="block border-0 bg-white" style={{ width: 794, height: 1123, transform: `scale(${scale})`, transformOrigin: "top left" }} />
        </div>
        <div className="space-y-5">
          {hasPay && (
            <Card title={t("payments")}>
              <div className="mb-3 space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-muted">{t("total")}</span><span className="num font-semibold">{money(doc.total)}</span></div>
                <div className="flex justify-between"><span className="text-muted">{t("paid")}</span><span className="num text-ok">{money(row.paid)}</span></div>
                {row.credits > 0 && <div className="flex justify-between"><span className="text-muted">{t("credits_applied")}</span><span className="num">{money(row.credits)}</span></div>}
                <div className="flex justify-between border-t border-line pt-1.5 font-bold"><span>{t("balance_due")}</span><span className="num text-warn">{money(row.due)}</span></div>
              </div>
              {can(role, "payments") && row.due > 0 && doc.status !== "draft" && doc.status !== "void" && <Button className="w-full" onClick={() => setPay(true)}><Wallet size={15} />{t("record_payment")}</Button>}
              {myPayments.length > 0 && (
                <ul className="mt-3 divide-y divide-line text-sm">
                  {myPayments.sort((a, b) => b.date.localeCompare(a.date)).map((p) => (
                    <li key={p.id} className="flex items-center justify-between py-2">
                      <span><span className="num font-medium">{money(p.amount)}</span><span className="block text-xs text-muted">{fmtDate(p.date, lang)} · {t("m_" + p.method)}</span></span>
                      {can(role, "delete") && <button onClick={() => setDelPay(p.id)} className="rounded p-1.5 text-bad hover:bg-bad/10" aria-label={t("delete")}><Trash2 size={14} /></button>}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
          {can(role, perm) && (CONVERT[doc.type] || []).length > 0 && (
            <Card title={t("convert_to")}>
              <div className="grid gap-2">
                {(CONVERT[doc.type] || []).map((to) => <Button key={to} variant="secondary" onClick={() => doConvert(to)}><Repeat size={14} />{t("t_" + to)}</Button>)}
              </div>
            </Card>
          )}
          {doc.type === "quote" && doc.status !== "accepted" && can(role, "sales") && (
            <Button variant="success" className="w-full" onClick={async () => { await saveDoc({ ...doc, status: "accepted" }); notify(t("saved")); }}>{t("mark_accepted")}</Button>
          )}
        </div>
      </div>
      <PaymentModal open={pay} onClose={() => setPay(false)} doc={doc} due={row.due} kind={doc.type === "purchase" ? "out" : "in"} />
      <Confirm open={!!delPay} message={t("confirm_delete_payment")} onNo={() => setDelPay(null)} onYes={async () => { if (delPay) await removePayment(delPay); setDelPay(null); }} />
      <Confirm open={delDoc} message={t("confirm_delete", { name: doc.number })} onNo={() => setDelDoc(false)} onYes={async () => { await removeDoc(doc.id); router.push(`/documents/?type=${doc.type}`); }} />
    </div>
  );
}
export default function Page() { return <Suspense><Inner /></Suspense>; }
