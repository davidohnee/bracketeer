<script setup lang="ts">
import { computed } from 'vue';
import { generateTable } from '@/helpers';
import { type TournamentRound } from '@/types/tournament';
import TeamTable from '@/components/TeamTable.vue';

const props = defineProps<{
    tournament: TournamentRound;
}>();

const groupMatches = computed(() => {
    return props.tournament.groupPhase.flatMap(round => round.matches) ?? [];
});

const teamScores = computed(() => {
    return generateTable(groupMatches.value)
});
</script>

<template>
    <TeamTable :table="teamScores" :config="tournament.config" />
</template>
