import { z } from "zod";

// Expense categories
export const ExpenseCategory = {
  FOOD: "food",
  TRANSPORT: "transport",
  ENTERTAINMENT: "entertainment",
  SHOPPING: "shopping",
  UTILITIES: "utilities",
  HEALTH: "health",
  EDUCATION: "education",
  TRAVEL: "travel",
  OTHER: "other",
} as const;

export type ExpenseCategoryType =
  (typeof ExpenseCategory)[keyof typeof ExpenseCategory];

// Zod schemas for validation
export const createExpenseSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  category: z.enum(Object.values(ExpenseCategory) as [string, ...string[]], {
    errorMap: () => ({ message: "Invalid category" }),
  }),
  description: z
    .string()
    .min(1, "Description is required")
    .max(255, "Description too long"),
  date: z.string().datetime("Invalid date format"),
});

export const updateExpenseSchema = createExpenseSchema.partial();

// TypeScript interfaces
export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  category: ExpenseCategoryType;
  description: string;
  date: string;
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface MobilePhotoData {
  base64: string;
  mimeType: string;
}

export interface CreateExpenseData {
  amount: number;
  category: ExpenseCategoryType;
  description: string;
  date: string;
  photo?: File | Blob | MobilePhotoData;
}

export interface UpdateExpenseData {
  amount?: number;
  category?: ExpenseCategoryType;
  description?: string;
  date?: string;
}

export interface ExpenseFilters {
  category?: ExpenseCategoryType;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface ExpenseStats {
  totalAmount: number;
  totalCount: number;
  categorySummary: Record<
    ExpenseCategoryType,
    {
      amount: number;
      count: number;
    }
  >;
}
