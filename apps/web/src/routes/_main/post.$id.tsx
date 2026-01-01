import { createFileRoute, notFound } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import z from "zod";
import { ComicPage } from "@/components/posts/comic-page";
import { CommentSection } from "@/components/posts/comment-section";
import { RatingSection } from "@/components/ratings/rating-section";
import { safeOrpcClient } from "@/lib/orpc";
import { GamePage } from "../../components/posts/game-page";

const comicPageSchema = z.object({
  page: z
    .number()
    .optional()
    .transform((val) => val ?? -1),
});

export const Route = createFileRoute("/_main/post/$id")({
  component: RouteComponent,
  staleTime: 1000 * 60 * 5, // 5 minutes
  loader: async ({ params }) => {
    const [error, data, isDefined] = await safeOrpcClient.post.getPostById(
      params.id
    );

    if (isDefined) {
      if (error.code === "NOT_FOUND") {
        throw notFound();
      }

      if (error.code === "RATE_LIMITED") {
        throw new Error("RATE_LIMITED", { cause: error.data.retryAfter });
      }
    }

    if (error) {
      console.error(error);
      throw error;
    }

    return data;
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `NeXusTC - ${loaderData ? loaderData.title : "Post"}`,
      },
    ],
  }),
  validateSearch: zodValidator(comicPageSchema),
});

function RouteComponent() {
  const post = Route.useLoaderData();

  return (
    <main className="grid w-full grid-cols-1 lg:grid-cols-5">
      <div className="space-y-8 lg:col-span-3 lg:col-start-2">
        {post.type === "post" ? (
          <GamePage post={post} />
        ) : (
          <ComicPage comic={post} />
        )}
        <RatingSection stats={post} />
        <CommentSection postId={post.id} />
      </div>
    </main>
  );
}
