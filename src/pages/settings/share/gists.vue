<script setup lang="ts">
import gistClient, { type GitHubUser } from "@/gistClient";
import { ref } from "vue";

const ME_KEY = "github.me";
const PAT_KEY = "github.pat";

const resetGithub = () => {
    localStorage.removeItem(ME_KEY);
    localStorage.removeItem(PAT_KEY);
    me.value = null;
    pat.value = "";
};

const me = ref<GitHubUser | null>(JSON.parse(localStorage.getItem(ME_KEY) ?? "null"));
const pat = ref<string>(localStorage.getItem(PAT_KEY) ?? "");

const canUpdate = ref(false);
const updateGithub = async () => {
    if (canUpdate.value) {
        me.value = await gistClient.setPat(pat.value);
        canUpdate.value = false;
    }
};
</script>

<template>
    <div class="form">
        <p v-if="me">
            You are logged in as

            <a
                :href="me.html_url"
                target="_blank"
            >
                <strong>{{ me.login }}</strong></a
            >.
        </p>
        <div
            class="help-container"
            v-else
        >
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
        <div class="row">
            <div class="field left">
                <label for="pat">Personal Access Token</label>
                <input
                    type="password"
                    v-model="pat"
                    placeholder="Enter your GitHub PAT"
                    id="pat"
                    @input="canUpdate = true"
                />
            </div>
            <div class="actions">
                <button
                    class="primary"
                    :disabled="!canUpdate"
                    @click="updateGithub"
                >
                    Save
                </button>
                <button
                    class="danger"
                    :disabled="!me && !pat"
                    @click="resetGithub"
                >
                    Reset
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.row {
    justify-content: space-between;
}

.actions {
    display: flex;
    flex-direction: row;
    gap: 1em;
}
</style>
