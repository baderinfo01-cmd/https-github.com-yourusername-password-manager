"use client";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge, Button, Card, Empty, Field, Input, Modal, PageHeader, Select, Stat } from "@/components/ui";
import { todayIso } from "@/lib/calc";
import { fmtDate, useT } from "@/lib/i18n";
import type { Task } from "@/lib/types";
import { useData } from "@/store/data";
import { useUi } from "@/store/ui";

const TONE = { high: "bad", normal: "info", low: "muted" } as const;

export default function Tasks() {
  const t = useT();
  const lang = useUi((s) => s.lang);
  const { tasks, saveTask, removeTask } = useData();
  const [filter, setFilter] = useState<"open" | "done" | "all">("open");
  const [edit, setEdit] = useState<Partial<Task> | null>(null);
  const today = todayIso();

  const list = useMemo(
    () => tasks.filter((x) => (filter === "all" ? true : filter === "done" ? x.done : !x.done))
      .sort((a, b) => Number(a.done) - Number(b.done) || (a.due || "9999").localeCompare(b.due || "9999")),
    [tasks, filter]
  );
  const open = tasks.filter((x) => !x.done);
  const overdue = open.filter((x) => x.due && x.due < today).length;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t("tasks")} subtitle={t("tasks_hint")} actions={<Button onClick={() => setEdit({ title: "", priority: "normal", done: false, due: today })}><Plus size={16} />{t("add_task")}</Button>} />
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <Stat label={t("open_tasks")} value={open.length} tone="info" /><Stat label={t("pay_overdue")} value={overdue} tone={overdue ? "bad" : "ok"} /><Stat label={t("done")} value={tasks.length - open.length} tone="ok" />
      </div>
      <div className="mb-3 flex gap-2">{(["open", "done", "all"] as const).map((k) => <button key={k} onClick={() => setFilter(k)} className={`pill rounded-full border px-4 py-1.5 text-sm ${filter === k ? "border-accent bg-accent text-white" : "border-line bg-surface text-muted"}`}>{t(k === "open" ? "open_tasks" : k === "done" ? "done" : "all")}</button>)}</div>
      <Card pad={false}>
        {list.length === 0 ? <Empty text={t("no_data")} /> : (
          <ul className="divide-y divide-line">
            {list.map((x) => (
              <li key={x.id} className="flex items-center gap-3 px-4 py-3">
                <input type="checkbox" checked={x.done} onChange={(e) => saveTask({ ...x, done: e.target.checked, doneAt: e.target.checked ? Date.now() : undefined })} className="h-5 w-5 accent-[var(--accent)]" aria-label={t("done")} />
                <div className="min-w-0 flex-1">
                  <div className={x.done ? "text-muted line-through" : "font-medium"}>{x.title}</div>
                  {x.note && <div className="truncate text-xs text-muted">{x.note}</div>}
                </div>
                {x.due && <span className={`num text-xs ${!x.done && x.due < today ? "font-bold text-bad" : "text-muted"}`}>{fmtDate(x.due, lang)}</span>}
                <Badge tone={TONE[x.priority]}>{t("prio_" + x.priority)}</Badge>
                <button onClick={() => setEdit(x)} className="rounded p-1.5 text-muted hover:bg-surface2" aria-label={t("edit")}><Pencil size={15} /></button>
                <button onClick={() => removeTask(x.id)} className="rounded p-1.5 text-bad hover:bg-bad/10" aria-label={t("delete")}><Trash2 size={15} /></button>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? t("edit") : t("add_task")} footer={<><Button variant="secondary" onClick={() => setEdit(null)}>{t("cancel")}</Button><Button onClick={async () => { if (!edit?.title?.trim()) return; await saveTask({ ...edit, title: edit.title.trim() }); setEdit(null); }}>{t("save")}</Button></>}>
        {edit && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("task_title")} className="sm:col-span-2"><Input value={edit.title || ""} onChange={(e) => setEdit({ ...edit, title: e.target.value })} autoFocus /></Field>
            <Field label={t("due_date")}><Input type="date" value={edit.due || ""} onChange={(e) => setEdit({ ...edit, due: e.target.value || undefined })} /></Field>
            <Field label={t("priority")}><Select value={edit.priority} onChange={(e) => setEdit({ ...edit, priority: e.target.value as any })}>{["high", "normal", "low"].map((p) => <option key={p} value={p}>{t("prio_" + p)}</option>)}</Select></Field>
            <Field label={t("notes")} className="sm:col-span-2"><Input value={edit.note || ""} onChange={(e) => setEdit({ ...edit, note: e.target.value })} /></Field>
          </div>
        )}
      </Modal>
    </div>
  );
}
