import { ref } from "vue";
import type { IntervalStatus, IPullSync, PullSyncFactory } from "../pullSync";
import { gistShare } from "./gist";
import { findRemoteWithMode } from "..";

interface IGistPullSync extends IPullSync {
    _timer: ReturnType<typeof setInterval> | null;
    _updateTask: (identifier: string) => Promise<void>;
}

export const createPullSync: PullSyncFactory<IGistPullSync> = (tournament) => {
    return {
        _timer: null,
        error: ref(null),
        status: ref<IntervalStatus>({
            type: "interval",
            lastUpdate: new Date(),
        }),
        async _updateTask(identifier: string) {
            const importObject = await gistShare.pull(identifier);

            if (this.status.value?.type === "interval") {
                const now = new Date();
                const diff = now.getTime() - this.status.value.lastUpdate.getTime();
                if (diff >= 1000 * 60 * 5) {
                    this.status.value.lastUpdate = new Date();
                    sessionStorage.setItem(identifier, this.status.value.lastUpdate.toString());
                }
            } else {
                this.status.value.lastUpdate = new Date();
                sessionStorage.setItem(identifier, this.status.value.lastUpdate.toString());
            }

            if (importObject?.error) {
                this.error.value = importObject.error;
                this.onError?.(importObject.error);
                return;
            }

            tournament.value = importObject.tournament;
            if (this.onChange) {
                this.onChange(importObject.tournament);
            }
        },
        async pull(identifier) {
            console.log("[Gist] Starting pull sync with identifier:", identifier);

            const cachedTime = sessionStorage.getItem(identifier);
            if (cachedTime) {
                this.status.value.lastUpdate = new Date(cachedTime);
            }

            await this._updateTask(identifier);
            if (this._timer) {
                clearInterval(this._timer);
            }
            if (this.error.value || !tournament.value) {
                return {
                    type: "error",
                    error: this.error.value || "not-supported",
                };
            }
            if (findRemoteWithMode(tournament.value, "p2p")) {
                this.onPreferOther?.(findRemoteWithMode(tournament.value!, "p2p")!);
            }
            this._timer = setInterval(() => this._updateTask(identifier), 1000 * 60 * 5);
            return {
                type: "success",
                tournament: tournament.value,
                author: "unknown",
                link: "",
                date: new Date(),
            };
        },
        async stop() {
            console.log("[Gist] Stopping pull sync");
            if (this._timer) {
                clearInterval(this._timer);
                this._timer = null;
            }
        },
    };
};
