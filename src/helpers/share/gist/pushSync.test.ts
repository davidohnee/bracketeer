import { describe, it, expect, afterEach, vi } from "vitest";
import GistClient from ".";
import { createPushSync } from "./pushSync";
import { ref } from "vue";
import { generateTestTournament } from "@/helpers/test";
import { createPinia, setActivePinia } from "pinia";

afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
});

vi.mock("./index.ts", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        // @ts-expect-error - mocking
        ...actual,
        default: {
            // @ts-expect-error - mocking
            ...actual.default,
            create: vi.fn(),
        },
    };
});

describe("push sync", () => {
    const tournament = ref(generateTestTournament());
    setActivePinia(createPinia());
    const pushSync = createPushSync(tournament);

    it("should not create by default", async () => {
        const identifier = GistClient.toShare({
            mode: "gist",
            author: "author",
            tag: "tag",
        });
        tournament.value.remote = [
            {
                identifier: identifier.identifier,
            },
        ];

        pushSync.start(identifier.identifier);

        const gistShare = await import("./index.ts");
        expect(gistShare.default.create).not.toHaveBeenCalled();
    });

    it("should create on tournament change", async () => {
        const identifier = GistClient.toShare({
            mode: "gist",
            author: "author",
            tag: "tag",
        });
        tournament.value.remote = [
            {
                identifier: identifier.identifier,
            },
        ];

        pushSync.start(identifier.identifier);
        tournament.value.name = "Updated Tournament Name";

        await new Promise((resolve) => setTimeout(resolve, 1100));

        const gistShare = await import("./index.ts");
        expect(gistShare.default.create).toHaveBeenCalled();
    });
});
