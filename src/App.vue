<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { generateKnockoutBracket, generateGroupPhase, generateNTeams, generateTable, generateRandomGroupPhaseResults } from './helpers';
import { type Match, type TournamentConfig, type TournamentRound } from './types/tournament';
import TeamTableEntry from './components/TeamTableEntry.vue';

const matchesPlayed = ref<Match[]>([]);

const teamScores = computed(() => {
  return generateTable(matchesPlayed.value)
});
const teams = computed(() => {
  return teamScores.value.map(x => x.team);
});

const groupPhase = ref<TournamentRound[]>([]);
const knockoutBracket = ref<TournamentRound[]>([]);

onMounted(() => {
  const teams = generateNTeams(40);

  const config = {
    knockoutTeams: 8,
    rounds: 6,
    breakDuration: 2,
    knockoutBreakDuration: 5,
    matchDuration: 12,
    courts: 15,
    startTime: new Date('2025-04-26T18:30:00'),
  } as TournamentConfig

  knockoutBracket.value = generateKnockoutBracket(config);
  groupPhase.value = generateGroupPhase(teams, config);

  matchesPlayed.value = generateRandomGroupPhaseResults(groupPhase.value)
})
</script>

<template>
  <div class="table">
    <TeamTableEntry v-for="(score, index) in teamScores" :key="index" :score="score" :rank="index + 1" />
  </div>
</template>

<style scoped>
.table {
  width: 100%;
}
</style>
