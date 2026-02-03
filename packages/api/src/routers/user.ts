import { getLogger } from "@orpc/experimental-pino";
import { and, eq, sql } from "@repo/db";
import {
  post,
  postBookmark,
  postLikes,
  postRating,
  term,
  termPostRelation,
  user,
} from "@repo/db/schema/app";
import type { TAXONOMIES } from "@repo/shared/constants";
import * as z from "zod";
import {
  fixedWindowRatelimitMiddleware,
  permissionProcedure,
  protectedProcedure,
  publicProcedure,
} from "../index";

const RECENT_USERS_CACHE_TTL_SECONDS = 60 * 5; // 5 minutes

// TODO: improve recent user caching implementation
// const recentUserSchema = z.object({
//   id: z.string(),
//   name: z.string(),
//   image: z.string().nullable(),
//   role: z.string(),
// });

// const recentUsersListSchema = z.array(recentUserSchema);

export default {
  getBookmarks: protectedProcedure.handler(
    ({ context: { db, session, ...ctx } }) => {
      const logger = getLogger(ctx);
      logger?.info(`Fetching bookmarks for user: ${session.user.id}`);

      return db.query.postBookmark.findMany({
        where: (b, { eq: equals }) => equals(b.userId, session.user.id),
        columns: {
          postId: true,
        },
      });
    }
  ),

  getBookmarksFull: protectedProcedure.handler(
    async ({ context: { db, session, ...ctx } }) => {
      const logger = getLogger(ctx);
      logger?.info(`Fetching full bookmarks for user: ${session.user.id}`);

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
          views: post.views,

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
        })
        .from(postBookmark)
        .innerJoin(post, eq(post.id, postBookmark.postId))
        .leftJoin(favoritesAgg, eq(favoritesAgg.postId, post.id))
        .leftJoin(likesAgg, eq(likesAgg.postId, post.id))
        .leftJoin(termsAgg, eq(termsAgg.postId, post.id))
        .leftJoin(ratingsAgg, eq(ratingsAgg.postId, post.id))
        .where(
          and(
            eq(post.status, "publish"),
            eq(postBookmark.userId, session.user.id)
          )
        );

      logger?.debug(
        `Fetched ${result.length} posts for user ${session.user.id} bookmarks`
      );

      return result;
    }
  ),

  toggleBookmark: protectedProcedure
    .use(fixedWindowRatelimitMiddleware({ limit: 10, windowSeconds: 60 }))
    .input(z.object({ bookmarked: z.boolean(), postId: z.string() }))
    .handler(async ({ context: { db, session, ...ctx }, input }) => {
      const logger = getLogger(ctx);
      logger?.info(
        `User ${session.user.id} toggling bookmark for post ${input.postId} to ${input.bookmarked}`
      );

      if (input.bookmarked) {
        await db
          .insert(postBookmark)
          .values({
            postId: input.postId,
            userId: session.user.id,
          })
          .onConflictDoNothing();

        logger?.debug(
          `Bookmark added for user ${session.user.id} on post ${input.postId}`
        );
      } else {
        await db
          .delete(postBookmark)
          .where(
            and(
              eq(postBookmark.postId, input.postId),
              eq(postBookmark.userId, session.user.id)
            )
          );
        logger?.debug(
          `Bookmark removed for user ${session.user.id} on post ${input.postId}`
        );
      }
      logger?.info(
        `Bookmark toggle completed for user ${session.user.id} on post ${input.postId}`
      );
    }),

  toggleLike: protectedProcedure
    .use(fixedWindowRatelimitMiddleware({ limit: 10, windowSeconds: 60 }))
    .input(z.object({ liked: z.boolean(), postId: z.string() }))
    .handler(async ({ context: { db, session, ...ctx }, input }) => {
      const logger = getLogger(ctx);
      logger?.info(
        `User ${session.user.id} toggling like for post ${input.postId} to ${input.liked}`
      );

      if (input.liked) {
        await db
          .insert(postLikes)
          .values({
            postId: input.postId,
            userId: session.user.id,
          })
          .onConflictDoNothing();

        logger?.debug(
          `Like added for user ${session.user.id} on post ${input.postId}`
        );
      } else {
        await db
          .delete(postLikes)
          .where(
            and(
              eq(postLikes.postId, input.postId),
              eq(postLikes.userId, session.user.id)
            )
          );
        logger?.debug(
          `Like removed for user ${session.user.id} on post ${input.postId}`
        );
      }
      logger?.info(
        `Like toggle completed for user ${session.user.id} on post ${input.postId}`
      );
    }),

  getLikes: protectedProcedure.handler(
    ({ context: { db, session, ...ctx } }) => {
      const logger = getLogger(ctx);
      logger?.info(`Fetching likes for user: ${session.user.id}`);

      return db.query.postLikes.findMany({
        where: (b, { eq: equals }) => equals(b.userId, session.user.id),
        columns: {
          postId: true,
        },
      });
    }
  ),

  // Cache recent users in KV to avoid hitting the database too often
  // This is a best-effort cache, so we don't need to be super strict about it
  // The list is not guaranteed to be perfectly up-to-date
  // We use a cutoff window to avoid caching users that are no longer active
  // We double the cutoff window to account for the fact that the cache might be stale
  // So we want to make sure we don't miss any users that are still considered "recent"
  // This is a trade-off between freshness and performance
  // In practice, this means that if a user was active within the last 10 minutes, they will be included in the list
  // Even if the cache is up to 5 minutes stale
  // This should be good enough for our use case

  getRecentUsers: publicProcedure.handler(
    async ({
      context: { db, session, ...ctx },
    }): Promise<
      {
        id: string;
        name: string;
        image: string | null;
        role: string;
      }[]
    > => {
      const logger = getLogger(ctx);
      logger?.info("Fetching recent users list");

      // const cachedList = await cache.get("recent-users");

      const currentUser = session?.user;

      if (currentUser) {
        // If the user is authenticated, update their lastSeenAt
        logger?.debug(`Updating lastSeenAt for user ${currentUser.id}`);
        await db
          .update(user)
          .set({ lastSeenAt: new Date() })
          .where(eq(user.id, currentUser.id));
      }

      // if (cachedList) {
      //   const result = recentUsersListSchema.safeParse(cachedList);

      //   if (result.success) {
      //     const list = result.data;

      //     if (currentUser && !list.find((u) => u.id === currentUser.id)) {
      //       // If the user is not in the cached list, add them
      //       list.push({
      //         id: currentUser.id,
      //         name: currentUser.name,
      //         role: currentUser.role ?? "user",
      //         image: currentUser.image ?? null,
      //       });
      //     }

      //     logger?.debug(
      //       `Returning cached recent users list with ${list.length} users`
      //     );
      //     return list;
      //   }

      //   logger?.error("Invalid cached list format, will fetch from database");
      // }

      logger?.debug(
        "Cache miss or invalid, fetching recent users from database"
      );

      const users = await db.query.user.findMany({
        where: (u, { gte }) =>
          gte(
            u.lastSeenAt,
            new Date(Date.now() - 1000 * RECENT_USERS_CACHE_TTL_SECONDS * 2) // double the cutoff window
          ),
        columns: {
          id: true,
          name: true,
          role: true,
          image: true,
        },
      });

      // await cache.setEx(
      //   "recent-users",
      //   RECENT_USERS_CACHE_TTL_SECONDS,
      //   JSON.stringify(users)
      // );

      logger?.debug(`Fetched and cached ${users.length} recent users`);
      return users;
    }
  ),

  getUser: publicProcedure
    .input(z.object({ id: z.string() }))
    .handler(({ context: { db, ...ctx }, input }) => {
      const logger = getLogger(ctx);
      logger?.info(`Fetching user profile: ${input.id}`);

      return db.query.user.findFirst({
        where: (u, { eq: equals }) => equals(u.id, input.id),
        columns: {
          id: true,
          name: true,
          role: true,
          image: true,
          createdAt: true,
        },
      });
    }),

  getDashboardList: permissionProcedure({
    user: ["list"],
  }).handler(({ context: { db, ...ctx } }) => {
    const logger = getLogger(ctx);
    logger?.info("Fetching user dashboard list");

    return db.query.user.findMany({
      columns: {
        id: true,
        name: true,
        role: true,
      },
    });
  }),

  getDashboard: permissionProcedure({
    user: ["list"],
  }).handler(async ({ context: { db, ...ctx } }) => {
    const logger = getLogger(ctx);
    logger?.info("Fetching user dashboard analytics");

    const registeredLastWeekPromise = db
      .select({
        time: sql<string>`t.d`,
        count: sql<number>`count(*)`,
      })
      .from(
        db
          .select({
            hour: sql`date_trunc('hour', ${user.createdAt} AT TIME ZONE 'UTC')`.as(
              "d"
            ),
          })
          .from(user)
          .where(sql`${user.createdAt} >= now() - interval '7 days'`)
          .as("t")
      )
      .groupBy(sql`t.d`)
      .orderBy(sql`t.d`);

    const registeredAllTimePromise = db
      .select({
        time: sql<string>`t.d`,
        count: sql<number>`count(*)`,
      })
      .from(
        db
          .select({
            day: sql`date(${user.createdAt} AT TIME ZONE 'UTC')`.as("d"),
          })
          .from(user)
          .as("t")
      )
      .groupBy(sql`t.d`)
      .orderBy(sql`t.d`);

    const userCountPromise = db
      .select({
        count: sql<number>`count(*)`.as("count"),
      })
      .from(user);

    const [registeredLastWeek, registeredAllTime, userCount] =
      await Promise.all([
        registeredLastWeekPromise,
        registeredAllTimePromise,
        userCountPromise,
      ]);

    const totalUsers = userCount[0]?.count ?? 0;
    logger?.debug(
      `Dashboard: Total users=${totalUsers}, Last week entries=${registeredLastWeek.length}, All time entries=${registeredAllTime.length}`
    );

    return {
      registeredLastWeek,
      registeredAllTime,
      userCount: totalUsers,
    };
  }),
};
