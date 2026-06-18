import { vi, type Mock, expect, describe, it, beforeEach } from "vitest";
import { ref } from "vue";
import type { Tournament } from "@/types/tournament";
import { createPushSync } from "./pushSync";
import P2PClient from ".";
import { generateTestTournament } from "@/helpers/test";
import { Peer } from "peerjs";

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
            destroy = vi.fn();
        },
    ),
}));

const getPeerInstance = () => (Peer as unknown as Mock).mock.results[0].value;
const getConnectionCallback = () =>
    getPeerInstance().on.mock.calls.find(
        (call: unknown) => (call as [string])[0] === "connection",
    )[1];
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

describe("push sync", () => {
    const tournament = ref<Tournament | null>(null);
    const pushSync = createPushSync(tournament);

    beforeEach(() => {
        tournament.value = generateTestTournament();
        localStorage.clear();
        sessionStorage.clear();
    });

    describe("push", () => {
        it("should push initial tournament", async () => {
            const identifier = P2PClient.toShare({
                mode: "p2p",
                type: "permanent",
                peerId: MOCK_PEER_ID,
            });
            pushSync.start(identifier.identifier);

            expect(pushSync.state.value).toBe("connected");
            const connection = createMockConnection();

            getConnectionCallback()(connection);

            expect(connection.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: "full",
                    data: tournament.value,
                }),
            );
        });

        it("should switch to diff", async () => {
            const identifier = P2PClient.toShare({
                mode: "p2p",
                type: "permanent",
                peerId: MOCK_PEER_ID,
            });
            pushSync.start(identifier.identifier);

            // check if the tournament was pushed
            expect(pushSync.state.value).toBe("connected");

            const mockConnection = createMockConnection();
            getConnectionCallback()(mockConnection);

            expect(mockConnection.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: "full",
                    data: tournament.value,
                }),
            );

            // change
            tournament.value!.name = "Updated Tournament Name";

            // wait for the diff to be sent
            await new Promise((resolve) => setTimeout(resolve, 100));

            expect(mockConnection.send).toHaveBeenCalledTimes(2);

            expect(mockConnection.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: "diff",
                    data: [
                        {
                            oldValue: "Test Tournament",
                            path: ["name"],
                            type: "CHANGE",
                            value: "Updated Tournament Name",
                        },
                    ],
                }),
            );
        });

        it("should be closable", async () => {
            const identifier = P2PClient.toShare({
                mode: "p2p",
                type: "random",
                peerId: MOCK_PEER_ID,
            });
            pushSync.start(identifier.identifier);

            expect(pushSync.state.value).toBe("connected");
            const peer = getPeerInstance();
            const connection = createMockConnection();

            getConnectionCallback()(connection);

            expect(connection.send).toHaveBeenCalledOnce();

            pushSync.stop();

            expect(pushSync.state.value).toBe("disconnected");
            expect(connection.send).toHaveBeenCalledOnce();
            expect(peer.destroy).toHaveBeenCalledOnce();

            tournament.value!.name = "Updated Tournament Name";

            expect(pushSync.state.value).toBe("disconnected");
            expect(connection.send).toHaveBeenCalledOnce();
        });

        it("should regenerate peer id if session", async () => {
            const identifier = P2PClient.toShare({
                mode: "p2p",
                type: "session",
                peerId: MOCK_PEER_ID,
            });
            tournament.value!.remote = [
                {
                    identifier: identifier.identifier,
                },
            ];
            pushSync.start(identifier.identifier);

            expect(pushSync.state.value).toBe("connected");
            expect(tournament.value?.remote?.[0]?.identifier).not.toBe(identifier.identifier);
            const newIdentifier = tournament.value?.remote?.[0]?.identifier;

            pushSync.stop();

            expect(pushSync.state.value).toBe("disconnected");

            // start again -> preserve
            pushSync.start(newIdentifier!);

            expect(pushSync.state.value).toBe("connected");

            expect(tournament.value?.remote?.[0]?.identifier).not.toBe(identifier.identifier);
            expect(tournament.value?.remote?.[0]?.identifier).toBe(newIdentifier);
        });

        it("should always regenerate peer id if random", async () => {
            const identifier = P2PClient.toShare({
                mode: "p2p",
                type: "random",
                peerId: MOCK_PEER_ID,
            });
            tournament.value!.remote = [
                {
                    identifier: identifier.identifier,
                },
            ];
            pushSync.start(identifier.identifier);

            expect(pushSync.state.value).toBe("connected");
            expect(tournament.value?.remote?.[0]?.identifier).not.toBe(identifier.identifier);
            const firstIdentifier = tournament.value?.remote?.[0]?.identifier;

            const peerId = P2PClient.fromShare(firstIdentifier!).peerId;

            // since we have a temporary cache, it's hard to test if the peer id is regenerated on reload; just check localStorage

            const sessionCache = localStorage.getItem(`p2p.peer.${peerId}`);
            expect(sessionCache).toBeNull();
        });
    });

    describe("lock", () => {
        it("should lock the tournament", async () => {
            const identifier = P2PClient.toShare({
                mode: "p2p",
                type: "permanent",
                peerId: MOCK_PEER_ID,
            });
            pushSync.start(identifier.identifier);

            expect(pushSync.state.value).toBe("connected");

            // act like another tab
            sessionStorage.removeItem("p2p.tab-id");

            // second pushSync
            const secondPushSync = createPushSync(tournament);
            secondPushSync.start(identifier.identifier);

            expect(pushSync.state.value).toBe("connected");
            expect(secondPushSync.state.value).toBe("no-lock");
        });
    });
});
