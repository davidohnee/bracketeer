<script setup lang="ts">
import type { Tournament } from "@/types/tournament";
import TournamentLive from "@/components/TournamentLive.vue";
import { ref } from "vue";

const props = defineProps<{
    tournament: Tournament;
}>();
const tournament = ref(props.tournament);
</script>

<template>
    <TournamentLive :tournament="tournament" />
</template>
