<script setup lang="ts">
import type { Tournament } from "@/types/tournament";
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

const teamsToGenerate = ref(tournament.value.teams.length || 36);
const groupsToGenerate = ref(tournament.value.groups?.length || 1);
console.log(tournament.value.groups?.length, tournament.value.groups);

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

    generateGroups();
};

const generateGroups = () => {
    const groupCount = groupsToGenerate.value;
    tournament.value.groups = Array.from({ length: groupCount }, (_, i) => ({
        id: crypto.randomUUID(),
        name: `Group ${String.fromCharCode(65 + i)}`,
        teams: [],
    }));
    const teamsPerGroup = Math.ceil(tournament.value.teams.length / groupCount);
    for (let i = 0; i < tournament.value.teams.length; i++) {
        const groupIndex = Math.floor(i / teamsPerGroup);
        if (groupIndex < tournament.value.groups.length) {
            tournament.value.groups[groupIndex].teams.push(tournament.value.teams[i]);
        }
    }
};

onMounted(() => {
    if (tournament.value.teams.length === 0) {
        generateTeams();
    }
});
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
        <div class="field">
            <label for="groups">Groups</label>
            <input
                type="number"
                id="groups"
                min="1"
                max="1000"
                v-model="groupsToGenerate"
                @change="generateGroups"
                @keydown.prevent.enter="generateGroups"
            />
        </div>
    </div>
</template>
