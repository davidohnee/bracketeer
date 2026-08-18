import { describe, it, expect, vi, afterEach } from "vitest";
import localforage from "localforage";
import type { Tournament } from "@/types/tournament";

const keysMock = vi.fn().mockResolvedValue(["tournament.1"]);
const setItemMock = vi.fn().mockResolvedValue(undefined);
const getItemMock = vi.fn().mockResolvedValue({
    id: "1",
    name: "Tournament 1",
    config: {},
    phases: [],
    remote: false,
    teams: [],
    version: 1,
});
const removeItemMock = vi.fn().mockResolvedValue(undefined);
vi.spyOn(localforage, "createInstance").mockReturnValueOnce({
    keys: keysMock,
    getItem: getItemMock,
    setItem: setItemMock,
    removeItem: removeItemMock,
} as unknown as LocalForage);

afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
});

describe("Indexed DB  Sync", () => {
    it("should load tournaments from IndexedDB", async () => {
        const { createIndexedDbStorage } = await import("./indexedDb");
        const persistor = createIndexedDbStorage();
        const tournaments = await persistor.load();
        expect(tournaments).toHaveLength(1);
        expect(localforage.createInstance).toHaveBeenCalled();
        expect(keysMock).toHaveBeenCalled();
        expect(getItemMock).toHaveBeenCalledWith("tournament.1");
    });

    it("should persist tournament changes to IndexedDB", async () => {
        const { createIndexedDbStorage } = await import("./indexedDb");
        const persistor = createIndexedDbStorage();
        const tournament = {
            id: "1",
            name: "Tournament 1",
            config: {},
            phases: [],
            remote: false,
            teams: [],
            version: 1,
        } as unknown as Tournament;
        expect(persistor.onTournamentChange).toBeDefined();
        expect(persistor.onTournamentDeleted).toBeDefined();

        await persistor.onTournamentChange!(tournament);
        expect(setItemMock).toHaveBeenCalledWith("tournament.1", tournament);

        await persistor.onTournamentDeleted!(tournament);
        expect(removeItemMock).toHaveBeenCalledWith("tournament.1");
    });
});
