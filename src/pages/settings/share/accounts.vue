<script setup lang="ts">
import { accessTokenToAccount } from "@/helpers/share";
import { useAccountsStore } from "@/stores/accounts";
import { ref } from "vue";

const accounts = useAccountsStore();

const addType = ref<"gist">("gist");
const accessToken = ref<string>("");

const add = async () => {
    const account = await accessTokenToAccount(accessToken.value, addType.value);
    if (account) {
        accounts.add(account);
    }
};
</script>

<template>
    <div class="form">
        <div class="account-editor">
            <div
                class="account"
                v-for="account in accounts.all"
                :key="account.id"
            >
                <span>{{ account.displayName }}</span>
                <button
                    @click="accounts.remove(account.id)"
                    class="danger secondary"
                >
                    Unlink
                </button>
            </div>
            <div class="account">
                <div class="inputs">
                    <select v-model="addType">
                        <option value="gist">GitHub Gists</option>
                    </select>
                    <input
                        type="password"
                        placeholder="Enter your access token..."
                        v-model="accessToken"
                    />
                </div>
                <button
                    @click="add"
                    class="secondary"
                >
                    Add
                </button>
            </div>
        </div>
        <div class="help-container">
            <p class="text-muted">
                Share your tournament's live state (brackets, scores, schedules) as a GitHub Gist.
                With a Personal Access Token (PAT), you can push updates and edit the state across
                devices. Viewers without your PAT see a live, read-only version.
            </p>
            <h4>Get started</h4>
            <ol>
                <li>
                    Create a Personal Access Token (PAT)
                    <ol>
                        <li>
                            Go to
                            <a href="https://github.com/settings/personal-access-tokens/new">
                                GitHub Settings > Developer Settings > Personal Access Tokens.
                            </a>
                        </li>
                        <li>Enter a name</li>
                        <li>Select a validity</li>
                        <li>Click 'Add permissions' and select 'Gists'</li>
                        <li>Click 'Generate token'</li>
                    </ol>
                </li>
                <li>Paste your PAT below and click 'Save'</li>
                <li>Navigate to your tournament</li>
                <li>Click the three dots to the right of the name</li>
                <li>Select 'Share'</li>
            </ol>
        </div>
    </div>
</template>

<style scoped>
.row {
    align-items: center;
}

.account {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--color-surface);
    padding: var(--spacing-m);

    &:not(:last-child) {
        border-bottom: 1px solid var(--color-border);
    }

    & select,
    input {
        margin: 0;
    }

    .inputs {
        display: flex;
        gap: var(--spacing-xs);
    }
}

@media screen and (max-width: 768px) {
    .account .inputs {
        flex-direction: column;
    }

    .account:has(.inputs) {
        flex-direction: column;
        align-items: stretch;
        gap: var(--spacing-xs);
    }
}

.account-editor {
    border-radius: var(--radius-l);
    overflow: hidden;
    border: 1px solid var(--color-border);
}

.actions {
    display: flex;
    flex-direction: row;
    gap: var(--spacing-m);
}
</style>
