<script setup lang="ts">
import { ALPHABET, getCourtName } from "../helpers";
import type { MatchStatus, Match, MatchTeam, StaticTeamRef, Team } from "@/types/tournament";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { debounce } from "lodash-es";

const props = defineProps<{
    match: Match;
    teams: Team[];
    matchDuration: number;
    readonly?: boolean;
}>();

const matcheditor = ref<HTMLDialogElement | null>(null);
const openMatchEditor = () => {
    if (props.readonly) return;

    if (matcheditor.value) {
        matcheditor.value.showModal();
    }
};

const closeMatchEditor = () => {
    if (matcheditor.value) {
        matcheditor.value.close();
    }
};

const teamIndex = (team: StaticTeamRef | undefined) =>
    props.teams.findIndex((x) => x.id === team?.id);

const teamDisplay = (team: MatchTeam) => {
    const i = teamIndex(team.ref);
    if (i >= 0) return props.teams[i].name;
    const asRef = team.link!;
    if (asRef.type == "league") {
        return `Place ${asRef.placement + 1}`;
    }
    const label = { winner: "Winner", loser: "Loser" };
    return `${label[asRef.type]} ${ALPHABET[asRef.placement]}`;
};
const team1display = computed(() => teamDisplay(props.match.teams[0]));
const team2display = computed(() => teamDisplay(props.match.teams[1]));

const emit = defineEmits<{
    (e: "scoreChanged", teamIndex: number, newScore: number): void;
    (e: "teamNameChanged", teamId: string, newName: string): void;
    (e: "matchStatusChanged", newStatus: MatchStatus): void;
}>();

const winner = computed(() => {
    if (status.value !== "completed") return "";
    const team1 = props.match.teams[0].score;
    const team2 = props.match.teams[1].score;
    if (team1 > team2) return props.teams[teamIndex(props.match.teams[0].ref)].name;
    if (team2 > team1) return props.teams[teamIndex(props.match.teams[1].ref)].name;
    return "Draw";
});

const emitStatusChanged = debounce(() => {
    emit("matchStatusChanged", status.value);
}, 1000);

const _onScoreChanged = (teamIndex: number, newScore: number) => {
    emit("scoreChanged", teamIndex, newScore);
};

const scores = ref(props.match.teams.map((team) => team.score));
const status = ref<MatchStatus>(props.match.status);

const onScoreChanged = [
    debounce((newScore: number) => {
        _onScoreChanged(0, newScore);
    }, 1000),
    debounce((newScore: number) => {
        _onScoreChanged(1, newScore);
    }, 1000),
];

// mm:ss of Date() - match.start
const currentTime = ref("00:00");

let currentTimeTimer = 0;

const updateCurrentTime = () => {
    const now = new Date();
    const start = props.match.date;
    if (!start) return "00:00";

    if (start.getTime() > now.getTime()) return "00:00";

    const diff = now.getTime() - start.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    if (minutes > props.matchDuration) {
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
    if (props.match.status === "in-progress") {
        currentTime.value = updateCurrentTime();
        currentTimeTimer = setInterval(() => {
            currentTime.value = updateCurrentTime();
        }, 1000);
    }
});

watch(
    () => props.match.status,
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
                                :value="teams[teamIndex(team.ref)].name"
                            />
                        </div>
                        <div class="field">
                            <label :for="`team-score-${index}`">Score</label>
                            <input
                                type="number"
                                :id="`team-score-${index}`"
                                v-model="scores[index]"
                                @change="onScoreChanged[index](scores[index])"
                            />
                        </div>
                    </template>
                </div>

                <div v-if="status == 'completed'">
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
                        v-model="status"
                        id="status"
                        @change="emitStatusChanged"
                    >
                        <option value="scheduled">Scheduled</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Finished</option>
                    </select>
                </div>
            </div>
        </div>
    </dialog>
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

        <div class="team">{{ team1display }}</div>

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

        <div class="team">{{ team2display }}</div>

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
</style>
