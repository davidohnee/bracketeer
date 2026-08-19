<script setup lang="ts">
import { findRemoteWithMode, type ShareMode } from "@/helpers/share";
import { usePushSyncStore } from "@/stores/pushSync";
import type { Tournament } from "@/types/tournament";
import { computed } from "vue";

const props = defineProps<{
    tournament: Tournament;
    mode: ShareMode;
}>();

const remote = computed(() => findRemoteWithMode(props.tournament, props.mode));

const pushSync = usePushSyncStore();

const sync = computed(() => {
    const sync = pushSync.active.find((s) => s.id === remote.value?.identifier);
    if (!sync) return null;
    return sync;
});

type Status = "connected" | "connecting" | "error" | "disabled";

const status = computed((): Status | null => {
    if (!remote.value) return null;
    if (!sync.value) return null;
    if (sync.value.state === "connected") return "connected";
    if (sync.value.state === "connecting") return "connecting";
    return "error";
});

const prettyMode = computed(() => {
    switch (props.mode) {
        case "gist":
            return "Gist";
        case "p2p":
            return "Peer-to-peer";
        default:
            return props.mode;
    }
});
</script>
<template>
    <div
        v-if="status"
        class="status"
        :class="{
            green: status == 'connected',
            yellow: status == 'connecting',
            grey: status == 'disabled',
            red: status == 'error',
        }"
    >
        {{ prettyMode }}: {{ status }}
    </div>
</template>
