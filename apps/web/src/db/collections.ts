import { TAXONOMIES } from "@repo/shared/constants";
import { createCollection } from "@tanstack/db";
import { QueryCache, QueryClient } from "@tanstack/query-core";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import z from "zod";
import { getBucketUrl } from "@/lib/utils";
import { orpcClient } from "@/utils/orpc";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
  queryCache: new QueryCache({
    onSuccess(data, query) {
      queryClient.setQueryData(query.queryKey, data);
    },
  }),
});

export const postCollection = createCollection(
  queryCollectionOptions({
    queryKey: ["app"],
    queryFn: async () => {
      const posts = await orpcClient.post.getAll();
      const mappedPosts = posts.map((row) => ({
        ...row,
        imageObjectKeys: row.imageObjectKeys?.map(getBucketUrl) ?? null,
        terms: JSON.parse(row.terms as string) as {
          id: string;
          name: string;
          taxonomy: (typeof TAXONOMIES)[number];
          color: string | null;
        }[],
      }));

      return mappedPosts;
    },
    queryClient,
    getKey: (item) => item.id,
    schema: z.object({
      id: z.string(),
      title: z.string(),
      type: z.enum(["post", "comic"]),
      version: z.string().nullable(),
      content: z.string(),
      authorContent: z.string(),
      isWeekly: z.boolean(),
      imageObjectKeys: z.array(z.string()).nullable(),
      adsLinks: z.string().nullable(),
      likes: z.number(),
      favorites: z.number(),
      terms: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          taxonomy: z.string(),
          color: z.string().nullable(),
        })
      ),
      createdAt: z.date(),
    }),
  })
);

export const termCollection = createCollection(
  queryCollectionOptions({
    queryKey: ["terms"],
    queryFn: () => orpcClient.term.getAll(),
    queryClient,
    getKey: (item) => item.id,
    schema: z.object({
      id: z.string(),
      name: z.string(),
      taxonomy: z.enum(TAXONOMIES),
      color: z.string().nullable(),
    }),
  })
);

export const bookmarksCollection = createCollection(
  queryCollectionOptions({
    queryKey: ["bookmarks"],
    queryFn: () => orpcClient.user.getBookmarks(),
    queryClient,
    getKey: (item) => item.postId,
    schema: z.object({
      postId: z.string(),
    }),

    onInsert: async ({ transaction, collection }) => {
      const bookmark = transaction.mutations[0].modified;
      await orpcClient.user.toggleBookmark({
        bookmarked: true,
        postId: bookmark.postId,
      });
      collection.utils.writeUpsert(bookmark);
      return { refetch: false };
    },

    onDelete: async ({ transaction, collection }) => {
      const bookmark = transaction.mutations[0].modified;
      await orpcClient.user.toggleBookmark({
        bookmarked: false,
        postId: bookmark.postId,
      });

      collection.utils.writeBatch(() => {
        collection.utils.writeDelete(bookmark.postId, {
          skipValidation: true,
        });
      });

      return { refetch: false };
    },
  })
);
