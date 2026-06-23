import { defineConfig } from "drizzle-kit";

// Load .env.local / .env using Node.js built-in (v20.12+). No imports needed.
try { (process as any).loadEnvFile(".env.local"); } catch {}
try { (process as any).loadEnvFile(".env"); } catch {}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  tablesFilter: ["!session"],
});
