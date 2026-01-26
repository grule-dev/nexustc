import { Tag01Icon, UserGroupIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { GamesCarousel } from "@/components/landing/games-carousel";
import { PostCard } from "@/components/landing/post-card";
import { TermBadge } from "@/components/term-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UserLabel } from "@/components/users/user-label";
import { useTerms } from "@/hooks/use-terms";
import { orpcClient, safeOrpcClient } from "@/lib/orpc";

const RECENT_POSTS_LIMIT = 12;

export const Route = createFileRoute("/_main/")({
  component: HomeComponent,
  loader: async () => {
    const [recentUsersResult, weeklyGamesResult] = await Promise.all([
      safeOrpcClient.user.getRecentUsers(),
      safeOrpcClient.post.getWeekly(),
    ]);

    const [recentUsersError, recentUsers, recentUsersDefined] =
      recentUsersResult;
    const [weeklyGamesError, weeklyGames, weeklyGamesDefined] =
      weeklyGamesResult;

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
      <div className="col-span-5 col-start-2 grid grid-cols-4 gap-4">
        <div className="col-span-3 flex flex-col items-center justify-center">
          <div className="flex flex-col items-center justify-center gap-12 px-4">
            <HeroSection />
            <h1 className="font-extrabold text-3xl">Juegos de la Semana</h1>
            <GamesCarousel games={weeklyGames.data ?? []} />
            <h1 className="font-extrabold text-3xl">Juegos Recientes</h1>
            <RecentPosts />
          </div>
        </div>
        <Sidebar />
      </div>
    </main>
  );
}

function Sidebar() {
  const { recentUsers } = Route.useLoaderData();
  const { data: terms } = useTerms();

  const tags = terms?.filter((term) => term.taxonomy === "tag") ?? [];

  return (
    <section className="flex flex-col items-center gap-4 px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2 text-sm">
            <HugeiconsIcon className="size-5" icon={UserGroupIcon} /> Usuarios
            Recientes
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap px-4">
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
        </CardContent>
      </Card>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2 text-sm">
            <HugeiconsIcon className="size-4" icon={Tag01Icon} />
            Tags
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <TagCard key={tag.id} tag={tag} />
          ))}
        </CardContent>
      </Card>
    </section>
  );
}

function HeroSection() {
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
