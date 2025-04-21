<script setup lang="ts">
import { type Tournament } from "@/types/tournament";
import TeamTable from "@/components/TeamTable.vue";

defineProps<{
    tournament: Tournament;
}>();
</script>

<template>
    <TeamTable :tournament="tournament" />
</template>
