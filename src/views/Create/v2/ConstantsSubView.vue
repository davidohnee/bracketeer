<script setup lang="ts">
import type { Tournament } from "@/types/tournament";
import { computed } from "vue";

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
</script>
<template>
    <div class="row">
        <div class="field">
            <label for="break">Break Duration [min]</label>
            <input
                type="number"
                id="break"
                min="0"
                v-model="tournament.config.breakDuration"
            />
        </div>
        <div class="field">
            <label for="knockout-break">Knockout Break Duration [min]</label>
            <input
                type="number"
                id="knockout-break"
                min="0"
                v-model="tournament.config.knockoutBreakDuration"
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
        />
    </div>
    <div class="field">
        <label for="match-duration">Match Duration [min]</label>
        <input
            type="number"
            id="match-duration"
            min="1"
            v-model="tournament.config.matchDuration"
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
