import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { seedDatabase } from "../utils/seedData.js";

async function run() {
  try {
    await connectDatabase();
    const shouldReset = process.argv.includes("--reset");
    const result = await seedDatabase({ reset: shouldReset, onlyIfEmpty: !shouldReset });
    console.log("Seed finished:", result);
  } catch (error) {
    console.error("Failed to seed database:", error);
    process.exitCode = 1;
  } finally {
    await disconnectDatabase();
  }
}

run();
