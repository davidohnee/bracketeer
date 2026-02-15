<script setup lang="ts">
import { calculateDifference, calculateTeamPoints } from "@/helpers/scoring";
import { type GroupTournamentPhase, type TeamScore, type Tournament } from "@/types/tournament";
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
    let proceedingTeams = 0;
    let byeTeams = 0;
    const phaseI = props.tournament.phases.findIndex((p) => p.id === props.phaseId);

    if (phaseI < props.tournament.phases.length - 1) {
        const nextPhase = props.tournament.phases[phaseI + 1]!;

        if (nextPhase.teamCount) {
            const currentPhase = props.tournament.phases[phaseI] as GroupTournamentPhase;
            const groupCount = currentPhase.groups?.length ?? 1;
            proceedingTeams = nextPhase.teamCount / groupCount;

            if (nextPhase.type === "knockout") {
                const powerOfTwo = nextPowerOfTwo(nextPhase.teamCount);
                byeTeams = (powerOfTwo - nextPhase.teamCount) / groupCount;
            }
        } else {
            proceedingTeams = props.rank;
        }
    }

    const def = Math.floor(proceedingTeams);
    const maybe = Math.ceil(proceedingTeams);
    const byeDef = Math.floor(byeTeams);

    if (byeDef > 0 && props.rank <= byeDef) {
        return "progress";
    } else if (props.rank <= def) {
        return "play-in";
    } else if (props.rank === maybe) {
        return "maybe";
    }

    return null;
});

const nextPowerOfTwo = (value: number): number => {
    if (value <= 1) return 1;
    return 2 ** Math.ceil(Math.log2(value));
};
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
