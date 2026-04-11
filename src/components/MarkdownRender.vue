<script lang="ts" setup>
import MarkdownIt from "markdown-it";

defineProps({
    source: {
        type: String,
        required: true,
    },
});

const md = new MarkdownIt({
    linkify: true,
    typographer: true,
});
</script>
<template>
    <div v-html="md.render(source)" />
</template>
