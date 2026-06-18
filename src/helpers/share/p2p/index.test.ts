import { vi, type Mock, expect, describe, it, beforeEach } from "vitest";
import { createPullSync } from "./pullSync";
import P2PClient from ".";
import { generateTestTournament } from "@/helpers/test";

// mock createP2PPullSync

vi.mock("./pullSync", () => ({
    createPullSync: vi.fn().mockImplementation(() => {
        return {
            pull: vi.fn().mockImplementation(async () => {
                return {
                    type: "success",
                    tournament: generateTestTournament(),
                    author: "unknown",
                    link: "",
                    date: new Date(),
                };
            }),
            stop: vi.fn(),
        };
    }),
}));

describe("pull sync", () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
    });

    describe("pull", () => {
        it("should pull tournament", async () => {
            const identifier = P2PClient.toShare({
                mode: "p2p",
                type: "permanent",
                peerId: "mock-peer-id",
            });
            const result = await P2PClient.pull({
                identifier: identifier.identifier,
            });
            expect(result).toEqual({
                type: "success",
                tournament: expect.any(Object),
                author: "unknown",
                link: "",
                date: expect.any(Date),
            });
            const createPullSyncMock = createPullSync as unknown as Mock;
            expect(createPullSyncMock).toHaveBeenCalledOnce();

            const client = createPullSyncMock.mock.results[0];

            expect(client.value.pull).toHaveBeenCalledOnce();
            expect(client.value.pull).toHaveBeenCalledWith(identifier.identifier);
            expect(client.value.stop).toHaveBeenCalledOnce();
        });
    });

    describe("create", () => {
        it("should create a new tournament", async () => {
            const tournament = generateTestTournament();

            expect(tournament.remote).toBeUndefined();

            const result = await P2PClient.create(tournament, { type: "permanent" });
            expect(result).toEqual({
                type: "success",
                tournament,
                date: expect.any(Date),
                link: expect.any(String),
                identifier: expect.any(String),
            });
            expect(tournament.remote).toBeDefined();
            expect(tournament.remote?.[0]?.identifier).toBeDefined();
        });
    });
});
