<script setup lang="ts">
import { computed } from "vue";
import type { Tournament } from "@/types/tournament";
import { findRemoteWithMode } from "@/helpers/share";
import FoldableShareOption from "./FoldableShareOption.vue";
import GistConfig from "@/components/share/GistConfig.vue";
import { useTournamentsStore } from "@/stores/tournaments.ts";

const props = defineProps<{
    tournament: Tournament;
}>();

const tournaments = useTournamentsStore();
const tournament = tournaments.getTournamentById(props.tournament.id)!;

const gistRemote = computed(() => {
    return findRemoteWithMode(tournament, "gist");
});
</script>
<template>
    <FoldableShareOption
        title="Share via GitHub Gist"
        :enabled="!!gistRemote"
    >
        <GistConfig :tournament="tournament" />
    </FoldableShareOption>
</template>
