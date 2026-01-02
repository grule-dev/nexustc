import { createFileRoute, notFound } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import z from "zod";
import { ComicPage } from "@/components/posts/comic-page";
import { CommentSection } from "@/components/posts/comment-section";
import { RatingSection } from "@/components/ratings/rating-section";
import { safeOrpcClient } from "@/lib/orpc";
import { GamePage } from "../../components/posts/game-page";

const comicPageSchema = z.object({
  page: z.number().optional(),
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
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="flex flex-col gap-12">
        {/* Main Post Content */}
        {post.type === "post" ? (
          <GamePage post={post} />
        ) : (
          <ComicPage comic={post} />
        )}

        {/* Ratings & Comments Section */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <RatingSection stats={post} />
          <CommentSection postId={post.id} />
        </div>
      </div>
    </main>
  );
}
