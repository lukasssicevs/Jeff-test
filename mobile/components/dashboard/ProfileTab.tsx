import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
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
          await signOut();
          onSignOut();
        },
      },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-6">
        {/* Profile Header */}
        <View className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <View className="items-center">
            <View className="w-20 h-20 bg-blue-600 rounded-full items-center justify-center mb-4">
              <Text className="text-white text-2xl font-bold">
                {user?.email?.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text className="text-xl font-semibold text-gray-900 mb-1">
              Welcome!
            </Text>
            <Text className="text-gray-600">{user?.email}</Text>
          </View>
        </View>

        {/* Account Info */}
        <View className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Account Information
          </Text>

          <View className="space-y-4">
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600">Email</Text>
              <Text className="font-medium text-gray-900">{user?.email}</Text>
            </View>

            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600">Member since</Text>
              <Text className="font-medium text-gray-900">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : "Unknown"}
              </Text>
            </View>

            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600">Account Status</Text>
              <View className="bg-green-100 px-3 py-1 rounded-full">
                <Text className="text-green-800 text-sm font-medium">
                  Active
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Settings */}
        <View className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Settings
          </Text>

          <View className="space-y-4">
            <TouchableOpacity className="flex-row justify-between items-center py-2">
              <Text className="text-gray-900">Notifications</Text>
              <Text className="text-gray-400">›</Text>
            </TouchableOpacity>

            <TouchableOpacity className="flex-row justify-between items-center py-2">
              <Text className="text-gray-900">Privacy</Text>
              <Text className="text-gray-400">›</Text>
            </TouchableOpacity>

            <TouchableOpacity className="flex-row justify-between items-center py-2">
              <Text className="text-gray-900">Support</Text>
              <Text className="text-gray-400">›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* App Info */}
        <View className="bg-blue-50 rounded-xl p-6 mb-6">
          <Text className="text-lg font-semibold text-blue-900 mb-2">
            🎉 TurboRepo + NativeWind
          </Text>
          <Text className="text-blue-800 mb-4">
            You're using a full-stack monorepo with shared authentication,
            beautiful mobile styling, and cross-platform code sharing!
          </Text>

          <View className="space-y-2">
            <Text className="text-blue-700 text-sm">
              ✅ Shared auth methods
            </Text>
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
          className="bg-red-600 rounded-lg p-4"
        >
          <Text className="text-white text-center font-semibold">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
