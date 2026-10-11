"use client";

import { useState } from "react";
import { X, Printer, Download } from "lucide-react";

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: React.ReactNode;
  onPrint?: () => void;
}

export default function PreviewModal({
  isOpen,
  onClose,
  title,
  content,
  onPrint,
}: PreviewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">معاينة: {title}</h2>
          <div className="flex gap-2">
            {onPrint && (
              <button
                onClick={onPrint}
                className="px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 flex items-center gap-1.5 text-sm"
              >
                <Printer className="w-4 h-4" />
                طباعة
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6" id="preview-content">
          {content}
        </div>
      </div>
    </div>
  );
}