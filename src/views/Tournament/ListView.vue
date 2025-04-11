<script setup lang="ts">
import { useTournamentsStore } from '../../stores/tournaments';

const tournaments = useTournamentsStore();
</script>
<template>
    <div>
        <h1>Tournaments</h1>
        <div class="tournament-list">
            <div v-for="(tournament, index) in tournaments.all" :key="index" class="tournament-item">
                <router-link :to="{ name: 'tournament', params: { tournamentId: tournament.id } }">
                    {{ tournament.name }}
                </router-link>
            </div>
        </div>
    </div>
</template>