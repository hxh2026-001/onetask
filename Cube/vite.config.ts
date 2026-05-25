import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";

export default defineConfig({
  plugins: [solidPlugin()],
  server: {
    port: 3001,
    strictPort: true,
    proxy: {
      "/api": "http://localhost:3002",
    },
  },
  build: {
    target: "esnext",
    outDir: "dist/client",
  },
  worker: {
    format: "es",
  },
});
