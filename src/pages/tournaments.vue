<script setup lang="ts">
import EmptyTournamentListView from "@/components/EmptyTournamentListView.vue";
import TournamentList from "@/components/TournamentList.vue";
import { useTournamentsStore } from "@/stores/tournaments";

const tournaments = useTournamentsStore();
</script>
<template>
    <div class="body-container">
        <h1>Tournaments</h1>
        <div
            class="loading"
            v-if="tournaments.loading"
        >
            <SpinningLoader />
        </div>
        <TournamentList v-else-if="tournaments.all.length" />
        <EmptyTournamentListView v-else />
    </div>
</template>
