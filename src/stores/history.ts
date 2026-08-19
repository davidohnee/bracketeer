import { reverseChange, type Change } from "@/helpers/history/common";
import { createHistoryManager, createHistoryWatcher } from "@/helpers/history/undoHistory";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

export const useHistoryStore = defineStore("history", () => {
    const activeTournamentId = ref<string | null>(null);
    const history = createHistoryManager();
    const historyWatcher = createHistoryWatcher(history);

    const onChange = ref<((change: Change[]) => void) | null>(null);

    document.addEventListener("keydown", (event) => {
        if (activeTournamentId.value === null) return;
        const thisHistory = history.getHistory(activeTournamentId.value);

        let change: Change | null = null;

        if (event.ctrlKey && event.key === "z") {
            change = thisHistory.undo();
            if (change) {
                change = reverseChange(change);
            }
        } else if (event.ctrlKey && event.key === "y") {
            change = thisHistory.redo();
        }

        if (change && onChange.value) {
            onChange.value([change]);
        }
    });

    return {
        setOnChange: (tournamentId: string, callback: (change: Change[]) => void) => {
            activeTournamentId.value = tournamentId;
            onChange.value = callback;
        },
        watcher: computed(() => historyWatcher),
        history: computed(() => history),
    };
});
