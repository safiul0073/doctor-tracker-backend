import { Router } from "express";
import * as analyticsController from "../controllers/analytics.controller.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { analyticsQuerySchema } from "../validators/analytics.validator.js";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get(
  "/overview",
  validate({ query: analyticsQuerySchema }),
  asyncHandler(analyticsController.getOverview)
);

export default router;
