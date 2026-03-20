<!--Skeleton Text Loader-->
<script setup lang="ts">
defineProps<{
    loading: boolean;
    characters?: number;
}>();
</script>
<template>
    <div
        v-if="loading"
        class="skeleton-text-loader"
        :style="{
            width: characters ? `${characters}ch` : '100%',
        }"
    ></div>
    <slot v-else></slot>
</template>

<style scoped>
.skeleton-text-loader {
    display: inline-block;
    height: 1em;
    border-radius: 0.25em;
    background: linear-gradient(
        90deg,
        var(--color-surface) 0%,
        var(--color-surface-hover) 50%,
        var(--color-surface) 100%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    vertical-align: middle;
}

@keyframes shimmer {
    0% {
        background-position: 200% 0;
    }
    100% {
        background-position: -200% 0;
    }
}
</style>
