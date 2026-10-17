"use client";
import { Package, Wallet } from "lucide-react";
import { Card, PageHeader, Stat } from "@/components/ui";
import { num } from "@/lib/calc";
import { useMoney } from "@/lib/hooks";
import { useT } from "@/lib/i18n";
import { useData } from "@/store/data";
import { useUi } from "@/store/ui";

export default function Dashboard() {
  const t = useT();
  const money = useMoney();
  const user = useUi((s) => s.user);
  const items = useData((s) => s.items);
  const value = items.reduce((a, i) => a + num(i.qty) * num(i.price), 0);
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title={t("welcome_dashboard", { name: user?.name || "" })} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label={t("total_items")} value={items.length} icon={<Package size={20} />} />
        <Stat label={t("stock_value")} value={money(value)} tone="ok" icon={<Wallet size={20} />} />
      </div>
      <Card className="mt-5"><p className="text-sm text-muted">{t("dashboard_hint")}</p></Card>
    </div>
  );
}
