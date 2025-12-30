import { auth } from "@repo/auth";
import { db, getRedis } from "@repo/db";

export type Context = {
  headers: Headers;
  session: Awaited<ReturnType<typeof auth.api.getSession>>;
  db: typeof db;
  cache: Awaited<ReturnType<typeof getRedis>>;
};

export async function createContext(headers: Headers): Promise<Context> {
  const session = await auth.api.getSession({
    headers,
  });

  return {
    headers,
    session,
    db,
    cache: await getRedis(),
  };
}
