<script setup lang="ts">
import type { Tournament } from "@/types/tournament";
import TournamentMatches from "@/components/TournamentMatches.vue";
import { ref } from "vue";

const props = defineProps<{
    tournament: Tournament;
}>();
const tournament = ref(props.tournament);
</script>

<template>
    <TournamentMatches
        v-model="tournament"
        readonly
    />
</template>
