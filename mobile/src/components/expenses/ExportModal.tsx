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
import { ExpenseExporter } from "shared";

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
      const content = ExpenseExporter.export(expenses, options);

      // Create file
      const fileName = ExpenseExporter.getFileName(format);
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, content);

      // Share file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: ExpenseExporter.getMimeType(format),
          dialogTitle: `Export Expenses as ${format.toUpperCase()}`,
        });
      } else {
        Alert.alert(
          "Export Complete",
          `File saved as ${fileName} in app documents`,
        );
      }

      onClose();
    } catch (error) {
      console.error("Export error:", error);
      Alert.alert("Export Failed", "An error occurred during export");
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
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <LinearGradient
          colors={["rgba(0,0,0,0.5)", "rgba(0,0,0,0.8)"]}
          style={{ flex: 1 }}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={onClose}
            activeOpacity={1}
          />

          <View
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              borderTopWidth: 1,
              borderTopColor: "rgba(255, 255, 255, 0.2)",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.1,
              shadowRadius: 16,
              elevation: 16,
            }}
          >
            <View style={{ alignItems: "center", marginBottom: 24 }}>
              <View
                style={{
                  width: 48,
                  height: 4,
                  backgroundColor: "#cbd5e1",
                  borderRadius: 2,
                  marginBottom: 16,
                }}
              />
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "600",
                  color: "#1e293b",
                  marginBottom: 8,
                }}
              >
                Export Expenses
              </Text>
              <Text style={{ color: "#64748b", textAlign: "center" }}>
                Choose a format to export your {expenses.length} expenses
              </Text>
            </View>

            <View style={{ gap: 16 }}>
              {/* CSV Export */}
              <TouchableOpacity
                onPress={() => handleExport("csv")}
                disabled={exporting}
                style={{
                  width: "100%",
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                <LinearGradient
                  colors={["#10b981", "#14b8a6"]}
                  style={{
                    paddingVertical: 16,
                    paddingHorizontal: 24,
                    opacity: exporting ? 0.5 : 1,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ fontSize: 24, marginRight: 16 }}>📊</Text>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: "white",
                          fontSize: 18,
                          fontWeight: "600",
                        }}
                      >
                        Export as CSV
                      </Text>
                      <Text
                        style={{
                          color: "rgba(167, 243, 208, 1)",
                          fontSize: 14,
                        }}
                      >
                        Spreadsheet compatible format
                      </Text>
                    </View>
                    {exporting && (
                      <ActivityIndicator color="white" size="small" />
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {/* JSON Export */}
              <TouchableOpacity
                onPress={() => handleExport("json")}
                disabled={exporting}
                style={{
                  width: "100%",
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                <LinearGradient
                  colors={["#4f46e5", "#3b82f6"]}
                  style={{
                    paddingVertical: 16,
                    paddingHorizontal: 24,
                    opacity: exporting ? 0.5 : 1,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ fontSize: 24, marginRight: 16 }}>🔧</Text>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: "white",
                          fontSize: 18,
                          fontWeight: "600",
                        }}
                      >
                        Export as JSON
                      </Text>
                      <Text
                        style={{
                          color: "rgba(190, 242, 100, 1)",
                          fontSize: 14,
                        }}
                      >
                        Developer-friendly format
                      </Text>
                    </View>
                    {exporting && (
                      <ActivityIndicator color="white" size="small" />
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {/* Cancel Button */}
              <TouchableOpacity
                onPress={onClose}
                disabled={exporting}
                style={{
                  width: "100%",
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: "#cbd5e1",
                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                  alignItems: "center",
                  opacity: exporting ? 0.5 : 1,
                }}
              >
                <Text
                  style={{ color: "#64748b", fontSize: 16, fontWeight: "500" }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>

            {exporting && (
              <View style={{ alignItems: "center", marginTop: 16 }}>
                <Text style={{ color: "#64748b", fontSize: 14 }}>
                  Preparing export...
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}
