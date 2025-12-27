import type { RouterClient } from "@orpc/server";
import comic from "./comic";
import extras from "./extras";
import file from "./file";
import post from "./post";
import term from "./term";
import user from "./user";

export const appRouter = {
  comic,
  post,
  term,
  user,
  file,
  extras,
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
