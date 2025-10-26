<script setup lang="ts">
import { formatPlacement } from "@/helpers/common";
import type { Match, MatchTeam, Tournament, Ref, MatchStatus, SetScore } from "@/types/tournament";
import { computed, ref } from "vue";
import SegmentPicker from "../SegmentPicker.vue";
import { calculateScoresFromSets } from "@/helpers/scoring";

const props = defineProps<{
    modelValue: Match;
    tournament: Tournament;
}>();
const match = ref(props.modelValue);
const emit = defineEmits<{
    (e: "update:modelValue", match: Match): void;
    (e: "statusChanged", newStatus: MatchStatus): void;
}>();

const onChanged = () => {
    emit("update:modelValue", match.value);
};
const onStatusChanged = () => {
    emit("statusChanged", match.value.status);
    onChanged();
};
const scores = ref(match.value.teams.map((team) => team.score) ?? []);
const onScoreChanged = (teamIndex: number) => {
    match.value.teams[teamIndex]!.score = scores.value[teamIndex]!;
    if (useSets.value && sets.value.length > 0) {
        scoreInSyncWithSets.value = false;
    }
    onChanged();
};

const useSets = computed(() => props.tournament.config.useSets ?? false);
const sets = ref<SetScore[]>(match.value.sets ?? []);

const addSet = () => {
    sets.value.push({ team1: 0, team2: 0 });
    onSetsChanged();
};

const removeSet = (index: number) => {
    sets.value.splice(index, 1);
    onSetsChanged();
};

const scoreFromSets = computed(() => {
    return calculateScoresFromSets(sets.value);
});

const scoreInSyncWithSets = ref(
    sets.value.length > 0
        ? scores.value.every((score, index) => score === scoreFromSets.value[index])
        : false,
);

const onSetsChanged = () => {
    match.value.sets = sets.value;
    if (sets.value.length > 0 && scoreInSyncWithSets.value) {
        // Auto-calculate scores from sets
        const [team1Score, team2Score] = scoreFromSets.value;
        scores.value = [team1Score, team2Score];

        match.value.teams[0]!.score = team1Score;
        match.value.teams[1]!.score = team2Score;
    }
    onChanged();
};

const syncScoresWithSets = () => {
    scoreInSyncWithSets.value = true;
    onSetsChanged();
};

const scoresOutOfSync = computed(() => {
    if (!useSets.value || sets.value.length === 0) return false;
    const [team1Score, team2Score] = scoreFromSets.value;
    return scores.value[0] !== team1Score || scores.value[1] !== team2Score;
});

const matcheditor = ref<HTMLDialogElement | null>(null);
const openMatchEditor = () => {
    if (matcheditor.value) {
        matcheditor.value.showModal();
    }
};
const closeMatchEditor = () => {
    if (matcheditor.value) {
        matcheditor.value.close();
    }
};

const teamIndex = (team: Ref | undefined) =>
    props.tournament.teams.findIndex((x) => x.id === team?.id);

const teamDisplay = (team: MatchTeam) => {
    const i = teamIndex(team.ref);
    if (i >= 0) return props.tournament.teams[i]!.name;
    return formatPlacement(team.link!);
};

const winner = computed(() => {
    if (match.value.status !== "completed") return "";
    const team1 = scores.value[0]!;
    const team2 = scores.value[1]!;
    if (team1 > team2) return teamDisplay(match.value.teams[0]);
    if (team2 > team1) return teamDisplay(match.value.teams[1]);
    return "Draw";
});

