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
import { LinearGradient } from "expo-linear-gradient";

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
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={["#f8fafc", "#e0f2fe", "#e0e7ff"]}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flex: 1,
            justifyContent: "center",
            paddingHorizontal: 24,
            paddingVertical: 48,
          }}
        >
          <View
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              borderRadius: 16,
              padding: 32,
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.2)",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.1,
              shadowRadius: 24,
              elevation: 12,
            }}
          >
            {/* Header */}
            <View style={{ alignItems: "center", marginBottom: 32 }}>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: "bold",
                  color: "#1e293b",
                  marginBottom: 8,
                }}
              >
                Welcome back
              </Text>
              <Text style={{ color: "#64748b", textAlign: "center" }}>
                Sign in to your account
              </Text>
            </View>

            {/* Form */}
            <View style={{ gap: 24 }}>
              {/* Email Input */}
              <View>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: "#4f46e5",
                    marginBottom: 8,
                  }}
                >
                  Email address
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{
                    width: "100%",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderWidth: 1,
                    borderColor: "#cbd5e1",
                    borderRadius: 8,
                    backgroundColor: "rgba(255, 255, 255, 0.6)",
                    color: "#1e293b",
                    fontSize: 16,
                  }}
                  placeholderTextColor="#64748b"
                />
              </View>

              {/* Password Input */}
              <View>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: "#4f46e5",
                    marginBottom: 8,
                  }}
                >
                  Password
                </Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  secureTextEntry
                  style={{
                    width: "100%",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderWidth: 1,
                    borderColor: "#cbd5e1",
                    borderRadius: 8,
                    backgroundColor: "rgba(255, 255, 255, 0.6)",
                    color: "#1e293b",
                    fontSize: 16,
                  }}
                  placeholderTextColor="#64748b"
                />
              </View>

              {/* Sign In Button */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isLoading}
                style={{ width: "100%", borderRadius: 8, overflow: "hidden" }}
              >
                <LinearGradient
                  colors={
                    isLoading ? ["#9ca3af", "#6b7280"] : ["#4f46e5", "#3b82f6"]
                  }
                  style={{ paddingVertical: 16, paddingHorizontal: 16 }}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text
                      style={{
                        color: "white",
                        textAlign: "center",
                        fontSize: 16,
                        fontWeight: "600",
                      }}
                    >
                      Sign in
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Sign Up Link */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#64748b" }}>
                  Don't have an account?{" "}
                </Text>
                <TouchableOpacity onPress={onNavigateToSignup}>
                  <Text style={{ fontWeight: "500", color: "#4f46e5" }}>
                    Sign up
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
