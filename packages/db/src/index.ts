import { env } from "@repo/env";
import { RedisClient } from "bun";
import { drizzle } from "drizzle-orm/bun-sql";
import * as schema from "./schema/app";

export const db = drizzle(env.DATABASE_URL, {
  schema,
});

export const cache = new RedisClient(env.REDIS_URL);

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
