import { ORPCError } from "@orpc/server";
import { db, eq } from "@repo/db";
import { term } from "@repo/db/schema/app";
import { TAXONOMIES } from "@repo/shared/constants";
import z from "zod";
import { permissionProcedure, publicProcedure } from "../index";

export default {
  getAll: publicProcedure.handler(() =>
    db.query.term.findMany({
      columns: {
        id: true,
        name: true,
        taxonomy: true,
        color: true,
      },
    })
  ),

  create: permissionProcedure({ terms: ["create"] })
    .input(
      z.object({
        name: z
          .string()
          .trim()
          .min(1)
          .max(255)
          .transform((val) => val.trim()),
        color: z.string().trim(),
        taxonomy: z.enum(TAXONOMIES),
      })
    )
    .handler(async ({ input }) => {
      try {
        if (input.color === "") {
          await db.insert(term).values({
            name: input.name,
            taxonomy: input.taxonomy,
            color: null,
          });
        } else {
          await db.insert(term).values(input);
        }
      } catch (error) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: `Error desconocido. Info: ${error}`,
        });
      }
    }),

  edit: permissionProcedure({ terms: ["update"] })
    .input(
      z.object({
        id: z.string(),
        name: z
          .string()
          .trim()
          .min(1)
          .max(255)
          .transform((val) => val.trim()),
        color: z.string().trim(),
      })
    )
    .handler(async ({ input }) => {
      await db.update(term).set(input).where(eq(term.id, input.id));
    }),

  getDashboardList: permissionProcedure({ terms: ["list"] }).handler(() =>
    db.query.term.findMany()
  ),

  delete: permissionProcedure({ terms: ["delete"] })
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      await db.delete(term).where(eq(term.id, input.id));
    }),
};
