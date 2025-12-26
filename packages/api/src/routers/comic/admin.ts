import { ORPCError } from "@orpc/server";
import { db, eq } from "@repo/db";
import { post, termPostRelation } from "@repo/db/schema/app";
import { comicCreateSchema } from "@repo/shared/schemas";
import z from "zod";
import { permissionProcedure } from "../../index";

export default {
  getDashboardList: permissionProcedure({
    comics: ["list"],
  }).handler(() =>
    db.query.post.findMany({
      columns: {
        id: true,
        title: true,
        status: true,
      },
      where: (p, { eq: equals }) => equals(p.type, "comic"),
      with: {
        terms: {
          with: {
            term: true,
          },
        },
      },
      orderBy: (p, { desc }) => [desc(p.createdAt)],
    })
  ),

  getEdit: permissionProcedure({
    comics: ["update"],
  })
    .input(z.string())
    .handler(({ input }) =>
      db.query.post.findFirst({
        where: (p, { eq: equals }) => equals(p.id, input),
        with: {
          terms: {
            with: {
              term: true,
            },
          },
        },
      })
    ),

  createComicPrerequisites: permissionProcedure({
    comics: ["create"],
  }).handler(async () => {
    const terms = await db.query.term.findMany();
    return {
      terms,
    };
  }),

  create: permissionProcedure({
    comics: ["create"],
  })
    .input(comicCreateSchema)
    .handler(async ({ context, input }) => {
      const [postData] = await db
        .insert(post)
        .values({
          title: input.title,
          authorId: context.session.user.id,
          status: input.documentStatus,
          type: "comic",
        })
        .returning({
          postId: post.id,
        });

      if (!postData) {
        throw new ORPCError("NOT_FOUND");
      }

      const termIds = input.tags
        .concat(input.languages, [input.censorship])
        .filter((term) => term !== "")
        .map((termId) => ({
          postId: postData.postId,
          termId,
        }));

      if (termIds.length > 0) {
        await db.insert(termPostRelation).values(termIds);
      }

      return postData.postId;
    }),

  insertImages: permissionProcedure({
    comics: ["create"],
  })
    .input(
      z.object({
        postId: z.string(),
        images: z.array(z.string()),
      })
    )
    .handler(async ({ input }) => {
      await db
        .update(post)
        .set({
          imageObjectKeys: input.images,
        })
        .where(eq(post.id, input.postId));

      // await env.KV_STORE.delete("all-posts");
    }),
};
