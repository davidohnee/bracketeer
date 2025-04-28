<script setup lang="ts">
import { computed, ref } from "vue";

const isDev = ref(import.meta.env.MODE === "development");
const version = computed(() => APP_VERSION + (isDev.value ? " (dev)" : ""));
</script>
<template>
    <div>v{{ version }}</div>
</template>
