<script setup lang="ts">
import { useRouter } from "vue-router";
import { useTournamentsStore } from "@/stores/tournaments";
import type { MatchStatus, Tournament } from "@/types/tournament";
import { computed } from "vue";

const tournaments = useTournamentsStore();
const router = useRouter();

const getTournamentStatus = (tournament: Tournament): MatchStatus => {
    const allMatches = [
        ...tournament.groupPhase.flatMap((round) => round.matches),
        ...tournament.knockoutPhase.flatMap((round) => round.matches),
    ];
    if (!allMatches.some((match) => match.status !== "completed")) {
        return "completed";
    }
    if (allMatches.some((match) => ["in-progress", "completed"].includes(match.status))) {
        return "in-progress";
    }
    return "scheduled";
};

const tournamentList = computed(() => {
    return tournaments.all.map((tournament) => ({
        ...tournament,
        status: getTournamentStatus(tournament),
    }));
});

const STATUS_TEXT: Record<MatchStatus, string> = {
    "in-progress": "In Progress",
    scheduled: "Scheduled",
    completed: "Completed",
};
</script>
<template>
    <div class="tournament-list-container">
        <button
            @click="router.push('/create')"
            class="create"
        >
            <ion-icon name="add-outline"></ion-icon>
            Create Tournament
        </button>
        <div class="tournament-list">
            <div class="header tournament-item">
                <span class="text-muted">Tournament</span>
                <span class="text-muted center">Status</span>
                <span class="text-muted center">Start Date</span>
                <div class="text-muted delete"></div>
            </div>
            <router-link
                v-for="(tournament, index) in tournamentList"
                :key="index"
                class="tournament-item"
                :to="{ name: 'tournament', params: { tournamentId: tournament.id } }"
            >
                <span class="name">{{ tournament.name }}</span>
                <span
                    class="status"
                    :class="tournament.status"
                >
                    {{ STATUS_TEXT[tournament.status] }}
                </span>
                <span class="text-muted center date">{{
                    tournament.config.startTime.toLocaleString()
                }}</span>
                <button
                    class="ghost"
                    @click.stop.prevent="tournaments.deleteTournament(tournament.id)"
                >
                    <ion-icon
                        name="trash"
                        class="delete"
                    ></ion-icon>
                </button>
            </router-link>
        </div>
    </div>
</template>

<style scoped>
.tournament-list-container {
    display: flex;
    flex-direction: column;
    gap: 1em;
    margin: 1em 0;
}

.create {
    margin-left: auto;
}

.tournament-list {
    overflow: clip;
    border: 1px solid var(--color-border);
    border-radius: 1em;
}

.tournament-item {
    align-items: center;
    position: relative;
    padding: 0.5em 1em;
    display: grid;
    grid-template-columns: 1fr 10ch 18ch 54px;
    gap: 1em;
    color: inherit;

    :not(:first-child) {
        font-size: 0.9em;
    }

    &:nth-child(even) {
        background-color: var(--color-background);
    }

    &:not(.header):not(:has(button:hover)):hover {
        background: color-mix(in srgb, var(--color-primary) 20%, transparent);
        cursor: pointer;
    }

    a {
        flex: 1;
    }

    .status {
        padding: 0.25em;
        border-radius: 0.5em;
        text-align: center;
        width: 100%;

        --c: var(--color-primary);
        color: var(--c);
        background: color-mix(in srgb, var(--c) 20%, transparent);

        &.completed {
            --c: var(--color-green);
        }

        &.in-progress {
            --c: var(--color-blue);
        }

        &.scheduled {
            --c: var(--color-grey);
        }
    }
}
</style>
