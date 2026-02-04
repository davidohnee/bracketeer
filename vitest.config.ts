import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(
    viteConfig,
    defineConfig({
        test: {
            environment: "happy-dom",
            coverage: {
                provider: "v8", // or 'istanbul'
                reporter: ["text", "lcov"],
            },
        },
    }),
);
