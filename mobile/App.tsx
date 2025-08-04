import "./global.css";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AuthProvider, useAuth } from "./src/lib/auth-context";
import AuthFlow from "./src/components/AuthFlow";
import DashboardTabs from "./src/components/dashboard/DashboardTabs";

function AppContent() {
  const { user, loading } = useAuth();

  console.log("user", user);

  if (loading) {
    return (
      <LinearGradient
        colors={["#f8fafc", "#e0f2fe", "#e0e7ff"]}
        style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
      >
        <ActivityIndicator size="large" color="#4f46e5" />
      </LinearGradient>
    );
  }
  console.log("fluser", user);
  return (
    <LinearGradient
      colors={["#f8fafc", "#e0f2fe", "#e0e7ff"]}
      style={{ flex: 1 }}
    >
      {user ? (
        <DashboardTabs onSignOut={() => {}} />
      ) : (
        <AuthFlow onAuthSuccess={() => {}} />
      )}
      <StatusBar style="auto" />
    </LinearGradient>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
