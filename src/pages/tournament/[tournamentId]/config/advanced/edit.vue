<script setup lang="ts">
import type { Tournament } from "@/types/tournament";
import { useTournamentsStore } from "@/stores/tournaments";
import { ref, watch } from "vue";
import { migrateTournament } from "@/helpers/migration";
import { Notifications } from "@/components/notifications/createNotification";

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
    try {
        const newTournament = migrateTournament(JSON.parse(editableTournament.value));
        Object.assign(tournament, newTournament);
        changed.value = false;
    } catch (error) {
        Notifications.addError("Invalid format", {
            details: String(error),
        });
    }
};
</script>

<template>
    <div class="form">
        <textarea
            rows="25"
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
textarea {
    font-family: "Consolas", "Courier New", Courier, monospace;
    font-size: 1rem;
    resize: none;
}
</style>
