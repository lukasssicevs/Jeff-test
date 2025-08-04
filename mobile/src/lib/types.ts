// Re-export types from shared library
export type {
  // Auth types
  User,
  AuthSession,
  AuthResult,
  SignUpData,
  SignInData,
} from "shared";

export type {
  // Expense types
  Expense,
  ExpenseCategoryType,
  CreateExpenseRequest,
  CreateExpenseData,
  UpdateExpenseData,
  ExpenseFilters,
  ExpenseStats,
  MobilePhotoData,
} from "shared";

export type {
  // Common types
  ApiResponse,
  PaginatedResponse,
  LoadingState,
  AsyncState,
} from "shared";

export type {
  // Export types
  ExportOptions,
} from "shared";

// Re-export constants
export { ExpenseCategory } from "shared";
