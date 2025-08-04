import { supabase } from "./supabase";
import { ApiClient, AuthApi, ExpenseApi } from "shared";
import type {
  AuthResult,
  ApiResponse,
  User,
  CreateExpenseRequest,
  Expense,
} from "./types";

// Initialize shared API client
const apiClient = ApiClient.getInstance({
  url: process.env.EXPO_PUBLIC_SUPABASE_URL!,
  anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
});

// Create shared API instances
export const authApi = new AuthApi(apiClient);
export const expenseApiShared = new ExpenseApi(apiClient);

// Mobile-specific wrapper for ExpenseApi to maintain compatibility
export class ExpenseApiMobile {
  async createExpense(
    expense: CreateExpenseRequest,
  ): Promise<ApiResponse<Expense>> {
    try {
      // Get the current authenticated user
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        return {
          error: "User not authenticated",
        };
      }

      // Ensure date has time component if not present
      let dateToSend = expense.date;
      if (!dateToSend.includes("T")) {
        dateToSend = `${expense.date}T12:00:00.000Z`;
      }

      // Handle photo upload if present
      let photoUrl: string | undefined;
      if (expense.photo) {
        const uploadResult = await this.uploadPhoto(
          expense.photo,
          session.user.id,
        );
        if (uploadResult.error) {
          return { error: uploadResult.error };
        }
        photoUrl = uploadResult.data;
      }

      // Create expense data
      const expenseData = {
        amount: expense.amount,
        category: expense.category,
        description: expense.description,
        date: dateToSend,
        user_id: session.user.id,
        ...(photoUrl && { photo_url: photoUrl }),
      };

      // Insert expense into database
      const { data, error } = await supabase
        .from("expenses")
        .insert(expenseData)
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      return { data: data as Expense };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Failed to create expense",
      };
    }
  }

  async getExpenses(): Promise<ApiResponse<Expense[]>> {
    try {
      // Get the current authenticated user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        return {
          error: "User not authenticated",
        };
      }

      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        return { error: error.message };
      }

      return { data: data as Expense[] };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Failed to get expenses",
      };
    }
  }

  async deleteExpense(id: string): Promise<ApiResponse<void>> {
    try {
      // Get the current authenticated user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        return {
          error: "User not authenticated",
        };
      }

      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        return { error: error.message };
      }

      return { data: undefined };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Failed to delete expense",
      };
    }
  }

  // Real-time subscriptions
  subscribeToExpenseChanges(
    callback: (payload: {
      eventType: "INSERT" | "UPDATE" | "DELETE";
      new?: Expense;
      old?: Expense;
    }) => void,
  ) {
    const channel = supabase
      .channel("expenses_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "expenses",
        },
        (payload) => {
          console.log("Expense change detected:", payload);
          callback({
            eventType: payload.eventType as "INSERT" | "UPDATE" | "DELETE",
            new: payload.new as Expense,
            old: payload.old as Expense,
          });
        },
      )
      .subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel);
      },
    };
  }

  private async uploadPhoto(
    photo: { base64: string; mimeType: string },
    userId: string,
  ): Promise<ApiResponse<string>> {
    try {
      // Import decode dynamically to avoid issues
      const { decode } = await import("base64-arraybuffer");

      // Remove data URL prefix if present
      const base64Data = photo.base64.replace(
        /^data:image\/[a-z]+;base64,/,
        "",
      );

      // Convert base64 to ArrayBuffer
      const arrayBuffer = decode(base64Data);

      // Generate unique filename
      const fileExt = photo.mimeType.split("/")[1] || "jpg";
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("expense-photos")
        .upload(filePath, arrayBuffer, {
          contentType: photo.mimeType,
        });

      if (error) {
        return { error: error.message };
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("expense-photos").getPublicUrl(filePath);

      return { data: publicUrl };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Failed to upload photo",
      };
    }
  }
}

// Create mobile expense API instance
export const expenseApi = new ExpenseApiMobile();

// Mobile-specific wrapper for AuthApi to maintain compatibility
export class AuthApiMobile {
  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        return {
          data: {
            id: user.id,
            email: user.email!,
            createdAt: user.created_at,
            updatedAt: user.updated_at || user.created_at,
          } as User,
        };
      } else {
        return { error: "No user found" };
      }
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Failed to get current user",
      };
    }
  }

  async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Sign in failed",
      };
    }
  }

  async signUp(
    email: string,
    password: string,
    confirmPassword: string,
  ): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // If user exists but no session, it means email verification is required
      if (data.user && !data.session) {
        return {
          success: true,
          needsVerification: true,
        };
      }

      // If user exists but email not confirmed, also require verification
      if (data.user && !data.user.email_confirmed_at) {
        return {
          success: true,
          needsVerification: true,
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Sign up failed",
      };
    }
  }

  async signOut(): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Sign out failed",
      };
    }
  }
}

// Create mobile auth API instance
export const authApiMobile = new AuthApiMobile();
