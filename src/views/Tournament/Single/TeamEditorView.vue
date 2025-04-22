<script setup lang="ts">
import type { Team, Tournament } from "@/types/tournament";
import { useTournamentsStore } from "@/stores/tournaments";
import { computed, ref, watch } from "vue";

const props = defineProps<{
    tournament: Tournament;
}>();

const tournamentStore = useTournamentsStore();
const tournament = tournamentStore.getTournamentById(props.tournament.id)!;

const teamsPaste = ref<string>("");

watch(teamsPaste, (newValue) => {
    const lines = newValue.split("\n");
    const teams = lines.map((line) => line.trim()).filter((line) => line.length > 0);
    for (let i = 0; i < teams.length; i++) {
        if (i >= tournament.teams.length) break;
        tournament.teams[i].name = teams[i];
    }
    teamsPaste.value = "";
});

const comparableTeamName = (team: Team) => team.name.trim().toLowerCase();

const duplicates = computed(() => {
    const names = new Set<string>();
    const duplicates: string[] = [];
    for (const team of tournament.teams) {
        const trimmedName = comparableTeamName(team);

        if (names.has(trimmedName)) {
            duplicates.push(trimmedName);
        } else {
            names.add(trimmedName);
        }
    }
    return duplicates;
});
</script>

<template>
    <div class="team-editor form">
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
        <h3>Edit manually</h3>
        <div class="table">
            <div
                class="row"
                v-for="team in tournament.teams"
                :key="team.id"
                :class="{ duplicate: duplicates.includes(comparableTeamName(team)) }"
            >
                <input
                    class="team"
                    type="text"
                    v-model="team.name"
                    :key="team.id"
                    placeholder="Team name"
                />
            </div>
        </div>
    </div>
</template>

<style scoped>
.team-editor {
    padding: 1em;
    width: calc(100% - 2em);
}

.table {
    padding-top: 0;

    .row {
        display: flex;
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

        &.duplicate:before {
            content: "";
            position: absolute;
            top: 2px;
            left: 0;
            width: 2px;
            height: calc(100% - 4px);
            border-radius: 0;
            background: var(--color-red);
        }

        &.duplicate:has(:focus):before {
            background: var(--color-foreground);
        }

        &:nth-child(odd) {
            background-color: var(--color-background-secondary);
        }
    }
}
</style>
