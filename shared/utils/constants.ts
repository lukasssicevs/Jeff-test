// API Constants
export const API_ENDPOINTS = {
  AUTH: {
    SIGN_UP: "/auth/signup",
    SIGN_IN: "/auth/signin",
    SIGN_OUT: "/auth/signout",
    REFRESH: "/auth/refresh",
    RESET_PASSWORD: "/auth/reset-password",
  },
} as const;

// Environment constants
export const ENV = {
  DEVELOPMENT: "development",
  STAGING: "staging",
  PRODUCTION: "production",
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your connection.",
  UNAUTHORIZED: "You are not authorized to perform this action.",
  FORBIDDEN: "Access denied.",
  NOT_FOUND: "Resource not found.",
  SERVER_ERROR: "Internal server error. Please try again later.",
  VALIDATION_ERROR: "Please check your input and try again.",
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  SIGN_UP: "Account created successfully!",
  SIGN_IN: "Welcome back!",
  SIGN_OUT: "Signed out successfully.",
  PASSWORD_RESET: "Password reset email sent.",
  PROFILE_UPDATED: "Profile updated successfully.",
} as const;
