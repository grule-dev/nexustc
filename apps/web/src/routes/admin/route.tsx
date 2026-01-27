import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Suspense } from "react";
import { HasPermissions } from "@/components/auth/has-role";
import Loader from "@/components/loader";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
} from "@/components/ui/sidebar";
import { adminMiddleware } from "@/middleware/admin";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
  head: () => ({
    meta: [
      {
        title: "NeXusTC - Admin",
      },
    ],
  }),
  server: {
    middleware: [adminMiddleware],
  },
});

const nav = {
  users: {
    name: "Usuarios",
    links: [
      {
        name: "Listar",
        href: "/admin/users",
      },
    ],
  },
  terms: {
    name: "Términos",
    links: [
      {
        name: "Listar",
        href: "/admin/terms",
      },
      {
        name: "Crear",
        href: "/admin/terms/create",
      },
    ],
  },
  posts: {
    name: "Posts",
    links: [
      {
        name: "Listar",
        href: "/admin/posts",
      },
      {
        name: "Crear",
        href: "/admin/posts/create",
      },
    ],
  },
  comics: {
    name: "Comics",
    links: [
      {
        name: "Listar",
        href: "/admin/comics",
      },
      {
        name: "Crear",
        href: "/admin/comics/create",
      },
    ],
  },
  extras: {
    name: "Extras",
    links: [
      {
        name: "Juegos de la Semana",
        href: "/admin/extras/weekly",
      },
      {
        name: "Posts Destacados",
        href: "/admin/extras/featured",
      },
      {
        name: "Tutoriales",
        href: "/admin/extras/tutorials",
      },
    ],
  },
  chronos: {
    name: "Chronos",
    links: [
      {
        name: "Editar Página",
        href: "/admin/chronos/edit",
      },
    ],
  },
};

function AdminLayout() {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" variant="sidebar">
        <SidebarHeader>
          <h1 className="mx-auto pt-4 font-extrabold text-xl">
            <Link to="/">NeXusTC Admin</Link>
          </h1>
        </SidebarHeader>
        <SidebarContent>
          <HasPermissions permissions={{ user: ["list"] }}>
            <SidebarLinks item={nav.users} />
          </HasPermissions>
          <HasPermissions
            permissions={{
              terms: ["list", "create"],
            }}
          >
            <SidebarLinks item={nav.terms} />
          </HasPermissions>
          <HasPermissions
            permissions={{
              posts: ["list", "create"],
            }}
          >
            <SidebarLinks item={nav.posts} />
          </HasPermissions>
          <HasPermissions permissions={{ comics: ["create"] }}>
            <SidebarLinks item={nav.comics} />
          </HasPermissions>
          <HasPermissions permissions={{ posts: ["create"] }}>
            <SidebarLinks item={nav.extras} />
          </HasPermissions>
          <HasPermissions permissions={{ chronos: ["update"] }}>
            <SidebarLinks item={nav.chronos} />
          </HasPermissions>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <main className="container w-full p-4">
        <Suspense fallback={<Loader />}>
          <Outlet />
        </Suspense>
      </main>
    </SidebarProvider>
  );
}

function SidebarLinks({
  item,
}: {
  item: { name: string; links: { name: string; href: string }[] };
}) {
  return (
    <SidebarGroup key={item.name}>
      <SidebarGroupLabel>{item.name}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {item.links.map((link) => (
            <SidebarMenuItem key={link.name}>
              <SidebarMenuButton
                render={<Link to={link.href} />}
                variant="default"
              >
                {link.name}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
