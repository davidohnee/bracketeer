<script setup lang="ts">
import { computed } from "vue";
import MatchCard from "@/components/MatchCard.vue";
import { updateKnockoutMatches } from "@/helpers";
import type { MatchStatus, Tournament, TournamentRound } from "@/types/tournament";

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
                :key="index"
                readonly
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
