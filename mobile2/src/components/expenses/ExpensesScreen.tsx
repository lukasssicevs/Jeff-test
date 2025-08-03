import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../lib/auth-context";
import { expenseApi } from "../../lib/api-client";
import type { Expense } from "../../lib/types";

const ExpensesScreen = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalAmount: 0,
    totalCount: 0,
  });

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const result = await expenseApi.getExpenses();
      
      if (result.data) {
        setExpenses(result.data);
        calculateStats(result.data);
      }
    } catch (error) {
      console.error("Error loading expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadExpenses();
    setRefreshing(false);
  };

  const calculateStats = (expensesList: Expense[]) => {
    const totalAmount = expensesList.reduce((sum, expense) => sum + expense.amount, 0);
    setStats({
      totalAmount,
      totalCount: expensesList.length,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
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

  const renderExpenseItem = ({ item }: { item: Expense }) => (
    <View
      className="mx-4 mb-3 p-4 rounded-xl border border-white/20"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <LinearGradient
            colors={['#4f46e5', '#3b82f6']}
            className="w-12 h-12 rounded-xl items-center justify-center mr-3"
          >
            <Text className="text-xl">{getCategoryEmoji(item.category)}</Text>
          </LinearGradient>
          
          <View className="flex-1">
            <Text className="text-slate-800 font-semibold text-base">
              {item.description}
            </Text>
            <View className="flex-row items-center mt-1">
              <View
                className="px-2 py-1 rounded-md mr-2"
                style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)' }}
              >
                <Text className="text-indigo-700 text-xs font-medium capitalize">
                  {item.category}
                </Text>
              </View>
              <Text className="text-slate-500 text-xs">
                {new Date(item.date).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>
        
        <Text className="text-slate-800 font-bold text-lg">
          {formatCurrency(item.amount)}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text className="mt-4 text-slate-600">Loading expenses...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1">
      {/* Header */}
      <View className="px-6 pt-6 pb-4">
        <Text className="text-2xl font-bold text-slate-800 mb-2">
          Expenses 💰
        </Text>
        <Text className="text-slate-600">
          Track and manage your spending
        </Text>
      </View>

      {/* Stats Cards */}
      <View className="flex-row px-4 mb-6">
        <View
          className="flex-1 mr-2 p-4 rounded-xl border border-white/20"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <View className="flex-row items-center">
            <LinearGradient
              colors={['#10b981', '#14b8a6']}
              className="w-10 h-10 rounded-lg items-center justify-center mr-3"
            >
              <Text className="text-lg">💰</Text>
            </LinearGradient>
            <View className="flex-1">
              <Text className="text-xs text-slate-600 font-medium">
                Total Spent
              </Text>
              <Text className="text-lg font-bold text-slate-800">
                {formatCurrency(stats.totalAmount)}
              </Text>
            </View>
          </View>
        </View>

        <View
          className="flex-1 ml-2 p-4 rounded-xl border border-white/20"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <View className="flex-row items-center">
            <LinearGradient
              colors={['#f59e0b', '#d97706']}
              className="w-10 h-10 rounded-lg items-center justify-center mr-3"
            >
              <Text className="text-lg">📊</Text>
            </LinearGradient>
            <View className="flex-1">
              <Text className="text-xs text-slate-600 font-medium">
                Transactions
              </Text>
              <Text className="text-lg font-bold text-slate-800">
                {stats.totalCount}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Add Expense Button */}
      <View className="px-4 mb-4">
        <TouchableOpacity className="w-full rounded-xl overflow-hidden">
          <LinearGradient
            colors={['#4f46e5', '#3b82f6']}
            className="py-4 px-6"
          >
            <View className="flex-row items-center justify-center">
              <Text className="text-2xl mr-3">➕</Text>
              <Text className="text-white text-lg font-semibold">
                Add New Expense
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Expenses List */}
      <View className="flex-1">
        {expenses.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-6xl mb-4">📝</Text>
            <Text className="text-slate-600 text-center text-lg mb-2">
              No expenses yet
            </Text>
            <Text className="text-slate-500 text-center">
              Start tracking your spending by adding your first expense
            </Text>
          </View>
        ) : (
          <FlatList
            data={expenses}
            renderItem={renderExpenseItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#4f46e5"
              />
            }
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default ExpensesScreen;