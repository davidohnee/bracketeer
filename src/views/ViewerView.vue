<!--
  - Copyright (c) 2023, reAudioPlayer ONE.
  - Licenced under the GNU General Public License v3.0
  -->

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRoute } from "vue-router";
import type { Tournament } from "@/types/tournament";
import { pull } from "@/share";

type Error = null | "not-found" | "not-allowed";

const route = useRoute();

const who = ref("");
const tournament = ref<Tournament | null>(null);
const error = ref<Error>(null);

let updateTimer = 0;

const updateTask = async () => {
    const base64 = route.params.id as string;
    const importObject = await pull(base64);

    if (importObject.error) {
        error.value = importObject.error;
        return;
    }

    tournament.value = importObject.tournament;
    who.value = importObject.author ?? "(unknown)";
};

const baseRoute = computed(() => {
    if (!route.name) {
        return null;
    }
    const name = route.name as string;
    return name.split(".")[0];
});

onMounted(() => {
    updateTask();
    updateTimer = setInterval(
        () => {
            updateTask();
        },
        1000 * 60 * 5,
    ); // Update every 5 minutes
});
onUnmounted(() => {
    clearInterval(updateTimer);
});
</script>
<template>
    <div
        v-if="tournament && error == null"
        class="tournament"
    >
        <section>
            <h2>{{ tournament.name }}</h2>
            <span class="source text-muted">by {{ who }}</span>
            <div class="tabs">
                <router-link
                    :to="{ name: baseRoute + '.table', params: { tournamentId: tournament.id } }"
                >
                    Table
                </router-link>
                <router-link
                    :to="{ name: baseRoute + '.knockout', params: { tournamentId: tournament.id } }"
                >
                    Knockout
                </router-link>
                <router-link
                    :to="{ name: baseRoute + '.matches', params: { tournamentId: tournament.id } }"
                >
                    Matches
                </router-link>
                <router-link
                    :to="{ name: baseRoute + '.live', params: { tournamentId: tournament.id } }"
                >
                    Live
                </router-link>
            </div>
            <RouterView :tournament="tournament" />
        </section>
    </div>
    <div
        v-else-if="error == 'not-found'"
        class="error flex-col"
    >
        <h1>Guess you'll have to create it yourself...</h1>
        <p>
            No tournament was found at the link you provided. The tournament may have been deleted
            or the link may be incorrect.
        </p>
        <div class="flex gap-2">
            <router-link :to="{ name: 'create' }">
                <button>Create new tournament</button>
            </router-link>
            <router-link :to="{ name: 'home' }">
                <button>Home</button>
            </router-link>
        </div>
    </div>
    <div
        v-else-if="error == 'not-allowed'"
        class="error flex-col"
    >
        <h1>Not Allowed</h1>
        <p>You don't have permission to view this tournament.</p>
        <router-link :to="{ name: 'home' }">
            <button class="danger">Close</button>
        </router-link>
    </div>
</template>
<style scoped>
.italic {
    font-style: italic;
}

.text-sm {
    font-size: 0.8rem;
}

.p-4 {
    padding: 1rem;
}

.mt-4 {
    margin-top: 1rem;
}

.w-max {
    width: max-content;

    @media screen and (max-width: 768px) {
        width: unset;
    }
}

.flex-col {
    display: flex;
    flex-direction: column;
}

.flex {
    display: flex;
}

.gap-4 {
    gap: 1rem;
}

.gap-2 {
    gap: 0.5rem;
}

.items-center {
    align-items: center;
}

.uppercase {
    text-transform: uppercase;
}

section {
    border: 1px solid var(--color-border);
    border-radius: 1em;
    overflow: clip;
    display: flex;
    flex-direction: column;
    align-items: flex-start;

    & h2,
    & span.source {
        margin-left: 1rem;
    }

    & h2 {
        margin-bottom: 0;
    }

    & span.source {
        margin-bottom: 1rem;
    }

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

@media (max-width: 600px) {
    section .tabs {
        gap: 0;
    }
}
</style>
