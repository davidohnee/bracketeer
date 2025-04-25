<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();
</script>

<template>
    <div class="home">
        <h1>Page not found</h1>
        <p>
            The page you are looking for does not exist. You can return to the home page or create a
            new tournament.
        </p>
        <div class="row">
            <router-link :to="{ name: 'home' }">
                <button @click="router.push('/create')">Return home</button>
            </router-link>
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
