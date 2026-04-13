import { afterEach, describe, expect, it } from "vitest";
import { createApp, h } from "vue";
import SkeletonTextLoader from "./SkeletonTextLoader.vue";

describe("SkeletonTextLoader", () => {
    let app: ReturnType<typeof createApp> | null = null;
    let container: HTMLDivElement | null = null;

    afterEach(() => {
        app?.unmount();
        app = null;
        container = null;
    });

    it("renders full-width skeleton lines when lines is provided", () => {
        container = document.createElement("div");
        app = createApp({
            render: () =>
                h(
                    SkeletonTextLoader,
                    {
                        loading: true,
                        lines: 3,
                    },
                    {
                        default: () => h("span", "loaded"),
                    },
                ),
        });

        app.mount(container);

        const lineElements = container.querySelectorAll(".skeleton-text-loader__line");

        expect(lineElements).toHaveLength(3);
        expect((lineElements[0] as HTMLElement).style.width).toBe("100%");
        expect((lineElements[1] as HTMLElement).style.width).toBe("50%");
        expect((lineElements[2] as HTMLElement).style.width).toBe("70%");
    });

    it("keeps the inline width-based loader for characters", () => {
        container = document.createElement("div");
        app = createApp({
            render: () =>
                h(
                    SkeletonTextLoader,
                    {
                        loading: true,
                        characters: 12,
                    },
                    {
                        default: () => h("span", "loaded"),
                    },
                ),
        });

        app.mount(container);

        const loader = container.querySelector(".skeleton-text-loader") as HTMLElement | null;

        expect(loader).not.toBeNull();
        expect(loader?.style.width).toBe("12ch");
    });
});
