"use client";

import { useState, useMemo, useRef, type ChangeEvent } from "react";
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
  Calendar,
  MapPin,
  Eye,
  EyeOff,
  User,
  Camera,
  Hash,
  Tag,
  Lock,
} from "lucide-react";
import { copyToClipboard } from "@/lib/utils";
import PreviewModal from "@/components/ui/PreviewModal";
import { printElement } from "@/lib/print";

export default function DocumentsPage() {
  const t = useTranslations("documents");
  const locale = useLocale();

  const documents = useStore((state) => state.documents);
  const addDocument = useStore((state) => state.addDocument);
  const updateDocument = useStore((state) => state.updateDocument);
  const deleteDocument = useStore((state) => state.deleteDocument);
  const toggleFavoriteDocument = useStore(
    (state) => state.toggleFavoriteDocument
  );
  const exportAllData = useStore((state) => state.exportAllData);
  const importAllData = useStore((state) => state.importAllData);
  const documentCategories = useStore((state) => state.documentCategories);
  const addDocumentCategory = useStore((state) => state.addDocumentCategory);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any | null>(null);
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
    return labels?.[currentLocale] || categoryLabels[value] || fallback || value;
  };

  const getDocType = (type: string) => {
    const found: any =
      documentCategories.find((c: any) => c.value === type) ||
      documentCategories[documentCategories.length - 1] || {
        value: "other",
        label: t("categories.other"),
        icon: "📄",
        color: "from-gray-500 to-slate-600",
      };

    return {
      ...found,
      label: getCategoryLabel(found.value, found.label, found.labels),
    };
  };

  const filtered = useMemo(() => {
    const query = search.toLowerCase();

    return documents.filter((doc) => {
      const docType = getDocType(doc.type);

      const matchesSearch =
        (doc.firstName || "").toLowerCase().includes(query) ||
        (doc.lastName || "").toLowerCase().includes(query) ||
        (doc.firstNameLatin || "").toLowerCase().includes(query) ||
        (doc.lastNameLatin || "").toLowerCase().includes(query) ||
        (doc.documentNumber || "").includes(search) ||
        (doc.nationalIdNumber || "").includes(search) ||
        (doc.nationality || "").toLowerCase().includes(query) ||
        docType.label.toLowerCase().includes(query);

      if (!matchesSearch) return false;
      if (filter !== "all" && doc.type !== filter) return false;

      return true;
    });
  }, [
    documents,
    search,
    filter,
    documentCategories,
    categoryLabels,
    currentLocale,
  ]);

  const stats = {
    total: documents.length,
    nationalId: documents.filter((d) => d.type === "national_id").length,
    passport: documents.filter((d) => d.type === "passport").length,
    favorites: documents.filter((d) => d.isFavorite).length,
  };

  const handleExport = async () => {
    await exportEncryptedBackup(exportAllData(), "bader-documents");
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
      <div className="space-y-6" id="documents-content">
        {/* Header */}
        <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">📄 {t("title")}</h1>
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
              onClick={() => printElement("documents-content", printTitle)}
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
              {t("actions.addDocument")}
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
            <div className="text-3xl mb-1">📄</div>
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-gray-600">{t("stats.total")}</div>
          </button>

          <button
            onClick={() => setFilter("national_id")}
            className={`glass rounded-2xl p-4 text-right card-hover transition-all ${
              filter === "national_id" ? "ring-2 ring-primary scale-105" : ""
            }`}
          >
            <div className="text-3xl mb-1">🆔</div>
            <div className="text-2xl font-bold">{stats.nationalId}</div>
            <div className="text-sm text-gray-600">
              {t("stats.nationalId")}
            </div>
          </button>

          <button
            onClick={() => setFilter("passport")}
            className={`glass rounded-2xl p-4 text-right card-hover transition-all ${
              filter === "passport" ? "ring-2 ring-primary scale-105" : ""
            }`}
          >
            <div className="text-3xl mb-1">📕</div>
            <div className="text-2xl font-bold">{stats.passport}</div>
            <div className="text-sm text-gray-600">{t("stats.passport")}</div>
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
              <option value="all">{t("filters.allTypes")}</option>
              {documentCategories.map((type: any) => (
                <option key={type.value} value={type.value}>
                  {type.icon}{" "}
                  {getCategoryLabel(type.value, type.label, type.labels)}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter Buttons */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {documentCategories.map((type: any) => {
              const count = documents.filter((d) => d.type === type.value)
                .length;
              const label = getCategoryLabel(
                type.value,
                type.label,
                type.labels
              );

              return (
                <button
                  key={type.value}
                  onClick={() => setFilter(type.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1 ${
                    filter === type.value
                      ? "text-white shadow-md"
                      : "bg-white hover:bg-gray-50"
                  }`}
                  style={
                    filter === type.value
                      ? { backgroundColor: "rgb(var(--color-primary))" }
                      : {}
                  }
                >
                  <span>{type.icon}</span>
                  <span>{label}</span>
                  <span className="bg-white/30 px-1.5 rounded-full text-xs">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Documents List */}
        {filtered.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-xl font-bold mb-2">{t("empty.title")}</h3>
            <p className="text-gray-600 mb-4">{t("empty.description")}</p>

            <button
              onClick={() => setShowAddModal(true)}
              className="btn-3d px-5 py-2.5 rounded-xl text-white font-medium inline-flex items-center gap-2 no-print"
              style={{ background: "rgb(var(--color-primary))" }}
            >
              <Plus className="w-5 h-5" />
              {t("actions.addDocument")}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((doc) => {
              const docType = getDocType(doc.type);

              return (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  docType={docType}
                  showSecrets={showSecrets[doc.id] || false}
                  onToggleShow={() =>
                    setShowSecrets({
                      ...showSecrets,
                      [doc.id]: !showSecrets[doc.id],
                    })
                  }
                  onEdit={() => setEditingDoc(doc)}
                  onDelete={() => {
                    if (confirm(t("confirmDelete"))) {
                      deleteDocument(doc.id);
                    }
                  }}
                  onFavorite={() => toggleFavoriteDocument(doc.id)}
                />
              );
            })}
          </div>
        )}

        {/* Add/Edit Modal */}
        {(showAddModal || editingDoc) && (
          <DocumentModal
            document={editingDoc}
            categories={documentCategories}
            onAddCategory={addDocumentCategory}
            onClose={() => {
              setShowAddModal(false);
              setEditingDoc(null);
            }}
            onSave={(data) => {
              if (editingDoc) {
                updateDocument(editingDoc.id, data);
              } else {
                addDocument(data);
              }

              setShowAddModal(false);
              setEditingDoc(null);
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
                      {t("table.type")}
                    </th>
                    <th className="border border-gray-300 p-2 text-right">
                      {t("table.name")}
                    </th>
                    <th className="border border-gray-300 p-2 text-right">
                      {t("table.documentNumber")}
                    </th>
                    <th className="border border-gray-300 p-2 text-right">
                      {t("table.nationalId")}
                    </th>
                    <th className="border border-gray-300 p-2 text-right">
                      {t("table.nationality")}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((doc) => {
                    const docType = getDocType(doc.type);

                    return (
                      <tr key={doc.id}>
                        <td className="border border-gray-300 p-2">
                          {docType.icon} {doc.customTypeName || docType.label}
                        </td>

                        <td className="border border-gray-300 p-2 font-medium">
                          {doc.firstNameLatin || doc.firstName}{" "}
                          {doc.lastNameLatin || doc.lastName}
                        </td>

                        <td className="border border-gray-300 p-2 font-mono">
                          {doc.documentNumber}
                        </td>

                        <td className="border border-gray-300 p-2 font-mono">
                          {doc.nationalIdNumber || "-"}
                        </td>

                        <td className="border border-gray-300 p-2">
                          {doc.nationality || "-"}
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

function DocumentCard({
  doc,
  docType,
  showSecrets,
  onToggleShow,
  onEdit,
  onDelete,
  onFavorite,
}: {
  doc: any;
  docType: any;
  showSecrets: boolean;
  onToggleShow: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onFavorite: () => void;
}) {
  const t = useTranslations("documents");
  const locale = useLocale();

  const localeForDate =
    locale === "ar" ? "ar-DZ" : locale === "fr" ? "fr-FR" : "en-US";

  const maskLast = (value?: string) => {
    if (!value) return "••••";
    return "•••• " + value.slice(-4);
  };

  const genderLabel = (gender: string) => {
    if (gender === "male") return t("gender.male");
    if (gender === "female") return t("gender.female");
    return gender;
  };

  return (
    <div className="glass rounded-2xl p-5 card-hover account-card">
      <div className="flex items-start gap-4">
        {/* Document Visual */}
        <div
          className={`w-64 flex-shrink-0 bg-gradient-to-br ${docType.color} rounded-2xl p-4 text-white shadow-2xl relative overflow-hidden aspect-[3/2]`}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>

          <div className="relative z-10 h-full flex flex-col justify-between text-xs">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] uppercase opacity-80">
                  {t("card.republic")}
                </div>
                <div className="text-[10px] uppercase opacity-80">
                  {doc.customTypeName || docType.label}
                </div>
              </div>
              <div className="text-2xl">{docType.icon}</div>
            </div>

            <div className="flex gap-3 mt-2">
              <div className="w-16 h-20 bg-white/30 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                {doc.avatar ? (
                  <img
                    src={doc.avatar}
                    alt="photo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 opacity-40" />
                )}
              </div>

              <div className="flex-1 text-[10px] space-y-1 min-w-0">
                <div>
                  <div className="opacity-70">{t("card.name")}</div>
                  <div className="font-bold text-xs truncate">
                    {doc.firstNameLatin || doc.firstName || "---"}{" "}
                    {doc.lastNameLatin || doc.lastName || "---"}
                  </div>
                </div>

                {doc.birthDate && (
                  <div>
                    <div className="opacity-70">{t("card.birth")}</div>
                    <div className="font-mono">
                      {new Date(doc.birthDate).toLocaleDateString(
                        localeForDate
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <div className="opacity-70">{t("card.number")}</div>
                  <div className="font-mono text-xs truncate">
                    {showSecrets
                      ? doc.documentNumber
                      : maskLast(doc.documentNumber)}
                  </div>
                </div>
              </div>
            </div>

            {doc.nationality && (
              <div className="text-[9px] opacity-80 mt-1 truncate">
                🌍 {doc.nationality}
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-lg font-bold">
                {doc.firstName} {doc.lastName}
              </h3>

              {doc.firstNameLatin && (
                <p className="text-xs text-gray-500" dir="ltr">
                  {doc.firstNameLatin} {doc.lastNameLatin}
                </p>
              )}

              <p className="text-xs text-gray-500">
                {doc.customTypeName || docType.label}
              </p>
            </div>

            <button
              onClick={onFavorite}
              className="text-2xl hover:scale-110 transition-transform no-print"
              title={t("actions.favorite")}
            >
              {doc.isFavorite ? "⭐" : "☆"}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-1 text-xs">
            <div className="flex items-center gap-2 bg-white rounded p-1.5">
              <Hash className="w-3 h-3 text-gray-400" />
              <strong>{t("card.documentNumber")}:</strong>
              <span className="font-mono">
                {showSecrets
                  ? doc.documentNumber
                  : maskLast(doc.documentNumber)}
              </span>
              <button
                onClick={() => copyToClipboard(doc.documentNumber)}
                className="p-1 rounded hover:bg-gray-100 no-print"
                title={t("actions.copy")}
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>

            {doc.nationalIdNumber && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded p-1.5">
                <Hash className="w-3 h-3 text-amber-600" />
                <strong className="text-amber-700">
                  {t("card.nationalId")}:
                </strong>
                <span className="font-mono font-bold">
                  {showSecrets
                    ? doc.nationalIdNumber
                    : maskLast(doc.nationalIdNumber)}
                </span>
                <button
                  onClick={() => copyToClipboard(doc.nationalIdNumber)}
                  className="p-1 rounded hover:bg-amber-100 no-print"
                  title={t("actions.copy")}
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            )}

            {doc.nationality && (
              <div className="flex items-center gap-2 bg-white rounded p-1.5">
                <span>🌍</span>
                <strong>{t("card.nationality")}:</strong>
                <span>{doc.nationality}</span>
              </div>
            )}

            {doc.birthDate && (
              <div className="flex items-center gap-2 bg-white rounded p-1.5">
                <Calendar className="w-3 h-3 text-gray-400" />
                <strong>{t("card.birthDate")}:</strong>
                <span>
                  {new Date(doc.birthDate).toLocaleDateString(localeForDate)}
                </span>
              </div>
            )}

            {doc.expiryDate && (
              <div className="flex items-center gap-2 bg-white rounded p-1.5">
                <Calendar className="w-3 h-3 text-red-600" />
                <strong>{t("card.expiryDate")}:</strong>
                <span>
                  {new Date(doc.expiryDate).toLocaleDateString(localeForDate)}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-1 mt-2 no-print">
            <button
              onClick={onToggleShow}
              className="px-2 py-1 rounded bg-gray-50 text-gray-600 text-xs"
              title={showSecrets ? t("actions.hide") : t("actions.show")}
            >
              {showSecrets ? (
                <EyeOff className="w-3 h-3" />
              ) : (
                <Eye className="w-3 h-3" />
              )}
            </button>

            <button
              onClick={onEdit}
              className="flex-1 px-2 py-1 rounded bg-blue-50 text-blue-600 text-xs flex items-center justify-center gap-1"
            >
              <Edit className="w-3 h-3" />
              {t("actions.edit")}
            </button>

            <button
              onClick={onDelete}
              className="flex-1 px-2 py-1 rounded bg-red-50 text-red-600 text-xs flex items-center justify-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              {t("actions.delete")}
            </button>
          </div>
        </div>
      </div>

      {/* More info */}
      {(doc.fullAddress ||
        doc.city ||
        doc.birthPlace ||
        doc.gender ||
        doc.bloodType ||
        doc.pinCode ||
        doc.notes) && (
        <div className="mt-3 pt-3 border-t border-border space-y-1 text-xs">
          {doc.fullAddress && (
            <div className="flex items-center gap-2 bg-white rounded p-1.5">
              <MapPin className="w-3 h-3 text-gray-400" />
              <strong>{t("card.address")}:</strong>
              <span className="truncate">
                {doc.fullAddress}
                {doc.postalCode && ` - ${doc.postalCode}`}
              </span>
            </div>
          )}

          {doc.birthPlace && (
            <div className="flex items-center gap-2 bg-white rounded p-1.5">
              <strong>{t("card.birthPlace")}:</strong>
              <span>{doc.birthPlace}</span>
            </div>
          )}

          {doc.gender && (
            <div className="flex items-center gap-2 bg-white rounded p-1.5">
              <User className="w-3 h-3 text-gray-400" />
              <strong>{t("card.gender")}:</strong>
              <span>{genderLabel(doc.gender)}</span>
            </div>
          )}

          {doc.bloodType && (
            <div className="flex items-center gap-2 bg-white rounded p-1.5">
              <strong>🩸 {t("card.bloodType")}:</strong>
              <span className="font-bold text-red-600">{doc.bloodType}</span>
            </div>
          )}

          {doc.pinCode && (
            <div className="flex items-center gap-2 bg-white rounded p-1.5">
              <Lock className="w-3 h-3 text-yellow-600" />
              <strong>PIN:</strong>
              <span className="font-mono">
                {showSecrets ? doc.pinCode : "••••"}
              </span>
            </div>
          )}

          {doc.notes && (
            <div className="text-gray-600 bg-gray-50 p-2 rounded">
              📝 {doc.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DocumentModal({
  document,
  categories,
  onAddCategory,
  onClose,
  onSave,
}: {
  document: any;
  categories: any[];
  onAddCategory: (cat: any) => void;
  onClose: () => void;
  onSave: (data: any) => void;
}) {
  const t = useTranslations("documents");
  const modalT = useTranslations("documents.modal");
  const locale = useLocale();

  const currentLocale =
    locale === "ar" || locale === "en" || locale === "fr" ? locale : "ar";

  const localeForDate =
    locale === "ar" ? "ar-DZ" : locale === "fr" ? "fr-FR" : "en-US";

  const categoryLabels = t.raw("categories") as Record<string, string>;

  const getCategoryLabel = (
    value: string,
    fallback?: string,
    labels?: Record<string, string>
  ) => {
    return labels?.[currentLocale] || categoryLabels[value] || fallback || value;
  };

  const [formData, setFormData] = useState({
    type: document?.type || "national_id",
    customTypeName: document?.customTypeName || "",
    firstName: document?.firstName || "",
    lastName: document?.lastName || "",
    firstNameLatin: document?.firstNameLatin || "",
    lastNameLatin: document?.lastNameLatin || "",
    documentNumber: document?.documentNumber || "",
    nationalIdNumber: document?.nationalIdNumber || "",
    fullAddress: document?.fullAddress || "",
    postalCode: document?.postalCode || "",
    city: document?.city || "",
    nationality: document?.nationality || "",
    birthDate: document?.birthDate || "",
    birthPlace: document?.birthPlace || "",
    gender: document?.gender || "",
    issueDate: document?.issueDate || "",
    expiryDate: document?.expiryDate || "",
    issuePlace: document?.issuePlace || "",
    pinCode: document?.pinCode || "",
    bloodType: document?.bloodType || "",
    notes: document?.notes || "",
    isFavorite: document?.isFavorite || false,
    avatar: document?.avatar || "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState({
    value: "",
    label: "",
    labels: {
      ar: "",
      en: "",
      fr: "",
    },
    color: "from-gray-500 to-slate-600",
    icon: "📄",
  });

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert(modalT("alerts.imageTooLarge"));
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      setFormData({
        ...formData,
        avatar: event.target?.result as string,
      });
    };

    reader.readAsDataURL(file);
  };

  const handleAddCategory = () => {
    const arLabel = newCategory.labels.ar.trim();
    const enLabel = newCategory.labels.en.trim();
    const frLabel = newCategory.labels.fr.trim();

    const mainLabel = arLabel || enLabel || frLabel;

    if (!mainLabel) {
      alert(modalT("categoryAlerts.enterName"));
      return;
    }

    const value = newCategory.value || `custom_document_${Date.now()}`;

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
      color: "from-gray-500 to-slate-600",
      icon: "📄",
    });

    alert(modalT("categoryAlerts.added"));
  };

  const colorOptions = [
    { value: "from-blue-500 to-cyan-500", label: modalT("colors.blue") },
    { value: "from-green-500 to-emerald-500", label: modalT("colors.green") },
    { value: "from-orange-500 to-red-500", label: modalT("colors.orange") },
    { value: "from-purple-500 to-indigo-500", label: modalT("colors.purple") },
    { value: "from-red-500 to-pink-500", label: modalT("colors.red") },
    { value: "from-emerald-500 to-teal-500", label: modalT("colors.teal") },
    { value: "from-yellow-500 to-orange-500", label: modalT("colors.yellow") },
    { value: "from-slate-500 to-gray-500", label: modalT("colors.gray") },
  ];

  const iconOptions = [
    "🆔",
    "🚗",
    "📕",
    "🏠",
    "⚕️",
    "💼",
    "🎓",
    "🚙",
    "💰",
    "🎖️",
    "📄",
    "✈️",
  ];

  const docType =
    categories.find((c) => c.value === formData.type) || categories[0];

  const docTypeLabel = docType
    ? getCategoryLabel(
        docType.value,
        docType.label,
        (docType as any).labels
      )
    : "";

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
        <div className="glass rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto my-8">
          <div className="sticky top-0 glass border-b border-border p-6 flex items-center justify-between z-10">
            <h2 className="text-xl font-bold">
              {document ? modalT("editTitle") : modalT("addTitle")}
            </h2>

            <button
              onClick={onClose}
              className="p-2 hover:bg-white/60 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Live Preview */}
            <div className="space-y-3">
              <h3 className="font-bold text-primary flex items-center gap-2">
                <Eye className="w-4 h-4" />
                {modalT("documentPreview")}
              </h3>

              <div
                className={`bg-gradient-to-br ${
                  docType?.color || "from-blue-500 to-indigo-600"
                } rounded-2xl p-5 text-white shadow-2xl relative overflow-hidden aspect-[3/2]`}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full -ml-20 -mb-20"></div>

                <div className="relative z-10 h-full flex flex-col justify-between text-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[10px] uppercase opacity-80">
                        {t("card.republic")}
                      </div>
                      <div className="text-[10px] uppercase opacity-80">
                        {formData.customTypeName || docTypeLabel}
                      </div>
                    </div>
                    <div className="text-3xl">{docType?.icon}</div>
                  </div>

                  <div className="flex gap-3 mt-2">
                    <div className="relative w-20 h-24 bg-white/30 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {formData.avatar ? (
                        <img
                          src={formData.avatar}
                          alt="photo"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-10 h-10 opacity-40" />
                      )}
                    </div>

                    <div className="flex-1 text-xs space-y-1">
                      <div>
                        <div className="opacity-70 text-[10px]">
                          {t("card.name")}
                        </div>
                        <div className="font-bold text-sm truncate">
                          {formData.firstNameLatin ||
                            formData.firstName ||
                            "---"}{" "}
                          {formData.lastNameLatin ||
                            formData.lastName ||
                            "---"}
                        </div>
                      </div>

                      {formData.birthDate && (
                        <div>
                          <div className="opacity-70 text-[10px]">
                            {t("card.birth")}
                          </div>
                          <div className="font-mono text-xs">
                            {new Date(formData.birthDate).toLocaleDateString(
                              localeForDate
                            )}
                          </div>
                        </div>
                      )}

                      <div>
                        <div className="opacity-70 text-[10px]">
                          {t("card.number")}
                        </div>
                        <div className="font-mono text-xs truncate">
                          {formData.documentNumber
                            ? `•••• ${formData.documentNumber.slice(-4)}`
                            : "•••• ----"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {formData.nationality && (
                    <div className="text-[10px] opacity-80 mt-1 truncate">
                      🌍 {formData.nationality}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-3 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4" />
                {formData.avatar
                  ? modalT("changeImage")
                  : modalT("uploadImage")}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => setShowCategoryModal(true)}
                className="w-full px-4 py-2 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-100 text-sm flex items-center justify-center gap-2"
              >
                <Tag className="w-4 h-4" />
                {modalT("addCategoryButton")}
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    {modalT("documentType")} *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white border border-border text-sm"
                  >
                    {categories.map((type: any) => (
                      <option key={type.value} value={type.value}>
                        {type.icon}{" "}
                        {getCategoryLabel(type.value, type.label, type.labels)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">
                    {modalT("documentNumber")} *
                  </label>
                  <input
                    type="text"
                    value={formData.documentNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        documentNumber: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white border border-border font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">
                  🆔 {modalT("nationalIdNumber")}
                </label>
                <input
                  type="text"
                  value={formData.nationalIdNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nationalIdNumber: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-amber-50 border-2 border-amber-200 focus:outline-none focus:border-amber-500 font-mono text-sm"
                  placeholder="012345678901234567"
                  maxLength={20}
                />
              </div>

              {formData.type === "custom" && (
                <div>
                  <label className="block text-xs font-medium mb-1">
                    {modalT("customDocumentName")}
                  </label>
                  <input
                    type="text"
                    value={formData.customTypeName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        customTypeName: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white border border-border text-sm"
                    placeholder={modalT("customDocumentPlaceholder")}
                  />
                </div>
              )}

              {/* Arabic Name */}
              <div className="bg-blue-50 rounded-xl p-3 space-y-2">
                <div className="text-xs font-bold text-blue-700 uppercase flex items-center gap-1">
                  🇸🇦 {modalT("arabicName")}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <SmallInput
                    label={modalT("firstName")}
                    value={formData.firstName}
                    onChange={(value) =>
                      setFormData({ ...formData, firstName: value })
                    }
                    placeholder={modalT("firstNamePlaceholder")}
                  />

                  <SmallInput
                    label={modalT("lastName")}
                    value={formData.lastName}
                    onChange={(value) =>
                      setFormData({ ...formData, lastName: value })
                    }
                    placeholder={modalT("lastNamePlaceholder")}
                  />
                </div>
              </div>

              {/* Latin Name */}
              <div className="bg-purple-50 rounded-xl p-3 space-y-2">
                <div className="text-xs font-bold text-purple-700 uppercase flex items-center gap-1">
                  🇬🇧 {modalT("latinName")}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <SmallInput
                    label="First Name"
                    value={formData.firstNameLatin}
                    onChange={(value) =>
                      setFormData({ ...formData, firstNameLatin: value })
                    }
                    placeholder="MOHAMED"
                    dir="ltr"
                  />

                  <SmallInput
                    label="Last Name"
                    value={formData.lastNameLatin}
                    onChange={(value) =>
                      setFormData({ ...formData, lastNameLatin: value })
                    }
                    placeholder="LARBI"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Personal Info */}
              <div className="grid grid-cols-2 gap-3">
                <SmallInput
                  label={modalT("nationality")}
                  value={formData.nationality}
                  onChange={(value) =>
                    setFormData({ ...formData, nationality: value })
                  }
                  placeholder={modalT("nationalityPlaceholder")}
                />

                <div>
                  <label className="block text-xs font-medium mb-1">
                    {modalT("gender")}
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({ ...formData, gender: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white border border-border text-sm"
                  >
                    <option value="">{modalT("choose")}</option>
                    <option value="male">{t("gender.male")}</option>
                    <option value="female">{t("gender.female")}</option>
                  </select>
                </div>

                <DateInput
                  label={modalT("birthDate")}
                  value={formData.birthDate}
                  onChange={(value) =>
                    setFormData({ ...formData, birthDate: value })
                  }
                />

                <SmallInput
                  label={modalT("birthPlace")}
                  value={formData.birthPlace}
                  onChange={(value) =>
                    setFormData({ ...formData, birthPlace: value })
                  }
                />

                <div>
                  <label className="block text-xs font-medium mb-1">
                    {modalT("bloodType")}
                  </label>
                  <select
                    value={formData.bloodType}
                    onChange={(e) =>
                      setFormData({ ...formData, bloodType: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white border border-border text-sm"
                  >
                    <option value="">{modalT("choose")}</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <SmallInput
                  label={modalT("postalCode")}
                  value={formData.postalCode}
                  onChange={(value) =>
                    setFormData({ ...formData, postalCode: value })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">
                  {modalT("fullAddress")}
                </label>
                <textarea
                  value={formData.fullAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, fullAddress: e.target.value })
                  }
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-border text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <DateInput
                  label={modalT("issueDate")}
                  value={formData.issueDate}
                  onChange={(value) =>
                    setFormData({ ...formData, issueDate: value })
                  }
                />

                <DateInput
                  label={modalT("expiryDate")}
                  value={formData.expiryDate}
                  onChange={(value) =>
                    setFormData({ ...formData, expiryDate: value })
                  }
                />

                <SmallInput
                  label="PIN"
                  value={formData.pinCode}
                  onChange={(value) =>
                    setFormData({ ...formData, pinCode: value })
                  }
                  placeholder="****"
                  className="font-mono"
                />
              </div>

              <SmallInput
                label={modalT("issuePlace")}
                value={formData.issuePlace}
                onChange={(value) =>
                  setFormData({ ...formData, issuePlace: value })
                }
                placeholder={modalT("issuePlacePlaceholder")}
              />

              <div>
                <label className="block text-xs font-medium mb-1">
                  {modalT("notes")}
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-border text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isFavorite}
                  onChange={(e) =>
                    setFormData({ ...formData, isFavorite: e.target.checked })
                  }
                  className="w-4 h-4"
                  id="favorite-doc"
                />
                <label htmlFor="favorite-doc" className="text-xs font-medium">
                  {modalT("addToFavorites")} ⭐
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => onSave(formData)}
                  disabled={
                    !formData.firstName ||
                    !formData.lastName ||
                    !formData.documentNumber
                  }
                  className="flex-1 btn-3d py-3 rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "rgb(var(--color-primary))" }}
                >
                  {modalT("save")}
                </button>

                <button
                  onClick={onClose}
                  className="px-4 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm"
                >
                  {modalT("cancel")}
                </button>
              </div>
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
  value,
  onChange,
  placeholder,
  dir,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  dir?: "ltr" | "rtl";
  className?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 rounded-xl bg-white border border-border text-sm ${className}`}
        placeholder={placeholder}
        dir={dir}
      />
    </div>
  );
}

function DateInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1">{label}</label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-xl bg-white border border-border text-sm"
      />
    </div>
  );
}