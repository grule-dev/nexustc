import { ConfirmDialogProvider } from "@omit/react-confirm-dialog";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { Toaster } from "@/components/ui/sonner";
import appCss from "../styles.css?url";
import "react-medium-image-zoom/dist/styles.css";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "TanStack Start Starter",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),

  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: necessary
          dangerouslySetInnerHTML={{
            __html: themeInitScript(),
          }}
        />
      </head>
      <body>
        <ConfirmDialogProvider>{children}</ConfirmDialogProvider>
        <Toaster richColors />
        <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  );
}

function themeInitScript() {
  return `
(function () {
  try {
    var theme = localStorage.getItem("theme");
    if (!theme) theme = "system";

    var systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var resolved = theme === "dark" || (theme === "system" && systemDark)
      ? "dark"
      : "light";

    document.documentElement.classList.add(resolved);
    document.documentElement.style.colorScheme = resolved;
  } catch (_) {}
})();
`;
}
