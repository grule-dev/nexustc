import { QueryClientProvider } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { orpc, queryClient } from "@/lib/orpc";
import { LoadingSpinner } from "./components/loading-spinner";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const router = createRouter({
    routeTree,
    context: { orpc, queryClient },
    defaultPreload: "intent",
    scrollRestoration: true,
    defaultPendingComponent: () => <LoadingSpinner />,
    defaultNotFoundComponent: () => <div>404 - Not Found</div>,
    Wrap: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });

  setupRouterSsrQueryIntegration({
    router,
    queryClient,
  });

  return router;
};

declare module "@tanstack/react-router" {
  // biome-ignore lint/style/useConsistentTypeDefinitions: must be interface to be extended
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
