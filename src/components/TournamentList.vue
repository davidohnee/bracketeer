<script setup lang="ts">
import { useRouter } from "vue-router";
import { useTournamentsStore } from "@/stores/tournaments";
import type { MatchStatus } from "@/types/tournament";
import { computed } from "vue";
import { getTournamentStatus } from "@/helpers/common";

const tournaments = useTournamentsStore();
const router = useRouter();

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

const STATUS_COLOR: Record<MatchStatus, string> = {
    scheduled: "grey",
    "in-progress": "blue",
    completed: "green",
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
                <span class="text-muted desktop-only">Status</span>
                <span class="text-muted desktop-only">Start Date</span>
                <div class="text-muted delete"></div>
            </div>
            <router-link
                v-for="tournament in tournamentList"
                :key="tournament.id"
                class="tournament-item ghost"
                :to="{ name: 'tournament', params: { tournamentId: tournament.id } }"
            >
                <span class="name">{{ tournament.name }}</span>
                <span
                    class="status desktop-only"
                    :class="STATUS_COLOR[tournament.status]"
                >
                    {{ STATUS_TEXT[tournament.status] }}
                </span>
                <span class="text-muted date desktop-only">{{
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
    background: var(--color-surface);
}

.tournament-item {
    align-items: center;
    position: relative;
    padding: 0.5em 1em;
    display: grid;
    grid-template-columns: 1fr 12ch 18ch 54px;
    gap: 1em;
    color: inherit;

    :not(:first-child) {
        font-size: 0.9em;
    }

    .name {
        font-weight: var(--typography-fontWeight-semi-bold);
    }

    &:not(.header):not(:first-child) {
        border-top: 1px solid var(--color-border);
    }

    &:not(.header):not(:has(button:hover)):hover {
        background: var(--color-surface-hover);
        cursor: pointer;
    }

    a {
        flex: 1;
    }
}

@media (max-width: 768px) {
    .tournament-list-container {
        margin: 1em;
    }

    .tournament-item {
        grid-template-columns: 1fr 54px;
    }

    .desktop-only {
        display: none;
    }
}
</style>
