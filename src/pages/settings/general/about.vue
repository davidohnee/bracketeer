<script setup lang="ts">
import ReleaseNotes from "@/components/ReleaseNotes.vue";
import { GITHUB_LINK } from "@/helpers/common";

const isDev = import.meta.env.MODE === "development";
const isBeta = import.meta.env.MODE === "preview";

const buildDate = new Date(BUILD_DATE);
const buildId =
    [
        buildDate.getUTCFullYear(),
        String(buildDate.getUTCMonth() + 1).padStart(2, "0"),
        String(buildDate.getUTCDate()).padStart(2, "0"),
    ].join("") +
    `-${String(buildDate.getUTCHours()).padStart(2, "0")}${String(buildDate.getUTCMinutes()).padStart(2, "0")}`;
</script>
<template>
    <div class="about">
        <div
            class="status yellow items-center"
            v-if="isDev"
        >
            <ion-icon name="code-outline"></ion-icon>
            Dev
        </div>
        <div
            class="status green items-center"
            v-else-if="isBeta"
        >
            <ion-icon name="bug-outline"></ion-icon>
            Preview ({{ buildId }}). <a :href="GITHUB_LINK + '/issues/new'">Report a bug</a>
        </div>
        <ReleaseNotes />
    </div>
</template>
<style scoped>
.about {
    display: flex;
    flex-direction: column;
    gap: 1em;
}
</style>
