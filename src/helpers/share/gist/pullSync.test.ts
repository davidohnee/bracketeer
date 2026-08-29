import { describe, it, expect, afterEach, vi, type Mock } from "vitest";
import GistClient from ".";
import P2PClient from "@/helpers/share/p2p";
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
    pullSync.onPreferOther = vi.fn();
    pullSync.onError = vi.fn();

    it("should pull immediately", async () => {
        const identifier = GistClient.toShare({
            mode: "gist",
            author: "author",
            tag: "tag",
        });

        await pullSync.pull(identifier.identifier);

        const gistShare = (await import("./gist.ts")).gistShare;
        expect(gistShare.pull).toHaveBeenCalled();
        expect(tournament.value).toEqual(mockTournament);
        expect(pullSync.onPreferOther).not.toHaveBeenCalled();

        pullSync.stop();
    });

    it("should prefer p2p remote if available", async () => {
        const identifier = GistClient.toShare({
            mode: "gist",
            author: "author",
            tag: "tag",
        });

        const otherRemote = P2PClient.toShare({
            mode: "p2p",
            peerId: "peerId",
            type: "session",
        });

        mockTournament.remote = [
            {
                identifier: identifier.identifier,
            },
            {
                identifier: otherRemote.identifier,
            },
        ];

        await pullSync.pull(identifier.identifier);
        expect(pullSync.onPreferOther).toHaveBeenCalled();
        expect(pullSync.onPreferOther).toHaveBeenCalledWith({
            identifier: otherRemote.identifier,
        });
    });

    it("should handle errors", async () => {
        const identifier = GistClient.toShare({
            mode: "gist",
            author: "author",
            tag: "tag",
        });

        const gistShare = (await import("./gist.ts")).gistShare;
        // overwrite the mock implementation to simulate an error
        (gistShare.pull as unknown as Mock).mockImplementationOnce(async () => {
            console.log("Mocked gistShare.pull called, returning error");
            return {
                type: "error",
                error: "not-found",
            };
        });

        await pullSync.pull(identifier.identifier);

        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(pullSync.error).not.toBeNull();
        expect(pullSync.error.value).toBe("not-found");
        expect(pullSync.onError).toHaveBeenCalled();
        expect(pullSync.onError).toHaveBeenCalledWith("not-found");
    });
});
