<script setup lang="ts">
import type { Tournament } from "@/types/tournament";
import { useTournamentsStore } from "@/stores/tournaments";
import { ref, watch } from "vue";
import { migrateTournament } from "@/helpers/migration";

const props = defineProps<{
    tournament: Tournament;
}>();

const tournaments = useTournamentsStore();
const tournament = tournaments.getTournamentById(props.tournament.id)!;

const tournamentAsString = () => JSON.stringify(tournament, null, 4);

const editableTournament = ref(tournamentAsString());
const changed = ref(false);

watch(
    () => tournament.id,
    () => {
        editableTournament.value = tournamentAsString();
    },
);

const save = () => {
    const newTournament = migrateTournament(JSON.parse(editableTournament.value));
    for (const k in tournament) {
        // @ts-expect-error typescript is stupid
        tournament[k] = newTournament[k];
    }
    changed.value = false;
};
</script>

<template>
    <div class="form">
        <textarea
            id="teams-paste"
            rows="25"
            placeholder="Paste your teams here"
            v-model="editableTournament"
            @change="changed = true"
        ></textarea>
        <button
            :disabled="!changed"
            @click="save"
        >
            Save
        </button>
    </div>
</template>

<style scoped>
.form {
    padding: 1em;
    width: calc(100% - 2em);
}

.row {
    justify-content: flex-start;
    align-items: flex-end;
    flex-wrap: wrap;

    & select {
        margin: 0;
    }
}

@media (max-width: 600px) {
    .row {
        flex-direction: column;
        align-items: stretch;

        & button {
            width: 100%;
        }
    }
}

section {
    width: 100%;
}
</style>
