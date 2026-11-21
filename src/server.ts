import { createApp } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { env } from "./config/env.js";

async function bootstrap() {
  await connectDatabase();

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    console.log(
      `Doctor Tracker API listening on http://localhost:${env.PORT}/api/v1 (${env.NODE_ENV})`
    );
  });

  const shutdown = async (signal: string) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

bootstrap().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
