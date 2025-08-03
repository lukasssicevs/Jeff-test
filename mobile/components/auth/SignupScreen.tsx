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

interface SignupScreenProps {
  onNavigateToLogin: () => void;
  onSignupSuccess: () => void;
}

export default function SignupScreen({
  onNavigateToLogin,
  onSignupSuccess,
}: SignupScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  const { signUp } = useAuth();

  const handleSubmit = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords don't match");
      return;
    }

    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);
    const result = await signUp(email, password, confirmPassword);

    if (result.success) {
      if (result.needsVerification) {
        setNeedsVerification(true);
      } else {
        onSignupSuccess();
      }
    } else {
      Alert.alert("Signup Failed", result.error || "Please try again");
    }

    setIsLoading(false);
  };

  if (needsVerification) {
    return (
      <ScrollView className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-100">
        <View className="flex-1 justify-center px-6 py-12">
          <View className="bg-white rounded-2xl shadow-xl p-8">
            <View className="items-center mb-8">
              <Text className="text-3xl font-bold text-gray-900 mb-2">
                Check Your Email
              </Text>
              <Text className="text-gray-600 text-center">
                Account created successfully!
              </Text>
            </View>

            <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <Text className="text-blue-800 text-center">
                Please check your email{" "}
                <Text className="font-semibold">{email}</Text> and click the
                verification link to complete your account setup.
              </Text>
            </View>

            <TouchableOpacity
              onPress={onNavigateToLogin}
              className="w-full py-4 border border-blue-600 rounded-lg mb-4"
            >
              <Text className="text-blue-600 text-center text-base font-semibold">
                Go to Sign In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setNeedsVerification(false)}>
              <Text className="text-blue-600 text-center">
                Didn't receive an email? Try again
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-100">
      <View className="flex-1 justify-center px-6 py-12">
        <View className="bg-white rounded-2xl shadow-xl p-8">
          <View className="items-center mb-8">
            <Text className="text-3xl font-bold text-gray-900 mb-2">
              Create account
            </Text>
            <Text className="text-gray-600 text-center">
              Sign up for a new account
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
              <Text className="text-xs text-gray-500 mt-1">
                Password must be at least 8 characters long
              </Text>
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm your password"
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
                  Sign up
                </Text>
              )}
            </TouchableOpacity>

            <View className="flex-row justify-center items-center">
              <Text className="text-gray-600">Already have an account? </Text>
              <TouchableOpacity onPress={onNavigateToLogin}>
                <Text className="font-medium text-blue-600">Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
