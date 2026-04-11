<script lang="ts" setup>
import { onMounted, ref } from "vue";
import MarkdownRender from "./MarkdownRender.vue";

const repository = "davidohnee/bracketeer";

const releaseNotes = ref("");

const loadReleaseNotes = async () => {
    const url = `https://api.github.com/repos/${repository}/releases/tags/v${APP_VERSION}`;
    const res = await fetch(url);
    const release = await res.json();

    const regex = /#(\d+)/gm;
    releaseNotes.value = release.body.replaceAll(
        regex,
        `[#$1](https://github.com/${repository}/issues/$1)`,
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
