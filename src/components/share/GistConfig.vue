<script setup lang="ts">
import type { Tournament } from "@/types/tournament";
import { useTournamentsStore } from "@/stores/tournaments";
import { computed, onMounted, ref, watch } from "vue";
import { Notifications } from "@/components/notifications/createNotification";
import { agoString } from "@/helpers/common";
import SimpleShareClient, { findRemoteWithMode } from "@/helpers/share";
import GistClient from "@/helpers/share/gist";
import { useAccountsStore } from "@/stores/accounts";
import type { Account } from "@/types/accounts";

const props = defineProps<{
    tournament: Tournament;
}>();

const tournaments = useTournamentsStore();
const accounts = useAccountsStore();
const selectedAccount = ref(accounts.all[0]?.id);
const tournament = tournaments.getTournamentById(props.tournament.id)!;
const canPush = ref<Account | null>(null);
const inputPat = ref("");
const gistRemote = computed(() => findRemoteWithMode(tournament, "gist"));

watch(
    [gistRemote],
    async () => {
        if (!gistRemote.value) return false;
        const identifier = gistRemote.value.identifier;
        canPush.value = await accounts.findShareAccount(identifier);
    },
    { immediate: true },
);

// const canPull = computed(() => !!gistRemote.value);

const pull = async () => {
    try {
        await SimpleShareClient.pullAndUpdate(tournament, gistRemote.value!);
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
    if (!gistRemote.value) return null;
    const pushed = gistRemote.value.pushDate;
    if (!pushed) return null;
    return typeof pushed === "string" ? new Date(pushed) : pushed;
});

const lastPushedAgo = computed(() => {
    const lastPushedDate = lastPushed.value;
    if (!lastPushedDate) return null;
    return agoString(lastPushedDate);
});

const remoteDescription = computed(() => {
    if (!gistRemote.value) return "Not shared";
    const identifier = gistRemote.value.identifier;
    try {
        const share = GistClient.fromShare(identifier);
        return share ? `${share.author} via ${share.mode}` : "Unknown source";
    } catch (error) {
        console.error("Error parsing remote source:", error);
        return "Unknown source";
    }
});

const setPat = async () => {
    const account = await GistClient.accessTokenToAccount(inputPat.value);
    if (account) {
        accounts.add(account);

        if (!selectedAccount.value) {
            selectedAccount.value = account.id;
        }
    }
};

const save = async () => {
    const tournament = props.tournament;
    if (!tournament) return;

    await GistClient.create(tournament, {
        account: accounts.all.find((x) => x.id === selectedAccount.value) ?? null,
    });
};

const share = () => {
    save();
};

onMounted(() => {
    const identifier = gistRemote.value?.identifier;
    if (!identifier) return false;
    accounts.findShareAccount(identifier).then((account) => {
        canPush.value = account;
    });
});
</script>

<template>
    <template v-if="lastPushed">
        <div class="row start">
            <div class="field">
                <p class="my-0">
                    Last pushed:
                    <strong>
                        {{ lastPushedAgo }}
                    </strong>
                </p>
            </div>
        </div>
        <div class="row start">
            <div class="field">
                <p
                    v-if="gistRemote"
                    class="mt-0"
                >
                    Remote source:
                    <strong>
                        {{ remoteDescription }}
                    </strong>
                </p>
            </div>
        </div>
        <div class="row start">
            <div class="field">
                <button
                    class="secondary"
                    @click="pull"
                >
                    <ion-icon name="cloud-download-outline" />
                    Pull
                </button>
            </div>
            <div class="field">
                <button
                    class="secondary"
                    @click="
                        GistClient.create(tournament, {
                            updateOnly: true,
                            account: canPush,
                        })
                    "
                >
                    <ion-icon name="cloud-upload-outline" />
                    Push
                </button>
            </div>
            <div class="field">
                <button
                    class="danger"
                    @click="GistClient.delete(tournament, gistRemote!, { account: canPush })"
                >
                    <ion-icon name="trash-outline" />
                    Unlink Remote
                </button>
            </div>
        </div>
    </template>
    <template v-else-if="!accounts.all.length">
        <h3>GitHub Gists PAT</h3>
        <p>
            To use this feature, you need to provide a GitHub Gists PAT. This is used to create
            gists for sharing tournaments.
        </p>
        <label
            for="pat"
            class="text-muted"
        >
            Your personal access token
        </label>
        <input
            type="text"
            v-model="inputPat"
            placeholder="Enter your PAT here"
            id="pat"
        />
        <button
            @click="setPat"
            :disabled="!inputPat.length"
        >
            Save
        </button>
    </template>
    <template v-else>
        <div class="options">
            <div class="info">
                <h4>New share link</h4>
                <p>
                    Share a link to this tournament. Others will be able to view the tournament or
                    duplicate it.
                    <br />
                    <span class="text-muted"> This will create a new gist on GitHub. </span>
                </p>
            </div>
            <div class="account-and-create">
                <label
                    for="account-selection"
                    class="text-muted"
                >
                    Select account to share with
                </label>
                <select
                    v-model="selectedAccount"
                    id="account-selection"
                >
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
