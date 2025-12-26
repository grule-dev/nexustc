import { env } from "@repo/env";
import { captcha } from "better-auth/plugins";

export const turnstilePlugin = () =>
  captcha({
    provider: "cloudflare-turnstile",
    secretKey: env.TURNSTILE_SECRET_KEY,
  });
