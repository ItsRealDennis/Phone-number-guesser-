import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
export default defineConfig({
  plugins: [viteSingleFile(), { name: "strip-og", transformIndexHtml: (h) => h.replace("<!--og-image-->", "") }],
  build: { outDir: "dist-single", target: "es2019" },
});
