<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();
</script>

<template>
    <div class="home">
        <h1>bracketeer</h1>
        <p>Click the button below to create a new tournament.</p>
        <button @click="router.push('/create')">Create Tournament</button>
    </div>
</template>
