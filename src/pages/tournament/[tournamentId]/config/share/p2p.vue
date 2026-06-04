<script setup lang="ts">
import type { Tournament } from "@/types/tournament";
import { useTournamentsStore } from "@/stores/tournaments";
import { computed, ref } from "vue";
import ShareClient, { fromShare, getShareLink } from "@/helpers/share";
import type { PeerIdType } from "@/helpers/share/p2p/backgroundSync";
import { useBackgroundSyncStore } from "@/stores/backgroundSync";
import AdvancedInput from "@/components/input/AdvancedInput.vue";

const props = defineProps<{
    tournament: Tournament;
}>();

const options = [
    {
        label: "Random each session",
        value: "random",
    },
    {
        label: "This browser session (default)",
        value: "session",
    },
    {
        label: "Permanent ID (persists across sessions)",
        value: "permanent",
    },
];

const tournaments = useTournamentsStore();
const tournament = tournaments.getTournamentById(props.tournament.id)!;
const p2pRemote = computed(() => tournament.remote?.find((r) => r.type === "p2p") ?? null);
const hasP2PRemote = computed(() => {
    if (!props.tournament.remote?.length) return false;
    return props.tournament.remote[0]!.type === "p2p";
});
const peerIdType = ref<PeerIdType>("session");

if (hasP2PRemote.value) {
    const identifier = props.tournament.remote![0]!.identifier;
    const { author } = fromShare(identifier);
    if (author === "session" || author === "random" || author === "permanent") {
        peerIdType.value = author;
    }
}

const startP2P = () => {
    if (hasP2PRemote.value) return;
    const shareId = ShareClient.toShare("p2p", peerIdType.value, crypto.randomUUID());

    tournament.remote ??= [];
    tournament.remote.push({
        type: "p2p",
        identifier: shareId.identifier,
        pushDate: new Date(),
    });
};

const updateP2PRemote = () => {
    if (!hasP2PRemote.value) return;
    const shareId = ShareClient.toShare("p2p", peerIdType.value, crypto.randomUUID());

    const i = tournament.remote!.findIndex((r) => r.type === "p2p");
    if (i === -1) return;
    tournament.remote![i] = {
        type: "p2p",
        identifier: shareId.identifier,
        pushDate: new Date(),
    };
};

const removeP2PRemote = () => {
    if (!hasP2PRemote.value) return;
    const i = tournament.remote!.findIndex((r) => r.type === "p2p");
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
</script>

<template>
    <div class="form">
        <h3>Sharing & Sync</h3>
        <p
            class="text-muted sync-status"
            :class="{
                'text-green': sync.state == 'connected',
                'text-yellow': sync.state == 'connecting',
                'text-red': sync.state == 'disconnected',
                'text-gray': sync.state == 'no-lock' || sync.state == 'error',
            }"
            v-if="sync"
        >
            <template v-if="sync.state === 'connected'">
                <ion-icon name="checkmark-circle-outline" />
                Sync active
            </template>
            <template v-else-if="sync.state === 'connecting'">
                <ion-icon
                    name="sync-outline"
                    class="text-yellow animate-spin"
                />
                Connecting...
            </template>
            <template v-else-if="sync.state === 'disconnected'">
                <ion-icon
                    name="close-circle-outline"
                    class="text-red"
                />
                Disconnected
            </template>
            <template v-else-if="sync.state === 'no-lock'">
                <ion-icon
                    name="checkmark-circle-outline"
                    class="text-gray"
                />
                Sharing in another tab or window.
            </template>
        </p>
        <template v-if="hasP2PRemote">
            <div class="row mt-0">
                <div class="field flex-1">
                    <select v-model="peerIdType">
                        <option
                            v-for="option in options"
                            :key="option.value"
                            :value="option.value"
                        >
                            {{ option.label }}
                        </option>
                    </select>
                </div>
                <button @click="updateP2PRemote">
                    <ion-icon name="refresh-outline" />
                    Refresh ID
                </button>
            </div>
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
                    class="danger"
                    @click="removeP2PRemote"
                >
                    <ion-icon name="close-outline" />
                    Stop Sharing
                </button>
            </div>
        </template>
        <div
            class="row"
            v-else
        >
            <div class="field flex-1">
                <select v-model="peerIdType">
                    <option
                        v-for="option in options"
                        :key="option.value"
                        :value="option.value"
                    >
                        {{ option.label }}
                    </option>
                </select>
            </div>

            <button @click="startP2P">Start sharing</button>
        </div>
    </div>
</template>
<style scoped>
.flex-1 {
    flex: 1;
}

select {
    margin-bottom: 0 !important;
}

.sync-status {
    display: flex;
    align-items: center;
    gap: 0.5em;
    margin-top: 0;
}
</style>
