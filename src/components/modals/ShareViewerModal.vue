<script setup lang="ts">
import { computed, ref } from "vue";
import type { Tournament } from "@/types/tournament";
import { getModeFromIdentifier, getShareLink } from "@/helpers/share";
import { QrcodeSvg } from "qrcode.vue";
import AdvancedInput from "../input/AdvancedInput.vue";
import { copyToClipboard } from "@/helpers/common";

const shareUrl = ref("");

const action = ref<null | "gist">(null);

const dialog = ref<HTMLDialogElement>();
const tournament = ref<Tournament>();

const preferredRemote = computed<null | { identifier: string }>(() => {
    if (!tournament.value?.remote) return null;
    const preferredOrder = ["gist", "p2p"];
    const sorted = [...tournament.value.remote].sort((a, b) => {
        const aIndex = preferredOrder.indexOf(getModeFromIdentifier(a.identifier) as string);
        const bIndex = preferredOrder.indexOf(getModeFromIdentifier(b.identifier) as string);
        return aIndex - bIndex;
    });
    return sorted.at(0) ?? null;
});

const open = (newTournament: Tournament) => {
    tournament.value = newTournament;

    action.value = null;
    dialog.value?.showModal();

    shareUrl.value = getShareLink(preferredRemote.value!.identifier!, "viewer");
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
                <advanced-input
                    type="text"
                    label="Your share link:"
                    show-label
                    copyable
                    readonly
                    @copy="copyToClipboard(shareUrl)"
                    :model-value="shareUrl"
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
    margin-bottom: var(--spacing-m);
}

.options {
    display: flex;
    flex-direction: row;
    gap: var(--spacing-m);

    .option {
        display: grid;
        grid-template-columns: 1fr 20ch;
        gap: var(--spacing-m);
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
</style>
