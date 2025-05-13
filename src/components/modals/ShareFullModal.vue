<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
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

const update = () => {
    const tournament = sharingItem.value;
    if (!tournament) return;

    const tournamentCopy = deepCopy(tournament);

    tournaments.share(tournamentCopy, publicGist.value);

    dialog.value?.close();
};

const canUpdate = computed(() => {
    if (!sharingItem.value?.remote?.length) return false;

    const identifier = sharingItem.value.remote[0].identifier;

    return gistClient.isMine(identifier);
});

defineExpose({ open });
</script>
<template>
    <dialog ref="dialog">
        <ion-icon
            @click="dialog?.close()"
            class="close"
            name="close"
        ></ion-icon>
        <template v-if="!action && sharingItem">
            <h2>Share "{{ sharingItem.name }}"</h2>
            <div class="options">
                <div
                    class="option"
                    v-if="canUpdate"
                >
                    <div class="info">
                        <h3>Update remote</h3>
                        <p>
                            This course is already shared. Update the remote to share the latest
                            changes.
                        </p>
                    </div>
                    <button @click="update">Update</button>
                </div>
                <div class="option">
                    <div class="info">
                        <h3>New share</h3>
                        <p>
                            Share this course for the first time. This will create a new gist on
                            GitHub.
                        </p>
                    </div>
                    <button @click="action = 'gist'">Share</button>
                </div>
                <div class="option">
                    <div class="info">
                        <h3>Download</h3>
                        <p>
                            Download the course as a JSON file. This can be used to import the
                            course on another device.
                        </p>
                    </div>
                    <button @click="download">Download</button>
                </div>
            </div>
        </template>
        <template v-else-if="!patSet && action">
            <h2>GitHub Gists PAT</h2>
            <p>
                To use this feature, you need to provide a GitHub Gists PAT. This is used to create
                gists for sharing courses.
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
            <div v-if="shareUrl">
                <p>Your share link:</p>
                <input
                    type="text"
                    readonly
                    :value="shareUrl"
                />
            </div>
            <div v-else>
                <p>
                    To share this course, click the button below. This will create a gist on GitHub
                    with the course data.
                </p>
                <div class="options">
                    <div class="option">
                        <input
                            id="public-gist"
                            type="checkbox"
                            label="Public Gist"
                            v-model="publicGist"
                        />
                        <label for="public-gist">Public Gist</label>
                    </div>
                </div>
                <button @click="save">Share</button>
            </div>
        </template>
    </dialog>
</template>
<style scoped>
dialog[open],
dialog[open] > div {
    outline: none;
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 40vw;
    overflow: hidden;
    gap: 1em;

    & input {
        width: unset;
    }
}

.options {
    display: flex;
    flex-direction: row;
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

        & input[type="checkbox"] {
            width: 1.4em;
            height: 1.4em;
            margin: 0;
            cursor: pointer;
            accent-color: var(--color-primary);
        }
    }
}

@media (max-width: 600px) {
    dialog[open],
    dialog[open] > div {
        max-width: 80vw !important;
    }

    .options .option:not(:has(input[type="checkbox"])) {
        grid-template-columns: 1fr;
        gap: 0.5em;
    }
}
</style>
