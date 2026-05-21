<script lang="ts" setup>
import { computed } from "vue";
import MarkdownRender from "./MarkdownRender.vue";
import { type Version } from "@/helpers/releaseNotes";
import { GITHUB_LINK } from "@/helpers/common";

const props = defineProps<{
    version: Version;
}>();

const ISSUE_REGEX = /#(\d+)/gm;
const markdown = computed(() =>
    props.version.changes.replaceAll(ISSUE_REGEX, `[#$1](${GITHUB_LINK}/issues/$1)`),
);
</script>
<template>
    <div class="version card">
        <div class="header">
            <h2>{{ version.version }}</h2>
            <span class="text-muted">{{ version.date.toLocaleDateString() }}</span>
        </div>
        <div class="release-notes">
            <MarkdownRender :source="markdown" />
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
