import { reverseChange, type Change } from "@/helpers/history/common";
import { createHistoryManager, createHistoryWatcher } from "@/helpers/history/undoHistory";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

export const useHistoryStore = defineStore("history", () => {
    const activeTournamentId = ref<string | null>(null);
    const history = createHistoryManager();
    const historyWatcher = createHistoryWatcher(history);

    const onChange = ref<((change: Change[]) => void) | null>(null);

    const undo = () => {
        if (activeTournamentId.value === null) return;
        const thisHistory = history.getHistory(activeTournamentId.value);
        let change = thisHistory.undo();
        if (change) {
            change = reverseChange(change);
            onChange.value?.([change]);
        }
    };

    const redo = () => {
        if (activeTournamentId.value === null) return;
        const thisHistory = history.getHistory(activeTournamentId.value);
        const change = thisHistory.redo();
        if (change) {
            onChange.value?.([change]);
        }
    };

    document.addEventListener("keydown", (event) => {
        if (event.ctrlKey && event.key === "z") {
            undo();
        } else if (event.ctrlKey && event.key === "y") {
            redo();
        }
    });

    return {
        setOnChange: (tournamentId: string, callback: (change: Change[]) => void) => {
            activeTournamentId.value = tournamentId;
            onChange.value = callback;
        },
        watcher: computed(() => historyWatcher),
        history: computed(() => history),
        undo,
        redo,
        canUndo: computed(() => {
            if (activeTournamentId.value === null) return false;
            const thisHistory = history.getHistory(activeTournamentId.value);
            return thisHistory.canUndo.value;
        }),
        canRedo: computed(() => {
            if (activeTournamentId.value === null) return false;
            const thisHistory = history.getHistory(activeTournamentId.value);
            return thisHistory.canRedo.value;
        }),
    };
});
