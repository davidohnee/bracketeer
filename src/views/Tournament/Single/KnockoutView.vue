<script setup lang="ts">
import { computed } from "vue";
import MatchCard from "@/components/MatchCard.vue";
import { updateKnockoutMatches } from "../../../helpers";
import type { MatchStatus, Tournament, TournamentRound } from "@/types/tournament";
import { useTournamentsStore } from "@/stores/tournaments";

const props = defineProps<{
    tournament: Tournament;
}>();

const tournamentStore = useTournamentsStore();

const tournament = tournamentStore.getTournamentById(props.tournament.id)!;

const knockoutBracket = computed<TournamentRound[]>(() => {
    return props.tournament.knockoutPhase;
});

const updateMatchScore = (
    roundIndex: number,
    matchIndex: number,
    teamIndex: number,
    newScore: number,
) => {
    if (!tournament) return;

    const match = tournament.knockoutPhase[roundIndex].matches[matchIndex];
    match.teams[teamIndex].score = newScore;
    tournament.knockoutPhase[roundIndex].matches[matchIndex] = match;
    updateKnockoutMatches(props.tournament);
};

const updateMatchStatus = (roundIndex: number, matchIndex: number, newStatus: MatchStatus) => {
    if (!tournament) return;

    const match = tournament.knockoutPhase[roundIndex].matches[matchIndex];
    match.status = newStatus;
    tournament.knockoutPhase[roundIndex].matches[matchIndex] = match;
    updateKnockoutMatches(props.tournament);
};
</script>

<template>
    <div
        class="round"
        v-for="(round, roundI) in knockoutBracket"
        :key="round.id"
    >
        <h3 class="round-title">{{ round.name }}</h3>
        <div class="matches">
            <MatchCard
                v-for="(match, index) in round.matches"
                :key="index"
                @scoreChanged="
                    (teamIndex, newScore) => updateMatchScore(roundI, index, teamIndex, newScore)
                "
                @matchStatusChanged="(newStatus) => updateMatchStatus(roundI, index, newStatus)"
                :match="match"
                :teams="tournament.teams"
                :matchDuration="tournament.config.matchDuration"
            />
        </div>
    </div>
</template>

<style scoped>
.round {
    width: 100%;
}

h3 {
    text-align: center;
}
</style>
