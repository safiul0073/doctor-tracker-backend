import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(5001),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  MONGODB_URI: z.string().optional().default(""),
  USE_MEMORY_DB: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  JWT_SECRET: z
    .string()
    .min(16, "JWT_SECRET must be at least 16 characters")
    .default("doctor-tracker-dev-secret-key-please-change-in-production"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("http://localhost:3002"),
  ADMIN_NAME: z.string().default("Sarah Mitchell"),
  ADMIN_EMAIL: z.string().email().default("admin@example.com"),
  ADMIN_PASSWORD: z.string().min(6).default("password"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  corsOrigins: parsed.data.CORS_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
};
