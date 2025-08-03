import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useAuth } from "../../lib/auth-context";

interface HomeTabProps {
  onTabChange?: (tab: "home" | "expenses" | "profile") => void;
}

export default function HomeTab({ onTabChange }: HomeTabProps) {
  const { user } = useAuth();

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-6">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back!
          </Text>
          <Text className="text-gray-600">{user?.email}</Text>
        </View>

        {/* Quick Stats */}
        <View className="flex-row justify-between mb-8 space-x-4">
          <View className="flex-1 bg-white p-6 rounded-xl shadow-sm mr-2">
            <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mb-3">
              <Text className="text-blue-600 text-xl">💰</Text>
            </View>
            <Text className="text-2xl font-bold text-gray-900 mb-1">$0</Text>
            <Text className="text-gray-600 text-sm">This Month</Text>
          </View>

          <View className="flex-1 bg-white p-6 rounded-xl shadow-sm ml-2">
            <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mb-3">
              <Text className="text-green-600 text-xl">📊</Text>
            </View>
            <Text className="text-2xl font-bold text-gray-900 mb-1">0</Text>
            <Text className="text-gray-600 text-sm">Total Expenses</Text>
          </View>
        </View>

        {/* Welcome Message */}
        <View className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Get Started
          </Text>
          <Text className="text-gray-600 text-center mb-6">
            Welcome to your expense tracking dashboard! Here you can manage your
            finances and track your spending habits.
          </Text>

          {/* Quick Actions */}
          <View className="flex-row space-x-4 mb-4">
            <TouchableOpacity
              onPress={() => onTabChange?.("expenses")}
              className="flex-1 bg-blue-600 p-4 rounded-xl"
            >
              <View className="items-center">
                <Text className="text-white text-xl mb-1">💰</Text>
                <Text className="text-white text-center font-semibold">
                  View Expenses
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-green-600 p-4 rounded-xl">
              <View className="items-center">
                <Text className="text-white text-xl mb-1">📊</Text>
                <Text className="text-white text-center font-semibold">
                  Analytics
                </Text>
                <Text className="text-green-100 text-xs">Coming Soon</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Features */}
        <View className="bg-white rounded-xl shadow-sm p-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Features
          </Text>

          <View className="space-y-3">
            <View className="flex-row items-center">
              <Text className="text-2xl mr-3">✅</Text>
              <Text className="text-gray-700 flex-1">
                Add and track expenses
              </Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-2xl mr-3">🔄</Text>
              <Text className="text-gray-700 flex-1">
                Real-time synchronization
              </Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-2xl mr-3">📱</Text>
              <Text className="text-gray-700 flex-1">
                Works on web and mobile
              </Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-2xl mr-3">🗂️</Text>
              <Text className="text-gray-700 flex-1">
                Organize by categories
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
