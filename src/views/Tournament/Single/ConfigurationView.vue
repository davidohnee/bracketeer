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
