<script setup lang="ts">
import type { Tournament } from "@/types/tournament";
import { computed, ref } from "vue";

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

const teamsToGenerate = ref(tournament.value.teams.length || 36);

const addTeamByName = (name: string) => {
    if (name.trim() === "") return;
    tournament.value.teams.push({
        id: crypto.randomUUID(),
        name,
    });
};

const generateTeams = () => {
    tournament.value.teams = [];
    for (const team of Array.from({ length: teamsToGenerate.value }, (_, i) => `Team ${i + 1}`)) {
        addTeamByName(team);
    }
};
</script>
<template>
    <div class="field">
        <h3>Generate</h3>
        <div class="field">
            <label for="teams">Teams</label>
            <input
                type="number"
                id="teams"
                min="2"
                max="1000"
                v-model="teamsToGenerate"
                @change="generateTeams"
                @keydown.prevent.enter="generateTeams"
            />
        </div>
    </div>
</template>

<style scoped>
.input-methods {
    display: grid;
    grid-template-columns: 1fr 1fr;
}
</style>
