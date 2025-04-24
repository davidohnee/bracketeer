<script setup lang="ts">
import { computed, ref } from "vue";
import { useTournamentsStore } from "../../stores/tournaments";
import { useRoute } from "vue-router";
import TrackModal from "./Single/TrackModal.vue";
import gistClient from "@/gistClient";

const tournaments = useTournamentsStore();
const route = useRoute();

const tournamentId = computed(() => {
    return route.params.tournamentId as string;
});

const tournament = computed(() => tournaments.all.find((t) => t.id === tournamentId.value));
const trackModal = ref<typeof TrackModal>();

const canUpdate = computed(() => {
    if (!tournament.value?.remote?.length) return false;
    const identifier = tournament.value.remote[0].identifier;
    return gistClient.isMine(identifier);
});
</script>

<template>
    <TrackModal ref="trackModal" />
    <div
        v-if="tournament"
        class="tournament"
    >
        <section>
            <div class="title-component">
                <h2>{{ tournament.name }}</h2>
                <ion-icon
                    v-if="canUpdate"
                    @click="trackModal?.open(tournament)"
                    class="clickable"
                    name="link-outline"
                ></ion-icon>
            </div>
            <div class="tabs">
                <router-link
                    :to="{ name: 'tournament.table', params: { tournamentId: tournament.id } }"
                >
                    Table
                </router-link>
                <router-link
                    :to="{ name: 'tournament.knockout', params: { tournamentId: tournament.id } }"
                >
                    Knockout
                </router-link>
                <router-link
                    :to="{ name: 'tournament.matches', params: { tournamentId: tournament.id } }"
                >
                    Matches
                </router-link>
                <router-link
                    :to="{ name: 'tournament.live', params: { tournamentId: tournament.id } }"
                >
                    Live
                </router-link>
                <router-link
                    :to="{ name: 'tournament.config', params: { tournamentId: tournament.id } }"
                >
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

    .tabs {
        color: var(--color-foreground);
        display: flex;
        gap: 1em;
        padding: 0 1em;
        border-bottom: 1px solid var(--color-border);
        width: calc(100% - 2em);
        overflow: auto;

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
                content: "";
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

.title-component {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1em;
    width: calc(100% - 2em);

    .clickable {
        font-size: 1.5em;
    }
}
</style>
