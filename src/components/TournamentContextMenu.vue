<script setup lang="ts">
import type { Tournament } from "@/types/tournament";
import IconComboContextMenu from "./IconComboContextMenu.vue";
import { Notifications } from "./notifications/createNotification";
import { useTournamentsStore } from "@/stores/tournaments";
import ShareModal from "@/components/modals/ShareFullModal.vue";
import TrackModal from "@/components/modals/ShareViewerModal.vue";
import { ref } from "vue";

const props = defineProps<{
    tournament: Tournament;
    onDeleted?: () => void;
}>();

const tournaments = useTournamentsStore();
const shareModal = ref<typeof ShareModal>();
const trackModal = ref<typeof TrackModal>();

const shareTournament = () => {
    shareModal.value?.open(props.tournament);
};

const shareViewerTournament = () => {
    if (!props.tournament.remote?.[0]?.identifier) {
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
            props.onDeleted?.();
            Notifications.addSuccess("Tournament deleted", {
                details: "The tournament has been deleted successfully.",
                timeout: 3000,
            });
        },
    });
};
</script>
<template>
    <ShareModal ref="shareModal" />
    <TrackModal ref="trackModal" />
    <IconComboContextMenu
        align="right"
        :options="[
            {
                id: 'share',
                label: 'Share',
                icon: 'share-social-outline',
                action: shareTournament,
            },
            {
                id: 'share-viewer',
                label: 'Viewer Link',
                icon: 'share-outline',
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
</template>
