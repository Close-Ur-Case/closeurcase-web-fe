import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  build: {
    rollupOptions: {
      output: {
        // Split rarely-changing vendor code into its own long-lived cache
        // entries so an app-code change doesn't force users to re-download
        // React / the router / the Material web components. (Rolldown requires
        // the function form of manualChunks.)
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) {
            return "vendor-react";
          }
          if (/[\\/]node_modules[\\/]@tanstack[\\/]/.test(id)) return "vendor-tanstack";
          if (
            /[\\/]node_modules[\\/](@material[\\/]web|@lit[\\/]|lit|lit-html|lit-element)[\\/]/.test(
              id,
            )
          ) {
            return "vendor-material";
          }
        },
      },
    },
  },
  plugins: [
    TanStackRouterVite({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: { enabled: true },
      includeAssets: ["logo.svg"],
      manifest: {
        name: "CloseUrCase — AI-powered legal case management",
        short_name: "CloseUrCase",
        description:
          "CloseUrCase connects citizens, lawyers, and administrators on a single platform for managing legal cases end-to-end.",
        theme_color: "#fefbff",
        background_color: "#fafafa",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/logo.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
          { src: "/logo.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpeg,jpg}"],
      },
    }),
  ],
  server: {
    port: 8080,
    host: true,
  },
});
