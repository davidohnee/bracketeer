<script setup lang="ts">
import { ref } from "vue";
import type { Tournament } from "@/types/tournament";
import { getShareLink } from "@/share";
import { QrcodeSvg } from "qrcode.vue";

const shareUrl = ref("");

const action = ref<null | "gist">(null);

const dialog = ref<HTMLDialogElement>();
const tournament = ref<Tournament>();

const open = (newTournament: Tournament) => {
    if (!newTournament.remote?.[0]?.identifier) {
        return;
    }

    tournament.value = newTournament;

    action.value = null;
    dialog.value?.showModal();

    shareUrl.value = getShareLink(newTournament.remote[0].identifier).replace("/s/", "/v/");
};

defineExpose({ open });
</script>
<template>
    <dialog ref="dialog">
        <ion-icon
            @click="dialog?.close()"
            class="close"
            name="close"
        ></ion-icon>
        <template v-if="tournament">
            <h2>Share "{{ tournament.name }}"</h2>
            <qrcode-svg
                class="qrcode"
                :value="shareUrl"
                level="H"
            />
            <div v-if="shareUrl">
                <p>Your share link:</p>
                <input
                    type="text"
                    readonly
                    :value="shareUrl"
                />
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

    & input {
        width: unset;
    }
}

.qrcode {
    width: 20vw;
    height: 20vw;
    aspect-ratio: 1;
    margin: 0 auto;
    margin-bottom: 1em;
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
            border-bottom: 2px solid var(--bg-base-lt);
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
</style>
