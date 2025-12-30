/// <reference types="vitest/config" />
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

const config = defineConfig(({ mode }) => {
  // Read environment variables at build time
  const VITE_TURNSTILE_SITE_KEY = process.env.VITE_TURNSTILE_SITE_KEY;
  const VITE_ASSETS_BUCKET_URL = process.env.VITE_ASSETS_BUCKET_URL;

  // Debug logging - shows what Vite sees during build
  console.log("\n=== Build-time Environment Variables ===");
  console.log("Mode:", mode);
  console.log(
    "VITE_TURNSTILE_SITE_KEY:",
    VITE_TURNSTILE_SITE_KEY ? "✓ Set" : "✗ Missing"
  );
  console.log(
    "VITE_ASSETS_BUCKET_URL:",
    VITE_ASSETS_BUCKET_URL ? "✓ Set" : "✗ Missing"
  );
  console.log("=========================================\n");

  // Fail build if required env vars are missing (except in test mode)
  if (mode !== "test") {
    const missing: string[] = [];

    if (!VITE_TURNSTILE_SITE_KEY) {
      missing.push("VITE_TURNSTILE_SITE_KEY");
    }
    if (!VITE_ASSETS_BUCKET_URL) {
      missing.push("VITE_ASSETS_BUCKET_URL");
    }

    if (missing.length > 0) {
      throw new Error(
        `Build failed: Missing required environment variables:\n  - ${missing.join("\n  - ")}\n\n` +
          "Please ensure these are set in your environment before building."
      );
    }
  }

  return {
    plugins: [
      devtools(),
      // this is the plugin that enables path aliases
      viteTsConfigPaths({
        projects: ["./tsconfig.json"],
      }),
      tailwindcss(),
      mode !== "test" && tanstackStart(),
      viteReact(),
    ].filter(Boolean),

    // Explicitly define environment variables for Vite to replace at build time
    define: {
      "import.meta.env.VITE_TURNSTILE_SITE_KEY": JSON.stringify(
        VITE_TURNSTILE_SITE_KEY
      ),
      "import.meta.env.VITE_ASSETS_BUCKET_URL": JSON.stringify(
        VITE_ASSETS_BUCKET_URL
      ),
    },

    test: {
      environment: "happy-dom",
      globals: true,
      setupFiles: ["./vitest.setup.ts"],
    },
  };
});

export default config;
