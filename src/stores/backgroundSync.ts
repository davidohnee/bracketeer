import { backgroundSyncManager, type BackgroundSyncManager } from "@/helpers/share/backgroundSync";
import type { Tournament } from "@/types/tournament";
import { defineStore } from "pinia";
import { computed, ref, type Ref } from "vue";

export const useBackgroundSyncStore = defineStore("backgroundSync", () => {
    const nullRef = ref<Tournament | null>(null);

    const backgroundSync = ref<BackgroundSyncManager>(backgroundSyncManager(nullRef));

    return {
        start(tournament: Ref<Tournament | null>) {
            backgroundSync.value.stop();
            backgroundSync.value = backgroundSyncManager(tournament);
            backgroundSync.value.start();
        },
        stop() {
            backgroundSync.value.stop();
        },
        active: computed(() => backgroundSync.value.activeSyncs),
    };
});
