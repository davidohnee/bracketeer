<script setup lang="ts">
import { computed, ref } from "vue";
import type { Tournament } from "@/types/tournament";
import { copyToClipboard } from "@/helpers/common";
import { getShareLink } from "@/helpers/share";
import AdvancedInput from "@/components/input/AdvancedInput.vue";
import GistOption from "./ShareFull/GistOption.vue";
import P2POption from "./ShareFull/P2POption.vue";

const sharingItem = ref<Tournament>();

const action = ref<null | "gist">(null);

const dialog = ref<HTMLDialogElement>();

const open = (tournament: Tournament) => {
    action.value = null;
    dialog.value?.showModal();
    sharingItem.value = tournament;
};

const shareUrl = computed(() => {
    const remote = sharingItem.value?.remote?.[0];
    if (!remote) return "";
    return getShareLink(remote.identifier);
});

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
            <h2 v-if="sharingItem">Share "{{ sharingItem.name }}"</h2>

            <GistOption
                v-if="sharingItem"
                :tournament="sharingItem"
            />
            <P2POption
                v-if="sharingItem"
                :tournament="sharingItem"
            />

            <template v-if="shareUrl && sharingItem">
                <p class="my-0">Your share link:</p>
                <AdvancedInput
                    :model-value="shareUrl"
                    type="text"
                    copyable
                    readonly
                    :loading="!shareUrl"
                    @copy="copyToClipboard(shareUrl)"
                />
            </template>
        </div>
    </dialog>
</template>
<style scoped>
.options {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-m);

    .option {
        display: grid;
        grid-template-columns: 1fr 20ch;
        gap: var(--spacing-m);
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

.content {
    min-width: 40vw;
}

.account-and-create {
    display: flex;
    align-items: center;
    gap: var(--spacing-m);

    & button {
        flex: 1;
    }

    & select {
        width: 20ch;
        margin: 0;
    }
}

h2 {
    margin-right: var(--spacing-l);
}
</style>
