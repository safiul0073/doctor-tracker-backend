import { z } from "zod";
import { optionalDateString } from "./common.validator.js";

export const analyticsQuerySchema = z.object({
  range: z.enum(["7d", "30d", "90d", "all"]).optional().default("30d"),
  from: optionalDateString,
  to: optionalDateString,
});

export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
