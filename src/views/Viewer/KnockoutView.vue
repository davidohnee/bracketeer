<script setup lang="ts">
import { computed } from "vue";
import type { Tournament } from "@/types/tournament";
import TournamentKnockout from "@/components/TournamentKnockout.vue";

const props = defineProps<{
    tournament: Tournament;
}>();

const tournament = computed(() => props.tournament);
</script>

<template>
    <TournamentKnockout
        :tournament="tournament"
        readonly
    />
</template>
