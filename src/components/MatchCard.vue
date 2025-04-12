<script setup lang="ts">
import { type Match } from '../types/tournament';

import { ref } from 'vue';

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

defineProps<{ match: Match }>();
</script>

<template>
    <dialog ref="matcheditor">
        <div class="content">
            <h2>Edit</h2>
            <ion-icon @click="closeMatchEditor" class="close" name="close"></ion-icon>
            <div class=form>
                <div class=row>
                    <div class="field">
                        <label for="team1">Team 1</label>
                        <input type="text" id="team1" v-model="match.team1.name" />
                    </div>
                    <div class="field">
                        <label for="team1-score">Score</label>
                        <input type="number" id="team1-score" v-model="match.score1" />
                    </div>
                </div>

                <div class=row>
                    <div class="field">
                        <label for="team2">Team 2</label>
                        <input type="text" id="team2" v-model="match.team2.name" />
                    </div>
                    <div class="field">
                        <label for="team2-score">Score</label>
                        <input type="number" id="team2-score" v-model="match.score2" />
                    </div>
                </div>

                <div class="field">
                    <label for="team2-score">Status</label>
                    <select v-model="match.status" id="status">
                        <option value="scheduled">Scheduled</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Finished</option>
                    </select>
                </div>
            </div>
        </div>
    </dialog>
    <div class="match" @click="openMatchEditor">

        <div class="team">{{ match.team1.name }}</div>

        <div class=details>
            <div class="score" v-if="match.status !== 'scheduled'">
                <div class="for">{{ match.score1 }}</div>
                <span>-</span>
                <div class="against">{{ match.score2 }}</div>
            </div>
            <div v-else class="time">{{ match.date?.toLocaleTimeString?.([], { hour: '2-digit', minute: '2-digit' }) }}
            </div>
            <div class="venue">
                <div class="court">{{ match.court }}</div>
            </div>
        </div>

        <div class="team">{{ match.team2.name }}</div>
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

    >.content {
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
