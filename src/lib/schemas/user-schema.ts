import { z } from "zod";

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1, "Required"),
});

export const signupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1, { message: 'Password must be at least 8 characters' }).max(265, { message: "Password must be less than 265 characters" }),
    confirmPassword: z
        .string()
        .min(1, { message: 'Please confirm your password' }),
    fullName: z.string().min(1, "Required"),
    phoneNumber: z.string().min(10, { message: "Number must be at least 10 digits" }),
}).superRefine((val, ctx) => {
    if (val.password !== val.confirmPassword) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Password does not match with confirmed password",
            path: ['confirmPassword']
        })
    }
})

export const verifyEmilSchema = z.object({
    secret: z.string().min(1, "Required"),
    userId: z.string().min(1, "Required"),
});

export const InitiatePasswordRecoverySchema = z.object({
    email: z.string().email(),
});

export const CompletePasswordRecoverySchema = z.object({
    secret: z.string(),
    userId: z.string(),
    newPassword: z.string()
});

export const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  instagram: z.string().optional(),
  twitter: z.string().optional(),
  facebook: z.string().optional(),
  linkedin: z.string().optional(),
})

export const AddNewUserLabels = z.object({
    userId: z.string(),
    labels: z.array(z.string())
});

export const DeleteUserAccount = z.object({
    userId: z.string(),
})