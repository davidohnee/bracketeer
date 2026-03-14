import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "node:url";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        vueDevTools(),
        vue({
            template: {
                compilerOptions: {
                    isCustomElement: (tag) => {
                        return tag.startsWith("ion-") || tag.startsWith("ionx-");
                    },
                },
            },
        }),
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
