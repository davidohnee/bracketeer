<script setup lang="ts">
import { useTournamentsStore } from "@/stores/tournaments";
import { useRoute } from "vue-router";
import TournamentLayout from "@/layouts/TournamentLayout.vue";
import NotFoundView from "@/views/NotFoundView.vue";

const route = useRoute();
const tournaments = useTournamentsStore();
const tournamentId = route.params.tournamentId as string;

const tournament = tournaments.getTournamentById(tournamentId);
</script>

<template>
    <TournamentLayout
        v-if="tournament"
        v-model="tournament"
    />
    <NotFoundView v-else />
</template>
