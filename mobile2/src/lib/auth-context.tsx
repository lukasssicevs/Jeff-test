import React, { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "./api-client";
import type { User, AuthSession } from "./types";

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
  signOut: () => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

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
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const result = await authApi.signIn(email, password);

      if (result.success) {
        // Get user after successful sign in
        const userResult = await authApi.getCurrentUser();
        if (userResult.data) {
          setUser(userResult.data);
        }
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
      const result = await authApi.signUp(email, password, confirmPassword);

      if (result.success) {
        if (result.needsVerification) {
          return {
            success: true,
            needsVerification: true,
          };
        }
        // Get user after successful sign up
        const userResult = await authApi.getCurrentUser();
        if (userResult.data) {
          setUser(userResult.data);
        }
        return { success: true };
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
      const result = await authApi.signOut();

      if (result.success) {
        setUser(null);
        setSession(null);
        return { success: true };
      } else {
        return { success: false, error: result.error || "Sign out failed" };
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
