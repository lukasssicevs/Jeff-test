import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react";
import { AuthApi } from "shared";
import { apiClient } from "./supabase";
import type { User, AuthSession } from "shared";

interface AuthContextType {
  user: User | null;
  session: AuthSession | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  signUp: (
    email: string,
    password: string,
    confirmPassword: string
  ) => Promise<{
    success: boolean;
    error?: string;
    needsVerification?: boolean;
  }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  const authApi = useMemo(() => new AuthApi(apiClient), []);

  useEffect(() => {
    // Check for existing session on load
    const checkSession = async () => {
      try {
        const result = await authApi.getCurrentUser();
        if (result.data) {
          setUser(result.data);
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [authApi]);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const result = await authApi.signIn({ email, password });

      if (result.data) {
        setUser(result.data.user);
        setSession(result.data);
        return { success: true };
      } else {
        return { success: false, error: result.error || "Sign in failed" };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    confirmPassword: string
  ) => {
    try {
      setLoading(true);
      const result = await authApi.signUp({ email, password, confirmPassword });

      if (result.data) {
        setUser(result.data.user);
        setSession(result.data);
        return { success: true };
      } else if (result.error === "VERIFICATION_REQUIRED") {
        return {
          success: true,
          needsVerification: true,
          error: result.message || "Please verify your email",
        };
      } else {
        return { success: false, error: result.error || "Sign up failed" };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await authApi.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
