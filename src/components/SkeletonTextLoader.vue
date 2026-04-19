<!--Skeleton Text Loader-->
<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
    loading: boolean;
    characters?: number;
    lines?: number;
}>();

const lineWidths = ["100%", "50%", "70%", "85%", "60%", "90%"];

const skeletonLines = computed(() =>
    Array.from({ length: props.lines ?? 0 }, (_, index) => lineWidths[index % lineWidths.length]),
);
</script>
<template>
    <div
        v-if="loading && lines"
        class="skeleton-text-loader skeleton-text-loader--lines"
    >
        <div
            v-for="(lineWidth, index) in skeletonLines"
            :key="index"
            class="skeleton-text-loader__line"
            :style="{
                width: lineWidth,
            }"
        ></div>
    </div>
    <div
        v-else-if="loading"
        class="skeleton-text-loader skeleton-text-loader__line"
        :style="{
            width: characters ? `${characters}ch` : '100%',
        }"
    ></div>
    <slot v-else></slot>
</template>

<style scoped>
.skeleton-text-loader.skeleton-text-loader__line {
    display: inline-block;
    vertical-align: middle;
}

.skeleton-text-loader--lines {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    width: 100%;
    height: auto;
}

.skeleton-text-loader__line {
    display: block;
    height: var(--spacing-m);
    border-radius: var(--radius-xs);
    background: linear-gradient(
        90deg,
        var(--color-surface) 0%,
        var(--color-surface-hover) 50%,
        var(--color-surface) 100%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
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
