<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRoute } from "vue-router";
import type { IRemote, Tournament } from "@/types/tournament";
import TournamentLayout from "@/layouts/TournamentLayout.vue";
import { agoString } from "@/helpers/common";
import { getLiveSyncFactory } from "@/helpers/share/liveSync";
import SpinningLoader from "@/components/SpinningLoader.vue";

const route = useRoute();

const tournament = ref<Tournament | null>(null);

const routeId = computed(() => ("id" in route.params ? (route.params.id as string) : ""));
const otherRemote = ref<string | null>(null);

const subtitle = ref<string>("");

let updateSubtitleTimer = 0;

let liveSync = getLiveSyncFactory(routeId.value)(tournament);

const updateSubtitle = () => {
    if (tournament.value) {
        subtitle.value =
            "Last updated: " + agoString(liveSync.status.value.lastUpdate ?? new Date());
    }
};

const preferDefaultRemote = () => {
    console.debug("Preferred default remote, switching back to", routeId.value);
    liveSync.stop();
    otherRemote.value = null;
    liveSync = getLiveSyncFactory(routeId.value)(tournament);
    liveSync.onChange = updateSubtitle;
    liveSync.pull(routeId.value);
};

const preferOtherRemote = (remote: IRemote) => {
    console.debug("Preferred other remote, switching to", remote);
    liveSync.stop();
    otherRemote.value = remote.identifier;
    liveSync = getLiveSyncFactory(remote.identifier)(tournament);
    liveSync.onChange = updateSubtitle;
    liveSync.pull(remote.identifier);
    liveSync.onError = (error) => {
        console.warn("Live sync error on other remote:", error);
        console.log("Switching back to default remote:", routeId.value);
        preferDefaultRemote();
    };
};

onMounted(() => {
    liveSync.onChange = updateSubtitle;
    liveSync.pull(routeId.value);
    liveSync.onPreferOther = preferOtherRemote;
    updateSubtitleTimer = setInterval(updateSubtitle, 1000 * 60); // Update every minute
});
onUnmounted(() => {
    liveSync.stop();
    clearInterval(updateSubtitleTimer);
});
</script>
<template>
    <TournamentLayout
        v-if="tournament && !liveSync.error.value"
        class="tournament"
        v-model="tournament"
        :tabs="['table', 'knockout', 'matches', 'live', 'about']"
        :subtitle="subtitle"
        readonly
    />
    <div
        v-else-if="!tournament && !liveSync.error.value"
        class="loading"
    >
        <SpinningLoader />
    </div>
    <div
        v-else-if="
            liveSync.error.value && ['not-found', 'not-supported'].includes(liveSync.error.value)
        "
        class="error flex-col p-4"
    >
        <h1>Guess you'll have to create it yourself...</h1>
        <p>
            No tournament was found at the link you provided. The tournament may have been deleted
            or the link may be incorrect.
        </p>
        <div class="flex gap-2">
            <router-link :to="{ name: '/create' }">
                <button>Create new tournament</button>
            </router-link>
            <router-link :to="{ name: '/' }">
                <button>Home</button>
            </router-link>
        </div>
    </div>
    <div
        v-else-if="liveSync.error.value == 'not-allowed'"
        class="error flex-col"
    >
        <h1>Not Allowed</h1>
        <p>You don't have permission to view this tournament.</p>
        <router-link :to="{ name: '/' }">
            <button class="danger">Close</button>
        </router-link>
    </div>
    <div
        v-else-if="liveSync.error.value == 'no-connection'"
        class="error flex-col"
    >
        <h1>No Connection</h1>
        <p>
            Unable to connect to the tournament. This could be due to a network issue or the host
            closing the connection.
        </p>
        <router-link :to="{ name: '/' }">
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
    margin-top: var(--spacing-m);
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

.loading {
    height: 60vh;
    display: flex;
    justify-content: center;
    align-items: center;
}

.flex {
    display: flex;
}

.gap-4 {
    gap: var(--spacing-m);
}

.gap-2 {
    gap: var(--spacing-xs);
}

.items-center {
    align-items: center;
}

.uppercase {
    text-transform: uppercase;
}
</style>
