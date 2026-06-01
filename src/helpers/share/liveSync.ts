import type { Tournament } from "@/types/tournament";
import type { Ref } from "vue";
import { fromShare, type Import } from ".";
import { createLiveSync as createGistLiveSync } from "./gist/liveSync";
import { createLiveSync as createP2PLiveSync } from "./p2p/liveSync";

interface ISyncStatus {
    type: "live" | "interval";
}

export interface IntervalStatus extends ISyncStatus {
    type: "interval";
    lastUpdate: Date;
}

export interface LiveStatus extends ISyncStatus {
    type: "live";
    lastUpdate: Date;
}

type SyncStatus = IntervalStatus | LiveStatus;

export interface ILiveSync {
    pull: (identifier: string) => Promise<Import>;
    stop: () => void;
    onChange?: (tournament: Tournament) => void;
    error: Ref<Import["error"] | null>;
    status: Ref<SyncStatus>;
}

export type LiveSyncFactory<T extends ILiveSync> = (tournament: Ref<Tournament | null>) => T;

export const getLiveSyncFactory = (identifier: string): LiveSyncFactory<ILiveSync> => {
    const { mode } = fromShare(identifier);
    if (mode === "gist") {
        return createGistLiveSync;
    } else if (mode === "p2p") {
        return createP2PLiveSync;
    }
    throw new Error("Not supported");
};
