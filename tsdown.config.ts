import { defineConfig } from "tsdown";

export default defineConfig({
  entry: { index: "src/index.ts", extras: "src/extras.ts" },
  format: ["esm"],
  target: "es2023",
  sourcemap: false,
  treeshake: true,
  clean: true,
  platform: "browser",
  fixedExtension: false,
  deps: {
    neverBundle: [
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "zpgraph",
    ],
  },
  outDir: "dist",
});
