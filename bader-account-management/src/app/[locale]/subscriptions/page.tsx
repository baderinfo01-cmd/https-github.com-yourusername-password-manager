"use client";

import { useState, useMemo, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import AppLayout from "@/components/layout/AppLayout";
import { useStore } from "@/store/useStore";
import { exportEncryptedBackup, pickBackupFile } from "@/lib/backup";
import { CATEGORIES, type Subscription } from "@/types";
import {
  Plus,
  Search,
  Calendar,
  DollarSign,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  X,
  Globe,
  User as UserIcon,
  Lock,
  Mail,
  Phone,
  Filter,
  Printer,
  Download,
  Upload,
  Bell,
  Copy,
  Clock,
} from "lucide-react";
import { copyToClipboard } from "@/lib/utils";
import PreviewModal from "@/components/ui/PreviewModal";
import { printElement } from "@/lib/print";

export default function SubscriptionsPage() {
  const t = useTranslations("subscriptions");
  const locale = useLocale();

  const subscriptions = useStore((state) => state.subscriptions);
  const addSubscription = useStore((state) => state.addSubscription);
  const updateSubscription = useStore((state) => state.updateSubscription);
  const deleteSubscription = useStore((state) => state.deleteSubscription);
  const toggleFavoriteSubscription = useStore(
    (state) => state.toggleFavoriteSubscription
  );
  const exportAllData = useStore((state) => state.exportAllData);
  const importAllData = useStore((state) => state.importAllData);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<
    "all" | "active" | "expired" | "frozen" | "expiring"
  >("all");
  const [sortBy, setSortBy] = useState<"name" | "recent" | "expiry" | "price">(
    "recent"
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showPreview, setShowPreview] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>(
    {}
  );

  const categoryLabels = t.raw("categories") as Record<string, string>;

  const localeForDate =
    locale === "ar" ? "ar-DZ" : locale === "fr" ? "fr-FR" : "en-US";

  const printTitle = `${t("title")} - Bader Account Management`;

  const getCategoryLabel = (value: string) => {
    return (
      categoryLabels[value] ||
      CATEGORIES.find((c) => c.value === value)?.label ||
      value
    );
  };

  const daysUntilExpiry = (endDate: string) => {
    return Math.ceil(
      (new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
  };

  const formatRemainingDays = (days: number) => {
    if (days === 0) return t("remaining.today");
    if (days === 1) return t("remaining.tomorrow");
    return t("remaining.afterDays", { days });
  };

  const getStatusLabel = (status: string) => {
    if (status === "active") return t("status.active");
    if (status === "expired") return t("status.expired");
    if (status === "frozen") return t("status.frozen");
    return status;
  };

  const filtered = useMemo(() => {
    const query = search.toLowerCase();

    const result = subscriptions.filter((sub) => {
      const translatedCategory =
        categoryLabels[sub.category] ||
        CATEGORIES.find((c) => c.value === sub.category)?.label ||
        sub.category;

      const matchesSearch =
        sub.name.toLowerCase().includes(query) ||
        sub.category.toLowerCase().includes(query) ||
        translatedCategory.toLowerCase().includes(query) ||
        (sub.username && sub.username.toLowerCase().includes(query)) ||
        (sub.email && sub.email.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      if (filter === "all") return true;

      if (filter === "expiring") {
        const days = daysUntilExpiry(sub.endDate);
        return days <= 7 && days > 0 && sub.status === "active";
      }

      return sub.status === filter;
    });

    return [...result].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);

      if (sortBy === "recent") {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }

      if (sortBy === "expiry") {
        return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
      }

      return b.price - a.price;
    });
  }, [subscriptions, search, filter, sortBy, categoryLabels]);

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter((s) => s.status === "active").length,
    expired: subscriptions.filter((s) => s.status === "expired").length,
    frozen: subscriptions.filter((s) => s.status === "frozen").length,
    expiring: subscriptions.filter((s) => {
      const days = daysUntilExpiry(s.endDate);
      return days <= 7 && days > 0 && s.status === "active";
    }).length,
  };

  const totalSpent = subscriptions
    .filter((s) => s.status === "active" || s.status === "expired")
    .reduce((sum, s) => sum + s.price, 0);

  const handleExport = async () => {
    await exportEncryptedBackup(exportAllData(), "bader-subscriptions");
  };

  const handleImport = async () => {
    const text = await pickBackupFile();
    if (text === null) return;
    if (importAllData(text)) {
      alert(t("alerts.importSuccess"));
    } else {
      alert(t("alerts.invalidFile"));
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6" id="subscriptions-content">
        <div className="no-print">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">👑 {t("title")}</h1>
              <p className="text-gray-600 mt-1">{t("subtitle")}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleExport}
                className="px-4 py-2.5 rounded-xl glass hover:bg-white/80 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {t("actions.export")}
              </button>

              <button
                onClick={handleImport}
                className="px-4 py-2.5 rounded-xl glass hover:bg-white/80 transition-colors flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {t("actions.import")}
              </button>

              <button
                onClick={() => setShowPreview(true)}
                className="px-4 py-2.5 rounded-xl glass hover:bg-white/80 transition-colors flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                {t("actions.preview")}
              </button>

              <button
                onClick={() => printElement("subscriptions-content", printTitle)}
                className="px-4 py-2.5 rounded-xl glass hover:bg-white/80 transition-colors flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                {t("actions.print")}
              </button>

              <button
                onClick={() =>
                  setViewMode(viewMode === "grid" ? "list" : "grid")
                }
                className="px-4 py-2.5 rounded-xl glass hover:bg-white/80 transition-colors flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                {viewMode === "grid" ? t("view.list") : t("view.grid")}
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="btn-3d px-5 py-2.5 rounded-xl text-white font-medium flex items-center gap-2"
                style={{ background: "rgb(var(--color-primary))" }}
              >
                <Plus className="w-5 h-5" />
                {t("actions.addSubscription")}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <button
              onClick={() => setFilter("all")}
              className={`glass rounded-2xl p-4 text-right card-hover transition-all ${
                filter === "all" ? "ring-2 ring-primary scale-105" : ""
              }`}
            >
              <div className="text-3xl mb-1">👑</div>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-gray-600">{t("stats.total")}</div>
            </button>

            <button
              onClick={() => setFilter("active")}
              className={`glass rounded-2xl p-4 text-right card-hover transition-all ${
                filter === "active" ? "ring-2 ring-primary scale-105" : ""
              }`}
            >
              <div className="text-3xl mb-1">✅</div>
              <div className="text-2xl font-bold">{stats.active}</div>
              <div className="text-sm text-gray-600">{t("stats.active")}</div>
            </button>

            <button
              onClick={() => setFilter("expiring")}
              className={`glass rounded-2xl p-4 text-right card-hover transition-all ${
                filter === "expiring" ? "ring-2 ring-primary scale-105" : ""
              }`}
            >
              <div className="text-3xl mb-1">⏰</div>
              <div className="text-2xl font-bold">{stats.expiring}</div>
              <div className="text-sm text-gray-600">
                {t("stats.expiring")}
              </div>
            </button>

            <div className="glass rounded-2xl p-4 text-right">
              <div className="text-3xl mb-1">💰</div>
              <div className="text-2xl font-bold">
                {totalSpent.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">
                {t("stats.totalSpent")}
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 mt-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="w-full pr-10 pl-4 py-3 rounded-xl bg-white border border-border focus:outline-none focus:border-primary transition-all"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-3 rounded-xl bg-white border border-border focus:outline-none focus:border-primary"
            >
              <option value="recent">{t("sort.recent")}</option>
              <option value="expiry">{t("sort.expiry")}</option>
              <option value="name">{t("sort.name")}</option>
              <option value="price">{t("sort.price")}</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-bold mb-2">{t("empty.title")}</h3>
            <p className="text-gray-600 mb-4">{t("empty.description")}</p>

            <button
              onClick={() => setShowAddModal(true)}
              className="btn-3d px-5 py-2.5 rounded-xl text-white font-medium inline-flex items-center gap-2 no-print"
              style={{ background: "rgb(var(--color-primary))" }}
            >
              <Plus className="w-5 h-5" />
              {t("actions.addSubscription")}
            </button>
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                : "space-y-3"
            }
          >
            {filtered.map((sub) => {
              const days = daysUntilExpiry(sub.endDate);
              const expiringSoon = days <= 7 && days > 0;

              return (
                <div
                  key={sub.id}
                  className="glass rounded-2xl p-5 card-hover account-card"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                        style={{ background: "rgb(var(--color-primary))" }}
                      >
                        {sub.name[0]?.toUpperCase()}
                      </div>

                      <div>
                        <h3 className="font-bold">{sub.name}</h3>
                        <p className="text-xs text-gray-500">
                          {getCategoryLabel(sub.category)}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleFavoriteSubscription(sub.id)}
                      className="text-2xl hover:scale-110 transition-transform no-print"
                      title={t("actions.favorite")}
                    >
                      {sub.isFavorite ? "⭐" : "☆"}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {sub.status === "active" && (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                        ✅ {t("status.active")}
                      </span>
                    )}

                    {sub.status === "expired" && (
                      <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">
                        ❌ {t("status.expired")}
                      </span>
                    )}

                    {sub.status === "frozen" && (
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                        ⏸️ {t("status.frozen")}
                      </span>
                    )}

                    {expiringSoon && sub.status === "active" && (
                      <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 flex items-center gap-1">
                        <Bell className="w-3 h-3" />
                        {formatRemainingDays(days)}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="info-row">
                      <Calendar className="w-4 h-4 flex-shrink-0 no-print" />
                      <strong className="no-print">{t("fields.from")}:</strong>
                      <span>
                        {new Date(sub.startDate).toLocaleDateString(
                          localeForDate
                        )}
                      </span>
                    </div>

                    <div className="info-row">
                      <Calendar className="w-4 h-4 flex-shrink-0 no-print" />
                      <strong className="no-print">{t("fields.to")}:</strong>
                      <span>
                        {new Date(sub.endDate).toLocaleDateString(
                          localeForDate
                        )}
                      </span>
                    </div>

                    <div className="info-row">
                      <DollarSign className="w-4 h-4 flex-shrink-0 no-print" />
                      <strong className="no-print">
                        {t("fields.price")}:
                      </strong>
                      <span className="font-bold">
                        {sub.price} {sub.currency}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-border space-y-2 text-sm">
                    {sub.siteUrl && (
                      <div className="info-row">
                        <Globe className="w-4 h-4 flex-shrink-0 no-print" />
                        <strong className="no-print">
                          {t("fields.url")}:
                        </strong>
                        <a
                          href={sub.siteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 truncate flex-1"
                        >
                          {sub.siteUrl}
                        </a>
                      </div>
                    )}

                    {sub.username && (
                      <div className="flex items-center justify-between gap-2 info-row">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <UserIcon className="w-4 h-4 flex-shrink-0 no-print" />
                          <strong className="no-print">
                            {t("fields.username")}:
                          </strong>
                          <span className="truncate">{sub.username}</span>
                        </div>

                        <button
                          onClick={() => copyToClipboard(sub.username!)}
                          className="p-1 hover:bg-white/60 rounded no-print"
                          title={t("actions.copy")}
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {sub.email && (
                      <div className="flex items-center justify-between gap-2 info-row">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Mail className="w-4 h-4 flex-shrink-0 no-print" />
                          <strong className="no-print">
                            {t("fields.email")}:
                          </strong>
                          <span className="truncate">{sub.email}</span>
                        </div>

                        <button
                          onClick={() => copyToClipboard(sub.email!)}
                          className="p-1 hover:bg-white/60 rounded no-print"
                          title={t("actions.copy")}
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {sub.phone && (
                      <div className="flex items-center justify-between gap-2 info-row">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Phone className="w-4 h-4 flex-shrink-0 no-print" />
                          <strong className="no-print">
                            {t("fields.phone")}:
                          </strong>
                          <span dir="ltr" className="truncate">
                            {sub.phone}
                          </span>
                        </div>

                        <button
                          onClick={() => copyToClipboard(sub.phone!)}
                          className="p-1 hover:bg-white/60 rounded no-print"
                          title={t("actions.copy")}
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {sub.password && (
                      <div className="flex items-center justify-between gap-2 info-row">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Lock className="w-4 h-4 flex-shrink-0 no-print" />
                          <strong className="no-print">
                            {t("fields.password")}:
                          </strong>
                          <span className="font-mono truncate">
                            {showPasswords[sub.id] ? sub.password : "••••••••"}
                          </span>
                        </div>

                        <div className="flex gap-1 no-print">
                          <button
                            onClick={() =>
                              setShowPasswords({
                                ...showPasswords,
                                [sub.id]: !showPasswords[sub.id],
                              })
                            }
                            className="p-1 hover:bg-white/60 rounded"
                            title={
                              showPasswords[sub.id]
                                ? t("actions.hidePassword")
                                : t("actions.showPassword")
                            }
                          >
                            {showPasswords[sub.id] ? (
                              <EyeOff className="w-3 h-3" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </button>

                          <button
                            onClick={() => copyToClipboard(sub.password!)}
                            className="p-1 hover:bg-white/60 rounded"
                            title={t("actions.copy")}
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {sub.notes && (
                    <div className="mt-2 text-xs text-gray-600">
                      <strong>{t("fields.notes")}:</strong> {sub.notes}
                    </div>
                  )}

                  <div className="flex gap-2 mt-4 pt-4 border-t border-border no-print">
                    <button
                      onClick={() => setEditingSub(sub)}
                      className="flex-1 px-3 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5 text-sm"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      {t("actions.edit")}
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(t("confirmDelete"))) {
                          deleteSubscription(sub.id);
                        }
                      }}
                      className="flex-1 px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5 text-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {t("actions.delete")}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {(showAddModal || editingSub) && (
          <SubscriptionModal
            subscription={editingSub}
            onClose={() => {
              setShowAddModal(false);
              setEditingSub(null);
            }}
            onSave={(data) => {
              if (editingSub) {
                updateSubscription(editingSub.id, data);
              } else {
                addSubscription(data);
              }

              setShowAddModal(false);
              setEditingSub(null);
            }}
          />
        )}

        <PreviewModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          title={t("preview.title")}
          onPrint={() => printElement("preview-content", printTitle)}
          content={
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h1 className="text-2xl font-bold">{t("title")}</h1>
                  <p className="text-gray-600 text-sm">
                    Bader Account Management
                  </p>
                </div>

                <div className="text-left">
                  <div className="text-sm text-gray-500">
                    {t("preview.date")}
                  </div>
                  <div className="font-medium">
                    {new Date().toLocaleDateString(localeForDate)}
                  </div>
                </div>
              </div>

              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-right">#</th>
                    <th className="border p-2 text-right">
                      {t("table.name")}
                    </th>
                    <th className="border p-2 text-right">
                      {t("table.category")}
                    </th>
                    <th className="border p-2 text-right">
                      {t("table.username")}
                    </th>
                    <th className="border p-2 text-right">
                      {t("table.email")}
                    </th>
                    <th className="border p-2 text-right">
                      {t("table.from")}
                    </th>
                    <th className="border p-2 text-right">
                      {t("table.to")}
                    </th>
                    <th className="border p-2 text-right">
                      {t("table.price")}
                    </th>
                    <th className="border p-2 text-right">
                      {t("table.status")}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((sub, idx) => (
                    <tr key={sub.id}>
                      <td className="border p-2">{idx + 1}</td>
                      <td className="border p-2 font-medium">{sub.name}</td>
                      <td className="border p-2">
                        {getCategoryLabel(sub.category)}
                      </td>
                      <td className="border p-2">{sub.username || "-"}</td>
                      <td className="border p-2">{sub.email || "-"}</td>
                      <td className="border p-2">
                        {new Date(sub.startDate).toLocaleDateString(
                          localeForDate
                        )}
                      </td>
                      <td className="border p-2">
                        {new Date(sub.endDate).toLocaleDateString(
                          localeForDate
                        )}
                      </td>
                      <td className="border p-2">
                        {sub.price} {sub.currency}
                      </td>
                      <td className="border p-2">
                        {getStatusLabel(sub.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="text-center text-xs text-gray-500 pt-4 border-t">
                {t("preview.generatedBy")}
              </div>
            </div>
          }
        />
      </div>
    </AppLayout>
  );
}

function SubscriptionModal({
  subscription,
  onClose,
  onSave,
}: {
  subscription: Subscription | null;
  onClose: () => void;
  onSave: (data: Omit<Subscription, "id" | "createdAt" | "updatedAt">) => void;
}) {
  const t = useTranslations("subscriptions.modal");
  const subscriptionsT = useTranslations("subscriptions");

  const categoryLabels = subscriptionsT.raw("categories") as Record<
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

  const [formData, setFormData] = useState({
    name: subscription?.name || "",
    siteUrl: subscription?.siteUrl || "",
    category: subscription?.category || "services",
    username: subscription?.username || "",
    password: subscription?.password || "",
    email: subscription?.email || "",
    phone: subscription?.phone || "",
    customerName: subscription?.customerName || "",
    startDate:
      subscription?.startDate || new Date().toISOString().split("T")[0],
    endDate:
      subscription?.endDate ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    price: subscription?.price || 0,
    currency: subscription?.currency || "دج",
    status: subscription?.status || ("active" as const),
    notes: subscription?.notes || "",
    isFavorite: subscription?.isFavorite || false,
  });

  const [durationType, setDurationType] = useState<string>("30");

  useEffect(() => {
    if (durationType === "custom") return;

    const days = parseInt(durationType);
    if (isNaN(days)) return;

    const start = new Date(formData.startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + days);

    setFormData((prev) => ({
      ...prev,
      endDate: end.toISOString().split("T")[0],
    }));
  }, [durationType, formData.startDate]);

  const daysBetween = Math.ceil(
    (new Date(formData.endDate).getTime() -
      new Date(formData.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const durationOptions = [
    { value: "7", label: t("durations.week") },
    { value: "30", label: t("durations.month") },
    { value: "90", label: t("durations.threeMonths") },
    { value: "180", label: t("durations.sixMonths") },
    { value: "365", label: t("durations.year") },
    { value: "730", label: t("durations.twoYears") },
    { value: "1825", label: t("durations.fiveYears") },
    { value: "custom", label: t("durations.custom") },
  ];

  const currencyOptions = [
    { value: "دج", label: t("currencies.dzd") },
    { value: "ر.س", label: t("currencies.sar") },
    { value: "د.إ", label: t("currencies.aed") },
    { value: "$", label: t("currencies.usd") },
    { value: "€", label: t("currencies.eur") },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="glass rounded-2xl max-w-3xl w-full max-h-[95vh] overflow-y-auto my-8">
        <div className="sticky top-0 glass border-b border-border p-6 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold">
            {subscription ? t("editTitle") : t("addTitle")}
          </h2>

          <button
            onClick={onClose}
            className="p-2 hover:bg-white/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-3">
            <h3 className="font-bold text-lg flex items-center gap-2">
              📋 {t("sections.basic")}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("name")} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-border focus:outline-none focus:border-primary"
                  placeholder={t("namePlaceholder")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("customerName")}
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) =>
                    setFormData({ ...formData, customerName: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-border focus:outline-none focus:border-primary"
                  placeholder={t("customerNamePlaceholder")}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t("category")} *
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-border focus:outline-none focus:border-primary"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {getCategoryLabel(cat.value)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-border">
            <h3 className="font-bold text-lg flex items-center gap-2">
              🔐 {t("sections.login")}
            </h3>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t("siteUrl")}
              </label>
              <input
                type="url"
                value={formData.siteUrl}
                onChange={(e) =>
                  setFormData({ ...formData, siteUrl: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-border focus:outline-none focus:border-primary"
                placeholder="https://example.com"
                dir="ltr"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("username")}
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-border focus:outline-none focus:border-primary"
                  placeholder={t("usernamePlaceholder")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("password")}
                </label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-border focus:outline-none focus:border-primary"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("email")}
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-border focus:outline-none focus:border-primary"
                  placeholder="email@example.com"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("phone")}
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-border focus:outline-none focus:border-primary"
                  placeholder="+213 XXX XXX XXX"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-border">
            <h3 className="font-bold text-lg flex items-center gap-2">
              📅 {t("sections.duration")}
            </h3>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t("duration")} *
              </label>
              <select
                value={durationType}
                onChange={(e) => setDurationType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-border focus:outline-none focus:border-primary"
              >
                {durationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <p className="text-xs text-gray-500 mt-1">
                💡 {t("autoEndDateHint")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("startDate")} *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-border focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("endDate")} *
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => {
                    setFormData({ ...formData, endDate: e.target.value });
                    setDurationType("custom");
                  }}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-border focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("daysCount")}
                </label>
                <div className="w-full px-4 py-2.5 rounded-xl bg-accent/30 border border-border text-center font-bold text-primary">
                  {daysBetween > 0
                    ? t("daysValue", { days: daysBetween })
                    : t("invalidDuration")}
                </div>
              </div>
            </div>

            {durationType !== "custom" && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl text-sm text-blue-700">
                <Clock className="w-4 h-4" />
                <span>
                  💡{" "}
                  {t("selectedDuration", {
                    days: durationType,
                  })}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-3 pt-4 border-t border-border">
            <h3 className="font-bold text-lg flex items-center gap-2">
              💰 {t("sections.priceStatus")}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("price")} *
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-border focus:outline-none focus:border-primary"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("currency")}
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) =>
                    setFormData({ ...formData, currency: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-border focus:outline-none focus:border-primary"
                >
                  {currencyOptions.map((currency) => (
                    <option key={currency.value} value={currency.value}>
                      {currency.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("status")} *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as any,
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-border focus:outline-none focus:border-primary"
                >
                  <option value="active">
                    {subscriptionsT("status.active")}
                  </option>
                  <option value="expired">
                    {subscriptionsT("status.expired")}
                  </option>
                  <option value="frozen">
                    {subscriptionsT("status.frozen")}
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t("notes")}
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-border focus:outline-none focus:border-primary"
                rows={3}
                placeholder={t("notesPlaceholder")}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isFavorite}
                onChange={(e) =>
                  setFormData({ ...formData, isFavorite: e.target.checked })
                }
                className="w-5 h-5"
                id="favorite-sub"
              />

              <label htmlFor="favorite-sub" className="text-sm font-medium">
                {t("addToFavorites")} ⭐
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => onSave(formData)}
              disabled={!formData.name}
              className="flex-1 btn-3d py-3 rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "rgb(var(--color-primary))" }}
            >
              {t("save")}
            </button>

            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}