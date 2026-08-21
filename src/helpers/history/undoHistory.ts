import type { ITournamentWatcher } from "@/stores/persistence/tournamentWatcher";
import { changesAreReverse, type Change } from "./common";
import { computed, ref, type ComputedRef } from "vue";

const MAX_HISTORY_LENGTH = 100;

type HistoryStack = Change[];

export interface History {
    undo: () => Change | null;
    redo: () => Change | null;
    addChange: (change: Change) => void;
    canUndo: ComputedRef<boolean>;
    canRedo: ComputedRef<boolean>;
}

export interface HistoryManager {
    getHistory: (tournamentId: string) => History;
}

export const createHistory = (): History => {
    const stack: HistoryStack = [];
    const index = ref(-1);

    const undo = () => {
        if (index.value >= 0) {
            const change = stack[index.value];
            index.value--;
            return change;
        }
        return null;
    };

    const redo = () => {
        if (index.value < stack.length - 1) {
            index.value++;
            return stack[index.value];
        }
        return null;
    };

    const addChange = (change: Change) => {
        if (index.value + 1 < stack.length && changesAreReverse(change, stack[index.value + 1])) {
            return;
        }

        // If we are not at the end of the stack, remove all changes after the current index
        if (index.value < stack.length - 1) {
            stack.splice(index.value + 1);
        }
        if (stack.length >= MAX_HISTORY_LENGTH) {
            stack.shift();
        }
        stack.push(change);
        index.value++;
    };

    return {
        undo,
        redo,
        addChange,
        canUndo: computed(() => index.value >= 0),
        canRedo: computed(() => index.value < stack.length - 1),
    };
};

export const createHistoryManager = () => {
    const histories: Record<string, History> = {};

    const getHistory = (tournamentId: string): History => {
        if (!histories[tournamentId]) {
            histories[tournamentId] = createHistory();
        }
        return histories[tournamentId];
    };

    return {
        getHistory,
    };
};

export const createHistoryWatcher = (historyManager: HistoryManager): ITournamentWatcher => {
    return {
        onTournamentChange: (tournament, changes) => {
            const history = historyManager.getHistory(tournament.id);
            for (const change of changes) {
                if (change.path.length) {
                    history.addChange(change);
                }
            }
        },
    };
};
