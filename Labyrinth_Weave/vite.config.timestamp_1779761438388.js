// vite.config.ts
import { defineConfig } from "vite";
import solid from "solid-start/vite";
var vite_config_default = defineConfig({
  plugins: [solid()],
  server: {
    port: 7001
  }
});
export {
  vite_config_default as default
};
