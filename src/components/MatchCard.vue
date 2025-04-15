<script setup lang="ts">
import { ALPHABET } from "../helpers";
import { type Match, type MatchTeam, type StaticTeamRef, type Team } from "../types/tournament";

import { computed, ref } from "vue";

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

const emit = defineEmits(["scoreChanged"]);

const winner = computed(() => {
    if (props.match.status !== "completed") return "";
    const team1 = props.match.teams[0].score;
    const team2 = props.match.teams[1].score;
    if (team1 > team2) return props.teams[teamIndex(props.match.teams[0].ref)].name;
    if (team2 > team1) return props.teams[teamIndex(props.match.teams[1].ref)].name;
    return "Draw";
});

const scoreChanged = () => {
    props.match.status = "completed";
    emit("scoreChanged");
};
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
                <template v-for="(team, index) in match.teams">
                    <div
                        class="row"
                        v-if="teamIndex(team.ref) >= 0"
                    >
                        <div class="field">
                            <label for="team1">Team {{ index + 1 }}</label>
                            <input
                                disabled
                                type="text"
                                id="team1"
                                v-model="teams[teamIndex(team.ref)].name"
                            />
                        </div>
                        <div class="field">
                            <label for="team1-score">Score</label>
                            <input
                                @change="scoreChanged"
                                type="number"
                                id="team1-score"
                                v-model="match.teams[index].score"
                            />
                        </div>
                    </div>
                </template>

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
        class="match"
        @click="openMatchEditor"
    >
        <div class="team">{{ team1display }}</div>

        <div class="details">
            <div
                class="score"
                v-if="match.status !== 'scheduled'"
            >
                <div class="for">{{ match.teams[0].score }}</div>
                <span>-</span>
                <div class="against">{{ match.teams[1].score }}</div>
            </div>
            <div
                v-else
                class="time"
            >
                {{ match.date?.toLocaleTimeString?.([], { hour: "2-digit", minute: "2-digit" }) }}
            </div>
            <div class="venue">
                <div class="court">{{ match.court }}</div>
            </div>
        </div>

        <div class="team">{{ team2display }}</div>
    </div>
</template>

<style>
.match {
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

.form {
    display: grid;
    gap: 1em;
    border-radius: 1em;

    .row {
        display: flex;
        gap: 1em;
        justify-content: space-between;
        flex-direction: row;
    }

    .field {
        display: flex;
        flex-direction: column;

        & label {
            font-size: 0.75rem;
            color: var(--color-foreground-secondary);
        }
    }
}
</style>
