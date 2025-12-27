import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_main/about")({
  component: RouteComponent,
  head: () => ({
    meta: [
      {
        title: "NeXusTC - Sobre Nosotros",
      },
    ],
  }),
});

function RouteComponent() {
  return <div>Hello "/_main/about"!</div>;
}
