<script setup lang="ts">
import { type TeamScore, type Tournament } from "../types/tournament";
import { calculateDifference, calculateTeamPoints } from "../helpers";
import { computed } from "vue";

const props = defineProps<{
    score: TeamScore;
    rank: number;
    tournament: Tournament;
    teamMatchesRouteName: string;
}>();

const teamName = computed(() => {
    const team = props.tournament.teams.find((t) => t.id === props.score.team.id);
    return team ? team.name : "";
});
</script>

<template>
    <router-link
        :to="{
            name: teamMatchesRouteName,
            query: { team: score.team.id },
        }"
        class="team"
        :class="{ progress: rank <= tournament.config.knockoutTeams }"
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
    </router-link>
</template>

<style scoped>
a {
    color: unset;
}

.name {
    text-overflow: ellipsis;
    overflow: hidden;
}
</style>
