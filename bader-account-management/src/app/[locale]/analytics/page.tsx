"use client";

import { useState, useMemo, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import AppLayout from "@/components/layout/AppLayout";
import { useStore } from "@/store/useStore";
import { CATEGORIES } from "@/types";
import {
  BarChart3,
  TrendingUp,
  Users,
  PieChart as PieIcon,
  Activity,
  Download,
  CreditCard,
  FileText,
  Phone,
  Key,
  Crown,
  ChevronRight,
  Calendar as CalendarIcon,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Heart,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import { printElement } from "@/lib/print";

const COLORS = {
  primary: "#0ea5e9",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  purple: "#8b5cf6",
  pink: "#ec4899",
  indigo: "#6366f1",
  cyan: "#06b6d4",
};

const CHART_COLORS = [
  "#0ea5e9",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#6366f1",
  "#14b8a6",
  "#f97316",
  "#84cc16",
];

const PAGE_CONFIG = [
  {
    id: "overview",
    icon: BarChart3,
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "accounts",
    icon: Key,
    color: "from-purple-500 to-indigo-500",
  },
  {
    id: "subscriptions",
    icon: Crown,
    color: "from-pink-500 to-rose-500",
  },
  {
    id: "cards",
    icon: CreditCard,
    color: "from-orange-500 to-red-500",
  },
  {
    id: "documents",
    icon: FileText,
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: "contacts",
    icon: Phone,
    color: "from-blue-500 to-indigo-500",
  },
];

export default function AnalyticsPage() {
  const t = useTranslations("analytics");

  const accounts = useStore((state) => state.accounts);
  const subscriptions = useStore((state) => state.subscriptions);
  const cards = useStore((state) => state.cards);
  const documents = useStore((state) => state.documents);
  const contacts = useStore((state) => state.contacts);

  const [selectedPage, setSelectedPage] = useState("overview");

  const categoryLabels = t.raw("categories") as Record<string, string>;
  const cardTypeLabels = t.raw("cardTypes") as Record<string, string>;
  const documentTypeLabels = t.raw("documentTypes") as Record<string, string>;
  const contactCategoryLabels = t.raw("contactCategories") as Record<
    string,
    string
  >;

  const getCategoryLabel = (value: string) => {
    return (
      categoryLabels[value] ||
      CATEGORIES.find((c) => c.value === value)?.label ||
      value
    );
  };

  const getCardTypeLabel = (value: string) => {
    return cardTypeLabels[value] || value;
  };

  const getDocumentTypeLabel = (value: string) => {
    return documentTypeLabels[value] || value;
  };

  const getContactCategoryLabel = (value: string) => {
    return contactCategoryLabels[value] || value;
  };

  const overallStats = useMemo(() => {
    return {
      totalAccounts: accounts.length,
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: subscriptions.filter((s) => s.status === "active")
        .length,
      totalCards: cards.length,
      totalDocuments: documents.length,
      totalContacts: contacts.length,
      total:
        accounts.length +
        subscriptions.length +
        cards.length +
        documents.length +
        contacts.length,
    };
  }, [accounts, subscriptions, cards, documents, contacts]);

  const last30Days = useMemo(() => {
    const days: any[] = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const dayData: any = {
        day: date.toLocaleDateString("ar-DZ", {
          day: "2-digit",
          month: "2-digit",
        }),
        accounts: accounts.filter((a) => {
          const d = new Date(a.createdAt);
          return d >= dayStart && d <= dayEnd;
        }).length,
        subscriptions: subscriptions.filter((s) => {
          const d = new Date(s.createdAt);
          return d >= dayStart && d <= dayEnd;
        }).length,
        cards: cards.filter((c) => {
          const d = new Date(c.createdAt);
          return d >= dayStart && d <= dayEnd;
        }).length,
        documents: documents.filter((d) => {
          const dd = new Date(d.createdAt);
          return dd >= dayStart && dd <= dayEnd;
        }).length,
        contacts: contacts.filter((c) => {
          const dd = new Date(c.createdAt);
          return dd >= dayStart && dd <= dayEnd;
        }).length,
      };

      dayData.total =
        dayData.accounts +
        dayData.subscriptions +
        dayData.cards +
        dayData.documents +
        dayData.contacts;

      days.push(dayData);
    }

    return days;
  }, [accounts, subscriptions, cards, documents, contacts]);

  const accountsAnalytics = useMemo(() => {
    const byCategory: Record<string, number> = {};

    accounts.forEach((acc) => {
      byCategory[acc.category] = (byCategory[acc.category] || 0) + 1;
    });

    const passwords = accounts.map((a) => a.password);
    const duplicates = passwords.filter(
      (p, i) => passwords.indexOf(p) !== i
    ).length;

    return {
      byCategory: Object.entries(byCategory)
        .map(([key, value]) => ({
          category: getCategoryLabel(key),
          value,
        }))
        .sort((a, b) => b.value - a.value),
      totalFavorites: accounts.filter((a) => a.isFavorite).length,
      duplicates,
    };
  }, [accounts, categoryLabels]);

  const subscriptionsAnalytics = useMemo(() => {
    const byStatus: Record<string, number> = {
      active: 0,
      expired: 0,
      frozen: 0,
    };

    const byCategory: Record<string, number> = {};

    subscriptions.forEach((s) => {
      byStatus[s.status] = (byStatus[s.status] || 0) + 1;
      byCategory[s.category] = (byCategory[s.category] || 0) + 1;
    });

    const now = new Date();

    const expiringSoon = subscriptions.filter((s) => {
      if (s.status !== "active") return false;

      const days = Math.ceil(
        (new Date(s.endDate).getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      return days <= 30 && days > 0;
    }).length;

    const expired = subscriptions.filter((s) => s.status === "expired").length;

    return {
      byStatus: [
        {
          name: t("status.active"),
          value: byStatus.active,
          color: COLORS.success,
        },
        {
          name: t("status.expired"),
          value: byStatus.expired,
          color: COLORS.danger,
        },
        {
          name: t("status.frozen"),
          value: byStatus.frozen,
          color: COLORS.primary,
        },
      ].filter((s) => s.value > 0),
      byCategory: Object.entries(byCategory)
        .map(([key, value]) => ({
          category: getCategoryLabel(key),
          value,
        }))
        .sort((a, b) => b.value - a.value),
      expiringSoon,
      expired,
      activeCount: byStatus.active,
    };
  }, [subscriptions, categoryLabels, t]);

  const cardsAnalytics = useMemo(() => {
    const byType: Record<string, number> = {};
    const byFavorites = { favorites: 0, normal: 0 };

    cards.forEach((c) => {
      byType[c.type] = (byType[c.type] || 0) + 1;

      if (c.isFavorite) byFavorites.favorites++;
      else byFavorites.normal++;
    });

    return {
      byType: Object.entries(byType)
        .map(([key, value]) => ({
          type: getCardTypeLabel(key),
          value,
        }))
        .sort((a, b) => b.value - a.value),
      byFavorites,
      total: cards.length,
    };
  }, [cards, cardTypeLabels]);

  const documentsAnalytics = useMemo(() => {
    const byType: Record<string, number> = {};
    const byGender: Record<string, number> = { male: 0, female: 0 };

    documents.forEach((d) => {
      byType[d.type] = (byType[d.type] || 0) + 1;

      if (d.gender === "male") byGender.male++;
      else if (d.gender === "female") byGender.female++;
    });

    return {
      byType: Object.entries(byType)
        .map(([key, value]) => ({
          type: getDocumentTypeLabel(key),
          value,
        }))
        .sort((a, b) => b.value - a.value),
      byGender: [
        { name: t("gender.male"), value: byGender.male, color: COLORS.primary },
        { name: t("gender.female"), value: byGender.female, color: COLORS.pink },
      ].filter((g) => g.value > 0),
      total: documents.length,
    };
  }, [documents, documentTypeLabels, t]);

  const contactsAnalytics = useMemo(() => {
    const byCategory: Record<string, number> = {};

    contacts.forEach((c) => {
      byCategory[c.category] = (byCategory[c.category] || 0) + 1;
    });

    return {
      byCategory: Object.entries(byCategory)
        .map(([key, value]) => ({
          category: getContactCategoryLabel(key),
          value,
        }))
        .sort((a, b) => b.value - a.value),
      total: contacts.length,
      favorites: contacts.filter((c) => c.isFavorite).length,
    };
  }, [contacts, contactCategoryLabels]);

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <OverviewStatCard
          icon={<Key className="w-6 h-6" />}
          label={t("labels.accounts")}
          value={overallStats.totalAccounts}
          change={12}
          color="from-purple-500 to-indigo-500"
        />

        <OverviewStatCard
          icon={<Crown className="w-6 h-6" />}
          label={t("labels.activeSubscriptions")}
          value={overallStats.activeSubscriptions}
          change={8}
          color="from-pink-500 to-rose-500"
        />

        <OverviewStatCard
          icon={<CreditCard className="w-6 h-6" />}
          label={t("labels.cards")}
          value={overallStats.totalCards}
          change={-3}
          color="from-orange-500 to-red-500"
        />

        <OverviewStatCard
          icon={<FileText className="w-6 h-6" />}
          label={t("labels.documents")}
          value={overallStats.totalDocuments}
          change={15}
          color="from-emerald-500 to-teal-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-6 lg:col-span-1">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-primary">
            <PieIcon className="w-5 h-5" />
            {t("overview.totalDistribution")}
          </h3>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  {
                    name: t("labels.accounts"),
                    value: overallStats.totalAccounts,
                    color: COLORS.purple,
                  },
                  {
                    name: t("labels.subscriptions"),
                    value: overallStats.totalSubscriptions,
                    color: COLORS.pink,
                  },
                  {
                    name: t("labels.cards"),
                    value: overallStats.totalCards,
                    color: COLORS.warning,
                  },
                  {
                    name: t("labels.documents"),
                    value: overallStats.totalDocuments,
                    color: COLORS.success,
                  },
                  {
                    name: t("labels.contacts"),
                    value: overallStats.totalContacts,
                    color: COLORS.primary,
                  },
                ]}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={(e: any) => (e.value > 0 ? e.value : "")}
              >
                <Cell fill={COLORS.purple} />
                <Cell fill={COLORS.pink} />
                <Cell fill={COLORS.warning} />
                <Cell fill={COLORS.success} />
                <Cell fill={COLORS.primary} />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-2 gap-2 text-xs mt-4">
            <LegendItem
              color={COLORS.purple}
              label={t("labels.accounts")}
              value={overallStats.totalAccounts}
            />
            <LegendItem
              color={COLORS.pink}
              label={t("labels.subscriptions")}
              value={overallStats.totalSubscriptions}
            />
            <LegendItem
              color={COLORS.warning}
              label={t("labels.cards")}
              value={overallStats.totalCards}
            />
            <LegendItem
              color={COLORS.success}
              label={t("labels.documents")}
              value={overallStats.totalDocuments}
            />
            <LegendItem
              color={COLORS.primary}
              label={t("labels.contacts")}
              value={overallStats.totalContacts}
            />
          </div>
        </div>

        <div className="glass rounded-2xl p-6 lg:col-span-2">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-primary">
            <TrendingUp className="w-5 h-5" />
            {t("overview.monthlyActivity")}
          </h3>

          {last30Days.some((d) => d.total > 0) ? (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={last30Days}>
                <defs>
                  <linearGradient
                    id="colorAccounts"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={COLORS.purple}
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor={COLORS.purple}
                      stopOpacity={0}
                    />
                  </linearGradient>

                  <linearGradient
                    id="colorSubs"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={COLORS.pink}
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor={COLORS.pink}
                      stopOpacity={0}
                    />
                  </linearGradient>

                  <linearGradient
                    id="colorCards"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={COLORS.warning}
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor={COLORS.warning}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />

                <Area
                  type="monotone"
                  dataKey="accounts"
                  stroke={COLORS.purple}
                  fillOpacity={1}
                  fill="url(#colorAccounts)"
                  name={t("labels.accounts")}
                />

                <Area
                  type="monotone"
                  dataKey="subscriptions"
                  stroke={COLORS.pink}
                  fillOpacity={1}
                  fill="url(#colorSubs)"
                  name={t("labels.subscriptions")}
                />

                <Area
                  type="monotone"
                  dataKey="cards"
                  stroke={COLORS.warning}
                  fillOpacity={1}
                  fill="url(#colorCards)"
                  name={t("labels.cards")}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartText text={t("messages.noActivity")} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-primary">
            <Crown className="w-5 h-5" />
            {t("subscriptions.statusTitle")}
          </h3>

          {subscriptionsAnalytics.byStatus.length === 0 ? (
            <EmptyChartText text={t("messages.noSubscriptions")} />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={subscriptionsAnalytics.byStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={(e: any) => `${e.value}`}
                >
                  {subscriptionsAnalytics.byStatus.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-primary">
            <BarChart3 className="w-5 h-5" />
            {t("accounts.byCategory")}
          </h3>

          {accountsAnalytics.byCategory.length === 0 ? (
            <EmptyChartText text={t("messages.noAccounts")} />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={accountsAnalytics.byCategory.slice(0, 8)}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  dataKey="category"
                  type="category"
                  width={100}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip />
                <Bar
                  dataKey="value"
                  fill={COLORS.purple}
                  radius={[0, 8, 8, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickInfoCard
          icon={<TrendingUp className="w-5 h-5" />}
          label={t("quick.mostUsedCategory")}
          value={accountsAnalytics.byCategory[0]?.category || t("messages.none")}
          color="from-purple-500 to-pink-500"
        />

        <QuickInfoCard
          icon={<CalendarIcon className="w-5 h-5" />}
          label={t("quick.expiringSubscriptions")}
          value={t("units.subscriptionsCount", {
            count: subscriptionsAnalytics.expiringSoon,
          })}
          color="from-orange-500 to-red-500"
        />

        <QuickInfoCard
          icon={<Activity className="w-5 h-5" />}
          label={t("quick.totalActivity")}
          value={t("units.itemsCount", { count: overallStats.total })}
          color="from-blue-500 to-cyan-500"
        />
      </div>
    </div>
  );

  const renderAccountsAnalytics = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <OverviewStatCard
          icon={<Key className="w-6 h-6" />}
          label={t("accounts.total")}
          value={overallStats.totalAccounts}
          color="from-purple-500 to-indigo-500"
        />

        <OverviewStatCard
          icon={<TrendingUp className="w-6 h-6" />}
          label={t("common.favorites")}
          value={accountsAnalytics.totalFavorites}
          color="from-pink-500 to-rose-500"
        />

        <OverviewStatCard
          icon={<AlertCircle className="w-6 h-6" />}
          label={t("accounts.duplicates")}
          value={accountsAnalytics.duplicates}
          color="from-red-500 to-orange-500"
        />

        <OverviewStatCard
          icon={<Activity className="w-6 h-6" />}
          label={t("common.active")}
          value={overallStats.totalAccounts}
          color="from-blue-500 to-cyan-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartBox
          title={t("accounts.distributionByCategory")}
          icon={<PieIcon className="w-5 h-5" />}
          empty={accountsAnalytics.byCategory.length === 0}
        >
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={accountsAnalytics.byCategory}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={(e: any) => (e.value > 2 ? e.value : "")}
              >
                {accountsAnalytics.byCategory.map((_, idx) => (
                  <Cell
                    key={idx}
                    fill={CHART_COLORS[idx % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend layout="vertical" align="right" verticalAlign="middle" />
            </PieChart>
          </ResponsiveContainer>
        </ChartBox>

        <ChartBox
          title={t("accounts.barByCategory")}
          icon={<BarChart3 className="w-5 h-5" />}
          empty={accountsAnalytics.byCategory.length === 0}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={accountsAnalytics.byCategory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="category"
                tick={{ fontSize: 10 }}
                interval={0}
                textAnchor="end"
                height={80}
                angle={-30}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {accountsAnalytics.byCategory.map((_, idx) => (
                  <Cell
                    key={idx}
                    fill={CHART_COLORS[idx % CHART_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>
    </div>
  );

  const renderSubscriptionsAnalytics = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <OverviewStatCard
          icon={<Crown className="w-6 h-6" />}
          label={t("common.total")}
          value={overallStats.totalSubscriptions}
          color="from-pink-500 to-rose-500"
        />

        <OverviewStatCard
          icon={<CheckCircle2 className="w-6 h-6" />}
          label={t("common.active")}
          value={subscriptionsAnalytics.activeCount}
          color="from-green-500 to-emerald-500"
        />

        <OverviewStatCard
          icon={<CalendarIcon className="w-6 h-6" />}
          label={t("subscriptions.expiringSoon")}
          value={subscriptionsAnalytics.expiringSoon}
          color="from-orange-500 to-red-500"
        />

        <OverviewStatCard
          icon={<TrendingDown className="w-6 h-6" />}
          label={t("status.expired")}
          value={subscriptionsAnalytics.expired}
          color="from-red-500 to-pink-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartBox
          title={t("subscriptions.statusTitle")}
          icon={<PieIcon className="w-5 h-5" />}
          empty={subscriptionsAnalytics.byStatus.length === 0}
        >
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={subscriptionsAnalytics.byStatus}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={(e: any) => `${e.value}`}
              >
                {subscriptionsAnalytics.byStatus.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartBox>

        <ChartBox
          title={t("subscriptions.byCategory")}
          icon={<BarChart3 className="w-5 h-5" />}
          empty={subscriptionsAnalytics.byCategory.length === 0}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={subscriptionsAnalytics.byCategory}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis
                dataKey="category"
                type="category"
                width={120}
                tick={{ fontSize: 11 }}
              />
              <Tooltip />
              <Bar
                dataKey="value"
                fill={COLORS.pink}
                radius={[0, 8, 8, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>
    </div>
  );

  const renderCardsAnalytics = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <OverviewStatCard
          icon={<CreditCard className="w-6 h-6" />}
          label={t("common.total")}
          value={overallStats.totalCards}
          color="from-orange-500 to-red-500"
        />

        <OverviewStatCard
          icon={<Heart className="w-6 h-6" />}
          label={t("common.favorites")}
          value={cardsAnalytics.byFavorites.favorites}
          color="from-pink-500 to-rose-500"
        />

        <OverviewStatCard
          icon={<BarChart3 className="w-6 h-6" />}
          label={t("cards.normal")}
          value={cardsAnalytics.byFavorites.normal}
          color="from-blue-500 to-cyan-500"
        />
      </div>

      <ChartBox
        title={t("cards.byType")}
        icon={<PieIcon className="w-5 h-5" />}
        empty={cardsAnalytics.byType.length === 0}
        height={350}
      >
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={cardsAnalytics.byType}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={110}
              paddingAngle={5}
              dataKey="value"
              label={(e: any) => `${e.value}`}
            >
              {cardsAnalytics.byType.map((_, idx) => (
                <Cell
                  key={idx}
                  fill={CHART_COLORS[idx % CHART_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </ChartBox>
    </div>
  );

  const renderDocumentsAnalytics = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <OverviewStatCard
          icon={<FileText className="w-6 h-6" />}
          label={t("common.total")}
          value={overallStats.totalDocuments}
          color="from-emerald-500 to-teal-500"
        />

        <OverviewStatCard
          icon={<Heart className="w-6 h-6" />}
          label={t("common.favorites")}
          value={documents.filter((d) => d.isFavorite).length}
          color="from-pink-500 to-rose-500"
        />

        <OverviewStatCard
          icon={<Users className="w-6 h-6" />}
          label={t("labels.documents")}
          value={overallStats.totalDocuments}
          color="from-blue-500 to-indigo-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartBox
          title={t("documents.distribution")}
          icon={<BarChart3 className="w-5 h-5" />}
          empty={documentsAnalytics.byType.length === 0}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={documentsAnalytics.byType} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis
                dataKey="type"
                type="category"
                width={120}
                tick={{ fontSize: 11 }}
              />
              <Tooltip />
              <Bar
                dataKey="value"
                fill={COLORS.success}
                radius={[0, 8, 8, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>

        <ChartBox
          title={t("documents.gender")}
          icon={<PieIcon className="w-5 h-5" />}
          empty={documentsAnalytics.byGender.length === 0}
        >
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={documentsAnalytics.byGender}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={(e: any) => `${e.value}`}
              >
                {documentsAnalytics.byGender.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>
    </div>
  );

  const renderContactsAnalytics = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <OverviewStatCard
          icon={<Phone className="w-6 h-6" />}
          label={t("common.total")}
          value={overallStats.totalContacts}
          color="from-blue-500 to-indigo-500"
        />

        <OverviewStatCard
          icon={<Heart className="w-6 h-6" />}
          label={t("common.favorites")}
          value={contactsAnalytics.favorites}
          color="from-pink-500 to-rose-500"
        />

        <OverviewStatCard
          icon={<Users className="w-6 h-6" />}
          label={t("labels.contacts")}
          value={overallStats.totalContacts}
          color="from-purple-500 to-pink-500"
        />
      </div>

      <ChartBox
        title={t("contacts.byCategory")}
        icon={<BarChart3 className="w-5 h-5" />}
        empty={contactsAnalytics.byCategory.length === 0}
        height={350}
      >
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={contactsAnalytics.byCategory}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="category"
              tick={{ fontSize: 10 }}
              interval={0}
              textAnchor="end"
              height={80}
              angle={-30}
            />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar
              dataKey="value"
              fill={COLORS.primary}
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartBox>
    </div>
  );

  return (
    <AppLayout>
      <div className="space-y-6" id="analytics-content">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              📊 {t("title")}
            </h1>
            <p className="text-gray-600 mt-1">{t("subtitle")}</p>
          </div>

          <button
            onClick={() =>
              printElement("analytics-content", `${t("title")} - Bader Account Management`)
            }
            className="px-4 py-2.5 rounded-xl glass hover:bg-white/80 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {t("actions.printReport")}
          </button>
        </div>

        <div className="glass rounded-2xl p-2 flex flex-wrap gap-2">
          {PAGE_CONFIG.map((page) => {
            const Icon = page.icon;
            const isActive = selectedPage === page.id;

            return (
              <button
                key={page.id}
                onClick={() => setSelectedPage(page.id)}
                className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all ${
                  isActive
                    ? `bg-gradient-to-r ${page.color} text-white shadow-lg`
                    : "bg-white hover:bg-gray-50 text-gray-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {t(`tabs.${page.id}`)}
                {isActive && <ChevronRight className="w-3 h-3" />}
              </button>
            );
          })}
        </div>

        {selectedPage === "overview" && renderOverview()}
        {selectedPage === "accounts" && renderAccountsAnalytics()}
        {selectedPage === "subscriptions" && renderSubscriptionsAnalytics()}
        {selectedPage === "cards" && renderCardsAnalytics()}
        {selectedPage === "documents" && renderDocumentsAnalytics()}
        {selectedPage === "contacts" && renderContactsAnalytics()}

        <div className="glass rounded-2xl p-5 text-xs text-gray-500">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <strong className="text-primary">{t("footer.user")}:</strong> 1
            </div>
            <div>
              <strong className="text-primary">{t("footer.storage")}:</strong>{" "}
              {t("footer.local")}
            </div>
            <div>
              <strong className="text-primary">{t("footer.protection")}:</strong>{" "}
              {t("footer.enabled")}
            </div>
            <div>
              <strong className="text-primary">{t("footer.version")}:</strong>{" "}
              v2.0.0
            </div>
          </div>

          <div className="mt-3 text-center">
            Bader Account Management © 2026 - {t("footer.rights")}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function ChartBox({
  title,
  icon,
  empty,
  children,
}: {
  title: string;
  icon: ReactNode;
  empty: boolean;
  height?: number;
  children: ReactNode;
}) {
  const t = useTranslations("analytics");

  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-primary">
        {icon}
        {title}
      </h3>

      {empty ? <EmptyChartText text={t("messages.noData")} /> : children}
    </div>
  );
}

function EmptyChartText({ text }: { text: string }) {
  return <div className="text-center py-8 text-gray-500">{text}</div>;
}

function OverviewStatCard({
  icon,
  label,
  value,
  change,
  color,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  change?: number;
  color: string;
}) {
  const t = useTranslations("analytics");

  return (
    <div className="glass rounded-2xl p-5 card-hover relative overflow-hidden">
      <div
        className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color} opacity-10 rounded-full -mr-16 -mt-16`}
      />

      <div
        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-lg mb-3 relative z-10`}
      >
        {icon}
      </div>

      <div className="text-3xl font-bold relative z-10">{value}</div>
      <div className="text-sm text-gray-600 relative z-10">{label}</div>

      {change !== undefined && (
        <div
          className={`text-xs mt-2 flex items-center gap-1 relative z-10 ${
            change >= 0 ? "text-green-600" : "text-red-600"
          }`}
        >
          {change >= 0 ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {change >= 0 ? "+" : ""}
          {change}% {t("common.thisMonth")}
        </div>
      )}
    </div>
  );
}

function QuickInfoCard({
  icon,
  label,
  value,
  color,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white flex-shrink-0`}
        >
          {icon}
        </div>

        <div>
          <div className="text-xs text-gray-500">{label}</div>
          <div className="font-bold text-sm">{value}</div>
        </div>
      </div>
    </div>
  );
}

function LegendItem({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: color }}
      />

      <span className="text-xs text-gray-700">
        {label}: <strong>{value}</strong>
      </span>
    </div>
  );
}