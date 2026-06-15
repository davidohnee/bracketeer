import { ref, toRaw } from "vue";
import type { ILiveSync, LiveSyncFactory, LiveStatus } from "../liveSync";
import { type DataConnection, Peer } from "peerjs";
import { fromShare, type Import } from "..";
import type { Tournament } from "@/types/tournament";
import { deepCopy } from "@/helpers/common";

export type P2PChange = {
    type: "CREATE" | "REMOVE" | "CHANGE";
    path: string[];
    value?: unknown;
};

export const applyP2PChanges = (tournament: { value: Tournament | null }, changes: P2PChange[]) => {
    if (!tournament.value) {
        return;
    }

    const rawTournament = toRaw(tournament.value) as unknown as Record<string, unknown>;

    for (const change of changes) {
        if (change.type === "REMOVE") {
            let target = rawTournament;
            for (let i = 0; i < change.path.length - 1; i++) {
                target = target[change.path[i]] as Record<string, unknown>;
            }
            delete target[change.path.at(-1)!];
        } else if (change.type === "CREATE" || change.type === "CHANGE") {
            let target = rawTournament;
            for (let i = 0; i < change.path.length - 1; i++) {
                if (!target[change.path[i]]) {
                    target[change.path[i]] = {};
                }
                target = target[change.path[i]] as Record<string, unknown>;
            }
            target[change.path.at(-1)!] = change.value;
        }
    }

    tournament.value = deepCopy(rawTournament) as unknown as Tournament;
};

type PullContext = {
    sync: IP2PLiveSync;
    tag: string;
    tournament: { value: Tournament | null };
    settled: { value: boolean };
    resolve: (result: Import) => void;
};

const createPullResult = (tournament: Tournament): Import => ({
    type: "success",
    tournament,
    author: "unknown",
    link: "",
    date: new Date(),
});

const schedulePullReconnect = (context: PullContext, connect: () => void) => {
    if (context.settled.value) {
        return;
    }

    setTimeout(() => {
        if (context.sync._peer.open) {
            connect();
            return;
        }

        context.sync._peer.on("open", connect);
    }, 1000);
};

const handlePullData = (context: PullContext) => (data: unknown) => {
    const message = data as { type: "full" | "diff"; data: unknown };

    if (message.type === "full") {
        context.tournament.value = message.data as Tournament;
        context.sync.status.value.lastUpdate = new Date();
        if (context.sync.onChange && context.tournament.value) {
            context.sync.onChange(context.tournament.value);
        }

        if (!context.settled.value && context.tournament.value) {
            context.settled.value = true;
            context.resolve(createPullResult(context.tournament.value));
        }
        return;
    }

    if (message.type === "diff") {
        context.sync._onDiff(message.data as P2PChange[]);
        context.sync.status.value.lastUpdate = new Date();
        if (context.sync.onChange && context.tournament.value) {
            context.sync.onChange(context.tournament.value);
        }
    }
};

const fireError = (context: PullContext, error: Import["error"]) => {
    context.sync.error.value = error;
    context.sync.onError?.(error);
};

const connectPullPeer = (context: PullContext) => {
    const timeout = setTimeout(() => {
        fireError(context, "no-connection");
        context.sync._connection?.close();
        schedulePullReconnect(context, () => connectPullPeer(context));
    }, 10 * 1000);

    context.sync._connection = context.sync._peer.connect(context.tag);
    context.sync._connection.on("open", () => {
        clearTimeout(timeout);
        context.sync.error.value = null;
        context.sync._connection?.on?.("data", handlePullData(context));
    });

    context.sync._connection.on("error", () => {
        clearTimeout(timeout);
        fireError(context, "no-connection");
        schedulePullReconnect(context, () => connectPullPeer(context));
    });

    context.sync._connection.on("close", () => {
        clearTimeout(timeout);
        fireError(context, "no-connection");
        schedulePullReconnect(context, () => connectPullPeer(context));
    });
};

interface IP2PLiveSync extends ILiveSync {
    _peer: Peer;
    _connection: DataConnection | null;
    _onDiff: (diff: P2PChange[]) => Promise<void>;
}

export const createLiveSync: LiveSyncFactory<IP2PLiveSync> = (tournament) => {
    return {
        _connection: null,
        _peer: new Peer(),
        error: ref(null),
        status: ref<LiveStatus>({
            type: "live",
            lastUpdate: new Date(),
        }),
        async _onDiff(diff: P2PChange[]) {
            applyP2PChanges(tournament, diff);
        },
        async pull(identifier) {
            console.log("[P2P] Starting live sync pull with identifier:", identifier);

            if (this._connection) {
                this._connection.close();
                this._connection = null;
            }
            if (this._peer.destroyed) {
                this._peer = new Peer();
            }
            const { tag } = fromShare(identifier);

            return await new Promise((resolve) => {
                const settled = { value: false };
                const context: PullContext = {
                    sync: this,
                    tag,
                    tournament,
                    settled,
                    resolve,
                };

                const connect = () => connectPullPeer(context);

                if (this._peer.open) {
                    connect();
                } else {
                    this._peer.on("open", connect);
                }
            });
        },
        async stop() {
            console.log("[P2P] Stopping live sync");
            this._connection?.close();
            this._connection = null;
            this._peer.destroy();
        },
    };
};
