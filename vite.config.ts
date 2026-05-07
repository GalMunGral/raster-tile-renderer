import { defineConfig } from "vite";

export default defineConfig({
  root: "src",
  base: "/mercator/",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
});