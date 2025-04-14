<script setup lang="ts">
import { computed } from 'vue';
import { useTournamentsStore } from '../../stores/tournaments';
import { useRoute } from 'vue-router';

const tournaments = useTournamentsStore();
const route = useRoute();

const tournamentId = computed(() => {
    return route.params.tournamentId as string;
});

const tournament = computed(() => tournaments.all.find(t => t.id === tournamentId.value));
</script>

<template>
    <div v-if="tournament" class="tournament">
        <section>
            <h2>{{ tournament.name }}</h2>
            <div class="tabs">
                <router-link :to="{ name: 'tournament.table', params: { tournamentId: tournament.id } }">
                    Table
                </router-link>
                <router-link :to="{ name: 'tournament.knockout', params: { tournamentId: tournament.id } }">
                    Knockout
                </router-link>
                <router-link :to="{ name: 'tournament.matches', params: { tournamentId: tournament.id } }">
                    Matches
                </router-link>
                <router-link :to="{ name: 'tournament.config', params: { tournamentId: tournament.id } }">
                    Settings
                </router-link>
            </div>
            <RouterView :tournament="tournament" />
        </section>
    </div>
</template>

<style scoped>
section {
    border: 1px solid var(--color-border);
    border-radius: 1em;
    overflow: clip;
    display: flex;
    flex-direction: column;
    align-items: flex-start;

    & h2 {
        margin-left: 1em;
    }

    .tabs {
        color: var(--color-foreground);
        display: flex;
        gap: 1em;
        padding: 0 1em;
        width: 100%;
        border-bottom: 1px solid var(--color-border);

        & a {
            color: var(--color-foreground);
            text-decoration: none;
            padding: 0.5em 1em;
            border-radius: 1em;
            position: relative;

            &:hover {
                color: var(--color-foreground-secondary);
            }

            &.router-link-active::after {
                content: '';
                position: absolute;
                bottom: 0;
                left: 1em;
                right: 1em;
                height: 2px;
                background-color: var(--color-foreground);
                margin-top: 0.5em;
            }
        }
    }
}
</style>
