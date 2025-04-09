<script setup lang="ts">
import { type TeamScore } from '../types/tournament';
import { calculateDifference, calculateTeamPoints } from '../helpers';

defineProps<{ score: TeamScore, rank: number }>()
</script>

<template>
  <div class="team">
    <div class="tank">{{ rank }}</div>
    <div class="name">{{ score.team.name }}</div>
    <div class="mp">{{ score.wins + score.draws + score.losses }}</div>
    <div class="w">{{ score.wins }}</div>
    <div class="d">{{ score.draws }}</div>
    <div class="l">{{ score.losses }}</div>
    <div class="for-against">{{ score.points.for }} - {{ score.points.against }}</div>
    <div class="gd">{{ calculateDifference(score) }}</div>
    <div class="pts">{{ calculateTeamPoints(score) }}</div>
  </div>
</template>

<style scoped>
.team {
  display: grid;
  grid-template-columns: 2ch 1fr repeat(4, 3ch) 7ch 4ch 4ch;
  gap: 0.5em;
  width: 100%;

  & div {
    text-align: center;
  }

  & .name {
    text-align: left;
    font-weight: bold;
  }
}
</style>
