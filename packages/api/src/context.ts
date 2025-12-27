import { auth } from "@repo/auth";
import { cache, db } from "@repo/db";
import type { Context as HonoContext } from "hono";

export type CreateContextOptions = {
  context: HonoContext;
};

export async function createContext({ context }: CreateContextOptions) {
  const session = await auth.api.getSession({
    headers: context.req.raw.headers,
  });
  return {
    session,
    db,
    cache,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
