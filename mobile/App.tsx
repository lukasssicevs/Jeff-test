import "./global.css";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator } from "react-native";
import { AuthProvider, useAuth } from "./lib/auth-context";
import AuthFlow from "./components/AuthFlow";
import DashboardTabs from "./components/dashboard/DashboardTabs";

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View className="flex-1">
      {user ? (
        <DashboardTabs onSignOut={() => {}} />
      ) : (
        <AuthFlow onAuthSuccess={() => {}} />
      )}
      <StatusBar style="auto" />
    </View>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
