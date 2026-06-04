import type { Tournament } from "@/types/tournament";
import { throttle } from "lodash";
import { ref, watch, type Ref } from "vue";
import ShareClient from "@/helpers/share";
import { useAccountsStore } from "@/stores/accounts";
import type { IBackgroundSync } from "../backgroundSync";

export const createBackgroundSync = (tournament: Ref<Tournament | null>): IBackgroundSync => {
    const accounts = useAccountsStore();
    let remoteIdentifier = "";
    let stopWatching: (() => void) | null = null;

    const startWatching = () => {
        stopWatching?.();
        stopWatching = watch(
            tournament,
            () => {
                publish();
            },
            { deep: true },
        );
    };

    const publish = throttle(() => {
        if (!tournament.value) {
            return;
        }

        ShareClient.share(tournament.value, {
            updateOnly: true,
            accountResolver: (remote) => accounts.findShareAccount(remote.identifier),
        });
    }, 1000);

    return {
        start(nextIdentifier: string) {
            remoteIdentifier = nextIdentifier;
            startWatching();
        },
        stop() {
            stopWatching?.();
        },
        state: ref("connected"),
        get id() {
            return remoteIdentifier;
        },
    };
};
