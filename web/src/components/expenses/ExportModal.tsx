"use client";

import React, { useState } from "react";
import { Expense, ExpenseExporter, type ExportOptions } from "shared";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { RadioGroup, Radio } from "@heroui/radio";
import { Switch } from "@heroui/switch";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";

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

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const options: ExportOptions = {
        format,
        includeHeaders,
      };

      const blob = await ExpenseExporter.exportToFile(expenses, options);

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = ExpenseExporter.generateFilename(format);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
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

  const getFormatIcon = (fmt: string) => {
    switch (fmt) {
      case "csv":
        return "📊";
      case "json":
        return "🔧";
      case "summary":
        return "📄";
      default:
        return "📁";
    }
  };

  const summary = ExpenseExporter.generateSummary(expenses);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span>📤</span>
            <span>Export Report</span>
          </div>
        </ModalHeader>

        <ModalBody>
          {/* Summary Info */}
          <Card className="bg-gray-50">
            <CardBody className="p-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <span>📈</span>
                Export Summary
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Chip color="primary" variant="flat" size="sm">
                    {summary.totalCount}
                  </Chip>
                  <span className="text-sm text-gray-600">
                    expenses selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Chip color="success" variant="flat" size="sm">
                    {ExpenseExporter.formatCurrency(summary.totalAmount)}
                  </Chip>
                  <span className="text-sm text-gray-600">total amount</span>
                </div>
                {summary.dateRange.start && summary.dateRange.end && (
                  <div className="col-span-2 flex items-center gap-2">
                    <Chip color="secondary" variant="flat" size="sm">
                      {summary.dateRange.start} - {summary.dateRange.end}
                    </Chip>
                    <span className="text-sm text-gray-600">date range</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Chip color="warning" variant="flat" size="sm">
                    {Object.keys(summary.categorySummary).length}
                  </Chip>
                  <span className="text-sm text-gray-600">categories</span>
                </div>
              </div>
            </CardBody>
          </Card>

          <Divider />

          {/* Format Selection */}
          <div>
            <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <span>🎯</span>
              Export Format
            </h4>
            <RadioGroup
              value={format}
              onValueChange={(value) =>
                setFormat(value as "csv" | "json" | "summary")
              }
              className="gap-3"
            >
              {(["csv", "json", "summary"] as const).map((fmt) => (
                <Radio key={fmt} value={fmt} className="w-full">
                  <div className="flex items-start gap-3 w-full">
                    <span className="text-lg">{getFormatIcon(fmt)}</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {fmt.toUpperCase()}
                      </div>
                      <div className="text-sm text-gray-600">
                        {getFormatDescription(fmt)}
                      </div>
                    </div>
                  </div>
                </Radio>
              ))}
            </RadioGroup>
          </div>

          <Divider />

          {/* Options */}
          <div>
            <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <span>⚙️</span>
              Export Options
            </h4>
            <div className="space-y-3">
              <Switch
                isSelected={includeHeaders}
                onValueChange={setIncludeHeaders}
                isDisabled={format === "summary"}
                size="sm"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Include Headers</span>
                  <span className="text-xs text-gray-500">
                    {format === "summary"
                      ? "Not applicable for summary format"
                      : "Add column headers to the exported file"}
                  </span>
                </div>
              </Switch>
            </div>
          </div>

          {/* Preview */}
          {format === "summary" && (
            <>
              <Divider />
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <span>👁️</span>
                  Preview
                </h4>
                <Card className="bg-gray-50">
                  <CardBody className="p-4">
                    <div className="text-sm font-mono whitespace-pre-wrap text-gray-700">
                      {ExpenseExporter.generateTextSummary(expenses).slice(
                        0,
                        300
                      )}
                      {ExpenseExporter.generateTextSummary(expenses).length >
                        300 && "..."}
                    </div>
                  </CardBody>
                </Card>
              </div>
            </>
          )}
        </ModalBody>

        <ModalFooter>
          <Button
            color="danger"
            variant="light"
            onPress={onClose}
            isDisabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={handleExport}
            isLoading={isExporting}
            isDisabled={isExporting || expenses.length === 0}
            startContent={!isExporting ? <span>💾</span> : undefined}
          >
            {isExporting ? "Exporting..." : `Export ${format.toUpperCase()}`}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
