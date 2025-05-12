<script setup lang="ts">
import type { Tournament } from "@/types/tournament";
import { useTournamentsStore } from "@/stores/tournaments";
import TournamentLive from "@/components/TournamentLive.vue";

const props = defineProps<{
    tournament: Tournament;
    readonly?: boolean;
}>();
const tournamentStore = useTournamentsStore();
const tournament = props.readonly
    ? props.tournament
    : tournamentStore.getTournamentById(props.tournament.id)!;
</script>

<template>
    <TournamentLive
        :tournament="tournament"
        :readonly="readonly"
    />
</template>
