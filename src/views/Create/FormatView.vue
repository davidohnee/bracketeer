<script setup lang="ts">
import { getLastMatchOf } from "@/helpers";
import { allMatches } from "@/helpers/phase";
import type { Tournament } from "@/types/tournament";
import { computed } from "vue";
import BuilderView from "./FormatBuilderView/BuilderView.vue";

const props = defineProps<{
    modelValue: Tournament;
}>();
const emit = defineEmits<{
    (e: "update:modelValue", value: Tournament): void;
}>();

const tournament = computed({
    get() {
        return props.modelValue;
    },
    set(value) {
        emit("update:modelValue", value);
    },
});

const tournamentEndsAt = computed(() => {
    const p = tournament.value.phases;
    const lastMatch = getLastMatchOf({
        phase: p[p.length - 1],
    });
    if (!lastMatch) return null;
    const endTime = new Date(lastMatch.date);
    endTime.setMinutes(endTime.getMinutes() + tournament.value.config.matchDuration);
    return endTime;
});

const totalMatchCount = computed(() => {
    return tournament.value.phases.reduce((count, phase) => {
        return count + allMatches(phase).length;
    }, 0);
});

const totalTournamentDurationFormatted = computed(() => {
    const start = tournament.value.config.startTime;
    const end = tournamentEndsAt.value;
    if (!end) return null;
    const totalDuration = Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
    const hours = Math.floor(totalDuration / 60);
    const minutes = totalDuration % 60;
    return `${hours}h ${minutes}m`;
});
</script>
<template>
    <BuilderView
        :model-value="tournament"
        @update:modelValue="tournament = $event"
    />

    <div class="row">
        <p v-if="tournamentEndsAt">
            Tournament ends approximately at
            <strong>
                {{ tournamentEndsAt.toLocaleString() }}
            </strong>
            ({{ totalTournamentDurationFormatted }})
        </p>
        <p v-if="totalMatchCount">
            Total matches: <strong>{{ totalMatchCount }}</strong>
        </p>
    </div>
</template>

<style scoped>
.row .field {
    flex: 1;
}

@media (max-width: 768px) {
    .row {
        flex-direction: column;
    }
}
</style>
