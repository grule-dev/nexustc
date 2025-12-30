import { createFileRoute } from "@tanstack/react-router";
import { UsersChart } from "@/components/admin/users-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { orpcClient } from "@/lib/orpc";

export const Route = createFileRoute("/admin/users/")({
  component: RouteComponent,
  loader: () => orpcClient.user.getDashboard(),
});

function RouteComponent() {
  const { registeredLastWeek, registeredAllTime, userCount } =
    Route.useLoaderData();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-bold text-2xl">Usuarios</h1>
      <div className="flex flex-col gap-4">
        <UserCounts premiumUsers={userCount} users={userCount} />
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Últimos 7 días</CardTitle>
            </CardHeader>
            <CardContent>
              <UsersChart chart={registeredLastWeek} type="last7days" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Todo el tiempo</CardTitle>
            </CardHeader>
            <CardContent>
              <UsersChart chart={registeredAllTime} type="alltime" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function UserCounts({
  users,
  premiumUsers,
}: {
  users: number;
  premiumUsers: number;
}) {
  return (
    <div className="grid grid-cols-4 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Usuarios Registrados</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-bold text-6xl">{users}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Usuarios Premium</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-bold text-6xl">{premiumUsers}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Usuarios Patreon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-bold text-6xl">{premiumUsers}</p>
        </CardContent>
      </Card>
    </div>
  );
}

// function RouteComponent() {
//   const usersQuery = useInfiniteQuery({
//     queryKey: ["users"],
//     queryFn: ({ pageParam }) =>
//       authClient.admin.listUsers({
//         query: {
//           limit: PAGE_SIZE,
//           offset: (pageParam - 1) * PAGE_SIZE,
//         },
//       }),
//     initialPageParam: 1,
//     getNextPageParam: ({ data, error }) => {
//       if (error) {
//         return;
//       }

//       if ("limit" in data && "offset" in data) {
//         const { limit, offset, total } = data;

//         if (limit == null || offset == null) {
//           return;
//         }

//         if (offset + limit < total) {
//           return (offset + limit) / limit + 1;
//         }
//       }

//       return;
//     },
//   });

//   const pages = usersQuery.data?.pages;

//   return (
//     <main>
//       <ul>
//         {pages?.[pages.length - 1].data?.users.map((user) => (
//           <li key={user.id}>{user.email}</li>
//         ))}
//       </ul>
//     </main>
//   );
// }
