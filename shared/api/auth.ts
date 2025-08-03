import { ApiClient } from "./client";
import type {
  SignUpData,
  SignInData,
  ResetPasswordData,
  User,
  AuthSession,
} from "../types";
import type { ApiResponse } from "../types";

export class AuthApi {
  constructor(private apiClient: ApiClient) {}

  async signUp(data: SignUpData): Promise<ApiResponse<AuthSession>> {
    try {
      const { data: authData, error } = await this.apiClient.client.auth.signUp(
        {
          email: data.email,
          password: data.password,
        },
        {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      );

      if (error) {
        return { error: error.message };
      }

      // If user exists but no session, it means email verification is required
      if (authData.user && !authData.session) {
        return {
          error: "VERIFICATION_REQUIRED",
          message:
            "Please check your email and click the verification link to complete your account setup.",
        };
      }

      if (!authData.user) {
        return { error: "Failed to create account" };
      }

      // If both user and session exist, account is ready to use
      if (authData.session) {
        const session: AuthSession = {
          user: {
            id: authData.user.id,
            email: authData.user.email!,
            createdAt: authData.user.created_at,
            updatedAt: authData.user.updated_at || authData.user.created_at,
          },
          accessToken: authData.session.access_token,
          refreshToken: authData.session.refresh_token,
          expiresAt: authData.session.expires_at || 0,
        };

        return { data: session, message: "Account created successfully" };
      }

      return { error: "Failed to create account" };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  async signIn(data: SignInData): Promise<ApiResponse<AuthSession>> {
    try {
      const { data: authData, error } =
        await this.apiClient.client.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

      if (error) {
        return { error: error.message };
      }

      if (!authData.user || !authData.session) {
        return { error: "Invalid credentials" };
      }

      const session: AuthSession = {
        user: {
          id: authData.user.id,
          email: authData.user.email!,
          createdAt: authData.user.created_at,
          updatedAt: authData.user.updated_at || authData.user.created_at,
        },
        accessToken: authData.session.access_token,
        refreshToken: authData.session.refresh_token,
        expiresAt: authData.session.expires_at || 0,
      };

      return { data: session, message: "Signed in successfully" };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  async signOut(): Promise<ApiResponse<null>> {
    try {
      const { error } = await this.apiClient.client.auth.signOut();

      if (error) {
        return { error: error.message };
      }

      return { data: null, message: "Signed out successfully" };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  async resetPassword(data: ResetPasswordData): Promise<ApiResponse<null>> {
    try {
      const { error } = await this.apiClient.client.auth.resetPasswordForEmail(
        data.email
      );

      if (error) {
        return { error: error.message };
      }

      return { data: null, message: "Password reset email sent" };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const {
        data: { user },
        error,
      } = await this.apiClient.client.auth.getUser();

      if (error) {
        return { error: error.message };
      }

      if (!user) {
        return { error: "No user found" };
      }

      const userData: User = {
        id: user.id,
        email: user.email!,
        createdAt: user.created_at,
        updatedAt: user.updated_at || user.created_at,
      };

      return { data: userData };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  async refreshSession(): Promise<ApiResponse<AuthSession>> {
    try {
      const { data: authData, error } =
        await this.apiClient.client.auth.refreshSession();

      if (error) {
        return { error: error.message };
      }

      if (!authData.user || !authData.session) {
        return { error: "Failed to refresh session" };
      }

      const session: AuthSession = {
        user: {
          id: authData.user.id,
          email: authData.user.email!,
          createdAt: authData.user.created_at,
          updatedAt: authData.user.updated_at || authData.user.created_at,
        },
        accessToken: authData.session.access_token,
        refreshToken: authData.session.refresh_token,
        expiresAt: authData.session.expires_at || 0,
      };

      return { data: session };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }
}
