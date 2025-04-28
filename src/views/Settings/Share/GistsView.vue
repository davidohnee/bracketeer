<script setup lang="ts">
import gistClient from "@/gistClient";
import { ref } from "vue";

const ME_KEY = "github.me";
const PAT_KEY = "github.pat";

const resetGithub = () => {
    localStorage.removeItem(ME_KEY);
    localStorage.removeItem(PAT_KEY);
    me.value = null;
    pat.value = "";
};

type GitHubMe = {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
};

const me = ref<GitHubMe | null>(JSON.parse(localStorage.getItem(ME_KEY) ?? "null"));
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
    <div class="settings">
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
            <p v-else>You are not logged in yet.</p>
            <div class="row center">
                <div class="field left">
                    <label>Personal Access Token</label>
                    <input
                        type="password"
                        v-model="pat"
                        placeholder="Enter your GitHub PAT"
                        @input="canUpdate = true"
                    />
                </div>
                <button
                    class="primary"
                    :disabled="!canUpdate"
                    @click="updateGithub"
                >
                    Save
                </button>
            </div>
        </div>
        <button
            class="danger"
            :disabled="!me && !pat"
            @click="resetGithub"
        >
            Reset
        </button>
    </div>
</template>

<style scoped>
.row {
    display: flex;
    flex-direction: row;
    gap: 1em;
}

@media (max-width: 768px) {
    .settings {
        padding: 1em;
    }
}

.center {
    align-items: center;
}

.left {
    align-items: flex-start;
}
</style>
