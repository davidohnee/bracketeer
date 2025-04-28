import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";
import vue from "@vitejs/plugin-vue";

// https://vite.dev/config/
export default defineConfig({
    plugins: [vue()],
    base: process.env.BASE ?? "/",
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
    },
    define: {
        APP_VERSION: JSON.stringify(process.env.npm_package_version),
    },
});
