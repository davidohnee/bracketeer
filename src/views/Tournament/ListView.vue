<script setup lang="ts">
import { useRouter } from "vue-router";
import { useTournamentsStore } from "../../stores/tournaments";

const tournaments = useTournamentsStore();
const router = useRouter();
</script>
<template>
    <div>
        <h1>Tournaments</h1>
        <button @click="router.push('/create')">Create Tournament</button>
        <div class="tournament-list">
            <div
                v-for="(tournament, index) in tournaments.all"
                :key="index"
                class="tournament-item"
            >
                <router-link :to="{ name: 'tournament', params: { tournamentId: tournament.id } }">
                    {{ tournament.name }}
                </router-link>
            </div>
        </div>
    </div>
</template>
