<script setup lang="ts">
import { formatPlacement } from "@/helpers/common";
import type { Match, MatchTeam, Tournament, Ref, MatchStatus } from "@/types/tournament";
import { computed, ref } from "vue";

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
            <h2>Edit</h2>
            <ion-icon
                @click="closeMatchEditor"
                class="close"
                name="close"
            ></ion-icon>
            <div class="form">
                <div
                    v-for="(team, index) in match.teams"
                    class="row"
                    :key="index"
                >
                    <template v-if="teamIndex(team.ref) >= 0">
                        <div class="field">
                            <label :for="`team-${index}`">Team {{ index + 1 }}</label>
                            <input
                                disabled
                                type="text"
                                :id="`team-${index}`"
                                :value="teamDisplay(team)"
                            />
                        </div>
                        <div class="field">
                            <label :for="`team-score-${index}`">Score</label>
                            <input
                                type="number"
                                :id="`team-score-${index}`"
                                v-model="scores[index]"
                                @change="onScoreChanged(index)"
                            />
                        </div>
                    </template>
                </div>

                <div v-if="match.status == 'completed'">
                    <div class="field">
                        <label for="team1">Winner</label>
                        <input
                            disabled
                            type="text"
                            id="team1"
                            v-model="winner"
                        />
                    </div>
                </div>

                <div class="field">
                    <label for="team2-score">Status</label>
                    <select
                        v-model="match.status"
                        id="status"
                        @change="onStatusChanged"
                    >
                        <option value="scheduled">Scheduled</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Finished</option>
                    </select>
                </div>
            </div>
        </div>
    </dialog>
</template>
