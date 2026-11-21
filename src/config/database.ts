import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import type { MongoMemoryServer } from "mongodb-memory-server";
import { env } from "./env.js";
import { seedDatabase } from "../utils/seedData.js";

let memoryServer: MongoMemoryServer | null = null;
let connectPromise: Promise<string> | null = null;

function resolveDbName(uri: string): string | undefined {
  try {
    const parsed = new URL(uri);
    const dbPath = parsed.pathname.replace(/^\/+/, "");
    return dbPath ? undefined : "doctor-tracker";
  } catch {
    return "doctor-tracker";
  }
}

export async function connectDatabase(): Promise<string> {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection.host;
  }

  if (connectPromise) {
    return connectPromise;
  }

  connectPromise = (async () => {
    let uri = env.MONGODB_URI;
    let usingEmbedded = false;

    if (!uri && env.NODE_ENV === "production" && !env.USE_MEMORY_DB) {
      throw new Error(
        "MONGODB_URI environment variable is required when running in production."
      );
    }

    if (!uri || env.USE_MEMORY_DB) {
      usingEmbedded = true;
      const { MongoMemoryServer: MemServer } = await import(
        "mongodb-memory-server"
      );
      const isTest = env.NODE_ENV === "test";

      if (isTest) {
        memoryServer = await MemServer.create();
      } else {
        const dbPath = path.resolve(process.cwd(), ".mongodb-data");
        fs.mkdirSync(dbPath, { recursive: true });
        try {
          memoryServer = await MemServer.create({
            instance: {
              dbName: "doctor-tracker",
              dbPath,
              storageEngine: "wiredTiger",
            },
          });
        } catch {
          // Fallback cleanly to ephemeral in-memory instance if wiredTiger lock occurs
          memoryServer = await MemServer.create({
            instance: { dbName: "doctor-tracker" },
          });
        }
      }

      uri = memoryServer.getUri("doctor-tracker");
    }

    mongoose.set("strictQuery", true);

    const dbName = resolveDbName(uri);
    await mongoose.connect(uri, {
      ...(dbName ? { dbName } : {}),
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
    });

    if (env.NODE_ENV !== "test") {
      console.log(
        usingEmbedded
          ? `Connected to embedded local MongoDB (${uri})`
          : "Connected to MongoDB"
      );
      const seedResult = await seedDatabase({ onlyIfEmpty: true });
      if (!seedResult.skipped) {
        console.log(
          `Seeded initial database: ${seedResult.doctorsCreated} doctors, ${seedResult.patientsCreated} patients (admin: ${seedResult.adminEmail})`
        );
      }
    }

    return uri;
  })();

  try {
    return await connectPromise;
  } catch (error) {
    connectPromise = null;
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  connectPromise = null;
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
