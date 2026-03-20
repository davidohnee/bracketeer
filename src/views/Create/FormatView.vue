<script setup lang="ts">
import { getLastMatchOf } from "@/helpers";
import { allMatches } from "@/helpers/phase";
import type { Tournament } from "@/types/tournament";
import { computed, ref, watch } from "vue";
import BuilderView from "./FormatBuilderView/BuilderView.vue";
import { getCourtType } from "@/helpers/defaults";

const props = defineProps<{
    modelValue: Tournament;
}>();
const emit = defineEmits<(e: "update:modelValue", value: Tournament) => void>();
const builder = ref<InstanceType<typeof BuilderView>>();

const tournament = computed({
    get() {
        return props.modelValue;
    },
    set(value) {
        emit("update:modelValue", value);
    },
});

const tournamentEndsAt = ref<Date>();
const totalMatchCount = ref(0);

watch(
    [
        () => tournament.value.config.breakDuration,
        () => tournament.value.config.matchDuration,
        () => tournament.value.config.courts,
        () => tournament.value.phases,
    ],
    () => {
        builder.value?.regenerate();

        const p = tournament.value.phases;
        const lastMatch = getLastMatchOf({
            phase: p.at(-1),
        });
        if (!lastMatch) return null;
        const endTime = new Date(lastMatch.date);
        endTime.setMinutes(endTime.getMinutes() + tournament.value.config.matchDuration);
        tournamentEndsAt.value = endTime;
        totalMatchCount.value = tournament.value.phases.reduce((count, phase) => {
            return count + allMatches(phase).length;
        }, 0);
    },
    { immediate: true },
);

const totalTournamentDurationFormatted = computed(() => {
    const start = tournament.value.config.startTime;
    const end = tournamentEndsAt.value;
    if (!end) return null;
    const totalDuration = Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
    const hours = Math.floor(totalDuration / 60);
    const minutes = totalDuration % 60;
    return `${hours}h ${minutes}m`;
});

const breakDuration = computed({
    get() {
        return tournament.value.config.breakDuration;
    },
    set(value) {
        tournament.value.config.knockoutBreakDuration = value;
        tournament.value.config.breakDuration = value;
    },
});
</script>
<template>
    <BuilderView
        v-model="tournament"
        ref="builder"
    />

    <div class="row">
        <div class="field">
            <label for="match-duration">Match Duration [min]</label>
            <input
                type="number"
                id="match-duration"
                min="1"
                v-model="tournament.config.matchDuration"
            />
        </div>
        <div class="field">
            <label for="break">Break Duration [min]</label>
            <input
                type="number"
                id="break"
                min="0"
                v-model="breakDuration"
            />
        </div>
    </div>
    <div class="field">
        <label for="courts"># of {{ getCourtType(tournament.config.sport, true, true) }}</label>
        <input
            type="number"
            id="courts"
            min="1"
            v-model="tournament.config.courts"
        />
    </div>

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
