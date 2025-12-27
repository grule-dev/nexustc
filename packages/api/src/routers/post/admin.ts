import { DeleteObjectsCommand, S3Client } from "@aws-sdk/client-s3";
import { eq, inArray } from "@repo/db";
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
    .handler(({ context: { db }, input }) =>
      db.query.post.findFirst({
        where: eq(post.id, input),
        with: {
          terms: {
            with: {
              term: true,
            },
          },
        },
      })
    ),

  getDashboardList: permissionProcedure({
    posts: ["list"],
  }).handler(({ context: { db } }) =>
    db.query.post.findMany({
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
    })
  ),

  createPostPrerequisites: permissionProcedure({
    posts: ["list"],
  }).handler(async ({ context: { db } }) => {
    const terms = await db.query.term.findMany();
    return {
      terms,
    };
  }),

  create: permissionProcedure({
    posts: ["create"],
  })
    .input(postCreateSchema)
    .handler(async ({ context: { db, session }, input, errors }) => {
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
      }

      return postData;
    }),

  edit: permissionProcedure({
    posts: ["update"],
  })
    .input(postCreateSchema.extend({ id: z.string() }))
    .handler(async ({ context: { db }, input, errors }) => {
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
      }

      // await env.KV_STORE.delete("all-posts");

      return postData.postId;
    }),

  delete: permissionProcedure({
    posts: ["delete"],
  })
    .input(z.string())
    .handler(async ({ context: { db }, input }) => {
      const currentPost = await db.query.post.findFirst({
        where: (p, { eq: equals }) => equals(p.id, input),
      });

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

      // await env.KV_STORE.delete("all-posts");
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
    .handler(async ({ context: { db }, input }) => {
      await db
        .update(post)
        .set({
          imageObjectKeys: input.images,
        })
        .where(eq(post.id, input.postId));

      // await env.KV_STORE.delete("all-posts");
    }),

  uploadWeeklyPosts: permissionProcedure({
    posts: ["create"],
  })
    .input(z.array(z.string()))
    .handler(async ({ context: { db }, input }) => {
      await db
        .update(post)
        .set({ isWeekly: false })
        .where(eq(post.isWeekly, true));

      await db
        .update(post)
        .set({
          isWeekly: true,
        })
        .where(inArray(post.id, input));

      // await env.KV_STORE.delete("all-posts");
    }),
};
