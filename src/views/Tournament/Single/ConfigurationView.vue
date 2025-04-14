<script setup lang="ts">
import { randomiseGroupPhaseResults } from '@/helpers';
import type { Match, Tournament } from '@/types/tournament';
import type { TournamentRound } from '../../../types/tournament';
import { updateKnockoutMatches } from '../../../helpers';
import { useTournamentsStore } from '../../../stores/tournaments';
import { useRouter } from 'vue-router';

const props = defineProps<{
    tournament: Tournament;
}>();

const tournaments = useTournamentsStore()
const router = useRouter();

const randomGroupPhase = () => {
    randomiseGroupPhaseResults(props.tournament);
}

const update = () => {
    updateKnockoutMatches(props.tournament);
}

const deleteTournament = () => {
    tournaments.deleteTournament(props.tournament.id);
    router.push({ name: 'tournaments' });
}
</script>

<template>
    <button @click="randomGroupPhase">Randomise Group Phase</button>
    <button @click="update">Update Knockout Matches</button>
    <button @click="deleteTournament">Delete Tournament</button>
</template>