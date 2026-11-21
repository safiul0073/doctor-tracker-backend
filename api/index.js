import { createApp } from "../dist/app.js";
import { connectDatabase } from "../dist/config/database.js";

const app = createApp();

export default async function handler(req, res) {
  const path = req.url?.split("?")[0] || "/";
  if (path !== "/" && path !== "/api/v1/health") {
    await connectDatabase();
  }
  return app(req, res);
}
