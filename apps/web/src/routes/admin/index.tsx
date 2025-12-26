import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex h-full w-full items-center justify-center md:hidden">
      <p className="text-center">
        Accede a esta página desde una computadora o un dispositivo con una
        pantalla más grande.
      </p>
    </div>
  );
}
