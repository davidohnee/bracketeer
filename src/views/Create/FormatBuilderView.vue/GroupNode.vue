<script setup lang="ts">
import { shuffle } from "@/helpers/common";
import { generateGroupPhase, generateGroupPhases } from "@/helpers/matchplan/groupPhase";
import { generateKnockoutBrackets } from "@/helpers/matchplan/knockoutPhase";
import { allMatches } from "@/helpers/phase";
import type { Group, GroupTournamentPhase, Tournament } from "@/types/tournament";
import { computed, ref, watch } from "vue";

const props = defineProps<{
    modelValue: Tournament;
    phase: GroupTournamentPhase;
}>();
const emit = defineEmits<{
    (e: "update:modelValue", value: Tournament): void;
}>();

const tournament = computed({
    get() {
        return props.modelValue;
    },
    set(value) {
        emit("update:modelValue", value);
    },
});

const regeneratePhase = () => {
    const phase = tournament.value.phases.find(
        (x) => x.id == props.phase.id,
    ) as GroupTournamentPhase;
    phase.matches = generateGroupPhase(phase, tournament.value);

    tournament.value.phases = generateKnockoutBrackets(tournament.value);
    tournament.value.phases = generateGroupPhases(tournament.value);
};

const generateGroups = () => {
    const groupCount = groupsToGenerate.value;
    const phase = tournament.value.phases.find(
        (p) => p.id === props.phase.id,
    ) as GroupTournamentPhase;

    if (groupCount == 1) {
        phase.groups = undefined;
        regeneratePhase();
        return;
    }

    const groups: Group[] = Array.from({ length: groupCount }, (_, i) => ({
        id: crypto.randomUUID(),
        name: `Group ${String.fromCharCode(65 + i)}`,
        teams: [],
    }));
    const shuffledTeams = shuffle(tournament.value.teams);
    const teamsPerGroup = Math.ceil(tournament.value.teams.length / groupCount);
    for (let i = 0; i < tournament.value.teams.length; i++) {
        const groupIndex = Math.floor(i / teamsPerGroup);
        if (groupIndex < groups.length) {
            groups[groupIndex].teams.push(shuffledTeams[i]);
        }
    }
    phase.groups = groups;
    regeneratePhase();
};

const groupsToGenerate = ref(props.phase.groups?.length || 4);

const updateRoundCount = () => {
    const phase = tournament.value.phases.find(
        (p) => p.id === props.phase.id,
    ) as GroupTournamentPhase;
    phase.rounds = roundCount.value;
    regeneratePhase();
};

watch([() => props.phase.teamCount, () => props.modelValue.teams.length], () => {
    const phase = tournament.value.phases.find(
        (p) => p.id === props.phase.id,
    ) as GroupTournamentPhase;
    phase.rounds = roundCount.value;
    generateGroups();
});

const roundCount = ref(props.phase.rounds); // Default team count, can be adjusted as needed
</script>
<template>
    <div class="node start">
        <div class="header">Group Stage</div>
        <div class="body">
            <div class="field small">
                <label for="round-count">Rounds</label>
                <input
                    type="number"
                    id="round-count"
                    v-model="roundCount"
                    @change="updateRoundCount"
                    @keydown.prevent.enter="updateRoundCount"
                />
            </div>
            <div class="field small">
                <label for="group-count"># of Groups</label>
                <input
                    type="number"
                    id="group-count"
                    v-model="groupsToGenerate"
                    @change="generateGroups"
                    @keydown.prevent.enter="generateGroups"
                />
            </div>
        </div>
        <div class="footer text-sm">{{ allMatches(phase).length }} matches</div>
    </div>
</template>
<style scoped>
.node.start {
    --c: var(--color-brand-blue);
}
</style>
