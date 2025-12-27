import { auth } from "@repo/auth";
import { cache, db } from "@repo/db";
import type { Context as HonoContext } from "hono";

export type CreateContextOptions = {
  context: HonoContext;
};

export async function createContext({ context }: CreateContextOptions) {
  const headers = context.req.raw.headers;
  const session = await auth.api.getSession({
    headers,
  });
  return {
    headers,
    session,
    db,
    cache,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
