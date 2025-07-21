<script setup lang="ts">
import { getLastMatchOf } from "@/helpers";
import { shuffle } from "@/helpers/common";
import { generateGroupPhases } from "@/helpers/matchplan/groupPhase";
import { generateKnockoutBrackets } from "@/helpers/matchplan/knockoutPhase";
import { allMatches } from "@/helpers/phase";
import type { Group, GroupTournamentPhase, Tournament } from "@/types/tournament";
import { computed, onMounted, ref } from "vue";

const props = defineProps<{
    modelValue: Tournament;
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

const generate = () => {
    if (tournament.value.teams.length === 0) {
        generateTeams();
    }

    tournament.value.phases = generateGroupPhases(tournament.value);
    tournament.value.phases = generateKnockoutBrackets(tournament.value);
};

onMounted(generate);

const teamsToGenerate = ref(tournament.value.teams.length || 36);
const groupsToGenerate = ref(
    (tournament.value.phases[0] as GroupTournamentPhase)?.groups?.length || 1,
);

const tournamentEndsAt = computed(() => {
    const p = tournament.value.phases;
    const lastMatch = getLastMatchOf({
        phase: p[p.length - 1],
    });
    if (!lastMatch) return null;
    const endTime = new Date(lastMatch.date);
    endTime.setMinutes(endTime.getMinutes() + tournament.value.config.matchDuration);
    return endTime;
});

const totalMatchCount = computed(() => {
    return tournament.value.phases.reduce((count, phase) => {
        return count + allMatches(phase).length;
    }, 0);
});

const totalTournamentDurationFormatted = computed(() => {
    const start = tournament.value.config.startTime;
    const end = tournamentEndsAt.value;
    if (!end) return null;
    const totalDuration = Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
    const hours = Math.floor(totalDuration / 60);
    const minutes = totalDuration % 60;
    return `${hours}h ${minutes}m`;
});

const addTeamByName = (name: string) => {
    if (name.trim() === "") return;
    tournament.value.teams.push({
        id: crypto.randomUUID(),
        name,
    });
};

const generateTeams = () => {
    tournament.value.teams = [];
    for (const team of Array.from({ length: teamsToGenerate.value }, (_, i) => `Team ${i + 1}`)) {
        addTeamByName(team);
    }

    generateGroups();
};

const generateGroups = () => {
    const groupCount = groupsToGenerate.value;
    let groups: Group[] = Array.from({ length: groupCount }, (_, i) => ({
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

    (tournament.value.phases[0] as GroupTournamentPhase).groups = groups;

    // auto set knockout teams (2 per group, 16 max)
    tournament.value.phases[1].teamCount = Math.min(groupCount * 2, 16);

    // auto set round count (group size - 1, 6 max)
    tournament.value.phases[0].rounds = Math.min(teamsPerGroup - 1, 6);

    generate();
};
</script>
<template>
    <p>
        {{ tournament.teams.length }}
        teams
    </p>
    <div class="row">
        <div class="field">
            <label for="teams">Teams</label>
            <input
                type="number"
                id="teams"
                min="2"
                max="1000"
                v-model="teamsToGenerate"
                @change="generateTeams"
                @keydown.prevent.enter="generateTeams"
            />
        </div>
        <div class="field">
            <label for="groups">Groups</label>
            <input
                type="number"
                id="groups"
                min="1"
                max="1000"
                v-model="groupsToGenerate"
                @change="generateGroups"
                @keydown.prevent.enter="generateGroups"
            />
        </div>
    </div>
    <div class="row">
        <div class="field">
            <label for="break">Break Duration [min]</label>
            <input
                type="number"
                id="break"
                min="0"
                v-model="tournament.config.breakDuration"
                @change="generate"
            />
        </div>
        <div class="field">
            <label for="knockout-break">Knockout Break Duration [min]</label>
            <input
                type="number"
                id="knockout-break"
                min="0"
                v-model="tournament.config.knockoutBreakDuration"
                @change="generate"
            />
        </div>
    </div>
    <div class="field">
        <label for="courts"># of Courts</label>
        <input
            type="number"
            id="courts"
            min="1"
            v-model="tournament.config.courts"
            @change="generate"
        />
    </div>
    <div class="field">
        <label for="match-duration">Match Duration [min]</label>
        <input
            type="number"
            id="match-duration"
            min="1"
            v-model="tournament.config.matchDuration"
            @change="generate"
        />
    </div>
    <div class="row">
        <p v-if="tournamentEndsAt">
            Tournament ends approximately at
            <strong>
                {{ tournamentEndsAt.toLocaleString() }}
            </strong>
            ({{ totalTournamentDurationFormatted }})
        </p>
        <p v-if="totalMatchCount">
            Total matches: <strong>{{ totalMatchCount }}</strong>
        </p>
    </div>
</template>

<style scoped>
.row .field {
    flex: 1;
}

@media (max-width: 768px) {
    .row {
        flex-direction: column;
    }
}
</style>
