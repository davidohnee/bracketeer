import { describe, expect, it } from "vitest";
import { createHistory, createHistoryManager, createHistoryWatcher } from "./undoHistory";
import type { Change } from "./common";

const createChange = (oldValue: string, newValue: string): Change => ({
    type: "CHANGE",
    oldValue,
    value: newValue,
    path: ["name"],
});

describe("History", () => {
    describe("addChange", () => {
        it("should add a change to the history stack", () => {
            const history = createHistory();
            const change = createChange("old", "new");
            history.addChange(change);
            expect(history.canUndo.value).toBe(true);
            expect(history.canRedo.value).toBe(false);
        });

        it("should not add a change if it is the reverse of the next change", () => {
            const history = createHistory();
            const change1 = createChange("old1", "new1");
            const change2 = createChange("old2", "new2");
            history.addChange(change1);
            history.addChange(change2);
            history.undo();
            history.addChange(change1); // This should not be added
            expect(history.canUndo.value).toBe(true);
            expect(history.canRedo.value).toBe(false);
        });
    });

    describe("undo", () => {
        it("should undo the last change", () => {
            const history = createHistory();
            const change = createChange("old", "new");
            history.addChange(change);
            const undoneChange = history.undo();
            expect(undoneChange).toEqual(change);
            expect(history.canUndo.value).toBe(false);
            expect(history.canRedo.value).toBe(true);
        });

        it("should return null if there is nothing to undo", () => {
            const history = createHistory();
            const undoneChange = history.undo();
            expect(undoneChange).toBeNull();
        });
    });

    describe("redo", () => {
        it("should redo the last undone change", () => {
            const history = createHistory();
            const change = createChange("old", "new");
            history.addChange(change);
            history.undo();
            const redoneChange = history.redo();
            expect(redoneChange).toEqual(change);
            expect(history.canUndo.value).toBe(true);
            expect(history.canRedo.value).toBe(false);
        });

        it("should return null if there is nothing to redo", () => {
            const history = createHistory();
            const redoneChange = history.redo();
            expect(redoneChange).toBeNull();
        });
    });

    describe("manager", () => {
        it("should manage multiple histories", () => {
            const manager = createHistoryManager();
            const history1 = manager.getHistory("history1");
            const history2 = manager.getHistory("history2");

            const change1 = createChange("old1", "new1");
            const change2 = createChange("old2", "new2");

            history1.addChange(change1);
            history2.addChange(change2);

            expect(history1.undo()).toEqual(change1);
            expect(history2.undo()).toEqual(change2);
        });
    });

    describe("watcher", () => {
        it("should call the callback on change", () => {
            const manager = createHistoryManager();
            const watcher = createHistoryWatcher(manager);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            watcher.onTournamentChange?.({ id: "history1" } as any, [createChange("old", "new")]);

            const history = manager.getHistory("history1");

            expect(history.canUndo.value).toBe(true);
            expect(history.canRedo.value).toBe(false);
            expect(history.undo()).toEqual(createChange("old", "new"));
        });
    });
});
