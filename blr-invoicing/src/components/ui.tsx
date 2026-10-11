"use client";
import clsx from "clsx";
import { X } from "lucide-react";
import { useEffect, type ComponentProps, type ReactNode } from "react";
import { useT } from "@/lib/i18n";
import { useUi } from "@/store/ui";

export function Button({ variant = "primary", size = "md", className, ...p }: ComponentProps<"button"> & { variant?: "primary" | "secondary" | "ghost" | "danger" | "success"; size?: "sm" | "md" }) {
  return (
    <button
      {...p}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-accent",
        size === "sm" ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm",
        variant === "primary" && "bg-accent text-white hover:bg-accent2",
        variant === "success" && "bg-ok text-white hover:opacity-90",
        variant === "secondary" && "border border-line bg-surface text-ink hover:bg-surface2",
        variant === "ghost" && "text-muted hover:bg-surface2 hover:text-ink",
        variant === "danger" && "bg-bad text-white hover:opacity-90",
        className
      )}
    />
  );
}

const field = "w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-60";
export const Input = (p: ComponentProps<"input">) => <input {...p} className={clsx(field, "h-10", p.className)} />;
export const Select = (p: ComponentProps<"select">) => <select {...p} className={clsx(field, "h-10", p.className)} />;
export const Textarea = (p: ComponentProps<"textarea">) => <textarea {...p} className={clsx(field, "min-h-20 py-2", p.className)} />;

export function Field({ label, children, className, hint }: { label: string; children: ReactNode; className?: string; hint?: string }) {
  return (
    <label className={clsx("block space-y-1.5", className)}>
      <span className="text-xs font-medium text-muted">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-muted">{hint}</span>}
    </label>
  );
}

export function Card({ title, actions, children, className, pad = true }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={clsx("rounded-xl border border-line bg-surface shadow-sm", className)}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <h2 className="text-sm font-semibold">{title}</h2>
          <div className="flex items-center gap-2">{actions}</div>
        </header>
      )}
      <div className={pad ? "p-4" : ""}>{children}</div>
    </section>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">{actions}</div>
    </div>
  );
}

const TONES: Record<string, string> = {
  ok: "bg-ok/12 text-ok", warn: "bg-warn/15 text-warn", bad: "bg-bad/12 text-bad", info: "bg-accent/12 text-accent", muted: "bg-muted/15 text-muted",
};
export const Badge = ({ tone = "muted", children }: { tone?: keyof typeof TONES; children: ReactNode }) => (
  <span className={clsx("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap", TONES[tone])}>{children}</span>
);

export function Stat({ label, value, sub, tone, icon }: { label: string; value: ReactNode; sub?: ReactNode; tone?: "ok" | "bad" | "warn" | "info"; icon?: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-sm">
      <div className="flex items-center justify-between text-xs text-muted">
        <span>{label}</span>
        {icon && <span className={clsx("grid h-8 w-8 place-items-center rounded-lg", tone ? TONES[tone] : TONES.info)}>{icon}</span>}
      </div>
      <div className="num mt-2 text-2xl font-bold">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="no-print fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-[6vh]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" className={clsx("pop w-full rounded-2xl border border-line bg-surface shadow-2xl", wide ? "max-w-3xl" : "max-w-lg")}>
        <header className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} aria-label="close" className="rounded-md p-1 text-muted hover:bg-surface2"><X size={18} /></button>
        </header>
        <div className="max-h-[68vh] overflow-y-auto p-5">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t border-line px-5 py-3.5">{footer}</footer>}
      </div>
    </div>
  );
}

export function Confirm({ open, message, onYes, onNo }: { open: boolean; message: string; onYes: () => void; onNo: () => void }) {
  const t = useT();
  return (
    <Modal open={open} onClose={onNo} title={t("confirm")} footer={<><Button variant="secondary" onClick={onNo}>{t("cancel")}</Button><Button variant="danger" onClick={onYes}>{t("delete")}</Button></>}>
      <p>{message}</p>
    </Modal>
  );
}

export function Empty({ text, action }: { text: string; action?: ReactNode }) {
  return (
    <div className="grid place-items-center gap-3 px-4 py-14 text-center text-muted">
      <div className="text-sm">{text}</div>
      {action}
    </div>
  );
}

export function Table({ head, children, className }: { head: ReactNode[]; children: ReactNode; className?: string }) {
  return (
    <div className={clsx("overflow-x-auto", className)}>
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line bg-surface2 text-xs text-muted">
            {head.map((h, i) => <th key={i} className="px-3 py-2.5 text-start font-medium whitespace-nowrap">{h}</th>)}
          </tr>
        </thead>
        <tbody className="[&>tr]:border-b [&>tr]:border-line [&>tr:hover]:bg-surface2/60 [&>tr:last-child]:border-0">{children}</tbody>
      </table>
    </div>
  );
}
export const Td = ({ className, ...p }: ComponentProps<"td">) => <td {...p} className={clsx("px-3 py-2.5 align-middle", className)} />;

export function Toast() {
  const toast = useUi((s) => s.toast);
  if (!toast) return null;
  return (
    <div className={clsx("pop no-print fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-xl px-5 py-3 text-sm font-medium text-white shadow-xl", toast.kind === "ok" ? "bg-ok" : "bg-bad")}>
      {toast.msg}
    </div>
  );
}
