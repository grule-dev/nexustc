import { StarIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { PATRON_TIERS } from "@repo/shared/constants";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { formatDistance } from "date-fns";
import { es } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "facehash";
import { Suspense } from "react";
import { PostCard } from "@/components/landing/post-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserLabel } from "@/components/users/user-label";
import { orpc, orpcClient } from "@/lib/orpc";
import { defaultFacehashProps, getBucketUrl } from "@/lib/utils";

export const Route = createFileRoute("/_main/user/$id")({
  component: RouteComponent,
  loader: async ({ params }) => {
    const user = await orpcClient.user.getUser({ id: params.id });

    if (!user) {
      throw notFound();
    }

    return { user };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `NeXusTC - Usuario${loaderData ? `: ${loaderData.user.name}` : ""}`,
      },
    ],
  }),
});

function RouteComponent() {
  const { user } = Route.useLoaderData();
  const patronTierConfig =
    user.patronTier && user.isActivePatron
      ? PATRON_TIERS[user.patronTier]
      : null;

  return (
    <div className="mx-auto w-full max-w-4xl px-2 py-4 md:px-4 md:py-8">
      <div className="flex flex-col gap-6">
        <Card>
          <CardContent className="flex flex-row flex-wrap items-center gap-6 p-6">
            <Avatar className="size-28 rounded-full">
              <AvatarImage
                src={user.image ? getBucketUrl(user.image) : undefined}
              />
              <AvatarFallback
                className="rounded-full"
                facehashProps={defaultFacehashProps}
                name={user.name}
              />
            </Avatar>
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex flex-row flex-wrap items-center gap-3">
                <UserLabel className="text-2xl" user={user} />
                {patronTierConfig?.badge && (
                  <Badge variant="secondary">{patronTierConfig.badge}</Badge>
                )}
              </div>
              <p className="text-muted-foreground text-sm">
                Registrado{" "}
                {formatDistance(user.createdAt, new Date(), {
                  addSuffix: true,
                  locale: es,
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="bookmarks">
          <TabsList className="w-full">
            <TabsTrigger value="bookmarks">Favoritos</TabsTrigger>
            <TabsTrigger value="reviews">Reseñas</TabsTrigger>
          </TabsList>
          <TabsContent value="bookmarks">
            <Suspense fallback={<Spinner />}>
              <UserBookmarksSection userId={user.id} />
            </Suspense>
          </TabsContent>
          <TabsContent value="reviews">
            <Suspense fallback={<Spinner />}>
              <UserReviewsSection userId={user.id} />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function UserBookmarksSection({ userId }: { userId: string }) {
  const { data: bookmarks } = useSuspenseQuery(
    orpc.user.getUserBookmarks.queryOptions({ input: { userId } })
  );

  if (bookmarks.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        No tiene favoritos aún.
      </p>
    );
  }

  const posts = bookmarks.filter((b) => b.type === "post");
  const comics = bookmarks.filter((b) => b.type === "comic");

  return (
    <Tabs className="px-6">
      <TabsList className="w-full">
        <TabsTrigger value="posts">Posts</TabsTrigger>
        <TabsTrigger value="comics">Comics</TabsTrigger>
      </TabsList>
      <TabsContent value="posts">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </TabsContent>
      <TabsContent value="comics">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {comics.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}

function UserReviewsSection({ userId }: { userId: string }) {
  const { data } = useSuspenseQuery(
    orpc.rating.getByUserId.queryOptions({ input: { userId } })
  );

  const postMap = new Map(data.posts.map((p) => [p.id, p]));

  if (data.ratings.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        No tiene reseñas aún.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {data.ratings.map((rating) => {
        const ratingPost = postMap.get(rating.postId);
        if (!ratingPost) {
          return null;
        }

        return (
          <Card className="rounded-2xl" key={rating.postId}>
            <CardContent className="flex flex-col gap-2 p-4">
              <div className="flex flex-row items-center justify-between gap-2">
                <Link
                  className="font-semibold hover:underline"
                  params={{ id: ratingPost.id }}
                  to="/post/$id"
                >
                  {ratingPost.title}
                </Link>
                <div className="inline-flex items-center gap-1 text-sm">
                  <HugeiconsIcon
                    className="size-4 fill-amber-400 text-amber-400"
                    icon={StarIcon}
                  />
                  <span>{rating.rating}/10</span>
                </div>
              </div>
              {rating.review && (
                <p className="text-muted-foreground text-sm">{rating.review}</p>
              )}
              <p className="text-muted-foreground text-xs">
                {formatDistance(rating.createdAt, new Date(), {
                  addSuffix: true,
                  locale: es,
                })}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
