<script setup lang="ts">
import type { Tournament } from "@/types/tournament";
import TemplateView from "@/views/Create/TemplateView.vue";
import { ref } from "vue";
import { useRouter } from "vue-router";

const tournament = ref<Tournament | null>(null);
const router = useRouter();

const create = () => {
    sessionStorage.setItem("creator.step", "1");
    sessionStorage.setItem("creator.tournament", JSON.stringify(tournament.value));
    router.push({ name: "create" });
};
</script>
<template>
    <h3>Create your first tournament</h3>
    <TemplateView
        v-model="tournament"
        @continue="create"
    />
</template>
