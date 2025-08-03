import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import type { Expense, ExportOptions } from "../../lib/types";
import { ExpenseExporter } from "../../lib/api-client";

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
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format: "csv" | "json") => {
    try {
      setExporting(true);

      const options: ExportOptions = { format };
      const result = await ExpenseExporter.exportExpenses(expenses, options);

      if (!result.success || !result.data) {
        Alert.alert("Export Failed", result.error || "Unknown error");
        return;
      }

      // Create file
      const fileName = `expenses_${new Date().toISOString().split("T")[0]}.${format}`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, result.data);

      // Share file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: format === "csv" ? "text/csv" : "application/json",
          dialogTitle: `Export Expenses as ${format.toUpperCase()}`,
        });
      } else {
        Alert.alert(
          "Export Complete",
          `File saved as ${fileName} in your documents folder.`
        );
      }

      onClose();
    } catch (error) {
      console.error("Export error:", error);
      Alert.alert("Export Failed", "An error occurred while exporting");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      transparent={true}
    >
      <View className="flex-1 justify-end">
        <LinearGradient
          colors={["rgba(0,0,0,0.5)", "rgba(0,0,0,0.8)"]}
          className="flex-1"
        >
          <TouchableOpacity
            className="flex-1"
            onPress={onClose}
            activeOpacity={1}
          />

          <View
            className="rounded-t-3xl p-6 border-t border-white/20"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.1,
              shadowRadius: 16,
              elevation: 16,
            }}
          >
            <View className="items-center mb-6">
              <View className="w-12 h-1 bg-slate-300 rounded-full mb-4" />
              <Text className="text-xl font-bold text-slate-800 mb-2">
                Export Expenses
              </Text>
              <Text className="text-slate-600 text-center">
                Export {expenses.length} expenses to file
              </Text>
            </View>

            <View className="space-y-3">
              <TouchableOpacity
                onPress={() => handleExport("csv")}
                disabled={exporting}
                className="w-full rounded-xl overflow-hidden"
              >
                <LinearGradient
                  colors={["#10b981", "#14b8a6"]}
                  className="py-4 px-6"
                >
                  <View className="flex-row items-center justify-center">
                    <Text className="text-2xl mr-3">📊</Text>
                    <View className="flex-1">
                      <Text className="text-white text-lg font-semibold">
                        Export as CSV
                      </Text>
                      <Text className="text-emerald-100 text-sm">
                        Compatible with Excel and Google Sheets
                      </Text>
                    </View>
                    {exporting && (
                      <ActivityIndicator color="white" size="small" />
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleExport("json")}
                disabled={exporting}
                className="w-full rounded-xl overflow-hidden"
              >
                <LinearGradient
                  colors={["#4f46e5", "#3b82f6"]}
                  className="py-4 px-6"
                >
                  <View className="flex-row items-center justify-center">
                    <Text className="text-2xl mr-3">📄</Text>
                    <View className="flex-1">
                      <Text className="text-white text-lg font-semibold">
                        Export as JSON
                      </Text>
                      <Text className="text-blue-100 text-sm">
                        For developers and data analysis
                      </Text>
                    </View>
                    {exporting && (
                      <ActivityIndicator color="white" size="small" />
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onClose}
                className="w-full py-4 border border-slate-300 rounded-xl"
                style={{ backgroundColor: "rgba(255, 255, 255, 0.8)" }}
              >
                <Text className="text-slate-600 text-center text-lg font-medium">
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}
