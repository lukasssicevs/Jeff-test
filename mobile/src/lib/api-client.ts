import { supabase } from "./supabase";
import type {
  Expense,
  CreateExpenseRequest,
  ApiResponse,
  User,
  AuthResult,
  AuthSession,
  ExportOptions,
} from "./types";

export class ApiClient {
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const headers = {
        "Content-Type": "application/json",
        ...(session?.access_token && {
          Authorization: `Bearer ${session.access_token}`,
        }),
        ...options.headers,
      };

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}${endpoint}`,
        {
          ...options,
          headers,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error("API request failed:", error);
      return {
        error: error instanceof Error ? error.message : "Request failed",
      };
    }
  }
}

export class AuthApi {
  constructor(private client: ApiClient) {}

  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        return { data: user as User };
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
    confirmPassword: string
  ): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signUp(
        {
          email,
          password,
        },
        {
          emailRedirectTo: "http://localhost:3000/auth/callback",
        }
      );

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

export class ExpenseApi {
  constructor(private client: ApiClient) {}

  async getExpenses(): Promise<ApiResponse<Expense[]>> {
    try {
      // Get the current authenticated user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return { error: "User not authenticated" };
      }

      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user.id) // Explicitly filter by user_id
        .order("date", { ascending: false });

      if (error) {
        return { error: error.message };
      }

      return { data: data || [] };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Failed to fetch expenses",
      };
    }
  }

  // Real-time subscriptions
  subscribeToExpenseChanges(
    userId: string,
    callback: (payload: {
      eventType: "INSERT" | "UPDATE" | "DELETE";
      new?: Expense;
      old?: Expense;
    }) => void
  ) {
    const channel = supabase
      .channel(`expenses_changes_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "expenses",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("Expense change detected:", payload);
          callback({
            eventType: payload.eventType as "INSERT" | "UPDATE" | "DELETE",
            new: payload.new as Expense,
            old: payload.old as Expense,
          });
        }
      )
      .subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel);
      },
    };
  }

  async createExpense(
    expense: CreateExpenseRequest
  ): Promise<ApiResponse<Expense>> {
    try {
      // Get the current authenticated user and session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        return { error: "User not authenticated" };
      }

      const user = session.user;

      let photoUrl: string | undefined;

      // Handle photo upload if present
      if (expense.photo) {
        const uploadResult = await this.uploadPhoto(expense.photo, user.id);
        if (uploadResult.error) {
          return { error: `Photo upload failed: ${uploadResult.error}` };
        }
        photoUrl = uploadResult.data;
      }

      // Ensure proper date formatting - add time to make it unambiguous
      const dateString = expense.date.includes("T")
        ? expense.date
        : `${expense.date}T12:00:00.000Z`;

      const insertData = {
        user_id: user.id, // Add the user_id for RLS policy
        amount: expense.amount,
        category: expense.category,
        description: expense.description,
        date: dateString, // Use properly formatted date
        ...(photoUrl && { photo_url: photoUrl }),
      };

      const { data, error } = await supabase
        .from("expenses")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Failed to create expense",
      };
    }
  }

  async deleteExpense(id: string): Promise<ApiResponse<boolean>> {
    try {
      // Get the current authenticated user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return { error: "User not authenticated" };
      }

      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id); // Ensure user can only delete their own expenses

      if (error) {
        return { error: error.message };
      }

      return { data: true };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Failed to delete expense",
      };
    }
  }

  private async uploadPhoto(
    photo: {
      base64: string;
      mimeType: string;
    },
    userId: string
  ): Promise<ApiResponse<string>> {
    try {
      // Generate unique filename with proper extension
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2);
      const extension = photo.mimeType.includes("jpeg") ? "jpg" : "png";
      const fileName = `expense_${timestamp}_${randomId}.${extension}`;

      // Create user-specific file path (required for RLS)
      const filePath = `${userId}/${fileName}`;

      // Convert base64 to ArrayBuffer for proper upload
      const arrayBuffer = decode(photo.base64);

      // Handle base64 upload for mobile with user path
      const { data, error } = await supabase.storage
        .from("expense-photos")
        .upload(filePath, arrayBuffer, {
          contentType: photo.mimeType,
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        return { error: error.message };
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("expense-photos").getPublicUrl(data.path);

      return { data: publicUrl };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Failed to upload photo",
      };
    }
  }
}

// Base64 decode function for React Native - returns ArrayBuffer for Supabase compatibility
function decode(base64: string): ArrayBuffer {
  try {
    // Remove data URL prefix if present
    const cleanBase64 = base64.replace(/^data:image\/[a-z]+;base64,/, "");

    const binaryString = atob(cleanBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  } catch (error) {
    throw new Error("Invalid base64 data");
  }
}

export class ExpenseExporter {
  static async exportExpenses(
    expenses: Expense[],
    options: ExportOptions
  ): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      switch (options.format) {
        case "csv":
          return { success: true, data: this.toCsv(expenses) };
        case "json":
          return { success: true, data: JSON.stringify(expenses, null, 2) };
        default:
          return { success: false, error: "Unsupported format" };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Export failed",
      };
    }
  }

  private static toCsv(expenses: Expense[]): string {
    const headers = ["Date", "Amount", "Category", "Description"];
    const rows = expenses.map((expense) => [
      expense.date,
      expense.amount.toString(),
      expense.category,
      expense.description.replace(/,/g, ";"), // Escape commas
    ]);

    return [headers, ...rows].map((row) => row.join(",")).join("\n");
  }
}

// Centralized API initialization
export const apiClient = new ApiClient();
export const authApi = new AuthApi(apiClient);
export const expenseApi = new ExpenseApi(apiClient);
