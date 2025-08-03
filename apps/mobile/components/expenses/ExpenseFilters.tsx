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
import { ExpenseCategory, type ExpenseCategoryType } from "@repo/shared";

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
    const emptyFilters = {};
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
    onClose();
  };

  const formatCategory = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const getCategoryEmoji = (category: ExpenseCategoryType) => {
    const emojiMap = {
      food: "🍽️",
      transport: "🚗",
      entertainment: "🎬",
      shopping: "🛍️",
      utilities: "💡",
      health: "🏥",
      education: "📚",
      travel: "✈️",
      other: "📝",
    };
    return emojiMap[category] || "📝";
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
      <SafeAreaView className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="bg-white px-6 py-4 border-b border-gray-200">
          <View className="flex-row justify-between items-center">
            <TouchableOpacity onPress={onClose}>
              <Text className="text-blue-600 text-lg">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-gray-900">
              Filter Expenses
            </Text>
            <TouchableOpacity onPress={applyFilters}>
              <Text className="text-blue-600 text-lg font-semibold">Apply</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView className="flex-1 p-6">
          <View className="space-y-6">
            {/* Search */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Search Description
              </Text>
              <TextInput
                value={localFilters.search || ""}
                onChangeText={(text) => handleFilterChange("search", text)}
                placeholder="Search expenses..."
                className="bg-white px-4 py-3 rounded-lg border border-gray-300 text-gray-900"
              />
            </View>

            {/* Category Filter */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Category
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row space-x-3">
                  <TouchableOpacity
                    onPress={() => handleFilterChange("category", undefined)}
                    className={`px-4 py-3 rounded-lg border ${
                      !localFilters.category
                        ? "bg-blue-600 border-blue-600"
                        : "bg-white border-gray-300"
                    }`}
                  >
                    <View className="items-center">
                      <Text className="text-lg mb-1">🗂️</Text>
                      <Text
                        className={`text-xs font-medium ${
                          !localFilters.category
                            ? "text-white"
                            : "text-gray-700"
                        }`}
                      >
                        All
                      </Text>
                    </View>
                  </TouchableOpacity>
                  {Object.entries(ExpenseCategory).map(([key, value]) => (
                    <TouchableOpacity
                      key={key}
                      onPress={() => handleFilterChange("category", value)}
                      className={`px-4 py-3 rounded-lg border ${
                        localFilters.category === value
                          ? "bg-blue-600 border-blue-600"
                          : "bg-white border-gray-300"
                      }`}
                    >
                      <View className="items-center">
                        <Text className="text-lg mb-1">
                          {getCategoryEmoji(value)}
                        </Text>
                        <Text
                          className={`text-xs font-medium ${
                            localFilters.category === value
                              ? "text-white"
                              : "text-gray-700"
                          }`}
                        >
                          {formatCategory(value)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Date Range */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Date Range
              </Text>
              <View className="space-y-3">
                <View>
                  <Text className="text-xs text-gray-600 mb-1">Start Date</Text>
                  <TextInput
                    value={localFilters.startDate || ""}
                    onChangeText={(text) =>
                      handleFilterChange("startDate", text)
                    }
                    placeholder="YYYY-MM-DD"
                    className="bg-white px-4 py-3 rounded-lg border border-gray-300 text-gray-900"
                  />
                </View>
                <View>
                  <Text className="text-xs text-gray-600 mb-1">End Date</Text>
                  <TextInput
                    value={localFilters.endDate || ""}
                    onChangeText={(text) => handleFilterChange("endDate", text)}
                    placeholder="YYYY-MM-DD"
                    className="bg-white px-4 py-3 rounded-lg border border-gray-300 text-gray-900"
                  />
                </View>
              </View>
            </View>

            {/* Amount Range */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Amount Range
              </Text>
              <View className="space-y-3">
                <View>
                  <Text className="text-xs text-gray-600 mb-1">
                    Min Amount ($)
                  </Text>
                  <TextInput
                    value={localFilters.minAmount?.toString() || ""}
                    onChangeText={(text) =>
                      handleFilterChange(
                        "minAmount",
                        parseFloat(text) || undefined
                      )
                    }
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    className="bg-white px-4 py-3 rounded-lg border border-gray-300 text-gray-900"
                  />
                </View>
                <View>
                  <Text className="text-xs text-gray-600 mb-1">
                    Max Amount ($)
                  </Text>
                  <TextInput
                    value={localFilters.maxAmount?.toString() || ""}
                    onChangeText={(text) =>
                      handleFilterChange(
                        "maxAmount",
                        parseFloat(text) || undefined
                      )
                    }
                    placeholder="1000.00"
                    keyboardType="decimal-pad"
                    className="bg-white px-4 py-3 rounded-lg border border-gray-300 text-gray-900"
                  />
                </View>
              </View>
            </View>

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <View className="pt-4 border-t border-gray-200">
                <Text className="text-sm font-medium text-gray-700 mb-3">
                  Active Filters:
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {localFilters.category && (
                    <View className="bg-blue-100 px-3 py-1 rounded-full flex-row items-center">
                      <Text className="text-blue-800 text-xs mr-1">
                        {getCategoryEmoji(localFilters.category)}{" "}
                        {formatCategory(localFilters.category)}
                      </Text>
                      <TouchableOpacity
                        onPress={() =>
                          handleFilterChange("category", undefined)
                        }
                      >
                        <Text className="text-blue-600 text-sm font-bold">
                          ×
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {localFilters.search && (
                    <View className="bg-green-100 px-3 py-1 rounded-full flex-row items-center">
                      <Text className="text-green-800 text-xs mr-1">
                        Search: "{localFilters.search}"
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleFilterChange("search", undefined)}
                      >
                        <Text className="text-green-600 text-sm font-bold">
                          ×
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {(localFilters.startDate || localFilters.endDate) && (
                    <View className="bg-purple-100 px-3 py-1 rounded-full flex-row items-center">
                      <Text className="text-purple-800 text-xs mr-1">
                        Date: {localFilters.startDate || "start"} -{" "}
                        {localFilters.endDate || "end"}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          handleFilterChange("startDate", undefined);
                          handleFilterChange("endDate", undefined);
                        }}
                      >
                        <Text className="text-purple-600 text-sm font-bold">
                          ×
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {(localFilters.minAmount !== undefined ||
                    localFilters.maxAmount !== undefined) && (
                    <View className="bg-orange-100 px-3 py-1 rounded-full flex-row items-center">
                      <Text className="text-orange-800 text-xs mr-1">
                        Amount: ${localFilters.minAmount || 0} - $
                        {localFilters.maxAmount || "∞"}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          handleFilterChange("minAmount", undefined);
                          handleFilterChange("maxAmount", undefined);
                        }}
                      >
                        <Text className="text-orange-600 text-sm font-bold">
                          ×
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Clear All Button */}
            {hasActiveFilters && (
              <TouchableOpacity
                onPress={clearFilters}
                className="bg-red-600 py-3 rounded-lg"
              >
                <Text className="text-white text-center font-semibold">
                  Clear All Filters
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
