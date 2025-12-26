import { db } from "@repo/db";
import { tutorials } from "@repo/db/schema/app";
import z from "zod";
import { permissionProcedure, publicProcedure } from "../index";

export default {
  getTutorials: publicProcedure.handler(() => db.query.tutorials.findMany()),

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
    .handler(async ({ input }) => db.insert(tutorials).values(input)),
};
