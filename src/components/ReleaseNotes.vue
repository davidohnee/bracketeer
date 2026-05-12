<script lang="ts" setup>
import MarkdownRender from "./MarkdownRender.vue";
import { type Version } from "@/helpers/releaseNotes";

defineProps<{
    version: Version;
}>();
</script>
<template>
    <div class="version card">
        <div class="header">
            <h2>{{ version.version }}</h2>
            <span class="text-muted">{{ version.date.toLocaleDateString() }}</span>
        </div>
        <div class="release-notes">
            <MarkdownRender :source="version.changes" />
        </div>
    </div>
</template>

<style scoped>
.release-notes {
    overflow-x: auto;
}

.header {
    padding-left: 2em;
    position: relative;

    &:before {
        content: " ";
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        width: 1ch;
        background-color: var(--color-primary);
    }

    & h2 {
        margin-top: 0.25em;
    }
}
</style>
