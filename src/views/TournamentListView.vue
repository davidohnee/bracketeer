<script setup lang="ts">
import EmptyTournamentListView from "@/components/EmptyTournamentListView.vue";
import TournamentList from "@/components/TournamentList.vue";
import { useTournamentsStore } from "@/stores/tournaments";

const tournaments = useTournamentsStore();
</script>
<template>
    <div>
        <h1>Tournaments</h1>
        <TournamentList v-if="tournaments.all.length" />
        <EmptyTournamentListView v-else />
    </div>
</template>

<style scoped>
@media (max-width: 768px) {
    h1 {
        place-self: center;
    }
}
</style>
