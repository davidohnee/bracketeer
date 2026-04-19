<script lang="ts" setup>
import { computed, onMounted, ref } from "vue";
import MarkdownRender from "./MarkdownRender.vue";
import { GITHUB_LINK, REPOSITORY_ID } from "@/helpers/common";
import SkeletonTextLoader from "./SkeletonTextLoader.vue";

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

const title = `bracketeer v${APP_VERSION}`;
const loading = computed(() => !releaseNotes.value.length);

onMounted(() => {
    if (!releaseNotes.value) {
        loadReleaseNotes();
    }
});
</script>
<template>
    <div>
        <h2 v-if="loading">{{ title }}</h2>
        <SkeletonTextLoader
            :loading="loading"
            :lines="10"
        >
            <MarkdownRender :source="releaseNotes" />
        </SkeletonTextLoader>
    </div>
</template>
