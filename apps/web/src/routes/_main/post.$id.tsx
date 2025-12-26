import { eq, useLiveQuery } from "@tanstack/react-db";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { CommentSection } from "@/components/posts/comment-section";
import { postCollection } from "@/db/collections";
import { Post } from "../../components/posts/post";

export const Route = createFileRoute("/_main/post/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();
  const {
    data: [post],
    isLoading,
  } = useLiveQuery(
    (q) =>
      q
        .from({ post: postCollection })
        .where(({ post: p }) => eq(p.id, params.id)),
    [params.id]
  );

  if (isLoading) {
    return <div>Cargando...</div>;
  }

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
