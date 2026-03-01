<script setup lang="ts">
import { getProgression, hasByes } from "@/helpers/matchplan/knockoutPhase";
import { calculateDifference, calculateTeamPoints } from "@/helpers/scoring";
import {
    type GroupTournamentPhase,
    type KnockoutTournamentPhase,
    type TeamScore,
    type Tournament,
} from "@/types/tournament";
import { computed } from "vue";

const props = defineProps<{
    score: TeamScore;
    rank: number;
    phaseId: string;
    tournament: Tournament;
    teamMatchesRouteName: string;
}>();

const teamName = computed(() => {
    const team = props.tournament.teams.find((t) => t.id === props.score.team.id);
    return team ? team.name : "";
});

const progress = computed(() => {
    const phaseI = props.tournament.phases.findIndex((p) => p.id === props.phaseId);
    const currentPhase = props.tournament.phases[phaseI] as GroupTournamentPhase;
    const nextPhase = props.tournament.phases[phaseI + 1] as KnockoutTournamentPhase;
    const progression = getProgression(nextPhase, props.tournament);

    const groupCount = currentPhase.groups?.length ?? 1;

    const playInPerGroup = progression.playIn / groupCount;
    const byePerGroup = progression.bye / groupCount;
    const progressionPerGroup = progression.total / groupCount;

    if (hasByes(nextPhase, props.tournament)) {
        if (props.rank <= byePerGroup) {
            return "progress";
        } else if (props.rank <= byePerGroup + playInPerGroup) {
            return "play-in";
        }
    } else if (props.rank <= progressionPerGroup) {
        return "progress";
    }
    return "none";
});
</script>

<template>
    <router-link
        :to="{
            name: teamMatchesRouteName,
            query: { team: score.team.id },
        }"
        class="team ghost"
        :class="progress"
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
