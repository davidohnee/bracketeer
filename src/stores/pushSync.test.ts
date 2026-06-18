import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { usePushSyncStore } from "./pushSync";
import { ref } from "vue";
import { generateTestTournament } from "@/helpers/test";
import { pushSyncManager } from "@/helpers/share/pushSync";

vi.mock("@/helpers/share/pushSync", () => ({
    pushSyncManager: vi.fn(() => ({
        start: vi.fn().mockImplementation(() => console.log("[Mock] pushSyncManager.start called")),
        stop: vi.fn().mockImplementation(() => console.log("[Mock] pushSyncManager.stop called")),
        activeSyncs: [],
    })),
}));

afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
});

describe("Push Sync Store", () => {
    beforeEach(() => {
        // Create a new pinia instance for each test
        setActivePinia(createPinia());
    });

    it("should start push sync with a tournament", () => {
        const store = usePushSyncStore();
        const tournament = ref(generateTestTournament());

        store.start(tournament);

        // call #1 in initialisation with ref(null)
        // call #2 in start with ref(tournament)

        expect(pushSyncManager).toHaveBeenCalledTimes(2);
        expect(pushSyncManager).toHaveBeenCalledWith(ref(null));
        expect(pushSyncManager).toHaveBeenCalledWith(tournament);

        // start on the second instance
        const secondInstance = (pushSyncManager as unknown as Mock).mock.results[1].value;
        expect(secondInstance.start).toHaveBeenCalled();
        expect(secondInstance.stop).not.toHaveBeenCalled();
    });

    it("should stop push sync", () => {
        const store = usePushSyncStore();
        const tournament = ref(generateTestTournament());
        vi.clearAllMocks();

        store.start(tournament);
        store.stop();

        const secondInstance = (pushSyncManager as unknown as Mock).mock.results[0].value;
        expect(secondInstance.stop).toHaveBeenCalled();
    });
});
