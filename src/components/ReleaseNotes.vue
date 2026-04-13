<script lang="ts" setup>
import { onMounted, ref } from "vue";
import MarkdownRender from "./MarkdownRender.vue";
import { GITHUB_LINK, REPOSITORY_ID } from "@/helpers/common";

const FALLBACK = `## bracketeer v${APP_VERSION}\n\nRelease notes are currently unavailable. Please refer to https://github.com/${REPOSITORY_ID}/releases/tag/v${APP_VERSION} instead`;

const releaseNotes = ref("");

const loadReleaseNotes = async () => {
    const url = `https://api.github.com/repos/${REPOSITORY_ID}/releases/tags/v${APP_VERSION}`;
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
    releaseNotes.value = release.body.replaceAll(regex, `[#$1](${GITHUB_LINK}/issues/$1)`);
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
