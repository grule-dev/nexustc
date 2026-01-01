import { and, desc, eq, sql } from "@repo/db";
import { post, postRating, user } from "@repo/db/schema/app";
import { ratingCreateSchema, ratingUpdateSchema } from "@repo/shared/schemas";
import z from "zod";
import {
  permissionProcedure,
  protectedProcedure,
  publicProcedure,
} from "../index";

export default {
  // Create or update a rating (upsert)
  create: protectedProcedure
    .input(ratingCreateSchema)
    .handler(async ({ context: { db, session }, input }) => {
      await db
        .insert(postRating)
        .values({
          postId: input.postId,
          userId: session.user.id,
          rating: input.rating,
          review: input.review ?? "",
        })
        .onConflictDoUpdate({
          target: [postRating.userId, postRating.postId],
          set: {
            rating: input.rating,
            review: input.review ?? "",
            updatedAt: new Date(),
          },
        });

      return { success: true };
    }),

  // Update own rating
  update: protectedProcedure
    .input(ratingUpdateSchema)
    .handler(async ({ context: { db, session }, input }) => {
      await db
        .update(postRating)
        .set({
          rating: input.rating,
          review: input.review ?? "",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(postRating.postId, input.postId),
            eq(postRating.userId, session.user.id)
          )
        );

      return { success: true };
    }),

  // Delete own rating
  delete: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .handler(async ({ context: { db, session }, input }) => {
      await db
        .delete(postRating)
        .where(
          and(
            eq(postRating.postId, input.postId),
            eq(postRating.userId, session.user.id)
          )
        );

      return { success: true };
    }),

  // Admin delete any rating
  deleteAny: permissionProcedure({ ratings: ["delete"] })
    .input(z.object({ postId: z.string(), userId: z.string() }))
    .handler(async ({ context: { db }, input }) => {
      await db
        .delete(postRating)
        .where(
          and(
            eq(postRating.postId, input.postId),
            eq(postRating.userId, input.userId)
          )
        );

      return { success: true };
    }),

  // Get all ratings for a post
  getByPostId: publicProcedure
    .input(z.object({ postId: z.string() }))
    .handler(async ({ context: { db }, input }) => {
      const ratings = await db
        .select({
          postId: postRating.postId,
          userId: postRating.userId,
          rating: postRating.rating,
          review: postRating.review,
          createdAt: postRating.createdAt,
          updatedAt: postRating.updatedAt,
        })
        .from(postRating)
        .where(eq(postRating.postId, input.postId))
        .orderBy(desc(postRating.createdAt));

      const userIds = [...new Set(ratings.map((r) => r.userId))];

      const authors =
        userIds.length > 0
          ? await db
              .select({
                id: user.id,
                name: user.name,
                image: user.image,
                role: user.role,
              })
              .from(user)
              .where(
                sql`${user.id} IN (${sql.join(
                  userIds.map((id) => sql`${id}`),
                  sql`, `
                )})`
              )
          : [];

      return { ratings, authors };
    }),

  // Get recent ratings across all posts (paginated)
  getRecent: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .handler(async ({ context: { db }, input }) => {
      const ratings = await db
        .select({
          postId: postRating.postId,
          userId: postRating.userId,
          rating: postRating.rating,
          review: postRating.review,
          createdAt: postRating.createdAt,
          updatedAt: postRating.updatedAt,
        })
        .from(postRating)
        .innerJoin(post, eq(post.id, postRating.postId))
        .where(eq(post.status, "publish"))
        .orderBy(desc(postRating.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const userIds = [...new Set(ratings.map((r) => r.userId))];
      const postIds = [...new Set(ratings.map((r) => r.postId))];

      const authors =
        userIds.length > 0
          ? await db
              .select({
                id: user.id,
                name: user.name,
                image: user.image,
                role: user.role,
              })
              .from(user)
              .where(
                sql`${user.id} IN (${sql.join(
                  userIds.map((id) => sql`${id}`),
                  sql`, `
                )})`
              )
          : [];

      const posts =
        postIds.length > 0
          ? await db
              .select({
                id: post.id,
                title: post.title,
                type: post.type,
                imageObjectKeys: post.imageObjectKeys,
              })
              .from(post)
              .where(
                sql`${post.id} IN (${sql.join(
                  postIds.map((id) => sql`${id}`),
                  sql`, `
                )})`
              )
          : [];

      return { ratings, authors, posts };
    }),

  // Get current user's rating for a post
  getUserRating: publicProcedure
    .input(z.object({ postId: z.string() }))
    .handler(async ({ context: { db, session }, input }) => {
      if (!session?.user) {
        return null;
      }

      const result = await db
        .select({
          postId: postRating.postId,
          userId: postRating.userId,
          rating: postRating.rating,
          review: postRating.review,
          createdAt: postRating.createdAt,
          updatedAt: postRating.updatedAt,
        })
        .from(postRating)
        .where(
          and(
            eq(postRating.postId, input.postId),
            eq(postRating.userId, session.user.id)
          )
        )
        .limit(1);

      return result[0] ?? null;
    }),

  // Get rating stats for a post (average and count)
  getStats: publicProcedure
    .input(z.object({ postId: z.string() }))
    .handler(async ({ context: { db }, input }) => {
      const result = await db
        .select({
          averageRating: sql<number>`COALESCE(AVG(${postRating.rating})::float, 0)`,
          ratingCount: sql<number>`COUNT(*)::integer`,
        })
        .from(postRating)
        .where(eq(postRating.postId, input.postId));

      return {
        averageRating: result[0]?.averageRating ?? 0,
        ratingCount: result[0]?.ratingCount ?? 0,
      };
    }),
};
