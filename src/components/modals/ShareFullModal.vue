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
                            <h3>New share link</h3>
                            <p>
                                Share a link to this tournament. Others will be able to view the
                                tournament or duplicate it.
                                <br />
                                <span class="text-muted">
                                    This will create a new gist on GitHub.
                                </span>
                            </p>
                        </div>
                        <button @click="share">Create link</button>
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

        :first-child {
            max-width: 60ch;
        }

        &:not(:last-child) {
            border-bottom: 2px solid var(--color-border);
        }
    }
}
</style>
