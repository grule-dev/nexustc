import { and, db, eq, sql } from "@repo/db";
import {
  comment,
  post,
  postBookmark,
  postLikes,
  term,
  termPostRelation,
  user,
} from "@repo/db/schema/app";
import z from "zod";
import { protectedProcedure, publicProcedure } from "../../index";
import admin from "./admin";

export default {
  getAll: publicProcedure.handler(async ({ context }) => {
    // const kv = await env.KV_STORE.get("all-posts");

    // if (kv) {
    //   return JSON.parse(kv) as typeof posts;
    // }

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
        favorites:
          sql<number>`(SELECT COUNT(*) FROM ${postBookmark} WHERE ${postBookmark.postId} = ${post.id})`.as(
            "favorites"
          ),
        likes:
          sql<number>`(SELECT COUNT(*) FROM ${postLikes} WHERE ${postLikes.postId} = ${post.id})`.as(
            "likes"
          ),
        terms:
          sql<string>`json_group_array(json_object('id', ${term.id},'name', ${term.name},'taxonomy', ${term.taxonomy},'color', ${term.color}))`.as(
            "terms"
          ),
        createdAt: post.createdAt,
      })
      .from(post)
      .leftJoin(termPostRelation, eq(post.id, termPostRelation.postId))
      .leftJoin(term, eq(term.id, termPostRelation.termId))
      .where(eq(post.status, "publish"))
      .groupBy(post.id);

    const u = context.session?.user;
    if (u) {
      await db
        .update(user)
        .set({ lastSeenAt: new Date() })
        .where(eq(user.id, u.id));
    }

    // waitUntil(
    //   env.KV_STORE.put("all-posts", JSON.stringify(posts), {
    //     expirationTtl: 60 * 60, // 1 hour
    //   })
    // );

    return posts;
  }),

  getLikes: publicProcedure.input(z.string()).handler(async ({ input }) => {
    const likes = await db
      .select()
      .from(postLikes)
      .where(eq(postLikes.postId, input));
    return likes.length;
  }),

  likePost: protectedProcedure
    .input(z.string())
    .handler(async ({ context, input }) => {
      const existing = await db
        .select()
        .from(postLikes)
        .where(
          and(
            eq(postLikes.postId, input),
            eq(postLikes.userId, context.session.user.id)
          )
        )
        .limit(1);

      if (existing) {
        // already liked
        return;
      }

      await db.insert(postLikes).values({
        postId: input,
        userId: context.session.user.id,
      });
    }),

  unlikePost: protectedProcedure
    .input(z.string())
    .handler(async ({ context, input }) => {
      await db
        .delete(postLikes)
        .where(
          and(
            eq(postLikes.postId, input),
            eq(postLikes.userId, context.session.user.id)
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
    .handler(async ({ context, input }) => {
      if (input.liked) {
        await db
          .insert(postLikes)
          .values({
            postId: input.postId,
            userId: context.session.user.id,
          })
          .onConflictDoNothing();
      } else {
        await db
          .delete(postLikes)
          .where(
            and(
              eq(postLikes.postId, input.postId),
              eq(postLikes.userId, context.session.user.id)
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
    .handler(async ({ context, input }) => {
      await db.insert(comment).values({
        postId: input.postId,
        authorId: context.session.user.id,
        content: input.content,
      });
    }),

  getComments: publicProcedure
    .input(z.object({ postId: z.string() }))
    .handler(async ({ input }) => {
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
