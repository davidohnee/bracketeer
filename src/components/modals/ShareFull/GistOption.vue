<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { Tournament } from "@/types/tournament";
import ShareClient, { getTypeFromIdentifier } from "@/helpers/share";
import { useAccountsStore } from "@/stores/accounts";
import FoldableShareOption from "./FoldableShareOption.vue";

const accounts = useAccountsStore();

const inputPat = ref("");
const canPush = ref(false);
const selectedAccount = ref(accounts.all[0]?.id);
const action = ref<"pat" | "gist">("pat");

const props = defineProps<{
    tournament: Tournament;
}>();

const gistIdentifier = computed(() => {
    return props.tournament.remote?.find((x) => getTypeFromIdentifier(x.identifier) === "gist")
        ?.identifier;
});

onMounted(() => {
    const identifier = gistIdentifier.value;
    if (!identifier) return false;
    accounts.findShareAccount(identifier).then((account) => {
        canPush.value = !!account;

        if (canPush.value) {
            action.value = "gist";
        }
    });
});

const setPat = async () => {
    const account = await ShareClient.accessTokenToAccount(inputPat.value, "gist");
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

    await ShareClient.share(tournament, {
        account: accounts.all.find((x) => x.id === selectedAccount.value) ?? null,
    });
};

const share = () => {
    action.value = "gist";
    save();
};
</script>
<template>
    <FoldableShareOption
        title="Share via GitHub Gist"
        :enabled="!!gistIdentifier"
    >
        <div class="content">
            <div v-if="action === 'gist'">
                <p>This tournament is shared as a GitHub Gist.</p>
            </div>
            <template v-if="!accounts.all.length">
                <h3>GitHub Gists PAT</h3>
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
            <template v-else-if="!action || action === 'pat'">
                <div class="options">
                    <div class="info">
                        <h4>New share link</h4>
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
        </div>
    </FoldableShareOption>
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
