import type { Tournament } from "@/types/tournament";
import { ref, watch, type Ref } from "vue";
import { getModeFromIdentifier } from ".";
import { createPushSync as createGistPushSync } from "./gist/pushSync";
import { createPushSync as createP2PPushSync } from "./p2p/pushSync";

export interface IPushSync {
    start: (identifier: string) => void;
    stop: () => void;
    state: Ref<"connected" | "connecting" | "disconnected" | "no-lock" | "error">;
    id: string;
}

export type PushSyncFactory = (tournament: Ref<Tournament | null>) => IPushSync;

const getPushSyncFactory = (identifier: string): PushSyncFactory => {
    const mode = getModeFromIdentifier(identifier);
    if (mode === "gist") {
        return createGistPushSync;
    } else if (mode === "p2p") {
        return createP2PPushSync;
    }
    throw new Error("Not supported");
};

export type PushSyncManager = {
    start: () => void;
    stop: () => void;
    activeSyncs: IPushSync[];
};

export const pushSyncManager = (tournament: Ref<Tournament | null>): PushSyncManager => {
    const syncInstances: Ref<IPushSync[]> = ref([]);
    let activeIdentifiers: Set<string> = new Set();
    let stopWatching: (() => void) | null = null;

    const syncInstanceById = (identifier: string): IPushSync | undefined => {
        return syncInstances.value.find((instance) => instance.id === identifier);
    };

    const startSync = (identifier: string) => {
        if (syncInstanceById(identifier)) {
            return;
        }
        try {
            const factory = getPushSyncFactory(identifier);
            const instance = factory(tournament);
            instance.start(identifier);
            syncInstances.value = [...syncInstances.value, instance];
        } catch (error) {
            console.error("Failed to start push sync for identifier:", identifier, error);
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
            activeIdentifiers = new Set();
        },
        get activeSyncs() {
            return syncInstances.value;
        },
    };
};
