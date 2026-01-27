import { Tag01Icon, UserGroupIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { GamesCarousel } from "@/components/landing/games-carousel";
import { PostCard } from "@/components/landing/post-card";
import { TermBadge } from "@/components/term-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { UserLabel } from "@/components/users/user-label";
import { useOverflowDetection } from "@/hooks/use-overflow-detection";
import { useTerms } from "@/hooks/use-terms";
import { orpcClient, safeOrpcClient } from "@/lib/orpc";
import { getBucketUrl } from "@/lib/utils";

const RECENT_POSTS_LIMIT = 12;

export const Route = createFileRoute("/_main/")({
  component: HomeComponent,
  loader: async () => {
    const [recentUsersResult, weeklyGamesResult, featuredPostsResult] =
      await Promise.all([
        safeOrpcClient.user.getRecentUsers(),
        safeOrpcClient.post.getWeekly(),
        safeOrpcClient.post.getFeatured(),
      ]);

    const [recentUsersError, recentUsers, recentUsersDefined] =
      recentUsersResult;
    const [weeklyGamesError, weeklyGames, weeklyGamesDefined] =
      weeklyGamesResult;
    const [featuredPostsError, featuredPosts, featuredPostsDefined] =
      featuredPostsResult;

    return {
      recentUsers: recentUsersDefined
        ? { error: { code: recentUsersError.code }, data: undefined }
        : recentUsers
          ? { error: undefined, data: recentUsers }
          : { error: { code: "UNKNOWN" }, data: undefined },
      weeklyGames: weeklyGamesDefined
        ? { error: { code: weeklyGamesError.code }, data: undefined }
        : weeklyGames
          ? { error: undefined, data: weeklyGames }
          : { error: { code: "UNKNOWN" }, data: undefined },
      featuredPosts: featuredPostsDefined
        ? { error: { code: featuredPostsError.code }, data: undefined }
        : featuredPosts
          ? { error: undefined, data: featuredPosts }
          : { error: { code: "UNKNOWN" }, data: undefined },
    };
  },
  head: () => ({
    meta: [
      {
        title: "NeXusTC - Principal",
      },
    ],
  }),
});

function HomeComponent() {
  const { weeklyGames } = Route.useLoaderData();

  return (
    <main className="grid grid-cols-3 gap-4 md:grid-cols-7">
      <div className="col-span-5 col-start-2">
        <div className="flex flex-col items-center justify-center gap-8 px-4">
          <HeroSection />
          <h1 className="font-extrabold text-2xl">Juegos de la Semana</h1>
          <GamesCarousel games={weeklyGames.data ?? []} />
          <h1 className="font-extrabold text-3xl">Juegos Recientes</h1>
          <RecentPosts />
        </div>
      </div>
    </main>
  );
}

function Sidebar() {
  const { recentUsers } = Route.useLoaderData();
  const { data: terms } = useTerms();

  const tags = terms?.filter((term) => term.taxonomy === "tag") ?? [];

  return (
    <section className="flex h-96 w-full flex-col items-center gap-4 px-4">
      <OverflowCard
        header={
          <>
            <HugeiconsIcon className="size-5" icon={UserGroupIcon} /> Usuarios
            Recientes
          </>
        }
      >
        {!!recentUsers.error && (
          <p className="text-red-500">Error: {recentUsers.error.code}</p>
        )}
        {recentUsers.data?.map((user, idx) => (
          <div className="flex items-center" key={user.id}>
            <Link params={{ id: user.id }} to="/user/$id">
              <UserLabel user={user} />
            </Link>
            {idx < (recentUsers.data?.length ?? 0) - 1 && (
              <span className="mr-1">,</span>
            )}
          </div>
        ))}
      </OverflowCard>
      <OverflowCard
        header={
          <>
            <HugeiconsIcon className="size-4" icon={Tag01Icon} />
            Tags
          </>
        }
      >
        {tags.map((tag) => (
          <TagCard key={tag.id} tag={tag} />
        ))}
      </OverflowCard>
    </section>
  );
}

function OverflowCard({
  children,
  header,
}: React.PropsWithChildren<{ header: React.ReactNode }>) {
  const overflow = useOverflowDetection();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <Card className="min-h-0 w-full flex-1">
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="inline-flex items-center gap-2 text-sm">
          {header}
        </CardTitle>
        {overflow.hasOverflow && (
          <CardAction>
            <Dialog onOpenChange={setDialogOpen} open={dialogOpen}>
              <DialogTrigger render={<Button size="sm" variant="default" />}>
                Ver más
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Tags</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-96 overflow-y-auto pr-4">
                  <div className="flex flex-wrap gap-2">{children}</div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="relative min-h-0 flex-1 overflow-hidden py-0">
        <div
          className="flex h-full w-full flex-wrap items-start gap-2"
          ref={overflow.containerRef}
        >
          {children}
        </div>
        {overflow.hasOverflow && (
          <div className="absolute inset-0 top-0 h-full w-full bg-linear-to-t from-card to-transparent" />
        )}
      </CardContent>
    </Card>
  );
}

function HeroSection() {
  const { featuredPosts } = Route.useLoaderData();

  if (
    featuredPosts.error ||
    !featuredPosts.data ||
    featuredPosts.data.length === 0
  ) {
    return <PlaceholderHero />;
  }

  const posts = featuredPosts.data;
  const main = posts.find((p) => p.position === "main");
  const secondary = posts
    .filter((p) => p.position === "secondary")
    .sort((a, b) => a.order - b.order);

  return (
    <div className="grid h-96 w-full grid-cols-3 flex-row gap-2">
      <div className="container col-span-2 grid h-96 w-full grid-cols-1 gap-4 md:grid-cols-3">
        {main && (
          <div className="md:col-span-2">
            <FeaturedCard post={main} />
          </div>
        )}
        {secondary.length > 0 && (
          <div className="hidden h-96 grid-rows-2 gap-4 md:grid">
            {secondary.map((post) => (
              <FeaturedCard key={post.id} post={post} />
            ))}
          </div>
        )}
        {!main && <PlaceholderHero />}
      </div>

      <Sidebar />
    </div>
  );
}

function FeaturedCard({
  post,
}: {
  post: { id: string; title: string; imageObjectKeys: string[] | null };
}) {
  return (
    <Link params={{ id: post.id }} preload={false} to="/post/$id">
      <div className="relative h-full max-h-96">
        <img
          alt={post.title}
          className="h-full w-full rounded-xl object-cover outline-2 outline-primary outline-offset-2 transition-transform hover:scale-[1.02]"
          src={getBucketUrl(post.imageObjectKeys?.[0] ?? "")}
        />
        <div className="group absolute inset-0 flex items-end justify-start overflow-clip rounded-xl bg-linear-to-t from-black/70 to-transparent p-4 opacity-0 transition-opacity hover:opacity-100">
          <div className="flex flex-col items-center">
            <span className="line-clamp-2 translate-y-10 px-2 font-bold text-white text-xl transition-transform group-hover:translate-y-0">
              {post.title}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function PlaceholderHero() {
  return (
    <div className="container grid h-96 w-full grid-cols-1 gap-4 md:grid-cols-3">
      <div className="md:col-span-2">
        <div className="relative">
          <img
            alt=""
            className="h-96 w-full rounded-xl object-cover outline-2 outline-primary outline-offset-2"
            src={"https://picsum.photos/id/11/1200/800"}
          />
          <div className="absolute inset-0 flex h-full w-full items-center justify-center">
            <span className="font-extrabold text-3xl text-black sm:text-6xl xl:text-9xl">
              The Cronos
            </span>
          </div>
        </div>
      </div>
      <div className="hidden h-96 grid-rows-2 gap-4 md:grid">
        <div className="h-full">
          <img
            alt=""
            className="h-full w-full rounded-xl object-cover object-center outline-2 outline-primary outline-offset-2"
            src={"https://picsum.photos/id/12/1000/600"}
          />
        </div>
        <div className="h-full">
          <img
            alt=""
            className="h-full w-full rounded-xl object-cover object-center outline-2 outline-primary outline-offset-2"
            src={"https://picsum.photos/id/13/1000/600"}
          />
        </div>
      </div>
    </div>
  );
}

function TagCard({
  tag,
}: {
  tag: { id: string; name: string; color: string | null };
}) {
  return (
    <Link className="grow" search={{ tag: [tag.id] }} to="/post-search">
      <TermBadge className="w-full justify-center" tag={tag} />
    </Link>
  );
}

function RecentPosts() {
  const {
    data: recentPosts,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["posts", "recent", RECENT_POSTS_LIMIT],
    queryFn: () => orpcClient.post.getRecent({ limit: RECENT_POSTS_LIMIT }),
  });

  if (isLoading) {
    return (
      <div className="grid w-full grid-cols-2 gap-2 sm:gap-4 md:grid-cols-3 md:gap-8">
        {Array.from({ length: RECENT_POSTS_LIMIT }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders
          <Skeleton className="aspect-video w-full rounded-lg" key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full text-center text-muted-foreground">
        Error al cargar los posts recientes
      </div>
    );
  }

  return (
    <div className="grid w-full grid-cols-2 gap-2 sm:gap-4 md:grid-cols-3 md:gap-8">
      {recentPosts?.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
