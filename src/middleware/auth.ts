import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { unauthorizedError } from "../utils/errors.js";
import type { AuthUser } from "../types/express.js";

interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  role: "admin";
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7).trim();
    } else if (req.cookies?.dt_token) {
      token = String(req.cookies.dt_token);
    }

    if (!token) {
      return next(unauthorizedError("Missing authentication token"));
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    const user: AuthUser = {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    };

    req.user = user;
    return next();
  } catch {
    return next(unauthorizedError("Invalid or expired authentication token"));
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    return next(unauthorizedError("Authentication required"));
  }
  if (req.user.role !== "admin") {
    return next(unauthorizedError("Administrator access required"));
  }
  return next();
}
