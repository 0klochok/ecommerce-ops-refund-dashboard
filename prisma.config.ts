import { existsSync } from "node:fs";
import { config as loadEnv } from "dotenv";
import { defineConfig, env } from "prisma/config";

loadEnv({
  path: existsSync(".env.local") ? ".env.local" : ".env.example",
});

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
