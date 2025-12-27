import { tutorials } from "@repo/db/schema/app";
import z from "zod";
import { permissionProcedure, publicProcedure } from "../index";

export default {
  getTutorials: publicProcedure.handler(({ context: { db } }) =>
    db.query.tutorials.findMany()
  ),

  createTutorial: permissionProcedure({
    posts: ["create"],
  })
    .input(
      z.object({
        title: z.string(),
        description: z.string(),
        embedUrl: z.url(),
      })
    )
    .handler(async ({ context: { db }, input }) =>
      db.insert(tutorials).values(input)
    ),
};
