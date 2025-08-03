import { ApiClient } from "./client";
import type {
  Expense,
  CreateExpenseData,
  UpdateExpenseData,
  ExpenseFilters,
  ExpenseStats,
  ExpenseCategoryType,
} from "../types/expense";
import type { ApiResponse } from "../types";
import { createExpenseSchema, updateExpenseSchema } from "../types/expense";

export class ExpenseApi {
  constructor(private apiClient: ApiClient) {}

  async createExpense(data: CreateExpenseData): Promise<ApiResponse<Expense>> {
    try {
      // Validate input data
      const validatedData = createExpenseSchema.parse(data);

      // Get the current authenticated user
      const {
        data: { user },
        error: userError,
      } = await this.apiClient.client.auth.getUser();

      if (userError || !user) {
        return { error: "User not authenticated" };
      }

      let photoUrl: string | undefined;

      // Handle photo upload if provided
      if (data.photo) {
        const { PhotoUploader } = await import("../utils/photo.js");
        const photoUploader = new PhotoUploader(this.apiClient);

        // Check if it's mobile base64 data or web File/Blob
        if (
          typeof data.photo === "object" &&
          "base64" in data.photo &&
          "mimeType" in data.photo
        ) {
          // Mobile: base64 data
          const mobilePhoto = data.photo as {
            base64: string;
            mimeType: string;
          };
          console.log("ExpenseApi: Starting mobile photo upload:", {
            base64Length: mobilePhoto.base64.length,
            mimeType: mobilePhoto.mimeType,
            userId: user.id,
          });

          const uploadResult = await photoUploader.uploadExpensePhotoMobile(
            mobilePhoto.base64,
            mobilePhoto.mimeType,
            user.id
          );

          console.log("ExpenseApi: Mobile photo upload result:", uploadResult);

          if (!uploadResult.success) {
            console.error(
              "ExpenseApi: Mobile photo upload failed:",
              uploadResult.error
            );
            return { error: uploadResult.error || "Failed to upload photo" };
          }

          photoUrl = uploadResult.url;
        } else {
          // Web: File or Blob
          console.log("ExpenseApi: Starting web photo upload:", {
            photoSize: (data.photo as File | Blob).size,
            photoType: (data.photo as File | Blob).type,
            userId: user.id,
          });

          const uploadResult = await photoUploader.uploadExpensePhoto(
            data.photo as File | Blob,
            user.id
          );

          console.log("ExpenseApi: Web photo upload result:", uploadResult);

          if (!uploadResult.success) {
            console.error(
              "ExpenseApi: Web photo upload failed:",
              uploadResult.error
            );
            return { error: uploadResult.error || "Failed to upload photo" };
          }

          photoUrl = uploadResult.url;
        }

        console.log("ExpenseApi: Photo uploaded successfully:", photoUrl);
      }

      const { data: expense, error } = await this.apiClient.client
        .from("expenses")
        .insert({
          user_id: user.id, // Add the user_id
          amount: validatedData.amount,
          category: validatedData.category,
          description: validatedData.description,
          date: validatedData.date,
          photo_url: photoUrl,
        })
        .select()
        .single();

      if (error) {
        // If expense creation failed but photo was uploaded, clean up the photo
        if (photoUrl) {
          const { PhotoUploader } = await import("../utils/photo.js");
          const photoUploader = new PhotoUploader(this.apiClient);
          await photoUploader.deleteExpensePhoto(photoUrl);
        }
        return { error: error.message };
      }

      return {
        data: expense,
        message: "Expense created successfully",
      };
    } catch (error) {
      if (error instanceof Error) {
        return { error: error.message };
      }
      return { error: "Failed to create expense" };
    }
  }

  async getExpenses(filters?: ExpenseFilters): Promise<ApiResponse<Expense[]>> {
    try {
      let query = this.apiClient.client
        .from("expenses")
        .select("*")
        .order("date", { ascending: false });

      // Apply filters
      if (filters?.category) {
        query = query.eq("category", filters.category);
      }

      if (filters?.startDate) {
        query = query.gte("date", filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte("date", filters.endDate);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(
          filters.offset,
          filters.offset + (filters.limit || 50) - 1
        );
      }

      const { data: expenses, error } = await query;

      if (error) {
        return { error: error.message };
      }

      return {
        data: expenses || [],
        message: `Retrieved ${expenses?.length || 0} expenses`,
      };
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error.message
            : "Failed to retrieve expenses",
      };
    }
  }

  async getExpenseById(id: string): Promise<ApiResponse<Expense>> {
    try {
      const { data: expense, error } = await this.apiClient.client
        .from("expenses")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        return { error: error.message };
      }

      if (!expense) {
        return { error: "Expense not found" };
      }

      return { data: expense };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Failed to retrieve expense",
      };
    }
  }

  async updateExpense(
    id: string,
    data: UpdateExpenseData
  ): Promise<ApiResponse<Expense>> {
    try {
      // Validate input data
      const validatedData = updateExpenseSchema.parse(data);

      const { data: expense, error } = await this.apiClient.client
        .from("expenses")
        .update(validatedData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      return {
        data: expense,
        message: "Expense updated successfully",
      };
    } catch (error) {
      if (error instanceof Error) {
        return { error: error.message };
      }
      return { error: "Failed to update expense" };
    }
  }

  async deleteExpense(id: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await this.apiClient.client
        .from("expenses")
        .delete()
        .eq("id", id);

      if (error) {
        return { error: error.message };
      }

      return {
        data: null,
        message: "Expense deleted successfully",
      };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Failed to delete expense",
      };
    }
  }

  async getExpenseStats(filters?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<ExpenseStats>> {
    try {
      let query = this.apiClient.client
        .from("expenses")
        .select("amount, category");

      // Apply date filters
      if (filters?.startDate) {
        query = query.gte("date", filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte("date", filters.endDate);
      }

      const { data: expenses, error } = await query;

      if (error) {
        return { error: error.message };
      }

      if (!expenses) {
        return { error: "No expenses found" };
      }

      // Calculate statistics
      const totalAmount = expenses.reduce(
        (sum, expense) => sum + expense.amount,
        0
      );
      const totalCount = expenses.length;

      const categorySummary: Record<
        ExpenseCategoryType,
        { amount: number; count: number }
      > = expenses.reduce(
        (acc, expense) => {
          const category = expense.category as ExpenseCategoryType;
          if (!acc[category]) {
            acc[category] = { amount: 0, count: 0 };
          }
          acc[category].amount += expense.amount;
          acc[category].count += 1;
          return acc;
        },
        {} as Record<ExpenseCategoryType, { amount: number; count: number }>
      );

      const stats: ExpenseStats = {
        totalAmount,
        totalCount,
        categorySummary,
      };

      return {
        data: stats,
        message: "Statistics calculated successfully",
      };
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error.message
            : "Failed to calculate statistics",
      };
    }
  }

  async getExpensesByCategory(
    category: ExpenseCategoryType
  ): Promise<ApiResponse<Expense[]>> {
    return this.getExpenses({ category });
  }

  async getExpensesByDateRange(
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<Expense[]>> {
    return this.getExpenses({ startDate, endDate });
  }
}
