<script setup lang="ts">
import { DEFAULTS, getCourtType } from "@/helpers/defaults";
import type { Tournament } from "@/types/tournament";
import { computed, watch } from "vue";

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

const breakDuration = computed({
    get() {
        return tournament.value.config.breakDuration;
    },
    set(value) {
        tournament.value.config.knockoutBreakDuration = value;
        tournament.value.config.breakDuration = value;
    },
});

watch(
    () => tournament.value.config.sport,
    (newSport) => {
        breakDuration.value = DEFAULTS[newSport].breakDuration;
        tournament.value.config.matchDuration = DEFAULTS[newSport].matchDuration;
    },
);
</script>
<template>
    <div class="field">
        <span class="text-sm text-muted">Sport</span>
        <div class="chip-group">
            <div
                v-for="(v, k) in DEFAULTS"
                :key="k"
                class="chip-option"
                :class="{ selected: tournament.config.sport === k }"
                @click="tournament.config.sport = k"
                :title="v.description"
            >
                <ion-icon
                    :name="v.icon"
                    class="icon"
                ></ion-icon>
                <span>{{ v.name }}</span>
            </div>
        </div>
    </div>
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
