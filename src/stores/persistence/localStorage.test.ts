import { describe, it, expect, vi } from "vitest";
import type { Tournament } from "@/types/tournament";

describe("LocalStorage  Sync", () => {
    it("should load tournaments from LocalStorage", async () => {
        const getItemMock = vi.fn().mockReturnValue(
            JSON.stringify([
                {
                    id: "1",
                    name: "Tournament 1",
                    config: {},
                    phases: [],
                    remote: false,
                    teams: [],
                    version: 1,
                },
            ]),
        );
        vi.spyOn(localStorage.__proto__, "getItem").mockImplementation(getItemMock);

        const { createLocalStorageSync } = await import("./localStorage");
        const persistor = createLocalStorageSync();
        const tournaments = await persistor.load();
        expect(tournaments).toHaveLength(1);
        expect(getItemMock).toHaveBeenCalledWith("tournaments");
    });

    it("should persist tournament changes to LocalStorage", async () => {
        const setItemMock = vi.fn();
        vi.spyOn(localStorage.__proto__, "setItem").mockImplementation(setItemMock);

        const { createLocalStorageSync } = await import("./localStorage");
        const persistor = createLocalStorageSync();
        const tournament = {
            id: "1",
            name: "Tournament 1",
            config: {},
            phases: [],
            remote: false,
            teams: [],
            version: 1,
        } as unknown as Tournament;
        expect(persistor.onTournamentsChange).toBeDefined();

        await persistor.onTournamentsChange!([tournament]);
        expect(setItemMock).toHaveBeenCalledWith("tournaments", JSON.stringify([tournament]));

        await persistor.onTournamentsChange!([]);
        expect(setItemMock).toHaveBeenCalledWith("tournaments", JSON.stringify([]));
    });
});
