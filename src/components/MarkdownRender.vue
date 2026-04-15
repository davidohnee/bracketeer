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
    <div
        class="md"
        v-html="html"
    />
</template>
<style>
div.md {
    & h1,
    & h2,
    & h3,
    & h4,
    & h5 {
        margin-top: 1.5em;
        margin-bottom: 0;
    }

    & p {
        margin-top: 0.5em;
        margin-bottom: 0;
    }

    & ul,
    & ol {
        margin-top: 0.25em;
    }
}
</style>
