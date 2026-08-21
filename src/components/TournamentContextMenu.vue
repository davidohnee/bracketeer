<script setup lang="ts">
import type { IRemote, Tournament } from "@/types/tournament";
import IconComboContextMenu from "./IconComboContextMenu.vue";
import { Notifications } from "./notifications/createNotification";
import { useTournamentsStore } from "@/stores/tournaments";
import ShareModal from "@/components/modals/ShareFullModal.vue";
import TrackModal from "@/components/modals/ShareViewerModal.vue";
import { computed, ref } from "vue";
import BadgeIcon from "./BadgeIcon.vue";
import { usePushSyncStore } from "@/stores/pushSync.ts";

const props = defineProps<{
    tournament: Tournament;
}>();

const emit = defineEmits<(e: "deleted") => void>();

const tournaments = useTournamentsStore();
const pushSync = usePushSyncStore();
const shareModal = ref<typeof ShareModal>();
const trackModal = ref<typeof TrackModal>();

const shareTournament = () => {
    shareModal.value?.open(props.tournament);
};

const shareViewerTournament = () => {
    if (!props.tournament.remote?.length) {
        Notifications.addError("Cannot share viewer link", {
            details: "The tournament must be shared first before sharing the viewer link.",
            timeout: 3000,
        });
        return;
    }
    trackModal.value?.open(props.tournament);
};

const downloadTournament = () => {
    tournaments.download(props.tournament);
};

const deleteTournament = () => {
    Notifications.addYesNo("Delete Tournament", {
        details: "Are you sure you want to delete the tournament? This action cannot be undone.",
        onYes: () => {
            tournaments.deleteTournament(props.tournament.id);
            emit("deleted");
            Notifications.addSuccess("Tournament deleted", {
                details: "The tournament has been deleted successfully.",
                timeout: 3000,
            });
        },
    });
};

const remoteStatus = (remote: IRemote) => {
    const sync = pushSync.active.find((s) => s.id === remote.identifier);
    if (!sync) return null;
    if (sync.state === "connected") return "connected";
    if (sync.state === "connecting") return "connecting";
    return "error";
};

type Status = {
    icon: string;
    color: string;
};

const status = computed((): Status | null => {
    const remotes = props.tournament.remote;
    if (!remotes) return null;
    console.log("remotes", remotes);
    const statuses = remotes.map((r) => remoteStatus(r)).filter((s) => s !== null);
    console.log("remotes", statuses);
    if (statuses.length === 0) return null;
    if (statuses.includes("error"))
        return {
            icon: "close-outline",
            color: "color-brand-red",
        };
    if (statuses.includes("connecting"))
        return {
            icon: "hourglass-outline",
            color: "color-brand-yellow",
        };
    if (statuses.includes("connected"))
        return {
            icon: "checkmark-outline",
            color: "color-brand-green",
        };

    return null;
});
</script>
<template>
    <ShareModal ref="shareModal" />
    <TrackModal ref="trackModal" />
    <div class="options">
        <button
            class="ghost small"
            type="button"
            @click="shareTournament"
        >
            <BadgeIcon
                icon="share-outline"
                :badge-icon="status?.icon"
                :badge-color="status?.color"
            />
        </button>
        <IconComboContextMenu
            align="right"
            :options="[
                {
                    id: 'share',
                    label: 'Share',
                    icon: 'share-outline',
                    action: shareTournament,
                },
                {
                    id: 'share-viewer',
                    label: 'Viewer Link',
                    icon: 'scan-outline',
                    action: shareViewerTournament,
                },
                {
                    id: 'download',
                    label: 'Download',
                    icon: 'download-outline',
                    action: downloadTournament,
                },
                {
                    id: 'delete',
                    label: 'Delete',
                    icon: 'trash-outline',
                    type: 'danger',
                    action: deleteTournament,
                },
            ]"
        />
    </div>
</template>

<style scoped>
.options {
    display: flex;
    align-items: center;
}
</style>
