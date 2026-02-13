<script setup lang="ts">
import type { GroupTournamentPhase, Match, RichMatch, Tournament } from "@/types/tournament";
import { computed } from "vue";
import MatchRow from "./MatchRow.vue";

const props = defineProps<{
    modelValue: RichMatch[];
    tournament: Tournament;
    readonly?: boolean;
    showPhase?: boolean;
    showRound?: boolean;
    showGroup?: boolean;
}>();

const emit = defineEmits<(e: "update:modelValue", value: RichMatch[]) => void>();

const matches = computed({
    get() {
        return props.modelValue;
    },
    set(value) {
        emit("update:modelValue", value);
    },
});

const buildHeaderKey = (match: RichMatch) => {
    const parts: string[] = [];

    if (props.showPhase) {
        parts.push(match.phaseName);
    }
    if (props.showRound) {
        parts.push(match.roundName);
    }

    const base = parts.join(" - ");
    const groupName = props.showGroup ? getGroupName(match) : "";

    if (!groupName) {
        return base;
    }

    return base ? `${base}: ${groupName}` : groupName;
};

const getGroupName = (match: RichMatch) => {
    const phase = props.tournament.phases.find((p) => p.id === match.phaseId);
    if (phase?.type !== "group") {
        return "";
    }

    const group = (phase as GroupTournamentPhase).groups?.find((g) =>
        match.match.teams.some((x) => g.teams.some((y) => y.id === x.ref?.id)),
    );

    return group?.name ?? "";
};

const groupings = computed(() => {
    const groupedMatches: Record<string, Match[]> = {};

    for (const match of matches.value) {
        const key = buildHeaderKey(match);
        groupedMatches[key] ??= [];
        groupedMatches[key].push(match.match);
    }

    return groupedMatches;
});
</script>
<template>
    <div class="groupings">
        <div
            class="grouping"
            v-for="(group, key) in groupings"
            :key="key"
        >
            <div
                class="header"
                v-if="key"
            >
                <span class="title">{{ key }}</span>
            </div>
            <div class="matches">
                <MatchRow
                    v-for="(match, i) in group"
                    :key="match.id"
                    v-model="groupings[key]![i]!"
                    :tournament="tournament"
                    :readonly="readonly"
                />
            </div>
        </div>
    </div>
</template>

<style scoped>
.header {
    background-color: var(--color-background);
    padding: 0.5em 1em;

    .title {
        margin: 0;
        font-weight: bold;
        font-size: 0.9rem;
    }
}

.matches {
    padding-top: 0 !important;
}
</style>
