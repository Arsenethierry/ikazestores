import { z } from "zod";
import { UserRole } from "../constants";

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
    phoneNumber: z.string().min(10),
    role: z.nativeEnum(UserRole),
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
