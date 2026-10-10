"use client";

import { useState, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import AppLayout from "@/components/layout/AppLayout";
import { useStore } from "@/store/useStore";
import { exportEncryptedBackup, pickBackupFile } from "@/lib/backup";
import { DEFAULT_CARD_TYPES } from "@/types";
import {
  Plus,
  Search,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  X,
  Copy,
  User as UserIcon,
  CreditCard,
  Printer,
  Download,
  Upload,
  Phone,
  Mail,
  Hash,
  Globe,
  ExternalLink,
  Lock,
  Key,
  Tag,
} from "lucide-react";
import { copyToClipboard } from "@/lib/utils";
import PreviewModal from "@/components/ui/PreviewModal";
import { printElement } from "@/lib/print";
import { printCards } from "@/lib/reports";

export default function CardsPage() {
  const t = useTranslations("cards");
  const tp = useTranslations("print") as unknown as (key: string, values?: Record<string, string | number>) => string;
  const locale = useLocale();

  const cards = useStore((state) => state.cards);
  const addCard = useStore((state) => state.addCard);
  const updateCard = useStore((state) => state.updateCard);
  const deleteCard = useStore((state) => state.deleteCard);
  const toggleFavoriteCard = useStore((state) => state.toggleFavoriteCard);
  const exportAllData = useStore((state) => state.exportAllData);
  const importAllData = useStore((state) => state.importAllData);
  const cardCategories = useStore((state) => state.cardCategories);
  const addCardCategory = useStore((state) => state.addCardCategory);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCard, setEditingCard] = useState<any | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [showPreview, setShowPreview] = useState(false);

  const currentLocale =
    locale === "ar" || locale === "en" || locale === "fr" ? locale : "ar";

  const localeForDate =
    locale === "ar" ? "ar-DZ" : locale === "fr" ? "fr-FR" : "en-US";

  const categoryLabels = t.raw("categories") as Record<string, string>;

  const printTitle = `${t("title")} - Bader Account Management`;

  const getCategoryLabel = (
    value: string,
    fallback?: string,
    labels?: Record<string, string>
  ) => {
    return (
      labels?.[currentLocale] ||
      categoryLabels[value] ||
      fallback ||
      value
    );
  };

  const getCategoryInfo = (typeValue: string) => {
    const found: any =
      cardCategories.find((c: any) => c.value === typeValue) ||
      DEFAULT_CARD_TYPES.find((c) => c.value === typeValue) ||
      DEFAULT_CARD_TYPES[DEFAULT_CARD_TYPES.length - 1];

    return {
      ...found,
      label: getCategoryLabel(found.value, found.label, found.labels),
    };
  };

  const filtered = useMemo(() => {
    return cards.filter((card) => {
      const cardType = getCategoryInfo(card.type);
      const query = search.toLowerCase();

      const matchesSearch =
        card.holderName.toLowerCase().includes(query) ||
        card.cardNumber.includes(search) ||
        cardType.label.toLowerCase().includes(query) ||
        (card.issuerBank &&
          card.issuerBank.toLowerCase().includes(query)) ||
        (card.accountUsername &&
          card.accountUsername.toLowerCase().includes(query));

      if (!matchesSearch) return false;
      if (filter !== "all" && card.type !== filter) return false;

      return true;
    });
  }, [cards, search, filter, cardCategories, categoryLabels, currentLocale]);

  const stats = {
    total: cards.length,
    bank: cards.filter((c) => c.type === "bank").length,
    membership: cards.filter((c) => c.type === "membership").length,
    favorites: cards.filter((c) => c.isFavorite).length,
  };

  const handleExport = async () => {
    await exportEncryptedBackup(exportAllData(), "bader-cards");
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
      <div className="space-y-6" id="cards-content">
        {/* Header */}
        <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">💳 {t("title")}</h1>
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
              onClick={() => printCards({ locale: currentLocale, tp, title: t("title") }, filtered, (v: string) => getCategoryInfo(v).label)}
              className="px-4 py-2.5 rounded-xl glass hover:bg-white/80 transition-colors flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              {t("actions.print")}
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="btn-3d px-5 py-2.5 rounded-xl text-white font-medium flex items-center gap-2"
              style={{ background: "rgb(var(--color-primary))" }}
            >
              <Plus className="w-5 h-5" />
              {t("actions.addCard")}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 no-print">
          <button
            onClick={() => setFilter("all")}
            className={`glass rounded-2xl p-4 text-right card-hover transition-all ${
              filter === "all" ? "ring-2 ring-primary scale-105" : ""
            }`}
          >
            <div className="text-3xl mb-1">💳</div>
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-gray-600">{t("stats.total")}</div>
          </button>

          <button
            onClick={() => setFilter("bank")}
            className={`glass rounded-2xl p-4 text-right card-hover transition-all ${
              filter === "bank" ? "ring-2 ring-primary scale-105" : ""
            }`}
          >
            <div className="text-3xl mb-1">🏦</div>
            <div className="text-2xl font-bold">{stats.bank}</div>
            <div className="text-sm text-gray-600">{t("stats.bank")}</div>
          </button>

          <button
            onClick={() => setFilter("membership")}
            className={`glass rounded-2xl p-4 text-right card-hover transition-all ${
              filter === "membership" ? "ring-2 ring-primary scale-105" : ""
            }`}
          >
            <div className="text-3xl mb-1">🎫</div>
            <div className="text-2xl font-bold">{stats.membership}</div>
            <div className="text-sm text-gray-600">
              {t("stats.membership")}
            </div>
          </button>

          <div className="glass rounded-2xl p-4 text-right">
            <div className="text-3xl mb-1">⭐</div>
            <div className="text-2xl font-bold">{stats.favorites}</div>
            <div className="text-sm text-gray-600">
              {t("stats.favorites")}
            </div>
          </div>
        </div>

        {/* Search & Categories */}
        <div className="no-print space-y-3">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="w-full pr-10 pl-4 py-3 rounded-xl bg-white border border-border focus:outline-none focus:border-primary"
              />
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-3 rounded-xl bg-white border border-border focus:outline-none focus:border-primary"
            >
              <option value="all">{t("filters.allCategories")}</option>

              {cardCategories.map((cat: any) => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon}{" "}
                  {getCategoryLabel(cat.value, cat.label, cat.labels)}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter Buttons */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {cardCategories.map((cat: any) => {
              const count = cards.filter((c) => c.type === cat.value).length;
              const label = getCategoryLabel(cat.value, cat.label, cat.labels);

              return (
                <button
                  key={cat.value}
                  onClick={() => setFilter(cat.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1 ${
                    filter === cat.value
                      ? "text-white shadow-md"
                      : "bg-white hover:bg-gray-50"
                  }`}
                  style={
                    filter === cat.value
                      ? { backgroundColor: "rgb(var(--color-primary))" }
                      : {}
                  }
                >
                  <span>{cat.icon}</span>
                  <span>{label}</span>
                  <span className="bg-white/30 px-1.5 rounded-full text-xs">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cards Grid */}
        {filtered.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <div className="text-6xl mb-4">💳</div>
            <h3 className="text-xl font-bold mb-2">{t("empty.title")}</h3>
            <p className="text-gray-600 mb-4">{t("empty.description")}</p>

            <button
              onClick={() => setShowAddModal(true)}
              className="btn-3d px-5 py-2.5 rounded-xl text-white font-medium inline-flex items-center gap-2 no-print"
              style={{ background: "rgb(var(--color-primary))" }}
            >
              <Plus className="w-5 h-5" />
              {t("actions.addCard")}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((card) => {
              const cardType = getCategoryInfo(card.type);

              return (
                <div key={card.id} className="space-y-3 account-card">
                  {/* Card Visual */}
                  <div
                    className={`bg-gradient-to-br ${
                      cardType?.color || "from-gray-500 to-gray-600"
                    } rounded-2xl p-6 text-white shadow-2xl relative overflow-hidden aspect-[1.586/1]`}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full -ml-20 -mb-20" />
                    <div className="absolute top-4 right-4 text-3xl opacity-30">
                      {cardType?.icon}
                    </div>

                    <div className="relative z-10 h-full flex flex-col justify-between">
                      <div className="flex items-start justify-between">
                        <div className="text-xs uppercase opacity-80">
                          {card.customType || cardType?.label}
                        </div>
                        <CreditCard className="w-8 h-8 opacity-80" />
                      </div>

                      <div className="font-mono text-lg md:text-xl tracking-wider mt-4">
                        {showSecrets[card.id]
                          ? card.cardNumber.match(/.{1,4}/g)?.join(" ")
                          : "•••• •••• •••• " + card.cardNumber.slice(-4)}
                      </div>

                      <div className="flex justify-between items-end mt-4">
                        <div>
                          <div className="text-xs opacity-70">
                            {t("cardVisual.holder")}
                          </div>
                          <div className="font-medium text-sm md:text-base">
                            {card.holderName}
                          </div>
                        </div>

                        {card.expiryDate && (
                          <div>
                            <div className="text-xs opacity-70">
                              {t("cardVisual.expiry")}
                            </div>
                            <div className="font-medium text-sm">
                              {card.expiryDate}
                            </div>
                          </div>
                        )}
                      </div>

                      {card.issuerBank && (
                        <div className="text-xs opacity-80 mt-2">
                          {card.issuerBank}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Basic Card Info */}
                  <div className="glass rounded-xl p-4 space-y-2 text-sm">
                    {card.cvv && (
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Hash className="w-4 h-4" />
                          <strong>CVV:</strong>
                          <span className="font-mono">
                            {showSecrets[card.id] ? card.cvv : "•••"}
                          </span>
                        </div>

                        <div className="flex gap-1 no-print">
                          <button
                            onClick={() =>
                              setShowSecrets({
                                ...showSecrets,
                                [card.id]: !showSecrets[card.id],
                              })
                            }
                            className="p-1.5 rounded-lg hover:bg-white/60"
                            title={
                              showSecrets[card.id]
                                ? t("actions.hide")
                                : t("actions.show")
                            }
                          >
                            {showSecrets[card.id] ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            onClick={() => copyToClipboard(card.cvv!)}
                            className="p-1.5 rounded-lg hover:bg-white/60"
                            title={t("actions.copy")}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {card.pinCode && (
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Lock className="w-4 h-4" />
                          <strong>PIN:</strong>
                          <span className="font-mono">
                            {showSecrets[card.id] ? card.pinCode : "••••"}
                          </span>
                        </div>

                        <button
                          onClick={() => copyToClipboard(card.pinCode!)}
                          className="p-1.5 rounded-lg hover:bg-white/60 no-print"
                          title={t("actions.copy")}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {card.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span dir="ltr">{card.phone}</span>
                      </div>
                    )}

                    {card.email && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{card.email}</span>
                      </div>
                    )}

                    {card.iban && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Hash className="w-4 h-4" />
                        <span dir="ltr" className="font-mono text-xs truncate">
                          {card.iban}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Online Account Info */}
                  {(card.websiteUrl ||
                    card.accountUrl ||
                    card.accountUsername) && (
                    <div className="glass rounded-xl p-4 space-y-2 text-sm border-2 border-blue-200">
                      <div className="flex items-center gap-2 text-blue-700 font-medium text-xs uppercase">
                        <Globe className="w-3 h-3" />
                        {t("onlineInfo.title")}
                      </div>

                      {card.websiteUrl && (
                        <div className="flex items-center justify-between gap-2">
                          <a
                            href={card.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-600 hover:underline flex-1 truncate"
                          >
                            <Globe className="w-3 h-3" />
                            <span className="truncate">{card.websiteUrl}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>

                          <button
                            onClick={() =>
                              window.open(card.websiteUrl!, "_blank")
                            }
                            className="p-1 rounded hover:bg-blue-50 no-print"
                            title={t("actions.open")}
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                          </button>
                        </div>
                      )}

                      {card.accountUrl && (
                        <div className="flex items-center justify-between gap-2">
                          <a
                            href={card.accountUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-600 hover:underline flex-1 truncate"
                          >
                            <Key className="w-3 h-3" />
                            <span className="truncate">
                              {t("onlineInfo.accountLink")}
                            </span>
                            <ExternalLink className="w-3 h-3" />
                          </a>

                          <button
                            onClick={() => copyToClipboard(card.accountUrl!)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 no-print"
                            title={t("actions.copy")}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {card.accountUsername && (
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-gray-600 min-w-0 flex-1">
                            <UserIcon className="w-3 h-3" />
                            <span className="truncate">
                              {card.accountUsername}
                            </span>
                          </div>

                          <button
                            onClick={() =>
                              copyToClipboard(card.accountUsername!)
                            }
                            className="p-1.5 rounded-lg hover:bg-blue-50 no-print"
                            title={t("actions.copy")}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {card.accountPassword && (
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-gray-600 min-w-0 flex-1">
                            <Lock className="w-3 h-3" />
                            <span className="font-mono truncate">
                              {showSecrets[card.id]
                                ? card.accountPassword
                                : "••••••••••"}
                            </span>
                          </div>

                          <div className="flex gap-1 no-print">
                            <button
                              onClick={() =>
                                setShowSecrets({
                                  ...showSecrets,
                                  [card.id]: !showSecrets[card.id],
                                })
                              }
                              className="p-1.5 rounded-lg hover:bg-blue-50"
                              title={
                                showSecrets[card.id]
                                  ? t("actions.hide")
                                  : t("actions.show")
                              }
                            >
                              {showSecrets[card.id] ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>

                            <button
                              onClick={() =>
                                copyToClipboard(card.accountPassword!)
                              }
                              className="p-1.5 rounded-lg hover:bg-blue-50"
                              title={t("actions.copy")}
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      {card.email && (
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-gray-600 min-w-0 flex-1">
                            <Mail className="w-3 h-3" />
                            <span className="truncate">{card.email}</span>
                          </div>

                          <button
                            onClick={() => copyToClipboard(card.email!)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 no-print"
                            title={t("actions.copy")}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {card.accountNotes && (
                        <div className="text-xs text-gray-500 italic">
                          💬 {card.accountNotes}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 no-print">
                    <button
                      onClick={() => toggleFavoriteCard(card.id)}
                      className="px-3 py-1.5 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 text-sm"
                      title={t("actions.favorite")}
                    >
                      {card.isFavorite ? "⭐" : "☆"}
                    </button>

                    <button
                      onClick={() => setEditingCard(card)}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm flex items-center justify-center gap-1"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      {t("actions.edit")}
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(t("confirmDelete"))) {
                          deleteCard(card.id);
                        }
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-sm flex items-center justify-center gap-1"
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
        {(showAddModal || editingCard) && (
          <CardModal
            card={editingCard}
            categories={cardCategories}
            onAddCategory={addCardCategory}
            onClose={() => {
              setShowAddModal(false);
              setEditingCard(null);
            }}
            onSave={(data) => {
              if (editingCard) {
                updateCard(editingCard.id, data);
              } else {
                addCard(data);
              }

              setShowAddModal(false);
              setEditingCard(null);
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
                  <div className="text-2xl font-bold">{stats.bank}</div>
                  <div className="text-xs text-gray-600">
                    {t("preview.bank")}
                  </div>
                </div>

                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold">{stats.membership}</div>
                  <div className="text-xs text-gray-600">
                    {t("preview.membership")}
                  </div>
                </div>

                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold">{stats.favorites}</div>
                  <div className="text-xs text-gray-600">
                    {t("preview.favorites")}
                  </div>
                </div>
              </div>

              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 text-right">
                      {t("table.type")}
                    </th>
                    <th className="border border-gray-300 p-2 text-right">
                      {t("table.holder")}
                    </th>
                    <th className="border border-gray-300 p-2 text-right">
                      {t("table.cardNumber")}
                    </th>
                    <th className="border border-gray-300 p-2 text-right">
                      {t("table.bank")}
                    </th>
                    <th className="border border-gray-300 p-2 text-right">
                      {t("table.expiry")}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((card) => {
                    const info = getCategoryInfo(card.type);

                    return (
                      <tr key={card.id}>
                        <td className="border border-gray-300 p-2">
                          {info.icon} {card.customType || info.label}
                        </td>

                        <td className="border border-gray-300 p-2 font-medium">
                          {card.holderName}
                        </td>

                        <td className="border border-gray-300 p-2 font-mono">
                          •••• {card.cardNumber.slice(-4)}
                        </td>

                        <td className="border border-gray-300 p-2">
                          {card.issuerBank || "-"}
                        </td>

                        <td className="border border-gray-300 p-2">
                          {card.expiryDate || "-"}
                        </td>
                      </tr>
                    );
                  })}
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

function CardModal({
  card,
  categories,
  onAddCategory,
  onClose,
  onSave,
}: {
  card: any;
  categories: any[];
  onAddCategory: (cat: any) => void;
  onClose: () => void;
  onSave: (data: any) => void;
}) {
  const t = useTranslations("cards");
  const modalT = useTranslations("cards.modal");
  const locale = useLocale();

  const currentLocale =
    locale === "ar" || locale === "en" || locale === "fr" ? locale : "ar";

  const categoryLabels = t.raw("categories") as Record<string, string>;

  const getCategoryLabel = (
    value: string,
    fallback?: string,
    labels?: Record<string, string>
  ) => {
    return (
      labels?.[currentLocale] ||
      categoryLabels[value] ||
      fallback ||
      value
    );
  };

  const [formData, setFormData] = useState({
    type: card?.type || "bank",
    customType: card?.customType || "",
    cardNumber: card?.cardNumber || "",
    holderName: card?.holderName || "",
    issuerBank: card?.issuerBank || "",
    expiryDate: card?.expiryDate || "",
    issueDate: card?.issueDate || "",
    pinCode: card?.pinCode || "",
    cvv: card?.cvv || "",
    phone: card?.phone || "",
    nationalId: card?.nationalId || "",
    email: card?.email || "",
    websiteUrl: card?.websiteUrl || "",
    accountUrl: card?.accountUrl || "",
    accountUsername: card?.accountUsername || "",
    accountPassword: card?.accountPassword || "",
    accountNotes: card?.accountNotes || "",
    iban: card?.iban || "",
    notes: card?.notes || "",
    isFavorite: card?.isFavorite || false,
  });

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState({
    value: "",
    label: "",
    labels: {
      ar: "",
      en: "",
      fr: "",
    },
    color: "from-blue-500 to-indigo-600",
    icon: "💳",
  });

  const categoryNamePlaceholders =
    currentLocale === "ar"
      ? {
          ar: "اسم التصنيف بالعربية",
          en: "اسم التصنيف بالإنجليزية",
          fr: "اسم التصنيف بالفرنسية",
        }
      : currentLocale === "fr"
      ? {
          ar: "Nom de la catégorie en arabe",
          en: "Nom de la catégorie en anglais",
          fr: "Nom de la catégorie en français",
        }
      : {
          ar: "Category name in Arabic",
          en: "Category name in English",
          fr: "Category name in French",
        };

  const colorOptions = [
    {
      value: "from-blue-500 to-indigo-600",
      label: modalT("colors.blue"),
    },
    {
      value: "from-green-500 to-emerald-600",
      label: modalT("colors.green"),
    },
    {
      value: "from-orange-500 to-red-600",
      label: modalT("colors.orange"),
    },
    {
      value: "from-purple-500 to-pink-600",
      label: modalT("colors.purple"),
    },
    {
      value: "from-yellow-500 to-orange-600",
      label: modalT("colors.yellow"),
    },
    {
      value: "from-cyan-500 to-blue-600",
      label: modalT("colors.cyan"),
    },
    {
      value: "from-pink-500 to-rose-600",
      label: modalT("colors.pink"),
    },
    {
      value: "from-red-500 to-red-700",
      label: modalT("colors.red"),
    },
  ];

  const iconOptions = [
    "💳",
    "🎫",
    "🛍️",
    "🎮",
    "⭐",
    "🚇",
    "🎓",
    "📇",
    "🏪",
    "🎁",
    "💎",
    "🏆",
  ];

  const handleAddCategory = () => {
    const arLabel = newCategory.labels.ar.trim();
    const enLabel = newCategory.labels.en.trim();
    const frLabel = newCategory.labels.fr.trim();

    const mainLabel = arLabel || enLabel || frLabel;

    if (!mainLabel) {
      alert(modalT("categoryAlerts.enterName"));
      return;
    }

    const value = newCategory.value || `custom_card_${Date.now()}`;

    if (categories.find((c) => c.value === value)) {
      alert(modalT("categoryAlerts.exists"));
      return;
    }

    onAddCategory({
      value,
      label: mainLabel,
      labels: {
        ar: arLabel || mainLabel,
        en: enLabel || mainLabel,
        fr: frLabel || mainLabel,
      },
      color: newCategory.color,
      icon: newCategory.icon,
    });

    setFormData({ ...formData, type: value });
    setShowCategoryModal(false);

    setNewCategory({
      value: "",
      label: "",
      labels: {
        ar: "",
        en: "",
        fr: "",
      },
      color: "from-blue-500 to-indigo-600",
      icon: "💳",
    });

    alert(modalT("categoryAlerts.added"));
  };

  const currentCategory =
    categories.find((c) => c.value === formData.type) ||
    DEFAULT_CARD_TYPES.find((c) => c.value === formData.type);

  const currentCategoryLabel = currentCategory
    ? getCategoryLabel(
        currentCategory.value,
        currentCategory.label,
        (currentCategory as any).labels
      )
    : "";

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
        <div className="glass rounded-2xl max-w-2xl w-full max-h-[95vh] overflow-y-auto my-8">
          <div className="sticky top-0 glass border-b border-border p-6 flex items-center justify-between z-10">
            <h2 className="text-xl font-bold">
              {card ? modalT("editTitle") : modalT("addTitle")}
            </h2>

            <button
              onClick={onClose}
              className="p-2 hover:bg-white/60 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {/* Card Preview */}
            <div
              className={`bg-gradient-to-br ${
                currentCategory?.color || "from-blue-500 to-indigo-600"
              } rounded-2xl p-6 text-white shadow-2xl aspect-[1.586/1] relative overflow-hidden`}
            >
              <div className="absolute top-4 right-4 text-3xl opacity-30">
                {currentCategory?.icon}
              </div>

              <div className="h-full flex flex-col justify-between">
                <div className="text-xs uppercase opacity-80">
                  {formData.customType || currentCategoryLabel}
                </div>

                <div className="font-mono text-lg tracking-wider">
                  {formData.cardNumber
                    ? formData.cardNumber.match(/.{1,4}/g)?.join(" ")
                    : "•••• •••• •••• ••••"}
                </div>

                <div className="flex justify-between">
                  <div>
                    <div className="text-xs opacity-70">
                      {t("cardVisual.holder")}
                    </div>
                    <div className="font-medium">
                      {formData.holderName || modalT("holderPlaceholder")}
                    </div>
                  </div>

                  {formData.expiryDate && (
                    <div>
                      <div className="text-xs opacity-70">
                        {t("cardVisual.expiry")}
                      </div>
                      <div className="font-medium">{formData.expiryDate}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {modalT("cardCategory")} *
              </label>

              <div className="flex gap-2">
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-border focus:outline-none focus:border-primary"
                >
                  {categories.map((cat: any) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon}{" "}
                      {getCategoryLabel(cat.value, cat.label, cat.labels)}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setShowCategoryModal(true)}
                  className="px-3 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center gap-1"
                >
                  <Tag className="w-4 h-4" />
                  {modalT("new")}
                </button>
              </div>

              {formData.type === "other" && (
                <input
                  type="text"
                  value={formData.customType}
                  onChange={(e) =>
                    setFormData({ ...formData, customType: e.target.value })
                  }
                  placeholder={modalT("customTypePlaceholder")}
                  className="w-full px-4 py-2 mt-2 rounded-xl bg-white border border-border focus:outline-none focus:border-primary"
                />
              )}
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {modalT("issuerBank")} *
                </label>
                <input
                  type="text"
                  value={formData.issuerBank}
                  onChange={(e) =>
                    setFormData({ ...formData, issuerBank: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-border focus:outline-none focus:border-primary"
                  placeholder="CPA, BNA, BEA..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {modalT("cardNumber")} *
                </label>
                <input
                  type="text"
                  value={formData.cardNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    setFormData({ ...formData, cardNumber: value });
                  }}
                  maxLength={19}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-border focus:outline-none focus:border-primary font-mono"
                  placeholder="1234567890123456"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {modalT("holderName")} *
              </label>
              <input
                type="text"
                value={formData.holderName}
                onChange={(e) =>
                  setFormData({ ...formData, holderName: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-border focus:outline-none focus:border-primary"
                placeholder="BADER ACCOUNT"
              />
            </div>

            {/* PIN, CVV, Expiry */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">PIN</label>
                <input
                  type="text"
                  value={formData.pinCode}
                  onChange={(e) =>
                    setFormData({ ...formData, pinCode: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-border focus:outline-none focus:border-primary font-mono"
                  placeholder="****"
                  maxLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">CVV</label>
                <input
                  type="text"
                  value={formData.cvv}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    setFormData({ ...formData, cvv: value });
                  }}
                  maxLength={4}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-border focus:outline-none focus:border-primary font-mono"
                  placeholder="123"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {modalT("expiryDate")}
                </label>
                <input
                  type="text"
                  value={formData.expiryDate}
                  onChange={(e) =>
                    setFormData({ ...formData, expiryDate: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-border focus:outline-none focus:border-primary"
                  placeholder="MM/YY"
                  maxLength={5}
                />
              </div>
            </div>

            {/* Online Info */}
            <div className="bg-blue-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-blue-700 font-medium text-sm">
                <Globe className="w-4 h-4" />
                {t("onlineInfo.title")}
              </div>

              <SmallInput
                label={modalT("websiteUrl")}
                type="url"
                value={formData.websiteUrl}
                onChange={(value: string) =>
                  setFormData({ ...formData, websiteUrl: value })
                }
                placeholder="https://example.com"
                dir="ltr"
              />

              <SmallInput
                label={modalT("accountUrl")}
                type="url"
                value={formData.accountUrl}
                onChange={(value: string) =>
                  setFormData({ ...formData, accountUrl: value })
                }
                placeholder="https://example.com/login"
                dir="ltr"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <SmallInput
                  label={modalT("email")}
                  type="email"
                  value={formData.email}
                  onChange={(value: string) =>
                    setFormData({ ...formData, email: value })
                  }
                  placeholder="email@example.com"
                  dir="ltr"
                />

                <SmallInput
                  label={modalT("phone")}
                  type="tel"
                  value={formData.phone}
                  onChange={(value: string) =>
                    setFormData({ ...formData, phone: value })
                  }
                  placeholder="+213 XXX XXX XXX"
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <SmallInput
                  label={modalT("accountUsername")}
                  type="text"
                  value={formData.accountUsername}
                  onChange={(value: string) =>
                    setFormData({ ...formData, accountUsername: value })
                  }
                  placeholder="username"
                />

                <SmallInput
                  label={modalT("accountPassword")}
                  type="text"
                  value={formData.accountPassword}
                  onChange={(value: string) =>
                    setFormData({ ...formData, accountPassword: value })
                  }
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 text-gray-700">
                  {modalT("accountNotes")}
                </label>
                <textarea
                  value={formData.accountNotes}
                  onChange={(e) =>
                    setFormData({ ...formData, accountNotes: e.target.value })
                  }
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-border focus:outline-none focus:border-primary text-sm"
                  placeholder={modalT("accountNotesPlaceholder")}
                />
              </div>
            </div>

            {/* IBAN */}
            <div>
              <label className="block text-sm font-medium mb-2">IBAN</label>
              <input
                type="text"
                value={formData.iban}
                onChange={(e) =>
                  setFormData({ ...formData, iban: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-border focus:outline-none focus:border-primary font-mono"
                placeholder="DZ58 00000 00000 0000 0000 0000"
                dir="ltr"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {modalT("generalNotes")}
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-border focus:outline-none focus:border-primary"
                placeholder={modalT("generalNotesPlaceholder")}
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
                id="favorite-card"
              />
              <label htmlFor="favorite-card" className="text-sm font-medium">
                {modalT("addToFavorites")} ⭐
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() =>
                  onSave({
                    ...formData,
                    holderName: formData.holderName.toUpperCase(),
                  })
                }
                disabled={!formData.cardNumber || !formData.holderName}
                className="flex-1 btn-3d py-3 rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "rgb(var(--color-primary))" }}
              >
                {modalT("save")}
              </button>

              <button
                onClick={onClose}
                className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                {modalT("cancel")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">
                ➕ {modalT("addCategoryTitle")}
              </h3>

              <button
                onClick={() => setShowCategoryModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <label className="block text-sm font-medium mb-1">
                  {modalT("categoryName")} *
                </label>

                <input
                  type="text"
                  value={newCategory.labels.ar}
                  onChange={(e) =>
                    setNewCategory({
                      ...newCategory,
                      labels: {
                        ...newCategory.labels,
                        ar: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white border border-border focus:outline-none focus:border-primary"
                  placeholder={categoryNamePlaceholders.ar}
                  dir="rtl"
                />

                <input
                  type="text"
                  value={newCategory.labels.en}
                  onChange={(e) =>
                    setNewCategory({
                      ...newCategory,
                      labels: {
                        ...newCategory.labels,
                        en: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white border border-border focus:outline-none focus:border-primary"
                  placeholder={categoryNamePlaceholders.en}
                  dir="ltr"
                />

                <input
                  type="text"
                  value={newCategory.labels.fr}
                  onChange={(e) =>
                    setNewCategory({
                      ...newCategory,
                      labels: {
                        ...newCategory.labels,
                        fr: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white border border-border focus:outline-none focus:border-primary"
                  placeholder={categoryNamePlaceholders.fr}
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {modalT("emoji")}
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {iconOptions.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setNewCategory({ ...newCategory, icon })}
                      className={`p-2 text-2xl rounded-lg border-2 transition-all ${
                        newCategory.icon === icon
                          ? "border-primary bg-blue-50 scale-110"
                          : "border-border hover:bg-gray-50"
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {modalT("color")}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() =>
                        setNewCategory({ ...newCategory, color: color.value })
                      }
                      className={`p-4 rounded-lg bg-gradient-to-br ${
                        color.value
                      } transition-all ${
                        newCategory.color === color.value
                          ? "ring-4 ring-primary scale-105"
                          : "hover:scale-95"
                      }`}
                    >
                      <span className="text-white text-xs font-medium">
                        {color.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="flex-1 btn-3d py-2.5 rounded-xl text-white font-medium"
                  style={{ background: "rgb(var(--color-primary))" }}
                >
                  {modalT("addCategory")}
                </button>

                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200"
                >
                  {modalT("cancel")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SmallInput({
  label,
  type,
  value,
  onChange,
  placeholder,
  dir,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1 text-gray-700">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-white border border-border focus:outline-none focus:border-primary text-sm"
        placeholder={placeholder}
        dir={dir}
      />
    </div>
  );
}