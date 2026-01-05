import type { RouterClient } from "@orpc/server";
import comic from "./comic";
import extras from "./extras";
import file from "./file";
import patreon from "./patreon";
import post from "./post";
import rating from "./rating";
import term from "./term";
import user from "./user";

export const appRouter = {
  comic,
  post,
  term,
  user,
  file,
  extras,
  rating,
  patreon,
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
