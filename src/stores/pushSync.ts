import { pushSyncManager, type PushSyncManager } from "@/helpers/share/pushSync";
import type { Tournament } from "@/types/tournament";
import { defineStore } from "pinia";
import { computed, ref, type Ref } from "vue";

export const usePushSyncStore = defineStore("pushSync", () => {
    const nullRef = ref<Tournament | null>(null);

    const pushSync = ref<PushSyncManager>(pushSyncManager(nullRef));

    return {
        start(tournament: Ref<Tournament | null>) {
            pushSync.value.stop();
            pushSync.value = pushSyncManager(tournament);
            pushSync.value.start();
        },
        stop() {
            pushSync.value.stop();
        },
        active: computed(() => pushSync.value.activeSyncs),
    };
});
