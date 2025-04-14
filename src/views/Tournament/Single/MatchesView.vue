<script setup lang="ts">
import { computed } from 'vue';
import { type TournamentRound } from '@/types/tournament';
import MatchCard from '@/components/MatchCard.vue';
import { updateKnockoutMatches } from '../../../helpers';

const props = defineProps<{
    tournament: TournamentRound;
}>();

const knockoutBracket = computed<TournamentRound[]>(() => {
    return props.tournament.knockoutPhase;
});
</script>

<template>
    <div class="round" v-for="round in tournament.groupPhase" :key="round.id">
        <h3 class="round-title">{{ round.name }}</h3>
        <div class="matches">
            <MatchCard v-for="(match, index) in round.matches" :key="index"
                @scoreChanged="updateKnockoutMatches(tournament)" :match="match" :teams="tournament.teams" />
        </div>
    </div>

    <div class="round" v-for="round in knockoutBracket" :key="round.id">
        <h3 class="round-title">{{ round.name }}</h3>
        <div class="matches">
            <MatchCard v-for="(match, index) in round.matches" :key="index"
                @scoreChanged="updateKnockoutMatches(tournament)" :match="match" :teams="tournament.teams" />
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
