<script setup lang="ts">
import { ALPHABET, getCourtName } from "../helpers";
import type { MatchStatus, Match, MatchTeam, StaticTeamRef, Team } from "@/types/tournament";
import { computed, ref } from "vue";
import { debounce } from "lodash-es";

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

const props = defineProps<{ match: Match; teams: Team[] }>();

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
const currentTime = computed(() => {
    if (props.match.status !== "in-progress") return "00:00";
    const now = new Date();
    const start = props.match.date;
    if (!start) return "00:00";

    if (start.getTime() > now.getTime()) return "00:00";

    const diff = now.getTime() - start.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
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
        class="match card"
        @click="openMatchEditor"
    >
        <div class="team">{{ team1display }}</div>

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
                <div class="court">{{ getCourtName(match.court) }}</div>
            </div>
        </div>

        <div class="team">{{ team2display }}</div>
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
    cursor: pointer;
    transition: border-color 0.2s ease-in-out;

    &:hover {
        border-color: var(--color-primary);
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
    }
}

dialog[open] {
    border-radius: 1em;
    border: 1px solid var(--color-border);

    &::backdrop {
        background-color: rgba(0, 0, 0, 0.5);
    }

    > .content {
        position: relative;

        :first-child {
            margin-top: 0;
        }
    }

    .close {
        position: absolute;
        top: 0.5em;
        right: 0.5em;
        cursor: pointer;
    }
}
</style>
