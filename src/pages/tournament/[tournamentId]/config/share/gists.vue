<script setup lang="ts">
import type { Tournament } from "@/types/tournament";
import ShareModal from "@/components/modals/ShareFullModal.vue";
import GistConfig from "@/components/share/GistConfig.vue";

defineProps<{
    tournament: Tournament;
}>();
</script>

<template>
    <ShareModal ref="shareModal" />
    <div class="form">
        <h3>Sharing & Sync</h3>
        <GistConfig :tournament="tournament" />
    </div>
</template>
