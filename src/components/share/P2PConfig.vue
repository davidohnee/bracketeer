<script setup lang="ts">
import type { Tournament } from "@/types/tournament";
import { useTournamentsStore } from "@/stores/tournaments";
import { computed, ref } from "vue";
import { findRemoteIndexWithMode, findRemoteWithMode, getShareLink } from "@/helpers/share";
import P2PClient from "@/helpers/share/p2p";
import type { PeerIdType } from "@/helpers/share/p2p/common";
import { usePushSyncStore } from "@/stores/pushSync";
import AdvancedInput from "@/components/input/AdvancedInput.vue";
import SegmentPicker from "@/components/SegmentPicker.vue";
import { generateSecureId } from "@/helpers/id";

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
const p2pRemote = computed(() => findRemoteWithMode(tournament, "p2p"));
const peerIdType = ref<PeerIdType>("session");

if (p2pRemote.value) {
    const identifier = p2pRemote.value.identifier;
    const { type } = P2PClient.fromShare(identifier);
    if (type === "session" || type === "random" || type === "permanent") {
        peerIdType.value = type;
    }
}

const startP2P = () => {
    if (p2pRemote.value) return;

    P2PClient.create(tournament, {
        type: peerIdType.value,
    });
};

const updateP2PRemote = () => {
    if (!p2pRemote.value) return;
    const shareId = P2PClient.toShare({
        mode: "p2p",
        type: peerIdType.value,
        peerId: generateSecureId(),
    });

    const i = findRemoteIndexWithMode(tournament, "p2p");
    if (i === -1) return;
    tournament.remote![i] = {
        identifier: shareId.identifier,
        pushDate: new Date(),
    };
};

const removeP2PRemote = () => {
    if (!p2pRemote.value) return;
    const i = findRemoteIndexWithMode(tournament, "p2p");
    if (i === -1) return;
    tournament.remote!.splice(i, 1);
};

const pushSync = usePushSyncStore();

const shareLink = computed(() => {
    if (!p2pRemote.value) return "";
    return getShareLink(p2pRemote.value.identifier);
});

const sync = computed(() => {
    const sync = pushSync.active.find((s) => s.id === p2pRemote.value?.identifier);
    if (!sync) return null;
    return sync;
});

const syncState = computed(() => {
    if (!sync.value) return "disconnected";
    return sync.value.state;
});
</script>

<template>
    <div class="form">
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
                        :modelValue="shareLink"
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
