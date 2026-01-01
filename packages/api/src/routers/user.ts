import { getLogger } from "@orpc/experimental-pino";
import { and, eq, sql } from "@repo/db";
import { postBookmark, user } from "@repo/db/schema/app";
import * as z from "zod";
import {
  fixedWindowRatelimitMiddleware,
  permissionProcedure,
  protectedProcedure,
  publicProcedure,
} from "../index";

const RECENT_USERS_CACHE_TTL_SECONDS = 60 * 5; // 5 minutes

const recentUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  image: z.string().nullable(),
  role: z.string(),
});

const recentUsersListSchema = z.array(recentUserSchema);

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
      context: { cache, db, session, ...ctx },
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

      const cachedList = await cache.get("recent-users");

      const currentUser = session?.user;

      if (currentUser) {
        // If the user is authenticated, update their lastSeenAt
        logger?.debug(`Updating lastSeenAt for user ${currentUser.id}`);
        await db
          .update(user)
          .set({ lastSeenAt: new Date() })
          .where(eq(user.id, currentUser.id));
      }

      if (cachedList) {
        const result = recentUsersListSchema.safeParse(cachedList);

        if (result.success) {
          const list = result.data;

          if (currentUser && !list.find((u) => u.id === currentUser.id)) {
            // If the user is not in the cached list, add them
            list.push({
              id: currentUser.id,
              name: currentUser.name,
              role: currentUser.role ?? "user",
              image: currentUser.image ?? null,
            });
          }

          logger?.debug(
            `Returning cached recent users list with ${list.length} users`
          );
          return list;
        }

        logger?.error("Invalid cached list format, will fetch from database");
      }

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

      await cache.setEx(
        "recent-users",
        RECENT_USERS_CACHE_TTL_SECONDS,
        JSON.stringify(users)
      );

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
