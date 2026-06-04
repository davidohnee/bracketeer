<script setup lang="ts">
import type { Tournament } from "@/types/tournament";
import { useTournamentsStore } from "@/stores/tournaments";
import { computed, ref } from "vue";
import ShareClient, { fromShare } from "@/helpers/share";
import type { PeerIdType } from "@/helpers/share/p2p/backgroundSync";
import { useBackgroundSyncStore } from "@/stores/backgroundSync";

const props = defineProps<{
    tournament: Tournament;
}>();

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

const id = computed(() => {
    if (!props.tournament.remote?.length) return null;
    const identifier = props.tournament.remote[0]!.identifier;
    return fromShare(identifier).tag;
});

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

const sync = computed(() => {
    const sync = backgroundSync.active.find((s) => s.id === p2pRemote.value?.identifier);
    if (!sync) return null;
    return sync;
});
</script>

<template>
    <div class="form">
        <h3>Sharing & Sync</h3>
        <div class="row start">
            <div class="field">
                <div
                    v-if="hasP2PRemote"
                    class="mt-0"
                >
                    <p>
                        Remote source:
                        <strong>
                            {{ id }}
                        </strong>
                    </p>
                    <button
                        class="danger"
                        @click="removeP2PRemote"
                    >
                        <ion-icon name="close-outline" />
                        Stop Sharing
                    </button>
                    <hr />
                    <p>State: {{ sync?.state }}</p>
                    <hr />
                    <select v-model="peerIdType">
                        <option value="random">Random each session</option>
                        <option value="session">This browser session (default)</option>
                        <option value="permanent">Permanent ID (persists across sessions)</option>
                    </select>
                    <button @click="updateP2PRemote">
                        <ion-icon name="refresh-outline" />
                        Refresh ID
                    </button>
                </div>
                <p v-else>This tournament is <strong>not</strong> linked to a remote source.</p>
            </div>
        </div>
        <div
            class="field"
            v-if="!hasP2PRemote"
        >
            <select v-model="peerIdType">
                <option value="random">Random each session</option>
                <option value="session">This browser session (default)</option>
                <option value="permanent">Permanent ID (persists across sessions)</option>
            </select>
            <button @click="startP2P">
                <ion-icon name="share-outline" />
                Share
            </button>
        </div>
    </div>
</template>
