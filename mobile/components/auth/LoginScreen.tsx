import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../../lib/auth-context";

interface LoginScreenProps {
  onNavigateToSignup: () => void;
  onLoginSuccess: () => void;
}

export default function LoginScreen({
  onNavigateToSignup,
  onLoginSuccess,
}: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { signIn } = useAuth();

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setIsLoading(true);
    const result = await signIn(email, password);

    if (result.success) {
      onLoginSuccess();
    } else {
      Alert.alert("Login Failed", result.error || "Please try again");
    }

    setIsLoading(false);
  };

  return (
    <ScrollView className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-100">
      <View className="flex-1 justify-center px-6 py-12">
        <View className="bg-white rounded-2xl shadow-xl p-8">
          <View className="items-center mb-8">
            <Text className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back
            </Text>
            <Text className="text-gray-600 text-center">
              Sign in to your account
            </Text>
          </View>

          <View className="space-y-6">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Email address
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 text-base"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Password
              </Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 text-base"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isLoading}
              className={`w-full py-4 rounded-lg shadow-sm ${
                isLoading ? "bg-gray-400" : "bg-blue-600"
              }`}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-center text-base font-semibold">
                  Sign in
                </Text>
              )}
            </TouchableOpacity>

            <View className="flex-row justify-center items-center">
              <Text className="text-gray-600">Don't have an account? </Text>
              <TouchableOpacity onPress={onNavigateToSignup}>
                <Text className="font-medium text-blue-600">Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
