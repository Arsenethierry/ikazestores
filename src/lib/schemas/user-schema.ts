import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Required"),
});

export const signupSchema = z
  .object({
    email: z.string().email(),
    password: z
      .string()
      .min(1, { message: "Password must be at least 8 characters" })
      .max(265, { message: "Password must be less than 265 characters" }),
    confirmPassword: z
      .string()
      .min(1, { message: "Please confirm your password" }),
    fullName: z.string().min(1, "Required"),
    phoneNumber: z
      .string()
      .min(10, { message: "Number must be at least 10 digits" }),
  })
  .superRefine((val, ctx) => {
    if (val.password !== val.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password does not match with confirmed password",
        path: ["confirmPassword"],
      });
    }
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const updateEmailSchema = z.object({
  newEmail: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required for email changes"),
});

export const updatePhoneSchema = z.object({
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .regex(
      /^\+[1-9]\d{1,14}$/,
      "Phone number must include country code (e.g., +250123456789)"
    ),
  password: z.string().min(1, "Password is required for phone changes"),
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  phoneNumber: z.string().optional(),
  // Social media handles
  instagram: z.string().optional(),
  twitter: z.string().optional(),
  facebook: z.string().optional(),
  linkedin: z.string().optional(),
});

export const verifyEmilSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  secret: z.string().min(1, "Verification code is required"),
});

export const InitiatePasswordRecoverySchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const CompletePasswordRecoverySchema = z
  .object({
    userId: z.string().min(1, "User ID is required"),
    secret: z.string().min(1, "Recovery code is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  instagram: z.string().optional(),
  twitter: z.string().optional(),
  facebook: z.string().optional(),
  linkedin: z.string().optional(),
});

export const completeGoogleUserSetupSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().optional(),
  bio: z.string().optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
});

export const createUserDataSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().optional(),
  bio: z.string().optional(),
  website: z.string().optional(),
});

export const AddNewUserLabels = z.object({
  userId: z.string(),
  labels: z.array(z.string()),
});

export const DeleteUserAccount = z.object({
  userId: z.string(),
});

export const physicalSellerApplicationData = z.object({
  businessName: z
    .string()
    .min(2, "Business name must be at least 2 characters"),
  businessAddress: z
    .string()
    .min(10, "Please provide a complete business address"),
  businessPhone: z.string().min(10, "Please provide a valid phone number"),
  reason: z
    .string()
    .min(30, "Please explain your motivation (minimum 30 characters)"),
});

export const applyPhysicalSellerActionSchema =
  physicalSellerApplicationData.extend({
    userId: z.string(),
  });

export const reviewApplicationSchema = z.object({
  userId: z.string(),
  reviewNotes: z.string().optional(),
  action: z.enum(["approve", "reject"]),
});

export const changeUserRoleSchema = z.object({
  userId: z.string(),
  newRole: z.string(),
  reason: z.string().optional(),
});
