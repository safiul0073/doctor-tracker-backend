import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import apiRoutes from "./routes/index.js";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || env.corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      },
      credentials: true,
    })
  );

  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  if (env.NODE_ENV !== "test") {
    app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
  }

  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.get("/", (_req, res) => {
    res.status(200).json({
      success: true,
      data: {
        service: "doctor-tracker-api",
        status: "ok",
        health: "/api/v1/health",
      },
    });
  });

  app.use("/api/v1", apiLimiter, apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
