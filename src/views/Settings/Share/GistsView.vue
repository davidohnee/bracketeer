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
    <div class="settings">
        <div class="form">
            <p v-if="me">
                You are logged in as

                <a :href="me.html_url" target="_blank">
                    <strong>{{ me.login }}</strong></a>.
            </p>
            <p v-else>You are not logged in yet.</p>
            <div class="row center">
                <div class="field left">
                    <label for="pat">Personal Access Token</label>
                    <input type="password" v-model="pat" placeholder="Enter your GitHub PAT" id="pat"
                        @input="canUpdate = true" />
                </div>
                <button class="primary" :disabled="!canUpdate" @click="updateGithub">
                    Save
                </button>
            </div>
        </div>
        <button class="danger" :disabled="!me && !pat" @click="resetGithub">
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
