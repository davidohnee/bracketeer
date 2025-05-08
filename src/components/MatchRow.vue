<script setup lang="ts">
import { ALPHABET, getCourtName } from "../helpers";
import type { MatchStatus, Match, MatchTeam, Ref, Tournament } from "@/types/tournament";
import { onMounted, onUnmounted, ref, watch } from "vue";
import MatchEditorModal from "./MatchEditorModal.vue";
import { debounce } from "lodash-es";

const props = defineProps<{
    modelValue: Match;
    tournament: Tournament;
    readonly?: boolean;
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
    const asRef = team.link!;
    if (asRef.type == "league") {
        return `Place ${asRef.placement + 1}`;
    }
    const label = { winner: "Winner", loser: "Loser" };
    return `${label[asRef.type]} ${ALPHABET[asRef.placement]}`;
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
        class="match row"
        :class="{ readonly }"
        @click="openMatchEditor"
    >
        <div class="time-progress">
            <span
                v-if="match.status === 'in-progress'"
                class="time progress"
            >
                {{ currentTime }}
            </span>
            <span
                v-else-if="match.status === 'completed'"
                class="time full"
            >
                FT
            </span>
        </div>

        <div class="team">{{ teamDisplay(match.teams[0]) }}</div>

        <div class="details">
            <div
                v-if="match.status === 'scheduled'"
                class="match-time"
            >
                {{ match.date?.toLocaleTimeString?.([], { hour: "2-digit", minute: "2-digit" }) }}
            </div>
            <div
                class="score"
                v-else
            >
                <div class="for">{{ match.teams[0].score }}</div>
                <span>-</span>
                <div class="against">{{ match.teams[1].score }}</div>
            </div>
        </div>

        <div class="team">{{ teamDisplay(match.teams[1]) }}</div>

        <div class="venue">
            <div class="court">{{ getCourtName(match.court) }}</div>
        </div>
    </div>
</template>

<style scoped>
.match.row {
    overflow: clip;
    padding: 1em;
    flex: 1;
    font-size: 13px;
    display: grid;
    grid-template-columns: 10ch 1fr 15ch 1fr 10ch;
    align-items: center;
    gap: 1em;
    cursor: pointer;
    transition: border-color 0.2s ease-in-out;

    &:not(:last-child) {
        border-bottom: 1px solid var(--color-border);
    }

    &:not(.readonly):hover {
        background-color: var(--color-background-hover);
    }

    .venue {
        color: var(--color-foreground-secondary);
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
        text-align: center;
        align-items: center;
    }

    .court,
    .score,
    .time {
        text-align: center;
    }

    .score,
    .match-time {
        font-size: 19px;
        font-weight: 500;
    }

    .match-time {
        color: var(--color-foreground-secondary);
    }

    .time {
        font-size: 19px;
        font-weight: 500;
        border-radius: 100vmax;
        padding: 0.5em 1em;
        font-size: 0.9rem;
        background-color: var(--color-border);
        color: var(--color-foreground-secondary);

        &.progress {
            background-color: var(--color-primary);
            color: var(--color-primary-contrast);
        }
    }

    .team {
        &:nth-child(2) {
            text-align: right;
        }

        &:nth-child(4) {
            text-align: left;
        }
    }
}

@media (max-width: 600px) {
    .time-progress span,
    .venue .court {
        font-size: 0.7rem !important;
    }

    .venue .court {
        text-align: right !important;
    }

    .score {
        font-size: 0.9rem !important;
        gap: 0.25em !important;
    }

    .match.row {
        grid-template-columns: 7ch 1fr 10ch 1fr 7ch;
        gap: 0.25em;
        font-size: 0.9rem !important;
    }
}
</style>
