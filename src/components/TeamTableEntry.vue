<script setup lang="ts">
import { type Team, type TeamScore, type TournamentConfig } from "../types/tournament";
import { calculateDifference, calculateTeamPoints } from "../helpers";
import { computed } from "vue";

const props = defineProps<{
    score: TeamScore;
    rank: number;
    config: TournamentConfig;
    teams: Team[];
}>();

const teamName = computed(() => {
    const team = props.teams.find((t) => t.id === props.score.team.id);
    return team ? team.name : "";
});
</script>

<template>
    <div
        class="team"
        :class="{ progress: rank <= config.knockoutTeams }"
    >
        <div class="rank">{{ rank }}</div>
        <div class="name">{{ teamName }}</div>
        <div class="mp">{{ score.wins + score.draws + score.losses }}</div>
        <div class="w">{{ score.wins }}</div>
        <div class="d">{{ score.draws }}</div>
        <div class="l">{{ score.losses }}</div>
        <div class="for-against">{{ score.points.for }} - {{ score.points.against }}</div>
        <div class="gd">{{ calculateDifference(score) }}</div>
        <div class="pts">{{ calculateTeamPoints(score) }}</div>
    </div>
</template>
