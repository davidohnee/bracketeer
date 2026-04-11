<script setup lang="ts">
import { generateGroupPhases } from "@/helpers/matchplan/groupPhase";
import { generateKnockoutBrackets } from "@/helpers/matchplan/knockoutPhase";
import { allMatches } from "@/helpers/phase";
import type { KnockoutTournamentPhase, Tournament } from "@/types/tournament";
import { computed, watch } from "vue";

const props = defineProps<{
    modelValue: Tournament;
    phase: KnockoutTournamentPhase;
}>();

const emit = defineEmits<(e: "update:modelValue", value: Tournament) => void>();

const tournament = computed({
    get() {
        return props.modelValue;
    },
    set(value) {
        emit("update:modelValue", value);
    },
});

watch([() => props.phase.teamCount, () => props.modelValue.teams.length], () => {
    tournament.value.phases = generateKnockoutBrackets(tournament.value);
    tournament.value.phases = generateGroupPhases(tournament.value);
});
</script>
<template>
    <div class="node start">
        <div class="header">Knockout Stage</div>
        <div class="footer text-sm">{{ allMatches(phase).length }} matches</div>
    </div>
</template>
<style scoped>
.node.start {
    --c: var(--color-brand-green);
}
</style>
