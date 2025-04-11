<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { generateKnockoutBracket, generateGroupPhase, generateNTeams, generateTable, generateRandomGroupPhaseResults } from './helpers';
import { type Match, type TournamentConfig, type TournamentRound } from './types/tournament';
import TeamTable from './components/TeamTable.vue';
import MatchCard from './components/MatchCard.vue';
import { useTournamentsStore } from './stores/tournaments';

const groupMatches = computed(() => {
  return tournaments.all[0]?.groupPhase?.flatMap(round => round.matches) ?? [];
});

const teamScores = computed(() => {
  return generateTable(groupMatches.value)
});

const knockoutBracket = computed<TournamentRound[]>(() => {
  return tournaments.all[0]?.knockoutPhase ?? [];
});

const tournaments = useTournamentsStore();

onMounted(() => {
  /*
  const config = {
    knockoutTeams: 8,
    rounds: 6,
    breakDuration: 2,
    knockoutBreakDuration: 5,
    matchDuration: 12,
    courts: 15,
    startTime: new Date('2025-04-26T18:30:00'),
  } as TournamentConfig

  tournaments.create(36, config);
  */
})
</script>

<template>
  <TeamTable :table="teamScores" />
  <div class="matches">
    <MatchCard v-for="(match, index) in groupMatches" :key="index" :match="match" />
  </div>

  <div class="round" v-for="round in knockoutBracket" :key="round.id">
    <h3 class="round-title">{{ round.name }}</h3>
    <div class="matches">
      <MatchCard v-for="(match, index) in round.matches" :key="index" :match="match" />
    </div>
  </div>
</template>

<style scoped>
.table {
  width: 100%;
}

.matches {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 1em;
}
</style>
