import { z } from 'zod';

// Common validation schemas
export const EmailSchema = z.string().email('Invalid email format');

export const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const PhoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format');

export const URLSchema = z.string().url('Invalid URL format');

export const UUIDSchema = z.string().uuid('Invalid UUID format');

// Date validation schemas
export const DateStringSchema = z.string().datetime('Invalid datetime format');

export const DateRangeSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
}).refine(
  (data) => new Date(data.startDate) < new Date(data.endDate),
  {
    message: 'Start date must be before end date',
    path: ['endDate'],
  }
);

// Numeric validation schemas
export const PositiveIntegerSchema = z.number().int().positive('Must be a positive integer');

export const PercentageSchema = z
  .number()
  .min(0, 'Percentage must be at least 0')
  .max(100, 'Percentage must be at most 100');

export const PriceSchema = z
  .number()
  .positive('Price must be positive')
  .multipleOf(0.01, 'Price must have at most 2 decimal places');

// Text validation schemas
export const NonEmptyStringSchema = z.string().min(1, 'This field is required');

export const TrimmedStringSchema = z.string().transform(val => val.trim());

export const SlugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Must be a valid slug (lowercase letters, numbers, and hyphens only)');

// Array validation schemas
export const NonEmptyArraySchema = <T>(itemSchema: z.ZodSchema<T>) =>
  z.array(itemSchema).min(1, 'Array must contain at least one item');

export const UniqueArraySchema = <T>(itemSchema: z.ZodSchema<T>) =>
  z.array(itemSchema).refine(
    (arr) => new Set(arr).size === arr.length,
    { message: 'Array must contain unique values' }
  );

// File validation schemas
export const ImageFileSchema = z.object({
  name: z.string(),
  size: z.number().max(5 * 1024 * 1024, 'File size must be less than 5MB'),
  type: z.string().regex(/^image\/(jpeg|jpg|png|gif|webp)$/, 'Must be a valid image file'),
});

export const DocumentFileSchema = z.object({
  name: z.string(),
  size: z.number().max(10 * 1024 * 1024, 'File size must be less than 10MB'),
  type: z.string().regex(/^(application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/, 'Must be a PDF or Word document'),
});

// Utility validation functions
export const createEnumSchema = <T extends readonly [string, ...string[]]>(values: T) =>
  z.enum(values, { errorMap: () => ({ message: `Must be one of: ${values.join(', ')}` }) });

export const createOptionalWithDefault = <T>(schema: z.ZodSchema<T>, defaultValue: T) =>
  schema.optional().default(defaultValue);

export const createNullableOptional = <T>(schema: z.ZodSchema<T>) =>
  schema.nullable().optional();

// Validation result types
export type ValidationResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  errors: Array<{
    path: string[];
    message: string;
  }>;
};

// Validation utility functions
export const validateData = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> => {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  return {
    success: false,
    errors: result.error.errors.map(err => ({
      path: err.path.map(String),
      message: err.message,
    })),
  };
};

export const validateAsync = async <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<ValidationResult<T>> => {
  try {
    const result = await schema.safeParseAsync(data);
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
      };
    }

    return {
      success: false,
      errors: result.error.errors.map(err => ({
        path: err.path.map(String),
        message: err.message,
      })),
    };
  } catch (error) {
    return {
      success: false,
      errors: [{
        path: [],
        message: error instanceof Error ? error.message : 'Unknown validation error',
      }],
    };
  }
};

export const getValidationErrors = (error: z.ZodError): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  error.errors.forEach(err => {
    const path = err.path.join('.');
    errors[path] = err.message;
  });
  
  return errors;
};

export const isValidationError = (error: unknown): error is z.ZodError => {
  return error instanceof z.ZodError;
};

// Common composite schemas
export const UserRegistrationSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  firstName: NonEmptyStringSchema.max(50, 'First name must be less than 50 characters'),
  lastName: NonEmptyStringSchema.max(50, 'Last name must be less than 50 characters'),
  phone: PhoneSchema.optional(),
  dateOfBirth: DateStringSchema.optional(),
});

export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const ContactFormSchema = z.object({
  name: NonEmptyStringSchema.max(100, 'Name must be less than 100 characters'),
  email: EmailSchema,
  subject: NonEmptyStringSchema.max(200, 'Subject must be less than 200 characters'),
  message: NonEmptyStringSchema.max(1000, 'Message must be less than 1000 characters'),
});

export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const SearchSchema = z.object({
  query: TrimmedStringSchema.min(1, 'Search query is required'),
  filters: z.record(z.string()).optional(),
}).merge(PaginationSchema);