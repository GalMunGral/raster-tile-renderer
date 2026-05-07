import { defineConfig } from "vite";

export default defineConfig({
  root: "src",
  base: "/raster-tile-renderer/",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
});