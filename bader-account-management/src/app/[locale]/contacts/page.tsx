"use client";

import { useState, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import AppLayout from "@/components/layout/AppLayout";
import { useStore } from "@/store/useStore";
import { exportEncryptedBackup, pickBackupFile } from "@/lib/backup";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Copy,
  Printer,
  Download,
  Upload,
  Phone,
  Mail,
  MapPin,
  Eye,
  Filter,
  Tag,
} from "lucide-react";
import { copyToClipboard } from "@/lib/utils";
import PreviewModal from "@/components/ui/PreviewModal";
import { printElement } from "@/lib/print";

export default function ContactsPage() {
  const t = useTranslations("contacts");
  const locale = useLocale();

  const contacts = useStore((state) => state.contacts);
  const addContact = useStore((state) => state.addContact);
  const updateContact = useStore((state) => state.updateContact);
  const deleteContact = useStore((state) => state.deleteContact);
  const toggleFavoriteContact = useStore(
    (state) => state.toggleFavoriteContact
  );
  const exportAllData = useStore((state) => state.exportAllData);
  const importAllData = useStore((state) => state.importAllData);
  const contactCategories = useStore((state) => state.contactCategories);
  const addContactCategory = useStore((state) => state.addContactCategory);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContact, setEditingContact] = useState<any | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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
    return labels?.[currentLocale] || categoryLabels[value] || fallback || value;
  };

  const getCategoryInfo = (category: string) => {
    const found: any =
      contactCategories.find((c: any) => c.value === category) ||
      contactCategories[contactCategories.length - 1] || {
        value: "other",
        label: t("categories.other"),
        icon: "👤",
        color: "from-gray-500 to-slate-500",
      };

    return {
      ...found,
      label: getCategoryLabel(found.value, found.label, found.labels),
    };
  };

  const filtered = useMemo(() => {
    const query = search.toLowerCase();

    return contacts.filter((c) => {
      const categoryInfo = getCategoryInfo(c.category);

      const matchesSearch =
        (c.firstName || "").toLowerCase().includes(query) ||
        (c.lastName || "").toLowerCase().includes(query) ||
        (c.phone1 && c.phone1.includes(search)) ||
        (c.phone2 && c.phone2.includes(search)) ||
        (c.email && c.email.toLowerCase().includes(query)) ||
        categoryInfo.label.toLowerCase().includes(query);

      if (!matchesSearch) return false;
      if (filter !== "all" && c.category !== filter) return false;

      return true;
    });
  }, [
    contacts,
    search,
    filter,
    contactCategories,
    categoryLabels,
    currentLocale,
  ]);

  const stats = {
    total: contacts.length,
    family: contacts.filter((c) => c.category === "family").length,
    friends: contacts.filter((c) => c.category === "friends").length,
    favorites: contacts.filter((c) => c.isFavorite).length,
  };

  const handleExport = async () => {
    await exportEncryptedBackup(exportAllData(), "bader-contacts");
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
      <div className="space-y-6" id="contacts-content">
        {/* Header */}
        <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">📞 {t("title")}</h1>
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
              onClick={() => printElement("contacts-content", printTitle)}
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
              {t("actions.addContact")}
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
            <div className="text-3xl mb-1">📞</div>
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-gray-600">{t("stats.total")}</div>
          </button>

          <button
            onClick={() => setFilter("family")}
            className={`glass rounded-2xl p-4 text-right card-hover transition-all ${
              filter === "family" ? "ring-2 ring-primary scale-105" : ""
            }`}
          >
            <div className="text-3xl mb-1">
              {getCategoryInfo("family").icon}
            </div>
            <div className="text-2xl font-bold">{stats.family}</div>
            <div className="text-sm text-gray-600">
              {getCategoryInfo("family").label}
            </div>
          </button>

          <button
            onClick={() => setFilter("friends")}
            className={`glass rounded-2xl p-4 text-right card-hover transition-all ${
              filter === "friends" ? "ring-2 ring-primary scale-105" : ""
            }`}
          >
            <div className="text-3xl mb-1">
              {getCategoryInfo("friends").icon}
            </div>
            <div className="text-2xl font-bold">{stats.friends}</div>
            <div className="text-sm text-gray-600">
              {getCategoryInfo("friends").label}
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

        {/* Search and Filter */}
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

              {contactCategories.map((cat: any) => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {getCategoryLabel(cat.value, cat.label, cat.labels)}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter Buttons */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {contactCategories.map((cat: any) => {
              const count = contacts.filter((c) => c.category === cat.value)
                .length;
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

        {/* Contacts List */}
        {filtered.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <div className="text-6xl mb-4">📞</div>
            <h3 className="text-xl font-bold mb-2">{t("empty.title")}</h3>
            <p className="text-gray-600 mb-4">{t("empty.description")}</p>

            <button
              onClick={() => setShowAddModal(true)}
              className="btn-3d px-5 py-2.5 rounded-xl text-white font-medium inline-flex items-center gap-2 no-print"
              style={{ background: "rgb(var(--color-primary))" }}
            >
              <Plus className="w-5 h-5" />
              {t("actions.addContact")}
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
            {filtered.map((contact) => {
              const catInfo = getCategoryInfo(contact.category);

              return (
                <div
                  key={contact.id}
                  className="glass rounded-2xl p-5 card-hover account-card"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${catInfo.color} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}
                    >
                      {contact.firstName?.[0]}
                      {contact.lastName?.[0]}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <h3 className="font-bold">
                            {contact.firstName} {contact.lastName}
                          </h3>

                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <span>{catInfo.icon}</span>
                            <span>{catInfo.label}</span>
                          </p>
                        </div>

                        <button
                          onClick={() => toggleFavoriteContact(contact.id)}
                          className="text-2xl hover:scale-110 transition-transform no-print"
                          title={t("actions.favorite")}
                        >
                          {contact.isFavorite ? "⭐" : "☆"}
                        </button>
                      </div>

                      <div className="space-y-1 mt-2 text-sm">
                        {contact.phone1 && (
                          <div className="flex items-center justify-between gap-2 bg-white rounded p-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <Phone className="w-3 h-3 text-gray-400" />
                              <span dir="ltr" className="truncate">
                                {contact.phone1}
                              </span>
                            </div>

                            <a
                              href={`tel:${contact.phone1}`}
                              className="px-2 py-1 rounded bg-green-50 text-green-600 text-xs no-print"
                            >
                              {t("actions.call")}
                            </a>

                            <button
                              onClick={() => copyToClipboard(contact.phone1!)}
                              className="p-1 rounded hover:bg-gray-100 no-print"
                              title={t("actions.copy")}
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        {contact.phone2 && (
                          <div className="flex items-center justify-between gap-2 bg-white rounded p-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <Phone className="w-3 h-3 text-gray-400" />
                              <span dir="ltr" className="truncate">
                                {contact.phone2}
                              </span>
                            </div>

                            <a
                              href={`tel:${contact.phone2}`}
                              className="px-2 py-1 rounded bg-green-50 text-green-600 text-xs no-print"
                            >
                              {t("actions.call")}
                            </a>
                          </div>
                        )}

                        {contact.email && (
                          <div className="flex items-center justify-between gap-2 bg-white rounded p-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <Mail className="w-3 h-3 text-gray-400" />
                              <span className="truncate">
                                {contact.email}
                              </span>
                            </div>

                            <a
                              href={`mailto:${contact.email}`}
                              className="px-2 py-1 rounded bg-blue-50 text-blue-600 text-xs no-print"
                            >
                              {t("actions.send")}
                            </a>
                          </div>
                        )}

                        {(contact.city || contact.state) && (
                          <div className="flex items-center gap-2 bg-white rounded p-2">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            <span className="truncate">
                              {[contact.city, contact.state]
                                .filter(Boolean)
                                .join(" - ")}
                            </span>
                          </div>
                        )}

                        {contact.notes && (
                          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                            📝 {contact.notes}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1 mt-3 pt-2 border-t border-border no-print">
                        <button
                          onClick={() => setEditingContact(contact)}
                          className="flex-1 px-2 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs flex items-center justify-center gap-1"
                        >
                          <Edit className="w-3 h-3" />
                          {t("actions.edit")}
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(t("confirmDelete"))) {
                              deleteContact(contact.id);
                            }
                          }}
                          className="flex-1 px-2 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs flex items-center justify-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          {t("actions.delete")}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add/Edit Modal */}
        {(showAddModal || editingContact) && (
          <ContactModal
            contact={editingContact}
            categories={contactCategories}
            onAddCategory={addContactCategory}
            onClose={() => {
              setShowAddModal(false);
              setEditingContact(null);
            }}
            onSave={(data) => {
              if (editingContact) {
                updateContact(editingContact.id, data);
              } else {
                addContact(data);
              }

              setShowAddModal(false);
              setEditingContact(null);
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

              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 text-right">
                      {t("table.name")}
                    </th>
                    <th className="border border-gray-300 p-2 text-right">
                      {t("table.category")}
                    </th>
                    <th className="border border-gray-300 p-2 text-right">
                      {t("table.phone")}
                    </th>
                    <th className="border border-gray-300 p-2 text-right">
                      {t("table.email")}
                    </th>
                    <th className="border border-gray-300 p-2 text-right">
                      {t("table.city")}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id}>
                      <td className="border border-gray-300 p-2 font-medium">
                        {c.firstName} {c.lastName}
                      </td>

                      <td className="border border-gray-300 p-2">
                        {getCategoryInfo(c.category).label}
                      </td>

                      <td
                        className="border border-gray-300 p-2 font-mono"
                        dir="ltr"
                      >
                        {c.phone1 || "-"}
                      </td>

                      <td className="border border-gray-300 p-2">
                        {c.email || "-"}
                      </td>

                      <td className="border border-gray-300 p-2">
                        {c.city || "-"}
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

function ContactModal({
  contact,
  categories,
  onAddCategory,
  onClose,
  onSave,
}: {
  contact: any;
  categories: any[];
  onAddCategory: (cat: any) => void;
  onClose: () => void;
  onSave: (data: any) => void;
}) {
  const t = useTranslations("contacts");
  const modalT = useTranslations("contacts.modal");
  const locale = useLocale();

  const currentLocale =
    locale === "ar" || locale === "en" || locale === "fr" ? locale : "ar";

  const categoryLabels = t.raw("categories") as Record<string, string>;

  const getCategoryLabel = (
    value: string,
    fallback?: string,
    labels?: Record<string, string>
  ) => {
    return labels?.[currentLocale] || categoryLabels[value] || fallback || value;
  };

  const [formData, setFormData] = useState({
    firstName: contact?.firstName || "",
    lastName: contact?.lastName || "",
    category: contact?.category || "family",
    phone1: contact?.phone1 || "",
    phone2: contact?.phone2 || "",
    email: contact?.email || "",
    city: contact?.city || "",
    state: contact?.state || "",
    notes: contact?.notes || "",
    isFavorite: contact?.isFavorite || false,
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
    icon: "👤",
    color: "from-blue-500 to-cyan-500",
  });

  const handleAddCategory = () => {
    const arLabel = newCategory.labels.ar.trim();
    const enLabel = newCategory.labels.en.trim();
    const frLabel = newCategory.labels.fr.trim();

    const mainLabel = arLabel || enLabel || frLabel;

    if (!mainLabel) {
      alert(modalT("categoryAlerts.enterName"));
      return;
    }

    const value = newCategory.value || `custom_contact_${Date.now()}`;

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
      icon: newCategory.icon,
      color: newCategory.color,
    });

    setFormData({ ...formData, category: value });
    setShowCategoryModal(false);

    setNewCategory({
      value: "",
      label: "",
      labels: {
        ar: "",
        en: "",
        fr: "",
      },
      icon: "👤",
      color: "from-blue-500 to-cyan-500",
    });

    alert(modalT("categoryAlerts.added"));
  };

  const colorOptions = [
    { value: "from-red-500 to-rose-500", label: modalT("colors.red") },
    { value: "from-orange-500 to-amber-500", label: modalT("colors.orange") },
    { value: "from-yellow-500 to-orange-500", label: modalT("colors.yellow") },
    { value: "from-green-500 to-emerald-500", label: modalT("colors.green") },
    { value: "from-blue-500 to-cyan-500", label: modalT("colors.blue") },
    { value: "from-purple-500 to-indigo-500", label: modalT("colors.purple") },
    { value: "from-pink-500 to-rose-500", label: modalT("colors.pink") },
    { value: "from-gray-500 to-slate-500", label: modalT("colors.gray") },
  ];

  const iconOptions = [
    "👤",
    "👨",
    "👩",
    "👨‍👩‍👧‍👦",
    "👪",
    "👥",
    "💼",
    "🏢",
    "🎓",
    "⚕️",
    "💖",
    "🌟",
    "📋",
    "🤝",
    "👮",
    "🎖️",
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
        <div className="glass rounded-2xl max-w-2xl w-full max-h-[95vh] overflow-y-auto my-8">
          <div className="sticky top-0 glass border-b border-border p-6 flex items-center justify-between z-10">
            <h2 className="text-xl font-bold">
              {contact ? modalT("editTitle") : modalT("addTitle")}
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
              <FormInput
                label={`${modalT("firstName")} *`}
                value={formData.firstName}
                onChange={(value) =>
                  setFormData({ ...formData, firstName: value })
                }
                placeholder={modalT("firstNamePlaceholder")}
              />

              <FormInput
                label={`${modalT("lastName")} *`}
                value={formData.lastName}
                onChange={(value) =>
                  setFormData({ ...formData, lastName: value })
                }
                placeholder={modalT("lastNamePlaceholder")}
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {modalT("category")} *
              </label>

              <div className="flex gap-2">
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-border focus:outline-none focus:border-primary"
                >
                  {categories.map((cat: any) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {getCategoryLabel(cat.value, cat.label, cat.labels)}
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label={modalT("phone1")}
                type="tel"
                value={formData.phone1}
                onChange={(value) =>
                  setFormData({ ...formData, phone1: value })
                }
                placeholder="+213 XXX XXX XXX"
                dir="ltr"
              />

              <FormInput
                label={modalT("phone2")}
                type="tel"
                value={formData.phone2}
                onChange={(value) =>
                  setFormData({ ...formData, phone2: value })
                }
                placeholder="+213 XXX XXX XXX"
                dir="ltr"
              />
            </div>

            <FormInput
              label={modalT("email")}
              type="email"
              value={formData.email}
              onChange={(value) => setFormData({ ...formData, email: value })}
              placeholder="email@example.com"
              dir="ltr"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label={modalT("state")}
                value={formData.state}
                onChange={(value) =>
                  setFormData({ ...formData, state: value })
                }
                placeholder={modalT("statePlaceholder")}
              />

              <FormInput
                label={modalT("city")}
                value={formData.city}
                onChange={(value) => setFormData({ ...formData, city: value })}
                placeholder={modalT("cityPlaceholder")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {modalT("notes")}
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-border focus:outline-none focus:border-primary"
                placeholder={modalT("notesPlaceholder")}
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
                id="favorite-contact"
              />

              <label htmlFor="favorite-contact" className="text-sm font-medium">
                {modalT("addToFavorites")} ⭐
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => onSave(formData)}
                disabled={!formData.firstName || !formData.lastName}
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
                  placeholder={modalT("categoryNameArPlaceholder")}
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
                  placeholder={modalT("categoryNameEnPlaceholder")}
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
                  placeholder={modalT("categoryNameFrPlaceholder")}
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {modalT("emoji")}
                </label>

                <div className="grid grid-cols-8 gap-2">
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

function FormInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  dir,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 rounded-xl bg-white border border-border focus:outline-none focus:border-primary"
        placeholder={placeholder}
        dir={dir}
      />
    </div>
  );
}