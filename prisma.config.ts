import path from "node:path";
import dotenv from "dotenv";
import { defineConfig } from "@prisma/config";

// Prisma 7 doesn't auto-load .env files, so we do it manually
dotenv.config({ path: path.resolve(__dirname, ".env.local") });

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
});