import { and, db, eq, sql } from "@repo/db";
import { postBookmark, user } from "@repo/db/schema/app";
import * as z from "zod";
import {
  permissionProcedure,
  protectedProcedure,
  publicProcedure,
} from "../index";

const RECENT_USERS_CACHE_TTL_SECONDS = 60 * 5; // 5 minutes

export default {
  getBookmarks: protectedProcedure.handler(({ context }) =>
    db.query.postBookmark.findMany({
      where: (b, { eq: equals }) => equals(b.userId, context.session.user.id),
      columns: {
        postId: true,
      },
    })
  ),

  toggleBookmark: protectedProcedure
    .input(z.object({ bookmarked: z.boolean(), postId: z.string() }))
    .handler(async ({ context, input }) => {
      if (input.bookmarked) {
        await db
          .insert(postBookmark)
          .values({
            postId: input.postId,
            userId: context.session.user.id,
          })
          .onConflictDoNothing();
      } else {
        await db
          .delete(postBookmark)
          .where(
            and(
              eq(postBookmark.postId, input.postId),
              eq(postBookmark.userId, context.session.user.id)
            )
          );
      }
    }),

  getLikes: protectedProcedure.handler(({ context }) =>
    db.query.postLikes.findMany({
      where: (b, { eq: equals }) => equals(b.userId, context.session.user.id),
      columns: {
        postId: true,
      },
    })
  ),

  toggleLike: protectedProcedure
    .input(z.object({ liked: z.boolean(), postId: z.string() }))
    .handler(async ({ context, input }) => {
      if (input.liked) {
        await db
          .insert(postBookmark)
          .values({
            postId: input.postId,
            userId: context.session.user.id,
          })
          .onConflictDoNothing();
      } else {
        await db
          .delete(postBookmark)
          .where(
            and(
              eq(postBookmark.postId, input.postId),
              eq(postBookmark.userId, context.session.user.id)
            )
          );
      }
    }),

  // Cache recent users in KV to avoid hitting the database too often
  // This is a best-effort cache, so we don't need to be super strict about it
  // We just want to avoid hitting the database too often
  // The list is not guaranteed to be perfectly up-to-date
  // We use a cutoff window to avoid caching users that are no longer active
  // This means that if a user was active more than RECENT_USERS_CACHE_TTL_SECONDS * 2 ago, they won't be included in the list
  // But that's okay, because they are not "recent" anymore
  // We double the cutoff window to account for the fact that the cache might be stale
  // So we want to make sure we don't miss any users that are still considered "recent"
  // This is a trade-off between freshness and performance
  // In practice, this means that if a user was active within the last 10 minutes, they will be included in the list
  // Even if the cache is up to 5 minutes stale
  // This should be good enough for our use case

  getRecentUsers: publicProcedure.handler(
    async ({
      context,
    }): Promise<
      {
        id: string;
        name: string;
        image: string | null;
        role: string;
      }[]
    > => {
      // const list = await env.KV_STORE.get<typeof users>("recent-users", "json");

      const currentUser = context.session?.user;

      if (currentUser) {
        // If the user is authenticated, update their lastSeenAt
        await db
          .update(user)
          .set({ lastSeenAt: new Date() })
          .where(eq(user.id, currentUser.id));
      }

      // if (list) {
      //   if (currentUser && !list.find((u) => u.id === currentUser.id)) {
      //     // If the user is not in the cached list, add them
      //     list.push({
      //       id: currentUser.id,
      //       name: currentUser.name,
      //       role: currentUser.role ?? "user",
      //       image: currentUser.image ?? null,
      //     });
      //   }
      //   return list;
      // }

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

      // waitUntil(
      //   env.KV_STORE.put("recent-users", JSON.stringify(users), {
      //     expirationTtl: RECENT_USERS_CACHE_TTL_SECONDS,
      //   })
      // );

      return users;
    }
  ),

  getUser: publicProcedure
    .input(z.object({ id: z.string() }))
    .handler(({ input }) =>
      db.query.user.findFirst({
        where: (u, { eq: equals }) => equals(u.id, input.id),
        columns: {
          id: true,
          name: true,
          role: true,
          image: true,
          createdAt: true,
        },
      })
    ),

  isUsernameAvailable: publicProcedure
    .input(z.string())
    .handler(async ({ input }) => {
      const found = await db.query.user.findFirst({
        where: (u, { eq: equals }) => equals(u.name, input),
        columns: {},
      });
      return !found;
    }),

  getDashboardList: permissionProcedure({
    user: ["list"],
  }).handler(() =>
    db.query.user.findMany({
      columns: {
        id: true,
        name: true,
        role: true,
      },
    })
  ),

  getDashboard: permissionProcedure({
    user: ["list"],
  }).handler(async () => {
    const registeredLastWeekPromise = db
      .select({
        time: sql<string>`strftime('%Y-%m-%d %H:00:00', ${user.createdAt}, 'unixepoch')`,
        count: sql<number>`count(*)`,
      })
      .from(user)
      .where(sql`${user.createdAt} >= strftime('%s', 'now', '-7 days')`)
      .groupBy(sql`strftime('%Y-%m-%d %H', ${user.createdAt}, 'unixepoch')`)
      .orderBy(sql`strftime('%Y-%m-%d %H', ${user.createdAt}, 'unixepoch')`);

    const registeredAllTimePromise = db
      .select({
        time: sql<string>`date(${user.createdAt}, 'unixepoch')`,
        count: sql<number>`count(*)`,
      })
      .from(user)
      .groupBy(sql`date(${user.createdAt}, 'unixepoch')`)
      .orderBy(sql`date(${user.createdAt}, 'unixepoch')`);

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

    return {
      registeredLastWeek,
      registeredAllTime,
      userCount: userCount[0]?.count,
    };
  }),
};
