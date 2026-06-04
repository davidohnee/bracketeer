import type { Tournament } from "@/types/tournament";
import { ref, watch, type Ref } from "vue";
import { fromShare } from ".";
import { createBackgroundSync as createGistBackgroundSync } from "./gist/backgroundSync";
import { createBackgroundSync as createP2PBackgroundSync } from "./p2p/backgroundSync";

export interface IBackgroundSync {
    start: (identifier: string) => void;
    stop: () => void;
    state: Ref<"connected" | "connecting" | "disconnected" | "no-lock" | "error">;
    id: string;
}

export type BackgroundSyncFactory = (tournament: Ref<Tournament | null>) => IBackgroundSync;

const getBackgroundSyncFactory = (identifier: string): BackgroundSyncFactory => {
    const { mode } = fromShare(identifier);
    if (mode === "gist") {
        return createGistBackgroundSync;
    } else if (mode === "p2p") {
        return createP2PBackgroundSync;
    }
    throw new Error("Not supported");
};

export type BackgroundSyncManager = {
    start: () => void;
    stop: () => void;
    activeSyncs: Ref<IBackgroundSync[]>;
};

export const backgroundSyncManager = (
    tournament: Ref<Tournament | null>,
): BackgroundSyncManager => {
    const syncInstances: Ref<IBackgroundSync[]> = ref([]);
    let activeIdentifiers: Set<string> = new Set();
    let stopWatching: (() => void) | null = null;

    const syncInstanceById = (identifier: string): IBackgroundSync | undefined => {
        return syncInstances.value.find((instance) => instance.id === identifier);
    };

    const startSync = (identifier: string) => {
        if (syncInstanceById(identifier)) {
            return;
        }
        try {
            const factory = getBackgroundSyncFactory(identifier);
            const instance = factory(tournament);
            instance.start(identifier);
            syncInstances.value = [...syncInstances.value, instance];
        } catch (error) {
            console.error("Failed to start background sync for identifier:", identifier, error);
        }
    };

    const stopSync = (identifier: string) => {
        const instance = syncInstanceById(identifier);
        if (instance) {
            instance.stop();
            syncInstances.value = syncInstances.value.filter((i) => i !== instance);
        }
    };

    const startWatching = () => {
        stopWatching?.();
        stopWatching = watch(
            tournament,
            (next) => {
                const currentIdentifiers = new Set(next?.remote?.map((r) => r.identifier) || []);

                // Start sync for new identifiers
                currentIdentifiers.forEach((identifier) => {
                    if (!activeIdentifiers.has(identifier)) {
                        startSync(identifier);
                    }
                });

                // Stop sync for removed identifiers
                activeIdentifiers.forEach((identifier) => {
                    if (!currentIdentifiers.has(identifier)) {
                        stopSync(identifier);
                    }
                });

                activeIdentifiers = currentIdentifiers;
            },
            { deep: true, immediate: true },
        );
    };

    return {
        start() {
            startWatching();
        },
        stop() {
            stopWatching?.();
            syncInstances.value.forEach((instance) => instance.stop());
            syncInstances.value = [];
        },
        activeSyncs: syncInstances,
    };
};
