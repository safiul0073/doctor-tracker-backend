import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { env } from "./env.js";
import { seedDatabase } from "../utils/seedData.js";

let memoryServer: MongoMemoryServer | null = null;

export async function connectDatabase(): Promise<string> {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection.host;
  }

  let uri = env.MONGODB_URI;
  let usingEmbedded = false;

  if (!uri || env.USE_MEMORY_DB) {
    usingEmbedded = true;
    const isTest = env.NODE_ENV === "test";

    if (isTest) {
      memoryServer = await MongoMemoryServer.create();
    } else {
      const dbPath = path.resolve(process.cwd(), ".mongodb-data");
      fs.mkdirSync(dbPath, { recursive: true });
      try {
        memoryServer = await MongoMemoryServer.create({
          instance: {
            dbName: "doctor-tracker",
            dbPath,
            storageEngine: "wiredTiger",
          },
        });
      } catch {
        // Fallback cleanly to ephemeral in-memory instance if wiredTiger lock occurs
        memoryServer = await MongoMemoryServer.create({
          instance: { dbName: "doctor-tracker" },
        });
      }
    }

    uri = memoryServer.getUri("doctor-tracker");
  }

  mongoose.set("strictQuery", true);

  await mongoose.connect(uri, {
    maxPoolSize: 20,
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
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
