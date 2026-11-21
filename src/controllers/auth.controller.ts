import { Request, Response } from "express";
import { env } from "../config/env.js";
import * as authService from "../services/auth.service.js";
import { unauthorizedError } from "../utils/errors.js";
import type { LoginInput, RegisterInput } from "../validators/auth.validator.js";

const COOKIE_NAME = "dt_token";

function setAuthCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

export async function login(req: Request, res: Response) {
  const result = await authService.loginAdmin(req.body as LoginInput);
  setAuthCookie(res, result.token);
  res.status(200).json({
    success: true,
    message: "Logged in successfully",
    data: result,
  });
}

export async function register(req: Request, res: Response) {
  const result = await authService.registerAdmin(req.body as RegisterInput);
  setAuthCookie(res, result.token);
  res.status(201).json({
    success: true,
    message: "Account created successfully",
    data: result,
  });
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie(COOKIE_NAME, { path: "/" });
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
}

export async function me(req: Request, res: Response) {
  if (!req.user) {
    throw unauthorizedError();
  }
  const user = await authService.getAdminProfile(req.user.id);
  res.status(200).json({
    success: true,
    data: { user },
  });
}
