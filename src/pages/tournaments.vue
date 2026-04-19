<script setup lang="ts">
import EmptyTournamentListView from "@/components/EmptyTournamentListView.vue";
import TournamentList from "@/components/TournamentList.vue";
import { useTournamentsStore } from "@/stores/tournaments";

const tournaments = useTournamentsStore();
</script>
<template>
    <div class="body-container">
        <h1>Tournaments</h1>
        <TournamentList v-if="tournaments.all.length" />
        <EmptyTournamentListView v-else />
    </div>
</template>
