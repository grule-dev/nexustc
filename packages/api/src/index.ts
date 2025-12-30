import { os } from "@orpc/server";
import { auth } from "@repo/auth";
import type { Permissions, Role } from "@repo/shared/permissions";
import type { AtLeastOne } from "@repo/shared/types";
import { z } from "zod";
import type { Context } from "./context";

export const o = os.$context<Context>().errors({
  RATE_LIMITED: {
    status: 429,
    data: z.object({
      retryAfter: z.number(),
    }),
  },
  NOT_FOUND: {
    status: 404,
  },
  INTERNAL_SERVER_ERROR: {
    status: 500,
  },
  UNAUTHORIZED: {
    status: 401,
  },
  FORBIDDEN: {
    status: 403,
  },
});

export const router = o.router;

export const publicProcedure = o;

const requireAuth = o.middleware(({ context, next, errors }) => {
  if (!context.session?.user) {
    throw errors.UNAUTHORIZED();
  }
  return next({
    context: {
      session: context.session,
    },
  });
});

export const fixedWindowRatelimitMiddleware = ({
  limit,
  windowSeconds,
}: {
  limit: number;
  windowSeconds: number;
}) =>
  o.middleware(async ({ context, errors, next, path }) => {
    const ip = context.headers.get("cf-connecting-ip") ?? "unknown";

    const identifier = context.session
      ? `user:${context.session.user.id}`
      : `ip:${ip}`;

    const window = Math.floor(Date.now() / 1000 / windowSeconds);
    const key = `rl:fw:${identifier}:${path.join("/")}:${window}`;

    const count = await context.cache.incr(key);

    if (count === 1) {
      await context.cache.expire(key, windowSeconds);
    }

    if (count > limit) {
      const resetIn =
        windowSeconds - (Math.floor(Date.now() / 1000) % windowSeconds);

      throw errors.RATE_LIMITED({
        data: {
          retryAfter: resetIn,
        },
      });
    }

    return next();
  });

export const slidingWindowRatelimitMiddleware = (
  limit: number,
  windowSeconds: number
) =>
  o.middleware(async ({ context, errors, next, path }) => {
    const ip = context.headers.get("cf-connecting-ip");
    const now = Date.now();
    const windowMs = windowSeconds * 1000;

    const identifier = context.session
      ? `user:${context.session.user.id}`
      : `ip:${ip}`;

    const key = `rl:sw:${identifier}:${path.join("/")}`;

    await context.cache.zRemRangeByScore(key, 0, now - windowMs);

    const count = await context.cache.zCard(key);

    if (count >= limit) {
      const resetIn =
        windowSeconds - (Math.floor(Date.now() / 1000) % windowSeconds);

      throw errors.RATE_LIMITED({
        data: {
          retryAfter: resetIn,
        },
      });
    }

    await Promise.all([
      context.cache.zAdd(key, {
        score: now,
        value: now.toString(),
      }),
      context.cache.expire(key, windowSeconds),
    ]);

    return next();
  });

export const protectedProcedure = publicProcedure.use(requireAuth);

export const permissionProcedure = (permissions: AtLeastOne<Permissions>) =>
  protectedProcedure.use(
    o.middleware(async ({ context, next, errors }) => {
      const user = context.session?.user;

      if (!user) {
        throw errors.UNAUTHORIZED();
      }

      if (!user.role) {
        throw errors.FORBIDDEN();
      }

      const allowed = await auth.api.userHasPermission({
        body: { userId: user.id, role: user.role as Role, permissions },
      });

      if (!allowed.success) {
        throw errors.FORBIDDEN();
      }

      return next();
    })
  );
