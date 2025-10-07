<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from "vue";
import { useRoute } from "vue-router";
import type { Tournament } from "@/types/tournament";
import TournamentLayout from "@/layouts/TournamentLayout.vue";
import { pull } from "@/share";
import { agoString } from "@/helpers/common";

type Error = null | "not-found" | "not-allowed";

const route = useRoute();

const who = ref("");
const tournament = ref<Tournament | null>(null);
const error = ref<Error>(null);

const sessionStorageItem = sessionStorage.getItem(route.params.id as string);
const updated = ref<Date | null>(sessionStorageItem ? new Date(sessionStorageItem) : null);

const subtitle = ref<string>("");

let updateTimer = 0;
let updateSubtitleTimer = 0;

const updateTask = async () => {
    const base64 = route.params.id as string;
    const importObject = await pull(base64);

    if (updated.value) {
        const now = new Date();
        const diff = now.getTime() - updated.value.getTime();
        if (diff >= 1000 * 60 * 5) {
            updated.value = new Date();
            sessionStorage.setItem(base64, updated.value.toString());
        }
    } else {
        updated.value = new Date();
        sessionStorage.setItem(base64, updated.value.toString());
    }

    if (importObject.error) {
        error.value = importObject.error;
        return;
    }

    tournament.value = importObject.tournament;
    who.value = importObject.author ?? "(unknown)";
    updateSubtitle();
};

const updateSubtitle = () => {
    if (tournament.value) {
        subtitle.value = "Last updated: " + agoString(updated.value!);
    }
};

onMounted(() => {
    updateTask();
    updateTimer = setInterval(
        () => {
            updateTask();
        },
        1000 * 60 * 5,
    ); // Update every 5 minutes

    updateSubtitleTimer = setInterval(updateSubtitle, 1000 * 60); // Update every minute
});
onUnmounted(() => {
    clearInterval(updateTimer);
    clearInterval(updateSubtitleTimer);
});
</script>
<template>
    <TournamentLayout
        v-if="tournament && error == null"
        class="tournament"
        v-model="tournament"
        :tabs="['table', 'knockout', 'matches', 'live']"
        :subtitle="subtitle"
        readonly
    />
    <div
        v-else-if="error == 'not-found'"
        class="error flex-col p-4"
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

.mt-4 {
    margin-top: 1em;
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
