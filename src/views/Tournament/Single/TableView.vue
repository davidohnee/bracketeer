<script setup lang="ts">
import { computed } from 'vue';
import { generateTable } from '@/helpers';
import { type Tournament } from '@/types/tournament';
import TeamTable from '@/components/TeamTable.vue';

const props = defineProps<{
    tournament: Tournament;
}>();

const groupMatches = computed(() => {
    return props.tournament.groupPhase.flatMap(round => round.matches) ?? [];
});

const teamScores = computed(() => {
    return generateTable(groupMatches.value, props.tournament.teams);
});
</script>

<template>
    <TeamTable :table="teamScores" :config="tournament.config" />
</template>
