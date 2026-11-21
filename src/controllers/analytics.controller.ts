import { Request, Response } from "express";
import * as analyticsService from "../services/analytics.service.js";
import type { AnalyticsQuery } from "../validators/analytics.validator.js";

export async function getOverview(req: Request, res: Response) {
  const data = await analyticsService.getOverviewAnalytics(
    req.query as unknown as AnalyticsQuery
  );
  res.status(200).json({
    success: true,
    data,
  });
}
