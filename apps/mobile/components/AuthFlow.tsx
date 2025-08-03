import React, { useState } from "react";
import { View } from "react-native";
import LoginScreen from "./auth/LoginScreen";
import SignupScreen from "./auth/SignupScreen";

interface AuthFlowProps {
  onAuthSuccess: () => void;
}

export default function AuthFlow({ onAuthSuccess }: AuthFlowProps) {
  const [currentScreen, setCurrentScreen] = useState<"login" | "signup">(
    "login"
  );

  return (
    <View className="flex-1">
      {currentScreen === "login" ? (
        <LoginScreen
          onNavigateToSignup={() => setCurrentScreen("signup")}
          onLoginSuccess={onAuthSuccess}
        />
      ) : (
        <SignupScreen
          onNavigateToLogin={() => setCurrentScreen("login")}
          onSignupSuccess={onAuthSuccess}
        />
      )}
    </View>
  );
}
