<script setup lang="ts">
import type { Team, Tournament } from "@/types/tournament";
import { useTournamentsStore } from "@/stores/tournaments";
import { computed, ref } from "vue";

const props = defineProps<{
    tournament: Tournament;
}>();

const tournamentStore = useTournamentsStore();
const tournament = tournamentStore.getTournamentById(props.tournament.id)!;

const teams = ref<Team[]>(JSON.parse(JSON.stringify(props.tournament.teams)));
const teamsPaste = ref<string>("");

const processPastedTeams = () => {
    const lines = teamsPaste.value.split("\n");
    const teams = lines.map((line) => line.trim()).filter((line) => line.length > 0);
    for (let i = 0; i < teams.length; i++) {
        if (i >= tournament.teams.length) break;
        if (i >= teams.length) break;
        tournament.teams[i]!.name = teams[i]!;
    }
    teamsPaste.value = "";
};
const processPaste = () => {
    setTimeout(processPastedTeams, 0);
};

const updateTeams = () => {
    tournament.teams = teams.value;
};

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
                    @change="processPastedTeams"
                    @keydown.prevent.enter="processPastedTeams"
                    @paste="processPaste"
                ></textarea>
            </div>
        </div>
        <h3>Edit manually</h3>
        <div class="table">
            <div
                class="row"
                v-for="team in teams"
                :key="team.id"
                :class="{ duplicate: duplicates.includes(comparableTeamName(team)) }"
            >
                <input
                    class="team"
                    type="text"
                    v-model="team.name"
                    :key="team.id"
                    placeholder="Team name"
                    @change="updateTeams"
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
</style>
