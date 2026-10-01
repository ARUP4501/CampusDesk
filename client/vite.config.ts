import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: false
      },
      includeAssets: ["favicon.svg", "favicon.ico", "apple-touch-icon.png", "icon-192.png", "icon-512.png"],
      manifest: {
        name: "CampusDesk Portal",
        short_name: "CampusDesk",
        description: "Unified campus complaints, gate passes, notices and academic services portal",
        theme_color: "#F9E6A8",
        background_color: "#F9E6A8",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,json}"],
        runtimeCaching: [
          {
            urlPattern: /^\/api\/academic\/timetable/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "timetable-cache",
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 24 * 60 * 60
              }
            }
          },
          {
            urlPattern: /^\/api\/mess\/menu/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "mess-menu-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 24 * 60 * 60
              }
            }
          },
          {
            urlPattern: /^\/api\/notices/,
            handler: "NetworkFirst",
            options: {
              cacheName: "notices-cache",
              networkTimeoutSeconds: 4,
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 12 * 60 * 60
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true
      }
    }
  }
});
