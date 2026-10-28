import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import path from "node:path";

export default defineConfig({
  base: "./",
  define: {
    __CLOUD_URL__: JSON.stringify("https://rvdodatgndwyuamrkhvp.supabase.co"),
    __CLOUD_KEY__: JSON.stringify("sb_publishable_YTU-ODVpEUWzrxFIloM40g_i9Lzj06F"),
  },
  server: { port: 8080 },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
    dedupe: ["react", "react-dom"],
  },
  plugins: [tailwindcss(), viteReact(), viteSingleFile()],
});
