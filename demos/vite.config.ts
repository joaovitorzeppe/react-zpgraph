import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root,
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: "zpgraph/style.css",
        replacement: path.resolve(root, "../../core/src/style.css"),
      },
      {
        find: /^zpgraph$/,
        replacement: path.resolve(root, "../../core/src/index.ts"),
      },
      {
        find: "react-zpgraph",
        replacement: path.resolve(root, "../src/index.ts"),
      },
    ],
  },
  server: {
    port: 5174,
    open: true,
  },
  build: {
    target: "es2022",
    outDir: "dist",
    emptyOutDir: true,
  },
});
