<script setup lang="ts">
import { randomiseGroupPhaseResults } from "@/helpers";
import type { Tournament } from "@/types/tournament";
import { useTournamentsStore } from "@/stores/tournaments";
import { useRouter } from "vue-router";
import { ref, toRaw } from "vue";
import { Notifications } from "@/components/notifications/createNotification";
import { updateKnockoutMatches } from "@/helpers/matchplan/knockoutPhase";
import { getTournamentStatus } from "@/helpers/common";

const props = defineProps<{
    tournament: Tournament;
}>();

const tournaments = useTournamentsStore();
const tournament = tournaments.getTournamentById(props.tournament.id)!;
const router = useRouter();

const randomGroupPhase = () => {
    const rawTournament = toRaw(tournament);
    randomiseGroupPhaseResults(rawTournament);
    tournament.phases = [...rawTournament.phases];
    hasStarted.value = true;
    update();
};

const update = () => {
    const rawTournament = toRaw(tournament);
    updateKnockoutMatches(rawTournament);
    tournament.phases = [...rawTournament.phases];
    Notifications.addSuccess("Knockout matches updated", {
        details: "The knockout matches have been updated based on the current group phase results.",
        timeout: 3000,
    });
};

const duplicateTournament = () => {
    const newTournament = { ...tournament, id: crypto.randomUUID() };
    tournaments.add(newTournament);
    router.push({ name: "/tournament/[tournamentId]", params: { tournamentId: newTournament.id } });
};

const hasStarted = ref(getTournamentStatus(tournament) !== "scheduled");
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
                Duplicate Tournament
            </button>
        </div>
    </div>
</template>
