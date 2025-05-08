<script setup lang="ts">
import { computed, ref } from "vue";
import MatchCard from "@/components/MatchCard.vue";
import type { Tournament, TournamentRound } from "@/types/tournament";

const props = defineProps<{
    tournament: Tournament;
    readonly?: boolean;
}>();
const tournament = ref(props.tournament);
const emit = defineEmits<{
    (e: "update:modelValue", tournament: Tournament): void;
}>();
const onChanged = () => {
    emit("update:modelValue", tournament.value);
};

const knockoutBracket = computed<TournamentRound[]>(() => {
    return tournament.value.knockoutPhase;
});
</script>

<template>
    <div
        class="round"
        v-for="(round, roundIndex) in knockoutBracket"
        :key="round.id"
    >
        <h3 class="round-title">{{ round.name }}</h3>
        <div class="matches">
            <MatchCard
                v-for="(_, index) in round.matches"
                :key="index"
                v-model="knockoutBracket[roundIndex].matches[index]"
                :readonly="readonly"
                :tournament="tournament"
                @update:modelValue="onChanged"
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
