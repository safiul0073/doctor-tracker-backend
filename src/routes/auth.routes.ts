import { Router } from "express";
import * as rateLimitPkg from "express-rate-limit";
import * as authController from "../controllers/auth.controller.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { loginSchema, registerSchema } from "../validators/auth.validator.js";

const rateLimit =
  typeof rateLimitPkg.default === "function"
    ? rateLimitPkg.default
    : (rateLimitPkg as unknown as typeof rateLimitPkg.default);

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: "RATE_LIMITED",
    message: "Too many authentication attempts. Please try again later.",
  },
});

router.post(
  "/login",
  authLimiter,
  validate({ body: loginSchema }),
  asyncHandler(authController.login)
);

router.post(
  "/register",
  authLimiter,
  validate({ body: registerSchema }),
  asyncHandler(authController.register)
);

router.post("/logout", asyncHandler(authController.logout));

router.get("/me", requireAuth, asyncHandler(authController.me));

export default router;
