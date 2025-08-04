// Types for the mobile app
export interface User {
  id: string;
  email: string;
  created_at: string;
  email_confirmed_at?: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: User;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  needsVerification?: boolean;
}

// Expense types
export enum ExpenseCategory {
  FOOD = "food",
  TRANSPORT = "transport",
  ENTERTAINMENT = "entertainment",
  SHOPPING = "shopping",
  UTILITIES = "utilities",
  HEALTH = "health",
  EDUCATION = "education",
  TRAVEL = "travel",
  OTHER = "other",
}

export type ExpenseCategoryType =
  | "food"
  | "transport"
  | "entertainment"
  | "shopping"
  | "utilities"
  | "health"
  | "education"
  | "travel"
  | "other";

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

export interface CreateExpenseRequest {
  amount: number;
  category: ExpenseCategoryType;
  description: string;
  date: string;
  photo?: { base64: string; mimeType: string };
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface ExportOptions {
  format: "csv" | "json" | "pdf";
  dateRange?: {
    start: string;
    end: string;
  };
  categories?: ExpenseCategoryType[];
}
