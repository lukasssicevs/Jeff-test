"use client";

import React, { useState } from "react";
import { Expense, ExpenseExporter, type ExportOptions } from "shared";

interface ExportModalProps {
  expenses: Expense[];
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportModal({
  expenses,
  isOpen,
  onClose,
}: ExportModalProps) {
  const [format, setFormat] = useState<"csv" | "json" | "summary">("csv");
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const options: ExportOptions = {
        format,
        includeHeaders,
      };

      const content = ExpenseExporter.export(expenses, options);
      const filename = ExpenseExporter.getFileName(format);
      const mimeType = ExpenseExporter.getMimeType(format);

      // Create and download file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onClose();
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const getFormatDescription = (fmt: string) => {
    switch (fmt) {
      case "csv":
        return "Spreadsheet format (Excel, Google Sheets)";
      case "json":
        return "Structured data format for developers";
      case "summary":
        return "Human-readable text summary";
      default:
        return "";
    }
  };

  const summary = ExpenseExporter.generateSummary(expenses);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Export Report
        </h3>

        {/* Summary Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-2">Export Summary</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• {summary.totalCount} expenses selected</p>
            <p>
              • Total amount:{" "}
              {ExpenseExporter.formatCurrency(summary.totalAmount)}
            </p>
            {summary.dateRange.start && summary.dateRange.end && (
              <p>
                • Date range: {summary.dateRange.start} -{" "}
                {summary.dateRange.end}
              </p>
            )}
            <p>• {Object.keys(summary.categorySummary).length} categories</p>
          </div>
        </div>

        {/* Format Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Export Format
          </label>
          <div className="space-y-3">
            {(["csv", "json", "summary"] as const).map((fmt) => (
              <label key={fmt} className="flex items-start">
                <input
                  type="radio"
                  value={fmt}
                  checked={format === fmt}
                  onChange={(e) => setFormat(e.target.value as any)}
                  className="mt-1 mr-3"
                />
                <div>
                  <div className="font-medium text-gray-900">
                    {fmt.toUpperCase()}
                  </div>
                  <div className="text-sm text-gray-600">
                    {getFormatDescription(fmt)}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Options */}
        {(format === "csv" || format === "summary") && (
          <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={includeHeaders}
                onChange={(e) => setIncludeHeaders(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">
                Include headers and summary information
              </span>
            </label>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? "Exporting..." : "Download File"}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-4 text-xs text-gray-500">
          <p>
            💡 <strong>Tip:</strong> CSV files can be opened in Excel or Google
            Sheets. Summary format creates a readable text file perfect for
            sharing.
          </p>
        </div>
      </div>
    </div>
  );
}
