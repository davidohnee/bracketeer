import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "node:url";
import vue from "@vitejs/plugin-vue";
import VueRouter from "vue-router/vite";
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
        vueDevTools(),
    ],
    base: process.env.BASE ?? "/",
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
    },
    define: {
        APP_VERSION: JSON.stringify(process.env.npm_package_version),
    },
    test: {
        globals: true,
        environment: "node",
    },
});
