<script setup lang="ts">
import type { Tournament } from "@/types/tournament.ts";
import FoldableShareOption from "./FoldableShareOption.vue";
import { computed, onMounted, ref } from "vue";
import ShareClient, { fromShare, getTypeFromIdentifier } from "@/helpers/share/index.ts";
import SegmentPicker from "@/components/SegmentPicker.vue";
import { useTournamentsStore } from "@/stores/tournaments.ts";

const props = defineProps<{
    tournament: Tournament;
}>();

const tournaments = useTournamentsStore();
const tournament = tournaments.getTournamentById(props.tournament.id)!;
const p2pType = ref<"random" | "session" | "permanent">("session");

const p2pRemote = computed(() => {
    return props.tournament.remote?.find((x) => getTypeFromIdentifier(x.identifier) === "p2p");
});

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

const startP2P = () => {
    if (p2pRemote.value) return;
    const shareId = ShareClient.toShare("p2p", p2pType.value, crypto.randomUUID());

    tournament.remote ??= [];
    tournament.remote.push({
        identifier: shareId.identifier,
        pushDate: new Date(),
    });
};

const updateP2PRemote = () => {
    if (!p2pRemote.value) return;
    const shareId = ShareClient.toShare("p2p", p2pType.value, crypto.randomUUID());

    const i = tournament.remote!.findIndex((r) => getTypeFromIdentifier(r.identifier) === "p2p");
    if (i === -1) return;
    tournament.remote![i] = {
        identifier: shareId.identifier,
        pushDate: new Date(),
    };
};

onMounted(() => {
    if (!p2pRemote.value) return;
    const identifier = props.tournament.remote![0]!.identifier;
    const { author } = fromShare(identifier);
    if (author === "session" || author === "random" || author === "permanent") {
        p2pType.value = author;
    }
});
</script>

<template>
    <FoldableShareOption
        title="Peer-to-peer"
        :enabled="!!p2pRemote"
    >
        <div class="form">
            <div class="row">
                <SegmentPicker
                    v-model="p2pType"
                    :options="options"
                    :disabled="!p2pRemote"
                />
            </div>
            <div class="row">
                <button
                    @click="updateP2PRemote"
                    class="secondary"
                    v-if="p2pRemote"
                >
                    <ion-icon name="refresh-outline" />
                    Refresh ID
                </button>
                <button
                    @click="startP2P"
                    class="secondary"
                    v-if="!p2pRemote"
                >
                    Start sharing
                </button>
            </div>
        </div>
    </FoldableShareOption>
</template>
