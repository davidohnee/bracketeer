<script setup lang="ts">
import type { Tournament } from "@/types/tournament";
import P2PConfig from "@/components/share/P2PConfig.vue";

defineProps<{
    tournament: Tournament;
}>();
</script>

<template>
    <div class="form">
        <h3>Sharing & Sync</h3>
        <P2PConfig :tournament="tournament" />
    </div>
</template>
