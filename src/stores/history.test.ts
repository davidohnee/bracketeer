import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/helpers/history/common", () => ({
    reverseChange: vi.fn((change) => {
        return {
            ...change,
            oldValue: change.value,
            value: change.oldValue,
        };
    }),
}));

vi.mock("@/helpers/history/undoHistory", () => {
    return {
        createHistoryManager: vi.fn(() => ({
            getHistory: vi.fn(() => ({
                undo: vi.fn(() => ({
                    type: "CHANGE",
                    oldValue: "old",
                    value: "new",
                    path: ["name"],
                })),
                redo: vi.fn(() => ({
                    type: "CHANGE",
                    oldValue: "old",
                    value: "new",
                    path: ["name"],
                })),
                canUndo: { value: true },
                canRedo: { value: true },
            })),
        })),
        createHistoryWatcher: vi.fn(() => ({})),
    };
});

describe("History store", () => {
    beforeEach(() => {
        // Create a new pinia instance for each test
        setActivePinia(createPinia());
    });

    it("should undo changes correctly", async () => {
        const { useHistoryStore } = await import("./history");

        const store = useHistoryStore();
        const tournamentId = "tournament-1";
        const callback = vi.fn();

        store.setOnChange(tournamentId, callback);

        store.undo();

        expect(callback).toHaveBeenCalledWith([
            {
                type: "CHANGE",
                oldValue: "new",
                value: "old",
                path: ["name"],
            },
        ]);
    });

    it("should redo changes correctly", async () => {
        const { useHistoryStore } = await import("./history");

        const store = useHistoryStore();
        const tournamentId = "tournament-1";
        const callback = vi.fn();

        store.setOnChange(tournamentId, callback);

        store.redo();

        expect(callback).toHaveBeenCalledWith([
            {
                type: "CHANGE",
                oldValue: "old",
                value: "new",
                path: ["name"],
            },
        ]);
    });

    it("should forward canUndo and canRedo correctly", async () => {
        const { useHistoryStore } = await import("./history");

        const store = useHistoryStore();
        const tournamentId = "tournament-1";

        store.setOnChange(tournamentId, () => {});

        expect(store.canUndo).toBe(true);
        expect(store.canRedo).toBe(true);
    });

    it("should undo/redo on Ctrl+Z and Ctrl+Y keypresses", async () => {
        const { useHistoryStore } = await import("./history");

        const store = useHistoryStore();
        const tournamentId = "tournament-1";
        const callback = vi.fn();

        store.setOnChange(tournamentId, callback);

        // Simulate Ctrl+Z keypress
        const undoEvent = new KeyboardEvent("keydown", { ctrlKey: true, key: "z" });
        document.dispatchEvent(undoEvent);

        expect(callback).toHaveBeenCalledWith([
            {
                type: "CHANGE",
                oldValue: "new",
                value: "old",
                path: ["name"],
            },
        ]);

        // Simulate Ctrl+Y keypress
        const redoEvent = new KeyboardEvent("keydown", { ctrlKey: true, key: "y" });
        document.dispatchEvent(redoEvent);

        expect(callback).toHaveBeenCalledWith([
            {
                type: "CHANGE",
                oldValue: "old",
                value: "new",
                path: ["name"],
            },
        ]);
    });
});
