<!--
  - Copyright (c) 2023, reAudioPlayer ONE.
  - Licenced under the GNU General Public License v3.0
  -->

<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { Tournament } from "@/types/tournament";
import gistClient from "@/gistClient";
import { pull } from "@/share";
import { useTournamentsStore } from "@/stores/tournaments";

type Error = null | "not-found" | "not-allowed";

const route = useRoute();
const router = useRouter();
const tournaments = useTournamentsStore();

const who = ref("");
const what = ref<Tournament[]>([]);
const error = ref<Error>(null);
const githubPat = ref("");

onMounted(async () => {
    const base64 = route.params.id as string;
    const importObject = await pull(base64);

    if (importObject.error) {
        error.value = importObject.error;
        return;
    }

    what.value = [importObject.tournament];
    who.value = importObject.author ?? "(unknown)";
});

const confirm = async () => {
    const tournament = what.value[0];
    tournament.remote ??= [];
    tournament.remote.push({
        identifier: route.params.id as string,
    });

    await tournaments.add(tournament);
    router.push({
        name: "tournament",
        params: { tournamentId: tournament.id },
    });
};

const tryAgain = () => {
    gistClient.setPat(githubPat.value);
    window.location.reload();
};
</script>
<template>
    <WithSidebar>
        <div class="wrap">
            <div
                v-if="error == null"
                class="flex-col"
            >
                <span>
                    <strong>{{ who }}</strong> wants to share:
                </span>
                <span
                    v-if="what.length == 0"
                    class="text-muted italic text-sm"
                    >Nothing</span
                >
                <div
                    v-else
                    class="mt-4 w-max flex flex-col gap-4"
                >
                    <div class="items">
                        <div
                            v-for="item in what"
                            :key="item.id"
                            class="card flex gap-2 items-center"
                        >
                            <div class="flex flex-col">
                                <h2>{{ item.name }}</h2>
                                <span class="text-muted">
                                    {{ item.config.startTime.toLocaleString() }}
                                </span>
                                <span class="mt-4 text-muted text-sm uppercase italic">
                                    {{ item.teams.length }} teams
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="buttons flex gap-2">
                        <button @click="confirm">Accept</button>
                        <router-link :to="{ name: 'home' }">
                            <button
                                class="danger"
                                @click="confirm"
                            >
                                Reject
                            </button>
                        </router-link>
                    </div>
                </div>
            </div>
            <div
                v-else-if="error == 'not-found'"
                class="error flex-col"
            >
                <h1>Guess you'll have to create it yourself...</h1>
                <p>
                    No tournament was found at the link you provided. The tournament may have been
                    deleted or the link may be incorrect.
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
                <div class="card">
                    <p>Wait, this is my Gist!</p>
                    <input
                        type="text"
                        :value="githubPat"
                        placeholder="Enter your GitHub PAT here"
                    />
                    <button
                        @click="tryAgain"
                        :disabled="!githubPat.length"
                    >
                        Accept
                    </button>
                </div>
                <router-link :to="{ name: 'home' }">
                    <button class="danger">Close</button>
                </router-link>
            </div>
        </div>
    </WithSidebar>
</template>
<style scoped>
.wrap {
    padding: 1em;
    width: calc(100% - 2em);
    height: calc(100% - 2em);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    & > div.error {
        padding: 0 1em;
        width: calc(100% - 2em);

        @media screen and (min-width: 1080px) {
            max-width: 1080px;
            padding: 0;
        }
    }
}

.items {
    margin-bottom: 1em;
}

.card {
    padding: 1rem;
    border-radius: 0.5rem;
    border: 1px solid var(--color-border);
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    justify-content: center;
    overflow: hidden;
    width: calc(100% - 2em);
}

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
</style>
