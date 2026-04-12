<script lang="ts" setup>
import { onMounted, ref } from "vue";
import MarkdownRender from "./MarkdownRender.vue";

const REPOSITORY = "davidohnee/bracketeer";
const FALLBACK = `## bracketeer v${APP_VERSION}\n\nRelease notes are currently unavailable. Please refer to https://github.com/${REPOSITORY}/releases/tag/v${APP_VERSION} instead`;

const releaseNotes = ref("");

const loadReleaseNotes = async () => {
    const url = `https://api.github.com/repos/${REPOSITORY}/releases/tags/v${APP_VERSION}`;
    const res = await fetch(url);

    if (!res.ok) {
        releaseNotes.value = FALLBACK;
        return;
    }

    const release = await res.json();

    if (!release.body) {
        releaseNotes.value = FALLBACK;
        return;
    }

    const regex = /#(\d+)/gm;
    releaseNotes.value = release.body.replaceAll(
        regex,
        `[#$1](https://github.com/${REPOSITORY}/issues/$1)`,
    );
};

onMounted(() => {
    if (!releaseNotes.value) {
        loadReleaseNotes();
    }
});
</script>
<template>
    <MarkdownRender :source="releaseNotes" />
</template>
