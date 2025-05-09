<script setup lang="ts">
import TournamentList from "@/components/TournamentList.vue";
</script>
<template>
    <div>
        <h1>Tournaments</h1>
        <TournamentList />
    </div>
</template>

<style scoped>
@media (max-width: 768px) {
    h1 {
        place-self: center;
    }
}
</style>
