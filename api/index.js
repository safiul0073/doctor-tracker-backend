import { createApp } from "../dist/app.js";
import { connectDatabase } from "../dist/config/database.js";

const app = createApp();

export default async function handler(req, res) {
  const path = req.url?.split("?")[0] || "/";
  if (path !== "/" && path !== "/api/v1/health") {
    try {
      await connectDatabase();
    } catch (error) {
      console.error("Database connection failed:", error);
      res.statusCode = 503;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(
        JSON.stringify({
          success: false,
          code: "DATABASE_UNAVAILABLE",
          message:
            error instanceof Error
              ? error.message
              : "Database connection unavailable",
        })
      );
      return;
    }
  }
  return app(req, res);
}
