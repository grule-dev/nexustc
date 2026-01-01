import { getLogger } from "@orpc/experimental-pino";
import { eq } from "@repo/db";
import { post, termPostRelation } from "@repo/db/schema/app";
import { comicCreateSchema } from "@repo/shared/schemas";
import z from "zod";
import { permissionProcedure } from "../../index";

export default {
  getDashboardList: permissionProcedure({
    comics: ["list"],
  }).handler(({ context: { db, ...ctx } }) => {
    const logger = getLogger(ctx);
    logger?.info("Fetching comic dashboard list");

    return db.query.post.findMany({
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
    });
  }),

  getEdit: permissionProcedure({
    comics: ["update"],
  })
    .input(z.string())
    .handler(({ context: { db, ...ctx }, input }) => {
      const logger = getLogger(ctx);
      logger?.info(`Fetching comic for editing: ${input}`);

      return db.query.post.findFirst({
        where: (p, { eq: equals }) => equals(p.id, input),
        with: {
          terms: {
            with: {
              term: true,
            },
          },
        },
      });
    }),

  createComicPrerequisites: permissionProcedure({
    comics: ["create"],
  }).handler(async ({ context: { db, ...ctx } }) => {
    const logger = getLogger(ctx);
    logger?.info("Fetching comic creation prerequisites");

    const terms = await db.query.term.findMany();
    logger?.debug(`Retrieved ${terms.length} terms for prerequisites`);

    return {
      terms,
    };
  }),

  create: permissionProcedure({
    comics: ["create"],
  })
    .input(comicCreateSchema)
    .handler(async ({ context: { db, session, ...ctx }, input, errors }) => {
      const logger = getLogger(ctx);
      logger?.info(
        `User ${session.user.id} creating new comic: "${input.title}"`
      );

      const [postData] = await db
        .insert(post)
        .values({
          title: input.title,
          authorId: session.user.id,
          status: input.documentStatus,
          type: "comic",
        })
        .returning({
          postId: post.id,
        });

      if (!postData) {
        logger?.error(`Failed to create comic for user ${session.user.id}`);
        throw errors.NOT_FOUND();
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
        logger?.debug(
          `Inserted ${termIds.length} term relations for comic ${postData.postId}`
        );
      }

      logger?.info(`Comic successfully created with ID: ${postData.postId}`);
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
    .handler(async ({ context: { db, ...ctx }, input }) => {
      const logger = getLogger(ctx);
      logger?.info(
        `Inserting ${input.images.length} images for comic: ${input.postId}`
      );

      await db
        .update(post)
        .set({
          imageObjectKeys: input.images,
        })
        .where(eq(post.id, input.postId));
      logger?.info(`Images successfully inserted for comic ${input.postId}`);
    }),
};
