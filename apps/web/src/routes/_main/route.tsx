import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";

export const Route = createFileRoute("/_main")({
  component: MainLayout,
  errorComponent: ErrorComponent,
});

function ErrorComponent({ error }: { error: Error }) {
  return (
    <div className="relative grid min-h-dvh grid-rows-[1fr_auto] gap-12">
      <div className="flex flex-col items-center">
        <Header />
        <div className="h-6 md:h-12" />
        <div className="flex h-full flex-col items-center justify-center p-4">
          <h1 className="mb-4 font-bold text-2xl">Error: {error.message}</h1>
          <p className="text-center">
            Algo salió mal. Por favor, intenta recargar la página. Si el
            problema persiste, contacta al administrador del sitio.
          </p>
          {!!error.stack && (
            <pre className="mt-4 whitespace-pre-wrap text-red-500 text-sm">
              {error.stack}
            </pre>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

function MainLayout() {
  return (
    <div className="relative min-h-screen w-full">
      <div
        className="fixed inset-0 z-0 h-screen"
        style={{
          background:
            "radial-gradient(125% 125% at 50% 10%, var(--color-background) 40%, oklch(from var(--color-primary) l c h / 0.2) 100%)",
        }}
      />

      <div
        className="relative grid min-h-dvh grid-rows-[1fr_auto] gap-12"
        id="main-scrollable-area"
      >
        <div className="flex flex-col items-center">
          <Header />
          <div className="h-6 md:h-12" />
          <div className="[view-transition-name:main-content]">
            <Outlet />
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}
