import { describe, it, expect, afterEach, vi } from "vitest";
import GistClient from ".";
import { createPullSync } from "./pullSync.ts";
import { ref } from "vue";
import { generateTestTournament } from "@/helpers/test";
import { createPinia, setActivePinia } from "pinia";
import type { Tournament } from "@/types/tournament.ts";

afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
});

const mockTournament = generateTestTournament();

vi.mock("./gist.ts", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        // @ts-expect-error - mocking
        ...actual,
        gistShare: {
            // @ts-expect-error - mocking
            ...actual.gistShare,
            pull: vi.fn().mockImplementation(async () => {
                return {
                    type: "success",
                    author: "author",
                    tournament: mockTournament,
                    link: "link",
                    date: new Date(),
                };
            }),
        },
    };
});

describe("pull sync", () => {
    const tournament = ref<Tournament | null>(null);
    setActivePinia(createPinia());
    const pullSync = createPullSync(tournament);

    it("should pull immediately", async () => {
        const identifier = GistClient.toShare({
            mode: "gist",
            author: "author",
            tag: "tag",
        });

        pullSync.pull(identifier.identifier);

        const gistShare = (await import("./gist.ts")).gistShare;
        expect(gistShare.pull).toHaveBeenCalled();
        expect(tournament.value).toEqual(mockTournament);
    });
});
