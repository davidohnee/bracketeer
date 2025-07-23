<script setup lang="ts">
import type { Team, Tournament } from "@/types/tournament";
import { computed, onMounted, ref } from "vue";

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

const teamsToGenerate = ref(tournament.value.teams.length || 16);

const addTeamByName = (teams: Team[], name: string) => {
    if (name.trim() === "") return;
    teams.push({
        id: crypto.randomUUID(),
        name,
    });
};

const generateTeams = () => {
    const teams: Team[] = [];
    for (const team of Array.from({ length: teamsToGenerate.value }, (_, i) => `Team ${i + 1}`)) {
        addTeamByName(teams, team);
    }
    tournament.value.teams = teams;
};

onMounted(() => {
    if (tournament.value.teams.length === 0) {
        generateTeams();
    }
});
</script>
<template>
    <div class="node start">
        <div class="header">Start</div>
        <div class="body">
            <div class="field small">
                <label for="team-count"># of Teams</label>
                <input
                    type="number"
                    id="team-count"
                    v-model="teamsToGenerate"
                    @change="generateTeams"
                    @keydown.prevent.enter="generateTeams"
                    :min="2"
                />
            </div>
        </div>
    </div>
</template>
<style scoped>
.node.start {
    --c: var(--color-text-secondary);
}
</style>
