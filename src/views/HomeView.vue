<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useTournamentsStore } from '../stores/tournaments';

const router = useRouter();

const create = () => {
    const tournaments = useTournamentsStore();
    tournaments.create(36, {
        breakDuration: 2,
        knockoutBreakDuration: 5,
        courts: 15,
        rounds: 6,
        knockoutTeams: 8,
        startTime: new Date("2025-04-26T18:30:00"),
        matchDuration: 12
    });

    router.push({
        name: 'tournament',
        params: {
            tournamentId: tournaments.all[tournaments.all.length - 1].id
        }
    });
};
</script>

<template>
    <button @click="create">Create</button>
</template>