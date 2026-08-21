<script setup lang="ts">
import { usePushSyncStore } from "@/stores/pushSync";
import type { IRemote, Tournament } from "@/types/tournament";
import { computed } from "vue";

const props = defineProps<{
    tournament: Tournament;
}>();

const pushSync = usePushSyncStore();

type Status = "connected" | "connecting" | "error" | "disabled";

const remoteStatus = (remote: IRemote): Status | null => {
    const sync = pushSync.active.find((s) => s.id === remote.identifier);
    if (!sync) return null;
    if (sync.state === "connected") return "connected";
    if (sync.state === "connecting") return "connecting";
    return "error";
};

const status = computed((): Status | null => {
    const remotes = props.tournament.remote;
    if (!remotes) return null;
    console.log("remotes", remotes);
    const statuses = remotes.map((r) => remoteStatus(r)).filter((s) => s !== null);
    console.log("remotes", statuses);
    if (statuses.length === 0) return null;
    if (statuses.includes("error")) return "error";
    if (statuses.includes("connecting")) return "connecting";
    if (statuses.includes("connected")) return "connected";

    return "disabled";
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
        {{ status }}
    </div>
</template>
