import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Expense, ExpenseExporter, type ExportOptions } from "@repo/shared";

import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";

interface ExportModalProps {
  expenses: Expense[];
  visible: boolean;
  onClose: () => void;
}

export default function ExportModal({
  expenses,
  visible,
  onClose,
}: ExportModalProps) {
  const [format, setFormat] = useState<"csv" | "json" | "summary">("summary");
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const options: ExportOptions = {
        format,
        includeHeaders,
      };

      const content = ExpenseExporter.export(expenses, options);
      const filename = ExpenseExporter.getFileName(format);

      // Create temporary file
      const fileUri = FileSystem.documentDirectory + filename;
      await FileSystem.writeAsStringAsync(fileUri, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          dialogTitle: "Share Expense Report",
          mimeType: ExpenseExporter.getMimeType(format),
        });
      } else {
        Alert.alert(
          "Sharing not available",
          "Sharing is not available on this device."
        );
      }

      // Clean up temporary file
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
    } catch (error) {
      console.error("Export failed:", error);
      Alert.alert(
        "Export Failed",
        "Failed to export expense report. Please try again."
      );
    } finally {
      setIsExporting(false);
    }
  };

  const getFormatDescription = (fmt: string) => {
    switch (fmt) {
      case "csv":
        return "Spreadsheet format";
      case "json":
        return "Data format";
      case "summary":
        return "Text summary";
      default:
        return "";
    }
  };

  const summary = ExpenseExporter.generateSummary(expenses);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="bg-white px-6 py-4 border-b border-gray-200">
          <View className="flex-row justify-between items-center">
            <TouchableOpacity onPress={onClose}>
              <Text className="text-blue-600 text-lg">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-gray-900">
              Export Report
            </Text>
            <View className="w-16" />
          </View>
        </View>

        <ScrollView className="flex-1 p-6">
          {/* Summary Info */}
          <View className="bg-white rounded-lg p-4 mb-6 shadow-sm">
            <Text className="font-semibold text-gray-900 mb-3">
              Export Summary
            </Text>
            <View className="space-y-2">
              <Text className="text-gray-600">
                • {summary.totalCount} expenses selected
              </Text>
              <Text className="text-gray-600">
                • Total: {ExpenseExporter.formatCurrency(summary.totalAmount)}
              </Text>
              {summary.dateRange.start && summary.dateRange.end && (
                <Text className="text-gray-600">
                  • Period: {summary.dateRange.start} - {summary.dateRange.end}
                </Text>
              )}
              <Text className="text-gray-600">
                • Categories: {Object.keys(summary.categorySummary).length}
              </Text>
            </View>
          </View>

          {/* Format Selection */}
          <View className="mb-6">
            <Text className="font-semibold text-gray-900 mb-3">
              Export Format
            </Text>
            <View className="space-y-3">
              {(["summary", "csv", "json"] as const).map((fmt) => (
                <TouchableOpacity
                  key={fmt}
                  onPress={() => setFormat(fmt)}
                  className={`p-4 rounded-lg border ${
                    format === fmt
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  <View className="flex-row items-center">
                    <View
                      className={`w-5 h-5 rounded-full border-2 mr-3 ${
                        format === fmt
                          ? "border-blue-500 bg-blue-500"
                          : "border-gray-300"
                      }`}
                    >
                      {format === fmt && (
                        <View className="w-2 h-2 rounded-full bg-white m-auto" />
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="font-medium text-gray-900">
                        {fmt.toUpperCase()}
                      </Text>
                      <Text className="text-sm text-gray-600">
                        {getFormatDescription(fmt)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Options */}
          {(format === "csv" || format === "summary") && (
            <View className="mb-6">
              <TouchableOpacity
                onPress={() => setIncludeHeaders(!includeHeaders)}
                className="flex-row items-center"
              >
                <View
                  className={`w-5 h-5 rounded border-2 mr-3 ${
                    includeHeaders
                      ? "border-blue-500 bg-blue-500"
                      : "border-gray-300"
                  }`}
                >
                  {includeHeaders && (
                    <Text className="text-white text-xs text-center leading-none">
                      ✓
                    </Text>
                  )}
                </View>
                <Text className="text-gray-700">
                  Include headers and summary information
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Action Buttons */}
          <TouchableOpacity
            onPress={handleExport}
            disabled={isExporting}
            className={`py-4 rounded-lg ${
              isExporting ? "bg-gray-400" : "bg-blue-600"
            }`}
          >
            <View className="flex-row items-center justify-center">
              {isExporting && (
                <ActivityIndicator
                  size="small"
                  color="white"
                  className="mr-2"
                />
              )}
              <Text className="text-white font-semibold text-center">
                {isExporting ? "Exporting..." : "Export & Share File"}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Help Text */}
          <View className="mt-6 p-4 bg-blue-50 rounded-lg">
            <Text className="text-sm text-blue-800">
              💡 <Text className="font-semibold">Tip:</Text> Export files can be
              shared via any app on your device. CSV files work great with
              spreadsheet apps like Excel or Google Sheets.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
