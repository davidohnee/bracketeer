import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";
import path from "node:path";
import os from "node:os";

export default mergeConfig(
    viteConfig,
    defineConfig({
        test: {
            environment: "happy-dom",
            execArgv: [
                "--localstorage-file",
                path.resolve(os.tmpdir(), `vitest-${process.pid}.localstorage`),
            ],
            coverage: {
                provider: "v8", // or 'istanbul'
                reporter: ["text", "lcov"],
            },
        },
    }),
);
