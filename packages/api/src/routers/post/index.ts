import { and, asc, desc, eq, sql } from "@repo/db";
import {
  comment,
  post,
  postBookmark,
  postLikes,
  postRating,
  term,
  termPostRelation,
  user,
} from "@repo/db/schema/app";
import type { TAXONOMIES } from "@repo/shared/constants";
import z from "zod";
import {
  fixedWindowRatelimitMiddleware,
  protectedProcedure,
  publicProcedure,
} from "../../index";
import admin from "./admin";

export default {
  getAll: publicProcedure.handler(
    async ({ context: { db, session, cache } }) => {
      const cached = await cache.get("all-posts");

      if (cached) {
        return JSON.parse(cached) as typeof posts;
      }

      const likesAgg = db
        .select({
          postId: postLikes.postId,
          count: sql<number>`COUNT(*)`.as("likes_count"),
        })
        .from(postLikes)
        .groupBy(postLikes.postId)
        .as("likes_agg");

      const favoritesAgg = db
        .select({
          postId: postBookmark.postId,
          count: sql<number>`COUNT(*)`.as("favorites_count"),
        })
        .from(postBookmark)
        .groupBy(postBookmark.postId)
        .as("favorites_agg");

      const termsAgg = db
        .select({
          postId: termPostRelation.postId,
          terms: sql`
      json_agg(
        json_build_object(
          'id', ${term.id},
          'name', ${term.name},
          'taxonomy', ${term.taxonomy},
          'color', ${term.color}
        )
      )
    `.as("terms"),
        })
        .from(termPostRelation)
        .innerJoin(term, eq(term.id, termPostRelation.termId))
        .groupBy(termPostRelation.postId)
        .as("terms_agg");

      const ratingsAgg = db
        .select({
          postId: postRating.postId,
          averageRating:
            sql<number>`COALESCE(AVG(${postRating.rating})::numeric(10,1), 0)`.as(
              "average_rating"
            ),
          ratingCount: sql<number>`COUNT(*)::integer`.as("rating_count"),
        })
        .from(postRating)
        .groupBy(postRating.postId)
        .as("ratings_agg");

      const posts = await db
        .select({
          id: post.id,
          title: post.title,
          type: post.type,
          version: post.version,
          content: post.content,
          isWeekly: post.isWeekly,
          imageObjectKeys: post.imageObjectKeys,
          adsLinks: post.adsLinks,
          authorContent: post.authorContent,

          favorites: sql<number>`COALESCE(${favoritesAgg.count}, 0)`,
          likes: sql<number>`COALESCE(${likesAgg.count}, 0)`,

          terms: sql<string>`COALESCE(${termsAgg.terms}, '[]'::json)`,

          averageRating: sql<number>`COALESCE(${ratingsAgg.averageRating}, 0)`,
          ratingCount: sql<number>`COALESCE(${ratingsAgg.ratingCount}, 0)`,

          createdAt: post.createdAt,
        })
        .from(post)
        .leftJoin(favoritesAgg, eq(favoritesAgg.postId, post.id))
        .leftJoin(likesAgg, eq(likesAgg.postId, post.id))
        .leftJoin(termsAgg, eq(termsAgg.postId, post.id))
        .leftJoin(ratingsAgg, eq(ratingsAgg.postId, post.id))
        .where(eq(post.status, "publish"));

      const u = session?.user;
      if (u) {
        await db
          .update(user)
          .set({ lastSeenAt: new Date() })
          .where(eq(user.id, u.id));
      }

      await cache.setEx("all-posts", 5 * 60, JSON.stringify(posts));

      return posts;
    }
  ),

  getRecent: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(24).default(12) }))
    .handler(async ({ context: { db }, input }) => {
      const likesAgg = db
        .select({
          postId: postLikes.postId,
          count: sql<number>`COUNT(*)`.as("likes_count"),
        })
        .from(postLikes)
        .groupBy(postLikes.postId)
        .as("likes_agg");

      const favoritesAgg = db
        .select({
          postId: postBookmark.postId,
          count: sql<number>`COUNT(*)`.as("favorites_count"),
        })
        .from(postBookmark)
        .groupBy(postBookmark.postId)
        .as("favorites_agg");

      const termsAgg = db
        .select({
          postId: termPostRelation.postId,
          terms: sql`
            json_agg(
              json_build_object(
                'id', ${term.id},
                'name', ${term.name},
                'taxonomy', ${term.taxonomy},
                'color', ${term.color}
              )
            )
          `.as("terms"),
        })
        .from(termPostRelation)
        .innerJoin(term, eq(term.id, termPostRelation.termId))
        .groupBy(termPostRelation.postId)
        .as("terms_agg");

      const ratingsAgg = db
        .select({
          postId: postRating.postId,
          averageRating:
            sql<number>`COALESCE(AVG(${postRating.rating})::float, 0)`.as(
              "average_rating"
            ),
          ratingCount: sql<number>`COUNT(*)::integer`.as("rating_count"),
        })
        .from(postRating)
        .groupBy(postRating.postId)
        .as("ratings_agg");

      const posts = await db
        .select({
          id: post.id,
          title: post.title,
          type: post.type,
          version: post.version,
          content: post.content,
          isWeekly: post.isWeekly,
          imageObjectKeys: post.imageObjectKeys,
          adsLinks: post.adsLinks,
          authorContent: post.authorContent,

          favorites: sql<number>`COALESCE(${favoritesAgg.count}, 0)`,
          likes: sql<number>`COALESCE(${likesAgg.count}, 0)`,

          terms: sql<
            {
              id: string;
              name: string;
              taxonomy: (typeof TAXONOMIES)[number];
              color: string;
            }[]
          >`COALESCE(${termsAgg.terms}, '[]'::json)`,

          averageRating: sql<number>`COALESCE(${ratingsAgg.averageRating}, 0)`,
          ratingCount: sql<number>`COALESCE(${ratingsAgg.ratingCount}, 0)`,

          createdAt: post.createdAt,
        })
        .from(post)
        .leftJoin(favoritesAgg, eq(favoritesAgg.postId, post.id))
        .leftJoin(likesAgg, eq(likesAgg.postId, post.id))
        .leftJoin(termsAgg, eq(termsAgg.postId, post.id))
        .leftJoin(ratingsAgg, eq(ratingsAgg.postId, post.id))
        .where(eq(post.status, "publish"))
        .orderBy(desc(post.createdAt))
        .limit(input.limit);

      return posts;
    }),

  getWeekly: publicProcedure.handler(async ({ context: { db } }) => {
    const likesAgg = db
      .select({
        postId: postLikes.postId,
        count: sql<number>`COUNT(*)`.as("likes_count"),
      })
      .from(postLikes)
      .groupBy(postLikes.postId)
      .as("likes_agg");

    const favoritesAgg = db
      .select({
        postId: postBookmark.postId,
        count: sql<number>`COUNT(*)`.as("favorites_count"),
      })
      .from(postBookmark)
      .groupBy(postBookmark.postId)
      .as("favorites_agg");

    const termsAgg = db
      .select({
        postId: termPostRelation.postId,
        terms: sql`
          json_agg(
            json_build_object(
              'id', ${term.id},
              'name', ${term.name},
              'taxonomy', ${term.taxonomy},
              'color', ${term.color}
            )
          )
        `.as("terms"),
      })
      .from(termPostRelation)
      .innerJoin(term, eq(term.id, termPostRelation.termId))
      .groupBy(termPostRelation.postId)
      .as("terms_agg");

    const ratingsAgg = db
      .select({
        postId: postRating.postId,
        averageRating:
          sql<number>`COALESCE(AVG(${postRating.rating})::float, 0)`.as(
            "average_rating"
          ),
        ratingCount: sql<number>`COUNT(*)::integer`.as("rating_count"),
      })
      .from(postRating)
      .groupBy(postRating.postId)
      .as("ratings_agg");

    const posts = await db
      .select({
        id: post.id,
        title: post.title,
        type: post.type,
        version: post.version,
        content: post.content,
        isWeekly: post.isWeekly,
        imageObjectKeys: post.imageObjectKeys,
        adsLinks: post.adsLinks,
        authorContent: post.authorContent,

        favorites: sql<number>`COALESCE(${favoritesAgg.count}, 0)`,
        likes: sql<number>`COALESCE(${likesAgg.count}, 0)`,

        terms: sql<
          {
            id: string;
            name: string;
            taxonomy: (typeof TAXONOMIES)[number];
            color: string;
          }[]
        >`COALESCE(${termsAgg.terms}, '[]'::json)`,

        averageRating: sql<number>`COALESCE(${ratingsAgg.averageRating}, 0)`,
        ratingCount: sql<number>`COALESCE(${ratingsAgg.ratingCount}, 0)`,

        createdAt: post.createdAt,
      })
      .from(post)
      .leftJoin(favoritesAgg, eq(favoritesAgg.postId, post.id))
      .leftJoin(likesAgg, eq(likesAgg.postId, post.id))
      .leftJoin(termsAgg, eq(termsAgg.postId, post.id))
      .leftJoin(ratingsAgg, eq(ratingsAgg.postId, post.id))
      .where(and(eq(post.status, "publish"), eq(post.isWeekly, true)))
      .orderBy(asc(post.title));

    return posts;
  }),

  search: publicProcedure
    .input(
      z.object({
        type: z.enum(["post", "comic"]),
        query: z.string().optional(),
        termIds: z.array(z.string()).optional(),
      })
    )
    .handler(async ({ context: { db }, input }) => {
      const likesAgg = db
        .select({
          postId: postLikes.postId,
          count: sql<number>`COUNT(*)`.as("likes_count"),
        })
        .from(postLikes)
        .groupBy(postLikes.postId)
        .as("likes_agg");

      const favoritesAgg = db
        .select({
          postId: postBookmark.postId,
          count: sql<number>`COUNT(*)`.as("favorites_count"),
        })
        .from(postBookmark)
        .groupBy(postBookmark.postId)
        .as("favorites_agg");

      const termsAgg = db
        .select({
          postId: termPostRelation.postId,
          terms: sql`
            json_agg(
              json_build_object(
                'id', ${term.id},
                'name', ${term.name},
                'taxonomy', ${term.taxonomy},
                'color', ${term.color}
              )
            )
          `.as("terms"),
        })
        .from(termPostRelation)
        .innerJoin(term, eq(term.id, termPostRelation.termId))
        .groupBy(termPostRelation.postId)
        .as("terms_agg");

      const ratingsAgg = db
        .select({
          postId: postRating.postId,
          averageRating:
            sql<number>`COALESCE(AVG(${postRating.rating})::float, 0)`.as(
              "average_rating"
            ),
          ratingCount: sql<number>`COUNT(*)::integer`.as("rating_count"),
        })
        .from(postRating)
        .groupBy(postRating.postId)
        .as("ratings_agg");

      // Build conditions array
      const conditions = [
        eq(post.status, "publish"),
        eq(post.type, input.type),
      ];

      // Add fuzzy search filter using pg_trgm
      if (input.query && input.query.trim() !== "") {
        conditions.push(sql`${post.title} % ${input.query.trim()}`);
      }

      // Add term filter - posts must have ALL specified terms
      if (input.termIds && input.termIds.length > 0) {
        const termMatchSubquery = db
          .select({ postId: termPostRelation.postId })
          .from(termPostRelation)
          .where(
            sql`${termPostRelation.termId} IN (${sql.join(
              input.termIds.map((id) => sql`${id}`),
              sql`, `
            )})`
          )
          .groupBy(termPostRelation.postId)
          .having(
            sql`COUNT(DISTINCT ${termPostRelation.termId}) = ${input.termIds.length}`
          );

        conditions.push(sql`${post.id} IN (${termMatchSubquery})`);
      }

      // Build the base query
      const baseQuery = db
        .select({
          id: post.id,
          title: post.title,
          type: post.type,
          version: post.version,
          content: post.content,
          isWeekly: post.isWeekly,
          imageObjectKeys: post.imageObjectKeys,
          adsLinks: post.adsLinks,
          authorContent: post.authorContent,

          favorites: sql<number>`COALESCE(${favoritesAgg.count}, 0)`,
          likes: sql<number>`COALESCE(${likesAgg.count}, 0)`,

          terms: sql<
            {
              id: string;
              name: string;
              taxonomy: (typeof TAXONOMIES)[number];
              color: string;
            }[]
          >`COALESCE(${termsAgg.terms}, '[]'::json)`,

          averageRating: sql<number>`COALESCE(${ratingsAgg.averageRating}, 0)`,
          ratingCount: sql<number>`COALESCE(${ratingsAgg.ratingCount}, 0)`,

          createdAt: post.createdAt,
          similarity: sql<number>`similarity(${post.title}, ${input.query?.trim() || ""})`,
        })
        .from(post)
        .leftJoin(favoritesAgg, eq(favoritesAgg.postId, post.id))
        .leftJoin(likesAgg, eq(likesAgg.postId, post.id))
        .leftJoin(termsAgg, eq(termsAgg.postId, post.id))
        .leftJoin(ratingsAgg, eq(ratingsAgg.postId, post.id))
        .where(and(...conditions));

      // Order by similarity score if there's a query, otherwise by creation date
      const posts = await baseQuery.orderBy(
        input.query && input.query.trim() !== ""
          ? sql`similarity DESC, ${post.createdAt} DESC`
          : sql`${post.createdAt} DESC`
      );

      // Remove similarity field from the final result
      return posts.map(({ similarity, ...postData }) => postData);
    }),

  getPostById: publicProcedure
    .use(fixedWindowRatelimitMiddleware({ limit: 20, windowSeconds: 60 }))
    .input(z.string())
    .handler(async ({ context: { db }, input, errors }) => {
      const result = await db
        .select({
          id: post.id,
          title: post.title,
          type: post.type,
          version: post.version,
          content: post.content,
          isWeekly: post.isWeekly,
          imageObjectKeys: post.imageObjectKeys,
          adsLinks: post.adsLinks,
          authorContent: post.authorContent,
          createdAt: post.createdAt,

          favorites: sql<number>`
      (
        SELECT COUNT(*)
        FROM ${postBookmark}
        WHERE ${postBookmark.postId} = ${post.id}
      )
    `,

          likes: sql<number>`
      (
        SELECT COUNT(*)
        FROM ${postLikes}
        WHERE ${postLikes.postId} = ${post.id}
      )
    `,

          terms: sql<
            {
              id: string;
              name: string;
              taxonomy: (typeof TAXONOMIES)[number];
              color: string;
            }[]
          >`
      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'id', ${term.id},
              'name', ${term.name},
              'taxonomy', ${term.taxonomy},
              'color', ${term.color}
            )
          )
          FROM ${termPostRelation}
          JOIN ${term}
            ON ${term.id} = ${termPostRelation.termId}
          WHERE ${termPostRelation.postId} = ${post.id}
        ),
        '[]'::json
      )
    `,

          averageRating: sql<number>`
      COALESCE(
        (
          SELECT AVG(${postRating.rating})::float
          FROM ${postRating}
          WHERE ${postRating.postId} = ${post.id}
        ),
        0
      )
    `,

          ratingCount: sql<number>`
      (
        SELECT COUNT(*)::integer
        FROM ${postRating}
        WHERE ${postRating.postId} = ${post.id}
      )
    `,
        })
        .from(post)
        .where(and(eq(post.status, "publish"), eq(post.id, input)))
        .limit(1);

      if (!result.length) {
        throw errors.NOT_FOUND();
      }

      return result[0];
    }),

  getLikes: publicProcedure
    .input(z.string())
    .handler(async ({ context: { db }, input }) => {
      const { count } = await db
        .select({
          count: sql<number>`COUNT(*)`,
        })
        .from(postLikes)
        .where(eq(postLikes.postId, input))
        .then((r) => r[0] ?? { count: 0 });

      return count;
    }),

  likePost: protectedProcedure
    .input(z.string())
    .handler(async ({ context: { db, session }, input }) => {
      const existing = await db
        .select()
        .from(postLikes)
        .where(
          and(
            eq(postLikes.postId, input),
            eq(postLikes.userId, session.user.id)
          )
        )
        .limit(1);

      if (existing) {
        // already liked
        return;
      }

      await db.insert(postLikes).values({
        postId: input,
        userId: session.user.id,
      });
    }),

  unlikePost: protectedProcedure
    .input(z.string())
    .handler(async ({ context: { db, session }, input }) => {
      await db
        .delete(postLikes)
        .where(
          and(
            eq(postLikes.postId, input),
            eq(postLikes.userId, session.user.id)
          )
        );
    }),

  toggleLike: protectedProcedure
    .input(
      z.object({
        postId: z.string(),
        liked: z.boolean(),
      })
    )
    .handler(async ({ context: { db, session }, input }) => {
      if (input.liked) {
        await db
          .insert(postLikes)
          .values({
            postId: input.postId,
            userId: session.user.id,
          })
          .onConflictDoNothing();
      } else {
        await db
          .delete(postLikes)
          .where(
            and(
              eq(postLikes.postId, input.postId),
              eq(postLikes.userId, session.user.id)
            )
          );
      }
    }),

  createComment: protectedProcedure
    .input(
      z.object({
        postId: z.string(),
        content: z.string().min(10).max(2048),
      })
    )
    .handler(async ({ context: { db, session }, input }) => {
      await db.insert(comment).values({
        postId: input.postId,
        authorId: session.user.id,
        content: input.content,
      });
    }),

  getComments: publicProcedure
    .input(z.object({ postId: z.string() }))
    .handler(async ({ context: { db }, input }) => {
      const comments = await db.query.comment.findMany({
        orderBy: (c, { desc: descSql }) => [descSql(c.createdAt)],
        where: (c, { eq: equals }) => equals(c.postId, input.postId),
      });

      const authorIds = [
        ...new Set(
          comments
            .map((c) => c.authorId)
            .filter((id): id is string => id !== null)
        ),
      ];

      const authors = await db.query.user.findMany({
        where: (u, { inArray }) => inArray(u.id, authorIds),
        columns: {
          id: true,
          name: true,
          role: true,
          image: true,
        },
      });

      // getComments is a good heuristic that the user is actually scrolling though the post
      // so we take the opportunity to increment the view count here while not blocking the response
      await db
        .update(post)
        .set({ views: sql`${post.views} + 1` })
        .where(eq(post.id, input.postId));

      return { comments, authors };
    }),

  admin,
};
