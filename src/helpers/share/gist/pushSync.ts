import type { Tournament } from "@/types/tournament";
import { throttle } from "lodash";
import { ref, watch, type Ref } from "vue";
import GistClient from "@/helpers/share/gist";
import { useAccountsStore } from "@/stores/accounts";
import type { IPushSync } from "../pushSync";
import diff from "microdiff";

export const createPushSync = (tournament: Ref<Tournament | null>): IPushSync => {
    const accounts = useAccountsStore();
    let remoteIdentifier = "";
    let stopWatching: (() => void) | null = null;
    let currentTournament: Tournament | null = null;

    const startWatching = () => {
        stopWatching?.();
        stopWatching = watch(
            tournament,
            () => {
                const d = diff(currentTournament ?? {}, tournament.value ?? {});
                if (
                    !tournament.value ||
                    !d.length ||
                    d.every(
                        (change) =>
                            change.path.includes("remote") && change.path.includes("pushDate"),
                    )
                ) {
                    return;
                }
                currentTournament = { ...tournament.value };
                publish();
            },
            { deep: true },
        );
    };

    const publish = throttle(() => {
        if (!tournament.value) {
            return;
        }

        GistClient.create(tournament.value, {
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
