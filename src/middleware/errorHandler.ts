import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";
import { AppError } from "../utils/errors.js";
import { env } from "../config/env.js";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      details: err.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      })),
    });
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({
      success: false,
      code: "INVALID_ID",
      message: `Invalid ${err.path}: ${err.value}`,
    });
    return;
  }

  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: number }).code === 11000
  ) {
    const keyValue = (err as { keyValue?: Record<string, unknown> }).keyValue;
    const field = keyValue ? Object.keys(keyValue)[0] : "field";
    res.status(409).json({
      success: false,
      code: "DUPLICATE_KEY",
      message: `A record with this ${field} already exists`,
      details: keyValue,
    });
    return;
  }

  if (env.NODE_ENV !== "test") {
    console.error("Unhandled server error:", err);
  }

  res.status(500).json({
    success: false,
    code: "INTERNAL_ERROR",
    message:
      env.NODE_ENV === "production"
        ? "An unexpected error occurred"
        : err instanceof Error
          ? err.message
          : "Internal server error",
  });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({
    success: false,
    code: "ROUTE_NOT_FOUND",
    message: "The requested API endpoint does not exist",
  });
}
