import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../lib/auth-context";
import { expenseApi } from "../../lib/api-client";
import type { Expense } from "../../lib/types";
import { SafeAreaView } from "react-native-safe-area-context";
import { formatCurrency, formatCategory } from "shared";

interface HomeTabProps {
  onTabChange?: (tab: "home" | "expenses") => void;
  onSignOut: () => void;
  isActive?: boolean;
}

export default function HomeTab({
  onTabChange,
  onSignOut,
  isActive,
}: HomeTabProps) {
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState({
    totalAmount: 0,
    totalCount: 0,
    thisMonth: 0,
    dailyAverage: 0,
    mostPopularCategory: null as {
      name: string;
      emoji: string;
      count: number;
    } | null,
  });
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  // Refresh data when tab becomes active
  useEffect(() => {
    if (isActive) {
      loadStats();
    }
  }, [isActive]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const subscription = expenseApi.subscribeToExpenseChanges(
      (payload: {
        eventType: "INSERT" | "UPDATE" | "DELETE";
        new?: Expense;
        old?: Expense;
      }) => {
        console.log("HomeTab: Real-time expense change:", payload);
        // Reload stats when expenses change
        loadStats();
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const loadStats = async () => {
    try {
      const result = await expenseApi.getExpenses();
      if (result.data) {
        const expenses = result.data;
        const totalAmount = expenses.reduce(
          (sum, expense) => sum + expense.amount,
          0,
        );

        // Calculate this month's expenses
        const now = new Date();
        const thisMonthExpenses = expenses.filter((expense) => {
          const expenseDate = new Date(expense.date);
          return (
            expenseDate.getMonth() === now.getMonth() &&
            expenseDate.getFullYear() === now.getFullYear()
          );
        });
        const thisMonth = thisMonthExpenses.reduce(
          (sum, expense) => sum + expense.amount,
          0,
        );

        // Calculate daily average for this month
        const currentDay = now.getDate();
        const dailyAverage = thisMonth / currentDay;

        // Find most popular category
        const categoryCount: Record<string, number> = {};
        expenses.forEach((expense) => {
          categoryCount[expense.category] =
            (categoryCount[expense.category] || 0) + 1;
        });

        const mostPopularCategoryEntry = Object.entries(categoryCount).sort(
          ([, a], [, b]) => b - a,
        )[0];

        const mostPopularCategory = mostPopularCategoryEntry
          ? {
              name:
                mostPopularCategoryEntry[0].charAt(0).toUpperCase() +
                mostPopularCategoryEntry[0].slice(1),
              emoji: getCategoryEmoji(mostPopularCategoryEntry[0]),
              count: mostPopularCategoryEntry[1],
            }
          : null;

        setStats({
          totalAmount,
          totalCount: expenses.length,
          thisMonth,
          dailyAverage: isNaN(dailyAverage) ? 0 : dailyAverage,
          mostPopularCategory,
        });

        // Get recent expenses (last 3)
        setRecentExpenses(expenses.slice(0, 3));
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const getCategoryEmoji = (category: string) => {
    const emojiMap: Record<string, string> = {
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

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          const result = await signOut();
          if (result.success) {
            onSignOut();
          } else {
            Alert.alert("Error", result.error || "Failed to sign out");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1, paddingHorizontal: 24, paddingTop: 24 }}>
        {/* User Header */}
        <View style={{ marginBottom: 24 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <View>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "bold",
                  color: "#1e293b",
                  marginBottom: 4,
                }}
              >
                Welcome back! 👋
              </Text>
              <Text style={{ color: "#64748b" }}>
                {user?.email || "Let's manage your expenses"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleSignOut}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: "rgba(239, 68, 68, 0.1)",
              }}
            >
              <Text
                style={{ color: "#dc2626", fontSize: 12, fontWeight: "500" }}
              >
                Sign Out
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={{ marginBottom: 24 }}>
          {/* Top Row */}
          <View style={{ flexDirection: "row", marginBottom: 12 }}>
            <View
              style={{
                flex: 1,
                marginRight: 6,
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
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <LinearGradient
                  colors={["#10b981", "#14b8a6"]}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 10,
                  }}
                >
                  <Text style={{ fontSize: 16 }}>💰</Text>
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      color: "#64748b",
                      fontWeight: "500",
                    }}
                  >
                    This Month
                  </Text>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "bold",
                      color: "#1e293b",
                    }}
                  >
                    {formatCurrency(stats.thisMonth)}
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={{
                flex: 1,
                marginLeft: 6,
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
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <LinearGradient
                  colors={["#3b82f6", "#1d4ed8"]}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 10,
                  }}
                >
                  <Text style={{ fontSize: 16 }}>📊</Text>
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      color: "#64748b",
                      fontWeight: "500",
                    }}
                  >
                    Total Entries
                  </Text>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "bold",
                      color: "#1e293b",
                    }}
                  >
                    {stats.totalCount}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Bottom Row */}
          <View style={{ flexDirection: "row" }}>
            <View
              style={{
                flex: 1,
                marginRight: 6,
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
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <LinearGradient
                  colors={["#8b5cf6", "#7c3aed"]}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 10,
                  }}
                >
                  <Text style={{ fontSize: 16 }}>📈</Text>
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      color: "#64748b",
                      fontWeight: "500",
                    }}
                  >
                    Daily Avg
                  </Text>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "bold",
                      color: "#1e293b",
                    }}
                  >
                    {formatCurrency(stats.dailyAverage)}
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={{
                flex: 1,
                marginLeft: 6,
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
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <LinearGradient
                  colors={["#f59e0b", "#d97706"]}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 10,
                  }}
                >
                  <Text style={{ fontSize: 16 }}>
                    {stats.mostPopularCategory?.emoji || "🎯"}
                  </Text>
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      color: "#64748b",
                      fontWeight: "500",
                    }}
                  >
                    Top Category
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "bold",
                      color: "#1e293b",
                    }}
                  >
                    {stats.mostPopularCategory?.name || "None"}
                  </Text>
                  {stats.mostPopularCategory && (
                    <Text style={{ fontSize: 10, color: "#64748b" }}>
                      {stats.mostPopularCategory.count} entries
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: "#1e293b",
              marginBottom: 16,
            }}
          >
            Quick Actions
          </Text>
          <View style={{ gap: 12 }}>
            <TouchableOpacity
              onPress={() => onTabChange?.("expenses")}
              style={{ width: "100%", borderRadius: 12, overflow: "hidden" }}
            >
              <LinearGradient
                colors={["#4f46e5", "#3b82f6"]}
                style={{ paddingVertical: 16, paddingHorizontal: 24 }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={{ fontSize: 24, marginRight: 16 }}>➕</Text>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: "white",
                        fontSize: 18,
                        fontWeight: "600",
                      }}
                    >
                      Add Expense
                    </Text>
                    <Text
                      style={{ color: "rgba(190, 242, 100, 1)", fontSize: 14 }}
                    >
                      Track your spending
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View
          style={{
            padding: 24,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "rgba(255, 255, 255, 0.2)",
            marginBottom: 24,
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
              fontSize: 18,
              fontWeight: "600",
              color: "#1e293b",
              marginBottom: 16,
            }}
          >
            Recent Activity
          </Text>
          {recentExpenses.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 32 }}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>📝</Text>
              <Text style={{ color: "#64748b", textAlign: "center" }}>
                No recent activity
              </Text>
              <Text
                style={{
                  color: "#94a3b8",
                  fontSize: 14,
                  textAlign: "center",
                  marginTop: 4,
                }}
              >
                Start by adding your first expense
              </Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {recentExpenses.map((expense) => (
                <View
                  key={expense.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: "rgba(226, 232, 240, 0.5)",
                  }}
                >
                  <Text style={{ fontSize: 24, marginRight: 12 }}>
                    {getCategoryEmoji(expense.category)}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "500", color: "#1e293b" }}>
                      {expense.description}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: "#64748b",
                        textTransform: "capitalize",
                      }}
                    >
                      {expense.category} •{" "}
                      {new Date(expense.date).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={{ fontWeight: "bold", color: "#1e293b" }}>
                    {formatCurrency(expense.amount)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
