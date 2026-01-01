import { DeleteObjectsCommand, S3Client } from "@aws-sdk/client-s3";
import { getLogger } from "@orpc/experimental-pino";
import { and, eq, inArray, sql } from "@repo/db";
import { post, termPostRelation } from "@repo/db/schema/app";
import { env } from "@repo/env";
import { postCreateSchema } from "@repo/shared/schemas";
import z from "zod";
import { permissionProcedure } from "../../index";

const S3 = () =>
  new S3Client({
    region: "auto",
    endpoint: `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });

export default {
  getEdit: permissionProcedure({
    posts: ["update"],
  })
    .input(z.string())
    .handler(({ context: { db, ...ctx }, input }) => {
      const logger = getLogger(ctx);
      logger?.info(`Fetching post for editing: ${input}`);

      return db.query.post.findFirst({
        where: eq(post.id, input),
        with: {
          terms: {
            with: {
              term: true,
            },
          },
        },
      });
    }),

  getDashboardList: permissionProcedure({
    posts: ["list"],
  }).handler(({ context: { db, ...ctx } }) => {
    const logger = getLogger(ctx);
    logger?.info("Fetching post dashboard list");

    return db.query.post.findMany({
      columns: {
        id: true,
        title: true,
        status: true,
      },
      where: (p, { eq: equals }) => equals(p.type, "post"),
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

  createPostPrerequisites: permissionProcedure({
    posts: ["list"],
  }).handler(async ({ context: { db, ...ctx } }) => {
    const logger = getLogger(ctx);
    logger?.info("Fetching post creation prerequisites");

    const terms = await db.query.term.findMany();
    logger?.debug(`Retrieved ${terms.length} terms for prerequisites`);

    return {
      terms,
    };
  }),

  create: permissionProcedure({
    posts: ["create"],
  })
    .input(postCreateSchema)
    .handler(async ({ context: { db, session, ...ctx }, input, errors }) => {
      const logger = getLogger(ctx);
      logger?.info(
        `User ${session.user?.id} creating new post: "${input.title}"`
      );

      const [postData] = await db
        .insert(post)
        .values({
          title: input.title,
          content: input.content,
          adsLinks: input.adsLinks,
          premiumLinks: input.premiumLinks,
          version: input.version,
          authorId: session.user?.id,
          status: input.documentStatus,
        })
        .returning({ postId: post.id });

      if (!postData) {
        logger?.error(`Failed to create post for user ${session.user?.id}`);
        throw errors.NOT_FOUND();
      }

      const termIds = input.platforms
        .concat(input.tags, input.languages, [
          input.censorship,
          input.engine,
          input.status,
          input.graphics,
        ])
        .filter((term) => term !== "")
        .map((termId) => ({
          postId: postData.postId,
          termId,
        }));

      if (termIds.length > 0) {
        await db.insert(termPostRelation).values(termIds);
        logger?.debug(
          `Inserted ${termIds.length} term relations for post ${postData.postId}`
        );
      }

      logger?.info(`Post successfully created with ID: ${postData.postId}`);
      return postData;
    }),

  edit: permissionProcedure({
    posts: ["update"],
  })
    .input(postCreateSchema.extend({ id: z.string() }))
    .handler(async ({ context: { db, ...ctx }, input, errors }) => {
      const logger = getLogger(ctx);
      logger?.info(`Editing post: ${input.id}`);

      const [postData] = await db
        .update(post)
        .set({
          title: input.title,
          content: input.content,
          status: input.documentStatus,
          version: input.version,
          adsLinks: input.adsLinks,
          premiumLinks: input.premiumLinks,
        })
        .where(eq(post.id, input.id))
        .returning({ postId: post.id });

      if (!postData) {
        logger?.error(`Post not found for edit: ${input.id}`);
        throw errors.NOT_FOUND();
      }

      await db
        .delete(termPostRelation)
        .where(eq(termPostRelation.postId, postData.postId));

      const termIds = input.platforms
        .concat(input.tags, input.languages, [
          input.censorship,
          input.engine,
          input.status,
          input.graphics,
        ])
        .filter((term) => term !== "")
        .map((termId) => ({
          postId: postData.postId,
          termId,
        }));

      if (termIds.length > 0) {
        await db.insert(termPostRelation).values(termIds);
        logger?.debug(
          `Updated ${termIds.length} term relations for post ${postData.postId}`
        );
      }

      logger?.info(`Post ${input.id} successfully updated`);
      return postData.postId;
    }),

  delete: permissionProcedure({
    posts: ["delete"],
  })
    .input(z.string())
    .handler(async ({ context: { db, ...ctx }, input }) => {
      const logger = getLogger(ctx);
      logger?.info(`Deleting post: ${input}`);

      const currentPost = await db.query.post.findFirst({
        where: (p, { eq: equals }) => equals(p.id, input),
      });

      if (!currentPost) {
        logger?.warn(`Post not found for deletion: ${input}`);
        return;
      }

      await Promise.all([
        currentPost?.imageObjectKeys &&
          S3().send(
            new DeleteObjectsCommand({
              Bucket: env.R2_ASSETS_BUCKET_NAME,
              Delete: {
                Objects: currentPost.imageObjectKeys.map((key) => ({
                  Key: key,
                })),
              },
            })
          ),
        db.delete(post).where(eq(post.id, input)),
      ]);

      if (currentPost?.imageObjectKeys) {
        logger?.debug(
          `Deleted ${currentPost.imageObjectKeys.length} images for post ${input}`
        );
      }
      logger?.info(`Post ${input} successfully deleted`);
    }),

  insertImages: permissionProcedure({
    posts: ["create"],
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
        `Inserting ${input.images.length} images for post: ${input.postId}`
      );

      await db
        .update(post)
        .set({
          imageObjectKeys: input.images,
        })
        .where(eq(post.id, input.postId));

      logger?.info(`Images successfully inserted for post ${input.postId}`);
    }),

  uploadWeeklyPosts: permissionProcedure({
    posts: ["create"],
  })
    .input(z.array(z.string()))
    .handler(async ({ context: { db, ...ctx }, input }) => {
      const logger = getLogger(ctx);
      logger?.info(`Uploading ${input.length} posts as weekly`);

      await db
        .update(post)
        .set({ isWeekly: false })
        .where(eq(post.isWeekly, true));
      logger?.debug("Cleared previous weekly posts");

      await db
        .update(post)
        .set({
          isWeekly: true,
        })
        .where(inArray(post.id, input));
      logger?.info(`Successfully set ${input.length} posts as weekly`);
    }),

  getWeeklySelectionPosts: permissionProcedure({
    posts: ["list"],
  })
    .input(z.object({ search: z.string().optional() }))
    .handler(async ({ context: { db, ...ctx }, input }) => {
      const logger = getLogger(ctx);
      logger?.info(
        `Fetching weekly selection posts${input.search ? ` with search: "${input.search}"` : ""}`
      );

      const conditions = [eq(post.type, "post")];

      // Fuzzy search using pg_trgm (same pattern as public search endpoint)
      if (input.search && input.search.trim() !== "") {
        conditions.push(sql`${post.title} % ${input.search.trim()}`);
      }

      const posts = await db
        .select({
          id: post.id,
          title: post.title,
          version: post.version,
          imageObjectKeys: post.imageObjectKeys,
          isWeekly: post.isWeekly,
          similarity: sql<number>`similarity(${post.title}, ${input.search?.trim() || ""})`,
        })
        .from(post)
        .where(and(...conditions))
        .orderBy(
          input.search && input.search.trim() !== ""
            ? sql`similarity DESC, ${post.createdAt} DESC`
            : sql`${post.createdAt} DESC`
        );

      const result = posts.map(({ similarity, ...postData }) => postData);
      logger?.debug(`Retrieved ${result.length} weekly selection posts`);

      return result;
    }),

  getSelectedWeeklyPosts: permissionProcedure({
    posts: ["list"],
  }).handler(({ context: { db, ...ctx } }) => {
    const logger = getLogger(ctx);
    logger?.info("Fetching currently selected weekly posts");

    return db
      .select({
        id: post.id,
        title: post.title,
        version: post.version,
        imageObjectKeys: post.imageObjectKeys,
      })
      .from(post)
      .where(and(eq(post.type, "post"), eq(post.isWeekly, true)));
  }),
};
