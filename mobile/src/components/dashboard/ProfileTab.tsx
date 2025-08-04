import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../lib/auth-context";

interface ProfileTabProps {
  onSignOut: () => void;
}

export default function ProfileTab({ onSignOut }: ProfileTabProps) {
  const { user, signOut } = useAuth();

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
    <ScrollView className="flex-1 px-6 pt-6">
      {/* Profile Header */}
      <View
        className="p-6 rounded-xl border border-white/20 mb-6"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <View className="items-center">
          <LinearGradient
            colors={["#4f46e5", "#3b82f6"]}
            className="w-20 h-20 rounded-full items-center justify-center mb-4"
          >
            <Text className="text-3xl">👤</Text>
          </LinearGradient>

          <Text className="text-xl font-bold text-slate-800 mb-1">
            {user?.email?.split("@")[0] || "User"}
          </Text>
          <Text className="text-slate-600">
            {user?.email || "user@example.com"}
          </Text>
        </View>
      </View>

      {/* Settings */}
      <View
        className="p-6 rounded-xl border border-white/20 mb-6"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Text className="text-lg font-semibold text-slate-800 mb-4">
          Settings
        </Text>

        <View className="space-y-4">
          <TouchableOpacity className="flex-row justify-between items-center py-2">
            <Text className="text-slate-800">Notifications</Text>
            <Text className="text-slate-400">›</Text>
          </TouchableOpacity>

          <TouchableOpacity className="flex-row justify-between items-center py-2">
            <Text className="text-slate-800">Privacy</Text>
            <Text className="text-slate-400">›</Text>
          </TouchableOpacity>

          <TouchableOpacity className="flex-row justify-between items-center py-2">
            <Text className="text-slate-800">Support</Text>
            <Text className="text-slate-400">›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* App Info */}
      <View
        className="p-6 rounded-xl border border-blue-200 mb-6"
        style={{
          backgroundColor: "rgba(219, 234, 254, 0.8)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Text className="text-lg font-semibold text-blue-900 mb-2">
          🎉 Modern Mobile App
        </Text>
        <Text className="text-blue-800 mb-4">
          You're using a beautiful modern mobile app with glassmorphism design,
          gradient backgrounds, and smooth animations!
        </Text>

        <View className="space-y-2">
          <Text className="text-blue-700 text-sm">✅ Glassmorphism UI</Text>
          <Text className="text-blue-700 text-sm">✅ NativeWind styling</Text>
          <Text className="text-blue-700 text-sm">
            ✅ TypeScript everywhere
          </Text>
          <Text className="text-blue-700 text-sm">✅ Supabase backend</Text>
        </View>
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity
        onPress={handleSignOut}
        className="w-full rounded-xl overflow-hidden mb-6"
      >
        <LinearGradient colors={["#ef4444", "#dc2626"]} className="py-4 px-6">
          <Text className="text-white text-center text-lg font-semibold">
            Sign Out
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
}
