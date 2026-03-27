import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: ["./lib/db/schema.ts", "./lib/db/showdle-schema.ts"],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
