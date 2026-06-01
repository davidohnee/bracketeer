import { ref, toRaw } from "vue";
import type { ILiveSync, LiveSyncFactory, LiveStatus } from "../liveSync";
import { type DataConnection, Peer } from "peerjs";
import { fromShare } from "..";
import type { Tournament } from "@/types/tournament";

type Change = {
    type: "CREATE" | "REMOVE" | "CHANGE";
    path: string[];
    value?: unknown;
};

interface IP2PLiveSync extends ILiveSync {
    _peer: Peer;
    _connection: DataConnection | null;
    _onDiff: (diff: Change[]) => Promise<void>;
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
        async _onDiff(diff: Change[]) {
            const rawTournament = toRaw(tournament.value) as unknown as Record<string, unknown>;

            for (const change of diff) {
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

            tournament.value = { ...rawTournament } as unknown as Tournament;
        },
        async pull(identifier) {
            if (this._connection) {
                this._connection.close();
                this._connection = null;
            }
            if (this._peer.destroyed) {
                this._peer = new Peer();
            }
            const { tag } = fromShare(identifier);

            const connect = () => {
                this._connection = this._peer.connect(tag);
                this._connection.on("open", () => {
                    this._connection?.on?.("data", (data) => {
                        const message = data as { type: "full" | "diff"; data: unknown };
                        if (message.type === "full") {
                            tournament.value = message.data as Tournament;
                        } else if (message.type === "diff") {
                            this._onDiff(message.data as Change[]);
                        }
                        if (this.onChange && tournament.value) {
                            this.onChange(tournament.value);
                        }
                        this.status.value.lastUpdate = new Date();
                    });
                });

                this._connection.on("error", reconnect);

                this._connection.on("close", reconnect);
            };

            const reconnect = () => {
                setTimeout(() => {
                    if (this._peer.open) {
                        connect();
                    } else {
                        this._peer.on("open", connect);
                    }
                }, 1000);
            };

            if (this._peer.open) {
                connect();
            } else {
                this._peer.on("open", connect);
            }

            return {
                type: "success",
                tournament: tournament.value!,
                author: "unknown",
                link: "",
                date: new Date(),
            };
        },
        async stop() {
            this._connection?.close();
            this._connection = null;
            this._peer.destroy();
        },
    };
};
