import React, { useState, useEffect } from "react";
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

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

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
    setLocalFilters({});
    onFiltersChange({});
    onClose();
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
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          {/* Header */}
          <View
            style={{
              paddingHorizontal: 24,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: "rgba(255, 255, 255, 0.2)",
              marginBottom: 16,
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <TouchableOpacity onPress={onClose}>
                <Text style={{ color: "#4f46e5", fontSize: 18 }}>Cancel</Text>
              </TouchableOpacity>
              <Text
                style={{ fontSize: 18, fontWeight: "600", color: "#1e293b" }}
              >
                Filter Expenses
              </Text>
              <TouchableOpacity onPress={applyFilters}>
                <Text
                  style={{ color: "#4f46e5", fontSize: 18, fontWeight: "600" }}
                >
                  Apply
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={{ flex: 1, paddingHorizontal: 24 }}>
            <View style={{ gap: 24 }}>
              {/* Search */}
              <View
                style={{
                  padding: 16,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.2)",
                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: "#4f46e5",
                    marginBottom: 12,
                  }}
                >
                  Search Description
                </Text>
                <TextInput
                  value={localFilters.search || ""}
                  onChangeText={(value) => handleFilterChange("search", value)}
                  placeholder="Search expenses..."
                  style={{
                    width: "100%",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderWidth: 1,
                    borderColor: "#cbd5e1",
                    borderRadius: 8,
                    backgroundColor: "rgba(255, 255, 255, 0.6)",
                    color: "#1e293b",
                    fontSize: 16,
                  }}
                  placeholderTextColor="#64748b"
                />
              </View>

              {/* Category Filter */}
              <View
                style={{
                  padding: 16,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.2)",
                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: "#4f46e5",
                    marginBottom: 12,
                  }}
                >
                  Category
                </Text>
                <View
                  style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                >
                  <TouchableOpacity
                    onPress={() => handleFilterChange("category", undefined)}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: !localFilters.category
                        ? "#4f46e5"
                        : "#cbd5e1",
                      backgroundColor: !localFilters.category
                        ? "rgba(99, 102, 241, 0.1)"
                        : "rgba(255, 255, 255, 0.6)",
                      marginRight: 8,
                      marginBottom: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "500",
                        color: !localFilters.category ? "#4338ca" : "#64748b",
                      }}
                    >
                      All
                    </Text>
                  </TouchableOpacity>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category}
                      onPress={() => handleFilterChange("category", category)}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor:
                          localFilters.category === category
                            ? "#4f46e5"
                            : "#cbd5e1",
                        backgroundColor:
                          localFilters.category === category
                            ? "rgba(99, 102, 241, 0.1)"
                            : "rgba(255, 255, 255, 0.6)",
                        marginRight: 8,
                        marginBottom: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "500",
                          color:
                            localFilters.category === category
                              ? "#4338ca"
                              : "#64748b",
                        }}
                      >
                        {getCategoryEmoji(category)}{" "}
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Date Range */}
              <View
                style={{
                  padding: 16,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.2)",
                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: "#4f46e5",
                    marginBottom: 12,
                  }}
                >
                  Date Range
                </Text>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 12,
                        color: "#64748b",
                        marginBottom: 4,
                      }}
                    >
                      From
                    </Text>
                    <TextInput
                      value={localFilters.startDate || ""}
                      onChangeText={(value) =>
                        handleFilterChange("startDate", value)
                      }
                      placeholder="YYYY-MM-DD"
                      style={{
                        width: "100%",
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderWidth: 1,
                        borderColor: "#cbd5e1",
                        borderRadius: 6,
                        backgroundColor: "rgba(255, 255, 255, 0.6)",
                        color: "#1e293b",
                        fontSize: 14,
                      }}
                      placeholderTextColor="#64748b"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 12,
                        color: "#64748b",
                        marginBottom: 4,
                      }}
                    >
                      To
                    </Text>
                    <TextInput
                      value={localFilters.endDate || ""}
                      onChangeText={(value) =>
                        handleFilterChange("endDate", value)
                      }
                      placeholder="YYYY-MM-DD"
                      style={{
                        width: "100%",
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderWidth: 1,
                        borderColor: "#cbd5e1",
                        borderRadius: 6,
                        backgroundColor: "rgba(255, 255, 255, 0.6)",
                        color: "#1e293b",
                        fontSize: 14,
                      }}
                      placeholderTextColor="#64748b"
                    />
                  </View>
                </View>
              </View>

              {/* Amount Range */}
              <View
                style={{
                  padding: 16,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.2)",
                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: "#4f46e5",
                    marginBottom: 12,
                  }}
                >
                  Amount Range
                </Text>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 12,
                        color: "#64748b",
                        marginBottom: 4,
                      }}
                    >
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
                      placeholder="0.00"
                      keyboardType="numeric"
                      style={{
                        width: "100%",
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderWidth: 1,
                        borderColor: "#cbd5e1",
                        borderRadius: 6,
                        backgroundColor: "rgba(255, 255, 255, 0.6)",
                        color: "#1e293b",
                        fontSize: 14,
                      }}
                      placeholderTextColor="#64748b"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 12,
                        color: "#64748b",
                        marginBottom: 4,
                      }}
                    >
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
                      placeholder="1000.00"
                      keyboardType="numeric"
                      style={{
                        width: "100%",
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderWidth: 1,
                        borderColor: "#cbd5e1",
                        borderRadius: 6,
                        backgroundColor: "rgba(255, 255, 255, 0.6)",
                        color: "#1e293b",
                        fontSize: 14,
                      }}
                      placeholderTextColor="#64748b"
                    />
                  </View>
                </View>
              </View>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <TouchableOpacity
                  onPress={clearFilters}
                  style={{
                    width: "100%",
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: "#dc2626",
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#dc2626",
                      fontSize: 16,
                      fontWeight: "500",
                    }}
                  >
                    Clear All Filters
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </Modal>
  );
}
