import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "node:url";
import vue from "@vitejs/plugin-vue";
import VueRouter from "vue-router/vite";
import { VitePWA } from "vite-plugin-pwa";
import vueDevTools from "vite-plugin-vue-devtools";

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        VueRouter({
            dts: "src/route-map.d.ts",
        }),
        vue({
            template: {
                compilerOptions: {
                    isCustomElement: (tag) => {
                        return tag.startsWith("ion-") || tag.startsWith("ionx-");
                    },
                },
            },
        }),
        VitePWA({
            includeManifestIcons: false,
            includeAssets: ["**/*.woff2", "**/*.svg", "**/*.json"],
            manifest: {
                name: "bracketeer",
                short_name: "bracketeer",
                description:
                    "bracketeer is your sidekick that levels up your game nights from casual to championship.",
                theme_color: "#1fca83",
                display: "standalone",
                icons: [
                    {
                        src: "pwa-64x64.png",
                        sizes: "64x64",
                        type: "image/png",
                    },
                    {
                        src: "pwa-192x192.png",
                        sizes: "192x192",
                        type: "image/png",
                    },
                    {
                        src: "pwa-512x512.png",
                        sizes: "512x512",
                        type: "image/png",
                    },
                    {
                        src: "maskable-icon-512x512.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "maskable",
                    },
                ],
                start_url: "/",
            },
        }),
        vueDevTools(),
    ],
    base: process.env.BASE ?? "/",
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
            "#root": fileURLToPath(new URL(".", import.meta.url)),
        },
    },
    define: {
        APP_VERSION: JSON.stringify(process.env.npm_package_version),
        BUILD_DATE: JSON.stringify(new Date().toString()),
    },
    test: {
        globals: true,
        environment: "node",
    },
    assetsInclude: ["*.md"],
});
