import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import HomeTab from "./HomeTab";
import ExpensesScreen from "../expenses/ExpensesScreen";

interface DashboardTabsProps {
  onSignOut: () => void;
}

export default function DashboardTabs({ onSignOut }: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<"home" | "expenses">("home");

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <HomeTab
            onTabChange={setActiveTab}
            onSignOut={onSignOut}
            isActive={activeTab === "home"}
          />
        );
      case "expenses":
        return <ExpensesScreen />;
      default:
        return (
          <HomeTab
            onTabChange={setActiveTab}
            onSignOut={onSignOut}
            isActive={activeTab === "home"}
          />
        );
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* Main Content */}
      <View style={{ flex: 1 }}>{renderContent()}</View>

      {/* Modern Floating Tab Bar */}
      <View
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          borderTopWidth: 1,
          borderTopColor: "rgba(255, 255, 255, 0.2)",
          marginHorizontal: 16,
          marginBottom: 16,
          borderRadius: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-around",
            paddingHorizontal: 8,
            paddingVertical: 12,
          }}
        >
          <TouchableOpacity
            onPress={() => setActiveTab("home")}
            style={{
              flex: 1,
              alignItems: "center",
              paddingVertical: 12,
              marginHorizontal: 4,
              borderRadius: 12,
              backgroundColor:
                activeTab === "home" ? "rgba(238, 242, 255, 1)" : "transparent",
            }}
          >
            <Text style={{ fontSize: 24, marginBottom: 4 }}>🏠</Text>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "500",
                color: activeTab === "home" ? "#4338ca" : "#64748b",
              }}
            >
              Home
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("expenses")}
            style={{
              flex: 1,
              alignItems: "center",
              paddingVertical: 12,
              marginHorizontal: 4,
              borderRadius: 12,
              backgroundColor:
                activeTab === "expenses"
                  ? "rgba(238, 242, 255, 1)"
                  : "transparent",
            }}
          >
            <Text style={{ fontSize: 24, marginBottom: 4 }}>💰</Text>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "500",
                color: activeTab === "expenses" ? "#4338ca" : "#64748b",
              }}
            >
              Expenses
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
