import { z } from "zod";

export const objectIdSchema = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, "Invalid MongoDB ObjectId");

export const optionalDateString = z
  .string()
  .optional()
  .refine(
    (val) => !val || !Number.isNaN(Date.parse(val)),
    "Invalid date format (expected ISO date string)"
  );

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(120).optional().default(""),
  from: optionalDateString,
  to: optionalDateString,
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});
