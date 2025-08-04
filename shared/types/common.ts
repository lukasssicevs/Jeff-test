// Common utility types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}
