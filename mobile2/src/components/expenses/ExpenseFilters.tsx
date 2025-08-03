import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ExpenseCategory, type ExpenseCategoryType } from "../../lib/types";

export interface FilterOptions {
  category?: ExpenseCategoryType;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

interface ExpenseFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  visible: boolean;
  onClose: () => void;
}

export default function ExpenseFilters({
  filters,
  onFiltersChange,
  visible,
  onClose,
}: ExpenseFiltersProps) {
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    setLocalFilters({
      ...localFilters,
      [key]: value === "" ? undefined : value,
    });
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const clearFilters = () => {
    const emptyFilters: FilterOptions = {};
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
    Alert.alert("Filters Cleared", "All filters have been reset.");
  };

  const categories = Object.values(ExpenseCategory) as ExpenseCategoryType[];

  const getCategoryEmoji = (category: ExpenseCategoryType) => {
    const emojiMap: Record<ExpenseCategoryType, string> = {
      food: "🍽️",
      transport: "🚗",
      entertainment: "🎬",
      shopping: "🛍️",
      utilities: "⚡",
      health: "🏥",
      education: "📚",
      travel: "✈️",
      other: "📦",
    };
    return emojiMap[category] || "📦";
  };

  const hasActiveFilters = Object.values(localFilters).some(
    (value) => value !== undefined && value !== "" && value !== null
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <LinearGradient
        colors={["#f8fafc", "#e0f2fe", "#e0e7ff"]}
        className="flex-1"
      >
        <SafeAreaView className="flex-1">
          {/* Header */}
          <View
            className="px-6 py-4 border-b border-white/20 mb-4"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <View className="flex-row justify-between items-center">
              <TouchableOpacity onPress={onClose}>
                <Text className="text-indigo-600 text-lg">Cancel</Text>
              </TouchableOpacity>
              <Text className="text-lg font-semibold text-slate-800">
                Filter Expenses
              </Text>
              <TouchableOpacity onPress={applyFilters}>
                <Text className="text-indigo-600 text-lg font-semibold">
                  Apply
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView className="flex-1 px-6">
            <View className="space-y-6">
              {/* Search */}
              <View
                className="p-4 rounded-xl border border-white/20"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 8,
                }}
              >
                <Text className="text-sm font-medium text-indigo-700 mb-3">
                  Search Description
                </Text>
                <TextInput
                  value={localFilters.search || ""}
                  onChangeText={(value) => handleFilterChange("search", value)}
                  placeholder="Search expenses..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white/60 text-slate-800"
                  placeholderTextColor="#64748b"
                />
              </View>

              {/* Category Filter */}
              <View
                className="p-4 rounded-xl border border-white/20"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 8,
                }}
              >
                <Text className="text-sm font-medium text-indigo-700 mb-3">
                  Category
                </Text>
                <View className="flex-row flex-wrap">
                  <TouchableOpacity
                    onPress={() => handleFilterChange("category", undefined)}
                    className={`px-4 py-2 rounded-lg mr-2 mb-2 border ${
                      !localFilters.category
                        ? "bg-indigo-100 border-indigo-300"
                        : "border-slate-300 bg-white/60"
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        !localFilters.category
                          ? "text-indigo-700"
                          : "text-slate-600"
                      }`}
                    >
                      All
                    </Text>
                  </TouchableOpacity>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category}
                      onPress={() => handleFilterChange("category", category)}
                      className={`px-4 py-2 rounded-lg mr-2 mb-2 border ${
                        localFilters.category === category
                          ? "bg-indigo-100 border-indigo-300"
                          : "border-slate-300 bg-white/60"
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          localFilters.category === category
                            ? "text-indigo-700"
                            : "text-slate-600"
                        }`}
                      >
                        {getCategoryEmoji(category)}{" "}
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Amount Range */}
              <View
                className="p-4 rounded-xl border border-white/20"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 8,
                }}
              >
                <Text className="text-sm font-medium text-indigo-700 mb-3">
                  Amount Range
                </Text>
                <View className="flex-row space-x-3">
                  <View className="flex-1">
                    <Text className="text-xs text-slate-600 mb-1">
                      Min Amount
                    </Text>
                    <TextInput
                      value={localFilters.minAmount?.toString() || ""}
                      onChangeText={(value) =>
                        handleFilterChange(
                          "minAmount",
                          value ? parseFloat(value) : undefined
                        )
                      }
                      placeholder="$0"
                      keyboardType="numeric"
                      className="px-3 py-2 border border-slate-300 rounded-lg bg-white/60 text-slate-800"
                      placeholderTextColor="#64748b"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-slate-600 mb-1">
                      Max Amount
                    </Text>
                    <TextInput
                      value={localFilters.maxAmount?.toString() || ""}
                      onChangeText={(value) =>
                        handleFilterChange(
                          "maxAmount",
                          value ? parseFloat(value) : undefined
                        )
                      }
                      placeholder="$999"
                      keyboardType="numeric"
                      className="px-3 py-2 border border-slate-300 rounded-lg bg-white/60 text-slate-800"
                      placeholderTextColor="#64748b"
                    />
                  </View>
                </View>
              </View>

              {/* Date Range */}
              <View
                className="p-4 rounded-xl border border-white/20"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 8,
                }}
              >
                <Text className="text-sm font-medium text-indigo-700 mb-3">
                  Date Range
                </Text>
                <View className="flex-row space-x-3">
                  <View className="flex-1">
                    <Text className="text-xs text-slate-600 mb-1">
                      Start Date
                    </Text>
                    <TextInput
                      value={localFilters.startDate || ""}
                      onChangeText={(value) =>
                        handleFilterChange("startDate", value)
                      }
                      placeholder="YYYY-MM-DD"
                      className="px-3 py-2 border border-slate-300 rounded-lg bg-white/60 text-slate-800"
                      placeholderTextColor="#64748b"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-slate-600 mb-1">
                      End Date
                    </Text>
                    <TextInput
                      value={localFilters.endDate || ""}
                      onChangeText={(value) =>
                        handleFilterChange("endDate", value)
                      }
                      placeholder="YYYY-MM-DD"
                      className="px-3 py-2 border border-slate-300 rounded-lg bg-white/60 text-slate-800"
                      placeholderTextColor="#64748b"
                    />
                  </View>
                </View>
              </View>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <TouchableOpacity
                  onPress={clearFilters}
                  className="w-full rounded-xl overflow-hidden"
                >
                  <LinearGradient
                    colors={["#ef4444", "#dc2626"]}
                    className="py-4 px-6"
                  >
                    <Text className="text-white text-center text-lg font-semibold">
                      Clear All Filters
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </Modal>
  );
}
