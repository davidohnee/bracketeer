<script lang="ts" setup>
import MarkdownIt from "markdown-it";
import DOMPurify from "dompurify";
import { computed } from "vue";

const props = defineProps({
    source: {
        type: String,
        required: true,
    },
});

const md = new MarkdownIt({
    linkify: true,
    typographer: true,
    html: false,
});

const html = computed(() => {
    const unsafe = md.render(props.source);
    return DOMPurify.sanitize(unsafe);
});
</script>
<template>
    <div v-html="html" />
</template>
