<script setup lang="ts">
import type { Tournament } from "@/types/tournament.ts";
import FoldableShareOption from "./FoldableShareOption.vue";
import { computed } from "vue";
import { findRemoteWithMode } from "@/helpers/share";
import { useTournamentsStore } from "@/stores/tournaments.ts";
import P2PConfig from "@/components/share/P2PConfig.vue";

const props = defineProps<{
    tournament: Tournament;
}>();

const tournaments = useTournamentsStore();
const tournament = tournaments.getTournamentById(props.tournament.id)!;

const p2pRemote = computed(() => {
    return findRemoteWithMode(tournament, "p2p");
});
</script>

<template>
    <FoldableShareOption
        title="Peer-to-peer"
        :enabled="!!p2pRemote"
    >
        <P2PConfig :tournament="tournament" />
    </FoldableShareOption>
</template>
