import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./drizzle/migrations/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgres://postgres:1001@localhost:5432/LIFEVILLE_HMS_db",
  },
});
