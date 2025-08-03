import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
        return <HomeTab onTabChange={setActiveTab} />;
    }
  };

  return (
    <SafeAreaView className="flex-1">
      {/* Main Content */}
      <View className="flex-1">{renderContent()}</View>

      {/* Modern Floating Tab Bar */}
      <View
        className="bg-white/90 border-t border-white/20 mx-4 mb-4 rounded-2xl"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <View className="flex-row justify-around px-2 py-3">
          <TouchableOpacity
            onPress={() => setActiveTab("home")}
            className={`flex-1 items-center py-3 mx-1 rounded-xl ${
              activeTab === "home"
                ? "bg-indigo-100"
                : ""
            }`}
          >
            <Text className="text-2xl mb-1">🏠</Text>
            <Text
              className={`text-xs font-medium ${
                activeTab === "home"
                  ? "text-indigo-700"
                  : "text-slate-600"
              }`}
            >
              Home
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("expenses")}
            className={`flex-1 items-center py-3 mx-1 rounded-xl ${
              activeTab === "expenses"
                ? "bg-indigo-100"
                : ""
            }`}
          >
            <Text className="text-2xl mb-1">💰</Text>
            <Text
              className={`text-xs font-medium ${
                activeTab === "expenses"
                  ? "text-indigo-700"
                  : "text-slate-600"
              }`}
            >
              Expenses
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("profile")}
            className={`flex-1 items-center py-3 mx-1 rounded-xl ${
              activeTab === "profile"
                ? "bg-indigo-100"
                : ""
            }`}
          >
            <Text className="text-2xl mb-1">👤</Text>
            <Text
              className={`text-xs font-medium ${
                activeTab === "profile"
                  ? "text-indigo-700"
                  : "text-slate-600"
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