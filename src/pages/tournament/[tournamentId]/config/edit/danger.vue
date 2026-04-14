<script setup lang="ts">
import type {
    GroupTournamentPhase,
    KnockoutTournamentPhase,
    Tournament,
    TournamentPhase,
} from "@/types/tournament";
import { useTournamentsStore } from "@/stores/tournaments";
import { useRouter } from "vue-router";
import { ref, toRaw } from "vue";
import { Notifications } from "@/components/notifications/createNotification";
import { generateKnockoutBracket } from "@/helpers/matchplan/knockoutPhase";
import { getTournamentStatus } from "@/helpers/common";
import { generateGroupPhase } from "@/helpers/matchplan/groupPhase";

const props = defineProps<{
    tournament: Tournament;
}>();

const tournaments = useTournamentsStore();
const tournament = tournaments.getTournamentById(props.tournament.id)!;
const router = useRouter();

const deleteTournament = () => {
    Notifications.addYesNo("Delete Tournament", {
        details: "Are you sure you want to delete the tournament? This action cannot be undone.",
        onYes: () => {
            tournaments.deleteTournament(props.tournament.id);
            router.push({ name: "/" });
            Notifications.addSuccess("Tournament deleted", {
                details: "The tournament has been deleted successfully.",
                timeout: 3000,
            });
        },
    });
};

const resetGroupPhase = (phase: GroupTournamentPhase, tournament: Tournament) => {
    phase.matches = generateGroupPhase(phase, tournament);
};
const resetKnockoutPhase = (phase: KnockoutTournamentPhase, tournament: Tournament) => {
    phase.rounds = generateKnockoutBracket(phase, tournament);
};
const resetPhase = (phase: TournamentPhase, tournament: Tournament) => {
    if (phase.type === "group") {
        resetGroupPhase(phase as GroupTournamentPhase, tournament);
    } else if (phase.type === "knockout") {
        resetKnockoutPhase(phase as KnockoutTournamentPhase, tournament);
    }
};

const resetTournament = () => {
    Notifications.addYesNo("Reset Tournament", {
        details:
            "Are you sure you want to reset the tournament? This will remove all results and start the tournament from scratch.",
        onYes: () => {
            const rawTournament = toRaw(tournament);

            for (const phase of rawTournament.phases) {
                resetPhase(phase, rawTournament);
            }

            tournament.phases = [...rawTournament.phases];
            hasStarted.value = false;

            Notifications.addSuccess("Tournament reset", {
                details: "The tournament has been reset. All results have been removed.",
                timeout: 3000,
            });
        },
    });
};

const hasStarted = ref(getTournamentStatus(tournament) !== "scheduled");
</script>

<template>
    <div class="form">
        <div class="row start">
            <button
                class="danger secondary"
                @click="resetTournament"
                :disabled="!hasStarted"
                :title="!hasStarted ? 'You cannot reset the tournament before it has started.' : ''"
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
