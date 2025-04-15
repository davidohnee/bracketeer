<script setup lang="ts">
import { computed } from 'vue';
import { generateTable } from '@/helpers';
import { type Tournament } from '@/types/tournament';
import TeamTable from '@/components/TeamTable.vue';

const props = defineProps<{
    tournament: Tournament;
}>();

const teamScores = computed(() => {
    return generateTable(props.tournament);
});
</script>

<template>
    <TeamTable :table="teamScores" :tournament="tournament" />
</template>
