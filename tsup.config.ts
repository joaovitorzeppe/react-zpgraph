import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.ts" },
  format: ["esm", "cjs"],
  target: "es2020",
  sourcemap: true,
  treeshake: true,
  dts: false,
  clean: true,
  splitting: false,
  external: ["react", "react-dom", "react/jsx-runtime", "zpgraph"],
  outDir: "dist",
});
