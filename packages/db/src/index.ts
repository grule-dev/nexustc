import { env } from "@repo/env";
import { drizzle } from "drizzle-orm/node-postgres";
import { createClient, type RedisClientType } from "redis";
import * as schema from "./schema/app";

export const db = drizzle(env.DATABASE_URL, {
  logger: true,
  schema,
});

let client: RedisClientType | null = null;

export async function getRedis(): Promise<RedisClientType> {
  if (client?.isOpen) {
    return client;
  }

  client = createClient({ url: env.REDIS_URL });

  client.on("error", (err) => {
    console.error("Redis error", err);
  });

  await client.connect();

  return client;
}

// Re-export commonly used drizzle-orm functions to ensure all packages use the same instance
export {
  and,
  asc,
  desc,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  like,
  lt,
  lte,
  ne,
  not,
  or,
  sql,
} from "drizzle-orm";
