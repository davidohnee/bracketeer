import { ref } from "vue";
import { expect, describe, it, vi, beforeEach } from "vitest";
import { pushSyncManager } from "./pushSync";
import P2PClient from "./p2p";
import GistClient from "./gist";
import { generateTestTournament } from "../test";
import { createPinia, setActivePinia } from "pinia";

vi.mock("./p2p/pushSync", () => ({
    createPushSync: vi.fn(() => ({
        start: vi.fn(),
        stop: vi.fn(),
        state: ref("connected"),
        id: "mock-gist-id",
    })),
}));

vi.mock("./gist/pushSync", () => ({
    createPushSync: vi.fn(() => ({
        start: vi.fn(),
        stop: vi.fn(),
        state: ref("connected"),
        id: "mock-gist-id",
    })),
}));

describe("push sync manager", () => {
    const tournament = ref(generateTestTournament());
    const manager = pushSyncManager(tournament);
    manager.start();

    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it("should return p2p for p2p identifier", async () => {
        const identifier = P2PClient.toShare({
            mode: "p2p",
            type: "permanent",
            peerId: "peer-id",
        });

        tournament.value.remote = [
            {
                identifier: identifier.identifier,
            },
        ];

        const pushSync = await import("./p2p/pushSync");

        expect(pushSync.createPushSync).toHaveBeenCalledOnce();
        expect(pushSync.createPushSync).toHaveBeenCalledWith(tournament);
    });

    it("should return gist for gist identifier", async () => {
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

        const pushSync = await import("./gist/pushSync");

        expect(pushSync.createPushSync).toHaveBeenCalledOnce();
        expect(pushSync.createPushSync).toHaveBeenCalledWith(tournament);
    });
});
