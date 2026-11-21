import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address").toLowerCase(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Please enter a valid email address").toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
