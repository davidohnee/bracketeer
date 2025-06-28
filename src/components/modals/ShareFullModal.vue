<script setup lang="ts">
import { onMounted, ref } from "vue";
import gistClient from "@/gistClient";
import type { Tournament } from "@/types/tournament";
import { useTournamentsStore } from "@/stores/tournaments";
import { deepCopy } from "@/helpers/common";

const patSet = ref(false);
const shareUrl = ref("");
const publicGist = ref(false);
const sharingItem = ref<Tournament>();

const action = ref<null | "gist">(null);

const tournaments = useTournamentsStore();

const inputPat = ref("");
const dialog = ref<HTMLDialogElement>();

onMounted(() => {
    const pat = gistClient.pat();
    patSet.value = !!pat;
});

const open = (course: Tournament) => {
    action.value = null;
    dialog.value?.showModal();
    if (course.id !== sharingItem.value?.id) {
        publicGist.value = false;
        shareUrl.value = "";
    }
    sharingItem.value = course;
};

const setPat = () => {
    gistClient.setPat(inputPat.value);
    patSet.value = true;
};

const save = async () => {
    const tournament = sharingItem.value;
    if (!tournament) return;

    const tournamentCopy = deepCopy(tournament);
    delete tournamentCopy.remote;

    shareUrl.value = (await tournaments.share(tournamentCopy, publicGist.value)) ?? "";
};

const download = () => {
    tournaments.download(sharingItem.value!);
    dialog.value?.close();
};

const share = () => {
    action.value = "gist";
    save();
};

defineExpose({ open });
</script>
<template>
    <dialog ref="dialog">
        <div class="content">
            <ion-icon
                @click="dialog?.close()"
                class="close"
                name="close"
            ></ion-icon>
            <template v-if="!action && sharingItem">
                <h2>Share "{{ sharingItem.name }}"</h2>
                <div class="options">
                    <div class="option">
                        <div class="info">
                            <h3>New share</h3>
                            <p>
                                Share this tournament for the first time. This will create a new
                                gist on GitHub.
                            </p>
                        </div>
                        <button @click="share">Share</button>
                    </div>
                    <div class="option">
                        <div class="info">
                            <h3>Download</h3>
                            <p>
                                Download the tournament as a JSON file. This can be used to import
                                the course on another device.
                            </p>
                        </div>
                        <button @click="download">Download</button>
                    </div>
                </div>
            </template>
            <template v-else-if="!patSet && action">
                <h2>GitHub Gists PAT</h2>
                <p>
                    To use this feature, you need to provide a GitHub Gists PAT. This is used to
                    create gists for sharing courses.
                </p>
                <input
                    type="text"
                    v-model="inputPat"
                    placeholder="Enter your PAT here"
                />
                <button
                    @click="setPat"
                    :disabled="!inputPat.length"
                >
                    Save
                </button>
            </template>
            <template v-else-if="action == 'gist' && sharingItem">
                <h2>Share "{{ sharingItem.name }}"</h2>
                <template v-if="shareUrl">
                    <p>Your share link:</p>
                    <input
                        type="text"
                        readonly
                        :value="shareUrl"
                    />
                </template>
            </template>
        </div>
    </dialog>
</template>
<style scoped>
.options {
    display: flex;
    flex-direction: column;
    gap: 1em;

    .option {
        display: grid;
        grid-template-columns: 1fr 20ch;
        gap: 1em;
        align-items: center;
        border: none;
        border-radius: 0;

        &:not(:last-child) {
            border-bottom: 2px solid var(--color-border);
        }
    }
}
</style>
