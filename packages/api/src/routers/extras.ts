import type { tutorials as TutorialTable } from "@repo/db/schema/app";
import { tutorials } from "@repo/db/schema/app";
import z from "zod";
import { permissionProcedure, publicProcedure } from "../index";

type Tutorial = typeof TutorialTable.$inferSelect;

export default {
  getTutorials: publicProcedure.handler(
    async ({ context: { db } }): Promise<Tutorial[]> =>
      await db.query.tutorials.findMany()
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
    .handler(async ({ context: { db }, input }): Promise<void> => {
      await db.insert(tutorials).values(input);
    }),
};
