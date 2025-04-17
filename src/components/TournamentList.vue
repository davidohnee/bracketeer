<script setup lang="ts">
import { useRouter } from "vue-router";
import { useTournamentsStore } from "@/stores/tournaments";

const tournaments = useTournamentsStore();
const router = useRouter();
</script>
<template>
    <div>
        <div class="tournament-list">
            <button
                @click="router.push('/create')"
                class="tournament-item"
            >
                <ion-icon name="add-circle-outline"></ion-icon>
                Create Tournament
            </button>
            <div
                v-for="(tournament, index) in tournaments.all"
                :key="index"
                class="tournament-item"
            >
                <router-link :to="{ name: 'tournament', params: { tournamentId: tournament.id } }">
                    {{ tournament.name }}
                </router-link>
                <button
                    class="ghost"
                    @click.stop.prevent="tournaments.deleteTournament(tournament.id)"
                >
                    <ion-icon
                        name="trash"
                        class="delete"
                    ></ion-icon>
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.tournament-list {
    overflow: clip;

    & button.tournament-item {
        background: color-mix(in srgb, var(--color-primary) 10%, transparent);
        color: var(--color-primary);
        border-radius: 0;
        width: 100%;
        padding: 1em;
        display: flex;
        gap: 1em;
        align-items: center;
        justify-content: center;
    }

    .tournament-item {
        align-items: center;
        position: relative;
        padding: 0.5em 1em;
        cursor: pointer;
        display: flex;

        &:nth-child(even) {
            background-color: var(--color-background);
        }

        &:hover {
            background: color-mix(in srgb, var(--color-primary) 20%, transparent);
        }

        a {
            flex: 1;
        }
    }
}
</style>
