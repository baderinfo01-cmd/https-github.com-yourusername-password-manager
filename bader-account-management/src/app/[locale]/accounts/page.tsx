"use client";

import { useState, useMemo, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import AppLayout from "@/components/layout/AppLayout";
import { useStore } from "@/store/useStore";
import { exportEncryptedBackup, pickBackupFile } from "@/lib/backup";
import { CATEGORIES, type Account } from "@/types";
import {
  Plus,
  Search,
  AlertTriangle,
  Copy,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  X,
  Globe,
  User as UserIcon,
  Lock,
  Filter,
  Printer,
  Download,
  Upload,
} from "lucide-react";
import {
  checkPasswordStrength,
  isPasswordOld,
  findDuplicates,
} from "@/lib/passwordStrength";
import { copyToClipboard } from "@/lib/utils";
import PreviewModal from "@/components/ui/PreviewModal";
import { printElement } from "@/lib/print";
import { printAccounts } from "@/lib/reports";

export default function AccountsPage() {
  const t = useTranslations("accounts");
  const tp = useTranslations("print") as unknown as (key: string, values?: Record<string, string | number>) => string;
  const locale = useLocale();

  const accounts = useStore((state) => state.accounts);
  const addAccount = useStore((state) => state.addAccount);
  const updateAccount = useStore((state) => state.updateAccount);
  const deleteAccount = useStore((state) => state.deleteAccount);
  const toggleFavoriteAccount = useStore((state) => state.toggleFavoriteAccount);
  const exportAllData = useStore((state) => state.exportAllData);
  const importAllData = useStore((state) => state.importAllData);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<
    "all" | "favorites" | "weak" | "duplicate"
  >("all");
  const [sortBy, setSortBy] = useState<"name" | "recent" | "updated">(
    "recent"
  );
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>(
    {}
  );
  const [showPreview, setShowPreview] = useState(false);

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

  const duplicates = findDuplicates(accounts);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();

    const result = accounts.filter((acc) => {
      const translatedCategory =
        categoryLabels[acc.category] ||
        CATEGORIES.find((c) => c.value === acc.category)?.label ||
        acc.category;

      const matchesSearch =
        acc.siteName.toLowerCase().includes(query) ||
        acc.category.toLowerCase().includes(query) ||
        translatedCategory.toLowerCase().includes(query) ||
        (acc.username && acc.username.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      if (categoryFilter !== "all" && acc.category !== categoryFilter) {
        return false;
      }

      if (filter === "favorites") return acc.isFavorite;
      if (filter === "weak") {
        return checkPasswordStrength(acc.password).score <= 2;
      }
      if (filter === "duplicate") {
        return (duplicates.get(acc.password) || 0) > 1;
      }

      return true;
    });

    return [...result].sort((a, b) => {
      if (sortBy === "name") return a.siteName.localeCompare(b.siteName);

      if (sortBy === "recent") {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }

      return (
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    });
  }, [
    accounts,
    search,
    filter,
    categoryFilter,
    sortBy,
    duplicates,
    categoryLabels,
  ]);

  const stats = {
    total: accounts.length,
    favorites: accounts.filter((a) => a.isFavorite).length,
    weak: accounts.filter((a) => checkPasswordStrength(a.password).score <= 2)
      .length,
    duplicate: Array.from(duplicates.values()).filter((c) => c > 1).length,
  };

  const handleExport = async () => {
    await exportEncryptedBackup(exportAllData(), "bader-accounts");
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
      <div className="space-y-6" id="accounts-content">
        {/* Header - NO PRINT */}
        <div className="no-print">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">🔑 {t("title")}</h1>
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
                onClick={() => printAccounts({ locale, tp, title: t("title") }, filtered, getCategoryLabel)}
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
                {viewMode === "grid"
                  ? t("view.list")
                  : t("view.grid")}
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="btn-3d px-5 py-2.5 rounded-xl text-white font-medium flex items-center gap-2"
                style={{ background: "rgb(var(--color-primary))" }}
              >
                <Plus className="w-5 h-5" />
                {t("actions.addAccount")}
              </button>
            </div>
          </div>

          {/* Stats - NO PRINT */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <button
              onClick={() => setFilter("all")}
              className={`glass rounded-2xl p-4 text-right card-hover transition-all ${
                filter === "all" ? "ring-2 ring-primary scale-105" : ""
              }`}
            >
              <div className="text-3xl mb-1">🔑</div>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-gray-600">
                {t("stats.total")}
              </div>
            </button>

            <button
              onClick={() => setFilter("favorites")}
              className={`glass rounded-2xl p-4 text-right card-hover transition-all ${
                filter === "favorites"
                  ? "ring-2 ring-primary scale-105"
                  : ""
              }`}
            >
              <div className="text-3xl mb-1">⭐</div>
              <div className="text-2xl font-bold">{stats.favorites}</div>
              <div className="text-sm text-gray-600">
                {t("stats.favorites")}
              </div>
            </button>

            <button
              onClick={() => setFilter("weak")}
              className={`glass rounded-2xl p-4 text-right card-hover transition-all ${
                filter === "weak" ? "ring-2 ring-primary scale-105" : ""
              }`}
            >
              <div className="text-3xl mb-1">⚠️</div>
              <div className="text-2xl font-bold">{stats.weak}</div>
              <div className="text-sm text-gray-600">
                {t("stats.weakPasswords")}
              </div>
            </button>

            <button
              onClick={() => setFilter("duplicate")}
              className={`glass rounded-2xl p-4 text-right card-hover transition-all ${
                filter === "duplicate"
                  ? "ring-2 ring-primary scale-105"
                  : ""
              }`}
            >
              <div className="text-3xl mb-1">🔁</div>
              <div className="text-2xl font-bold">{stats.duplicate}</div>
              <div className="text-sm text-gray-600">
                {t("stats.duplicatePasswords")}
              </div>
            </button>
          </div>

          {/* Search, Category, Sort - NO PRINT */}
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
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-3 rounded-xl bg-white border border-border focus:outline-none focus:border-primary"
            >
              <option value="all">{t("filters.allCategories")}</option>

              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {getCategoryLabel(cat.value)}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-3 rounded-xl bg-white border border-border focus:outline-none focus:border-primary"
            >
              <option value="recent">{t("sort.recent")}</option>
              <option value="updated">{t("sort.updated")}</option>
              <option value="name">{t("sort.name")}</option>
            </select>
          </div>
        </div>

        {/* Accounts List - PRINTS */}
        {filtered.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-bold mb-2">
              {t("empty.title")}
            </h3>
            <p className="text-gray-600 mb-4">
              {t("empty.description")}
            </p>

            <button
              onClick={() => setShowAddModal(true)}
              className="btn-3d px-5 py-2.5 rounded-xl text-white font-medium inline-flex items-center gap-2 no-print"
              style={{ background: "rgb(var(--color-primary))" }}
            >
              <Plus className="w-5 h-5" />
              {t("actions.addAccount")}
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
            {filtered.map((account) => {
              const strength = checkPasswordStrength(account.password);
              const isOld = isPasswordOld(account.createdAt);
              const isDuplicate = (duplicates.get(account.password) || 0) > 1;

              return (
                <div
                  key={account.id}
                  className="glass rounded-2xl p-5 card-hover account-card"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                        style={{ background: "rgb(var(--color-primary))" }}
                      >
                        {account.siteName[0]?.toUpperCase()}
                      </div>

                      <div>
                        <h3 className="font-bold">{account.siteName}</h3>
                        <p className="text-xs text-gray-500">
                          {getCategoryLabel(account.category)}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleFavoriteAccount(account.id)}
                      className="text-2xl hover:scale-110 transition-transform no-print"
                      title={t("actions.favorite")}
                    >
                      {account.isFavorite ? "⭐" : "☆"}
                    </button>
                  </div>

                  {/* Warnings */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {isOld && (
                      <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {t("warnings.oldPassword")}
                      </span>
                    )}

                    {strength.score <= 2 && (
                      <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">
                        {t("warnings.weak")}
                      </span>
                    )}

                    {isDuplicate && (
                      <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700">
                        {t("warnings.duplicate")}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="space-y-2 text-sm">
                    {account.username && (
                      <div className="flex items-center justify-between gap-2 info-row">
                        <div className="flex items-center gap-2 text-gray-600 min-w-0 flex-1">
                          <UserIcon className="w-4 h-4 flex-shrink-0 no-print" />
                          <strong className="no-print">
                            {t("fields.username")}:
                          </strong>
                          <span className="truncate">
                            {account.username}
                          </span>
                        </div>

                        <button
                          onClick={() => copyToClipboard(account.username!)}
                          className="p-1.5 hover:bg-white/60 rounded-lg transition-colors no-print"
                          title={t("actions.copy")}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {account.password && (
                      <div className="flex items-center justify-between gap-2 info-row">
                        <div className="flex items-center gap-2 text-gray-600 min-w-0 flex-1">
                          <Lock className="w-4 h-4 flex-shrink-0 no-print" />
                          <strong className="no-print">
                            {t("fields.password")}:
                          </strong>
                          <span className="font-mono truncate">
                            {showPasswords[account.id]
                              ? account.password
                              : "••••••••"}
                          </span>
                        </div>

                        <div className="flex gap-1 no-print">
                          <button
                            onClick={() =>
                              setShowPasswords({
                                ...showPasswords,
                                [account.id]: !showPasswords[account.id],
                              })
                            }
                            className="p-1.5 hover:bg-white/60 rounded-lg transition-colors"
                            title={
                              showPasswords[account.id]
                                ? t("actions.hidePassword")
                                : t("actions.showPassword")
                            }
                          >
                            {showPasswords[account.id] ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            onClick={() => copyToClipboard(account.password)}
                            className="p-1.5 hover:bg-white/60 rounded-lg transition-colors"
                            title={t("actions.copy")}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {account.emails && account.emails.length > 0 && (
                      <div className="info-row">
                        <strong className="no-print">
                          {t("fields.emails")}:
                        </strong>
                        <span className="truncate">
                          {account.emails.map((e) => e.email).join("، ")}
                        </span>
                      </div>
                    )}

                    {account.siteUrl && (
                      <div className="info-row">
                        <Globe className="w-4 h-4 flex-shrink-0 no-print" />
                        <strong className="no-print">
                          {t("fields.url")}:
                        </strong>
                        <a
                          href={account.siteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 truncate flex-1"
                        >
                          {account.siteUrl}
                        </a>
                      </div>
                    )}

                    {account.recoveryEmail && (
                      <div className="info-row">
                        <strong className="no-print">
                          {t("fields.recoveryEmail")}:
                        </strong>
                        <span className="truncate">
                          {account.recoveryEmail}
                        </span>
                      </div>
                    )}

                    {account.notes && (
                      <div className="info-row">
                        <strong className="no-print">
                          {t("fields.notes")}:
                        </strong>
                        <span className="truncate">{account.notes}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions - NO PRINT */}
                  <div className="flex gap-2 mt-4 pt-4 border-t border-border no-print">
                    <button
                      onClick={() => setEditingAccount(account)}
                      className="flex-1 px-3 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5 text-sm"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      {t("actions.edit")}
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(t("confirmDelete"))) {
                          deleteAccount(account.id);
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

        {/* Add/Edit Modal */}
        {(showAddModal || editingAccount) && (
          <AccountModal
            account={editingAccount}
            onClose={() => {
              setShowAddModal(false);
              setEditingAccount(null);
            }}
            onSave={(data) => {
              if (editingAccount) {
                updateAccount(editingAccount.id, data);
              } else {
                addAccount(data);
              }

              setShowAddModal(false);
              setEditingAccount(null);
            }}
          />
        )}

        {/* Preview Modal */}
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

              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-xs text-gray-600">
                    {t("preview.total")}
                  </div>
                </div>

                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold">
                    {stats.favorites}
                  </div>
                  <div className="text-xs text-gray-600">
                    {t("preview.favorites")}
                  </div>
                </div>

                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold">{stats.weak}</div>
                  <div className="text-xs text-gray-600">
                    {t("preview.weak")}
                  </div>
                </div>

                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold">
                    {stats.duplicate}
                  </div>
                  <div className="text-xs text-gray-600">
                    {t("preview.duplicate")}
                  </div>
                </div>
              </div>

              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 text-right">
                      #
                    </th>
                    <th className="border border-gray-300 p-2 text-right">
                      {t("table.siteName")}
                    </th>
                    <th className="border border-gray-300 p-2 text-right">
                      {t("table.category")}
                    </th>
                    <th className="border border-gray-300 p-2 text-right">
                      {t("table.username")}
                    </th>
                    <th className="border border-gray-300 p-2 text-right">
                      {t("table.password")}
                    </th>
                    <th className="border border-gray-300 p-2 text-right">
                      {t("table.url")}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((acc, idx) => (
                    <tr key={acc.id}>
                      <td className="border border-gray-300 p-2">
                        {idx + 1}
                      </td>

                      <td className="border border-gray-300 p-2 font-medium">
                        {acc.siteName}
                      </td>

                      <td className="border border-gray-300 p-2">
                        {getCategoryLabel(acc.category)}
                      </td>

                      <td className="border border-gray-300 p-2">
                        {acc.username || "-"}
                      </td>

                      <td className="border border-gray-300 p-2 font-mono">
                        {showPasswords[acc.id] ? acc.password : "••••••••"}
                      </td>

                      <td className="border border-gray-300 p-2 text-blue-600">
                        {acc.siteUrl || "-"}
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

function AccountModal({
  account,
  onClose,
  onSave,
}: {
  account: Account | null;
  onClose: () => void;
  onSave: (data: Omit<Account, "id" | "createdAt" | "updatedAt">) => void;
}) {
  const t = useTranslations("accounts.modal");
  const accountsT = useTranslations("accounts");

  const categoryLabels = accountsT.raw("categories") as Record<string, string>;

  const getCategoryLabel = (value: string) => {
    return (
      categoryLabels[value] ||
      CATEGORIES.find((c) => c.value === value)?.label ||
      value
    );
  };

  const [formData, setFormData] = useState({
    siteName: account?.siteName || "",
    siteUrl: account?.siteUrl || "",
    category: account?.category || "general",
    username: account?.username || "",
    password: account?.password || "",
    recoveryEmail: account?.recoveryEmail || "",
    notes: account?.notes || "",
    isFavorite: account?.isFavorite || false,
    emails: account?.emails || [],
    phones: account?.phones || [],
  });

  const strength = checkPasswordStrength(formData.password);

  const getStrengthLabel = () => {
    if (strength.color === "red") return accountsT("passwordStrength.red");
    if (strength.color === "orange") return accountsT("passwordStrength.orange");
    if (strength.color === "yellow") return accountsT("passwordStrength.yellow");
    return accountsT("passwordStrength.green");
  };

  const addEmail = () => {
    setFormData({
      ...formData,
      emails: [
        ...(formData.emails || []),
        { id: Date.now().toString(), email: "", password: "" },
      ],
    });
  };

  const updateEmail = (
    id: string,
    field: "email" | "password",
    value: string
  ) => {
    setFormData({
      ...formData,
      emails: (formData.emails || []).map((e) =>
        e.id === id ? { ...e, [field]: value } : e
      ),
    });
  };

  const removeEmail = (id: string) => {
    setFormData({
      ...formData,
      emails: (formData.emails || []).filter((e) => e.id !== id),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="glass rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 glass border-b border-border p-6 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold">
            {account ? t("editTitle") : t("addTitle")}
          </h2>

          <button
            onClick={onClose}
            className="p-2 hover:bg-white/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("siteName")} *
              </label>
              <input
                type="text"
                value={formData.siteName}
                onChange={(e) =>
                  setFormData({ ...formData, siteName: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-border focus:outline-none focus:border-primary"
                placeholder={t("siteNamePlaceholder")}
              />
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
                {t("password")} *
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

              {formData.password && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        strength.color === "red"
                          ? "bg-red-500"
                          : strength.color === "orange"
                          ? "bg-orange-500"
                          : strength.color === "yellow"
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                      style={{ width: `${(strength.score / 7) * 100}%` }}
                    />
                  </div>

                  <span className="text-xs font-medium">
                    {getStrengthLabel()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Emails */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">
                {t("extraEmails")}
              </label>

              <button
                type="button"
                onClick={addEmail}
                className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-600 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                {t("addEmail")}
              </button>
            </div>

            <div className="space-y-2">
              {(formData.emails || []).map((e) => (
                <div key={e.id} className="flex gap-2">
                  <input
                    type="email"
                    value={e.email}
                    onChange={(ev) =>
                      updateEmail(e.id, "email", ev.target.value)
                    }
                    placeholder="email@example.com"
                    className="flex-1 px-3 py-2 rounded-lg bg-white border border-border focus:outline-none focus:border-primary text-sm"
                  />

                  <input
                    type="text"
                    value={e.password}
                    onChange={(ev) =>
                      updateEmail(e.id, "password", ev.target.value)
                    }
                    placeholder={t("password")}
                    className="flex-1 px-3 py-2 rounded-lg bg-white border border-border focus:outline-none focus:border-primary text-sm"
                  />

                  <button
                    type="button"
                    onClick={() => removeEmail(e.id)}
                    className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t("recoveryEmail")}
            </label>
            <input
              type="email"
              value={formData.recoveryEmail}
              onChange={(e) =>
                setFormData({ ...formData, recoveryEmail: e.target.value })
              }
              className="w-full px-4 py-2.5 rounded-xl bg-white border border-border focus:outline-none focus:border-primary"
              placeholder="recovery@example.com"
            />
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
              id="favorite"
            />

            <label htmlFor="favorite" className="text-sm font-medium">
              {t("addToFavorites")} ⭐
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() =>
                onSave({
                  ...formData,
                  emails: (formData.emails || []).filter(
                    (e) => e.email.trim() !== ""
                  ),
                  phones: formData.phones || [],
                })
              }
              disabled={!formData.siteName || !formData.password}
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

function StatCard({
  icon,
  label,
  value,
  change,
  alert,
  color,
}: {
  icon: ReactNode;
  label: string;
  value: number | string;
  change?: number;
  alert?: number;
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
          +{change}
        </div>
      )}

      {alert !== undefined && alert > 0 && (
        <div className="text-xs text-orange-600 flex items-center gap-1">
          {alert}
        </div>
      )}
    </div>
  );
}