import { createEnv } from "@t3-oss/env-core";
import z from "zod";

export const env = createEnv({
  server: {
    CORS_ORIGIN: z.url(),
    BETTER_AUTH_SECRET: z.string(),
    BETTER_AUTH_URL: z.url(),
    PATREON_CLIENT_ID: z.string(),
    PATREON_CLIENT_SECRET: z.string(),
    PATREON_SCOPE: z.string(),
    TURNSTILE_SECRET_KEY: z.string(),
    CLOUDFLARE_ACCOUNT_ID: z.string(),
    R2_ACCESS_KEY_ID: z.string(),
    R2_SECRET_ACCESS_KEY: z.string(),
    R2_ASSETS_BUCKET_NAME: z.string(),
    DATABASE_URL: z.string(),
    REDIS_URL: z.string(),
  },

  runtimeEnv: process.env,

  emptyStringAsUndefined: true,
  skipValidation: true,
});
