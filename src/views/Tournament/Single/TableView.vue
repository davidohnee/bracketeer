<script setup lang="ts">
import { type Tournament } from "@/types/tournament";
import TeamTable from "@/components/TeamTable.vue";
import { useRoute } from "vue-router";
import { computed } from "vue";

defineProps<{
    tournament: Tournament;
}>();

const route = useRoute();

const teamMatchesRouteName = computed(
    () => (route.name as string | undefined)?.replace(".table", ".matches") ?? "",
);
</script>

<template>
    <TeamTable
        :tournament="tournament"
        :teamMatchesRouteName="teamMatchesRouteName"
    />
</template>
