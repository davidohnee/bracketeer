<script setup lang="ts">
import { getLastMatchOf } from "@/helpers";
import { generateGroupPhase } from "@/helpers/matchplan/groupPhase";
import { generateKnockoutBracket } from "@/helpers/matchplan/knockoutPhase";
import type { Tournament } from "@/types/tournament";
import { computed, onMounted } from "vue";

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

const generate = () => {
    if (tournament.value.teams.length === 0) return;

    tournament.value.groupPhase = generateGroupPhase(tournament.value);
    tournament.value.knockoutPhase = generateKnockoutBracket(tournament.value);
};

onMounted(generate);

const tournamentEndsAt = computed(() => {
    const lastMatch = getLastMatchOf({
        rounds: tournament.value.knockoutPhase,
    });
    if (!lastMatch) return null;
    const endTime = new Date(lastMatch.date);
    endTime.setMinutes(endTime.getMinutes() + tournament.value.config.matchDuration);
    return endTime;
});

const totalMatchCount = computed(() => {
    return (
        tournament.value.knockoutPhase.reduce((acc, round) => {
            return acc + round.matches.length;
        }, 0) + tournament.value.groupPhase.length
    );
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
    <p>{{ tournament.teams.length }} Teams</p>
    <div class="row">
        <div class="field">
            <label for="break">Break Duration [min]</label>
            <input
                type="number"
                id="break"
                min="0"
                v-model="tournament.config.breakDuration"
                @change="generate"
            />
        </div>
        <div class="field">
            <label for="knockout-break">Knockout Break Duration [min]</label>
            <input
                type="number"
                id="knockout-break"
                min="0"
                v-model="tournament.config.knockoutBreakDuration"
                @change="generate"
            />
        </div>
    </div>
    <div class="field">
        <label for="courts"># of Courts</label>
        <input
            type="number"
            id="courts"
            min="1"
            v-model="tournament.config.courts"
            @change="generate"
        />
    </div>
    <div class="row">
        <div class="field">
            <label for="rounds"># of Rounds</label>
            <input
                type="number"
                id="rounds"
                min="1"
                v-model="tournament.config.rounds"
                @change="generate"
            />
        </div>
        <div class="field">
            <label for="knockout-teams"># of Knockout Teams</label>
            <input
                type="number"
                id="knockout-teams"
                min="1"
                v-model="tournament.config.knockoutTeams"
                @change="generate"
            />
        </div>
    </div>
    <div class="field">
        <label for="match-duration">Match Duration [min]</label>
        <input
            type="number"
            id="match-duration"
            min="1"
            v-model="tournament.config.matchDuration"
            @change="generate"
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
