"use client";

import { useMemo, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import AppLayout from "@/components/layout/AppLayout";
import { useStore } from "@/store/useStore";
import { CATEGORIES } from "@/types";
import {
  TrendingUp,
  Users,
  Calendar,
  CreditCard,
  FileText,
  Phone,
  Activity,
  Clock,
  Star,
  AlertCircle,
  DollarSign,
  BarChart3,
} from "lucide-react";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const locale = useLocale();

  const accounts = useStore((state) => state.accounts);
  const subscriptions = useStore((state) => state.subscriptions);
  const cards = useStore((state) => state.cards);
  const documents = useStore((state) => state.documents);
  const contacts = useStore((state) => state.contacts);
  const activityLog = useStore((state) => state.activityLog);

  const localeForDate =
    locale === "ar" ? "ar-DZ" : locale === "fr" ? "fr-FR" : "en-US";

  const categoryLabels = t.raw("categories") as Record<string, string>;

  const stats = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const activeSubs = subscriptions.filter((s) => s.status === "active");

    const expiringSubs = subscriptions.filter((s) => {
      const days = Math.ceil(
        (new Date(s.endDate).getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      return days <= 7 && days > 0;
    });

    const totalSpent = subscriptions.reduce((sum, s) => sum + s.price, 0);

    const monthlySpent = subscriptions
      .filter((s) => new Date(s.createdAt) > thirtyDaysAgo)
      .reduce((sum, s) => sum + s.price, 0);

    return {
      accounts: accounts.length,
      accountsAdded: accounts.filter(
        (a) => new Date(a.createdAt) > sevenDaysAgo
      ).length,
      subscriptions: subscriptions.length,
      activeSubscriptions: activeSubs.length,
      expiringSubscriptions: expiringSubs.length,
      cards: cards.length,
      documents: documents.length,
      contacts: contacts.length,
      favorites: accounts.filter((a) => a.isFavorite).length,
      totalSpent,
      monthlySpent,
    };
  }, [accounts, subscriptions, cards, documents, contacts]);

  const categoryData = useMemo(() => {
    const data: Record<string, number> = {};

    accounts.forEach((acc) => {
      data[acc.category] = (data[acc.category] || 0) + 1;
    });

    return Object.entries(data)
      .map(([key, value]) => ({
        category:
          categoryLabels[key] ||
          CATEGORIES.find((c) => c.value === key)?.label ||
          key,
        value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [accounts, categoryLabels]);

  const weeklyActivity = useMemo(() => {
    const days = [
      t("days.sunday"),
      t("days.monday"),
      t("days.tuesday"),
      t("days.wednesday"),
      t("days.thursday"),
      t("days.friday"),
      t("days.saturday"),
    ];

    return days.map((day, idx) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - idx));

      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const count = activityLog.filter((log) => {
        const logDate = new Date(log.createdAt);
        return logDate >= dayStart && logDate <= dayEnd;
      }).length;

      return { day, count };
    });
  }, [activityLog, t]);

  const expiringSoon = useMemo(() => {
    return subscriptions
      .filter((s) => {
        const days = Math.ceil(
          (new Date(s.endDate).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        );

        return days <= 30 && days > 0 && s.status === "active";
      })
      .sort((a, b) => {
        const daysA = Math.ceil(
          (new Date(a.endDate).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        );

        const daysB = Math.ceil(
          (new Date(b.endDate).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        );

        return daysA - daysB;
      })
      .slice(0, 3);
  }, [subscriptions]);

  const recentActivity = activityLog.slice(0, 5);

  const maxCategoryValue = Math.max(...categoryData.map((c) => c.value), 1);
  const maxActivityCount = Math.max(...weeklyActivity.map((w) => w.count), 1);

  const formatRemainingDays = (days: number) => {
    if (days === 0) return t("expiring.today");
    if (days === 1) return t("expiring.tomorrow");

    return t("expiring.afterDays", { days });
  };

  const getActivityActionLabel = (type: string) => {
    if (type === "add") return t("activity.actions.add");
    if (type === "delete") return t("activity.actions.delete");
    if (type === "edit") return t("activity.actions.edit");

    return t("activity.actions.other");
  };

  const getActivityItemTypeLabel = (itemType: string) => {
    const itemTypes = t.raw("activity.itemTypes") as Record<string, string>;
    return itemTypes[itemType] || itemType;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Welcome */}
        <div className="glass rounded-2xl p-6 bg-gradient-to-r from-blue-50 to-purple-50">
          <h1 className="text-3xl font-bold mb-1">
            👋 {t("welcome.title")}
          </h1>

          <p className="text-gray-600">
            {t.rich("welcome.summary", {
              accounts: stats.accounts,
              subscriptions: stats.activeSubscriptions,
              accountsStrong: (chunks) => (
                <span className="font-bold text-primary">{chunks}</span>
              ),
              subscriptionsStrong: (chunks) => (
                <span className="font-bold text-green-600">{chunks}</span>
              ),
            })}
          </p>
        </div>

        {/* Expiring Alerts */}
        {expiringSoon.length > 0 && (
          <div className="glass rounded-2xl p-5 border-2 border-orange-300 bg-orange-50">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-6 h-6 text-orange-600" />
              <h2 className="text-xl font-bold">
                ⚠️ {t("expiring.title")}
              </h2>
            </div>

            <div className="space-y-2">
              {expiringSoon.map((sub) => {
                const days = Math.ceil(
                  (new Date(sub.endDate).getTime() - Date.now()) /
                    (1000 * 60 * 60 * 24)
                );

                return (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between bg-white rounded-xl p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-orange-600" />
                      <span className="font-medium">{sub.name}</span>
                    </div>

                    <span
                      className={`text-sm font-bold ${
                        days <= 3
                          ? "text-red-600"
                          : days <= 7
                          ? "text-orange-600"
                          : "text-yellow-700"
                      }`}
                    >
                      {formatRemainingDays(days)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Users className="w-6 h-6" />}
            label={t("stats.accounts")}
            value={stats.accounts}
            change={stats.accountsAdded}
            changeLabel={t("stats.thisWeek")}
            color="blue"
          />

          <StatCard
            icon={<CreditCard className="w-6 h-6" />}
            label={t("stats.activeSubscriptions")}
            value={stats.activeSubscriptions}
            alert={stats.expiringSubscriptions}
            alertLabel={t("stats.expiringSoon")}
            color="green"
          />

          <StatCard
            icon={<FileText className="w-6 h-6" />}
            label={t("stats.cardsAndDocuments")}
            value={stats.cards + stats.documents}
            color="purple"
          />

          <StatCard
            icon={<DollarSign className="w-6 h-6" />}
            label={t("stats.totalSpending")}
            value={`${stats.totalSpent.toFixed(0)} ${t("currency.dzd")}`}
            color="orange"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MiniStat
            icon={<Phone className="w-4 h-4" />}
            label={t("stats.contacts")}
            value={stats.contacts}
          />

          <MiniStat
            icon={<Star className="w-4 h-4" />}
            label={t("stats.favorites")}
            value={stats.favorites}
          />

          <MiniStat
            icon={<Activity className="w-4 h-4" />}
            label={t("stats.todayActions")}
            value={
              activityLog.filter(
                (l) =>
                  new Date(l.createdAt).toDateString() ===
                  new Date().toDateString()
              ).length
            }
          />

          <MiniStat
            icon={<TrendingUp className="w-4 h-4" />}
            label={t("stats.monthlySpending")}
            value={`${stats.monthlySpent.toFixed(0)} ${t("currency.dzd")}`}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Categories Chart */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                📊 {t("sections.mostUsedCategories")}
              </h2>
              <BarChart3 className="w-5 h-5 text-gray-500" />
            </div>

            {categoryData.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                {t("messages.noData")}
              </p>
            ) : (
              <div className="space-y-3">
                {categoryData.map((cat, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between mb-1 text-sm">
                      <span className="font-medium">{cat.category}</span>
                      <span className="text-gray-600">{cat.value}</span>
                    </div>

                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(cat.value / maxCategoryValue) * 100}%`,
                          background:
                            "linear-gradient(to right, rgb(var(--color-primary)), rgb(var(--color-primary) / 0.6))",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Weekly Activity Chart */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                📈 {t("sections.weeklyActivity")}
              </h2>
              <Activity className="w-5 h-5 text-gray-500" />
            </div>

            <div className="flex items-end justify-between gap-2 h-48">
              {weeklyActivity.map((day, idx) => (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center justify-end"
                >
                  <div
                    className="w-full rounded-t-lg transition-all hover:opacity-80"
                    style={{
                      height: `${(day.count / maxActivityCount) * 100}%`,
                      background:
                        day.count > 0
                          ? "linear-gradient(to top, rgb(var(--color-primary)), rgb(var(--color-primary) / 0.6))"
                          : "#e2e8f0",
                      minHeight: "4px",
                    }}
                    title={`${day.day}: ${day.count}`}
                  />

                  <div className="text-xs mt-2 text-gray-600">{day.day}</div>
                  <div className="text-xs font-bold">{day.count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">
              🕐 {t("sections.recentActivity")}
            </h2>
            <Clock className="w-5 h-5 text-gray-500" />
          </div>

          {recentActivity.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              {t("messages.noActivities")}
            </p>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center gap-3 p-3 bg-white rounded-xl"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${
                      log.type === "add"
                        ? "bg-green-500"
                        : log.type === "delete"
                        ? "bg-red-500"
                        : log.type === "edit"
                        ? "bg-blue-500"
                        : "bg-gray-500"
                    }`}
                  >
                    {log.type === "add"
                      ? "+"
                      : log.type === "delete"
                      ? "−"
                      : "✎"}
                  </div>

                  <div className="flex-1">
                    <div className="text-sm">
                      <span className="font-medium">{log.itemName}</span>

                      <span className="text-gray-500">
                        {" "}
                        - {getActivityActionLabel(log.type)}{" "}
                        {getActivityItemTypeLabel(log.itemType)}
                      </span>
                    </div>

                    <div className="text-xs text-gray-500">
                      {new Date(log.createdAt).toLocaleString(localeForDate)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4">
            ⚡ {t("quickActions.title")}
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <a
              href={`/${locale}/accounts`}
              className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl hover:shadow-lg transition-all text-center"
            >
              <div className="text-3xl mb-1">🔑</div>
              <div className="font-medium text-sm">
                {t("quickActions.accounts")}
              </div>
            </a>

            <a
              href={`/${locale}/subscriptions`}
              className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl hover:shadow-lg transition-all text-center"
            >
              <div className="text-3xl mb-1">👑</div>
              <div className="font-medium text-sm">
                {t("quickActions.subscriptions")}
              </div>
            </a>

            <a
              href={`/${locale}/analytics`}
              className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl hover:shadow-lg transition-all text-center"
            >
              <div className="text-3xl mb-1">📊</div>
              <div className="font-medium text-sm">
                {t("quickActions.analytics")}
              </div>
            </a>

            <a
              href={`/${locale}/settings`}
              className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl hover:shadow-lg transition-all text-center"
            >
              <div className="text-3xl mb-1">⚙️</div>
              <div className="font-medium text-sm">
                {t("quickActions.settings")}
              </div>
            </a>
          </div>
        </div>

        {/* Empty State */}
        {stats.accounts === 0 && stats.subscriptions === 0 && (
          <div className="glass rounded-2xl p-12 text-center">
            <div className="text-6xl mb-4">🎉</div>

            <h3 className="text-2xl font-bold mb-2">
              {t("empty.title")}
            </h3>

            <p className="text-gray-600 mb-4">
              {t("empty.description")}
            </p>

            <div className="flex gap-2 justify-center">
              <a
                href={`/${locale}/accounts`}
                className="btn-3d px-5 py-2.5 rounded-xl text-white font-medium inline-flex items-center gap-2"
                style={{ background: "rgb(var(--color-primary))" }}
              >
                {t("empty.addAccount")}
              </a>

              <a
                href={`/${locale}/subscriptions`}
                className="btn-3d px-5 py-2.5 rounded-xl text-white font-medium inline-flex items-center gap-2"
                style={{ background: "#10b981" }}
              >
                {t("empty.addSubscription")}
              </a>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function StatCard({
  icon,
  label,
  value,
  change,
  alert,
  changeLabel,
  alertLabel,
  color,
}: {
  icon: ReactNode;
  label: string;
  value: number | string;
  change?: number;
  alert?: number;
  changeLabel?: string;
  alertLabel?: string;
  color: "blue" | "green" | "purple" | "orange";
}) {
  const colorClasses = {
    blue: "from-blue-500 to-cyan-500",
    green: "from-green-500 to-emerald-500",
    purple: "from-purple-500 to-pink-500",
    orange: "from-orange-500 to-red-500",
  };

  return (
    <div className="glass rounded-2xl p-5 card-hover">
      <div
        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center text-white mb-3 shadow-lg`}
      >
        {icon}
      </div>

      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-sm text-gray-600 mb-1">{label}</div>

      {change !== undefined && change > 0 && (
        <div className="text-xs text-green-600 flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />+{change} {changeLabel}
        </div>
      )}

      {alert !== undefined && alert > 0 && (
        <div className="text-xs text-orange-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {alert} {alertLabel}
        </div>
      )}
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="glass rounded-xl p-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>

      <div>
        <div className="text-lg font-bold">{value}</div>
        <div className="text-xs text-gray-600">{label}</div>
      </div>
    </div>
  );
}