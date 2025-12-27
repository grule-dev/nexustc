import { createFileRoute, notFound } from "@tanstack/react-router";
import { CommentSection } from "@/components/posts/comment-section";
import { orpcClient } from "@/utils/orpc";
import { Post } from "../../components/posts/post";

export const Route = createFileRoute("/_main/post/$id")({
  component: RouteComponent,
  loader: ({ params }) => orpcClient.post.getPostById(params.id),
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `NeXusTC - ${loaderData ? loaderData.title : "Post"}`,
      },
    ],
  }),
});

function RouteComponent() {
  const post = Route.useLoaderData();

  if (!post) {
    throw notFound();
  }

  return (
    <main className="grid w-full grid-cols-1 lg:grid-cols-5">
      <div className="space-y-8 lg:col-span-3 lg:col-start-2">
        <Post post={post} />
        <CommentSection postId={post.id} />
      </div>
    </main>
  );
}
