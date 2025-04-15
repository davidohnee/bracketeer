<script setup lang="ts">
import type { Tournament } from "@/types/tournament";
import { ref, watch } from "vue";

const props = defineProps<{
    modelValue: Tournament;
}>();
const emit = defineEmits<{
    (e: "update:modelValue", value: Tournament): void;
}>();

const tournament = ref(props.modelValue);

watch(
    () => props.modelValue,
    (newValue) => {
        tournament.value = newValue;
    },
    { deep: true },
);
watch(
    tournament,
    (newValue) => {
        emit("update:modelValue", newValue);
    },
    { deep: true },
);

const teamsPaste = ref<string>("");
const teamsToGenerate = ref(36);

const addTeamByName = (name: string) => {
    if (name.trim() === "") return;
    tournament.value.teams.push({
        id: crypto.randomUUID(),
        name,
    });
};

watch(
    teamsPaste,
    (newValue) => {
        if (!newValue) return;

        const lines = newValue.split("\n");
        for (const line of lines) {
            addTeamByName(line);
        }
        teamsPaste.value = "";
    },
    { immediate: true },
);

const generateTeams = () => {
    for (const team of Array.from({ length: teamsToGenerate.value }, (_, i) => `Team ${i + 1}`)) {
        addTeamByName(team);
    }
};
</script>
<template>
    <div class="table">
        <div
            class="row"
            v-for="team in tournament.teams"
            :key="team.id"
        >
            <input
                class="team"
                type="text"
                v-model="team.name"
                :key="team.id"
                placeholder="Team name"
            />
            <button
                class="ghost"
                @click="tournament.teams.splice(tournament.teams.indexOf(team), 1)"
            >
                <ion-icon
                    name="trash"
                    class="delete"
                ></ion-icon>
            </button>
        </div>
    </div>
    <div class="row input-methods">
        <div class="field">
            <h3>Paste</h3>
            <div class="field">
                <label for="teams-paste">Teams</label>
                <textarea
                    id="teams-paste"
                    rows="10"
                    placeholder="Paste your teams here"
                    v-model="teamsPaste"
                ></textarea>
            </div>
        </div>
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
                />
            </div>
            <button
                type="button"
                class="secondary"
                @click="generateTeams"
            >
                Generate
            </button>
        </div>
    </div>
</template>

<style scoped>
.table {
    .row {
        align-items: center;
        position: relative;

        & input {
            width: 100%;
            margin: 0;
            background: none;
            border-radius: 0;
            border: none;

            &:focus {
                outline: none;
            }
        }

        &:has(:focus):before {
            content: "";
            position: absolute;
            top: 2px;
            left: 0;
            width: 2px;
            height: calc(100% - 4px);
            border-radius: 0;
            background: var(--color-primary);
        }

        &:nth-child(even) {
            background-color: var(--color-background);
        }
    }
}

.input-methods {
    display: grid;
    grid-template-columns: 1fr 1fr;
}
</style>
