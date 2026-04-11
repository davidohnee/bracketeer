<script setup lang="ts">
import ReleaseNotes from "@/components/ReleaseNotes.vue";
import { ref } from "vue";

const isDev = ref(import.meta.env.MODE === "development");
</script>
<template>
    <div>
        <div
            class="status green items-center"
            v-if="isDev"
        >
            <ion-icon name="bug-outline"></ion-icon>
            DEV MODE
        </div>
        <ReleaseNotes />
    </div>
</template>
