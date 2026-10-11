"use client";
import { useEffect, useState } from "react";
import { Button, Field, Input, Modal, Select } from "./ui";
import { num, round, todayIso } from "@/lib/calc";
import { PAYMENT_METHODS } from "@/lib/defaults";
import { useT } from "@/lib/i18n";
import type { Doc } from "@/lib/types";
import { useData } from "@/store/data";
import { useUi } from "@/store/ui";

/** Records a payment: against one document (doc given) or on account for a party. */
export function PaymentModal({ open, onClose, doc, due, kind, partyId }: { open: boolean; onClose: () => void; doc?: Doc; due?: number; kind: "in" | "out"; partyId?: string }) {
  const t = useT();
  const addPayment = useData((s) => s.addPayment);
  const notify = useUi((s) => s.notify);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayIso());
  const [method, setMethod] = useState("cash");
  const [ref, setRef] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) { setAmount(due && due > 0 ? String(round(due)) : ""); setDate(todayIso()); setMethod("cash"); setRef(""); setNote(""); }
  }, [open, due]);

  const submit = async () => {
    const a = round(num(amount));
    if (a <= 0) return notify(t("amount_required"), "err");
    if (doc && due !== undefined && a > due + 0.005) return notify(t("exceeds_due"), "err");
    setBusy(true);
    try {
      await addPayment({ docId: doc?.id, partyId: doc?.partyId || partyId, kind, amount: a, date, method, ref, note });
      notify(t("payment_saved"));
      onClose();
    } catch { notify(t("error"), "err"); } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={doc ? `${t("record_payment")} — ${doc.number}` : t("record_payment")} footer={<><Button variant="secondary" onClick={onClose}>{t("cancel")}</Button><Button onClick={submit} disabled={busy}>{t("save")}</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("amount")}><Input type="number" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus /></Field>
        <Field label={t("date")}><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label={t("method")}><Select value={method} onChange={(e) => setMethod(e.target.value)}>{PAYMENT_METHODS.map((m) => <option key={m} value={m}>{t("m_" + m)}</option>)}</Select></Field>
        <Field label={t("reference")}><Input value={ref} onChange={(e) => setRef(e.target.value)} /></Field>
        <Field label={t("notes")} className="sm:col-span-2"><Input value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}
