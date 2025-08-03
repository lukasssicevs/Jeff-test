import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../lib/auth-context";

interface HomeTabProps {
  onTabChange?: (tab: "home" | "expenses" | "profile") => void;
}

export default function HomeTab({ onTabChange }: HomeTabProps) {
  const { user } = useAuth();

  return (
    <ScrollView className="flex-1 px-6 pt-6">
      {/* Welcome Header */}
      <View className="mb-6">
        <Text className="text-2xl font-bold text-slate-800 mb-2">
          Welcome back! 👋
        </Text>
        <Text className="text-slate-600">
          {user?.email || "Let's manage your expenses"}
        </Text>
      </View>

      {/* Quick Stats Cards */}
      <View className="flex-row mb-6">
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
                This Month
              </Text>
              <Text className="text-lg font-bold text-slate-800">
                $0.00
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
                0
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View className="mb-6">
        <Text className="text-lg font-semibold text-slate-800 mb-4">
          Quick Actions
        </Text>
        <View className="space-y-3">
          <TouchableOpacity
            onPress={() => onTabChange?.("expenses")}
            className="w-full rounded-xl overflow-hidden"
          >
            <LinearGradient
              colors={['#4f46e5', '#3b82f6']}
              className="py-4 px-6"
            >
              <View className="flex-row items-center">
                <Text className="text-2xl mr-4">➕</Text>
                <View className="flex-1">
                  <Text className="text-white text-lg font-semibold">
                    Add Expense
                  </Text>
                  <Text className="text-blue-100 text-sm">
                    Track your spending
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onTabChange?.("expenses")}
            className="w-full rounded-xl overflow-hidden"
          >
            <LinearGradient
              colors={['#10b981', '#14b8a6']}
              className="py-4 px-6"
            >
              <View className="flex-row items-center">
                <Text className="text-2xl mr-4">📈</Text>
                <View className="flex-1">
                  <Text className="text-white text-lg font-semibold">
                    View Reports
                  </Text>
                  <Text className="text-emerald-100 text-sm">
                    Analyze your spending
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activity placeholder */}
      <View
        className="p-6 rounded-xl border border-white/20 mb-6"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Text className="text-lg font-semibold text-slate-800 mb-4">
          Recent Activity
        </Text>
        <View className="items-center py-8">
          <Text className="text-6xl mb-4">📝</Text>
          <Text className="text-slate-600 text-center">
            No recent activity
          </Text>
          <Text className="text-slate-500 text-sm text-center mt-1">
            Start by adding your first expense
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}