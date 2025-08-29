<script setup lang="ts">
import { formatPlacement } from "@/helpers/common";
import type { Match, MatchTeam, Tournament, Ref, MatchStatus } from "@/types/tournament";
import { computed, ref } from "vue";
import SegmentPicker from "../SegmentPicker.vue";

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
    match.value.teams[teamIndex].score = scores.value[teamIndex];
    onChanged();
};

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
    if (i >= 0) return props.tournament.teams[i].name;
    return formatPlacement(team.link!);
};

const winner = computed(() => {
    if (match.value.status !== "completed") return "";
    const team1 = scores.value[0];
    const team2 = scores.value[1];
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

.match-status {
    width: max-content;
    margin-left: auto;
    margin-right: auto;
    margin-top: 2em;
}
</style>
