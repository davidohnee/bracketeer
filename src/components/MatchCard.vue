<script setup lang="ts">
import { getCourtName } from "@/helpers";
import { formatPlacement } from "@/helpers/common";
import type { MatchStatus, Match, MatchTeam, Ref, Tournament } from "@/types/tournament";
import { onMounted, onUnmounted, ref, watch } from "vue";
import MatchEditorModal from "@/components/modals/MatchEditorModal.vue";
import { debounce } from "lodash-es";

const props = defineProps<{
    modelValue: Match;
    tournament: Tournament;
    readonly?: boolean;
    markLoser?: boolean;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", match: Match): void;
    (e: "statusChanged", newStatus: MatchStatus): void;
}>();

const match = ref(props.modelValue);

watch(
    () => props.modelValue,
    (newMatch) => {
        match.value = newMatch;
    },
    { deep: true },
);

const matcheditor = ref<typeof MatchEditorModal>();
const openMatchEditor = () => {
    if (props.readonly) return;

    if (matcheditor.value) {
        matcheditor.value.open();
    }
};

const teamIndex = (team: Ref | undefined) =>
    props.tournament.teams.findIndex((x) => x.id === team?.id);

const teamDisplay = (team: MatchTeam) => {
    const i = teamIndex(team.ref);
    if (i >= 0) return props.tournament.teams[i].name;
    return formatPlacement(team.link!);
};

const emitStatusChanged = debounce(() => {
    emit("statusChanged", match.value.status);
}, 1000);

// mm:ss of Date() - match.start
const currentTime = ref("00:00");

let currentTimeTimer = 0;

const updateCurrentTime = () => {
    const now = new Date();
    const start = match.value.date;
    if (!start) return "00:00";

    if (start.getTime() > now.getTime()) return "00:00";

    const diff = now.getTime() - start.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    if (minutes > props.tournament.config.matchDuration) {
        return "FT";
    }

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};
onUnmounted(() => {
    if (currentTimeTimer) {
        clearInterval(currentTimeTimer);
    }
});
onMounted(() => {
    if (match.value.status === "in-progress") {
        currentTime.value = updateCurrentTime();
        currentTimeTimer = setInterval(() => {
            currentTime.value = updateCurrentTime();
        }, 1000);
    }
});

watch(
    () => match.value.status,
    (newStatus) => {
        clearInterval(currentTimeTimer);
        if (newStatus === "in-progress") {
            currentTime.value = updateCurrentTime();
            currentTimeTimer = setInterval(() => {
                currentTime.value = updateCurrentTime();
            }, 1000);
        }
    },
);

const teamLost = (team: MatchTeam) => {
    const winnerScore = Math.max(...match.value.teams.map((x) => x.score));
    if (team.score < winnerScore) return true;
    return false;
};
</script>

<template>
    <MatchEditorModal
        ref="matcheditor"
        v-model="match"
        :tournament="props.tournament"
        @update:modelValue="emit('update:modelValue', $event)"
        @statusChanged="emitStatusChanged"
    />
    <div
        class="match card"
        :class="{ readonly }"
        @click="openMatchEditor"
    >
        <div
            class="team"
            :class="{
                lost: teamLost(match.teams[0]) && markLoser,
            }"
        >
            {{ teamDisplay(match.teams[0]) }}
        </div>

        <div class="details">
            <div
                class="score"
                v-if="match.status === 'completed'"
            >
                <div class="for">{{ match.teams[0].score }}</div>
                <span>-</span>
                <div class="against">{{ match.teams[1].score }}</div>
            </div>
            <div
                v-else-if="match.status === 'scheduled'"
                class="time"
            >
                {{ match.date?.toLocaleTimeString?.([], { hour: "2-digit", minute: "2-digit" }) }}
            </div>
            <div
                v-else
                class="time progress"
            >
                {{ currentTime }}
            </div>
            <div class="venue">
                <div class="court">{{ getCourtName(tournament.config.sport, match.court) }}</div>
            </div>
        </div>

        <div
            class="team"
            :class="{
                lost: teamLost(match.teams[1]) && markLoser,
            }"
        >
            {{ teamDisplay(match.teams[1]) }}
        </div>
    </div>
</template>

<style>
.match.card {
    border: 1px solid var(--color-border);
    border-radius: 1em;
    overflow: clip;
    padding: 2em 1em;
    flex: 1;
    font-size: 13px;
    display: grid;
    grid-template-columns: 1fr max-content 1fr;
    align-items: center;
    transition: border-color 0.2s ease-in-out;

    &:not(.readonly) {
        cursor: pointer;
    }

    &:not(.readonly):hover {
        border-color: var(--color-primary);
    }

    .venue {
        color: var(--color-text-secondary);
    }

    .score {
        display: grid;
        grid-template-columns: 3ch 1ch 3ch;
        align-items: center;
        gap: 0.5em;
    }

    .details {
        display: flex;
        flex-direction: column;
    }

    .court,
    .score,
    .time {
        text-align: center;
    }

    .score,
    .time {
        font-size: 19px;
        font-weight: 500;

        &.progress {
            color: var(--color-primary);
        }
    }

    .team {
        &:first-child {
            text-align: left;
        }

        &:last-child {
            text-align: right;
        }

        &.lost {
            color: var(--color-text-secondary);
            text-decoration: line-through;
        }
    }
}
</style>
