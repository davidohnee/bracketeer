<script setup lang="ts">
import type { MatchStatus, Match, Team } from "@/types/tournament";
import { onMounted, ref } from "vue";
import MatchCard from "./MatchCard.vue";
import MatchRow from "./MatchRow.vue";

defineProps<{
    match: Match;
    teams: Team[];
    matchDuration: number;
    readonly?: boolean;
}>();

const emit = defineEmits<{
    (e: "scoreChanged", teamIndex: number, newScore: number): void;
    (e: "teamNameChanged", teamId: string, newName: string): void;
    (e: "matchStatusChanged", newStatus: MatchStatus): void;
}>();

const emitStatusChanged = (status: MatchStatus) => {
    emit("matchStatusChanged", status);
};

const _onScoreChanged = (teamIndex: number, newScore: number) => {
    emit("scoreChanged", teamIndex, newScore);
};

const component = ref<typeof MatchRow | typeof MatchCard | null>(null);

onMounted(() => {
    if (window.innerWidth < 540) {
        component.value = MatchCard;
    } else {
        component.value = MatchRow;
    }
});
</script>

<template>
    <component
        :is="component"
        :match="match"
        :teams="teams"
        :matchDuration="matchDuration"
        :readonly="readonly"
        @scoreChanged="_onScoreChanged"
        @teamNameChanged="emit('teamNameChanged', $event.teamId, $event.newName)"
        @matchStatusChanged="emitStatusChanged"
    />
</template>
