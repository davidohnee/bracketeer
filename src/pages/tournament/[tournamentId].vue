<script setup lang="ts">
import { useTournamentsStore } from "@/stores/tournaments";
import { useRoute } from "vue-router";
import TournamentLayout from "@/layouts/TournamentLayout.vue";
import NotFoundView from "@/pages/[...path].vue";
import SpinningLoader from "@/components/SpinningLoader.vue";
import { ref, watch } from "vue";

const route = useRoute();
const tournaments = useTournamentsStore();
const tournamentId = "tournamentId" in route.params ? (route.params.tournamentId as string) : "";

const tournament = ref(tournaments.getTournamentById(tournamentId));

watch(
    () => tournaments.loading,
    () => {
        tournament.value = tournaments.getTournamentById(tournamentId);
    },
);

definePage({
    redirect: (from) => ({
        name: "/tournament/[tournamentId]/table",
        params: {
            // @ts-expect-error missing typing
            tournamentId: from.params.tournamentId,
        },
    }),
});
</script>

<template>
    <TournamentLayout
        v-if="tournament"
        v-model="tournament"
    />
    <div
        v-else-if="!tournament && tournaments.loading"
        class="loading"
    >
        <SpinningLoader />
    </div>
    <NotFoundView v-else />
</template>
