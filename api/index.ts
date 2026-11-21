import type { IncomingMessage, ServerResponse } from "node:http";
import { createApp } from "../src/app.js";
import { connectDatabase } from "../src/config/database.js";

const app = createApp();

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
) {
  await connectDatabase();
  return app(
    req as Parameters<typeof app>[0],
    res as Parameters<typeof app>[1]
  );
}
