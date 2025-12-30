import { createEnv } from "@t3-oss/env-core";
import z from "zod";

export const env = createEnv({
  client: {
    VITE_TURNSTILE_SITE_KEY: z.string(),
    VITE_ASSETS_BUCKET_URL: z.url(),
  },

  clientPrefix: "VITE_",

  // biome-ignore lint/suspicious/noExplicitAny: import.meta has no env property on this package
  runtimeEnv: (import.meta as any).env,

  emptyStringAsUndefined: true,
});
