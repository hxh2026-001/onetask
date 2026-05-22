import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  plugins: [remix()],
  server: {
    port: 3000
  },
  resolve: {
    alias: {
      "~/": `${path.resolve(__dirname, "app")}/`
    }
  },
  optimizeDeps: {
    include: ['three']
  }
});
