import type { IRemote, Tournament } from "@/types/tournament";
import type { Ref } from "vue";
import { getModeFromIdentifier, type Import } from ".";
import { createPullSync as createGistPullSync } from "./gist/pullSync";
import { createPullSync as createP2PPullSync } from "./p2p/pullSync";

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

export interface IPullSync {
    pull: (identifier: string) => Promise<Import>;
    stop: () => void;
    onChange?: (tournament: Tournament) => void;
    onPreferOther?: (remote: IRemote) => void;
    onError?: (error: Import["error"]) => void;
    error: Ref<Import["error"] | null>;
    status: Ref<SyncStatus>;
}

export type PullSyncFactory<T extends IPullSync> = (tournament: Ref<Tournament | null>) => T;

export const getPullSyncFactory = (identifier: string): PullSyncFactory<IPullSync> => {
    const mode = getModeFromIdentifier(identifier);
    if (mode === "gist") {
        return createGistPullSync;
    } else if (mode === "p2p") {
        return createP2PPullSync;
    }
    throw new Error("Not supported");
};
