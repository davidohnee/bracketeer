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
    let groupIndex = 0;
    for (let i = 0; i < shuffledTeams.length; i++) {
        groups[groupIndex].teams.push(shuffledTeams[i]);
        groupIndex = (groupIndex + 1) % groups.length;
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

const roundCount = ref(props.phase.rounds);

const teamsInStage = computed(() => props.phase.teamCount ?? tournament.value.teams.length);

const groupNumberValid = computed(() => {
    return (
        groupsToGenerate.value > 0 &&
        groupsToGenerate.value <= teamsInStage.value / 2 &&
        teamsInStage.value % groupsToGenerate.value === 0
    );
});
</script>
<template>
    <div class="node group">
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
                    :aria-invalid="!groupNumberValid"
                    :min="1"
                    :max="teamsInStage / 2"
                />
                <span
                    v-if="!groupNumberValid"
                    class="error-description text-sm"
                >
                    <ion-icon name="close-circle-outline" />
                    Invalid group number. Must be between 1 and
                    {{ teamsInStage / 2 }} and evenly divide the total number of teams.
                </span>
            </div>
        </div>
        <div class="footer text-sm">{{ allMatches(phase).length }} matches</div>
    </div>
</template>
<style scoped>
.node.group {
    --c: var(--color-brand-blue);
    width: 35ch;
}
</style>
