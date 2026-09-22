import { defineConfig } from "tsdown";

export default defineConfig({
  entry: { index: "src/index.ts" },
  format: ["esm"],
  target: "es2023",
  sourcemap: true,
  treeshake: true,
  // Declarations come from `tsc -p tsconfig.build.json`, not from tsdown.
  dts: false,
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
