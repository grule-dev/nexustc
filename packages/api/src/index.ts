import { ORPCError, os } from "@orpc/server";
import { auth } from "@repo/auth";
import { env } from "@repo/env";
import type { Permissions, Role } from "@repo/shared/permissions";
import type { AtLeastOne } from "@repo/shared/types";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { Context } from "./context";

export const o = os.$context<Context>();

export const router = o.router;

export const publicProcedure = o;

const redis = new Redis({ url: env.REDIS_URL, token: undefined });

export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
});

const requireAuth = o.middleware(({ context, next }) => {
  if (!context.session?.user) {
    throw new ORPCError("UNAUTHORIZED");
  }
  return next({
    context: {
      session: context.session,
    },
  });
});

export const protectedProcedure = publicProcedure.use(requireAuth);

export const permissionProcedure = (permissions: AtLeastOne<Permissions>) =>
  protectedProcedure.use(
    o.middleware(async ({ context, next }) => {
      const user = context.session?.user;

      if (!user) {
        throw new ORPCError("UNAUTHORIZED");
      }

      if (!user.role) {
        throw new ORPCError("FORBIDDEN");
      }

      const allowed = await auth.api.userHasPermission({
        body: { userId: user.id, role: user.role as Role, permissions },
      });

      if (!allowed.success) {
        throw new ORPCError("FORBIDDEN");
      }

      return next();
    })
  );
