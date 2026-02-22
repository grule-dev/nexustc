import { redirect } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";
import { authMiddleware } from "./auth";

export const ownerMiddleware = createMiddleware()
  .middleware([authMiddleware])
  .server(async ({ context, next }) => {
    if (context.user.role !== "owner") {
      throw redirect({ to: "/admin", replace: true });
    }

    return await next();
  });
