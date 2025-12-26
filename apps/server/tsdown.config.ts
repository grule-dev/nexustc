import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "./src/index.ts",
  format: "esm",
  outDir: "./dist",
  clean: true,
  noExternal: [/@repo\/.*/],
  external: ["bun"],

  platform: "node",
  target: "node22",

  env: {
    NODE_ENV: "production",
    SKIP_ENV_VALIDATION: true,
  },
});
