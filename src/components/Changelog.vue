<script lang="ts" setup>
import { VERSIONS } from "@/helpers/releaseNotes";
import ReleaseNotes from "./ReleaseNotes.vue";
</script>
<template>
    <div class="release-notes">
        <ReleaseNotes
            v-for="version in VERSIONS"
            :key="version.version"
            :version="version"
        />
    </div>
</template>
<style scoped>
.release-notes {
    display: flex;
    flex-direction: column;
    gap: 2em;
}
</style>
