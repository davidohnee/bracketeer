<!--
  - Copyright (c) 2023, reAudioPlayer ONE.
  - Licenced under the GNU General Public License v3.0
  -->

<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { Tournament } from "@/types/tournament";
import { pull } from "@/share";
import { useTournamentsStore } from "@/stores/tournaments";
import ViewerView from "./ViewerView.vue";

type Error = null | "not-found" | "not-allowed";

const route = useRoute();
const router = useRouter();
const tournaments = useTournamentsStore();

const who = ref("");
const what = ref<Tournament[]>([]);
const error = ref<Error>(null);

onMounted(async () => {
    const base64 = route.params.id as string;
    const importObject = await pull(base64);

    if (importObject.error) {
        error.value = importObject.error;
        return;
    }

    what.value = [importObject.tournament];
    who.value = importObject.author ?? "(unknown)";
});

const confirm = async () => {
    const tournament = what.value[0];
    tournament.remote ??= [];
    tournament.remote.push({
        identifier: route.params.id as string,
    });

    await tournaments.add(tournament);
    router.push({
        name: "tournament",
        params: { tournamentId: tournament.id },
    });
};

const viewOnly = () => {
    router.push({
        name: "view.table",
        params: { tournamentId: what.value[0].id },
    });
};
</script>
<template>
    <div class="import">
        <div
            class="import-notice"
            v-if="what.length"
        >
            Do you want to import this tournament?
            <div class="actions">
                <button
                    class="danger secondary"
                    @click="viewOnly"
                >
                    No
                </button>
                <button @click="confirm">Yes</button>
            </div>
        </div>
        <ViewerView />
    </div>
</template>
<style scoped>
.import {
    display: flex;
    flex-direction: column;
    gap: 1em;
}

.import-notice {
    background: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: 1em;
    padding: 1em;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 1em;
}

.actions {
    display: flex;
    gap: 1em;
}

@media (max-width: 768px) {
    .import-notice {
        flex-direction: column;
        align-items: stretch;
    }

    .actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
    }
}
</style>
