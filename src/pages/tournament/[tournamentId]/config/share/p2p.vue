<script setup lang="ts">
import type { Tournament } from "@/types/tournament";
import { useTournamentsStore } from "@/stores/tournaments";
import { computed, ref, watch } from "vue";
import ShareClient, { fromShare, getShareLink, getTypeFromIdentifier } from "@/helpers/share";
import type { PeerIdType } from "@/helpers/share/p2p/backgroundSync";
import { useBackgroundSyncStore } from "@/stores/backgroundSync";
import AdvancedInput from "@/components/input/AdvancedInput.vue";
import SegmentPicker from "@/components/SegmentPicker.vue";

const props = defineProps<{
    tournament: Tournament;
}>();

const options = [
    {
        label: "Random each session",
        value: "random",
        description:
            "A new random ID will be generated each time you load the page. This is the most private option, but requires sharing the new ID each time.",
    },
    {
        label: "This browser session (default)",
        value: "session",
        description:
            "The same ID will be used across your browser session. If you close the browser, a new ID will be generated next time. This is a good balance between convenience and privacy.",
    },
    {
        label: "Permanent",
        value: "permanent",
        description:
            "The same ID will be used every time you start sharing, even across browser sessions. This is the most convenient option.",
    },
];

const tournaments = useTournamentsStore();
const tournament = tournaments.getTournamentById(props.tournament.id)!;
const p2pRemote = computed(
    () => tournament.remote?.find((r) => getTypeFromIdentifier(r.identifier) === "p2p") ?? null,
);
const peerIdType = ref<PeerIdType>("session");

if (p2pRemote.value) {
    const identifier = props.tournament.remote![0]!.identifier;
    const { author } = fromShare(identifier);
    if (author === "session" || author === "random" || author === "permanent") {
        peerIdType.value = author;
    }
}

const startP2P = () => {
    if (p2pRemote.value) return;
    const shareId = ShareClient.toShare("p2p", peerIdType.value, crypto.randomUUID());

    tournament.remote ??= [];
    tournament.remote.push({
        identifier: shareId.identifier,
        pushDate: new Date(),
    });
};

const updateP2PRemote = () => {
    if (!p2pRemote.value) return;
    const shareId = ShareClient.toShare("p2p", peerIdType.value, crypto.randomUUID());

    const i = tournament.remote!.findIndex((r) => getTypeFromIdentifier(r.identifier) === "p2p");
    if (i === -1) return;
    tournament.remote![i] = {
        identifier: shareId.identifier,
        pushDate: new Date(),
    };
};

const removeP2PRemote = () => {
    if (!p2pRemote.value) return;
    const i = tournament.remote!.findIndex((r) => getTypeFromIdentifier(r.identifier) === "p2p");
    if (i === -1) return;
    tournament.remote!.splice(i, 1);
};

const backgroundSync = useBackgroundSyncStore();

const shareLink = computed(() => {
    if (!p2pRemote.value) return "";
    return getShareLink(p2pRemote.value.identifier);
});

const sync = computed(() => {
    const sync = backgroundSync.active.find((s) => s.id === p2pRemote.value?.identifier);
    if (!sync) return null;
    return sync;
});

watch(
    () => sync.value?.state,
    () => {
        console.log("P2P sync state changed:", sync.value?.state);
    },
);

const syncState = computed(() => {
    if (!sync.value) return "disconnected";
    return sync.value.state;
});
</script>

<template>
    <div class="form">
        <h3>Sharing & Sync</h3>
        <p
            class="text-muted sync-status"
            :class="{
                'text-green': syncState == 'connected',
                'text-yellow': syncState == 'connecting',
                'text-red': syncState == 'disconnected',
                'text-gray': syncState == 'no-lock' || syncState == 'error',
            }"
            v-if="sync"
        >
            <template v-if="syncState === 'connected'">
                <ion-icon name="checkmark-circle-outline" />
                Sync active
            </template>
            <template v-else-if="syncState === 'connecting'">
                <ion-icon
                    name="sync-outline"
                    class="text-yellow animate-spin"
                />
                Connecting...
            </template>
            <template v-else-if="syncState === 'disconnected'">
                <ion-icon
                    name="close-circle-outline"
                    class="text-red"
                />
                Disconnected
            </template>
            <template v-else-if="syncState === 'no-lock'">
                <ion-icon
                    name="checkmark-circle-outline"
                    class="text-gray"
                />
                Sharing in another tab or window.
            </template>
        </p>
        <template v-if="p2pRemote">
            <div class="row mt-0">
                <div class="field flex-1">
                    <AdvancedInput
                        v-if="p2pRemote?.identifier"
                        label="Share ID"
                        v-model="shareLink"
                        type="text"
                        readonly
                        copyable
                    />
                </div>
                <button
                    @click="updateP2PRemote"
                    class="secondary"
                >
                    <ion-icon name="refresh-outline" />
                    Refresh ID
                </button>
                <button
                    class="danger"
                    @click="removeP2PRemote"
                >
                    <ion-icon name="close-outline" />
                    Stop Sharing
                </button>
            </div>
            <div class="row mt-0">
                <div class="field flex-1">
                    <span class="text-muted peer-id">Peer ID type:</span>
                    <SegmentPicker
                        v-model="peerIdType"
                        :options="options"
                    />
                    <p class="text-muted">
                        {{ options.find((o) => o.value === peerIdType)?.description }}
                    </p>
                </div>
            </div>
        </template>
        <div
            class="row items-center"
            v-else
        >
            <div class="field flex-1">
                <span class="text-muted peer-id">Peer ID type:</span>
                <SegmentPicker
                    v-model="peerIdType"
                    :options="options"
                />
                <p class="text-muted">
                    {{ options.find((o) => o.value === peerIdType)?.description }}
                </p>
            </div>

            <button @click="startP2P">Start sharing</button>
        </div>
    </div>
</template>
<style scoped>
.flex-1 {
    flex: 1;
}

.peer-id {
    margin-bottom: var(--spacing-xs);
}

select {
    margin-bottom: 0 !important;
}

.row.items-center {
    align-items: center;
}

.sync-status {
    display: flex;
    align-items: center;
    gap: 0.5em;
    margin-top: 0;
}
</style>
