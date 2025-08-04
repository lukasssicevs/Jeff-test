import React, { useState } from "react";
import LoginScreen from "./auth/LoginScreen";
import SignupScreen from "./auth/SignupScreen";

interface AuthFlowProps {
  onAuthSuccess: () => void;
}

export default function AuthFlow({ onAuthSuccess }: AuthFlowProps) {
  const [currentScreen, setCurrentScreen] = useState<"login" | "signup">(
    "login"
  );

  console.log("currentScreen", currentScreen);

  const handleNavigateToSignup = () => setCurrentScreen("signup");
  const handleNavigateToLogin = () => setCurrentScreen("login");

  if (currentScreen === "signup") {
    return (
      <SignupScreen
        onNavigateToLogin={handleNavigateToLogin}
        onSignupSuccess={onAuthSuccess}
      />
    );
  }

  return (
    <LoginScreen
      onNavigateToSignup={handleNavigateToSignup}
      onLoginSuccess={onAuthSuccess}
    />
  );
}
