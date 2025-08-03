import React, { useState } from "react";
import { View, Text, TouchableOpacity, SafeAreaView } from "react-native";
import HomeTab from "./HomeTab";
import ProfileTab from "./ProfileTab";
import ExpensesScreen from "../expenses/ExpensesScreen";

interface DashboardTabsProps {
  onSignOut: () => void;
}

export default function DashboardTabs({ onSignOut }: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<"home" | "expenses" | "profile">(
    "home"
  );

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <HomeTab onTabChange={setActiveTab} />;
      case "expenses":
        return <ExpensesScreen />;
      case "profile":
        return <ProfileTab onSignOut={onSignOut} />;
      default:
        return <HomeTab />;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Main Content */}
      <View className="flex-1">{renderContent()}</View>

      {/* Tab Bar */}
      <View className="bg-white border-t border-gray-200 px-6 py-3">
        <View className="flex-row justify-around">
          <TouchableOpacity
            onPress={() => setActiveTab("home")}
            className={`flex-1 items-center py-2 ${
              activeTab === "home" ? "opacity-100" : "opacity-60"
            }`}
          >
            <Text className="text-2xl mb-1">🏠</Text>
            <Text
              className={`text-xs ${
                activeTab === "home"
                  ? "text-blue-600 font-semibold"
                  : "text-gray-600"
              }`}
            >
              Home
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("expenses")}
            className={`flex-1 items-center py-2 ${
              activeTab === "expenses" ? "opacity-100" : "opacity-60"
            }`}
          >
            <Text className="text-2xl mb-1">💰</Text>
            <Text
              className={`text-xs ${
                activeTab === "expenses"
                  ? "text-blue-600 font-semibold"
                  : "text-gray-600"
              }`}
            >
              Expenses
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("profile")}
            className={`flex-1 items-center py-2 ${
              activeTab === "profile" ? "opacity-100" : "opacity-60"
            }`}
          >
            <Text className="text-2xl mb-1">👤</Text>
            <Text
              className={`text-xs ${
                activeTab === "profile"
                  ? "text-blue-600 font-semibold"
                  : "text-gray-600"
              }`}
            >
              Profile
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
