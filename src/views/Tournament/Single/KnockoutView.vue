<script setup lang="ts">
import { computed } from "vue";
import { type Tournament, type TournamentRound } from "@/types/tournament";
import MatchCard from "@/components/MatchCard.vue";
import { updateKnockoutMatches } from "../../../helpers";

const props = defineProps<{
    tournament: Tournament;
}>();

const knockoutBracket = computed<TournamentRound[]>(() => {
    return props.tournament.knockoutPhase;
});
</script>

<template>
    <div
        class="round"
        v-for="round in knockoutBracket"
        :key="round.id"
    >
        <h3 class="round-title">{{ round.name }}</h3>
        <div class="matches">
            <MatchCard
                v-for="(match, index) in round.matches"
                @scoreChanged="updateKnockoutMatches(tournament)"
                :key="index"
                :match="match"
                :teams="tournament.teams"
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
