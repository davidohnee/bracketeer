<script setup lang="ts">
import { randomiseGroupPhaseResults } from "@/helpers";
import type { Tournament } from "@/types/tournament";
import { updateKnockoutMatches } from "../../../helpers";
import { useTournamentsStore } from "../../../stores/tournaments";
import { useRouter } from "vue-router";

const props = defineProps<{
    tournament: Tournament;
}>();

const tournaments = useTournamentsStore();
const router = useRouter();

const randomGroupPhase = () => {
    randomiseGroupPhaseResults(props.tournament);
    update();
};

const update = () => {
    updateKnockoutMatches(props.tournament);
};

const deleteTournament = () => {
    tournaments.deleteTournament(props.tournament.id);
    router.push({ name: "tournaments" });
};

const resetTournament = () => {
    const tournament = tournaments.getTournamentById(props.tournament.id);

    for (const round of tournament?.groupPhase ?? []) {
        for (const match of round.matches) {
            match.teams[0].score = 0;
            match.teams[1].score = 0;
            match.status = "scheduled";
        }
    }
    for (const round of tournament?.knockoutPhase ?? []) {
        for (const match of round.matches) {
            match.teams[0].score = 0;
            match.teams[1].score = 0;
            match.status = "scheduled";
        }
    }
};

const duplicateTournament = () => {
    const tournament = tournaments.getTournamentById(props.tournament.id);
    if (!tournament) return;

    const newTournament = { ...tournament, id: crypto.randomUUID() };
    tournaments.add(newTournament);
    router.push({ name: "tournament", params: { id: newTournament.id } });
};
</script>

<template>
    <div class="form">
        <div class="row">
            <button
                class="secondary"
                @click="randomGroupPhase"
            >
                Randomise Group Phase
            </button>
            <button
                class="secondary"
                @click="update"
            >
                Update Knockout Matches
            </button>
            <button
                class="secondary"
                @click="duplicateTournament"
            >
                Duplicate
            </button>
            <button
                class="danger secondary"
                @click="resetTournament"
            >
                Reset Tournament
            </button>
            <button
                class="danger"
                @click="deleteTournament"
            >
                Delete Tournament
            </button>
        </div>
    </div>
</template>

<style scoped>
.form {
    padding: 1rem;
}
</style>
