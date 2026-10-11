"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "./ui";
import type { Item } from "@/lib/types";

/** Description box that suggests catalogue items as you type (also matches SKU / scanned barcode). */
export function ItemPicker({ value, items, onText, onPick, placeholder, autoFocus }: { value: string; items: Item[]; onText: (v: string) => void; onPick: (i: Item) => void; placeholder?: string; autoFocus?: boolean }) {
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const matches = useMemo(() => {
    const k = value.trim().toLowerCase();
    if (!k) return items.slice(0, 8);
    return items.filter((i) => [i.name, i.sku, i.barcode].some((v) => v?.toLowerCase().includes(k))).slice(0, 8);
  }, [value, items]);

  const pick = (i: Item) => { onPick(i); setOpen(false); };
  return (
    <div ref={ref} className="relative">
      <Input
        value={value} placeholder={placeholder} autoFocus={autoFocus}
        onFocus={() => { setOpen(true); setHi(0); }}
        onChange={(e) => { onText(e.target.value); setOpen(true); setHi(0); }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => Math.min(h + 1, matches.length - 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
          else if (e.key === "Enter" && open && matches[hi]) {
            const exact = items.find((i) => i.barcode && i.barcode === value.trim());
            if (exact || value.trim()) { e.preventDefault(); pick(exact || matches[hi]); }
          } else if (e.key === "Escape") setOpen(false);
        }}
      />
      {open && matches.length > 0 && (
        <ul className="absolute inset-x-0 top-full z-30 mt-1 max-h-60 overflow-y-auto rounded-lg border border-line bg-surface py-1 shadow-xl">
          {matches.map((i, idx) => (
            <li key={i.id}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(i)} className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-start text-sm ${idx === hi ? "bg-accent/10" : "hover:bg-surface2"}`}>
                <span className="truncate">{i.name}{i.sku && <span className="ms-2 text-xs text-muted">{i.sku}</span>}</span>
                {i.trackStock && <span className={`num text-xs ${i.stock <= 0 ? "text-bad" : "text-muted"}`}>{i.stock}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
