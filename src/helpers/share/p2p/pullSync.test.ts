import { vi, type Mock, expect, describe, it, beforeEach } from "vitest";
import { ref } from "vue";
import type { Tournament } from "@/types/tournament";
import { createPullSync } from "./pullSync";
import P2PClient from ".";
import { Peer } from "peerjs";
import { generateTestTournament } from "@/helpers/test";

const MOCK_PEER_ID = "mock-peer-id";

vi.mock("peerjs", () => ({
    Peer: vi.fn(
        class FakePeer {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
            on = vi.fn().mockImplementation((event: string, callback: Function) => {
                // we can simulate a connection event to trigger the push sync logic
                if (event == "open") {
                    callback();
                }
            });
            connect = vi.fn();
            destroy = vi.fn();
        },
    ),
}));

const getPeerInstance = () => (Peer as unknown as Mock).mock.results[0].value;
const createMockConnection = () => ({
    open: true,
    send: vi.fn(),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    on: vi.fn().mockImplementation((event: string, callback: Function) => {
        if (event === "open") {
            callback();
        }
    }),
    close: vi.fn(),
});

describe("pull sync", () => {
    const tournament = ref<Tournament | null>(null);
    const pullSync = createPullSync(tournament);

    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
    });

    describe("pull", () => {
        const setupAndVerifyPull = () => {
            const identifier = P2PClient.toShare({
                mode: "p2p",
                type: "permanent",
                peerId: MOCK_PEER_ID,
            });

            const mockConnection = createMockConnection();
            getPeerInstance().connect.mockReturnValue(mockConnection);

            pullSync.pull(identifier.identifier);
            expect(getPeerInstance().connect).toHaveBeenCalledWith(MOCK_PEER_ID);

            const receiveTournament = generateTestTournament();
            // Simulate receiving the tournament data from the peer
            // i.e. expect on("message") with full tournmante data
            const fullDataMessage = {
                type: "full",
                data: receiveTournament,
            };
            const onDataCallback = mockConnection.on.mock.calls.find(
                (call) => call[0] === "data",
            )![1];
            onDataCallback(fullDataMessage);

            // Expect the tournament to be set in the ref
            expect(tournament.value).not.toBeNull();
            expect(tournament.value!.id).toBe(receiveTournament.id);
            expect(tournament.value!.name).toBe(receiveTournament.name);

            return { connection: mockConnection, onDataCallback };
        };

        it("should pull initial tournament", setupAndVerifyPull);

        it("should apply diff", async () => {
            const { onDataCallback } = setupAndVerifyPull();

            // Simulate receiving a diff update
            const teamUpdate = {
                type: "diff",
                data: [
                    {
                        oldValue: "Team 1",
                        path: ["teams", 0, "name"],
                        type: "CHANGE",
                        value: "Updated Team Name",
                    },
                ],
            };
            onDataCallback(teamUpdate);

            await new Promise((resolve) => setTimeout(resolve, 50));

            // Expect the tournament name to be updated
            expect(tournament.value!.teams[0].name).toBe("Updated Team Name");

            // Simulate receiving a diff update
            const diffMessage = {
                type: "diff",
                data: [
                    {
                        oldValue: "Test Tournament",
                        path: ["name"],
                        type: "CHANGE",
                        value: "Updated Tournament Name",
                    },
                ],
            };
            onDataCallback(diffMessage);

            await new Promise((resolve) => setTimeout(resolve, 50));

            // Expect the tournament name to be updated
            expect(tournament.value!.name).toBe("Updated Tournament Name");
        });

        it("should apply diff (remove)", async () => {
            const { onDataCallback } = setupAndVerifyPull();

            // Simulate receiving a diff update
            const teamUpdate = {
                type: "diff",
                data: [
                    {
                        path: ["teams", 0],
                        type: "REMOVE",
                    },
                ],
            };
            onDataCallback(teamUpdate);

            await new Promise((resolve) => setTimeout(resolve, 50));

            // Expect the tournament name to be updated
            expect(tournament.value!.teams).toHaveLength(8 - 1);

            // Simulate receiving a diff update
            const nameUpdate = {
                type: "diff",
                data: [
                    {
                        path: ["name"],
                        type: "REMOVE",
                    },
                ],
            };
            onDataCallback(nameUpdate);

            await new Promise((resolve) => setTimeout(resolve, 50));

            // Expect the tournament name to be updated
            expect(tournament.value!.name).toBeUndefined();
        });

        it("should be closable", async () => {
            const { connection } = setupAndVerifyPull();

            pullSync.stop();

            expect(connection.close).toHaveBeenCalledOnce();
        });

        it("should try to recnonect", async () => {
            const { connection } = setupAndVerifyPull();

            // Simulate connection close
            connection.open = false;

            const callCount = getPeerInstance().connect.mock.calls.length;

            const closeCallback = connection.on.mock.calls.find((call) => call[0] === "close")![1];
            closeCallback();

            // Expect it to try reconnecting after a delay
            await new Promise((resolve) => setTimeout(resolve, 1100));
            expect(getPeerInstance().connect).toHaveBeenCalledTimes(callCount + 1);
        });
    });
});
