<script setup lang="ts">
const resetGithub = () => {
    localStorage.removeItem("github.me");
    localStorage.removeItem("github.pat");
};
</script>

<template>
    <div class="settings">
        <h1>Settings</h1>
        <h3>GitHub Gists</h3>
        <div class="row">
            <button
                class="danger"
                @click="resetGithub"
            >
                Reset
            </button>
        </div>
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
</style>
