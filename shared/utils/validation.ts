import { z } from "zod";

// Email validation
export function isValidEmail(email: string): boolean {
  return z.string().email().safeParse(email).success;
}

// Password validation
export function isStrongPassword(password: string): boolean {
  const schema = z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number");

  return schema.safeParse(password).success;
}

// Generic validation helper
export function validateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): {
  success: boolean;
  data?: T;
  errors?: string[];
} {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    errors: result.error.errors.map((err) => err.message),
  };
}
