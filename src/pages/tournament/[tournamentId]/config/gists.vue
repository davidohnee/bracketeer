<script setup lang="ts">
import type { Tournament } from "@/types/tournament";
import { useTournamentsStore } from "@/stores/tournaments";
import { computed, onMounted, ref } from "vue";
import ShareModal from "@/components/modals/ShareFullModal.vue";
import gistClient from "@/gistClient";
import { Notifications } from "@/components/notifications/createNotification";
import { agoString } from "@/helpers/common";
import { fromShare } from "@/share";

const props = defineProps<{
    tournament: Tournament;
}>();

const tournaments = useTournamentsStore();
const tournament = tournaments.getTournamentById(props.tournament.id)!;
const canPush = ref(false);

const shareModal = ref<typeof ShareModal>();

onMounted(async () => {
    if (!props.tournament.remote?.length) return false;
    const identifier = props.tournament.remote[0]!.identifier;
    canPush.value = await gistClient.isMine(identifier);
});

const canPull = computed(() => {
    if (!props.tournament.remote?.length) return false;
    return !!props.tournament.remote[0]!.identifier;
});

const pull = async () => {
    try {
        await tournaments.pull({
            tournament,
        });
        Notifications.addSuccess("Tournament updated", {
            details: "The tournament has been updated successfully.",
            timeout: 3000,
        });
    } catch (error) {
        console.error("Error pulling tournament:", error);
        Notifications.addError("Error updating tournament", {
            details: "There was an error updating the tournament. Please try again.",
            timeout: 3000,
        });
    }
};

const lastPushed = computed(() => {
    if (!props.tournament.remote?.length) return null;
    const pushed = props.tournament.remote[0]!.pushDate;
    if (!pushed) return null;
    return typeof pushed === "string" ? new Date(pushed) : pushed;
});

const lastPushedAgo = computed(() => {
    const lastPushedDate = lastPushed.value;
    if (!lastPushedDate) return null;
    return agoString(lastPushedDate);
});

const remoteDescription = computed(() => {
    if (!props.tournament.remote?.length) return "Not shared";
    const identifier = props.tournament.remote[0]!.identifier;
    try {
        const share = fromShare(identifier);
        return share ? `${share.author} via ${share.mode}` : "Unknown source";
    } catch (error) {
        console.error("Error parsing remote source:", error);
        return "Unknown source";
    }
});
</script>

<template>
    <ShareModal ref="shareModal" />
    <div class="form">
        <h3>Sharing & Sync</h3>
        <div
            v-if="lastPushed"
            class="row"
        >
            <div class="field">
                <p class="my-0">
                    Last pushed:
                    <strong>
                        {{ lastPushedAgo }}
                    </strong>
                </p>
            </div>
        </div>
        <div class="row">
            <div class="field">
                <p
                    v-if="props.tournament.remote?.length"
                    class="mt-0"
                >
                    Remote source:
                    <strong>
                        {{ remoteDescription }}
                    </strong>
                </p>
                <p v-else>This tournament is <strong>not</strong> linked to a remote source.</p>
            </div>
        </div>
        <div class="row">
            <div
                class="field"
                v-if="canPull"
            >
                <button
                    class="secondary"
                    @click="pull"
                >
                    <ion-icon name="cloud-download-outline" />
                    Pull
                </button>
            </div>
            <div
                class="field"
                v-if="canPush"
            >
                <button
                    class="secondary"
                    @click="tournaments.share(props.tournament)"
                >
                    <ion-icon name="cloud-upload-outline" />
                    Push
                </button>
            </div>
            <div
                class="field"
                v-if="!tournament.remote?.length"
            >
                <button @click="shareModal?.open(props.tournament)">
                    <ion-icon name="share-outline" />
                    Share
                </button>
            </div>
        </div>
    </div>
</template>
