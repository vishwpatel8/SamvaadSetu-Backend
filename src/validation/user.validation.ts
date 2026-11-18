import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email().max(100));

// ============= Register User Schema =============
export const registerUserSchema = z
  .object({
    email: emailSchema,
    password: z
      .string()
      .min(8)
      .max(20)
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
        "Password must contain uppercase, lowercase, number and special character",
      ),
    userName: z.string().trim().min(1, "User name is required").max(30),
    displayName: z.string().trim().min(1, "Display name is required").max(50),
  })
  .strict();

export const loginUserValidationSchema = z.object({
  email: z.string().trim().email("Invalid email address"),

  password: z.string().min(8, "Password must be at least 8 characters"),
});


export const forgotPasswordValidationSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
});

export const resetPasswordValidationSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      "Password must contain uppercase, lowercase, number and special character",
    ),
});

export const verifyTwoFactorValidationSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export const toggleTwoFactorValidationSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export const changePasswordValidationSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),

  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      "Password must contain uppercase, lowercase, number and special character",
    ),
});

export const deleteAccountValidationSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export const updateProfileValidationSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username cannot exceed 30 characters")
    .optional(),

  avatar: z.string().trim().url("Invalid avatar URL").optional(),
});
