<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();
</script>

<template>
    <div class="home">
        <h1>bracketeer</h1>
        <p>Click the button below to create a new tournament.</p>
        <div class="row">
            <button
                class="secondary"
                @click="router.push('/tournaments')"
            >
                Browse Tournaments
            </button>
            <button @click="router.push('/create')">Create Tournament</button>
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
    .home {
        padding: 1em;
    }
}
</style>
