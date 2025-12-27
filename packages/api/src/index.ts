import { os } from "@orpc/server";
import { auth } from "@repo/auth";
import type { Permissions, Role } from "@repo/shared/permissions";
import type { AtLeastOne } from "@repo/shared/types";
import { z } from "zod";
import type { Context } from "./context";

export const o = os.$context<Context>().errors({
  RATE_LIMITED: {
    data: z.object({
      retryAfter: z.number(),
    }),
  },
  NOT_FOUND: {},
  INTERNAL_SERVER_ERROR: {},
  UNAUTHORIZED: {},
  FORBIDDEN: {},
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
