<script setup lang="ts">
import { type TeamScore } from '../types/tournament';
import { calculateDifference, calculateTeamPoints } from '../helpers';

defineProps<{ score: TeamScore, rank: number }>()
</script>

<template>
  <div class="team">
    <div class="rank">{{ rank }}</div>
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