defineExpose({
    open: openMatchEditor,
    close: closeMatchEditor,
});
</script>
<template>
    <dialog ref="matcheditor">
        <div class="content">
            <h2>Result</h2>
            <ion-icon
                @click="closeMatchEditor"
                class="close"
                name="close"
            ></ion-icon>
            <div class="form">
                <div class="row">
                    <div
                        class="teamScore"
                        :class="{ winner: winner === teamDisplay(team) }"
                        v-for="(team, index) in match.teams"
                        :key="index"
                    >
                        <input
                            type="number"
                            class="score"
                            :id="match.id + '-team' + (index + 1) + '-score'"
                            v-model="scores[index]"
                            @change="onScoreChanged(index)"
                        />
                        <label
                            :for="match.id + '-team' + (index + 1) + '-score'"
                            class="text-muted"
                        >
                            {{ teamDisplay(team) }}
                        </label>
                    </div>
                </div>

                <div
                    v-if="useSets"
                    class="sets-section card"
                >
                    <div class="set-and-sync">
                        <h3>Sets</h3>
                        <button
                            v-if="scoresOutOfSync"
                            class="ghost text-sm"
                            @click="syncScoresWithSets"
                        >
                            Sync Scores
                        </button>
                    </div>
                    <div class="sets-list">
                        <div
                            v-for="(set, index) in sets"
                            :key="index"
                            class="set-row"
                        >
                            <span class="set-label">Set {{ index + 1 }}</span>
                            <div class="set-scores">
                                <input
                                    type="number"
                                    min="0"
                                    v-model.number="set.team1"
                                    @input="onSetsChanged"
                                    class="set-score-input"
                                />
                                <span class="separator">:</span>
                                <input
                                    type="number"
                                    min="0"
                                    v-model.number="set.team2"
                                    @input="onSetsChanged"
                                    class="set-score-input"
                                />
                            </div>
                            <button
                                class="ghost"
                                @click="removeSet(index)"
                                title="Remove set"
                            >
                                <ion-icon name="trash-outline"></ion-icon>
                            </button>
                        </div>
                    </div>
                    <div class="add-set">
                        <button
                            class="ghost"
                            @click="addSet"
                        >
                            <ion-icon name="add-outline"></ion-icon>
                            Add Set
                        </button>
                    </div>
                </div>

                <div class="match-status">
                    <SegmentPicker
                        v-model="match.status"
                        :options="[
                            { value: 'scheduled', label: 'Scheduled' },
                            { value: 'in-progress', label: 'In Progress' },
                            { value: 'completed', label: 'Finished' },
                        ]"
                        @change="onStatusChanged"
                    />
                </div>
            </div>
        </div>
    </dialog>
</template>

<style scoped>
.row:has(.teamScore) {
    gap: 2em;
    justify-content: center;
}

.form {
    min-width: 40vw;
}

@media (max-width: 768px) {
    .form {
        min-width: 80vw;
    }
}

.teamScore {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;

    & input {
        margin-bottom: 0.25em;
        font-size: var(--typography-heading-fontSize-xl);
        width: 3ch;
        text-align: center;
        padding: 0.25em;
    }

    & label {
        font-size: var(--typography-body-fontSize-sm);
    }

    &:first-child:after {
        content: ":";
        font-size: var(--typography-heading-fontSize-m);
        position: absolute;
        display: block;
        right: -1em;
        translate: -50% 0;
        top: 30%;
    }

    &.winner input {
        outline: 2px solid var(--color-primary);
    }
}

.warning {
    display: flex;
    align-items: center;
    gap: 0.5em;
    padding: 0.75em;
    margin-top: 1em;
    background-color: var(--color-warning-bg, #fff3cd);
    border: 1px solid var(--color-warning-border, #ffc107);
    border-radius: 0.25em;
    color: var(--color-warning-text, #856404);
    font-size: 0.9em;

    ion-icon {
        font-size: 1.2em;
    }
}

.btn-link {
    background: none;
    border: none;
    color: var(--color-primary);
    text-decoration: underline;
    cursor: pointer;
    padding: 0;
    margin-left: auto;
}

.sets-section {
    margin-top: 2em;
    padding-top: 1em;

    h3 {
        margin-bottom: 1em;
        font-size: var(--typography-heading-fontSize-m);
    }

    .set-and-sync {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
    }

    .add-set {
        display: flex;
        justify-content: center;
    }
}

.sets-list {
    display: flex;
    flex-direction: column;
    gap: 0.75em;
    margin-bottom: 1em;
}

.set-row {
    display: grid;
    grid-template-columns: 4rem 1fr auto;
    align-items: center;
    gap: 1em;

    .set-label {
        font-size: 0.9em;
        color: var(--color-text-secondary);
    }

    .set-scores {
        display: flex;
        align-items: center;
        gap: 0.5em;
        justify-content: center;

        .set-score-input {
            width: 5ch;
            text-align: center;
            padding: 0.25em;
            font-size: 1.1em;
            margin-bottom: 0;
        }

        .separator {
            font-size: 1.1em;
            color: var(--color-text-secondary);
        }
    }
}

.btn-icon {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25em;
    color: var(--color-text-secondary);
    display: flex;
    align-items: center;

    &:hover {
        color: var(--color-danger, #dc3545);
    }

    ion-icon {
        font-size: 1.2em;
    }
}

.btn-secondary {
    display: flex;
    align-items: center;
    gap: 0.5em;
    padding: 0.5em 1em;
    background-color: var(--color-background-secondary);
    border: 1px solid var(--color-border);
    border-radius: 0.25em;
    cursor: pointer;
    font-size: 0.9em;

    &:hover {
        background-color: var(--color-background-tertiary);
    }

    ion-icon {
        font-size: 1.1em;
    }
}

.match-status {
    width: max-content;
    margin-left: auto;
    margin-right: auto;
    margin-top: 2em;
}
</style>
