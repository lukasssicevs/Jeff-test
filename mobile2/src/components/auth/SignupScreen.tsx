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
import { LinearGradient } from "expo-linear-gradient";
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
              <View style={{ alignItems: "center", marginBottom: 32 }}>
                <Text
                  style={{
                    fontSize: 28,
                    fontWeight: "bold",
                    color: "#1e293b",
                    marginBottom: 8,
                  }}
                >
                  Check Your Email
                </Text>
                <Text style={{ color: "#64748b", textAlign: "center" }}>
                  Account created successfully!
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: "rgba(219, 234, 254, 0.8)",
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 24,
                  borderWidth: 1,
                  borderColor: "rgba(147, 197, 253, 0.5)",
                }}
              >
                <Text style={{ color: "#1e40af", textAlign: "center" }}>
                  Please check your email{" "}
                  <Text style={{ fontWeight: "600" }}>{email}</Text> and click
                  the verification link to complete your account setup.
                </Text>
              </View>

              <TouchableOpacity
                onPress={onNavigateToLogin}
                style={{
                  width: "100%",
                  paddingVertical: 16,
                  borderWidth: 1,
                  borderColor: "#4f46e5",
                  borderRadius: 8,
                  marginBottom: 16,
                  backgroundColor: "rgba(255, 255, 255, 0.6)",
                }}
              >
                <Text
                  style={{
                    color: "#4f46e5",
                    textAlign: "center",
                    fontSize: 16,
                    fontWeight: "600",
                  }}
                >
                  Go to Sign In
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setNeedsVerification(false)}>
                <Text style={{ color: "#4f46e5", textAlign: "center" }}>
                  Didn't receive an email? Try again
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </LinearGradient>
      </View>
    );
  }

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
                Create account
              </Text>
              <Text style={{ color: "#64748b", textAlign: "center" }}>
                Sign up for a new account
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
                <Text style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                  Password must be at least 8 characters long
                </Text>
              </View>

              {/* Confirm Password Input */}
              <View>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: "#4f46e5",
                    marginBottom: 8,
                  }}
                >
                  Confirm Password
                </Text>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm your password"
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

              {/* Sign Up Button */}
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
                      Sign up
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Sign In Link */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#64748b" }}>
                  Already have an account?{" "}
                </Text>
                <TouchableOpacity onPress={onNavigateToLogin}>
                  <Text style={{ fontWeight: "500", color: "#4f46e5" }}>
                    Sign in
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
