<script setup lang="ts">
import { ref } from "vue";
import type { Tournament } from "@/types/tournament";
import { copyToClipboard } from "@/helpers/common";
import ShareClient from "@/helpers/share";
import AdvancedInput from "@/components/input/AdvancedInput.vue";
import { useAccountsStore } from "@/stores/accounts";

const shareUrl = ref("");
const sharingItem = ref<Tournament>();
const canPush = ref(false);

const action = ref<null | "gist">(null);

const accounts = useAccountsStore();

const inputPat = ref("");
const selectedAccount = ref(accounts.all[0]?.id);
const dialog = ref<HTMLDialogElement>();

const open = (tournament: Tournament) => {
    action.value = null;
    dialog.value?.showModal();
    if (tournament.id !== sharingItem.value?.id) {
        shareUrl.value = "";
    }
    sharingItem.value = tournament;

    if (!sharingItem.value?.remote?.length) return false;
    const identifier = sharingItem.value.remote[0]!.identifier;
    accounts.findShareAccount(identifier).then((account) => {
        canPush.value = !!account;

        if (canPush.value) {
            action.value = "gist";
            shareUrl.value = ShareClient.getShareLink(tournament.remote![0]!.identifier);
        }
    });
};

const setPat = async () => {
    const account = await ShareClient.accessTokenToAccount(inputPat.value, "gist");
    if (account) {
        accounts.add(account);
    }
};

const save = async () => {
    const tournament = sharingItem.value;
    if (!tournament) return;

    const share = await ShareClient.share(tournament, {
        account: accounts.all.find((x) => x.id === selectedAccount.value),
    });
    if (share) {
        shareUrl.value = share.link ?? "";
    }
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
            <template v-if="!accounts.all.length">
                <h2>GitHub Gists PAT</h2>
                <p>
                    To use this feature, you need to provide a GitHub Gists PAT. This is used to
                    create gists for sharing tournaments.
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
            <template v-else-if="!action && sharingItem">
                <h2>Share "{{ sharingItem.name }}"</h2>
                <div class="options">
                    <div class="info">
                        <h3>New share link</h3>
                        <p>
                            Share a link to this tournament. Others will be able to view the
                            tournament or duplicate it.
                            <br />
                            <span class="text-muted"> This will create a new gist on GitHub. </span>
                        </p>
                    </div>
                    <div class="account-and-create">
                        <select v-model="selectedAccount">
                            <option
                                v-for="account in accounts.all"
                                :key="account.id"
                                :value="account.id"
                            >
                                {{ account.displayName }}
                            </option>
                        </select>
                        <button @click="share">Create link</button>
                    </div>
                </div>
            </template>

            <template v-else-if="action == 'gist' && sharingItem">
                <h2>Share "{{ sharingItem.name }}"</h2>
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

.account-and-create {
    display: flex;
    align-items: center;
    gap: 1em;

    & button {
        flex: 1;
    }

    & select {
        width: 20ch;
        margin: 0;
    }
}

h2 {
    margin-right: 2em;
}
</style>
