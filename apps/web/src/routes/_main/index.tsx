import { createFileRoute, Link } from "@tanstack/react-router";
import { GamesCarousel } from "@/components/landing/games-carousel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserLabel } from "@/components/users/user-label";
import { safeOrpcClient } from "@/lib/orpc";

export const Route = createFileRoute("/_main/")({
  component: HomeComponent,
  loader: async () => {
    const [error, result, isDefined] =
      await safeOrpcClient.user.getRecentUsers();

    if (isDefined) {
      const err = {
        code: error.code,
        name: error.name,
        message: error.message,
      };

      return [err, undefined] as const;
    }

    if (error) {
      throw error;
    }

    return [undefined, result] as const;
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
  return (
    <main className="container grid grid-cols-1 gap-4 xl:grid-cols-4">
      <div className="flex flex-col items-center justify-center xl:col-span-3">
        <div className="container flex flex-col items-center justify-center gap-12 px-4">
          <HeroSection />
          <h1 className="font-extrabold text-3xl">Juegos de la Semana</h1>
          <GamesCarousel games={[]} />
          <h1 className="font-extrabold text-3xl">Juegos Recientes</h1>
          <RecentPosts />
        </div>
      </div>
      <Sidebar />
    </main>
  );
}

function Sidebar() {
  const [recentUsersError, recentUsers] = Route.useLoaderData();

  return (
    <section className="flex flex-col items-center gap-4 px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Usuarios Recientes</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap">
          {!!recentUsersError && (
            <p className="text-red-500">Error: {recentUsersError.code}</p>
          )}
          {recentUsers?.map((user, idx) => (
            <div className="flex items-center" key={user.id}>
              <Link params={{ id: user.id }} to="/user/$id">
                <UserLabel user={user} />
              </Link>
              {idx < recentUsers.length - 1 && <span className="mr-1">,</span>}
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Tags</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {/* TODO: add tags back
          {tags.map((tag) => (
            <TagCard key={tag.id} tag={tag} />
          ))} */}
        </CardContent>
      </Card>
    </section>
  );
}

function HeroSection() {
  return (
    <div className="container grid h-96 grid-cols-1 gap-4 md:grid-cols-3">
      <div className="md:col-span-2">
        <div className="relative">
          <img
            alt=""
            className="h-96 w-full rounded-xl object-cover"
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
        <div className="h-full overflow-clip rounded-xl">
          <img
            alt=""
            className="h-full w-full object-cover object-center"
            src={"https://picsum.photos/id/12/1000/600"}
          />
        </div>
        <div className="h-full overflow-clip rounded-xl">
          <img
            alt=""
            className="h-full w-full object-cover object-center"
            src={"https://picsum.photos/id/13/1000/600"}
          />
        </div>
      </div>
    </div>
  );
}

// function TagCard({
//   tag,
// }: {
//   tag: { id: string; name: string; color: string | null };
// }) {
//   return (
//     <Link className="grow" search={{ tag: tag.id }} to="/post-search">
//       <TermBadge className="w-full justify-center" tag={tag} />
//     </Link>
//   );
// }

function RecentPosts() {
  // TODO: add recent posts back

  return (
    <div className="grid w-full grid-cols-2 gap-2 sm:gap-4 md:grid-cols-3 md:gap-8">
      {/* {recentPosts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))} */}
    </div>
  );
}
