import { createFileRoute, notFound } from "@tanstack/react-router";
import { formatDistance } from "date-fns";
import { es } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { UserLabel } from "@/components/users/user-label";
import { orpcClient } from "@/lib/orpc";
import { getBucketUrl } from "@/lib/utils";

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

  return (
    <div className="grid w-full grid-cols-5">
      <main className="col-span-3 col-start-2 h-full px-4">
        <div className="flex h-full flex-col gap-6">
          <section className="flex flex-row flex-wrap items-center justify-between">
            <UserLabel className="text-2xl" user={user} />
            <p className="min-w-0">
              Registrado{" "}
              {formatDistance(user.createdAt, new Date(), {
                addSuffix: true,
                locale: es,
              })}
            </p>
          </section>
          <Separator orientation="horizontal" />
          <div className="flex flex-row flex-wrap gap-6 px-12 py-6">
            <section className="flex flex-col items-center gap-2">
              <Avatar className="size-48">
                <AvatarImage
                  src={user.image ? getBucketUrl(user.image) : undefined}
                />
                <AvatarFallback>
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
