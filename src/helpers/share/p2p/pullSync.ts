import { ref, toRaw } from "vue";
import type { IPullSync, PullSyncFactory, LiveStatus } from "../pullSync";
import { type DataConnection, Peer } from "peerjs";
import { type Import } from "..";
import P2PClient from ".";
import type { AnyTournament, Tournament } from "@/types/tournament";
import { applyChanges, type Change } from "@/helpers/history/common";
import { deepCopy } from "@/helpers/common";
import { tournamentFromJson } from "@/helpers";

type PullContext = {
    sync: IP2PPullSync;
    peerId: string;
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
    if (context.sync._connection?.open) {
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
        context.tournament.value = tournamentFromJson(message.data as AnyTournament);
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
        context.sync._onDiff(message.data as Change[]);
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

    context.sync._connection = context.sync._peer.connect(context.peerId);
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

interface IP2PPullSync extends IPullSync {
    _peer: Peer;
    _connection: DataConnection | null;
    _onDiff: (diff: Change[]) => Promise<void>;
}

export const createPullSync: PullSyncFactory<IP2PPullSync> = (tournament) => {
    return {
        _connection: null,
        _peer: new Peer(),
        error: ref<Import["error"] | null>(null),
        status: ref<LiveStatus>({
            type: "live",
            lastUpdate: new Date(),
        }),
        async _onDiff(diff: Change[]) {
            if (!tournament.value) {
                return;
            }

            const rawTournament = toRaw(tournament.value) as unknown as Record<string, unknown>;

            applyChanges(rawTournament, diff);

            tournament.value = tournamentFromJson(
                deepCopy(rawTournament) as unknown as AnyTournament,
            );
        },
        async pull(identifier) {
            console.log("[P2P] Starting pull sync with identifier:", identifier);

            if (this._connection) {
                this._connection.close();
                this._connection = null;
            }
            if (this._peer.destroyed) {
                this._peer = new Peer();
            }
            const { peerId } = P2PClient.fromShare(identifier);

            return await new Promise((resolve) => {
                const settled = { value: false };
                const context: PullContext = {
                    sync: this,
                    peerId,
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
            console.log("[P2P] Stopping pull sync");
            this._connection?.close();
            this._connection = null;
            this._peer.destroy();
        },
    };
};
