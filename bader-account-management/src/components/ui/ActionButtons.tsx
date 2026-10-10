"use client";

import { Printer, Eye, FileDown, FileText, Download } from "lucide-react";

interface ActionButtonsProps {
  onPrint?: () => void;
  onPreview?: () => void;
  onExportPDF?: () => void;
  onExportExcel?: () => void;
  title?: string;
}

export default function ActionButtons({
  onPrint,
  onPreview,
  onExportPDF,
  onExportExcel,
  title,
}: ActionButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {onPreview && (
        <button
          onClick={onPreview}
          className="px-4 py-2 rounded-xl glass hover:bg-white/80 transition-colors flex items-center gap-2 text-sm"
        >
          <Eye className="w-4 h-4" />
          معاينة
        </button>
      )}
      {onPrint && (
        <button
          onClick={onPrint}
          className="px-4 py-2 rounded-xl glass hover:bg-white/80 transition-colors flex items-center gap-2 text-sm"
        >
          <Printer className="w-4 h-4" />
          طباعة
        </button>
      )}
      {onExportPDF && (
        <button
          onClick={onExportPDF}
          className="px-4 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center gap-2 text-sm"
        >
          <FileText className="w-4 h-4" />
          PDF
        </button>
      )}
      {onExportExcel && (
        <button
          onClick={onExportExcel}
          className="px-4 py-2 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 transition-colors flex items-center gap-2 text-sm"
        >
          <FileDown className="w-4 h-4" />
          Excel
        </button>
      )}
    </div>
  );
}